import { test } from "node:test";
import assert from "node:assert/strict";
import { validarPessoa, validarDatas } from "../src/lib/admin/validacao.ts";

const base = { nome: "Iris", email: "iris@x.com", novaSenha: "", confirmacao: "" };

test("validarPessoa: nome vazio", () => {
  assert.equal(validarPessoa({ ...base, nome: "   " }).erro, "Preencha o nome.");
});

test("validarPessoa: nome cortado em 40", () => {
  const r = validarPessoa({ ...base, nome: "a".repeat(41) });
  assert.equal(r.erro, undefined);
  assert.equal(r.nome.length, 40);
});

test("validarPessoa: e-mail normalizado", () => {
  assert.equal(validarPessoa({ ...base, email: " Iris@X.com " }).email, "iris@x.com");
});

test("validarPessoa: e-mail sem @", () => {
  assert.equal(validarPessoa({ ...base, email: "irisx.com" }).erro, "E-mail inválido.");
});

test("validarPessoa: senha em branco mantém a atual", () => {
  const r = validarPessoa(base);
  assert.equal(r.erro, undefined);
  assert.equal(r.trocarSenha, false);
});

test("validarPessoa: senha curta", () => {
  assert.equal(
    validarPessoa({ ...base, novaSenha: "1234567", confirmacao: "1234567" }).erro,
    "A senha precisa ter pelo menos 8 caracteres.",
  );
});

test("validarPessoa: confirmação diferente", () => {
  assert.equal(validarPessoa({ ...base, novaSenha: "12345678", confirmacao: "12345679" }).erro, "As senhas não conferem.");
});

test("validarPessoa: senha válida", () => {
  const r = validarPessoa({ ...base, novaSenha: "12345678", confirmacao: "12345678" });
  assert.equal(r.erro, undefined);
  assert.equal(r.trocarSenha, true);
});

const HOJE = "2026-11-05";

test("validarDatas: formato inválido", () => {
  assert.equal(validarDatas("2026-13-01", "2026-10-01", HOJE), "Use datas válidas.");
  assert.equal(validarDatas("", "2026-10-01", HOJE), "Use datas válidas.");
});

test("validarDatas: data futura", () => {
  assert.equal(validarDatas("2026-11-06", "2026-11-06", HOJE), "As datas não podem ser no futuro.");
});

test("validarDatas: namoro antes da amizade", () => {
  assert.equal(validarDatas("2025-05-01", "2025-04-30", HOJE), "O namoro não pode começar antes da amizade.");
});

test("validarDatas: datas iguais são válidas", () => {
  assert.equal(validarDatas("2026-11-05", "2026-11-05", HOJE), null);
});
