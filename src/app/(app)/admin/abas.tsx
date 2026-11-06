"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ABAS = [
  { href: "/admin", rotulo: "Métricas" },
  { href: "/admin/pessoas", rotulo: "Pessoas" },
  { href: "/admin/lote", rotulo: "Lote" },
  { href: "/admin/login", rotulo: "Login" },
  { href: "/admin/infra", rotulo: "Infra" },
];

export function Abas() {
  const path = usePathname();
  return (
    <nav aria-label="Seções do admin" className="abas">
      {ABAS.map((a) => {
        const ativo = a.href === "/admin" ? path === "/admin" : path.startsWith(a.href);
        return (
          <Link key={a.href} href={a.href} className={`aba ${ativo ? "ativo" : ""}`} aria-current={ativo ? "page" : undefined}>
            {a.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
