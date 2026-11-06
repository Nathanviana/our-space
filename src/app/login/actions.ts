"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import type { AuthenticationResponseJSON } from "@simplewebauthn/server";
import { conferirEntrada, opcoesDeEntrada } from "@/lib/passkey";
import { COOKIE_SESSAO, assinarSessao, opcoesCookie } from "@/lib/sessao";

export interface EstadoLogin {
  erro?: string;
  email?: string; // devolvido no erro para o campo não voltar vazio
}

// Hash fixo para comparar mesmo quando o e-mail não existe (tempo de resposta igual).
const HASH_FALSO = bcrypt.hashSync("senha-inexistente", 12);

export async function entrar(_: EstadoLogin, form: FormData): Promise<EstadoLogin> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const senha = String(form.get("senha") ?? "");
  if (!email || !senha) return { erro: "Preencha e-mail e senha.", email };

  const { data: usuario } = await db()
    .from("usuarios")
    .select("id, nome, senha_hash")
    .eq("email", email)
    .maybeSingle();

  const confere = await bcrypt.compare(senha, usuario?.senha_hash ?? HASH_FALSO);
  if (!usuario || !confere) return { erro: "E-mail ou senha incorretos.", email };

  const token = await assinarSessao({ sub: usuario.id, nome: usuario.nome });
  const jar = await cookies();
  jar.set(COOKIE_SESSAO, token, opcoesCookie());
  redirect("/");
}

export async function sair() {
  const jar = await cookies();
  jar.delete(COOKIE_SESSAO);
  redirect("/login");
}

// ——— Entrar com passkey (Face ID / digital) ———

export async function opcoesEntradaPasskey() {
  try {
    return { opcoes: await opcoesDeEntrada() };
  } catch {
    return { erro: "Não foi possível começar a entrada com Face ID." };
  }
}

export async function entrarComPasskey(resposta: AuthenticationResponseJSON): Promise<{ ok?: true; erro?: string }> {
  const r = await conferirEntrada(resposta);
  if (!r.usuario) return { erro: r.erro ?? "Não foi possível entrar." };
  const jar = await cookies();
  jar.set(COOKIE_SESSAO, await assinarSessao({ sub: r.usuario.id, nome: r.usuario.nome }), opcoesCookie());
  return { ok: true };
}
