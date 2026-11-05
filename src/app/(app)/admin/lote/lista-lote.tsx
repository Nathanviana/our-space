"use client";

import { useRef, useState, useTransition } from "react";
import type { ItemLote, TipoLote } from "@/lib/dados/admin";
import type { Tema } from "@/lib/types";
import { apagarLote, contarExclusao, marcarPlanos, moverPlanos, type Contagem, type Resultado } from "./actions";

const LIMITE = 200;

function descreverExclusao(tipo: TipoLote, c: Contagem): string {
  if (tipo === "temas") {
    const pulados = c.temasComPlanos ? ` ${c.temasComPlanos} tema(s) com planos serão pulados.` : "";
    return `Você vai apagar ${c.temas} tema(s).${pulados}`;
  }
  const partes = [
    c.planos && `${c.planos} plano(s)`,
    c.memorias && `${c.memorias} memória(s)`,
    `${c.fotos} foto(s)`,
  ].filter(Boolean);
  const texto = partes.length > 1 ? `${partes.slice(0, -1).join(", ")} e ${partes.at(-1)}` : partes[0];
  return `Você vai apagar ${texto}. Isso não tem volta.`;
}

export function ListaLote({ tipo, itens, temas }: { tipo: TipoLote; itens: ItemLote[]; temas: Tema[] }) {
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [res, setRes] = useState<Resultado>({});
  const [contagem, setContagem] = useState<Contagem | null>(null);
  const [confirmacao, setConfirmacao] = useState("");
  const [destino, setDestino] = useState("");
  const [pendente, iniciar] = useTransition();
  const dialogo = useRef<HTMLDialogElement>(null);

  const ids = [...sel];
  const todos = itens.length > 0 && itens.every((i) => sel.has(i.id));
  const passou = ids.length > LIMITE;

  function alternar(id: string) {
    setSel((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function executar(acao: () => Promise<Resultado>) {
    setRes({});
    iniciar(async () => {
      const r = await acao();
      setRes(r);
      if (r.ok) setSel(new Set());
    });
  }

  function abrirApagar() {
    setRes({});
    setConfirmacao("");
    iniciar(async () => {
      const c = await contarExclusao(tipo, ids);
      if (c.erro) return setRes({ erro: c.erro });
      setContagem(c);
      dialogo.current?.showModal();
    });
  }

  function confirmarApagar() {
    dialogo.current?.close();
    executar(() => apagarLote(tipo, ids, confirmacao));
  }

  if (!itens.length) return <p className="vazio">Nada para mostrar aqui.</p>;

  return (
    <>
      <label className="card lote-linha">
        <input
          type="checkbox"
          checked={todos}
          onChange={() => setSel(todos ? new Set() : new Set(itens.map((i) => i.id)))}
        />
        <span>Selecionar todos os {itens.length} visíveis</span>
      </label>

      <ul className="lista" style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {itens.map((i) => (
          <li key={i.id}>
            <label className="card lote-linha">
              <input type="checkbox" checked={sel.has(i.id)} onChange={() => alternar(i.id)} />
              {i.miniatura && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={i.miniatura} alt="" width={48} height={48} style={{ borderRadius: 10, objectFit: "cover" }} />
              )}
              <span className="item-texto">
                <span className="item-titulo">{i.titulo}</span>
                <span className="item-meta">{i.detalhe}</span>
              </span>
            </label>
          </li>
        ))}
      </ul>

      {(sel.size > 0 || res.ok || res.erro) && (
        <div className="card lote-barra" role="region" aria-label="Ações em lote">
          <strong style={{ width: "100%" }}>{sel.size} selecionado(s)</strong>
          {passou && <p className="erro" style={{ width: "100%" }}>No máximo {LIMITE} itens por vez.</p>}
          {res.erro && <p className="erro" role="alert" style={{ width: "100%" }}>{res.erro}</p>}
          {res.ok && <p className="ok" role="status" style={{ width: "100%" }}>{res.ok}</p>}

          {sel.size > 0 && tipo === "planos" && (
            <>
              <select value={destino} onChange={(e) => setDestino(e.target.value)} aria-label="Mover para o tema">
                <option value="">Mover para…</option>
                {temas.map((t) => (
                  <option key={t.id} value={t.id}>{t.icone} {t.nome}</option>
                ))}
              </select>
              <button className="botao secundario" disabled={pendente || passou || !destino} onClick={() => executar(() => moverPlanos(ids, destino))}>
                Mover
              </button>
              <button className="botao secundario" disabled={pendente || passou} onClick={() => executar(() => marcarPlanos(ids, "vamos_fazer"))}>
                Vamos fazer
              </button>
              <button className="botao secundario" disabled={pendente || passou} onClick={() => executar(() => marcarPlanos(ids, "ja_fizemos"))}>
                Já fizemos
              </button>
            </>
          )}
          {sel.size > 0 && (
            <button className="botao perigo" disabled={pendente || passou} onClick={abrirApagar}>
              {pendente ? "Aguarde…" : "Apagar"}
            </button>
          )}
        </div>
      )}

      <dialog ref={dialogo} className="dialogo" onClose={() => setContagem(null)}>
        <form method="dialog" className="formulario" onSubmit={(e) => { e.preventDefault(); confirmarApagar(); }}>
          <h2 style={{ margin: 0, fontSize: 20 }}>Apagar de vez?</h2>
          {contagem && <p style={{ margin: 0 }}>{descreverExclusao(tipo, contagem)}</p>}
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
    </>
  );
}
