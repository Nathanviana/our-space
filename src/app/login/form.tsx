"use client";

import { useActionState, useState } from "react";
import { entrar, type EstadoLogin } from "./actions";

function Olho({ aberto }: { aberto: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {!aberto && <path d="M4 4l16 16" />}
    </svg>
  );
}

export function FormLogin() {
  const [estado, acao, enviando] = useActionState<EstadoLogin, FormData>(entrar, {});
  const [ver, setVer] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  const checarCaps = (e: React.KeyboardEvent<HTMLInputElement>) => setCapsLock(e.getModifierState("CapsLock"));

  return (
    <section className="login-lado">
      <span className="login-marca">
        <i aria-hidden>♡</i> Nosso Espaço
      </span>

      <form action={acao} className="login-form">
        <header className="login-cabecalho">
          <h1>
            Que bom te ver <em>de novo</em>
          </h1>
          <p>Entre para continuar o que vocês estão construindo juntos.</p>
        </header>

        <label className="campo">
          <span>E-mail</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="voce@email.com"
            defaultValue={estado.email ?? ""}
            required
          />
        </label>

        <label className="campo">
          <span>Senha</span>
          <span className="campo-senha">
            <input
              name="senha"
              type={ver ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Sua senha"
              required
              onKeyDown={checarCaps}
              onKeyUp={checarCaps}
              onBlur={() => setCapsLock(false)}
            />
            <button
              type="button"
              className="ver-senha"
              onClick={() => setVer((v) => !v)}
              aria-label={ver ? "Esconder senha" : "Mostrar senha"}
              aria-pressed={ver}
              title={ver ? "Esconder senha" : "Mostrar senha"}
            >
              <Olho aberto={!ver} />
            </button>
          </span>
          {capsLock && <small className="aviso-caps">Caps Lock está ligado</small>}
        </label>

        {estado.erro && (
          <p role="alert" className="erro login-erro">
            {estado.erro}
          </p>
        )}

        <button type="submit" className="botao login-botao" disabled={enviando}>
          {enviando ? (
            <>
              <span className="girando" aria-hidden /> Entrando...
            </>
          ) : (
            <>
              Entrar <span aria-hidden>→</span>
            </>
          )}
        </button>
      </form>

      <p className="login-rodape">Só para Nathan e Iris · um cantinho só nosso</p>
    </section>
  );
}
