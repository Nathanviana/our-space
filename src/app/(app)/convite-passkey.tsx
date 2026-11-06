"use client";

import { useEffect, useState } from "react";
import { platformAuthenticatorIsAvailable } from "@simplewebauthn/browser";
import { cadastrarEsteAparelho, lerMarca, marcar } from "@/lib/passkey-cliente";

// Convite discreto na Início: só aparece em aparelho com Face ID/digital que ainda não tem passkey
export function ConvitePasskey() {
  const [estado, setEstado] = useState<"oculto" | "convite" | "cadastrando" | "pronto">("oculto");
  const [erro, setErro] = useState<string>();

  useEffect(() => {
    if (lerMarca()) return;
    platformAuthenticatorIsAvailable()
      .then((ok) => ok && setEstado("convite"))
      .catch(() => {});
  }, []);

  if (estado === "oculto") return null;

  async function ativar() {
    setEstado("cadastrando");
    setErro(undefined);
    const r = await cadastrarEsteAparelho();
    if (r.ok) setEstado("pronto");
    else {
      setEstado("convite");
      if (r.erro) setErro(r.erro);
      if (r.erro === "Este aparelho já está cadastrado.") setEstado("oculto");
    }
  }

  function dispensar() {
    marcar("dispensada");
    setEstado("oculto");
  }

  return (
    <aside className="card convite-passkey" aria-live="polite">
      <span className="convite-icone" aria-hidden>{estado === "pronto" ? "✓" : "☺"}</span>
      {estado === "pronto" ? (
        <div className="convite-texto">
          <strong>Pronto!</strong>
          <span>Da próxima vez, é só usar o Face ID ou a digital para entrar.</span>
        </div>
      ) : (
        <>
          <div className="convite-texto">
            <strong>Entrar sem digitar a senha?</strong>
            <span>Ative o Face ID ou a digital neste aparelho.</span>
            {erro && <span className="erro">{erro}</span>}
          </div>
          <div className="convite-acoes">
            <button type="button" className="botao pequeno" onClick={ativar} disabled={estado === "cadastrando"}>
              {estado === "cadastrando" ? "Ativando…" : "Ativar"}
            </button>
            <button type="button" className="botao fantasma pequeno" onClick={dispensar}>
              Agora não
            </button>
          </div>
        </>
      )}
    </aside>
  );
}
