"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight, Dices, MapPin, RotateCcw } from "lucide-react";
import { useReduzirMovimento } from "@/components/movimento";
import { TIPOS_PLANO, tituloDoPlano, type Tema } from "@/lib/types";
import { sortear, type ResultadoSorteio } from "../planos/actions";

type Fase = "parado" | "embaralhando" | "revelado";
const TEMPO_EMBARALHAR_MS = 1400;

// REQ-04: cartas que embaralham e revelam o próximo programa, com filtros por tema, tipo e lugar
export function Sorteio({ temas, temaInicial }: { temas: Tema[]; temaInicial: string | null }) {
  const reduzir = useReduzirMovimento();
  const [tema, setTema] = useState(temaInicial ?? "");
  const [tipo, setTipo] = useState("");
  const [comLugar, setComLugar] = useState(false);
  const [fase, setFase] = useState<Fase>("parado");
  const [resultado, setResultado] = useState<ResultadoSorteio | null>(null);
  const [rodada, setRodada] = useState(0);

  async function girar() {
    setFase("embaralhando");
    setRodada((n) => n + 1);
    const espera = new Promise((ok) => setTimeout(ok, reduzir ? 200 : TEMPO_EMBARALHAR_MS));
    const [r] = await Promise.all([sortear({ tema: tema || null, tipo: tipo || null, comLugar }), espera]);
    setResultado(r);
    setFase(r.plano ? "revelado" : "parado");
  }

  const plano = resultado?.plano;
  const temaDoPlano = plano && temas.find((t) => t.id === plano.temaId);
  const ocupado = fase === "embaralhando";

  return (
    <>
      <div className="card formulario sorteio-filtros">
        <label>
          Tema
          <select value={tema} onChange={(e) => setTema(e.target.value)} disabled={ocupado}>
            <option value="">Todos os temas</option>
            {temas.map((t) => (
              <option key={t.id} value={t.id}>{t.icone} {t.nome}</option>
            ))}
          </select>
        </label>
        <div className="chips" role="radiogroup" aria-label="Tipo">
          {[{ valor: "", rotulo: "Qualquer tipo" }, ...TIPOS_PLANO].map((t) => (
            <button
              key={t.valor}
              type="button"
              role="radio"
              aria-checked={tipo === t.valor}
              className={`chip ${tipo === t.valor ? "ativo" : ""}`}
              onClick={() => setTipo(t.valor)}
              disabled={ocupado}
            >
              {t.rotulo}
            </button>
          ))}
        </div>
        <label className="interruptor">
          <input type="checkbox" checked={comLugar} onChange={(e) => setComLugar(e.target.checked)} disabled={ocupado} />
          <span className="interruptor-trilho" aria-hidden />
          <MapPin size={16} aria-hidden /> Só planos com lugar marcado
        </label>
      </div>

      <div className={`mesa fase-${fase}`}>
        {[0, 1, 2, 3].map((i) => (
          <span key={`${i}-${rodada}`} className={`carta carta-fundo cf${i}`} aria-hidden />
        ))}
        <div key={`principal-${rodada}`} className="carta carta-principal">
          <div className="carta-dentro">
            <div className="carta-verso" aria-hidden>
              <span>♡</span>
            </div>
            <div className="carta-frente">
              {plano && (
                <>
                  {plano.previa?.imagem && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={plano.previa.imagem} alt="" referrerPolicy="no-referrer" />
                  )}
                  <span className="carta-rotulo">O próximo programa é</span>
                  <strong className="carta-titulo">{tituloDoPlano(plano)}</strong>
                  {temaDoPlano && <span className="item-meta">{temaDoPlano.icone} {temaDoPlano.nome}</span>}
                  <Link href={`/planos/${plano.id}`} className="link carta-link">
                    Ver o plano <ChevronRight size={16} aria-hidden />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {fase === "revelado" && plano ? `Sorteado: ${tituloDoPlano(plano)}` : ""}
      </p>
      {fase === "revelado" && resultado?.total && (
        <p className="sorteio-total">Sorteado entre {resultado.total} {resultado.total === 1 ? "plano" : "planos"}, sem repetir os últimos que saíram.</p>
      )}
      {resultado?.erro && fase === "parado" && <p className="vazio vazio-card">{resultado.erro}</p>}

      <button className="botao sorteio-botao" onClick={girar} disabled={ocupado}>
        {ocupado ? "Embaralhando…" : fase === "revelado" ? <><RotateCcw size={18} aria-hidden /> Sortear de novo</> : <><Dices size={20} aria-hidden /> Sortear</>}
      </button>
    </>
  );
}
