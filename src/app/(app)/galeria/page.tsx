import Link from "next/link";
import { Cabecalho, Vazio } from "@/components/ui";
import { listarGaleria } from "@/lib/dados/memorias";
import { listarTemas } from "@/lib/dados/temas";
import { Galeria } from "./galeria";

// Tela Galeria (PRD v3 7.2, REQ-11): fotos por mês, mais recentes primeiro, com filtro por tema
export default async function GaleriaPage({ searchParams }: { searchParams: Promise<{ tema?: string }> }) {
  const { tema } = await searchParams;
  const temas = await listarTemas();
  const temaAtivo = temas.find((t) => t.id === tema) ?? null;
  const { fotos, proxima } = await listarGaleria(0, 30, temaAtivo?.id);
  return (
    <>
      <Cabecalho titulo="Galeria" subtitulo="Todas as fotos de vocês, mês a mês" />
      <nav className="chips filtros-galeria" aria-label="Filtrar por tema">
        <Link href="/galeria" className={`chip ${temaAtivo ? "" : "ativo"}`} aria-current={temaAtivo ? undefined : "page"}>
          Todas
        </Link>
        {temas.map((t) => (
          <Link
            key={t.id}
            href={`/galeria?tema=${t.id}`}
            className={`chip ${temaAtivo?.id === t.id ? "ativo" : ""}`}
            aria-current={temaAtivo?.id === t.id ? "page" : undefined}
          >
            {t.icone} {t.nome}
          </Link>
        ))}
      </nav>
      {fotos.length ? (
        <Galeria key={temaAtivo?.id ?? "todas"} inicial={fotos.map((f) => ({ ...f, legenda: f.titulo }))} proxima={proxima} temaId={temaAtivo?.id ?? null} />
      ) : (
        <Vazio texto={temaAtivo ? `Ainda não há fotos em ${temaAtivo.nome}.` : "Quando registrarem uma memória com fotos, elas aparecem aqui."} />
      )}
    </>
  );
}
