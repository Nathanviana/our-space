import { test } from "node:test";
import assert from "node:assert/strict";
import { proximosMarcos } from "../src/lib/marcos.ts";

const dia = (a, m, d) => new Date(a, m - 1, d, 15, 30);

test("proximosMarcos: mesversário e próxima centena, do mais perto ao mais longe", () => {
  // Namoro em 20/08/2023; hoje 06/11/2026 = 1174 dias
  const [a, b] = proximosMarcos("2023-08-20", dia(2026, 11, 6));
  assert.equal(a.titulo, "3 anos e 3 meses");
  assert.equal(a.faltam, 14);
  assert.equal(a.data.getDate(), 20);
  assert.equal(b.titulo, "1.200 dias juntos");
  assert.equal(b.faltam, 26);
  assert.ok(a.progresso > 0.5 && a.progresso < 0.6);
  assert.equal(b.progresso, 0.74);
});

test("proximosMarcos: aniversário redondo vira 'N anos'", () => {
  const [a] = proximosMarcos("2023-08-20", dia(2026, 8, 1));
  assert.equal(a.titulo, "3 anos");
  assert.equal(a.faltam, 19);
});

test("proximosMarcos: dia 31 cai no último dia de meses curtos", () => {
  const [a] = proximosMarcos("2026-01-31", dia(2026, 2, 10));
  assert.equal(a.titulo, "1 mês");
  assert.equal(a.data.getMonth(), 1);
  assert.equal(a.data.getDate(), 28);
});

test("proximosMarcos: no próprio dia, o marco é hoje (faltam 0)", () => {
  const [a] = proximosMarcos("2023-08-20", dia(2026, 11, 20));
  assert.equal(a.faltam, 0);
  assert.equal(a.progresso, 1);
});

test("proximosMarcos: data futura não gera marcos", () => {
  assert.deepEqual(proximosMarcos("2030-01-01", dia(2026, 11, 6)), []);
});
