"use server";

import { revalidatePath } from "next/cache";
import { exigirSessao } from "@/lib/auth";
import { db } from "@/lib/db";

export interface EstadoTema {
  erro?: string;
  ok?: boolean;
}

const UUID = /^[0-9a-f-]{36}$/i;

function lerNome(form: FormData) {
  return String(form.get("nome") ?? "").trim().slice(0, 40);
}
function lerIcone(form: FormData) {
  const icone = String(form.get("icone") ?? "").trim();
  return icone ? [...icone].slice(0, 2).join("") : "✦";
}

// REQ-10, critério 2: criar temas
export async function criarTema(_: EstadoTema, form: FormData): Promise<EstadoTema> {
  await exigirSessao();
  const nome = lerNome(form);
  if (!nome) return { erro: "Dê um nome ao tema." };
  const { error } = await db().from("temas").insert({ nome, icone: lerIcone(form), padrao: false });
  if (error) return { erro: "Não foi possível criar o tema." };
  revalidatePath("/", "layout");
  return { ok: true };
}

// REQ-10, critério 2: renomear temas (inclusive os padrão)
export async function renomearTema(_: EstadoTema, form: FormData): Promise<EstadoTema> {
  await exigirSessao();
  const id = String(form.get("id") ?? "");
  const nome = lerNome(form);
  if (!UUID.test(id)) return { erro: "Tema inválido." };
  if (!nome) return { erro: "O nome não pode ficar vazio." };
  const { error } = await db().from("temas").update({ nome, icone: lerIcone(form) }).eq("id", id);
  if (error) return { erro: "Não foi possível renomear." };
  revalidatePath("/", "layout");
  return { ok: true };
}

// REQ-10, critério 3: só exclui tema vazio (o banco também impede, por chave estrangeira)
export async function excluirTema(_: EstadoTema, form: FormData): Promise<EstadoTema> {
  await exigirSessao();
  const id = String(form.get("id") ?? "");
  if (!UUID.test(id)) return { erro: "Tema inválido." };
  const { count } = await db().from("planos").select("id", { count: "exact", head: true }).eq("tema_id", id);
  if (count) return { erro: "Só dá para excluir um tema vazio." };
  const { error } = await db().from("temas").delete().eq("id", id);
  if (error) return { erro: "Não foi possível excluir." };
  revalidatePath("/", "layout");
  return { ok: true };
}
