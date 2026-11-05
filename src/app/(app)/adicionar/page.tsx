import { Cabecalho } from "@/components/ui";
import { FormPlano } from "@/components/form-plano";
import { listarTemas } from "@/lib/dados/temas";
import { criarPlano } from "../planos/actions";

// Tela Adicionar plano (PRD v3 7.2, REQ-01 e REQ-03)
export default async function Adicionar({ searchParams }: { searchParams: Promise<{ tema?: string }> }) {
  const [{ tema }, temas] = await Promise.all([searchParams, listarTemas()]);
  return (
    <>
      <Cabecalho titulo="Novo plano" subtitulo="Um título ou um link, e o tema. Só isso." />
      <FormPlano acao={criarPlano} temas={temas} temaInicial={tema} rotulo="Guardar plano" />
    </>
  );
}
