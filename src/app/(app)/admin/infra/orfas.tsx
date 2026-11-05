"use client";

import { useRef, useState, useTransition } from "react";
import { apagarOrfas } from "./actions";

const LIMITE = 200;

export function Orfas({ orfas }: { orfas: string[] }) {
  const [confirmacao, setConfirmacao] = useState("");
  const [res, setRes] = useState<{ erro?: string; ok?: string }>({});
  const [pendente, iniciar] = useTransition();
  const dialogo = useRef<HTMLDialogElement>(null);
  const lote = orfas.slice(0, LIMITE);

  function confirmar() {
    dialogo.current?.close();
    iniciar(async () => setRes(await apagarOrfas(lote, confirmacao)));
  }

  return (
    <div className="card formulario">
      <p style={{ margin: 0 }}>
        {orfas.length
          ? `${orfas.length} arquivo(s) no armazenamento sem foto correspondente no banco.`
          : "Nenhum arquivo órfão. Tudo em ordem."}
      </p>
      {res.erro && <p className="erro" role="alert">{res.erro}</p>}
      {res.ok && <p className="ok" role="status">{res.ok}</p>}
      {orfas.length > 0 && (
        <button
          className="botao perigo"
          disabled={pendente}
          onClick={() => {
            setConfirmacao("");
            setRes({});
            dialogo.current?.showModal();
          }}
        >
          {pendente ? "Apagando…" : `Apagar ${lote.length} órfão(s)`}
        </button>
      )}
      <dialog ref={dialogo} className="dialogo">
        <form method="dialog" className="formulario" onSubmit={(e) => { e.preventDefault(); confirmar(); }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>Apagar de vez?</h2>
          <p style={{ margin: 0 }}>Você vai apagar {lote.length} arquivo(s) do armazenamento. Isso não tem volta.</p>
          <label>
            Digite <strong>apagar</strong> para confirmar
            <input value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} autoComplete="off" autoFocus />
          </label>
          <div className="acoes">
            <button type="button" className="botao fantasma" onClick={() => dialogo.current?.close()}>Cancelar</button>
            <button className="botao perigo" disabled={confirmacao.trim().toLowerCase() !== "apagar"}>Apagar</button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
