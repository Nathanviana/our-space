import { Cabecalho } from "@/components/ui";
import { Abas } from "./abas";

// Área de admin (docs/superpowers/specs/2026-11-05-area-admin-design.md): Nathan e Iris, mesmo poder.
// A sessão já é exigida pelo layout de (app).
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Cabecalho titulo="Admin" subtitulo="Os bastidores do nosso espaço" voltar="/" />
      <Abas />
      {children}
    </>
  );
}
