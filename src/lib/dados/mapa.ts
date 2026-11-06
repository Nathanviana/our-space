import "server-only";
import { db } from "@/lib/db";
import { tituloDoPlano } from "@/lib/types";
import { assinarFotos } from "./memorias";

export type TipoPonto = "vamos_fazer" | "ja_fizemos" | "foto";

export interface PontoMapa {
  id: string;
  tipo: TipoPonto;
  latitude: number;
  longitude: number;
  titulo: string;
  subtitulo: string | null;
  href: string;
  urlMini?: string;
  qtdFotos?: number;
  memoriaId?: string;
}

const temPonto = (lat: number | null, lng: number | null) => lat !== null && lng !== null;

// REQ-12: lugares dos planos e das memórias, e as fotos no lugar (DC3)
export async function pontosDoMapa(): Promise<PontoMapa[]> {
  const { data, error } = await db()
    .from("planos")
    .select(
      "id, titulo, link, previa_titulo, situacao, lugar_nome, latitude, longitude, memorias(id, lugar_nome, latitude, longitude, fotos(id, memoria_id, caminho, latitude, longitude, tirada_em, enviada_em))",
    );
  if (error) throw error;

  const pontos: PontoMapa[] = [];
  const fotosParaAssinar: { linha: Parameters<typeof assinarFotos>[0][number]; lat: number; lng: number; titulo: string; memoriaId: string }[] = [];

  for (const p of data ?? []) {
    const titulo = tituloDoPlano(p);
    const mRaw = p.memorias as unknown;
    const m = (Array.isArray(mRaw) ? mRaw[0] : mRaw) as
      | { id: string; lugar_nome: string | null; latitude: number | null; longitude: number | null; fotos: Parameters<typeof assinarFotos>[0] }
      | null;

    if (p.situacao === "vamos_fazer") {
      if (temPonto(p.latitude, p.longitude)) {
        pontos.push({ id: p.id, tipo: "vamos_fazer", latitude: p.latitude!, longitude: p.longitude!, titulo, subtitulo: p.lugar_nome, href: `/planos/${p.id}` });
      }
      continue;
    }

    // Já fizemos: vale o lugar da memória; sem ele, o lugar do plano
    const lat = m && temPonto(m.latitude, m.longitude) ? m.latitude! : p.latitude;
    const lng = m && temPonto(m.latitude, m.longitude) ? m.longitude! : p.longitude;
    const nome = m?.lugar_nome ?? p.lugar_nome;
    const fotos = m?.fotos ?? [];
    const semLocalProprio = fotos.filter((f) => !temPonto(f.latitude, f.longitude));

    if (temPonto(lat, lng)) {
      pontos.push({
        id: m?.id ?? p.id,
        tipo: "ja_fizemos",
        latitude: lat!,
        longitude: lng!,
        titulo,
        subtitulo: nome,
        href: m ? `/memorias/${m.id}` : `/planos/${p.id}`,
        qtdFotos: semLocalProprio.length,
        memoriaId: m?.id,
      });
      // Fotos sem localização própria ficam no lugar da memória (a primeira vira a capa do ponto)
      if (m && semLocalProprio[0]) fotosParaAssinar.push({ linha: semLocalProprio[0], lat: lat!, lng: lng!, titulo, memoriaId: m.id });
    }
    // Fotos com localização própria aparecem onde foram tiradas
    for (const f of fotos) {
      if (m && temPonto(f.latitude, f.longitude)) {
        fotosParaAssinar.push({ linha: f, lat: f.latitude!, lng: f.longitude!, titulo, memoriaId: m.id });
      }
    }
  }

  const assinadas = await assinarFotos(fotosParaAssinar.map((f) => f.linha));
  assinadas.forEach((f, i) => {
    const ref = fotosParaAssinar[i];
    const capa = !temPonto(ref.linha.latitude, ref.linha.longitude);
    if (capa) {
      // capa do ponto "já fizemos"
      const ponto = pontos.find((p) => p.tipo === "ja_fizemos" && p.memoriaId === ref.memoriaId);
      if (ponto) ponto.urlMini = f.urlMini;
      return;
    }
    pontos.push({
      id: f.id,
      tipo: "foto",
      latitude: ref.lat,
      longitude: ref.lng,
      titulo: ref.titulo,
      subtitulo: "Foto tirada aqui",
      href: `/memorias/${ref.memoriaId}`,
      urlMini: f.urlMini,
      memoriaId: ref.memoriaId,
    });
  });

  return pontos;
}
