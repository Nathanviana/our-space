"use client";

import { Heart, Images } from "lucide-react";

import { useActionState, useState } from "react";
import { ArteLogin } from "@/app/login/arte";
import { MAX_POLAROIDS, type ModoArte } from "@/lib/login-arte";
import type { ConfigArteAdmin } from "@/lib/dados/login-arte";
import { salvarArteLogin, type EstadoForm } from "./actions";

export function FormArteLogin({ migracaoPendente, modo: modoInicial, escolhidas, candidatas }: ConfigArteAdmin) {
  const [estado, acao, enviando] = useActionState<EstadoForm, FormData>(salvarArteLogin, {});
  const [modo, setModo] = useState<ModoArte>(modoInicial);
  const [selecao, setSelecao] = useState<string[]>(escolhidas.filter((id) => candidatas.some((c) => c.id === id)));

  const alternar = (id: string) =>
    setSelecao((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length >= MAX_POLAROIDS ? s : [...s, id]));

  const previa = selecao
    .map((id) => candidatas.find((c) => c.id === id))
    .filter((c) => c !== undefined)
    .map((c) => ({ id: c.id, url: c.urlMini, legenda: c.legenda }));

  return (
    <form action={acao} className="card formulario">
      <h2 style={{ margin: 0, fontSize: 20 }}>Arte da tela de login</h2>
      {migracaoPendente && <p className="erro" role="alert">Falta aplicar a migração da arte do login no banco.</p>}

      <fieldset>
        <legend>O que aparece ao lado do formulário</legend>
        <div className="opcoes-arte">
          <label className={`opcao-arte ${modo === "coracao" ? "ativa" : ""}`}>
            <input type="radio" name="modo" value="coracao" checked={modo === "coracao"} onChange={() => setModo("coracao")} />
            <span className="opcao-arte-icone" aria-hidden><Heart size={22} /></span>
            <strong>Coração</strong>
            <span>O coração 3D com as esferas pastel</span>
          </label>
          <label className={`opcao-arte ${modo === "polaroids" ? "ativa" : ""}`}>
            <input type="radio" name="modo" value="polaroids" checked={modo === "polaroids"} onChange={() => setModo("polaroids")} />
            <span className="opcao-arte-icone" aria-hidden><Images size={22} /></span>
            <strong>Polaroids</strong>
            <span>Até {MAX_POLAROIDS} fotos de vocês espalhadas</span>
          </label>
        </div>
      </fieldset>

      {modo === "polaroids" && (
        <>
          <div className="escolha-topo">
            <span>Escolha as fotos, na ordem</span>
            <span className="contagem-escolha">{selecao.length} de {MAX_POLAROIDS}</span>
          </div>
          {candidatas.length === 0 ? (
            <p className="vazio">Ainda não há fotos. Registre uma memória com fotos primeiro.</p>
          ) : (
            <div className="grade-escolha">
              {candidatas.map((c) => {
                const pos = selecao.indexOf(c.id);
                const cheio = pos < 0 && selecao.length >= MAX_POLAROIDS;
                return (
                  <button
                    key={c.id}
                    type="button"
                    className={`foto-escolha ${pos >= 0 ? "escolhida" : ""}`}
                    onClick={() => alternar(c.id)}
                    aria-pressed={pos >= 0}
                    aria-label={`${c.legenda || "Foto"}${pos >= 0 ? `, escolhida em ${pos + 1}º` : ""}`}
                    disabled={cheio}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.urlMini} alt="" loading="lazy" />
                    {pos >= 0 && <span className="ordem-escolha">{pos + 1}</span>}
                  </button>
                );
              })}
            </div>
          )}
          <p className="aviso-privacidade">
            Estas fotos aparecem na tela de login, antes de entrar: quem tiver o link do site consegue vê-las.
          </p>
        </>
      )}

      <div className="previa-login" aria-label="Prévia da arte do login">
        <span className="rotulo-secao">Prévia</span>
        <ArteLogin modo={modo} fotos={previa} />
      </div>

      <input type="hidden" name="fotos" value={selecao.join(",")} />
      {estado.erro && <p className="erro" role="alert">{estado.erro}</p>}
      {estado.ok && <p className="ok" role="status">{estado.ok}</p>}
      <button className="botao" disabled={enviando || migracaoPendente}>{enviando ? "Salvando…" : "Salvar arte do login"}</button>
    </form>
  );
}
