"use client";

import { useEffect, useState } from "react";
import { useReduzirMovimento } from "@/components/movimento";

const FRASES = ["Tudo o que queremos viver", "e tudo o que já vivemos", "num lugar só nosso"];

// Painel decorativo: esferas pastel de vidro e um coração "3D" flutuando, com frases que se revezam
export function ArteLogin() {
  const reduzir = useReduzirMovimento();
  const [frase, setFrase] = useState(0);

  useEffect(() => {
    if (reduzir) return;
    const id = setInterval(() => setFrase((f) => (f + 1) % FRASES.length), 3200);
    return () => clearInterval(id);
  }, [reduzir]);

  return (
    <section className="login-arte" aria-hidden>
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

      <span className="selo-casal">N <i>♡</i> I</span>

      <p className="arte-frase">
        {FRASES.map((f, i) => (
          <span key={f} className={i === frase ? "ativa" : ""}>{f}</span>
        ))}
      </p>
    </section>
  );
}
