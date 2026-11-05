"use client";

import { useActionState, useState } from "react";
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
  rotulo,
}: {
  acao: Acao;
  temas: Tema[];
  plano?: Plano;
  temaInicial?: string;
  rotulo: string;
}) {
  const [estado, enviar, enviando] = useActionState<EstadoPlano, FormData>(acao, {});
  const [lugar, setLugar] = useState<Lugar>(plano?.lugar ?? { nome: null, latitude: null, longitude: null });
  const [comLugar, setComLugar] = useState(plano?.lugar.latitude != null);
  return (
    <form action={enviar} className="card formulario">
      {plano && <input type="hidden" name="id" value={plano.id} />}
      <label>
        O que vocês querem fazer?
        <input name="titulo" defaultValue={plano?.titulo ?? ""} maxLength={120} placeholder="Ex.: ver aquele filme" />
      </label>
      <label>
        Ou cole um link
        <input name="link" type="url" inputMode="url" defaultValue={plano?.link ?? ""} placeholder="https://" />
      </label>
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
        <button type="button" className="chip" onClick={() => setComLugar(true)}>📍 Marcar no mapa</button>
      )}
      {estado.erro && <p role="alert" className="erro">{estado.erro}</p>}
      <button type="submit" className="botao" disabled={enviando}>
        {enviando ? "Guardando..." : rotulo}
      </button>
    </form>
  );
}
