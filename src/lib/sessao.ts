// JWT da sessão (PRD v3, 7.3 e DC2). Funciona no servidor e no middleware (edge).
import { SignJWT, jwtVerify } from "jose";

export const COOKIE_SESSAO = "ne_sessao";
export const DURACAO_SESSAO_S = 60 * 60 * 24 * 30; // 30 dias

export interface Sessao {
  sub: string; // id do usuário
  nome: string;
  iat?: number; // emissão do JWT, em segundos (área de admin: troca de senha derruba sessões antigas)
}

// Opções do cookie de sessão, usadas no login e na reemissão pela área de admin.
export function opcoesCookie() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: DURACAO_SESSAO_S,
  };
}

function chave() {
  const segredo = process.env.JWT_SECRET;
  if (!segredo || segredo.length < 32) {
    throw new Error("JWT_SECRET ausente ou curto (mínimo 32 caracteres).");
  }
  return new TextEncoder().encode(segredo);
}

export async function assinarSessao(s: Sessao) {
  return new SignJWT({ nome: s.nome })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(s.sub)
    .setIssuedAt()
    .setExpirationTime(`${DURACAO_SESSAO_S}s`)
    .sign(chave());
}

export async function verificarSessao(token: string | undefined): Promise<Sessao | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, chave(), { algorithms: ["HS256"] });
    if (typeof payload.sub !== "string") return null;
    return { sub: payload.sub, nome: String(payload.nome ?? ""), iat: payload.iat };
  } catch {
    return null;
  }
}
