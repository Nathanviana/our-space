// Leituras da área de admin (docs/superpowers/specs/2026-11-05-area-admin-design.md)
import "server-only";
import { BUCKET_FOTOS, db } from "@/lib/db";
import { caminhoMini } from "@/lib/dados/memorias";
import { formatarData, tituloDoPlano } from "@/lib/types";
import { hoje } from "@/lib/hoje";
import { resumoDoEspaco, type Resumo } from "@/lib/dados/resumo";
import { fotosOrfas } from "@/lib/admin/infra";
import { limparBusca } from "@/lib/admin/lote";
import { lerPaginado } from "@/lib/admin/paginar";
import { calcularMeses, percentualComMemoria, type LinhaMes, type PlanoM } from "@/lib/admin/metricas";

export interface Metricas {
  resumo: Resumo;
  temas: number;
  sorteios: number;
  meses: LinhaMes[];
  geralComMemoria: number | null;
  porPessoa: { nome: string; planos: number; memorias: number; fotos: number }[];
  porTema: { nome: string; icone: string; vamosFazer: number; jaFizemos: number }[];
}

// memorias(id) pode vir como objeto (relação 1 para 1) ou lista, conforme o PostgREST.
const temAlgum = (v: unknown) => (Array.isArray(v) ? v.length > 0 : Boolean(v));

function contar<T>(linhas: T[], chave: (l: T) => string | null): Map<string, number> {
  const m = new Map<string, number>();
  for (const l of linhas) {
    const k = chave(l);
    if (k) m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

export async function dadosMetricas(): Promise<Metricas> {
  const c = db();
  // Tabelas que crescem são lidas por inteiro, paginando (o PostgREST corta em 1000 linhas).
  const tudo = <T,>(tabela: string, colunas: string) =>
    lerPaginado<T>(async (de, ate) => {
      const { data, error } = await c.from(tabela).select(colunas).order("id").range(de, ate);
      if (error) throw error;
      return (data ?? []) as T[];
    });
  type LinhaPlano = { id: string; tema_id: string; situacao: "vamos_fazer" | "ja_fizemos"; feito_em: string | null; criado_por: string | null; memorias: unknown };
  const [resumo, planosData, sorteiosData, usuarios, temas, memoriasData, fotosData] = await Promise.all([
    resumoDoEspaco(),
    tudo<LinhaPlano>("planos", "id, tema_id, situacao, feito_em, criado_por, memorias(id)"),
    tudo<{ plano_id: string; data: string }>("sorteios", "plano_id, data"),
    c.from("usuarios").select("id, nome").order("criado_em"),
    c.from("temas").select("id, nome, icone").order("padrao", { ascending: false }).order("criado_em"),
    tudo<{ registrada_por: string | null }>("memorias", "registrada_por"),
    tudo<{ enviada_por: string | null }>("fotos", "enviada_por"),
  ]);
  for (const r of [usuarios, temas]) if (r.error) throw r.error;
  const planos = { data: planosData };
  const sorteios = { data: sorteiosData };
  const memorias = { data: memoriasData };
  const fotos = { data: fotosData };

  const ps: PlanoM[] = (planos.data ?? []).map((p) => ({
    id: p.id,
    temaId: p.tema_id,
    situacao: p.situacao,
    feitoEm: p.feito_em,
    temMemoria: temAlgum(p.memorias),
    criadoPor: p.criado_por,
  }));
  const ss = (sorteios.data ?? []).map((s) => ({ planoId: s.plano_id, data: s.data }));

  const planosPor = contar(ps, (p) => p.criadoPor);
  const memoriasPor = contar(memorias.data ?? [], (m) => m.registrada_por);
  const fotosPor = contar(fotos.data ?? [], (f) => f.enviada_por);

  return {
    resumo,
    temas: temas.data?.length ?? 0,
    sorteios: ss.length,
    meses: calcularMeses(ps, ss, hoje()),
    geralComMemoria: percentualComMemoria(ps),
    porPessoa: (usuarios.data ?? []).map((u) => ({
      nome: u.nome,
      planos: planosPor.get(u.id) ?? 0,
      memorias: memoriasPor.get(u.id) ?? 0,
      fotos: fotosPor.get(u.id) ?? 0,
    })),
    porTema: (temas.data ?? []).map((t) => ({
      nome: t.nome,
      icone: t.icone,
      vamosFazer: ps.filter((p) => p.temaId === t.id && p.situacao === "vamos_fazer").length,
      jaFizemos: ps.filter((p) => p.temaId === t.id && p.situacao === "ja_fizemos").length,
    })),
  };
}

// ---- Ações em lote (spec 5.3) ----

export type TipoLote = "planos" | "memorias" | "fotos" | "temas";
export interface ItemLote {
  id: string;
  titulo: string;
  detalhe: string;
  miniatura?: string;
}
export interface FiltrosLote {
  tema?: string;
  situacao?: string;
  q?: string;
  mes?: string; // AAAA-MM, só fotos
}

const MAX_ITENS = 500;
const UUID_RE = /^[0-9a-f-]{36}$/i;
const umDe = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? v[0] ?? null : v ?? null);
const tituloDe = (p: { titulo: string | null; link: string | null } | null) =>
  p ? tituloDoPlano(p) : "Plano apagado";

export async function itensLote(tipo: TipoLote, f: FiltrosLote): Promise<ItemLote[]> {
  const c = db();
  if (tipo === "planos") {
    let q = c
      .from("planos")
      .select("id, titulo, link, situacao, temas(nome, icone)")
      .order("criado_em", { ascending: false })
      .limit(MAX_ITENS);
    if (f.tema && UUID_RE.test(f.tema)) q = q.eq("tema_id", f.tema);
    if (f.situacao === "vamos_fazer" || f.situacao === "ja_fizemos") q = q.eq("situacao", f.situacao);
    const busca = limparBusca(f.q ?? "");
    if (busca) q = q.or(`titulo.ilike.%${busca}%,link.ilike.%${busca}%`);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).map((p) => {
      const tema = umDe(p.temas as { nome: string; icone: string } | { nome: string; icone: string }[] | null);
      return {
        id: p.id,
        titulo: tituloDoPlano(p),
        detalhe: `${tema ? `${tema.icone} ${tema.nome}` : "Sem tema"} · ${p.situacao === "ja_fizemos" ? "já fizemos" : "vamos fazer"}`,
      };
    });
  }
  if (tipo === "memorias") {
    const { data, error } = await c
      .from("memorias")
      .select("id, frase, data, planos(titulo, link), fotos(id)")
      .order("data", { ascending: false })
      .limit(MAX_ITENS);
    if (error) throw error;
    return (data ?? []).map((m) => {
      const n = Array.isArray(m.fotos) ? m.fotos.length : 0;
      const plano = umDe(m.planos as { titulo: string | null; link: string | null } | { titulo: string | null; link: string | null }[] | null);
      return {
        id: m.id,
        titulo: tituloDe(plano),
        detalhe: `${formatarData(m.data)} · ${n} foto${n === 1 ? "" : "s"}${m.frase ? ` · “${m.frase.slice(0, 40)}”` : ""}`,
      };
    });
  }
  if (tipo === "fotos") {
    let q = c
      .from("fotos")
      .select("id, caminho, enviada_em, memorias(planos(titulo, link))")
      .order("enviada_em", { ascending: false })
      .limit(MAX_ITENS);
    if (f.mes && /^\d{4}-\d{2}$/.test(f.mes)) {
      const [a, m] = f.mes.split("-").map(Number);
      const fim = m === 12 ? `${a + 1}-01` : `${a}-${String(m + 1).padStart(2, "0")}`;
      q = q.gte("enviada_em", `${f.mes}-01T00:00:00-03:00`).lt("enviada_em", `${fim}-01T00:00:00-03:00`);
    }
    const { data, error } = await q;
    if (error) throw error;
    const linhas = data ?? [];
    const minis = linhas.map((l) => caminhoMini(l.caminho));
    const urls = new Map<string, string>();
    if (minis.length) {
      const { data: assinadas } = await c.storage.from(BUCKET_FOTOS).createSignedUrls(minis, 60 * 60);
      for (const s of assinadas ?? []) if (s.path && s.signedUrl) urls.set(s.path, s.signedUrl);
    }
    return linhas.map((l) => {
      const mem = umDe(l.memorias as unknown as { planos: unknown } | { planos: unknown }[] | null);
      const plano = umDe((mem?.planos ?? null) as { titulo: string | null; link: string | null } | null);
      return {
        id: l.id,
        titulo: tituloDe(plano),
        detalhe: `enviada em ${formatarData(l.enviada_em)}`,
        miniatura: urls.get(caminhoMini(l.caminho)),
      };
    });
  }
  const { data, error } = await c
    .from("temas")
    .select("id, nome, icone, planos(id)")
    .order("padrao", { ascending: false })
    .order("criado_em");
  if (error) throw error;
  return (data ?? []).map((t) => {
    const n = Array.isArray(t.planos) ? t.planos.length : 0;
    return { id: t.id, titulo: `${t.icone} ${t.nome}`, detalhe: n ? `${n} plano${n === 1 ? "" : "s"} · não pode ser apagado` : "vazio" };
  });
}

// ---- Infra (spec 5.4) ----

export type Infra =
  | { pendente: true }
  | {
      pendente: false;
      bancoBytes: number;
      fotosBytes: number;
      fotosArquivos: number;
      tabelas: Record<string, number>;
      orfas: string[];
    };

// Todos os caminhos de fotos do banco, paginando (o PostgREST corta em 1000 linhas por resposta).
// Precisa ser completo: um caminho faltando faria uma foto real parecer órfã.
export async function todosCaminhosDeFotos(): Promise<string[]> {
  const linhas = await lerPaginado(async (de, ate) => {
    const { data, error } = await db().from("fotos").select("caminho").order("id").range(de, ate);
    if (error) throw error;
    return data ?? [];
  });
  return linhas.map((f) => f.caminho);
}

export async function dadosInfra(): Promise<Infra> {
  const { data, error } = await db().rpc("admin_infra");
  if (error || !data) return { pendente: true };
  const d = data as { banco_bytes: number; fotos_bytes: number; fotos_arquivos: number; tabelas: Record<string, number>; objetos: string[] };
  const caminhos = await todosCaminhosDeFotos();
  return {
    pendente: false,
    bancoBytes: Number(d.banco_bytes),
    fotosBytes: Number(d.fotos_bytes),
    fotosArquivos: Number(d.fotos_arquivos),
    tabelas: d.tabelas ?? {},
    orfas: fotosOrfas(d.objetos ?? [], caminhos),
  };
}
