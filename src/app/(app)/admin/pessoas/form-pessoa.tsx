"use client";

import { useActionState } from "react";
import { salvarPessoa, type EstadoForm } from "./actions";

export function FormPessoa({ id, nome, email, souEu }: { id: string; nome: string; email: string; souEu: boolean }) {
  const [estado, acao, enviando] = useActionState<EstadoForm, FormData>(salvarPessoa, {});
  return (
    <form action={acao} className="card formulario">
      <h2 style={{ margin: 0, fontSize: 20 }}>
        {nome}
        {souEu && <span className="contagem">você</span>}
      </h2>
      <input type="hidden" name="id" value={id} />
      <label>
        Nome
        <input name="nome" defaultValue={nome} maxLength={40} required autoComplete="off" />
      </label>
      <label>
        E-mail
        <input name="email" type="email" defaultValue={email} required autoComplete="off" />
      </label>
      <fieldset className="formulario" style={{ padding: 0 }}>
        <legend>Nova senha (deixe em branco para manter)</legend>
        <label>
          Nova senha
          <input name="novaSenha" type="password" minLength={8} autoComplete="new-password" />
        </label>
        <label>
          Repita a nova senha
          <input name="confirmacao" type="password" minLength={8} autoComplete="new-password" />
        </label>
        <label>
          Sua senha atual (só para trocar senha)
          <input name="senhaAtual" type="password" autoComplete="current-password" />
        </label>
      </fieldset>
      {estado.erro && <p className="erro" role="alert">{estado.erro}</p>}
      {estado.ok && <p className="ok" role="status">{estado.ok}</p>}
      <button className="botao" disabled={enviando}>{enviando ? "Salvando…" : "Salvar"}</button>
    </form>
  );
}
