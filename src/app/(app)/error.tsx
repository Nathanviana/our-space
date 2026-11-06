"use client";

import Link from "next/link";
import { useEffect } from "react";
import { CloudOff, RotateCcw } from "lucide-react";

// Erro em qualquer tela do casal: explica sem jargão e oferece tentar de novo
export default function Erro({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="tela-aviso">
      <div className="card">
        <span className="tela-aviso-icone" aria-hidden><CloudOff size={26} /></span>
        <h1>Algo saiu do lugar</h1>
        <p>Não conseguimos carregar esta tela agora. Pode ser a internet ou o servidor demorando para responder.</p>
        <div className="acoes">
          <Link href="/" className="botao secundario">Início</Link>
          <button type="button" className="botao" onClick={reset}>
            <RotateCcw size={16} aria-hidden /> Tentar de novo
          </button>
        </div>
      </div>
    </div>
  );
}
