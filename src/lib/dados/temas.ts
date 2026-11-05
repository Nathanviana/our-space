import "server-only";
import { db } from "@/lib/db";
import type { Tema } from "@/lib/types";

interface LinhaTema {
  id: string;
  nome: string;
  icone: string;
  padrao: boolean;
}

const paraTema = (l: LinhaTema): Tema => ({ id: l.id, nome: l.nome, icone: l.icone, padrao: l.padrao });

export async function listarTemas(): Promise<Tema[]> {
  const { data, error } = await db()
    .from("temas")
    .select("id, nome, icone, padrao")
    .order("padrao", { ascending: false })
    .order("criado_em", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(paraTema);
}

export async function buscarTema(id: string): Promise<Tema | null> {
  const { data, error } = await db().from("temas").select("id, nome, icone, padrao").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? paraTema(data) : null;
}

// Quantidade de planos por tema
export async function contarPlanosPorTema(): Promise<Record<string, number>> {
  const { data, error } = await db().from("planos").select("tema_id");
  if (error) throw error;
  const contagem: Record<string, number> = {};
  for (const p of data ?? []) contagem[p.tema_id] = (contagem[p.tema_id] ?? 0) + 1;
  return contagem;
}
