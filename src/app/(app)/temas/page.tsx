import { Cabecalho } from "@/components/ui";
import { contarPlanosPorTema, listarTemas } from "@/lib/dados/temas";
import { EditorTemas } from "./editor";

// Tela Gerenciar temas (PRD v3 7.2, REQ-10)
export default async function Temas() {
  const [temas, contagem] = await Promise.all([listarTemas(), contarPlanosPorTema()]);
  return (
    <>
      <Cabecalho titulo="Temas" subtitulo="Organizem planos e memórias do jeito de vocês" />
      <EditorTemas temas={temas} contagem={contagem} />
    </>
  );
}
