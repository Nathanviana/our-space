import { Cabecalho } from "@/components/ui";
import { listarTemas } from "@/lib/dados/temas";
import { Sorteio } from "./sorteio";

// Tela Sortear (PRD v3 7.2, REQ-04). Chega-se pelo Início e pelo Tema.
export default async function Sortear({ searchParams }: { searchParams: Promise<{ tema?: string }> }) {
  const [{ tema }, temas] = await Promise.all([searchParams, listarTemas()]);
  return (
    <>
      <Cabecalho titulo="Sortear" subtitulo="Deixa a sorte escolher o próximo programa" voltar="/" />
      <Sorteio temas={temas} temaInicial={tema ?? null} />
    </>
  );
}
