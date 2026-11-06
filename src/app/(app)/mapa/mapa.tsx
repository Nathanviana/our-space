"use client";

import Link from "next/link";
import { Camera, Heart, Star, Trophy } from "lucide-react";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import type { LayerGroup, Map as MapaLeaflet, Marker } from "leaflet";
import { CENTRO_BRASIL, carregarLeaflet, criarMapa, iconePonto, type Leaflet } from "@/components/mapa-base";
import type { PontoMapa, TipoPonto } from "@/lib/dados/mapa";

const FILTROS: { valor: TipoPonto | "tudo"; rotulo: string; icone?: typeof Star }[] = [
  { valor: "tudo", rotulo: "Tudo" },
  { valor: "vamos_fazer", rotulo: "Vamos fazer", icone: Star },
  { valor: "ja_fizemos", rotulo: "Já fizemos", icone: Heart },
  { valor: "foto", rotulo: "Fotos", icone: Camera },
];

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function icone(L: Leaflet, p: PontoMapa) {
  if (p.urlMini) {
    const badge = p.qtdFotos && p.qtdFotos > 1 ? `<b>${p.qtdFotos}</b>` : "";
    return L.divIcon({
      className: "ponto-mapa",
      html: `<span class="ponto-foto ${p.tipo}" style="background-image:url('${esc(p.urlMini)}')">${badge}</span>`,
      iconSize: [48, 48],
      iconAnchor: [24, 24],
      popupAnchor: [0, -22],
    });
  }
  return p.tipo === "vamos_fazer" ? iconePonto(L, "var(--amarelo-forte)", "☆") : iconePonto(L, "var(--verde-forte)", "♡");
}

function popup(p: PontoMapa) {
  const rotulo = p.tipo === "vamos_fazer" ? "Vamos fazer" : p.tipo === "ja_fizemos" ? "Já fizemos" : "Foto";
  return `<a class="popup" href="${esc(p.href)}"><small>${rotulo}</small><strong>${esc(p.titulo)}</strong>${
    p.subtitulo ? `<span>${esc(p.subtitulo)}</span>` : ""
  }<em>Abrir ›</em></a>`;
}

// Tela Mapa (REQ-12): pontos de "vamos fazer" e "já fizemos" em cores diferentes, fotos no lugar
export function Mapa({ pontos, foco }: { pontos: PontoMapa[]; foco: string | null }) {
  const el = useRef<HTMLDivElement>(null);
  const mapa = useRef<MapaLeaflet | null>(null);
  const camada = useRef<LayerGroup | null>(null);
  const Lf = useRef<Leaflet | null>(null);
  const [filtro, setFiltro] = useState<TipoPonto | "tudo">("tudo");
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    let vivo = true;
    carregarLeaflet().then((L) => {
      if (!vivo || !el.current || mapa.current) return;
      Lf.current = L;
      mapa.current = criarMapa(L, el.current, CENTRO_BRASIL, 4);
      camada.current = L.layerGroup().addTo(mapa.current);
      setPronto(true);
    });
    return () => {
      vivo = false;
      mapa.current?.remove();
      mapa.current = null;
    };
  }, []);

  useEffect(() => {
    const L = Lf.current;
    if (!pronto || !L || !mapa.current || !camada.current) return;
    camada.current.clearLayers();
    const visiveis = pontos.filter((p) => filtro === "tudo" || p.tipo === filtro);
    let focado: Marker | null = null;
    for (const p of visiveis) {
      const m = L.marker([p.latitude, p.longitude], { icon: icone(L, p), zIndexOffset: p.tipo === "foto" ? 0 : 100 })
        .bindPopup(popup(p), { closeButton: false })
        .addTo(camada.current);
      if (foco && p.memoriaId === foco && p.tipo !== "foto") focado = m;
    }
    if (focado) {
      mapa.current.setView(focado.getLatLng(), 16);
      focado.openPopup();
    } else if (visiveis.length === 1) {
      mapa.current.setView([visiveis[0].latitude, visiveis[0].longitude], 15);
    } else if (visiveis.length > 1) {
      mapa.current.fitBounds(L.latLngBounds(visiveis.map((p) => [p.latitude, p.longitude])), { padding: [48, 48], maxZoom: 16 });
    }
  }, [pronto, pontos, filtro, foco]);

  const contagem = (t: TipoPonto | "tudo") => (t === "tudo" ? pontos.length : pontos.filter((p) => p.tipo === t).length);

  return (
    <div className="mapa-tela">
      <div ref={el} className="mapa-cheio" aria-label="Mapa dos lugares do casal" />
      <div className="mapa-topo">
        <div className="mapa-cabeca">
          <h1>Mapa</h1>
          <Link href="/mapa/conquistas" className="chip conquistas-atalho">
            <Trophy size={15} aria-hidden /> Conquistas
          </Link>
        </div>
        <div className="chips filtros" role="tablist">
          {FILTROS.map((f) => (
            <button
              key={f.valor}
              role="tab"
              aria-selected={filtro === f.valor}
              className={`chip ${filtro === f.valor ? "ativo" : ""}`}
              onClick={() => setFiltro(f.valor)}
            >
              {f.icone && <f.icone size={15} aria-hidden />} {f.rotulo} <span className="contagem">{contagem(f.valor)}</span>
            </button>
          ))}
        </div>
      </div>
      {pontos.length === 0 && (
        <p className="card mapa-vazio">
          Ainda não há lugares. Marque o lugar ao registrar uma memória ou ao adicionar um plano.
        </p>
      )}
    </div>
  );
}
