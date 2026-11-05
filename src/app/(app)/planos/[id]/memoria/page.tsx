import { notFound } from "next/navigation";
import { Cabecalho } from "@/components/ui";
import { buscarMemoriaDoPlano } from "@/lib/dados/memorias";
import { buscarPlano } from "@/lib/dados/planos";
import { hoje } from "@/lib/hoje";
import { tituloDoPlano } from "@/lib/types";
import { FormMemoria } from "./form-memoria";

// Tela Registro da memória (PRD v3 7.2, REQ-05 a REQ-09): cria ou edita
export default async function RegistroMemoria({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const plano = await buscarPlano(id);
  if (!plano) notFound();
  const m = await buscarMemoriaDoPlano(plano.id);

  return (
    <>
      <Cabecalho
        titulo={m ? "Editar memória" : "Como foi?"}
        subtitulo={tituloDoPlano(plano)}
        voltar={m ? `/memorias/${m.id}` : `/planos/${plano.id}`}
      />
      <FormMemoria
        planoId={plano.id}
        temaId={plano.temaId}
        inicial={{
          memoriaId: m?.id ?? null,
          frase: m?.frase ?? "",
          musica: m?.musicaLink ?? "",
          data: m?.data ?? plano.feitoEm ?? hoje(),
          lugar: m?.lugar ?? plano.lugar,
          fotos: (m?.fotos ?? []).map((f) => ({ id: f.id, urlMini: f.urlMini })),
        }}
      />
    </>
  );
}
