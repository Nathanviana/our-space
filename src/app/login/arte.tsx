"use client";

import { useEffect, useState } from "react";
import { useReduzirMovimento } from "@/components/movimento";
import { lugaresDasPolaroids, type ModoArte } from "@/lib/login-arte";

export interface FotoPolaroid {
  id: string;
  url: string;
  legenda: string;
}

// Fotos do casal espalhadas como polaroids, cada uma inclinada e flutuando no seu ritmo
function Polaroids({ fotos }: { fotos: FotoPolaroid[] }) {
  const lugares = lugaresDasPolaroids(fotos.length);
  return (
    <>
      {fotos.slice(0, lugares.length).map((f, i) => {
        const { desktop: [x, y, r], celular } = lugares[i];
        const estilo = {
          "--x": `${x}%`, "--y": `${y}%`, "--r": `${r}deg`,
          "--xm": `${celular?.[0] ?? x}%`, "--ym": `${celular?.[1] ?? y}%`, "--rm": `${celular?.[2] ?? r}deg`,
          animationDelay: `${-i * 1.3}s`,
        } as React.CSSProperties;
        return (
          <figure key={f.id} className={`polaroid ${celular ? "" : "so-desktop"}`} style={estilo}>
            {/* URL assinada do Storage: <img> simples, sem otimizador de imagem */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={f.url} alt="" loading="eager" decoding="async" />
            <figcaption>{f.legenda || "\u00a0"}</figcaption>
          </figure>
        );
      })}
    </>
  );
}

const FRASES = ["Tudo o que queremos viver", "e tudo o que já vivemos", "num lugar só nosso"];

// Painel decorativo: coração "3D" com esferas pastel, ou polaroids com fotos do casal (escolha no admin)
export function ArteLogin({ modo = "coracao", fotos = [] }: { modo?: ModoArte; fotos?: FotoPolaroid[] }) {
  const polaroids = modo === "polaroids" && fotos.length > 0;
  const reduzir = useReduzirMovimento();
  const [frase, setFrase] = useState(0);

  useEffect(() => {
    if (reduzir) return;
    const id = setInterval(() => setFrase((f) => (f + 1) % FRASES.length), 3200);
    return () => clearInterval(id);
  }, [reduzir]);

  return (
    <section className={`login-arte ${polaroids ? "com-polaroids" : ""}`} aria-hidden>
      {polaroids ? (
        <>
          <span className="esfera e2" />
          <span className="esfera e4" />
          <Polaroids fotos={fotos} />
        </>
      ) : (
        <>
          <span className="esfera e1" />
          <span className="esfera e2" />
          <span className="esfera e3" />
          <span className="esfera e4" />
          <span className="esfera e5" />

          <svg className="coracao-3d" viewBox="0 0 200 180">
            <defs>
              <linearGradient id="coracao-cor" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f3c7e0" />
                <stop offset="45%" stopColor="#b9a5ec" />
                <stop offset="100%" stopColor="#8fb8e8" />
              </linearGradient>
              <radialGradient id="coracao-brilho" cx="0.32" cy="0.28" r="0.55">
                <stop offset="0%" stopColor="#fff" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#fff" stopOpacity="0" />
              </radialGradient>
            </defs>
            <path
              d="M100 170 C 40 125 8 92 8 55 C 8 26 30 6 57 6 C 76 6 92 16 100 32 C 108 16 124 6 143 6 C 170 6 192 26 192 55 C 192 92 160 125 100 170 Z"
              fill="url(#coracao-cor)"
            />
            <path
              d="M100 170 C 40 125 8 92 8 55 C 8 26 30 6 57 6 C 76 6 92 16 100 32 C 108 16 124 6 143 6 C 170 6 192 26 192 55 C 192 92 160 125 100 170 Z"
              fill="url(#coracao-brilho)"
            />
            <ellipse cx="58" cy="44" rx="20" ry="11" fill="#fff" opacity="0.7" transform="rotate(-28 58 44)" />
          </svg>
          <span className="sombra-coracao" />
        </>
      )}

      <span className="selo-casal">N <i>♡</i> I</span>

      <p className="arte-frase">
        {FRASES.map((f, i) => (
          <span key={f} className={i === frase ? "ativa" : ""}>{f}</span>
        ))}
      </p>
    </section>
  );
}
