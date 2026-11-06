import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ExternalLink, MapPin, Music, Pencil } from "lucide-react";
import { VisorFotos } from "@/components/visor-fotos";
import { buscarMemoria } from "@/lib/dados/memorias";
import { buscarPlano } from "@/lib/dados/planos";
import { listarTemas } from "@/lib/dados/temas";
import { embedDaMusica } from "@/lib/musica";
import { formatarData, tituloDoPlano } from "@/lib/types";
import { HistoriaCapa } from "./historia";

const NOME_SERVICO = { spotify: "Spotify", youtube: "YouTube", apple: "Apple Music" } as const;

// Tela Memória (PRD v3 7.2, REQ-06 a REQ-09): contada como uma história
export default async function MemoriaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const memoria = await buscarMemoria(id);
  if (!memoria) notFound();
  const [plano, temas] = await Promise.all([buscarPlano(memoria.planoId), listarTemas()]);
  const tema = plano ? temas.find((t) => t.id === plano.temaId) : undefined;
  const temLugar = memoria.lugar.latitude !== null;
  const musica = embedDaMusica(memoria.musicaLink);
  const vazia = !memoria.fotos.length && !memoria.frase && !memoria.musicaLink && !memoria.lugar.nome && !temLugar;

  return (
    <article className="historia">
      <HistoriaCapa
        fotos={memoria.fotos}
        titulo={plano ? tituloDoPlano(plano) : "Memória"}
        data={formatarData(memoria.data)}
        tema={tema ? `${tema.icone} ${tema.nome}` : null}
        voltar={plano ? `/temas/${plano.temaId}` : "/"}
      />

      {memoria.frase && (
        <blockquote className="historia-frase">
          <span aria-hidden>“</span>
          {memoria.frase}
        </blockquote>
      )}

      {musica ? (
        <section className="card historia-musica" aria-label="Nossa música">
          <span className="historia-rotulo"><Music size={15} aria-hidden /> Nossa música · {NOME_SERVICO[musica.servico]}</span>
          <iframe
            src={musica.src}
            title={`Música da memória no ${NOME_SERVICO[musica.servico]}`}
            loading="lazy"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            style={musica.altura ? { height: musica.altura } : { aspectRatio: "16 / 9" }}
          />
        </section>
      ) : (
        memoria.musicaLink && (
          <a href={memoria.musicaLink} target="_blank" rel="noopener noreferrer" className="card detalhe historia-link">
            <span className="detalhe-icone tom-3" aria-hidden><Music size={18} /></span>
            <span><small>Nossa música</small>Ouvir</span>
            <ExternalLink size={16} aria-hidden className="item-seta" />
          </a>
        )
      )}

      {(memoria.lugar.nome || temLugar) && (
        <Link href={temLugar ? `/mapa?memoria=${memoria.id}` : "/mapa"} className="card detalhe historia-link">
          <span className="detalhe-icone tom-2" aria-hidden><MapPin size={18} /></span>
          <span><small>Onde foi</small>{memoria.lugar.nome ?? "Marcado no mapa"}</span>
          <ChevronRight size={18} aria-hidden className="item-seta" />
        </Link>
      )}

      {memoria.fotos.length > 1 && (
        <section className="secao">
          <h2>Todas as fotos <span className="contagem">{memoria.fotos.length}</span></h2>
          <VisorFotos fotos={memoria.fotos} />
        </section>
      )}

      {vazia && <p className="vazio vazio-card">Essa memória ainda está vazia. Que tal completar com fotos, uma frase ou a música do dia?</p>}

      <div className="atalhos">
        {plano && (
          <Link href={`/planos/${plano.id}/memoria`} className="botao secundario">
            <Pencil size={16} aria-hidden /> Editar
          </Link>
        )}
        {plano && <Link href={`/planos/${plano.id}`} className="botao secundario">Ver o plano</Link>}
      </div>
    </article>
  );
}
