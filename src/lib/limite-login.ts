// Limite de tentativas de senha (por e-mail e por IP). Sem imports: testado com node --test.

export interface Limite {
  max: number; // falhas permitidas dentro da janela
  janelaMin: number; // janela de contagem
  bloqueioMin: number; // tempo de bloqueio ao estourar
}

export const LIMITE_EMAIL: Limite = { max: 5, janelaMin: 15, bloqueioMin: 15 };
export const LIMITE_IP: Limite = { max: 20, janelaMin: 15, bloqueioMin: 30 };

export interface Registro {
  falhas: number;
  janelaInicio: string | null;
  bloqueadoAte: string | null;
}

const MIN = 60_000;

// Minutos que faltam de bloqueio (0 = liberado)
export function minutosBloqueado(reg: Registro | null, agora: Date): number {
  if (!reg?.bloqueadoAte) return 0;
  const resta = Date.parse(reg.bloqueadoAte) - agora.getTime();
  return resta > 0 ? Math.ceil(resta / MIN) : 0;
}

// Registro depois de mais uma senha errada
export function aposFalha(reg: Registro | null, agora: Date, limite: Limite): Registro {
  const inicio = reg?.janelaInicio ? Date.parse(reg.janelaInicio) : NaN;
  const janelaValida = Number.isFinite(inicio) && agora.getTime() - inicio < limite.janelaMin * MIN;
  const falhas = (janelaValida ? reg!.falhas : 0) + 1;
  const janelaInicio = janelaValida ? reg!.janelaInicio : agora.toISOString();
  const bloqueadoAte = falhas >= limite.max ? new Date(agora.getTime() + limite.bloqueioMin * MIN).toISOString() : null;
  // Ao bloquear, a contagem recomeça depois do bloqueio
  return bloqueadoAte ? { falhas: 0, janelaInicio: null, bloqueadoAte } : { falhas, janelaInicio, bloqueadoAte: null };
}

export function mensagemBloqueio(minutos: number): string {
  return `Muitas tentativas. Tente de novo em ${minutos} ${minutos === 1 ? "minuto" : "minutos"}.`;
}

// Primeiro IP de x-forwarded-for (o da pessoa), ou um valor fixo
export function ipDe(forwardedFor: string | null, realIp: string | null): string {
  const ip = (forwardedFor ?? "").split(",")[0].trim() || (realIp ?? "").trim();
  return ip.slice(0, 64) || "desconhecido";
}
