"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { exigirSessao } from "@/lib/auth";
import { db } from "@/lib/db";
import { hoje } from "@/lib/hoje";
import { COOKIE_SESSAO, assinarSessao, opcoesCookie } from "@/lib/sessao";
import { validarDatas, validarPessoa } from "@/lib/admin/validacao";
import { colunaAusente } from "@/lib/admin/sessao";

export interface EstadoForm {
  erro?: string;
  ok?: string;
}

const UUID = /^[0-9a-f-]{36}$/i;
const texto = (form: FormData, campo: string) => String(form.get(campo) ?? "");

// Spec 5.2: qualquer um dos dois altera nome, e-mail e senha de qualquer conta.
// Trocar senha exige a senha atual de quem está logado e derruba as sessões antigas da conta alterada.
export async function salvarPessoa(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const sessao = await exigirSessao();
  const id = texto(form, "id");
  if (!UUID.test(id)) return { erro: "Conta inválida." };

  const v = validarPessoa({
    nome: texto(form, "nome"),
    email: texto(form, "email"),
    novaSenha: texto(form, "novaSenha"),
    confirmacao: texto(form, "confirmacao"),
  });
  if (v.erro) return { erro: v.erro };

  const mudancas: Record<string, string> = { nome: v.nome, email: v.email };
  if (v.trocarSenha) {
    const { data: eu } = await db().from("usuarios").select("senha_hash").eq("id", sessao.sub).maybeSingle();
    const confere = eu ? await bcrypt.compare(texto(form, "senhaAtual"), eu.senha_hash) : false;
    if (!confere) return { erro: "Sua senha atual não confere." };
    mudancas.senha_hash = await bcrypt.hash(texto(form, "novaSenha"), 12);
    mudancas.sessao_desde = new Date().toISOString();
  }

  const { data, error } = await db().from("usuarios").update(mudancas).eq("id", id).select("id").maybeSingle();
  if (error?.code === "23505") return { erro: "Esse e-mail já é usado pela outra conta." };
  // Coluna sessao_desde ausente: sem ela a troca de senha não derrubaria as sessões antigas.
  if (colunaAusente(error?.code)) {
    return { erro: "Falta aplicar a migração da área de admin no banco antes de trocar senhas." };
  }
  if (error || !data) return { erro: "Não foi possível salvar." };

  // O nome vai dentro do JWT; e a troca da própria senha invalidou o cookie atual.
  if (id === sessao.sub) {
    const jar = await cookies();
    jar.set(COOKIE_SESSAO, await assinarSessao({ sub: id, nome: v.nome }), opcoesCookie());
  }
  revalidatePath("/", "layout");
  return { ok: v.trocarSenha ? "Salvo. A senha nova já vale." : "Salvo." };
}

// Spec 5.2: datas do contador (início da amizade e do namoro)
export async function salvarDatas(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  await exigirSessao();
  const amizade = texto(form, "amizade");
  const namoro = texto(form, "namoro");
  const erro = validarDatas(amizade, namoro, hoje());
  if (erro) return { erro };
  const { error } = await db().from("espaco").upsert({ id: 1, data_amizade: amizade, data_namoro: namoro });
  if (error) return { erro: "Não foi possível salvar as datas." };
  revalidatePath("/", "layout");
  return { ok: "Datas salvas." };
}
