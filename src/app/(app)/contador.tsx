"use client";

import { useEffect, useRef, useState } from "react";
import { useContagem, useReduzirMovimento } from "@/components/movimento";
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

// Contador animado do tempo juntos com parallax (REQ-13)
export function Contador({ dataAmizade, dataNamoro, nome }: { dataAmizade: string | null; dataNamoro: string | null; nome: string }) {
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
  const ativo = agora !== null;

  return (
    <section ref={palco} className={`palco ${reduzir ? "sem-movimento" : ""}`} aria-label="Tempo juntos">
      <div className="camada c1" aria-hidden />
      <div className="camada c2" aria-hidden />
      <div className="camada c3" aria-hidden />
      <div className="camada c4" aria-hidden />
      <span className="coracao h1" aria-hidden>♡</span>
      <span className="coracao h2" aria-hidden>✦</span>
      <span className="coracao h3" aria-hidden>♡</span>

      <div className="palco-conteudo">
        <p className="ola">Oi, {nome} ♡</p>
        <p className="sobretitulo">Nathan & Iris estão namorando há</p>

        {!dataNamoro ? (
          <p className="vazio">As datas ainda não foram cadastradas.</p>
        ) : (
          <div className="card vidro-forte contador">
            <div className="nums">
              <Numero valor={namoro?.anos ?? 0} rotulo={plural(namoro?.anos ?? 0, "ano", "anos")} ativo={ativo} />
              <Numero valor={namoro?.meses ?? 0} rotulo={plural(namoro?.meses ?? 0, "mês", "meses")} ativo={ativo} />
              <Numero valor={namoro?.dias ?? 0} rotulo={plural(namoro?.dias ?? 0, "dia", "dias")} ativo={ativo} />
            </div>
            {namoro && <Relogio t={namoro} />}
            {namoro && <p className="total">{namoro.totalDias.toLocaleString("pt-BR")} dias de namoro</p>}
          </div>
        )}

        {amizade && (
          <div className="card amizade">
            <span className="amizade-rotulo">e amigos há</span>
            <span className="amizade-valor">
              {amizade.anos > 0 && `${amizade.anos} ${plural(amizade.anos, "ano", "anos")}, `}
              {amizade.meses} {plural(amizade.meses, "mês", "meses")} e {amizade.dias} {plural(amizade.dias, "dia", "dias")}
            </span>
            <span className="item-meta">{amizade.totalDias.toLocaleString("pt-BR")} dias de amizade</span>
          </div>
        )}

        <span className="rolar" aria-hidden>⌄</span>
      </div>
    </section>
  );
}
