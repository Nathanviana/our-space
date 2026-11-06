"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export interface FotoVisor {
  id: string;
  url: string;
  urlMini: string;
  memoriaId: string;
  legenda?: string;
}

// Foto em tela cheia: deslizar, setas do teclado e Esc para fechar
export function VisorTelaCheia({
  fotos,
  indice,
  aoMudar,
  comAtalho = false,
}: {
  fotos: FotoVisor[];
  indice: number | null;
  aoMudar: (i: number | null) => void;
  comAtalho?: boolean;
}) {
  const fechar = useCallback(() => aoMudar(null), [aoMudar]);
  const mover = useCallback(
    (d: number) => indice !== null && aoMudar((indice + d + fotos.length) % fotos.length),
    [indice, aoMudar, fotos.length],
  );
  const toqueX = useRef(0);

  useEffect(() => {
    if (indice === null) return;
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
  }, [indice, fechar, mover]);

  const atual = indice !== null ? fotos[indice] : null;
  if (!atual) return null;
  return (
    <div
      className="visor"
      role="dialog"
      aria-modal="true"
      aria-label="Foto em tela cheia"
      onClick={fechar}
      onTouchStart={(e) => (toqueX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - toqueX.current;
        if (Math.abs(dx) > 50) mover(dx < 0 ? 1 : -1);
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={atual.url} alt="" onClick={(e) => e.stopPropagation()} />
      {fotos.length > 1 && (
        <>
          <button className="visor-seta esquerda" aria-label="Foto anterior" onClick={(e) => (e.stopPropagation(), mover(-1))}>
            <ChevronLeft size={26} />
          </button>
          <button className="visor-seta direita" aria-label="Próxima foto" onClick={(e) => (e.stopPropagation(), mover(1))}>
            <ChevronRight size={26} />
          </button>
        </>
      )}
      <div className="visor-barra" onClick={(e) => e.stopPropagation()}>
        <button onClick={fechar} aria-label="Fechar"><X size={20} /></button>
        <span>{atual.legenda || `${indice! + 1} de ${fotos.length}`}</span>
        {comAtalho && (
          <Link href={`/memorias/${atual.memoriaId}`}>
            Ver memória <ChevronRight size={15} aria-hidden />
          </Link>
        )}
      </div>
    </div>
  );
}

// Grade de miniaturas que abre a foto em tela cheia (REQ-11, critério 2)
export function VisorFotos({ fotos, comAtalho = false }: { fotos: FotoVisor[]; comAtalho?: boolean }) {
  const [aberta, setAberta] = useState<number | null>(null);
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
      <VisorTelaCheia fotos={fotos} indice={aberta} aoMudar={setAberta} comAtalho={comAtalho} />
    </>
  );
}
