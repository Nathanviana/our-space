"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { browserSupportsWebAuthn } from "@simplewebauthn/browser";
import type { PasskeyListada } from "@/lib/passkey";
import { cadastrarEsteAparelho } from "@/lib/passkey-cliente";
import { removerPasskey } from "./actions";

const data = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", year: "numeric" });
const quando = (iso: string) => data.format(new Date(iso)).replace(".", "");

export function Passkeys({ lista, pendente }: { lista: PasskeyListada[]; pendente: boolean }) {
  const router = useRouter();
  const [suporta, setSuporta] = useState(false);
  const [msg, setMsg] = useState<{ erro?: string; ok?: string }>({});
  const [cadastrando, setCadastrando] = useState(false);
  const [confirmar, setConfirmar] = useState<string | null>(null);
  const [removendo, iniciarRemocao] = useTransition();

  useEffect(() => setSuporta(browserSupportsWebAuthn()), []);

  async function cadastrar() {
    setCadastrando(true);
    setMsg({});
    const r = await cadastrarEsteAparelho();
    setCadastrando(false);
    if (r.ok) {
      setMsg({ ok: `Pronto! ${r.aparelho} já entra com Face ID ou digital.` });
      router.refresh();
    } else if (r.erro) setMsg({ erro: r.erro });
  }

  function remover(id: string) {
    iniciarRemocao(async () => {
      const r = await removerPasskey(id);
      setConfirmar(null);
      setMsg(r);
      if (r.ok) router.refresh();
    });
  }

  return (
    <section className="card formulario">
      <h2 style={{ margin: 0, fontSize: 20 }}>Entrar com Face ID ou digital</h2>
      <p className="subtitulo" style={{ fontSize: 15 }}>
        Cada aparelho cadastrado entra sem senha, usando o Face ID, a digital ou o bloqueio de tela. A senha continua valendo.
      </p>
      {pendente && <p className="erro" role="alert">Falta aplicar a migração de passkeys no banco.</p>}

      {lista.length > 0 && (
        <ul className="lista-passkeys">
          {lista.map((p) => (
            <li key={p.id}>
              <span className="passkey-icone" aria-hidden>⌁</span>
              <span className="item-texto">
                <strong>{p.aparelho}</strong>
                <span className="item-meta">
                  {p.minha ? "Sua" : `De ${p.dono}`} · criada em {quando(p.criadaEm)}
                  {p.usadaEm ? ` · usada em ${quando(p.usadaEm)}` : " · ainda não usada"}
                </span>
              </span>
              {confirmar === p.id ? (
                <button type="button" className="botao perigo pequeno" onClick={() => remover(p.id)} disabled={removendo}>
                  {removendo ? "Removendo…" : "Confirmar"}
                </button>
              ) : (
                <button type="button" className="botao fantasma pequeno" onClick={() => setConfirmar(p.id)}>
                  Remover
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {msg.erro && <p className="erro" role="alert">{msg.erro}</p>}
      {msg.ok && <p className="ok" role="status">{msg.ok}</p>}

      {suporta ? (
        <button type="button" className="botao" onClick={cadastrar} disabled={cadastrando || pendente}>
          {cadastrando ? "Esperando o Face ID…" : "Cadastrar este aparelho"}
        </button>
      ) : (
        <p className="vazio">Este navegador não aceita passkeys.</p>
      )}
    </section>
  );
}
