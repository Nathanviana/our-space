"use client";

import { House, Images, LayoutGrid, MapPin, Plus } from "lucide-react";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Menu fixo em todas as telas (RNF-06, DC1; PRD v3 7.2): Início, Galeria, + Adicionar, Mapa, Temas
const itens = [
  { href: "/", rotulo: "Início", icone: House },
  { href: "/galeria", rotulo: "Galeria", icone: Images },
  { href: "/adicionar", rotulo: "Adicionar", icone: Plus, destaque: true },
  { href: "/mapa", rotulo: "Mapa", icone: MapPin },
  { href: "/temas", rotulo: "Temas", icone: LayoutGrid },
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
            <span aria-hidden className="nav-icone"><i.icone size={i.destaque ? 20 : 22} strokeWidth={ativo || i.destaque ? 2.2 : 1.8} /></span>
            <span className="nav-rotulo">{i.rotulo}</span>
          </Link>
        );
      })}
    </nav>
  );
}
