import { ExternalLink, MapPin, Music, Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Cabecalho } from "@/components/ui";
import { VisorFotos } from "@/components/visor-fotos";
import { buscarMemoria } from "@/lib/dados/memorias";
import { buscarPlano } from "@/lib/dados/planos";
import { formatarData, tituloDoPlano } from "@/lib/types";

// Tela Memória (PRD v3 7.2, REQ-06 a REQ-09)
export default async function MemoriaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const memoria = await buscarMemoria(id);
  if (!memoria) notFound();
  const plano = await buscarPlano(memoria.planoId);
  const temLugar = memoria.lugar.latitude !== null;

  return (
    <>
      <Cabecalho
        titulo={plano ? tituloDoPlano(plano) : "Memória"}
        subtitulo={formatarData(memoria.data)}
        voltar={plano ? `/temas/${plano.temaId}` : "/"}
      />

      {memoria.fotos.length > 0 && <VisorFotos fotos={memoria.fotos} />}

      {memoria.frase && <blockquote className="card frase-memoria">“{memoria.frase}”</blockquote>}

      {(memoria.lugar.nome || temLugar || memoria.musicaLink) && (
        <div className="card bloco">
          {(memoria.lugar.nome || temLugar) && (
            <>
              <p className="rotulo">Lugar</p>
              <p>{memoria.lugar.nome ?? "Marcado no mapa"}</p>
              {temLugar && <Link href={`/mapa?memoria=${memoria.id}`} className="link"><MapPin size={15} aria-hidden /> Ver no mapa</Link>}
            </>
          )}
          {memoria.musicaLink && (
            <>
              <p className="rotulo">Música</p>
              <a href={memoria.musicaLink} target="_blank" rel="noopener noreferrer" className="link"><Music size={15} aria-hidden /> Ouvir <ExternalLink size={13} aria-hidden /></a>
            </>
          )}
        </div>
      )}

      {!memoria.fotos.length && !memoria.frase && !memoria.musicaLink && !memoria.lugar.nome && !temLugar && (
        <p className="vazio">Essa memória ainda está vazia. Que tal completar?</p>
      )}

      <div className="atalhos">
        {plano && <Link href={`/planos/${plano.id}/memoria`} className="botao secundario"><Pencil size={16} aria-hidden /> Editar</Link>}
        {plano && <Link href={`/planos/${plano.id}`} className="botao secundario">Ver o plano</Link>}
      </div>
    </>
  );
}
