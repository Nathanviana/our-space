"use client";

import { Pencil, Trash2 } from "lucide-react";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import type { Tema } from "@/lib/types";
import { tom } from "@/lib/tom";
import { criarTema, excluirTema, renomearTema, type EstadoTema } from "./actions";

const ICONES = ["✦", "🌿", "✈️", "🎲", "🎬", "🍝", "🌊", "🍣", "🎵", "📚", "🏕️", "🎨", "☕", "🎡", "🏃", "💛"];

function EscolherIcone({ valor, aoMudar }: { valor: string; aoMudar: (v: string) => void }) {
  return (
    <div className="icones" role="radiogroup" aria-label="Ícone">
      {ICONES.map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={valor === i}
          className={`icone-opcao ${valor === i ? "ativo" : ""}`}
          onClick={() => aoMudar(i)}
        >
          {i}
        </button>
      ))}
    </div>
  );
}

function LinhaTema({ tema, indice, qtd }: { tema: Tema; indice: number; qtd: number }) {
  const [editando, setEditando] = useState(false);
  const [icone, setIcone] = useState(tema.icone);
  const [estadoRen, renomear, renomeando] = useActionState<EstadoTema, FormData>(renomearTema, {});
  const [estadoExc, excluir, excluindo] = useActionState<EstadoTema, FormData>(excluirTema, {});

  useEffect(() => {
    if (estadoRen.ok) setEditando(false);
  }, [estadoRen]);

  if (editando) {
    return (
      <form action={renomear} className="card formulario">
        <input type="hidden" name="id" value={tema.id} />
        <input type="hidden" name="icone" value={icone} />
        <label>
          Nome do tema
          <input name="nome" defaultValue={tema.nome} maxLength={40} autoFocus required />
        </label>
        <EscolherIcone valor={icone} aoMudar={setIcone} />
        {estadoRen.erro && <p role="alert" className="erro">{estadoRen.erro}</p>}
        <div className="acoes">
          <button type="button" className="botao fantasma" onClick={() => setEditando(false)}>Cancelar</button>
          <button type="submit" className="botao" disabled={renomeando}>Salvar</button>
        </div>
      </form>
    );
  }

  return (
    <div className="card item">
      <Link href={`/temas/${tema.id}`} className="item-link">
        <span className={`item-icone ${tom(indice)}`} aria-hidden>{tema.icone}</span>
        <span className="item-texto">
          <span className="item-titulo">{tema.nome}</span>
          <span className="item-meta">
            {qtd} {qtd === 1 ? "plano" : "planos"}
            {tema.padrao ? " · padrão" : ""}
          </span>
        </span>
      </Link>
      <button type="button" className="botao-icone" aria-label={`Editar ${tema.nome}`} onClick={() => setEditando(true)}><Pencil size={17} /></button>
      {qtd === 0 && (
        <form action={excluir}>
          <input type="hidden" name="id" value={tema.id} />
          <button
            type="submit"
            className="botao-icone"
            aria-label={`Excluir ${tema.nome}`}
            disabled={excluindo}
            onClick={(e) => {
              if (!confirm(`Excluir o tema "${tema.nome}"?`)) e.preventDefault();
            }}
          >
            <Trash2 size={17} />
          </button>
        </form>
      )}
      {estadoExc.erro && <p role="alert" className="erro">{estadoExc.erro}</p>}
    </div>
  );
}

function NovoTema() {
  const [aberto, setAberto] = useState(false);
  const [icone, setIcone] = useState("✦");
  const [estado, criar, criando] = useActionState<EstadoTema, FormData>(criarTema, {});

  useEffect(() => {
    if (estado.ok) {
      setAberto(false);
      setIcone("✦");
    }
  }, [estado]);

  if (!aberto) {
    return <button className="botao secundario" onClick={() => setAberto(true)}>+ Novo tema</button>;
  }
  return (
    <form action={criar} className="card formulario">
      <input type="hidden" name="icone" value={icone} />
      <label>
        Nome do tema
        <input name="nome" maxLength={40} placeholder="Ex.: Shows" autoFocus required />
      </label>
      <EscolherIcone valor={icone} aoMudar={setIcone} />
      {estado.erro && <p role="alert" className="erro">{estado.erro}</p>}
      <div className="acoes">
        <button type="button" className="botao fantasma" onClick={() => setAberto(false)}>Cancelar</button>
        <button type="submit" className="botao" disabled={criando}>Criar tema</button>
      </div>
    </form>
  );
}

export function EditorTemas({ temas, contagem }: { temas: Tema[]; contagem: Record<string, number> }) {
  return (
    <>
      <div className="lista">
        {temas.map((t, i) => (
          <LinhaTema key={t.id} tema={t} indice={i} qtd={contagem[t.id] ?? 0} />
        ))}
      </div>
      <NovoTema />
    </>
  );
}
