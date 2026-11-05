// Indicadores do PRD (seção 2) por mês, para a área de admin (spec 5.1). Sem imports: testado com node --test.

export interface PlanoM {
  id: string;
  temaId: string;
  situacao: "vamos_fazer" | "ja_fizemos";
  feitoEm: string | null; // AAAA-MM-DD
  temMemoria: boolean;
  criadoPor: string | null;
}

export interface SorteioM {
  planoId: string;
  data: string; // ISO (timestamptz)
}

export interface LinhaMes {
  mes: string; // AAAA-MM
  feitos: number;
  sorteados: number;
  sorteadosFeitos: number;
  comMemoria: number;
}

const diaBrasilia = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" });

// Dia do sorteio no fuso do casal, para não jogar um sorteio da noite para o dia/mês seguinte.
function diaDoSorteio(iso: string): string {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? iso.slice(0, 10) : diaBrasilia.format(new Date(t));
}

function ultimos12Meses(hoje: string): string[] {
  let a = Number(hoje.slice(0, 4));
  let m = Number(hoje.slice(5, 7));
  const meses: string[] = [];
  for (let i = 0; i < 12; i++) {
    meses.push(`${a}-${String(m).padStart(2, "0")}`);
    m -= 1;
    if (m === 0) {
      m = 12;
      a -= 1;
    }
  }
  return meses;
}

export function calcularMeses(planos: PlanoM[], sorteios: SorteioM[], hoje: string): LinhaMes[] {
  const linhas = new Map<string, LinhaMes>(
    ultimos12Meses(hoje).map((mes) => [mes, { mes, feitos: 0, sorteados: 0, sorteadosFeitos: 0, comMemoria: 0 }]),
  );

  for (const p of planos) {
    if (p.situacao !== "ja_fizemos" || !p.feitoEm) continue;
    const l = linhas.get(p.feitoEm.slice(0, 7));
    if (!l) continue;
    l.feitos += 1;
    if (p.temMemoria) l.comMemoria += 1;
  }

  // Por mês: cada plano sorteado conta uma vez; "virou programa" se foi feito no dia do sorteio ou depois.
  const porId = new Map(planos.map((p) => [p.id, p]));
  const primeiroSorteio = new Map<string, string>(); // `${mes}|${planoId}` → dia mais antigo no mês
  for (const s of sorteios) {
    const dia = diaDoSorteio(s.data);
    const chave = `${dia.slice(0, 7)}|${s.planoId}`;
    const atual = primeiroSorteio.get(chave);
    if (!atual || dia < atual) primeiroSorteio.set(chave, dia);
  }
  for (const [chave, dia] of primeiroSorteio) {
    const [mes, planoId] = chave.split("|");
    const l = linhas.get(mes);
    if (!l) continue;
    l.sorteados += 1;
    const p = porId.get(planoId);
    if (p && p.situacao === "ja_fizemos" && p.feitoEm && p.feitoEm >= dia) l.sorteadosFeitos += 1;
  }

  return [...linhas.values()];
}

export function percentualComMemoria(planos: PlanoM[]): number | null {
  const feitos = planos.filter((p) => p.situacao === "ja_fizemos");
  if (!feitos.length) return null;
  return Math.round((feitos.filter((p) => p.temMemoria).length / feitos.length) * 100);
}
