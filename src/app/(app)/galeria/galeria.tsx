"use client";

import { useState, useTransition } from "react";
import { VisorFotos, type FotoVisor } from "@/components/visor-fotos";
import { maisFotos } from "../memorias/actions";

export function Galeria({ inicial, proxima }: { inicial: FotoVisor[]; proxima: number | null }) {
  const [fotos, setFotos] = useState(inicial);
  const [pagina, setPagina] = useState(proxima);
  const [carregando, iniciar] = useTransition();

  function carregarMais() {
    if (pagina === null) return;
    iniciar(async () => {
      const r = await maisFotos(pagina);
      setFotos((f) => [...f, ...r.fotos.map((x) => ({ ...x, legenda: x.titulo }))]);
      setPagina(r.proxima);
    });
  }

  return (
    <>
      <VisorFotos fotos={fotos} comAtalho />
      {pagina !== null && (
        <button className="botao secundario" onClick={carregarMais} disabled={carregando}>
          {carregando ? "Carregando..." : "Ver mais fotos"}
        </button>
      )}
    </>
  );
}
