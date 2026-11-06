// Passkeys (Face ID / digital) com WebAuthn. Só no servidor.
import "server-only";
import { cookies, headers } from "next/headers";
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { isoBase64URL } from "@simplewebauthn/server/helpers";
import { db } from "./db";
import { tabelaAusente } from "./admin/sessao";
import { nomeDoAparelho, origemDe } from "./login-arte";
import { COOKIE_DESAFIO, DURACAO_DESAFIO_S, assinarDesafio, lerDesafio } from "./sessao";

const NOME_SITE = "Nosso Espaço";
export const MSG_MIGRACAO = "Falta aplicar a migração de passkeys no banco.";

async function origem() {
  const h = await headers();
  const o = origemDe(h.get("x-forwarded-host") ?? h.get("host"), h.get("x-forwarded-proto"));
  if (!o) throw new Error("Endereço do site inválido para passkey.");
  return o;
}

async function guardarDesafio(desafio: string, tipo: "cadastro" | "entrada") {
  const jar = await cookies();
  jar.set(COOKIE_DESAFIO, await assinarDesafio(desafio, tipo), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: DURACAO_DESAFIO_S,
  });
}

async function consumirDesafio(tipo: "cadastro" | "entrada") {
  const jar = await cookies();
  const desafio = await lerDesafio(jar.get(COOKIE_DESAFIO)?.value, tipo);
  jar.delete(COOKIE_DESAFIO); // vale uma vez só
  return desafio;
}

// ——— Cadastro (com sessão) ———

export async function opcoesDeCadastro(usuario: { id: string; nome: string; email: string }) {
  const { rpID } = await origem();
  const { data: existentes, error } = await db().from("passkeys").select("id, transportes").eq("usuario_id", usuario.id);
  if (tabelaAusente(error?.code)) throw new Error(MSG_MIGRACAO);
  if (error) throw error;
  const opcoes = await generateRegistrationOptions({
    rpName: NOME_SITE,
    rpID,
    userName: usuario.email,
    userDisplayName: usuario.nome,
    userID: new TextEncoder().encode(usuario.id),
    attestationType: "none",
    excludeCredentials: (existentes ?? []).map((p) => ({ id: p.id, transports: p.transportes })),
    authenticatorSelection: { residentKey: "required", userVerification: "required" },
    timeout: 120_000,
  });
  await guardarDesafio(opcoes.challenge, "cadastro");
  return opcoes;
}

export async function concluirCadastro(usuarioId: string, resposta: RegistrationResponseJSON) {
  const desafio = await consumirDesafio("cadastro");
  if (!desafio) return { erro: "O pedido expirou. Tente de novo." };
  const { rpID, origin } = await origem();
  let v;
  try {
    v = await verifyRegistrationResponse({ response: resposta, expectedChallenge: desafio, expectedOrigin: origin, expectedRPID: rpID, requireUserVerification: true });
  } catch {
    return { erro: "Não foi possível confirmar o aparelho." };
  }
  if (!v.verified || !v.registrationInfo) return { erro: "Não foi possível confirmar o aparelho." };
  const { credential } = v.registrationInfo;
  const h = await headers();
  const aparelho = nomeDoAparelho(h.get("user-agent") ?? "");
  const { error } = await db().from("passkeys").insert({
    id: credential.id,
    usuario_id: usuarioId,
    chave_publica: isoBase64URL.fromBuffer(credential.publicKey),
    contador: credential.counter,
    transportes: credential.transports ?? [],
    aparelho,
  });
  if (tabelaAusente(error?.code)) return { erro: MSG_MIGRACAO };
  if (error?.code === "23505") return { erro: "Este aparelho já está cadastrado." };
  if (error) return { erro: "Não foi possível salvar a passkey." };
  return { ok: true as const, aparelho };
}

// ——— Entrada (sem sessão) ———

export async function opcoesDeEntrada() {
  const { rpID } = await origem();
  const opcoes = await generateAuthenticationOptions({ rpID, userVerification: "required", timeout: 120_000 });
  await guardarDesafio(opcoes.challenge, "entrada");
  return opcoes;
}

// Confere a assinatura do aparelho e devolve o usuário dono da passkey.
export async function conferirEntrada(resposta: AuthenticationResponseJSON) {
  const desafio = await consumirDesafio("entrada");
  if (!desafio) return { erro: "O pedido expirou. Tente de novo." };
  const { data: chave, error } = await db()
    .from("passkeys")
    .select("id, usuario_id, chave_publica, contador, transportes, usuarios(id, nome)")
    .eq("id", resposta.id)
    .maybeSingle();
  if (tabelaAusente(error?.code)) return { erro: MSG_MIGRACAO };
  const usuario = (chave?.usuarios ?? null) as unknown as { id: string; nome: string } | null;
  if (error || !chave || !usuario) return { erro: "Este aparelho não está cadastrado. Entre com a senha e ative o Face ID de novo." };
  const { rpID, origin } = await origem();
  let v;
  try {
    v = await verifyAuthenticationResponse({
      response: resposta,
      expectedChallenge: desafio,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
      credential: {
        id: chave.id,
        publicKey: isoBase64URL.toBuffer(chave.chave_publica),
        counter: Number(chave.contador),
        transports: chave.transportes,
      },
    });
  } catch {
    return { erro: "Não foi possível confirmar sua identidade." };
  }
  if (!v.verified) return { erro: "Não foi possível confirmar sua identidade." };
  await db()
    .from("passkeys")
    .update({ contador: v.authenticationInfo.newCounter, usado_em: new Date().toISOString() })
    .eq("id", chave.id);
  return { usuario };
}

export interface PasskeyListada {
  id: string;
  aparelho: string;
  dono: string;
  minha: boolean;
  criadaEm: string;
  usadaEm: string | null;
}

// Admin: passkeys das duas contas (mesmo poder para os dois, como no resto do admin)
export async function listarPasskeys(eu: string): Promise<{ pendente: boolean; lista: PasskeyListada[] }> {
  const { data, error } = await db()
    .from("passkeys")
    .select("id, aparelho, usuario_id, criado_em, usado_em, usuarios(nome)")
    .order("criado_em", { ascending: false });
  if (tabelaAusente(error?.code)) return { pendente: true, lista: [] };
  if (error) throw error;
  return {
    pendente: false,
    lista: (data ?? []).map((p) => ({
      id: p.id,
      aparelho: p.aparelho,
      dono: ((p.usuarios as unknown as { nome: string } | null)?.nome ?? "").split(" ")[0],
      minha: p.usuario_id === eu,
      criadaEm: p.criado_em,
      usadaEm: p.usado_em,
    })),
  };
}
