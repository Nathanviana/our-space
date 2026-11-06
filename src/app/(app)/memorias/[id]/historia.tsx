"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useReduzirMovimento } from "@/components/movimento";
import { VisorTelaCheia, type FotoVisor } from "@/components/visor-fotos";

const TEMPO_FOTO_MS = 5000;

// Capa da memória como uma história: fotos passando sozinhas, barras de progresso e o título por cima
export function HistoriaCapa({
  fotos,
  titulo,
  data,
  tema,
  voltar,
}: {
  fotos: FotoVisor[];
  titulo: string;
  data: string;
  tema: string | null;
  voltar: string;
}) {
  const reduzir = useReduzirMovimento();
  const trilho = useRef<HTMLDivElement>(null);
  const [atual, setAtual] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [aberta, setAberta] = useState<number | null>(null);
  const rodando = !reduzir && !pausado && aberta === null && fotos.length > 1;

  const irPara = (i: number) => {
    const el = trilho.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: reduzir ? "auto" : "smooth" });
  };

  // Avança sozinho; para na última foto
  useEffect(() => {
    if (!rodando) return;
    if (atual >= fotos.length - 1) return;
    const id = setTimeout(() => irPara(atual + 1), TEMPO_FOTO_MS);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rodando, atual, fotos.length]);

  function aoRolar() {
    const el = trilho.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== atual) setAtual(i);
  }

  return (
    <header className={`historia-capa ${fotos.length ? "" : "sem-fotos"}`}>
      {fotos.length > 0 && (
        <div ref={trilho} className="historia-trilho" onScroll={aoRolar} onPointerDown={() => setPausado(true)}>
          {fotos.map((f, i) => (
            <button key={f.id} className="historia-slide" onClick={() => setAberta(i)} aria-label={`Abrir foto ${i + 1} de ${fotos.length}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.url} alt="" loading={i < 2 ? "eager" : "lazy"} decoding="async" />
            </button>
          ))}
        </div>
      )}

      <div className="historia-topo">
        {fotos.length > 1 && (
          <div className="historia-barras" aria-hidden>
            {fotos.map((f, i) => (
              <span key={f.id} className={i < atual ? "cheia" : ""}>
                {i === atual && <i key={`${atual}-${rodando}`} className={rodando ? "enchendo" : "parada"} />}
              </span>
            ))}
          </div>
        )}
        <div className="historia-acoes">
          <Link href={voltar} className="historia-voltar">
            <ChevronLeft size={18} aria-hidden /> Voltar
          </Link>
          {fotos.length > 1 && <span className="historia-contador">{atual + 1}/{fotos.length}</span>}
        </div>
      </div>

      <div className="historia-legenda">
        <span className="historia-data">{[data, tema].filter(Boolean).join(" · ")}</span>
        <h1>{titulo}</h1>
      </div>

      <VisorTelaCheia fotos={fotos} indice={aberta} aoMudar={setAberta} />
    </header>
  );
}
