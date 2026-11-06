// Limite de tentativas de senha guardado no banco. Se a tabela falhar, libera (nunca tranca o casal por erro do banco).
import "server-only";
import { db } from "@/lib/db";
import { LIMITE_EMAIL, LIMITE_IP, aposFalha, minutosBloqueado, type Limite, type Registro } from "@/lib/limite-login";

interface Linha {
  chave: string;
  falhas: number;
  janela_inicio: string | null;
  bloqueado_ate: string | null;
}

const paraRegistro = (l: Linha | undefined): Registro | null =>
  l ? { falhas: l.falhas, janelaInicio: l.janela_inicio, bloqueadoAte: l.bloqueado_ate } : null;

export function chavesDe(email: string, ip: string): { chave: string; limite: Limite }[] {
  return [
    { chave: `email:${email.slice(0, 254)}`, limite: LIMITE_EMAIL },
    { chave: `ip:${ip}`, limite: LIMITE_IP },
  ];
}

async function ler(chaves: string[]): Promise<Map<string, Linha> | null> {
  const { data, error } = await db().from("tentativas_login").select("chave, falhas, janela_inicio, bloqueado_ate").in("chave", chaves);
  if (error) return null;
  return new Map(((data ?? []) as Linha[]).map((l) => [l.chave, l]));
}

// Maior bloqueio entre e-mail e IP, em minutos (0 = pode tentar)
export async function bloqueioAtual(email: string, ip: string): Promise<number> {
  const linhas = await ler(chavesDe(email, ip).map((c) => c.chave));
  if (!linhas) return 0;
  const agora = new Date();
  return Math.max(0, ...[...linhas.values()].map((l) => minutosBloqueado(paraRegistro(l), agora)));
}

export async function registrarFalha(email: string, ip: string): Promise<void> {
  const alvos = chavesDe(email, ip);
  const linhas = await ler(alvos.map((c) => c.chave));
  if (!linhas) return;
  const agora = new Date();
  const novas = alvos.map(({ chave, limite }) => {
    const r = aposFalha(paraRegistro(linhas.get(chave)), agora, limite);
    return { chave, falhas: r.falhas, janela_inicio: r.janelaInicio, bloqueado_ate: r.bloqueadoAte };
  });
  await db().from("tentativas_login").upsert(novas);
}

export async function limparTentativas(email: string, ip: string): Promise<void> {
  await db().from("tentativas_login").delete().in("chave", chavesDe(email, ip).map((c) => c.chave));
}
