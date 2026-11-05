import { test } from "node:test";
import assert from "node:assert/strict";
import { LIMITE_LOTE, validarIds, confirmacaoOk, caminhosComMini, separarFeitos } from "../src/lib/admin/lote.ts";

const uuid = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

test("LIMITE_LOTE é 200", () => {
  assert.equal(LIMITE_LOTE, 200);
});

test("validarIds: vazio", () => {
  assert.equal(validarIds([]), "Selecione ao menos um item.");
});

test("validarIds: mais de 200", () => {
  assert.equal(validarIds(Array.from({ length: 201 }, (_, i) => uuid(i))), "No máximo 200 itens por vez.");
});

test("validarIds: id fora do padrão", () => {
  assert.equal(validarIds(["abc"]), "Seleção inválida.");
});

test("validarIds: 200 válidos", () => {
  assert.equal(validarIds(Array.from({ length: 200 }, (_, i) => uuid(i))), null);
});

test("confirmacaoOk: aceita 'apagar' com espaços e maiúscula", () => {
  assert.equal(confirmacaoOk(" Apagar "), true);
});

test("confirmacaoOk: recusa texto diferente", () => {
  assert.equal(confirmacaoOk("apaga"), false);
  assert.equal(confirmacaoOk(""), false);
});

test("caminhosComMini: foto e miniatura (_mini.jpg, regra de caminhoMini)", () => {
  assert.deepEqual(caminhosComMini(["m/a.jpg", "m/b.jpg"]), ["m/a.jpg", "m/a_mini.jpg", "m/b.jpg", "m/b_mini.jpg"]);
});

test("separarFeitos: pula os que já estão em já fizemos", () => {
  assert.deepEqual(
    separarFeitos([
      { id: "1", situacao: "vamos_fazer" },
      { id: "2", situacao: "ja_fizemos" },
      { id: "3", situacao: "vamos_fazer" },
    ]),
    { aplicar: ["1", "3"], pulados: 1 },
  );
});
