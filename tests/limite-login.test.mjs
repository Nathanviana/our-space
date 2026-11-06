import { test } from "node:test";
import assert from "node:assert/strict";
import { aposFalha, minutosBloqueado, mensagemBloqueio, ipDe, LIMITE_EMAIL } from "../src/lib/limite-login.ts";

const t0 = new Date("2026-11-06T12:00:00Z");
const mais = (min) => new Date(t0.getTime() + min * 60_000);

test("aposFalha: bloqueia na 5ª senha errada dentro de 15 minutos", () => {
  let r = null;
  for (let i = 1; i <= 4; i++) {
    r = aposFalha(r, mais(i), LIMITE_EMAIL);
    assert.equal(r.falhas, i);
    assert.equal(minutosBloqueado(r, mais(i)), 0);
  }
  r = aposFalha(r, mais(5), LIMITE_EMAIL);
  assert.equal(minutosBloqueado(r, mais(5)), 15);
  assert.equal(minutosBloqueado(r, mais(19.5)), 1);
  assert.equal(minutosBloqueado(r, mais(21)), 0);
});

test("aposFalha: janela vencida recomeça a contagem", () => {
  let r = aposFalha(null, t0, LIMITE_EMAIL);
  r = aposFalha(r, mais(1), LIMITE_EMAIL);
  assert.equal(r.falhas, 2);
  r = aposFalha(r, mais(20), LIMITE_EMAIL);
  assert.equal(r.falhas, 1);
});

test("minutosBloqueado: sem registro está liberado", () => {
  assert.equal(minutosBloqueado(null, t0), 0);
});

test("mensagemBloqueio e ipDe", () => {
  assert.equal(mensagemBloqueio(1), "Muitas tentativas. Tente de novo em 1 minuto.");
  assert.equal(ipDe("200.1.2.3, 10.0.0.1", null), "200.1.2.3");
  assert.equal(ipDe(null, "200.9.9.9"), "200.9.9.9");
  assert.equal(ipDe(null, null), "desconhecido");
});
