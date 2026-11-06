"use client";

import { Link2, MapPin } from "lucide-react";
import { previaDoLink } from "@/app/(app)/planos/actions";

import { useActionState, useRef, useState } from "react";
import { EscolherLugar } from "./escolher-lugar";
import type { Lugar, Plano, Tema } from "@/lib/types";
import { TIPOS_PLANO } from "@/lib/types";
import type { EstadoPlano } from "@/app/(app)/planos/actions";

type Acao = (estado: EstadoPlano, form: FormData) => Promise<EstadoPlano>;

// Formulário de plano (REQ-01 e REQ-03): título ou link, tema obrigatório, tipo opcional
export function FormPlano({
  acao,
  temas,
  plano,
  temaInicial,
  tituloInicial,
  rotulo,
}: {
  acao: Acao;
  temas: Tema[];
  plano?: Plano;
  temaInicial?: string;
  tituloInicial?: string;
  rotulo: string;
}) {
  const [estado, enviar, enviando] = useActionState<EstadoPlano, FormData>(acao, {});
  const [lugar, setLugar] = useState<Lugar>(plano?.lugar ?? { nome: null, latitude: null, longitude: null });
  const [comLugar, setComLugar] = useState(plano?.lugar.latitude != null);
  const [previa, setPrevia] = useState(plano?.previa && plano.link ? { ...plano.previa, link: plano.link } : null);
  const [buscando, setBuscando] = useState(false);
  const ultimoLink = useRef(plano?.link ?? "");

  // Ao colar ou sair do campo do link, busca título e imagem da página
  async function verLink(valor: string) {
    const v = valor.trim();
    if (v === ultimoLink.current) return;
    ultimoLink.current = v;
    if (!v) return setPrevia(null);
    setBuscando(true);
    const p = await previaDoLink(v).catch(() => null);
    if (ultimoLink.current !== v) return;
    setPrevia(p);
    setBuscando(false);
  }
  return (
    <form action={enviar} className="card formulario">
      {plano && <input type="hidden" name="id" value={plano.id} />}
      <label>
        O que vocês querem fazer?
        <input name="titulo" defaultValue={plano?.titulo ?? tituloInicial ?? ""} maxLength={120} placeholder={previa?.titulo ?? "Ex.: ver aquele filme"} />
      </label>
      <label>
        Ou cole um link
        <input
          name="link"
          type="url"
          inputMode="url"
          defaultValue={plano?.link ?? ""}
          placeholder="https://"
          onBlur={(e) => verLink(e.target.value)}
          onPaste={(e) => {
            const campo = e.currentTarget;
            setTimeout(() => verLink(campo.value));
          }}
        />
      </label>
      {(buscando || previa) && (
        <div className={`previa-form ${buscando ? "buscando" : ""}`} aria-live="polite">
          {buscando ? (
            <>
              <span className="previa-form-capa esqueleto" />
              <span className="previa-form-texto">
                <small>Buscando a prévia…</small>
                <span className="esqueleto linha" />
              </span>
            </>
          ) : previa && (
            <>
              {previa.imagem ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="previa-form-capa" src={previa.imagem} alt="" referrerPolicy="no-referrer" />
              ) : (
                <span className="previa-form-capa"><Link2 size={20} aria-hidden /></span>
              )}
              <span className="previa-form-texto">
                <small>{previa.site}</small>
                <strong>{previa.titulo ?? "Sem título"}</strong>
              </span>
            </>
          )}
        </div>
      )}
      <input type="hidden" name="previaLink" value={previa?.link ?? ""} />
      <input type="hidden" name="previaTitulo" value={previa?.titulo ?? ""} />
      <input type="hidden" name="previaImagem" value={previa?.imagem ?? ""} />
      <input type="hidden" name="previaSite" value={previa?.site ?? ""} />
      <label>
        Tema
        <select name="tema" defaultValue={plano?.temaId ?? temaInicial ?? ""} required>
          <option value="" disabled>Escolha um tema</option>
          {temas.map((t) => (
            <option key={t.id} value={t.id}>{t.icone} {t.nome}</option>
          ))}
        </select>
      </label>
      <fieldset>
        <legend>Tipo (opcional)</legend>
        <div className="chips">
          {TIPOS_PLANO.map((t) => (
            <label key={t.valor} className="chip">
              <input type="radio" name="tipo" value={t.valor} defaultChecked={plano?.tipo === t.valor} />
              {t.rotulo}
            </label>
          ))}
        </div>
      </fieldset>
      <input type="hidden" name="lugarNome" value={lugar.nome ?? ""} />
      <input type="hidden" name="latitude" value={lugar.latitude ?? ""} />
      <input type="hidden" name="longitude" value={lugar.longitude ?? ""} />
      {comLugar ? (
        <fieldset>
          <legend>Lugar (opcional)</legend>
          <EscolherLugar valor={lugar} aoMudar={setLugar} />
        </fieldset>
      ) : (
        <button type="button" className="chip" onClick={() => setComLugar(true)}><MapPin size={16} aria-hidden /> Marcar no mapa</button>
      )}
      {estado.erro && <p role="alert" className="erro">{estado.erro}</p>}
      <button type="submit" className="botao" disabled={enviando}>
        {enviando ? "Guardando..." : rotulo}
      </button>
    </form>
  );
}
