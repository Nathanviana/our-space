"use server";

import { revalidatePath } from "next/cache";
import { exigirSessao } from "@/lib/auth";
import { BUCKET_FOTOS, db } from "@/lib/db";
import { hoje } from "@/lib/hoje";
import { blocosFotoMini, confirmacaoOk, separarFeitos, validarIds } from "@/lib/admin/lote";
import { lerPaginado } from "@/lib/admin/paginar";

export type Tipo = "planos" | "memorias" | "fotos" | "temas";
export interface Resultado {
  erro?: string;
  ok?: string;
}
export interface Contagem {
  erro?: string;
  planos: number;
  memorias: number;
  fotos: number;
  temas: number;
  temasComPlanos: number;
}

const TIPOS: Tipo[] = ["planos", "memorias", "fotos", "temas"];
const UUID = /^[0-9a-f-]{36}$/i;
const BLOCO = 100;

function blocos<T>(lista: T[], tamanho = BLOCO): T[][] {
  const r: T[][] = [];
  for (let i = 0; i < lista.length; i += tamanho) r.push(lista.slice(i, i + tamanho));
  return r;
}

// select ... where coluna in (ids): ids em blocos (tamanho da URL) e cada bloco paginado (corte de 1000 linhas do PostgREST)
async function buscarEm<T>(tabela: string, colunas: string, coluna: string, ids: string[]): Promise<T[]> {
  const out: T[] = [];
  for (const b of blocos(ids)) {
    const linhas = await lerPaginado(async (de, ate) => {
      const { data, error } = await db().from(tabela).select(colunas).in(coluna, b).order("id").range(de, ate);
      if (error) throw error;
      return (data ?? []) as T[];
    });
    out.push(...linhas);
  }
  return out;
}

interface Alvo {
  planos: string[];
  memorias: string[];
  fotos: string[]; // caminhos no bucket (sem a miniatura)
  temas: string[]; // temas que podem ser apagados (vazios)
  temasComPlanos: number;
}

// Tudo o que some em cascata ao apagar os ids escolhidos (spec 5.3)
async function alvoDaExclusao(tipo: Tipo, ids: string[]): Promise<Alvo> {
  const vazio: Alvo = { planos: [], memorias: [], fotos: [], temas: [], temasComPlanos: 0 };
  if (tipo === "temas") {
    const comPlanos = new Set((await buscarEm<{ tema_id: string }>("planos", "tema_id", "tema_id", ids)).map((p) => p.tema_id));
    const existentes = (await buscarEm<{ id: string }>("temas", "id", "id", ids)).map((t) => t.id);
    return { ...vazio, temas: existentes.filter((id) => !comPlanos.has(id)), temasComPlanos: comPlanos.size };
  }
  if (tipo === "fotos") {
    const fotos = await buscarEm<{ caminho: string }>("fotos", "caminho", "id", ids);
    return { ...vazio, fotos: fotos.map((f) => f.caminho) };
  }
  let planos: string[] = [];
  let memorias: string[];
  if (tipo === "planos") {
    planos = (await buscarEm<{ id: string }>("planos", "id", "id", ids)).map((p) => p.id);
    memorias = (await buscarEm<{ id: string }>("memorias", "id", "plano_id", planos)).map((m) => m.id);
  } else {
    memorias = (await buscarEm<{ id: string }>("memorias", "id", "id", ids)).map((m) => m.id);
  }
  const fotos = (await buscarEm<{ caminho: string }>("fotos", "caminho", "memoria_id", memorias)).map((f) => f.caminho);
  return { ...vazio, planos, memorias, fotos };
}

function lerEntrada(tipo: unknown, ids: unknown): { tipo: Tipo; ids: string[] } | { erro: string } {
  if (!TIPOS.includes(tipo as Tipo)) return { erro: "Tipo inválido." };
  const lista = Array.isArray(ids) ? [...new Set(ids.map(String))] : [];
  const erro = validarIds(lista);
  return erro ? { erro } : { tipo: tipo as Tipo, ids: lista };
}

export async function contarExclusao(tipo: Tipo, ids: string[]): Promise<Contagem> {
  await exigirSessao();
  const zero = { planos: 0, memorias: 0, fotos: 0, temas: 0, temasComPlanos: 0 };
  const e = lerEntrada(tipo, ids);
  if ("erro" in e) return { ...zero, erro: e.erro };
  try {
    const a = await alvoDaExclusao(e.tipo, e.ids);
    return { planos: a.planos.length, memorias: a.memorias.length, fotos: a.fotos.length, temas: a.temas.length, temasComPlanos: a.temasComPlanos };
  } catch {
    return { ...zero, erro: "Não consegui calcular o que seria apagado." };
  }
}

// Apaga de vez. Fotos saem do armazenamento ANTES do banco; se o armazenamento falhar, nada é apagado.
export async function apagarLote(tipo: Tipo, ids: string[], confirmacao: string): Promise<Resultado> {
  await exigirSessao();
  const e = lerEntrada(tipo, ids);
  if ("erro" in e) return { erro: e.erro };
  if (!confirmacaoOk(confirmacao)) return { erro: "Digite apagar para confirmar." };

  let a: Alvo;
  try {
    a = await alvoDaExclusao(e.tipo, e.ids);
  } catch {
    return { erro: "Não consegui calcular o que seria apagado. Nada foi apagado." };
  }

  // Cada bloco sai do armazenamento e, em seguida, do banco: se algo falhar no meio,
  // nenhuma linha de foto fica apontando para um arquivo que já não existe.
  let fotosApagadas = 0;
  for (const b of blocosFotoMini(a.fotos)) {
    const { error } = await db().storage.from(BUCKET_FOTOS).remove(b.arquivos);
    const semRegistro = error ? null : await db().from("fotos").delete().in("caminho", b.fotos);
    if (error || semRegistro?.error) {
      if (fotosApagadas) revalidatePath("/", "layout");
      return {
        erro: fotosApagadas
          ? `Deu erro no meio: ${fotosApagadas} foto(s) já foram apagadas; o resto não foi apagado. Tente de novo.`
          : "Não consegui apagar as fotos do armazenamento. Nada foi apagado.",
      };
    }
    fotosApagadas += b.fotos.length;
  }

  // Fotos já saíram acima, junto com o arquivo; aqui só planos, memórias ou temas.
  const linhas = e.tipo === "temas" ? a.temas : e.tipo === "planos" ? a.planos : e.tipo === "memorias" ? a.memorias : [];
  for (const b of blocos(linhas)) {
    const { error } = await db().from(e.tipo).delete().in("id", b);
    if (error) {
      revalidatePath("/", "layout");
      return { erro: `${fotosApagadas} foto(s) apagadas, mas parte dos registros não. Tente de novo.` };
    }
  }
  revalidatePath("/", "layout");

  const partes = {
    planos: `${a.planos.length} plano(s), ${a.memorias.length} memória(s) e ${a.fotos.length} foto(s) apagados.`,
    memorias: `${a.memorias.length} memória(s) e ${a.fotos.length} foto(s) apagadas.`,
    fotos: `${a.fotos.length} foto(s) apagada(s).`,
    temas: `${a.temas.length} tema(s) apagado(s).${a.temasComPlanos ? ` ${a.temasComPlanos} com planos foram pulados.` : ""}`,
  };
  return { ok: partes[e.tipo] };
}

export async function moverPlanos(ids: string[], temaId: string): Promise<Resultado> {
  await exigirSessao();
  const e = lerEntrada("planos", ids);
  if ("erro" in e) return { erro: e.erro };
  if (!UUID.test(temaId)) return { erro: "Escolha o tema de destino." };
  const { data: tema } = await db().from("temas").select("nome").eq("id", temaId).maybeSingle();
  if (!tema) return { erro: "Tema não encontrado." };
  for (const b of blocos(e.ids)) {
    const { error } = await db().from("planos").update({ tema_id: temaId }).in("id", b);
    if (error) return { erro: "Não foi possível mover todos os planos." };
  }
  revalidatePath("/", "layout");
  return { ok: `${e.ids.length} plano(s) movido(s) para ${tema.nome}.` };
}

export async function marcarPlanos(ids: string[], situacao: "vamos_fazer" | "ja_fizemos"): Promise<Resultado> {
  await exigirSessao();
  const e = lerEntrada("planos", ids);
  if ("erro" in e) return { erro: e.erro };
  if (situacao !== "vamos_fazer" && situacao !== "ja_fizemos") return { erro: "Situação inválida." };

  let alvo = e.ids;
  let pulados = 0;
  if (situacao === "ja_fizemos") {
    // Spec 5.3: quem já está em "já fizemos" é pulado, para não perder a data real.
    const s = separarFeitos(await buscarEm<{ id: string; situacao: string }>("planos", "id, situacao", "id", e.ids));
    alvo = s.aplicar;
    pulados = s.pulados;
  }
  const mudanca = situacao === "ja_fizemos" ? { situacao, feito_em: hoje() } : { situacao, feito_em: null };
  for (const b of blocos(alvo)) {
    const { error } = await db().from("planos").update(mudanca).in("id", b);
    if (error) return { erro: "Não foi possível atualizar todos os planos." };
  }
  revalidatePath("/", "layout");
  const rotulo = situacao === "ja_fizemos" ? "já fizemos" : "vamos fazer";
  return { ok: `${alvo.length} plano(s) em "${rotulo}".${pulados ? ` ${pulados} já estavam feitos e foram pulados.` : ""}` };
}
