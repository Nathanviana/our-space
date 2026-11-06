import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Check, ChevronRight, ExternalLink, MapPin, Pencil, RotateCcw, Tag } from "lucide-react";
import { Cabecalho } from "@/components/ui";
import { buscarPlano } from "@/lib/dados/planos";
import { listarTemas } from "@/lib/dados/temas";
import { TIPOS_PLANO, formatarData, tituloDoPlano } from "@/lib/types";
import { desfazerFeito, excluirPlano, marcarFeito } from "../actions";
import { BotaoExcluir } from "./botao-excluir";

// Tela Plano (PRD v3 7.2, REQ-01 a REQ-03, REQ-05)
export default async function PlanoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [plano, temas] = await Promise.all([buscarPlano(id), listarTemas()]);
  if (!plano) notFound();
  const tema = temas.find((t) => t.id === plano.temaId);
  const feito = plano.situacao === "ja_fizemos";
  const tipo = TIPOS_PLANO.find((t) => t.valor === plano.tipo)?.rotulo;
  const previa = plano.previa;

  return (
    <>
      <Cabecalho
        titulo={tituloDoPlano(plano)}
        subtitulo={[tema && `${tema.icone} ${tema.nome}`, tipo].filter(Boolean).join(" · ")}
        voltar={`/temas/${plano.temaId}`}
      />

      {plano.link && (
        <a href={plano.link} target="_blank" rel="noopener noreferrer" className={`card cartao-link ${previa?.imagem ? "com-capa" : ""}`}>
          {previa?.imagem && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previa.imagem} alt="" referrerPolicy="no-referrer" />
          )}
          <span className="cartao-link-texto">
            <small>{previa?.site ?? new URL(plano.link).hostname.replace(/^www\./, "")}</small>
            <strong>{previa?.titulo ?? "Abrir o link"}</strong>
          </span>
          <ExternalLink size={18} aria-hidden className="cartao-link-icone" />
        </a>
      )}

      <div className="card detalhes">
        <div className="detalhe">
          <span className={`detalhe-icone ${feito ? "tom-0" : "tom-1"}`} aria-hidden>{feito ? <Check size={18} /> : <Tag size={18} />}</span>
          <span>
            <small>Situação</small>
            {feito ? `Já fizemos · ${formatarData(plano.feitoEm)}` : "Vamos fazer"}
          </span>
        </div>
        {plano.lugar.latitude !== null && (
          <Link href="/mapa" className="detalhe">
            <span className="detalhe-icone tom-2" aria-hidden><MapPin size={18} /></span>
            <span>
              <small>Lugar</small>
              {plano.lugar.nome ?? "Marcado no mapa"}
            </span>
            <ChevronRight size={18} aria-hidden className="item-seta" />
          </Link>
        )}
        <div className="detalhe">
          <span className="detalhe-icone tom-3" aria-hidden><CalendarDays size={18} /></span>
          <span>
            <small>Adicionado em</small>
            {formatarData(plano.criadoEm)}
          </span>
        </div>
      </div>

      {feito ? (
        <>
          <Link href={plano.memoriaId ? `/memorias/${plano.memoriaId}` : `/planos/${plano.id}/memoria`} className="botao">
            {plano.memoriaId ? "Ver a memória" : "Registrar a memória"}
          </Link>
          <form action={desfazerFeito}>
            <input type="hidden" name="id" value={plano.id} />
            <button className="botao fantasma largura">
              <RotateCcw size={16} aria-hidden /> Voltar para “vamos fazer”
            </button>
          </form>
        </>
      ) : (
        <form action={marcarFeito}>
          <input type="hidden" name="id" value={plano.id} />
          <button className="botao largura">
            <Check size={20} aria-hidden /> Fizemos!
          </button>
        </form>
      )}

      <div className="atalhos">
        <Link href={`/planos/${plano.id}/editar`} className="botao secundario">
          <Pencil size={16} aria-hidden /> Editar
        </Link>
        <BotaoExcluir id={plano.id} acao={excluirPlano} />
      </div>
    </>
  );
}
