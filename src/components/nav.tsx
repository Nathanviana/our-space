"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Menu fixo em todas as telas (RNF-06, DC1; PRD v3 7.2): Início, Galeria, + Adicionar, Mapa, Temas
const itens = [
  { href: "/", rotulo: "Início", icone: "⌂" },
  { href: "/galeria", rotulo: "Galeria", icone: "▣" },
  { href: "/adicionar", rotulo: "Adicionar", icone: "+", destaque: true },
  { href: "/mapa", rotulo: "Mapa", icone: "◎" },
  { href: "/temas", rotulo: "Temas", icone: "▦" },
];

export function Nav() {
  const path = usePathname();
  return (
    <nav aria-label="Menu principal" className="nav">
      {itens.map((i) => {
        const ativo = i.href === "/" ? path === "/" : path.startsWith(i.href);
        return (
          <Link
            key={i.href}
            href={i.href}
            className={`nav-item ${ativo ? "ativo" : ""} ${i.destaque ? "destaque" : ""}`}
            aria-current={ativo ? "page" : undefined}
          >
            <span aria-hidden className="nav-icone">{i.icone}</span>
            <span className="nav-rotulo">{i.rotulo}</span>
          </Link>
        );
      })}
    </nav>
  );
}
