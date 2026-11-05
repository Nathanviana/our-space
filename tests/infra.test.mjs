import { test } from "node:test";
import assert from "node:assert/strict";
import { LIMITE_BANCO, LIMITE_FOTOS, formatarBytes, percentual, fotosOrfas } from "../src/lib/admin/infra.ts";

test("limites do plano gratuito", () => {
  assert.equal(LIMITE_BANCO, 500 * 1024 * 1024);
  assert.equal(LIMITE_FOTOS, 1024 ** 3);
});

test("formatarBytes", () => {
  assert.equal(formatarBytes(0), "0 B");
  assert.equal(formatarBytes(1536), "1,5 KB");
  assert.equal(formatarBytes(5242880), "5 MB");
});

test("percentual limitado a 100, com 1 casa", () => {
  assert.equal(percentual(600, 500), 100);
  assert.equal(percentual(1, 3), 33.3);
});

test("fotosOrfas: objetos sem foto no banco (nem como miniatura)", () => {
  assert.deepEqual(fotosOrfas(["a/1.jpg", "a/1_mini.jpg", "b/2.jpg", "b/2_mini.jpg"], ["a/1.jpg"]), ["b/2.jpg", "b/2_mini.jpg"]);
});
