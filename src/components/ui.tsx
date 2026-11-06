import Link from "next/link";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import type { Plano, Tema } from "@/lib/types";
import { tituloDoPlano } from "@/lib/types";
import { tom } from "@/lib/tom";

// Cabeçalho das telas internas: título em serifa, como na Início
export function Cabecalho({ titulo, subtitulo, voltar }: { titulo: string; subtitulo?: string; voltar?: string }) {
  return (
    <header className="cabecalho">
      {voltar && (
        <Link href={voltar} className="voltar">
          <ChevronLeft size={18} aria-hidden /> Voltar
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
  const capa = plano.previa?.imagem;
  return (
    <Link href={href ?? `/planos/${plano.id}`} className="card item">
      {capa ? (
        // Imagem da página do link (outro site): sem otimizador e sem enviar de onde veio
        // eslint-disable-next-line @next/next/no-img-element
        <img className="item-capa" src={capa} alt="" loading="lazy" referrerPolicy="no-referrer" />
      ) : (
        <span className={`item-icone ${tom(indiceTema)}`} aria-hidden>{tema?.icone ?? "•"}</span>
      )}
      <span className="item-texto">
        <span className="item-titulo">{tituloDoPlano(plano)}</span>
        <span className="item-meta">
          {meta ?? [tema?.nome, plano.previa?.site].filter(Boolean).join(" · ")}
        </span>
      </span>
      <ChevronRight aria-hidden className="item-seta" size={20} />
    </Link>
  );
}

export function Vazio({ texto }: { texto: string }) {
  return (
    <p className="vazio vazio-card">
      <Sparkles size={18} aria-hidden />
      {texto}
    </p>
  );
}
