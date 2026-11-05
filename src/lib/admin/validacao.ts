// Validações da área de admin (spec 5.2). Sem imports: testado com node --test.

export interface DadosPessoa {
  nome: string;
  email: string;
  novaSenha: string;
  confirmacao: string;
}

export interface PessoaValidada {
  erro?: string;
  nome: string;
  email: string;
  trocarSenha: boolean;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATA = /^\d{4}-\d{2}-\d{2}$/;

export function validarPessoa(d: DadosPessoa): PessoaValidada {
  const nome = d.nome.trim().slice(0, 40);
  const email = d.email.trim().toLowerCase();
  const trocarSenha = d.novaSenha !== "" || d.confirmacao !== "";
  const r = { nome, email, trocarSenha };
  if (!nome) return { ...r, erro: "Preencha o nome." };
  if (!EMAIL.test(email)) return { ...r, erro: "E-mail inválido." };
  if (trocarSenha) {
    if (d.novaSenha.length < 8) return { ...r, erro: "A senha precisa ter pelo menos 8 caracteres." };
    if (d.novaSenha !== d.confirmacao) return { ...r, erro: "As senhas não conferem." };
  }
  return r;
}

function dataValida(s: string): boolean {
  if (!DATA.test(s)) return false;
  const [a, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(a, m - 1, d));
  return dt.getUTCFullYear() === a && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

// Datas no formato AAAA-MM-DD; comparação de texto funciona nesse formato.
export function validarDatas(amizade: string, namoro: string, hoje: string): string | null {
  if (!dataValida(amizade) || !dataValida(namoro)) return "Use datas válidas.";
  if (amizade > hoje || namoro > hoje) return "As datas não podem ser no futuro.";
  if (namoro < amizade) return "O namoro não pode começar antes da amizade.";
  return null;
}
