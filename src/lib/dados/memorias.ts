import "server-only";
import { BUCKET_FOTOS, db } from "@/lib/db";
import { tituloDoPlano, type Foto, type Memoria } from "@/lib/types";

const VALIDADE_URL_S = 60 * 60; // URLs assinadas de 1 hora (RNF-02)

export const caminhoMini = (caminho: string) => caminho.replace(/\.jpg$/, "_mini.jpg");

interface LinhaFoto {
  id: string;
  memoria_id: string;
  caminho: string;
  latitude: number | null;
  longitude: number | null;
  tirada_em: string | null;
  enviada_em: string;
}

export interface FotoComMini extends Foto {
  urlMini: string;
}

// Gera URLs assinadas de curta duração para as fotos e as miniaturas
export async function assinarFotos(linhas: LinhaFoto[]): Promise<FotoComMini[]> {
  if (!linhas.length) return [];
  const caminhos = linhas.flatMap((l) => [l.caminho, caminhoMini(l.caminho)]);
  const { data, error } = await db().storage.from(BUCKET_FOTOS).createSignedUrls(caminhos, VALIDADE_URL_S);
  if (error) throw error;
  const url = new Map((data ?? []).map((d) => [d.path, d.signedUrl]));
  return linhas.map((l) => ({
    id: l.id,
    memoriaId: l.memoria_id,
    caminho: l.caminho,
    url: url.get(l.caminho) ?? "",
    urlMini: url.get(caminhoMini(l.caminho)) ?? url.get(l.caminho) ?? "",
    latitude: l.latitude,
    longitude: l.longitude,
    tiradaEm: l.tirada_em,
    enviadaEm: l.enviada_em,
  }));
}

const CAMPOS_FOTO = "id, memoria_id, caminho, latitude, longitude, tirada_em, enviada_em";

export interface MemoriaCompleta extends Omit<Memoria, "fotos"> {
  fotos: FotoComMini[];
}

export async function buscarMemoria(id: string): Promise<MemoriaCompleta | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  return buscarMemoriaPor("id", id);
}

export async function buscarMemoriaDoPlano(planoId: string): Promise<MemoriaCompleta | null> {
  if (!/^[0-9a-f-]{36}$/i.test(planoId)) return null;
  return buscarMemoriaPor("plano_id", planoId);
}

async function buscarMemoriaPor(campo: "id" | "plano_id", valor: string): Promise<MemoriaCompleta | null> {
  const { data, error } = await db()
    .from("memorias")
    .select(`id, plano_id, frase, musica_link, lugar_nome, latitude, longitude, data, registrada_por, fotos(${CAMPOS_FOTO})`)
    .eq(campo, valor)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const fotos = ((data.fotos ?? []) as LinhaFoto[]).sort((a, b) =>
    (a.tirada_em ?? a.enviada_em).localeCompare(b.tirada_em ?? b.enviada_em),
  );
  return {
    id: data.id,
    planoId: data.plano_id,
    frase: data.frase,
    musicaLink: data.musica_link,
    lugar: { nome: data.lugar_nome, latitude: data.latitude, longitude: data.longitude },
    data: data.data,
    registradaPor: data.registrada_por,
    fotos: await assinarFotos(fotos),
  };
}

export interface PaginaGaleria {
  fotos: (FotoComMini & { titulo: string })[];
  proxima: number | null;
}

// Galeria (REQ-11): mais recentes primeiro, carregando aos poucos
// temaId: só fotos de memórias de planos desse tema
export async function listarGaleria(pagina: number, porPagina = 30, temaId?: string | null): Promise<PaginaGaleria> {
  const inicio = pagina * porPagina;
  const porTema = !!temaId && /^[0-9a-f-]{36}$/i.test(temaId);
  let q = db()
    .from("fotos")
    .select(porTema ? `${CAMPOS_FOTO}, memorias!inner(planos!inner(titulo, link, previa_titulo, tema_id))` : `${CAMPOS_FOTO}, memorias(planos(titulo, link, previa_titulo))`);
  if (porTema) q = q.eq("memorias.planos.tema_id", temaId);
  const { data, error } = await q
    .order("tirada_em", { ascending: false, nullsFirst: false })
    .order("enviada_em", { ascending: false })
    .range(inicio, inicio + porPagina);
  if (error) throw error;
  const linhas = (data ?? []) as unknown as (LinhaFoto & { memorias: { planos: { titulo: string | null; link: string | null; previa_titulo: string | null } } })[];
  const temMais = linhas.length > porPagina;
  const pagina_ = linhas.slice(0, porPagina);
  const assinadas = await assinarFotos(pagina_);
  return {
    fotos: assinadas.map((f, i) => {
      const p = pagina_[i].memorias?.planos;
      return { ...f, titulo: p ? tituloDoPlano(p) : "" };
    }),
    proxima: temMais ? pagina + 1 : null,
  };
}
