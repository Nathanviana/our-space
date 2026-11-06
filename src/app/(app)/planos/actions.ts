"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigirSessao } from "@/lib/auth";
import { BUCKET_FOTOS, db } from "@/lib/db";
import { hoje } from "@/lib/hoje";
import { buscarPrevia } from "@/lib/buscar-previa";
import { limparPrevia, type PreviaLink } from "@/lib/previa";
import { CAMPOS_PLANO, paraPlano } from "@/lib/dados/planos";
import type { Plano, TipoPlano } from "@/lib/types";

export interface EstadoPlano {
  erro?: string;
}

const UUID = /^[0-9a-f-]{36}$/i;
const TIPOS: TipoPlano[] = ["filme", "lugar", "receita", "programa"];

function lerLink(v: FormDataEntryValue | null): string | null | "invalido" {
  const s = String(v ?? "").trim();
  if (!s) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : "invalido";
  } catch {
    return "invalido";
  }
}

function lerCampos(form: FormData) {
  const titulo = String(form.get("titulo") ?? "").trim().slice(0, 120) || null;
  const link = lerLink(form.get("link"));
  const temaId = String(form.get("tema") ?? "");
  const tipoBruto = String(form.get("tipo") ?? "");
  const tipo = (TIPOS as string[]).includes(tipoBruto) ? (tipoBruto as TipoPlano) : null;
  const lat = Number(form.get("latitude"));
  const lng = Number(form.get("longitude"));
  const temPonto = form.get("latitude") !== "" && form.get("longitude") !== "" &&
    Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
  const lugar = {
    lugar_nome: temPonto ? String(form.get("lugarNome") ?? "").trim().slice(0, 160) || null : null,
    latitude: temPonto ? lat : null,
    longitude: temPonto ? lng : null,
  };
  return { titulo, link, temaId, tipo, lugar };
}

function validar({ titulo, link, temaId }: ReturnType<typeof lerCampos>): string | null {
  if (link === "invalido") return "Esse link não parece válido.";
  if (!titulo && !link) return "Escreva um título ou cole um link.";
  if (!UUID.test(temaId)) return "Escolha um tema.";
  return null;
}

// Prévia do link: usa a que o formulário já buscou para este mesmo link, senão busca agora
async function previaParaSalvar(form: FormData, link: string | null): Promise<PreviaLink | null> {
  if (!link) return null;
  if (String(form.get("previaLink") ?? "") === link) {
    const p = limparPrevia(String(form.get("previaTitulo") ?? ""), String(form.get("previaImagem") ?? ""), String(form.get("previaSite") ?? ""));
    if (p.titulo || p.imagem) return p;
  }
  return buscarPrevia(link);
}

const colunasPrevia = (p: PreviaLink | null) => ({
  previa_titulo: p?.titulo ?? null,
  previa_imagem: p?.imagem ?? null,
  previa_site: p?.site ?? null,
});

// Formulário: prévia do link colado (título e imagem), antes de salvar
export async function previaDoLink(texto: string): Promise<(PreviaLink & { link: string }) | null> {
  await exigirSessao();
  const link = lerLink(texto);
  if (!link || link === "invalido") return null;
  const p = await buscarPrevia(link);
  return p ? { ...p, link } : null;
}

// REQ-01 e REQ-03: novo plano entra em "vamos fazer"
export async function criarPlano(_: EstadoPlano, form: FormData): Promise<EstadoPlano> {
  const sessao = await exigirSessao();
  const c = lerCampos(form);
  const erro = validar(c);
  if (erro) return { erro };
  const previa = await previaParaSalvar(form, c.link as string | null);
  const { error } = await db().from("planos").insert({
    tema_id: c.temaId,
    titulo: c.titulo,
    link: c.link,
    ...colunasPrevia(previa),
    tipo: c.tipo,
    ...c.lugar,
    criado_por: sessao.sub,
  });
  if (error) return { erro: "Não foi possível guardar o plano." };
  revalidatePath("/", "layout");
  redirect(`/temas/${c.temaId}`);
}

export async function editarPlano(_: EstadoPlano, form: FormData): Promise<EstadoPlano> {
  await exigirSessao();
  const id = String(form.get("id") ?? "");
  if (!UUID.test(id)) return { erro: "Plano inválido." };
  const c = lerCampos(form);
  const erro = validar(c);
  if (erro) return { erro };
  // Só busca a prévia de novo se o link mudou ou se ainda não tinha prévia
  const { data: atual } = await db().from("planos").select("link, previa_titulo, previa_imagem").eq("id", id).maybeSingle();
  const mudouLink = atual?.link !== c.link;
  const semPrevia = !atual?.previa_titulo && !atual?.previa_imagem;
  const previa = mudouLink || semPrevia ? colunasPrevia(await previaParaSalvar(form, c.link as string | null)) : {};
  const { error } = await db()
    .from("planos")
    .update({ tema_id: c.temaId, titulo: c.titulo, link: c.link, ...previa, tipo: c.tipo, ...c.lugar })
    .eq("id", id);
  if (error) return { erro: "Não foi possível salvar." };
  revalidatePath("/", "layout");
  redirect(`/planos/${id}`);
}

// REQ-02: marcar como feito grava a data; REQ-05: em seguida abre o registro da memória
export async function marcarFeito(form: FormData) {
  await exigirSessao();
  const id = String(form.get("id") ?? "");
  if (!UUID.test(id)) return;
  await db().from("planos").update({ situacao: "ja_fizemos", feito_em: hoje() }).eq("id", id);
  revalidatePath("/", "layout");
  redirect(`/planos/${id}/memoria`);
}

// REQ-02, critério 3: dá para desfazer
export async function desfazerFeito(form: FormData) {
  await exigirSessao();
  const id = String(form.get("id") ?? "");
  if (!UUID.test(id)) return;
  await db().from("planos").update({ situacao: "vamos_fazer", feito_em: null }).eq("id", id);
  revalidatePath("/", "layout");
}

// RNF-03: excluir apaga de vez, inclusive as fotos guardadas
export async function excluirPlano(form: FormData) {
  await exigirSessao();
  const id = String(form.get("id") ?? "");
  if (!UUID.test(id)) return;
  const { data: plano } = await db().from("planos").select("tema_id, memorias(fotos(caminho))").eq("id", id).maybeSingle();
  if (!plano) return;
  const memorias = (plano.memorias ?? []) as unknown as { fotos: { caminho: string }[] }[];
  const caminhos = (Array.isArray(memorias) ? memorias : [memorias]).flatMap((m) => m?.fotos ?? []).map((f) => f.caminho);
  if (caminhos.length) await db().storage.from(BUCKET_FOTOS).remove(caminhos);
  await db().from("planos").delete().eq("id", id);
  revalidatePath("/", "layout");
  redirect(`/temas/${plano.tema_id}`);
}

export interface ResultadoSorteio {
  plano?: Plano;
  erro?: string;
}

// REQ-04: sorteia só entre "vamos fazer", com filtro opcional por tema, e registra o sorteio
export async function sortear(temaId: string | null): Promise<ResultadoSorteio> {
  const sessao = await exigirSessao();
  const tema = temaId && UUID.test(temaId) ? temaId : null;
  let q = db()
    .from("planos")
    .select(CAMPOS_PLANO)
    .eq("situacao", "vamos_fazer");
  if (tema) q = q.eq("tema_id", tema);
  const { data, error } = await q;
  if (error) return { erro: "Não foi possível sortear." };
  if (!data?.length) return { erro: tema ? "Não há planos em \"vamos fazer\" neste tema." : "Ainda não há planos em \"vamos fazer\"." };
  const escolhido = data[Math.floor(Math.random() * data.length)];
  await db().from("sorteios").insert({ plano_id: escolhido.id, tema_id: tema, sorteado_por: sessao.sub });
  return { plano: paraPlano(escolhido as never) };
}
