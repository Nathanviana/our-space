// Sessão revogável pela troca de senha (área de admin, spec 5.2). Sem imports: testado com node --test.

// Erro de coluna inexistente (Postgres 42703 / cache do PostgREST PGRST204): migração da área de admin pendente.
export function colunaAusente(codigo: string | undefined): boolean {
  return codigo === "42703" || codigo === "PGRST204";
}

// iatSeg: momento de emissão do JWT, em segundos. sessaoDesde: usuarios.sessao_desde (null = sem a coluna).
export function sessaoAindaValida(iatSeg: number | undefined, sessaoDesdeIso: string | null): boolean {
  if (sessaoDesdeIso === null) return true;
  if (typeof iatSeg !== "number") return false;
  const desde = Date.parse(sessaoDesdeIso);
  if (Number.isNaN(desde)) return true;
  return iatSeg >= Math.floor(desde / 1000);
}
