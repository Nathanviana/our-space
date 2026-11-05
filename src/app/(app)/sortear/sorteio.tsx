"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { Tema } from "@/lib/types";
import { tituloDoPlano } from "@/lib/types";
import { sortear, type ResultadoSorteio } from "../planos/actions";

// REQ-04: sorteio com filtro por tema e "sortear de novo"
export function Sorteio({ temas, temaInicial }: { temas: Tema[]; temaInicial: string | null }) {
  const [tema, setTema] = useState(temaInicial ?? "");
  const [resultado, setResultado] = useState<ResultadoSorteio | null>(null);
  const [rodada, setRodada] = useState(0);
  const [girando, iniciar] = useTransition();

  function girar() {
    iniciar(async () => {
      const [r] = await Promise.all([sortear(tema || null), new Promise((ok) => setTimeout(ok, 700))]);
      setResultado(r);
      setRodada((n) => n + 1);
    });
  }

  const temaDoPlano = resultado?.plano && temas.find((t) => t.id === resultado.plano!.temaId);

  return (
    <>
      <div className="card formulario">
        <label>
          Tema
          <select value={tema} onChange={(e) => setTema(e.target.value)}>
            <option value="">Todos os temas</option>
            {temas.map((t) => (
              <option key={t.id} value={t.id}>{t.icone} {t.nome}</option>
            ))}
          </select>
        </label>
        <button className="botao" onClick={girar} disabled={girando}>
          {girando ? "Sorteando..." : resultado?.plano ? "Sortear de novo" : "Sortear"}
        </button>
      </div>

      <div className={`sorteio-palco ${girando ? "girando" : ""}`} aria-live="polite">
        {girando && <div className="sorteio-dado" aria-hidden>✦</div>}
        {!girando && resultado?.erro && <p className="vazio">{resultado.erro}</p>}
        {!girando && resultado?.plano && (
          <Link key={rodada} href={`/planos/${resultado.plano.id}`} className="card sorteio-resultado">
            <span className="rotulo">O próximo programa é</span>
            <span className="sorteio-titulo">{tituloDoPlano(resultado.plano)}</span>
            {temaDoPlano && <span className="item-meta">{temaDoPlano.icone} {temaDoPlano.nome}</span>}
            <span className="link">Ver o plano ›</span>
          </Link>
        )}
      </div>
    </>
  );
}
