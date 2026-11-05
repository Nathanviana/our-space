import Link from "next/link";
import { notFound } from "next/navigation";
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

  return (
    <>
      <Cabecalho
        titulo={tituloDoPlano(plano)}
        subtitulo={[tema && `${tema.icone} ${tema.nome}`, tipo].filter(Boolean).join(" · ")}
        voltar={`/temas/${plano.temaId}`}
      />

      <div className="card bloco">
        <p className="rotulo">Situação</p>
        <p>{feito ? `Já fizemos · ${formatarData(plano.feitoEm)}` : "Vamos fazer"}</p>
        {plano.link && (
          <>
            <p className="rotulo">Link</p>
            <a href={plano.link} target="_blank" rel="noopener noreferrer" className="link">
              Abrir link ↗
            </a>
          </>
        )}
        {plano.lugar.latitude !== null && (
          <>
            <p className="rotulo">Lugar</p>
            <p>{plano.lugar.nome ?? "Marcado no mapa"}</p>
            <Link href="/mapa" className="link">Ver no mapa ›</Link>
          </>
        )}
        <p className="rotulo">Adicionado em</p>
        <p>{formatarData(plano.criadoEm)}</p>
      </div>

      {feito ? (
        <>
          <Link href={plano.memoriaId ? `/memorias/${plano.memoriaId}` : `/planos/${plano.id}/memoria`} className="botao">
            {plano.memoriaId ? "Ver a memória" : "Registrar a memória"}
          </Link>
          <form action={desfazerFeito}>
            <input type="hidden" name="id" value={plano.id} />
            <button className="botao fantasma largura">Voltar para “vamos fazer”</button>
          </form>
        </>
      ) : (
        <form action={marcarFeito}>
          <input type="hidden" name="id" value={plano.id} />
          <button className="botao largura">✓ Fizemos!</button>
        </form>
      )}

      <div className="atalhos">
        <Link href={`/planos/${plano.id}/editar`} className="botao secundario">Editar</Link>
        <BotaoExcluir id={plano.id} acao={excluirPlano} />
      </div>
    </>
  );
}
