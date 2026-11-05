"use client";

import { useEffect, useRef, useState } from "react";

// Respeita "reduzir movimento" do celular (REQ-13, critério 3; RNF-05)
export function useReduzirMovimento() {
  const [reduzir, setReduzir] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduzir(mq.matches);
    const ouvir = () => setReduzir(mq.matches);
    mq.addEventListener("change", ouvir);
    return () => mq.removeEventListener("change", ouvir);
  }, []);
  return reduzir;
}

// Número que sobe suavemente até o valor (ease-out)
export function useContagem(alvo: number, ativo: boolean, duracao = 1400) {
  const reduzir = useReduzirMovimento();
  const [valor, setValor] = useState(0);
  useEffect(() => {
    if (!ativo) return;
    if (reduzir || alvo === 0) {
      setValor(alvo);
      return;
    }
    let quadro = 0;
    const inicio = performance.now();
    const passo = (t: number) => {
      const p = Math.min(1, (t - inicio) / duracao);
      setValor(Math.round(alvo * (1 - Math.pow(1 - p, 4))));
      if (p < 1) quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro);
  }, [alvo, ativo, duracao, reduzir]);
  return valor;
}

// Elemento entra na tela: aparece de baixo para cima
export function Revelar({ children, atraso = 0, className = "" }: { children: React.ReactNode; atraso?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visivel, setVisivel] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisivel(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className={`revelar ${visivel ? "visivel" : ""} ${className}`} style={{ transitionDelay: `${atraso}ms` }}>
      {children}
    </div>
  );
}

// Visível na tela (para disparar a contagem quando a seção aparece)
export function useVisivel<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [visivel, setVisivel] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && (setVisivel(true), obs.disconnect()), { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return [ref, visivel] as const;
}
