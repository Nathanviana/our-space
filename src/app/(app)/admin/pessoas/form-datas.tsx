"use client";

import { useActionState } from "react";
import { salvarDatas, type EstadoForm } from "./actions";

export function FormDatas({ amizade, namoro }: { amizade: string; namoro: string }) {
  const [estado, acao, enviando] = useActionState<EstadoForm, FormData>(salvarDatas, {});
  return (
    <form action={acao} className="card formulario">
      <h2 style={{ margin: 0, fontSize: 20 }}>Tempo juntos</h2>
      <label>
        Início da amizade
        <input name="amizade" type="date" defaultValue={amizade} required />
      </label>
      <label>
        Início do namoro
        <input name="namoro" type="date" defaultValue={namoro} required />
      </label>
      {estado.erro && <p className="erro" role="alert">{estado.erro}</p>}
      {estado.ok && <p className="ok" role="status">{estado.ok}</p>}
      <button className="botao" disabled={enviando}>{enviando ? "Salvando…" : "Salvar datas"}</button>
    </form>
  );
}
