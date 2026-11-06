import "server-only";
import { BUCKET_FOTOS, db } from "@/lib/db";
import { caminhoMini, listarGaleria } from "@/lib/dados/memorias";
import type { ModoArte } from "@/lib/login-arte";

export interface Polaroid {
  id: string;
  url: string;
  legenda: string;
}

export interface ArteDoLogin {
  modo: ModoArte;
  fotos: Polaroid[];
}

const CORACAO: ArteDoLogin = { modo: "coracao", fotos: [] };
const VALIDADE_URL_S = 60 * 60 * 6;

interface LinhaLoginFoto {
  ordem: number;
  fotos: { id: string; caminho: string; tirada_em: string | null; memorias: { data: string | null; planos: { titulo: string | null } | null } | null } | null;
}

const mesAno = new Intl.DateTimeFormat("pt-BR", { month: "short", year: "numeric" });

function legendaDe(l: LinhaLoginFoto): string {
  const titulo = l.fotos?.memorias?.planos?.titulo?.trim();
  if (titulo) return titulo;
  const data = l.fotos?.tirada_em ?? l.fotos?.memorias?.data;
  return data ? mesAno.format(new Date(data)).replace(".", "") : "";
}

async function fotosEscolhidas(): Promise<{ linhas: LinhaLoginFoto[]; erro: string | null }> {
  const { data, error } = await db()
    .from("login_fotos")
    .select("ordem, fotos(id, caminho, tirada_em, memorias(data, planos(titulo)))")
    .order("ordem");
  return { linhas: ((data ?? []) as unknown as LinhaLoginFoto[]).filter((l) => l.fotos), erro: error?.code ?? null };
}

// Tela de login (pública): nunca lança. Qualquer falha (ex.: migração pendente) volta para o coração.
export async function arteDoLogin(): Promise<ArteDoLogin> {
  try {
    const [cfg, escolhidas] = await Promise.all([
      db().from("login_config").select("modo").eq("id", 1).maybeSingle(),
      fotosEscolhidas(),
    ]);
    if (cfg.error || escolhidas.erro || cfg.data?.modo !== "polaroids" || !escolhidas.linhas.length) return CORACAO;
    const caminhos = escolhidas.linhas.map((l) => caminhoMini(l.fotos!.caminho));
    const { data, error } = await db().storage.from(BUCKET_FOTOS).createSignedUrls(caminhos, VALIDADE_URL_S);
    if (error) return CORACAO;
    const url = new Map((data ?? []).map((d) => [d.path, d.signedUrl]));
    const fotos = escolhidas.linhas
      .map((l) => ({ id: l.fotos!.id, url: url.get(caminhoMini(l.fotos!.caminho)) ?? "", legenda: legendaDe(l) }))
      .filter((f) => f.url);
    return fotos.length ? { modo: "polaroids", fotos } : CORACAO;
  } catch {
    return CORACAO;
  }
}

export interface FotoEscolhivel {
  id: string;
  urlMini: string;
  legenda: string;
}

export interface ConfigArteAdmin {
  migracaoPendente: boolean;
  modo: ModoArte;
  escolhidas: string[];
  candidatas: FotoEscolhivel[];
}

// Admin: modo atual, fotos escolhidas (na ordem) e as fotos mais recentes para escolher.
export async function configArteAdmin(): Promise<ConfigArteAdmin> {
  const [cfg, escolhidas, galeria] = await Promise.all([
    db().from("login_config").select("modo").eq("id", 1).maybeSingle(),
    fotosEscolhidas(),
    listarGaleria(0, 60),
  ]);
  const candidatas: FotoEscolhivel[] = galeria.fotos.map((f) => ({ id: f.id, urlMini: f.urlMini, legenda: f.titulo }));
  if (cfg.error || escolhidas.erro) {
    return { migracaoPendente: true, modo: "coracao", escolhidas: [], candidatas };
  }
  // Escolhidas que já saíram das 60 mais recentes continuam aparecendo
  const faltando = escolhidas.linhas.filter((l) => !candidatas.some((c) => c.id === l.fotos!.id));
  if (faltando.length) {
    const { data } = await db().storage.from(BUCKET_FOTOS).createSignedUrls(faltando.map((l) => caminhoMini(l.fotos!.caminho)), 60 * 60);
    const url = new Map((data ?? []).map((d) => [d.path, d.signedUrl]));
    candidatas.unshift(
      ...faltando.map((l) => ({ id: l.fotos!.id, urlMini: url.get(caminhoMini(l.fotos!.caminho)) ?? "", legenda: legendaDe(l) })),
    );
  }
  return {
    migracaoPendente: false,
    modo: cfg.data?.modo === "polaroids" ? "polaroids" : "coracao",
    escolhidas: escolhidas.linhas.map((l) => l.fotos!.id),
    candidatas,
  };
}
