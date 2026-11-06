// Escolha do sorteio evitando repetir o que saiu há pouco. Sem imports: testado com node --test.

export const SORTEIOS_RECENTES = 5;

// recentes: ids dos últimos planos sorteados. Se só sobrarem recentes, vale qualquer um.
export function escolherSorteio<T extends { id: string }>(candidatos: T[], recentes: string[], aleatorio: () => number = Math.random): T | null {
  if (!candidatos.length) return null;
  const evitar = new Set(recentes);
  const novos = candidatos.filter((c) => !evitar.has(c.id));
  const pool = novos.length ? novos : candidatos;
  return pool[Math.min(pool.length - 1, Math.floor(aleatorio() * pool.length))];
}
