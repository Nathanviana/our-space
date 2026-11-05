// Tempo decorrido em calendário (anos, meses, dias) mais horas, minutos e segundos (REQ-13)
export interface TempoJuntos {
  anos: number;
  meses: number;
  dias: number;
  horas: number;
  minutos: number;
  segundos: number;
  totalDias: number;
}

export function dataLocal(iso: string): Date {
  const [a, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(a, m - 1, d, 0, 0, 0);
}

export function tempoDesde(inicio: Date, agora: Date): TempoJuntos {
  if (agora < inicio) return { anos: 0, meses: 0, dias: 0, horas: 0, minutos: 0, segundos: 0, totalDias: 0 };
  // Soma meses inteiros ao início (limitando ao fim do mês) sem passar de hoje
  const somarMeses = (n: number) => {
    const alvo = new Date(inicio.getFullYear(), inicio.getMonth() + n, 1);
    const ultimoDia = new Date(alvo.getFullYear(), alvo.getMonth() + 1, 0).getDate();
    return new Date(alvo.getFullYear(), alvo.getMonth(), Math.min(inicio.getDate(), ultimoDia));
  };
  const hojeMeiaNoite = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  let totalMeses = (agora.getFullYear() - inicio.getFullYear()) * 12 + (agora.getMonth() - inicio.getMonth());
  while (totalMeses > 0 && somarMeses(totalMeses) > hojeMeiaNoite) totalMeses--;
  const ancora = somarMeses(totalMeses);
  const anos = Math.floor(totalMeses / 12);
  const meses = totalMeses % 12;
  const dias = Math.round((hojeMeiaNoite.getTime() - ancora.getTime()) / 86_400_000);
  const totalDias = Math.round((hojeMeiaNoite.getTime() - new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate()).getTime()) / 86_400_000);
  return {
    anos,
    meses,
    dias,
    horas: agora.getHours(),
    minutos: agora.getMinutes(),
    segundos: agora.getSeconds(),
    totalDias,
  };
}
