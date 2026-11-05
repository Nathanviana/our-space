import { Cabecalho, Vazio } from "@/components/ui";
import { listarGaleria } from "@/lib/dados/memorias";
import { Galeria } from "./galeria";

// Tela Galeria (PRD v3 7.2, REQ-11): todas as fotos, mais recentes primeiro, carregando aos poucos
export default async function GaleriaPage() {
  const { fotos, proxima } = await listarGaleria(0);
  return (
    <>
      <Cabecalho titulo="Galeria" subtitulo="Todas as fotos de vocês" />
      {fotos.length ? (
        <Galeria inicial={fotos.map((f) => ({ ...f, legenda: f.titulo }))} proxima={proxima} />
      ) : (
        <Vazio texto="Quando registrarem uma memória com fotos, elas aparecem aqui." />
      )}
    </>
  );
}
