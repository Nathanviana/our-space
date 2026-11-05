"use client";

import Link from "next/link";
import { Revelar, useContagem, useVisivel } from "@/components/movimento";
import type { Resumo } from "@/lib/dados/resumo";

function Estatistica({ valor, rotulo, ativo, tom }: { valor: number; rotulo: string; ativo: boolean; tom: string }) {
  const n = useContagem(valor, ativo, 1100);
  return (
    <div className={`card estatistica ${tom}`}>
      <span className="estatistica-valor">{n}</span>
      <span className="estatistica-rotulo">{rotulo}</span>
    </div>
  );
}

const AREAS = [
  { href: "/temas", icone: "▦", titulo: "Planos por tema", texto: "Tudo o que vocês querem fazer, separado em vamos fazer e já fizemos.", tom: "tom-0" },
  { href: "/sortear", icone: "✦", titulo: "Sortear", texto: "Não sabem o que fazer? Deixem a sorte escolher o próximo programa.", tom: "tom-1" },
  { href: "/galeria", icone: "▣", titulo: "Galeria", texto: "Todas as fotos de vocês, das mais novas às mais antigas.", tom: "tom-2" },
  { href: "/mapa", icone: "◎", titulo: "Mapa", texto: "Onde querem ir e onde já foram, com as fotos no lugar.", tom: "tom-3" },
];

// Resumo do nosso espaço (REQ-14): o que há no site e os números do casal
export function ResumoEspaco({ resumo }: { resumo: Resumo }) {
  const [ref, visivel] = useVisivel<HTMLDivElement>();
  return (
    <section className="resumo" aria-label="Resumo do nosso espaço">
      <Revelar>
        <h2 className="resumo-titulo">Nosso espaço</h2>
        <p className="resumo-texto">
          Tudo o que vocês querem viver e o que já viveram, num lugar só. Cada plano que acontece vira memória, com foto, música, frase e lugar.
        </p>
      </Revelar>

      <div ref={ref} className="estatisticas">
        <Estatistica valor={resumo.vamosFazer} rotulo="vamos fazer" ativo={visivel} tom="tom-1" />
        <Estatistica valor={resumo.jaFizemos} rotulo="já fizemos" ativo={visivel} tom="tom-0" />
        <Estatistica valor={resumo.memorias} rotulo="memórias" ativo={visivel} tom="tom-3" />
        <Estatistica valor={resumo.fotos} rotulo="fotos" ativo={visivel} tom="tom-2" />
        <Estatistica valor={resumo.lugares} rotulo="lugares" ativo={visivel} tom="tom-0" />
      </div>

      <div className="areas">
        {AREAS.map((a, i) => (
          <Revelar key={a.href} atraso={i * 80}>
            <Link href={a.href} className="card area">
              <span className={`area-icone ${a.tom}`} aria-hidden>{a.icone}</span>
              <span className="area-texto">
                <strong>{a.titulo}</strong>
                <span>{a.texto}</span>
              </span>
              <span aria-hidden className="item-seta">›</span>
            </Link>
          </Revelar>
        ))}
      </div>

      <Revelar>
        <Link href="/adicionar" className="botao cta">+ Guardar um novo plano</Link>
      </Revelar>
    </section>
  );
}
