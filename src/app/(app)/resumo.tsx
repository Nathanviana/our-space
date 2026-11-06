"use client";

import { ArrowUpRight, Dices, Images, MapPin, Plus, StickyNote } from "lucide-react";

import Link from "next/link";
import { Revelar, useContagem, useVisivel } from "@/components/movimento";
import type { Resumo } from "@/lib/dados/resumo";

function Estatistica({ valor, rotulo, ativo, tom }: { valor: number; rotulo: string; ativo: boolean; tom: string }) {
  const n = useContagem(valor, ativo, 1100);
  return (
    <div className="estatistica">
      <span className="estatistica-valor">{n}</span>
      <span className="estatistica-rotulo">
        <i className={`ponto-tom ${tom}`} aria-hidden />
        {rotulo}
      </span>
    </div>
  );
}

const AREAS = [
  { href: "/mural", icone: StickyNote, titulo: "Mural", texto: "Tudo num lugar só, com busca.", tom: "tom-0" },
  { href: "/sortear", icone: Dices, titulo: "Sortear", texto: "Deixem a sorte escolher o próximo programa.", tom: "tom-1" },
  { href: "/galeria", icone: Images, titulo: "Galeria", texto: "Todas as fotos de vocês, num lugar só.", tom: "tom-2" },
  { href: "/mapa", icone: MapPin, titulo: "Mapa", texto: "Onde querem ir e onde já foram.", tom: "tom-3" },
];

// Resumo do nosso espaço (REQ-14): o que há no site e os números do casal
export function ResumoEspaco({ resumo }: { resumo: Resumo }) {
  const [ref, visivel] = useVisivel<HTMLDivElement>();
  return (
    <section className="resumo" aria-label="Resumo do nosso espaço">
      <Revelar className="resumo-cabecalho">
        <h2 className="resumo-titulo">Nosso espaço</h2>
        <p className="resumo-texto">
          Tudo o que vocês querem viver e o que já viveram. Cada plano que acontece vira memória, com foto, música, frase e lugar.
        </p>
      </Revelar>

      <div ref={ref} className="card estatisticas">
        <Estatistica valor={resumo.vamosFazer} rotulo="vamos fazer" ativo={visivel} tom="tom-1" />
        <Estatistica valor={resumo.jaFizemos} rotulo="já fizemos" ativo={visivel} tom="tom-0" />
        <Estatistica valor={resumo.memorias} rotulo="memórias" ativo={visivel} tom="tom-3" />
        <Estatistica valor={resumo.fotos} rotulo="fotos" ativo={visivel} tom="tom-2" />
        <Estatistica valor={resumo.lugares} rotulo="lugares" ativo={visivel} tom="tom-0" />
      </div>

      <div className="areas">
        {AREAS.map((a, i) => (
          <Revelar key={a.href} atraso={i * 70}>
            <Link href={a.href} className={`card area ${a.tom}`}>
              <span className="area-topo">
                <span className="area-icone" aria-hidden><a.icone size={21} strokeWidth={1.9} /></span>
                <span className="area-seta" aria-hidden><ArrowUpRight size={16} /></span>
              </span>
              <strong className="area-titulo">{a.titulo}</strong>
              <span className="area-texto">{a.texto}</span>
            </Link>
          </Revelar>
        ))}
      </div>

      <Revelar className="cta-envoltorio">
        <Link href="/adicionar" className="botao cta">
          <Plus size={20} aria-hidden /> Guardar um novo plano
        </Link>
      </Revelar>
    </section>
  );
}
