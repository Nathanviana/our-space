"use client";
// Base do mapa com Leaflet e OpenStreetMap (PRD v3 7.3, DC4)
import type * as L from "leaflet";

export type Leaflet = typeof L;

export const CENTRO_BRASIL: [number, number] = [-15.78, -47.93];

export async function carregarLeaflet(): Promise<Leaflet> {
  const leaflet = await import("leaflet");
  return leaflet.default ?? leaflet;
}

export function criarMapa(Lf: Leaflet, el: HTMLElement, centro: [number, number], zoom: number) {
  const mapa = Lf.map(el, { zoomControl: false, attributionControl: true }).setView(centro, zoom);
  Lf.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(mapa);
  Lf.control.zoom({ position: "bottomright" }).addTo(mapa);
  return mapa;
}

// Ponto em formato de gota, nas cores da identidade
export function iconePonto(Lf: Leaflet, cor: string, conteudo = "") {
  return Lf.divIcon({
    className: "ponto-mapa",
    html: `<span class="ponto" style="--cor:${cor}">${conteudo}</span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -30],
  });
}

export interface ResultadoBusca {
  nome: string;
  latitude: number;
  longitude: number;
}

// Nominatim: só quando a pessoa pede (sem autocompletar), conforme a política de uso
export async function buscarEndereco(texto: string): Promise<ResultadoBusca[]> {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&accept-language=pt-BR&q=${encodeURIComponent(texto)}`;
  const r = await fetch(url, { headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error("Busca indisponível");
  const dados = (await r.json()) as { display_name: string; lat: string; lon: string; name?: string }[];
  return dados.map((d) => ({ nome: d.name || d.display_name.split(",")[0], latitude: Number(d.lat), longitude: Number(d.lon) }));
}

export async function nomeDoPonto(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=17&accept-language=pt-BR&lat=${lat}&lon=${lng}`;
    const r = await fetch(url, { headers: { Accept: "application/json" } });
    if (!r.ok) return null;
    const d = (await r.json()) as { name?: string; display_name?: string };
    return d.name || d.display_name?.split(",").slice(0, 2).join(",") || null;
  } catch {
    return null;
  }
}
