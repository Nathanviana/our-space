"use client";

import { Camera, LocateFixed } from "lucide-react";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import type { Map as MapaLeaflet, Marker } from "leaflet";
import type { Lugar } from "@/lib/types";
import {
  CENTRO_BRASIL,
  buscarEndereco,
  carregarLeaflet,
  criarMapa,
  iconePonto,
  nomeDoPonto,
  type Leaflet,
  type ResultadoBusca,
} from "./mapa-base";

// Escolher o lugar no mapa (REQ-09): tocar no mapa, buscar o endereço ou usar a localização atual
export function EscolherLugar({
  valor,
  aoMudar,
  sugestao,
}: {
  valor: Lugar;
  aoMudar: (l: Lugar) => void;
  sugestao?: { latitude: number; longitude: number } | null;
}) {
  const el = useRef<HTMLDivElement>(null);
  const mapa = useRef<MapaLeaflet | null>(null);
  const marcador = useRef<Marker | null>(null);
  const Lf = useRef<Leaflet | null>(null);
  const valorRef = useRef(valor);
  valorRef.current = valor;
  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState<ResultadoBusca[]>([]);
  const [aviso, setAviso] = useState<string | null>(null);

  async function marcar(lat: number, lng: number, nome?: string | null) {
    const L = Lf.current;
    if (!L || !mapa.current) return;
    if (!marcador.current) marcador.current = L.marker([lat, lng], { icon: iconePonto(L, "var(--azul-forte)", "♡") }).addTo(mapa.current);
    else marcador.current.setLatLng([lat, lng]);
    mapa.current.setView([lat, lng], Math.max(mapa.current.getZoom(), 15));
    const nomeFinal = nome ?? (valorRef.current.nome || (await nomeDoPonto(lat, lng)));
    aoMudar({ nome: nomeFinal ?? null, latitude: lat, longitude: lng });
  }

  useEffect(() => {
    let vivo = true;
    carregarLeaflet().then((L) => {
      if (!vivo || !el.current || mapa.current) return;
      Lf.current = L;
      const temPonto = valor.latitude !== null && valor.longitude !== null;
      const centro: [number, number] = temPonto ? [valor.latitude!, valor.longitude!] : CENTRO_BRASIL;
      mapa.current = criarMapa(L, el.current, centro, temPonto ? 15 : 4);
      if (temPonto) marcador.current = L.marker(centro, { icon: iconePonto(L, "var(--azul-forte)", "♡") }).addTo(mapa.current);
      mapa.current.on("click", (e) => marcar(e.latlng.lat, e.latlng.lng, null));
    });
    return () => {
      vivo = false;
      mapa.current?.remove();
      mapa.current = null;
      marcador.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function pesquisar() {
    if (busca.trim().length < 3) return;
    setAviso(null);
    try {
      const r = await buscarEndereco(busca);
      setResultados(r);
      if (!r.length) setAviso("Nenhum lugar encontrado.");
    } catch {
      setAviso("A busca está indisponível agora. Toque no mapa para marcar.");
    }
  }

  function minhaLocalizacao() {
    if (!navigator.geolocation) return setAviso("Seu navegador não informa a localização.");
    navigator.geolocation.getCurrentPosition(
      (p) => marcar(p.coords.latitude, p.coords.longitude, null),
      () => setAviso("Não foi possível pegar a localização."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  function limpar() {
    marcador.current?.remove();
    marcador.current = null;
    aoMudar({ nome: null, latitude: null, longitude: null });
  }

  return (
    <div className="escolher-lugar">
      <div className="busca">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              pesquisar();
            }
          }}
          placeholder="Buscar um lugar"
          aria-label="Buscar um lugar"
        />
        <button type="button" className="botao secundario" onClick={pesquisar}>Buscar</button>
      </div>
      {resultados.length > 0 && (
        <ul className="resultados">
          {resultados.map((r, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => {
                  setResultados([]);
                  marcar(r.latitude, r.longitude, r.nome);
                }}
              >
                {r.nome}
              </button>
            </li>
          ))}
        </ul>
      )}
      <div ref={el} className="mapa-escolha" aria-label="Mapa: toque para marcar o lugar" />
      <div className="chips">
        <button type="button" className="chip" onClick={minhaLocalizacao}><LocateFixed size={16} aria-hidden /> Estou aqui</button>
        {sugestao && (
          <button type="button" className="chip" onClick={() => marcar(sugestao.latitude, sugestao.longitude, null)}>
            <Camera size={16} aria-hidden /> Lugar da foto
          </button>
        )}
        {valor.latitude !== null && (
          <button type="button" className="chip" onClick={limpar}>Tirar o lugar</button>
        )}
      </div>
      <label>
        Nome do lugar
        <input
          value={valor.nome ?? ""}
          onChange={(e) => aoMudar({ ...valor, nome: e.target.value })}
          maxLength={160}
          placeholder="Ex.: aquela pracinha"
        />
      </label>
      {aviso && <p className="item-meta">{aviso}</p>}
    </div>
  );
}
