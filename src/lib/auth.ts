// Leitura da sessão em Server Components e Server Actions.
import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_SESSAO, verificarSessao, type Sessao } from "./sessao";

export async function sessaoAtual(): Promise<Sessao | null> {
  const jar = await cookies();
  return verificarSessao(jar.get(COOKIE_SESSAO)?.value);
}

// Toda leitura ou gravação passa por aqui antes de tocar no banco.
export async function exigirSessao(): Promise<Sessao> {
  const s = await sessaoAtual();
  if (!s) redirect("/login");
  return s;
}
