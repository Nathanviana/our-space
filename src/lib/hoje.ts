// Data de hoje no fuso de Brasília, no formato AAAA-MM-DD
export function hoje(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}
