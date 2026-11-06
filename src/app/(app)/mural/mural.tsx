"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Camera, Check, Heart, Images, LayoutGrid, MapPin, Plus, Search, SlidersHorizontal, Star, X } from "lucide-react";
import { tom } from "@/lib/tom";
import { destacar, filtrarMural, inclinacao, jeitoDoCartao, FILTRO_INICIAL, type FiltroMural, type ItemMural } from "@/lib/mural";
import type { Tema } from "@/lib/types";

const curta = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", year: "numeric" });
const dataCurta = (iso: string) => curta.format(new Date(`${iso.slice(0, 10)}T12:00:00`)).replace(/\./g, "");
const diaMes = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short" });
const dataCarimbo = (iso: string) => diaMes.format(new Date(`${iso.slice(0, 10)}T12:00:00`)).replace(/\./g, "").replace(" de ", " ");

function Marcado({ texto, busca }: { texto: string; busca: string }) {
  return (
    <>
      {destacar(texto, busca).map((p, i) => (p.marca ? <mark key={i}>{p.t}</mark> : <span key={i}>{p.t}</span>))}
    </>
  );
}

function Selo({ item }: { item: ItemMural }) {
  return item.situacao === "ja_fizemos" ? (
    <span className="selo-situacao feito"><Heart size={12} aria-hidden /> Já fizemos</span>
  ) : (
    <span className="selo-situacao vamos"><Star size={12} aria-hidden /> Vamos fazer</span>
  );
}

function Cartao({ item, busca, ordem }: { item: ItemMural; busca: string; ordem: number }) {
  const jeito = jeitoDoCartao(item);
  const atraso = { animationDelay: `${Math.min(ordem, 16) * 35}ms` };

  if (jeito === "polaroid") {
    return (
      <Link href={item.href} className="cartao-mural polaroid-mural" style={{ ...atraso, rotate: `${inclinacao(item.id) / 2}deg` }}>
        <span className="polaroid-foto">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.memoria!.capa!} alt="" loading="lazy" decoding="async" />
          {item.memoria!.qtdFotos > 1 && <span className="qtd-fotos"><Images size={12} aria-hidden /> {item.memoria!.qtdFotos}</span>}
        </span>
        <strong className="polaroid-titulo"><Marcado texto={item.titulo} busca={busca} /></strong>
        {item.memoria!.frase && <span className="polaroid-frase">“<Marcado texto={item.memoria!.frase} busca={busca} />”</span>}
        <span className="cartao-rodape">{item.temaIcone} {dataCurta(item.memoria!.data)}</span>
      </Link>
    );
  }

  if (jeito === "capa") {
    return (
      <Link href={item.href} className="cartao-mural capa-mural card" style={atraso}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.imagem!} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" />
        <span className="capa-texto">
          {item.site && <small><Marcado texto={item.site} busca={busca} /></small>}
          <strong><Marcado texto={item.titulo} busca={busca} /></strong>
          <span className="cartao-rodape">
            {item.temaIcone} {item.temaNome}
            <Selo item={item} />
          </span>
        </span>
      </Link>
    );
  }

  // Bilhete: planos sem imagem, na cor do tema
  return (
    <Link
      href={item.href}
      className={`cartao-mural bilhete ${tom(item.temaIndice)} ${jeito === "feito" ? "bilhete-feito" : ""}`}
      style={{ ...atraso, rotate: `${inclinacao(item.id)}deg` }}
    >
      <span className="bilhete-emoji" aria-hidden>{item.temaIcone}</span>
      <strong className="bilhete-titulo"><Marcado texto={item.titulo} busca={busca} /></strong>
      {item.lugar && (
        <span className="bilhete-lugar"><MapPin size={13} aria-hidden /> <Marcado texto={item.lugar} busca={busca} /></span>
      )}
      <span className="cartao-rodape">
        {item.tipo ?? item.temaNome}
        {jeito === "feito" ? (
          <span className="carimbo"><Check size={12} aria-hidden /> {item.feitoEm ? dataCarimbo(item.feitoEm) : "feito"}</span>
        ) : (
          <Selo item={item} />
        )}
      </span>
    </Link>
  );
}

const SITUACOES: { valor: FiltroMural["situacao"]; rotulo: string }[] = [
  { valor: "tudo", rotulo: "Tudo" },
  { valor: "vamos_fazer", rotulo: "Vamos fazer" },
  { valor: "ja_fizemos", rotulo: "Já fizemos" },
];
const ORDENS: { valor: FiltroMural["ordem"]; rotulo: string }[] = [
  { valor: "recentes", rotulo: "Mais recentes" },
  { valor: "antigos", rotulo: "Mais antigos" },
  { valor: "az", rotulo: "A a Z" },
];

export function Mural({ itens, temas, inicial }: { itens: ItemMural[]; temas: Tema[]; inicial: FiltroMural }) {
  const [f, setF] = useState<FiltroMural>(inicial);
  const [maisFiltros, setMaisFiltros] = useState(inicial.ordem !== "recentes" || inicial.comFoto);
  const campo = useRef<HTMLInputElement>(null);
  const muda = (parcial: Partial<FiltroMural>) => setF((x) => ({ ...x, ...parcial }));

  const visiveis = useMemo(() => filtrarMural(itens, f), [itens, f]);
  const contagem = useMemo(() => {
    const base = filtrarMural(itens, { ...f, situacao: "tudo" });
    return { tudo: base.length, vamos_fazer: base.filter((i) => i.situacao === "vamos_fazer").length, ja_fizemos: base.filter((i) => i.situacao === "ja_fizemos").length };
  }, [itens, f]);
  const extras = (f.ordem !== "recentes" ? 1 : 0) + (f.comFoto ? 1 : 0);
  const temFiltro = f.texto || f.tema || f.situacao !== "tudo" || extras;

  // Filtros no endereço: voltar de um cartão devolve o mural do mesmo jeito
  useEffect(() => {
    const p = new URLSearchParams();
    if (f.texto) p.set("q", f.texto);
    if (f.tema) p.set("tema", f.tema);
    if (f.situacao !== "tudo") p.set("s", f.situacao);
    if (f.ordem !== "recentes") p.set("o", f.ordem);
    if (f.comFoto) p.set("f", "1");
    const q = p.toString();
    window.history.replaceState(window.history.state, "", q ? `/mural?${q}` : "/mural");
  }, [f]);

  // "/" foca a busca (no computador)
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        campo.current?.focus();
      }
    };
    document.addEventListener("keydown", tecla);
    return () => document.removeEventListener("keydown", tecla);
  }, []);

  return (
    <section className="mural" aria-label="Mural">
      <header className="mural-cabecalho">
        <div>
          <h1>Mural</h1>
          <p className="subtitulo">Tudo de vocês num lugar só</p>
        </div>
        <Link href="/temas" className="botao secundario pequeno"><LayoutGrid size={16} aria-hidden /> Temas</Link>
      </header>

      <div className="mural-barra">
        <label className="mural-busca">
          <Search size={18} aria-hidden />
          <input
            ref={campo}
            type="search"
            value={f.texto}
            onChange={(e) => muda({ texto: e.target.value })}
            placeholder="Buscar planos, lugares, frases…"
            aria-label="Buscar no mural"
            enterKeyHint="search"
          />
          {f.texto && (
            <button type="button" onClick={() => muda({ texto: "" })} aria-label="Limpar busca"><X size={16} /></button>
          )}
        </label>
        <button
          type="button"
          className={`mural-mais ${maisFiltros || extras ? "ativo" : ""}`}
          onClick={() => setMaisFiltros((v) => !v)}
          aria-expanded={maisFiltros}
          aria-label="Mais filtros"
        >
          <SlidersHorizontal size={18} />
          {extras > 0 && <span>{extras}</span>}
        </button>
      </div>

      <div className="segmento" role="radiogroup" aria-label="Situação">
        {SITUACOES.map((s) => (
          <button key={s.valor} type="button" role="radio" aria-checked={f.situacao === s.valor} className={f.situacao === s.valor ? "ativo" : ""} onClick={() => muda({ situacao: s.valor })}>
            {s.rotulo} <span className="contagem">{contagem[s.valor]}</span>
          </button>
        ))}
      </div>

      <nav className="chips filtros-galeria" aria-label="Tema">
        <button type="button" className={`chip ${f.tema ? "" : "ativo"}`} onClick={() => muda({ tema: null })}>Todos os temas</button>
        {temas.map((t) => (
          <button key={t.id} type="button" className={`chip ${f.tema === t.id ? "ativo" : ""}`} onClick={() => muda({ tema: f.tema === t.id ? null : t.id })}>
            {t.icone} {t.nome}
          </button>
        ))}
      </nav>

      {maisFiltros && (
        <div className="card mural-extras">
          <div className="chips" role="radiogroup" aria-label="Ordem">
            {ORDENS.map((o) => (
              <button key={o.valor} type="button" role="radio" aria-checked={f.ordem === o.valor} className={`chip ${f.ordem === o.valor ? "ativo" : ""}`} onClick={() => muda({ ordem: o.valor })}>
                {o.rotulo}
              </button>
            ))}
          </div>
          <label className="interruptor">
            <input type="checkbox" checked={f.comFoto} onChange={(e) => muda({ comFoto: e.target.checked })} />
            <span className="interruptor-trilho" aria-hidden />
            <Camera size={16} aria-hidden /> Só com foto ou imagem
          </label>
        </div>
      )}

      <p className="mural-resumo" aria-live="polite">
        {visiveis.length === itens.length
          ? `${itens.length} ${itens.length === 1 ? "coisa" : "coisas"} no mural`
          : `${visiveis.length} de ${itens.length}`}
        {temFiltro ? (
          <button type="button" onClick={() => setF(FILTRO_INICIAL)}>Limpar filtros</button>
        ) : null}
      </p>

      {visiveis.length > 0 ? (
        <div className="mural-quadro">
          {visiveis.map((item, i) => (
            <Cartao key={item.id} item={item} busca={f.texto} ordem={i} />
          ))}
        </div>
      ) : (
        <div className="card mural-vazio">
          <span className="tela-aviso-icone" aria-hidden><Search size={24} /></span>
          {f.texto ? (
            <>
              <p>Nada com “{f.texto}” no mural.</p>
              <Link href={`/adicionar?titulo=${encodeURIComponent(f.texto)}${f.tema ? `&tema=${f.tema}` : ""}`} className="botao">
                <Plus size={18} aria-hidden /> Guardar “{f.texto}” como plano
              </Link>
            </>
          ) : (
            <p>{itens.length ? "Nada com esses filtros." : "O mural está vazio. Que tal guardar o primeiro plano?"}</p>
          )}
        </div>
      )}
    </section>
  );
}
