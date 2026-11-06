// Próximos marcos do namoro (tela Início): o próximo mesversário/aniversário e a próxima centena de dias.
// Sem imports para rodar direto nos testes do Node.

export interface Marco {
  titulo: string;
  data: Date;
  faltam: number; // dias até o marco (0 = hoje)
  progresso: number; // 0 a 1, desde o marco anterior do mesmo tipo
}

const DIA = 86_400_000;
const meiaNoite = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const diasEntre = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / DIA);

// Mesmo dia do mês do início, limitado ao fim do mês (31/01 + 1 mês = 28/02)
function somarMeses(inicio: Date, n: number) {
  const alvo = new Date(inicio.getFullYear(), inicio.getMonth() + n, 1);
  const ultimoDia = new Date(alvo.getFullYear(), alvo.getMonth() + 1, 0).getDate();
  return new Date(alvo.getFullYear(), alvo.getMonth(), Math.min(inicio.getDate(), ultimoDia));
}

function nomeMeses(total: number) {
  const a = Math.floor(total / 12);
  const m = total % 12;
  const anos = `${a} ${a === 1 ? "ano" : "anos"}`;
  const meses = `${m} ${m === 1 ? "mês" : "meses"}`;
  if (a === 0) return meses;
  if (m === 0) return anos;
  return `${anos} e ${meses}`;
}

export function proximosMarcos(inicioIso: string, agora: Date): Marco[] {
  const [a, m, d] = inicioIso.slice(0, 10).split("-").map(Number);
  const inicio = new Date(a, m - 1, d);
  const hoje = meiaNoite(agora);
  if (hoje < inicio) return [];

  // Menor n >= 1 cujo mesversário é hoje ou depois
  let n = Math.max(1, (hoje.getFullYear() - inicio.getFullYear()) * 12 + hoje.getMonth() - inicio.getMonth());
  while (n > 1 && somarMeses(inicio, n - 1) >= hoje) n--;
  while (somarMeses(inicio, n) < hoje) n++;
  const proximo = somarMeses(inicio, n);
  const anterior = somarMeses(inicio, n - 1);
  const mesversario: Marco = {
    titulo: nomeMeses(n),
    data: proximo,
    faltam: diasEntre(hoje, proximo),
    progresso: diasEntre(anterior, hoje) / diasEntre(anterior, proximo),
  };

  const total = diasEntre(inicio, hoje);
  const alvo = Math.max(100, Math.ceil(total / 100) * 100);
  const centena: Marco = {
    titulo: `${alvo.toLocaleString("pt-BR")} dias juntos`,
    data: new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + (alvo - total)),
    faltam: alvo - total,
    progresso: (total - (alvo - 100)) / 100,
  };

  return [mesversario, centena].sort((x, y) => x.faltam - y.faltam);
}
