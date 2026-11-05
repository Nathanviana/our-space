import { notFound } from "next/navigation";
import { Cabecalho } from "@/components/ui";
import { FormPlano } from "@/components/form-plano";
import { buscarPlano } from "@/lib/dados/planos";
import { listarTemas } from "@/lib/dados/temas";
import { editarPlano } from "../../actions";

// Edição do plano (parte da tela Plano, PRD v3 7.2)
export default async function EditarPlano({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [plano, temas] = await Promise.all([buscarPlano(id), listarTemas()]);
  if (!plano) notFound();
  return (
    <>
      <Cabecalho titulo="Editar plano" voltar={`/planos/${plano.id}`} />
      <FormPlano acao={editarPlano} temas={temas} plano={plano} rotulo="Salvar" />
    </>
  );
}
