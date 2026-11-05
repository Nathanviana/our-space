import { test } from "node:test";
import assert from "node:assert/strict";
import { calcularMeses, percentualComMemoria } from "../src/lib/admin/metricas.ts";

const HOJE = "2026-11-05";
const plano = (id, extra = {}) => ({
  id, temaId: "t", situacao: "vamos_fazer", feitoEm: null, temMemoria: false, criadoPor: null, ...extra,
});
const linha = (meses, mes) => meses.find((l) => l.mes === mes);

test("12 linhas, do mês de hoje para trás", () => {
  const m = calcularMeses([], [], HOJE);
  assert.equal(m.length, 12);
  assert.equal(m[0].mes, "2026-11");
  assert.equal(m[11].mes, "2025-12");
});

test("feito com memória conta no mês de feito_em", () => {
  const m = calcularMeses([plano("a", { situacao: "ja_fizemos", feitoEm: "2026-10-20", temMemoria: true })], [], HOJE);
  assert.equal(linha(m, "2026-10").feitos, 1);
  assert.equal(linha(m, "2026-10").comMemoria, 1);
  assert.equal(linha(m, "2026-11").feitos, 0);
});

test("plano sorteado 2 vezes no mês conta 1", () => {
  const m = calcularMeses([plano("a")], [
    { planoId: "a", data: "2026-11-01T12:00:00Z" },
    { planoId: "a", data: "2026-11-02T12:00:00Z" },
  ], HOJE);
  assert.equal(linha(m, "2026-11").sorteados, 1);
});

test("sorteado e feito depois vira programa", () => {
  const m = calcularMeses(
    [plano("a", { situacao: "ja_fizemos", feitoEm: "2026-11-03" })],
    [{ planoId: "a", data: "2026-11-01T12:00:00Z" }],
    HOJE,
  );
  assert.equal(linha(m, "2026-11").sorteadosFeitos, 1);
});

test("feito antes do sorteio não conta como programa do sorteio", () => {
  const m = calcularMeses(
    [plano("a", { situacao: "ja_fizemos", feitoEm: "2026-11-03" })],
    [{ planoId: "a", data: "2026-11-04T12:00:00Z" }],
    HOJE,
  );
  assert.equal(linha(m, "2026-11").sorteadosFeitos, 0);
});

test("sorteado ainda em vamos fazer não conta como programa", () => {
  const m = calcularMeses([plano("a")], [{ planoId: "a", data: "2026-11-01T12:00:00Z" }], HOJE);
  assert.equal(linha(m, "2026-11").sorteadosFeitos, 0);
});

test("ignora o que tem mais de 12 meses", () => {
  const m = calcularMeses(
    [plano("a", { situacao: "ja_fizemos", feitoEm: "2025-11-30" })],
    [{ planoId: "a", data: "2025-11-01T12:00:00Z" }],
    HOJE,
  );
  const total = m.reduce((s, l) => s + l.feitos + l.sorteados, 0);
  assert.equal(total, 0);
});

test("percentualComMemoria: 2 de 3 → 67", () => {
  const feitos = [
    plano("a", { situacao: "ja_fizemos", feitoEm: "2026-01-01", temMemoria: true }),
    plano("b", { situacao: "ja_fizemos", feitoEm: "2026-01-01", temMemoria: true }),
    plano("c", { situacao: "ja_fizemos", feitoEm: "2026-01-01" }),
    plano("d"),
  ];
  assert.equal(percentualComMemoria(feitos), 67);
});

test("percentualComMemoria: nenhum feito → null", () => {
  assert.equal(percentualComMemoria([plano("a")]), null);
});
