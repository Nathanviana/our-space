"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { VisorTelaCheia, type FotoVisor } from "@/components/visor-fotos";
import { agruparPorMes } from "@/lib/galeria";
import { maisFotos } from "../memorias/actions";

type FotoGaleria = FotoVisor & { tiradaEm: string | null; enviadaEm: string };

// Fotos separadas por mês; as próximas carregam sozinhas ao chegar perto do fim
export function Galeria({ inicial, proxima, temaId }: { inicial: FotoGaleria[]; proxima: number | null; temaId: string | null }) {
  const [fotos, setFotos] = useState(inicial);
  const [pagina, setPagina] = useState(proxima);
  const [aberta, setAberta] = useState<number | null>(null);
  const [carregando, iniciar] = useTransition();
  const fim = useRef<HTMLDivElement>(null);

  const grupos = useMemo(() => agruparPorMes(fotos.map((f, i) => ({ ...f, indice: i }))), [fotos]);

  useEffect(() => {
    const el = fim.current;
    if (!el || pagina === null) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || carregando) return;
        iniciar(async () => {
          const r = await maisFotos(pagina, temaId);
          setFotos((f) => [...f, ...r.fotos.map((x) => ({ ...x, legenda: x.titulo }))]);
          setPagina(r.proxima);
        });
      },
      { rootMargin: "600px 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [pagina, temaId, carregando]);

  return (
    <>
      {grupos.map((g) => (
        <section key={g.chave} className="mes-galeria" aria-label={g.titulo}>
          <h2 className="mes-titulo">
            {g.titulo} <span className="contagem">{g.fotos.length}</span>
          </h2>
          <div className="grade-galeria">
            {g.fotos.map((f) => (
              <button key={f.id} className="galeria-item" onClick={() => setAberta(f.indice)} aria-label={`Abrir foto${f.legenda ? `: ${f.legenda}` : ""}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.urlMini} alt="" loading="lazy" decoding="async" />
              </button>
            ))}
          </div>
        </section>
      ))}
      <div ref={fim} className="galeria-fim" aria-live="polite">
        {pagina !== null ? (carregando ? "Carregando mais fotos…" : "") : fotos.length > 12 ? "Vocês chegaram ao começo de tudo ♡" : ""}
      </div>
      <VisorTelaCheia fotos={fotos} indice={aberta} aoMudar={setAberta} comAtalho />
    </>
  );
}
