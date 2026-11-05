"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

export interface FotoVisor {
  id: string;
  url: string;
  urlMini: string;
  memoriaId: string;
  legenda?: string;
}

// Grade de miniaturas que abre a foto em tela cheia (REQ-11, critério 2)
export function VisorFotos({ fotos, comAtalho = false }: { fotos: FotoVisor[]; comAtalho?: boolean }) {
  const [aberta, setAberta] = useState<number | null>(null);
  const fechar = useCallback(() => setAberta(null), []);
  const mover = useCallback(
    (d: number) => setAberta((i) => (i === null ? null : (i + d + fotos.length) % fotos.length)),
    [fotos.length],
  );

  useEffect(() => {
    if (aberta === null) return;
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") fechar();
      if (e.key === "ArrowRight") mover(1);
      if (e.key === "ArrowLeft") mover(-1);
    };
    document.addEventListener("keydown", tecla);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", tecla);
      document.body.style.overflow = "";
    };
  }, [aberta, fechar, mover]);

  const atual = aberta !== null ? fotos[aberta] : null;
  const toqueX = useRef(0);

  return (
    <>
      <div className="grade-galeria">
        {fotos.map((f, i) => (
          <button key={f.id} className="galeria-item" onClick={() => setAberta(i)} aria-label="Abrir foto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={f.urlMini} alt="" loading="lazy" decoding="async" />
          </button>
        ))}
      </div>
      {atual && (
        <div
          className="visor"
          role="dialog"
          aria-modal="true"
          onClick={fechar}
          onTouchStart={(e) => (toqueX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            const dx = e.changedTouches[0].clientX - toqueX.current;
            if (Math.abs(dx) > 50) mover(dx < 0 ? 1 : -1);
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={atual.url} alt="" onClick={(e) => e.stopPropagation()} />
          <div className="visor-barra" onClick={(e) => e.stopPropagation()}>
            <button onClick={fechar} aria-label="Fechar">✕</button>
            <span>{atual.legenda}</span>
            {comAtalho && <Link href={`/memorias/${atual.memoriaId}`}>Ver memória ›</Link>}
          </div>
        </div>
      )}
    </>
  );
}
