import Link from "next/link";
import type { Plano, Tema } from "@/lib/types";
import { tituloDoPlano } from "@/lib/types";
import { tom } from "@/lib/tom";

export function Cabecalho({ titulo, subtitulo, voltar }: { titulo: string; subtitulo?: string; voltar?: string }) {
  return (
    <header className="cabecalho">
      {voltar && (
        <Link href={voltar} className="voltar" aria-label="Voltar">
          ‹ Voltar
        </Link>
      )}
      <h1>{titulo}</h1>
      {subtitulo && <p className="subtitulo">{subtitulo}</p>}
    </header>
  );
}

export function PlanoItem({
  plano,
  tema,
  indiceTema = 0,
  href,
  meta,
}: {
  plano: Plano;
  tema?: Tema;
  indiceTema?: number;
  href?: string;
  meta?: string;
}) {
  return (
    <Link href={href ?? `/planos/${plano.id}`} className="card item">
      <span className={`item-icone ${tom(indiceTema)}`} aria-hidden>{tema?.icone ?? "•"}</span>
      <span className="item-texto">
        <span className="item-titulo">{tituloDoPlano(plano)}</span>
        <span className="item-meta">
          {meta ?? (
            <>
              {tema?.nome}
              {plano.link ? " · com link" : ""}
            </>
          )}
        </span>
      </span>
      <span aria-hidden className="item-seta">›</span>
    </Link>
  );
}

export function Vazio({ texto }: { texto: string }) {
  return <p className="vazio">{texto}</p>;
}
