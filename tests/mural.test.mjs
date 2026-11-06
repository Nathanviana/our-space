import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizar, textoDeBusca, filtrarMural, jeitoDoCartao, inclinacao, destacar, FILTRO_INICIAL } from "../src/lib/mural.ts";

const item = (o) => ({
  id: "p", href: "/", titulo: "", temaId: "t1", temaNome: "Cozinhar", temaIcone: "🍝", temaIndice: 0, situacao: "vamos_fazer",
  tipo: null, site: null, imagem: null, lugar: null, temLugar: false, criadoEm: "2026-01-01", feitoEm: null, memoria: null, busca: "", ...o,
  busca: textoDeBusca([o.titulo, o.site, o.lugar, o.memoria?.frase, "Cozinhar"]),
});

const itens = [
  item({ id: "a", titulo: "Café da manhã em Paraty", criadoEm: "2026-03-01" }),
  item({ id: "b", titulo: "Bolo de cenoura", site: "TudoGostoso", imagem: "https://x/a.jpg", criadoEm: "2026-05-01", temaId: "t2" }),
  item({ id: "c", titulo: "Praia do Félix", situacao: "ja_fizemos", feitoEm: "2026-02-10", memoria: { id: "m", frase: "Sol nascendo", data: "2026-02-10", capa: "https://x/f.jpg", qtdFotos: 3 } }),
];

test("normalizar: sem acento e minúsculo", () => {
  assert.equal(normalizar("  Café FÉLIX "), "cafe felix");
});

test("filtrarMural: busca sem acento, por várias palavras e em frase/site", () => {
  const ids = (f) => filtrarMural(itens, { ...FILTRO_INICIAL, ...f }).map((i) => i.id);
  assert.deepEqual(ids({ texto: "cafe" }), ["a"]);
  assert.deepEqual(ids({ texto: "felix" }), ["c"]);
  assert.deepEqual(ids({ texto: "sol" }), ["c"]);
  assert.deepEqual(ids({ texto: "tudogostoso" }), ["b"]);
  assert.deepEqual(ids({ texto: "manha paraty" }), ["a"]);
  assert.deepEqual(ids({ texto: "nada disso" }), []);
});

test("filtrarMural: situação, tema, com foto e ordem", () => {
  const ids = (f) => filtrarMural(itens, { ...FILTRO_INICIAL, ...f }).map((i) => i.id);
  assert.deepEqual(ids({}), ["b", "a", "c"]);
  assert.deepEqual(ids({ ordem: "antigos" }), ["c", "a", "b"]);
  assert.deepEqual(ids({ ordem: "az" }), ["b", "a", "c"]);
  assert.deepEqual(ids({ situacao: "ja_fizemos" }), ["c"]);
  assert.deepEqual(ids({ tema: "t2" }), ["b"]);
  assert.deepEqual(ids({ comFoto: true }), ["b", "c"]);
});

test("jeitoDoCartao, inclinacao e destacar", () => {
  assert.equal(jeitoDoCartao(itens[2]), "polaroid");
  assert.equal(jeitoDoCartao(itens[1]), "capa");
  assert.equal(jeitoDoCartao(itens[0]), "bilhete");
  assert.equal(jeitoDoCartao({ ...itens[0], situacao: "ja_fizemos" }), "feito");
  assert.equal(inclinacao("abc"), inclinacao("abc"));
  assert.ok(Math.abs(inclinacao("xyz")) <= 2.4);
  assert.deepEqual(destacar("Café da manhã", "cafe"), [{ t: "Café", marca: true }, { t: " da manhã", marca: false }]);
  assert.deepEqual(destacar("Bolo", ""), [{ t: "Bolo", marca: false }]);
});
