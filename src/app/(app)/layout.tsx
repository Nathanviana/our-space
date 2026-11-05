import { Nav } from "@/components/nav";
import { exigirSessao } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Segunda barreira, além do middleware: nenhuma tela do casal renderiza sem JWT válido.
  await exigirSessao();
  return (
    <div className="shell">
      <main className="conteudo">{children}</main>
      <Nav />
    </div>
  );
}
