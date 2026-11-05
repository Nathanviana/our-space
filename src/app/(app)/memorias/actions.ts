"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { exigirSessao } from "@/lib/auth";
import { BUCKET_FOTOS, db } from "@/lib/db";
import { caminhoMini, listarGaleria, type PaginaGaleria } from "@/lib/dados/memorias";

const UUID = /^[0-9a-f-]{36}$/i;
const DATA = /^\d{4}-\d{2}-\d{2}$/;

function numero(v: unknown, min: number, max: number): number | null {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) && n >= min && n <= max && v !== "" && v !== null ? n : null;
}

function link(v: string): string | null | "invalido" {
  const s = v.trim();
  if (!s) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : "invalido";
  } catch {
    return "invalido";
  }
}

export interface DadosMemoria {
  planoId: string;
  frase: string;
  musica: string;
  data: string;
  lugarNome: string;
  latitude: number | null;
  longitude: number | null;
}

// REQ-05, REQ-07 a REQ-09: cria ou atualiza a memória ligada ao plano
export async function salvarMemoria(d: DadosMemoria): Promise<{ id?: string; erro?: string }> {
  const sessao = await exigirSessao();
  if (!UUID.test(d.planoId)) return { erro: "Plano inválido." };
  const musica = link(d.musica);
  if (musica === "invalido") return { erro: "O link da música não parece válido." };
  const lat = numero(d.latitude, -90, 90);
  const lng = numero(d.longitude, -180, 180);
  const registro = {
    plano_id: d.planoId,
    frase: d.frase.trim().slice(0, 280) || null,
    musica_link: musica,
    data: DATA.test(d.data) ? d.data : undefined,
    lugar_nome: d.lugarNome.trim().slice(0, 160) || null,
    latitude: lat !== null && lng !== null ? lat : null,
    longitude: lat !== null && lng !== null ? lng : null,
  };
  const { data: existente } = await db().from("memorias").select("id").eq("plano_id", d.planoId).maybeSingle();
  const resp = existente
    ? await db().from("memorias").update(registro).eq("id", existente.id).select("id").single()
    : await db().from("memorias").insert({ ...registro, registrada_por: sessao.sub }).select("id").single();
  if (resp.error) return { erro: "Não foi possível guardar a memória." };
  revalidatePath("/", "layout");
  return { id: resp.data.id };
}

// REQ-06: uma foto por chamada, já reduzida no celular, com a miniatura
export async function enviarFoto(form: FormData): Promise<{ erro?: string }> {
  const sessao = await exigirSessao();
  const memoriaId = String(form.get("memoriaId") ?? "");
  const foto = form.get("foto");
  const mini = form.get("mini");
  if (!UUID.test(memoriaId)) return { erro: "Memória inválida." };
  if (!(foto instanceof Blob) || !(mini instanceof Blob)) return { erro: "Foto inválida." };
  if (foto.type !== "image/jpeg" || foto.size > 4 * 1024 * 1024) return { erro: "Foto em formato ou tamanho inválido." };

  const { data: memoria } = await db().from("memorias").select("id").eq("id", memoriaId).maybeSingle();
  if (!memoria) return { erro: "Memória não encontrada." };

  const caminho = `${memoriaId}/${randomUUID()}.jpg`;
  const bucket = db().storage.from(BUCKET_FOTOS);
  const up1 = await bucket.upload(caminho, foto, { contentType: "image/jpeg" });
  if (up1.error) return { erro: "Falha ao enviar a foto." };
  const up2 = await bucket.upload(caminhoMini(caminho), mini, { contentType: "image/jpeg" });
  if (up2.error) {
    await bucket.remove([caminho]);
    return { erro: "Falha ao enviar a foto." };
  }

  const lat = numero(form.get("latitude"), -90, 90);
  const lng = numero(form.get("longitude"), -180, 180);
  const tirada = String(form.get("tiradaEm") ?? "");
  const { error } = await db().from("fotos").insert({
    memoria_id: memoriaId,
    caminho,
    latitude: lat !== null && lng !== null ? lat : null,
    longitude: lat !== null && lng !== null ? lng : null,
    tirada_em: tirada && !Number.isNaN(Date.parse(tirada)) ? tirada : null,
    enviada_por: sessao.sub,
  });
  if (error) {
    await bucket.remove([caminho, caminhoMini(caminho)]);
    return { erro: "Falha ao registrar a foto." };
  }
  revalidatePath("/", "layout");
  return {};
}

// REQ-06, critério 3, e RNF-03: excluir apaga de vez
export async function excluirFoto(id: string): Promise<{ erro?: string }> {
  await exigirSessao();
  if (!UUID.test(id)) return { erro: "Foto inválida." };
  const { data } = await db().from("fotos").select("caminho").eq("id", id).maybeSingle();
  if (!data) return {};
  await db().storage.from(BUCKET_FOTOS).remove([data.caminho, caminhoMini(data.caminho)]);
  await db().from("fotos").delete().eq("id", id);
  revalidatePath("/", "layout");
  return {};
}

// RNF-03: excluir a memória apaga também as fotos; o plano continua em "já fizemos"
export async function excluirMemoria(id: string): Promise<{ erro?: string }> {
  await exigirSessao();
  if (!UUID.test(id)) return { erro: "Memória inválida." };
  const { data } = await db().from("fotos").select("caminho").eq("memoria_id", id);
  const caminhos = (data ?? []).flatMap((f) => [f.caminho, caminhoMini(f.caminho)]);
  if (caminhos.length) await db().storage.from(BUCKET_FOTOS).remove(caminhos);
  await db().from("memorias").delete().eq("id", id);
  revalidatePath("/", "layout");
  return {};
}

// REQ-11, critério 3: próxima página da galeria
export async function maisFotos(pagina: number): Promise<PaginaGaleria> {
  await exigirSessao();
  return listarGaleria(Math.max(0, Math.floor(pagina)));
}
