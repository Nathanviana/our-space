// Cria as duas contas (Nathan e Iris) e as datas do Espaço. Sem tela de cadastro (RNF-01, PRD v3 7.6).
// Uso: npm run criar-contas   (lê SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY do .env.local)
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Preencha SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local.");
  process.exit(1);
}
const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const rl = createInterface({ input: stdin, output: stdout });

// Lê a senha sem mostrar na tela
async function perguntarSenha(texto) {
  const escrever = rl._writeToOutput;
  rl._writeToOutput = (s) => (s.includes(texto) ? escrever.call(rl, s) : escrever.call(rl, "*"));
  const senha = await rl.question(texto);
  rl._writeToOutput = escrever;
  stdout.write("\n");
  return senha;
}

async function conta(n) {
  console.log(`\nConta ${n}`);
  const nome = (await rl.question("  Nome: ")).trim();
  const email = (await rl.question("  E-mail: ")).trim().toLowerCase();
  let senha = "";
  while (senha.length < 8) {
    senha = await perguntarSenha("  Senha (mínimo 8 caracteres): ");
  }
  return { nome, email, senha_hash: await bcrypt.hash(senha, 12) };
}

function data(texto) {
  return rl.question(texto).then((v) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v.trim())) throw new Error(`Data inválida: ${v} (use AAAA-MM-DD)`);
    return v.trim();
  });
}

try {
  const contas = [await conta(1), await conta(2)];
  const { error: e1 } = await db.from("usuarios").upsert(contas, { onConflict: "email" });
  if (e1) throw e1;

  console.log("\nDatas do contador");
  const data_amizade = await data("  Início da amizade (AAAA-MM-DD): ");
  const data_namoro = await data("  Início do namoro (AAAA-MM-DD): ");
  const { error: e2 } = await db.from("espaco").upsert({ id: 1, data_amizade, data_namoro });
  if (e2) throw e2;

  console.log("\nPronto: contas e datas gravadas.");
} catch (e) {
  console.error("\nErro:", e.message ?? e);
  process.exitCode = 1;
} finally {
  rl.close();
}
