import { test } from "node:test";
import assert from "node:assert/strict";
import { blocosFotoMini, limparBusca } from "../src/lib/admin/lote.ts";
import { lerPaginado } from "../src/lib/admin/paginar.ts";
import { colunaAusente } from "../src/lib/admin/sessao.ts";

test("blocosFotoMini: nunca separa a foto da miniatura e respeita o tamanho", () => {
  const caminhos = Array.from({ length: 7 }, (_, i) => `m/${i}.jpg`);
  const b = blocosFotoMini(caminhos, 4);
  assert.deepEqual(b.map((x) => x.fotos), [["m/0.jpg", "m/1.jpg"], ["m/2.jpg", "m/3.jpg"], ["m/4.jpg", "m/5.jpg"], ["m/6.jpg"]]);
  assert.deepEqual(b[0].arquivos, ["m/0.jpg", "m/0_mini.jpg", "m/1.jpg", "m/1_mini.jpg"]);
  assert.ok(b.every((x) => x.arquivos.length <= 4));
});

test("lerPaginado: junta todas as páginas além do corte de 1000", async () => {
  const fonte = Array.from({ length: 2500 }, (_, i) => i);
  let chamadas = 0;
  const tudo = await lerPaginado(async (de, ate) => { chamadas++; return fonte.slice(de, ate + 1); }, 1000);
  assert.equal(tudo.length, 2500);
  assert.equal(chamadas, 3);
});

test("lerPaginado: página exata termina com uma chamada vazia", async () => {
  const fonte = Array.from({ length: 1000 }, (_, i) => i);
  const tudo = await lerPaginado(async (de, ate) => fonte.slice(de, ate + 1), 1000);
  assert.equal(tudo.length, 1000);
});

test("limparBusca: remove caracteres que quebram o filtro .or() do PostgREST", () => {
  assert.equal(limparBusca(' "praia" \\ (sol), 50%_ '), "praia sol 50");
  assert.equal(limparBusca("   "), "");
});

test("colunaAusente: só os códigos de coluna inexistente", () => {
  assert.equal(colunaAusente("42703"), true);
  assert.equal(colunaAusente("PGRST204"), true);
  assert.equal(colunaAusente("57014"), false);
  assert.equal(colunaAusente(undefined), false);
});
