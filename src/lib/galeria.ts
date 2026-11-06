// Galeria agrupada por mês. Sem imports: testado com node --test.

export interface ComData {
  tiradaEm: string | null;
  enviadaEm: string;
}

export interface GrupoMes<T> {
  chave: string; // "2026-11"
  titulo: string; // "Novembro de 2026"
  fotos: T[];
}

const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

// Mantém a ordem em que as fotos chegaram (mais recentes primeiro) e junta as do mesmo mês
export function agruparPorMes<T extends ComData>(fotos: T[]): GrupoMes<T>[] {
  const grupos: GrupoMes<T>[] = [];
  for (const f of fotos) {
    const data = (f.tiradaEm ?? f.enviadaEm).slice(0, 7);
    const [a, m] = data.split("-").map(Number);
    const chave = Number.isFinite(a) && m >= 1 && m <= 12 ? data : "sem-data";
    let g = grupos.find((x) => x.chave === chave);
    if (!g) {
      g = { chave, titulo: chave === "sem-data" ? "Sem data" : `${MESES[m - 1]} de ${a}`, fotos: [] };
      grupos.push(g);
    }
    g.fotos.push(f);
  }
  return grupos;
}
