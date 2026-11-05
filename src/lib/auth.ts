// Leitura da sessão em Server Components e Server Actions.
import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { colunaAusente, sessaoAindaValida } from "./admin/sessao";
import { COOKIE_SESSAO, verificarSessao, type Sessao } from "./sessao";

export async function sessaoAtual(): Promise<Sessao | null> {
  const jar = await cookies();
  return verificarSessao(jar.get(COOKIE_SESSAO)?.value);
}

// Confere no banco se a conta ainda existe e se o JWT não é anterior à última troca de senha.
// Só se a coluna sessao_desde ainda não existe (migração pendente) a sessão continua valendo sem conferência;
// qualquer outro erro do banco interrompe a requisição, para uma sessão revogada nunca passar.
const sessaoConfereNoBanco = cache(async (sub: string, iat: number | undefined): Promise<boolean> => {
  const { data, error } = await db().from("usuarios").select("sessao_desde").eq("id", sub).maybeSingle();
  if (error) {
    if (colunaAusente(error.code)) return true;
    throw error;
  }
  if (!data) return false;
  return sessaoAindaValida(iat, data.sessao_desde ?? null);
});

// Toda leitura ou gravação passa por aqui antes de tocar no banco.
export async function exigirSessao(): Promise<Sessao> {
  const s = await sessaoAtual();
  if (!s) redirect("/login");
  // /sair apaga o cookie; ir direto para /login entraria em ciclo com o middleware.
  if (!(await sessaoConfereNoBanco(s.sub, s.iat))) redirect("/sair");
  return s;
}
