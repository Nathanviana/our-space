"use client";

import { useEffect, useRef, useState } from "react";
import { useContagem, useReduzirMovimento } from "@/components/movimento";
import { proximosMarcos, type Marco } from "@/lib/marcos";
import { dataLocal, tempoDesde, type TempoJuntos } from "@/lib/tempo-juntos";

function Numero({ valor, rotulo, ativo }: { valor: number; rotulo: string; ativo: boolean }) {
  const n = useContagem(valor, ativo);
  return (
    <div className="num">
      <span className="num-valor">{n}</span>
      <span className="num-rotulo">{rotulo}</span>
    </div>
  );
}

const dois = (n: number) => String(n).padStart(2, "0");

// Dígito do relógio que desliza quando muda
function Relogio({ t }: { t: TempoJuntos }) {
  return (
    <div className="relogio" aria-label={`${t.horas} horas, ${t.minutos} minutos e ${t.segundos} segundos`}>
      {[dois(t.horas), dois(t.minutos), dois(t.segundos)].map((par, i) => (
        <span key={i} className="relogio-par">
          {par.split("").map((d, j) => (
            <span key={`${i}-${j}-${d}`} className="digito">{d}</span>
          ))}
          {i < 2 && <span className="separador">:</span>}
        </span>
      ))}
    </div>
  );
}

function plural(n: number, um: string, varios: string) {
  return n === 1 ? um : varios;
}

function saudacao(agora: Date | null) {
  if (!agora) return "Oi";
  const h = agora.getHours();
  if (h >= 5 && h < 12) return "Bom dia";
  if (h >= 12 && h < 18) return "Boa tarde";
  return "Boa noite";
}

const formatoData = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "numeric", month: "long" });

// Próximo mesversário e próxima centena de dias, com barra de progresso
function ProximosMarcos({ marcos }: { marcos: Marco[] | null }) {
  return (
    <div className="card marcos" aria-label="Próximos marcos">
      <p className="marcos-titulo">Próximos marcos</p>
      {(marcos ?? []).map((m) => (
        <div key={m.titulo} className="marco">
          <div className="marco-linha">
            <strong>{m.titulo}</strong>
            <span className={`marco-falta ${m.faltam === 0 ? "hoje" : ""}`}>
              {m.faltam === 0 ? "é hoje ♡" : `em ${m.faltam} ${plural(m.faltam, "dia", "dias")}`}
            </span>
          </div>
          <div className="marco-barra" role="progressbar" aria-label={`Até ${m.titulo}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(m.progresso * 100)}>
            <span style={{ width: `${Math.max(4, m.progresso * 100)}%` }} />
          </div>
          <span className="marco-data">{formatoData.format(m.data).replace(".", "")}</span>
        </div>
      ))}
    </div>
  );
}

// Contador animado do tempo juntos com parallax (REQ-13)
export function Contador({
  dataAmizade,
  dataNamoro,
  nome,
  acoes,
}: {
  dataAmizade: string | null;
  dataNamoro: string | null;
  nome: string;
  acoes?: React.ReactNode;
}) {
  const reduzir = useReduzirMovimento();
  const [agora, setAgora] = useState<Date | null>(null);
  const palco = useRef<HTMLElement>(null);

  useEffect(() => {
    setAgora(new Date());
    const id = setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Parallax: cada camada se move em velocidade diferente ao rolar e ao inclinar o celular
  useEffect(() => {
    if (reduzir) return;
    const el = palco.current;
    if (!el) return;
    let quadro = 0;
    let rolagem = 0;
    let ix = 0;
    let iy = 0;
    const aplicar = () => {
      quadro = 0;
      el.style.setProperty("--rolagem", String(rolagem));
      el.style.setProperty("--ix", ix.toFixed(3));
      el.style.setProperty("--iy", iy.toFixed(3));
    };
    const pedir = () => {
      if (!quadro) quadro = requestAnimationFrame(aplicar);
    };
    const aoRolar = () => {
      rolagem = Math.min(window.scrollY, window.innerHeight);
      pedir();
    };
    const aoMover = (e: PointerEvent) => {
      ix = e.clientX / window.innerWidth - 0.5;
      iy = e.clientY / window.innerHeight - 0.5;
      pedir();
    };
    const aoInclinar = (e: DeviceOrientationEvent) => {
      ix = Math.max(-0.5, Math.min(0.5, (e.gamma ?? 0) / 60));
      iy = Math.max(-0.5, Math.min(0.5, ((e.beta ?? 45) - 45) / 60));
      pedir();
    };
    window.addEventListener("scroll", aoRolar, { passive: true });
    window.addEventListener("pointermove", aoMover, { passive: true });
    window.addEventListener("deviceorientation", aoInclinar, { passive: true });
    aoRolar();
    return () => {
      window.removeEventListener("scroll", aoRolar);
      window.removeEventListener("pointermove", aoMover);
      window.removeEventListener("deviceorientation", aoInclinar);
      cancelAnimationFrame(quadro);
    };
  }, [reduzir]);

  const namoro = agora && dataNamoro ? tempoDesde(dataLocal(dataNamoro), agora) : null;
  const amizade = agora && dataAmizade ? tempoDesde(dataLocal(dataAmizade), agora) : null;
  const marcos = agora && dataNamoro ? proximosMarcos(dataNamoro, agora) : null;
  const ativo = agora !== null;

  return (
    <section ref={palco} className={`palco ${reduzir ? "sem-movimento" : ""}`} aria-label="Tempo juntos">
      <div className="palco-fundo" aria-hidden>
        <div className="camada c1" />
        <div className="camada c2" />
        <div className="camada c3" />
        <div className="camada c4" />
      </div>
      <span className="coracao h1" aria-hidden>♡</span>
      <span className="coracao h2" aria-hidden>✦</span>
      <span className="coracao h3" aria-hidden>♡</span>

      <header className="palco-topo">
        <p className="ola">
          {saudacao(agora)}, <strong>{nome}</strong>
        </p>
        {acoes}
      </header>

      <div className="palco-conteudo">
        <div className="palco-titulo">
          <h1 className="casal">
            <span className="casal-nome">Nathan</span> <span className="casal-e">&amp;</span> <span className="casal-nome">Iris</span>
          </h1>
          <p className="sobretitulo">{dataNamoro ? "estão namorando há" : "o nosso cantinho"}</p>
        </div>

        {!dataNamoro ? (
          <p className="vazio">As datas ainda não foram cadastradas.</p>
        ) : (
          <div className="palco-cards">
            <div className="card vidro-forte contador">
              <div className="nums">
                <Numero valor={namoro?.anos ?? 0} rotulo={plural(namoro?.anos ?? 0, "ano", "anos")} ativo={ativo} />
                <Numero valor={namoro?.meses ?? 0} rotulo={plural(namoro?.meses ?? 0, "mês", "meses")} ativo={ativo} />
                <Numero valor={namoro?.dias ?? 0} rotulo={plural(namoro?.dias ?? 0, "dia", "dias")} ativo={ativo} />
              </div>
              <div className="contador-rodape">
                {namoro ? <Relogio t={namoro} /> : <div className="relogio" aria-hidden>&nbsp;</div>}
                <p className="total">{namoro ? `${namoro.totalDias.toLocaleString("pt-BR")} dias de namoro` : "\u00a0"}</p>
              </div>
              {amizade && (
                <p className="amizade">
                  <span className="amizade-rotulo">e amigos há</span>{" "}
                  <strong>
                    {amizade.anos > 0 && `${amizade.anos} ${plural(amizade.anos, "ano", "anos")}, `}
                    {amizade.meses} {plural(amizade.meses, "mês", "meses")} e {amizade.dias} {plural(amizade.dias, "dia", "dias")}
                  </strong>
                </p>
              )}
            </div>
            <ProximosMarcos marcos={marcos} />
          </div>
        )}
      </div>

      <span className="rolar" aria-hidden>⌄</span>
    </section>
  );
}
