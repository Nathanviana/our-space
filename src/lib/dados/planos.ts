import "server-only";
import { db } from "@/lib/db";
import type { Plano, SituacaoPlano } from "@/lib/types";

const CAMPOS =
  "id, tema_id, titulo, tipo, link, situacao, feito_em, lugar_nome, latitude, longitude, criado_por, criado_em, memorias(id)";

interface LinhaPlano {
  id: string;
  tema_id: string;
  titulo: string | null;
  tipo: Plano["tipo"];
  link: string | null;
  situacao: SituacaoPlano;
  feito_em: string | null;
  lugar_nome: string | null;
  latitude: number | null;
  longitude: number | null;
  criado_por: string | null;
  criado_em: string;
  memorias: { id: string } | { id: string }[] | null;
}

export function paraPlano(l: LinhaPlano): Plano {
  const m = Array.isArray(l.memorias) ? l.memorias[0] : l.memorias;
  return {
    id: l.id,
    temaId: l.tema_id,
    titulo: l.titulo,
    tipo: l.tipo,
    link: l.link,
    situacao: l.situacao,
    feitoEm: l.feito_em,
    lugar: { nome: l.lugar_nome, latitude: l.latitude, longitude: l.longitude },
    criadoPor: l.criado_por,
    criadoEm: l.criado_em,
    memoriaId: m?.id ?? null,
  };
}

export async function listarPlanos(filtro: { temaId?: string; situacao?: SituacaoPlano; limite?: number } = {}) {
  let q = db().from("planos").select(CAMPOS);
  if (filtro.temaId) q = q.eq("tema_id", filtro.temaId);
  if (filtro.situacao) q = q.eq("situacao", filtro.situacao);
  q = filtro.situacao === "ja_fizemos"
    ? q.order("feito_em", { ascending: false }).order("criado_em", { ascending: false })
    : q.order("criado_em", { ascending: false });
  if (filtro.limite) q = q.limit(filtro.limite);
  const { data, error } = await q;
  if (error) throw error;
  return ((data ?? []) as unknown as LinhaPlano[]).map(paraPlano);
}

export async function buscarPlano(id: string): Promise<Plano | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data, error } = await db().from("planos").select(CAMPOS).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? paraPlano(data as unknown as LinhaPlano) : null;
}
