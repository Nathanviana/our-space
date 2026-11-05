"use client";

import { useActionState } from "react";
import { entrar, type EstadoLogin } from "./actions";

export function FormLogin() {
  const [estado, acao, enviando] = useActionState<EstadoLogin, FormData>(entrar, {});
  return (
    <form action={acao} className="card formulario login-card">
      <h1>Nosso Espaço</h1>
      <p className="subtitulo">Só para Nathan e Iris</p>
      <label>
        E-mail
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        Senha
        <input name="senha" type="password" autoComplete="current-password" required />
      </label>
      {estado.erro && (
        <p role="alert" className="erro">
          {estado.erro}
        </p>
      )}
      <button type="submit" className="botao" disabled={enviando}>
        {enviando ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}
