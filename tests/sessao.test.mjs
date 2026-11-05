import { test } from "node:test";
import assert from "node:assert/strict";
import { sessaoAindaValida } from "../src/lib/admin/sessao.ts";

const seg = (iso) => Math.floor(Date.parse(iso) / 1000);

test("sessaoDesde null → válida (migração ausente ou nunca trocou a senha)", () => {
  assert.equal(sessaoAindaValida(100, null), true);
});

test("iat ausente → inválida quando há sessaoDesde", () => {
  assert.equal(sessaoAindaValida(undefined, "2026-11-05T10:00:00Z"), false);
});

test("token emitido antes da troca de senha → inválido", () => {
  assert.equal(sessaoAindaValida(seg("2026-11-05T09:59:59Z"), "2026-11-05T10:00:00Z"), false);
});

test("token emitido no mesmo segundo ou depois → válido", () => {
  assert.equal(sessaoAindaValida(seg("2026-11-05T10:00:00Z"), "2026-11-05T10:00:00.400Z"), true);
  assert.equal(sessaoAindaValida(seg("2026-11-05T11:00:00Z"), "2026-11-05T10:00:00Z"), true);
});
