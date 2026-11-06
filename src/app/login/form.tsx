"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { browserSupportsWebAuthn, browserSupportsWebAuthnAutofill } from "@simplewebauthn/browser";
import { entrarComFaceId } from "@/lib/passkey-cliente";
import { entrar, type EstadoLogin } from "./actions";

function Digital() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 11v3a8 8 0 0 1-1.5 4.7" />
      <path d="M8.6 9.6A4 4 0 0 1 16 11v1.5a12 12 0 0 1-.9 4.6" />
      <path d="M5.3 8.6A8 8 0 0 1 20 11v1a16 16 0 0 1-.6 4.3" />
      <path d="M4 13a12 12 0 0 0 .8 4.3" />
      <path d="M8 14a8 8 0 0 0 1 4" />
      <path d="M7.5 4.6A10 10 0 0 1 17 4" />
    </svg>
  );
}

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

  const [temPasskey, setTemPasskey] = useState(false);
  const [faceId, setFaceId] = useState<{ carregando: boolean; erro?: string }>({ carregando: false });
  const botaoComecou = useRef(false);

  // Mostra o botão só onde há suporte; e oferece a passkey como sugestão no campo de e-mail
  useEffect(() => {
    if (!browserSupportsWebAuthn()) return;
    setTemPasskey(true);
    let ativo = true;
    browserSupportsWebAuthnAutofill().then((suporta) => {
      if (!suporta || !ativo) return;
      entrarComFaceId(true, () => ativo && !botaoComecou.current).then((r) => {
        if (r.ok) window.location.assign("/");
        else if (r.erro && ativo) setFaceId({ carregando: false, erro: r.erro });
      });
    });
    return () => {
      ativo = false;
    };
  }, []);

  async function usarFaceId() {
    botaoComecou.current = true;
    setFaceId({ carregando: true });
    const r = await entrarComFaceId();
    if (r.ok) {
      window.location.assign("/");
      return;
    }
    botaoComecou.current = false;
    setFaceId({ carregando: false, erro: r.erro });
  }

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
            autoComplete="username webauthn"
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

        {faceId.erro && (
          <p role="alert" className="erro login-erro">
            {faceId.erro}
          </p>
        )}

        <button type="submit" className="botao login-botao" disabled={enviando || faceId.carregando}>
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

        {temPasskey && (
          <>
            <span className="login-ou">ou</span>
            <button type="button" className="botao secundario login-faceid" onClick={usarFaceId} disabled={enviando || faceId.carregando}>
              {faceId.carregando ? <span className="girando escuro" aria-hidden /> : <Digital />}
              {faceId.carregando ? "Confirmando..." : "Usar Face ID ou digital"}
            </button>
          </>
        )}
      </form>

      <p className="login-rodape">Só para Nathan e Iris · um cantinho só nosso</p>
    </section>
  );
}
