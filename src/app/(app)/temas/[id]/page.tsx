import Link from "next/link";
import { notFound } from "next/navigation";
import { Cabecalho, PlanoItem, Vazio } from "@/components/ui";
import { listarPlanos } from "@/lib/dados/planos";
import { listarTemas } from "@/lib/dados/temas";
import { formatarData } from "@/lib/types";

// Tela Tema (PRD v3 7.2, REQ-02): "vamos fazer" e "já fizemos" separados
export default async function TemaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const temas = await listarTemas();
  const indice = temas.findIndex((t) => t.id === id);
  if (indice < 0) notFound();
  const tema = temas[indice];
  const [vamos, feitos] = await Promise.all([
    listarPlanos({ temaId: id, situacao: "vamos_fazer" }),
    listarPlanos({ temaId: id, situacao: "ja_fizemos" }),
  ]);

  return (
    <>
      <Cabecalho titulo={`${tema.icone} ${tema.nome}`} voltar="/temas" />

      <div className="atalhos">
        <Link href={`/adicionar?tema=${tema.id}`} className="botao secundario">+ Plano</Link>
        <Link href={`/sortear?tema=${tema.id}`} className="botao secundario">✦ Sortear</Link>
      </div>

      <section className="secao">
        <h2>Vamos fazer <span className="contagem">{vamos.length}</span></h2>
        {vamos.length ? (
          <div className="lista">{vamos.map((p) => <PlanoItem key={p.id} plano={p} tema={tema} indiceTema={indice} />)}</div>
        ) : (
          <Vazio texto="Nada por aqui ainda. Que tal adicionar um plano?" />
        )}
      </section>

      <section className="secao">
        <h2>Já fizemos <span className="contagem">{feitos.length}</span></h2>
        {feitos.length ? (
          <div className="lista">
            {feitos.map((p) => (
              <PlanoItem
                key={p.id}
                plano={p}
                tema={tema}
                indiceTema={indice}
                href={p.memoriaId ? `/memorias/${p.memoriaId}` : `/planos/${p.id}`}
                meta={`${formatarData(p.feitoEm)} · ${p.memoriaId ? "memória registrada" : "sem memória ainda"}`}
              />
            ))}
          </div>
        ) : (
          <Vazio texto="Quando fizerem um plano, ele aparece aqui." />
        )}
      </section>
    </>
  );
}
