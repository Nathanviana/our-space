import { listarTemas } from "@/lib/dados/temas";
import { itensDoMural } from "@/lib/dados/mural";
import { FILTRO_INICIAL, type FiltroMural } from "@/lib/mural";
import { Mural } from "./mural";

export const dynamic = "force-dynamic";

type Busca = { q?: string; tema?: string; s?: string; o?: string; f?: string };

// Mural: tudo do casal num lugar só (planos, memórias e fotos), com busca e filtros
export default async function MuralPage({ searchParams }: { searchParams: Promise<Busca> }) {
  const [b, temas] = await Promise.all([searchParams, listarTemas()]);
  const itens = await itensDoMural(temas);
  const inicial: FiltroMural = {
    texto: (b.q ?? "").slice(0, 80),
    tema: temas.some((t) => t.id === b.tema) ? b.tema! : null,
    situacao: b.s === "vamos_fazer" || b.s === "ja_fizemos" ? b.s : FILTRO_INICIAL.situacao,
    ordem: b.o === "antigos" || b.o === "az" ? b.o : FILTRO_INICIAL.ordem,
    comFoto: b.f === "1",
  };
  return <Mural itens={itens} temas={temas} inicial={inicial} />;
}
