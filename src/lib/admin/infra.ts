// Números de infra da área de admin (spec 5.4). Sem imports: testado com node --test.

// Limites do plano gratuito da Supabase (supabase.com/pricing): banco de 500 MB e armazenamento de 1 GB.
export const LIMITE_BANCO = 500 * 1024 * 1024;
export const LIMITE_FOTOS = 1024 ** 3;

const UNIDADES = ["B", "KB", "MB", "GB", "TB"];

export function formatarBytes(n: number): string {
  let v = Math.max(0, n);
  let i = 0;
  while (v >= 1024 && i < UNIDADES.length - 1) {
    v /= 1024;
    i++;
  }
  const arred = Math.round(v * 10) / 10;
  const texto = Number.isInteger(arred) ? String(arred) : arred.toFixed(1).replace(".", ",");
  return `${texto} ${UNIDADES[i]}`;
}

export function percentual(usado: number, limite: number): number {
  if (limite <= 0) return 0;
  return Math.min(100, Math.round((usado / limite) * 1000) / 10);
}

// Arquivos do bucket que não são a foto nem a miniatura (_mini.jpg, regra de caminhoMini) de nenhuma foto do banco.
export function fotosOrfas(objetos: string[], caminhosNoBanco: string[]): string[] {
  const conhecidos = new Set(caminhosNoBanco.flatMap((c) => [c, c.replace(/\.jpg$/, "_mini.jpg")]));
  return objetos.filter((o) => !conhecidos.has(o));
}
