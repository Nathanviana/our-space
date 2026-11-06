import { test } from "node:test";
import assert from "node:assert/strict";
import { embedDaMusica } from "../src/lib/musica.ts";
import { agruparPorMes } from "../src/lib/galeria.ts";
import { escolherSorteio } from "../src/lib/sorteio.ts";
import { chaveGeo, lerEndereco, bandeira, resumirConquistas, proximaMeta } from "../src/lib/conquistas.ts";

test("embedDaMusica: Spotify, YouTube e Apple Music viram player; outros não", () => {
  assert.deepEqual(embedDaMusica("https://open.spotify.com/intl-pt/track/4uLU6hMCjMI75M1A2tKUQC?si=x"), {
    servico: "spotify", src: "https://open.spotify.com/embed/track/4uLU6hMCjMI75M1A2tKUQC", altura: 152,
  });
  assert.equal(embedDaMusica("https://open.spotify.com/playlist/37i9dQZF1DX").altura, 352);
  assert.equal(embedDaMusica("https://www.youtube.com/watch?v=Way9Dexny3w&t=10").src, "https://www.youtube-nocookie.com/embed/Way9Dexny3w");
  assert.equal(embedDaMusica("https://youtu.be/Way9Dexny3w").src, "https://www.youtube-nocookie.com/embed/Way9Dexny3w");
  assert.equal(embedDaMusica("https://music.youtube.com/watch?v=Way9Dexny3w").servico, "youtube");
  assert.equal(embedDaMusica("https://music.apple.com/br/album/x/123?i=456").src, "https://embed.music.apple.com/br/album/x/123?i=456");
  assert.equal(embedDaMusica("https://deezer.com/track/1"), null);
  assert.equal(embedDaMusica("não é link"), null);
  assert.equal(embedDaMusica(null), null);
});

test("agruparPorMes: junta por mês da foto (ou do envio) na ordem recebida", () => {
  const g = agruparPorMes([
    { id: 1, tiradaEm: "2026-11-02T10:00:00Z", enviadaEm: "2026-11-03" },
    { id: 2, tiradaEm: null, enviadaEm: "2026-11-01T00:00:00Z" },
    { id: 3, tiradaEm: "2025-02-14T20:00:00Z", enviadaEm: "2026-11-01" },
  ]);
  assert.deepEqual(g.map((x) => [x.titulo, x.fotos.map((f) => f.id)]), [["Novembro de 2026", [1, 2]], ["Fevereiro de 2025", [3]]]);
});

test("escolherSorteio: evita os recentes, mas sorteia mesmo se só sobrarem eles", () => {
  const c = [{ id: "a" }, { id: "b" }, { id: "c" }];
  for (let i = 0; i < 20; i++) assert.notEqual(escolherSorteio(c, ["a", "b"]).id, "a");
  assert.equal(escolherSorteio(c, ["a", "b"], () => 0.99).id, "c");
  assert.ok(["a", "b"].includes(escolherSorteio([{ id: "a" }, { id: "b" }], ["a", "b"]).id));
  assert.equal(escolherSorteio([], []), null);
});

test("conquistas: chave, endereço, bandeira, resumo e meta", () => {
  assert.equal(chaveGeo(-23.55052, -46.633308), "-23.55,-46.63");
  assert.deepEqual(
    lerEndereco({ address: { town: "Paraty", state: "Rio de Janeiro", "ISO3166-2-lvl4": "BR-RJ", country: "Brasil", country_code: "br" } }),
    { cidade: "Paraty", estado: "Rio de Janeiro", uf: "RJ", pais: "Brasil", codigoPais: "br" },
  );
  assert.equal(lerEndereco({}).cidade, null);
  assert.equal(bandeira("br"), "🇧🇷");
  assert.equal(bandeira(null), "🏳️");
  const sp = { cidade: "São Paulo", estado: "São Paulo", uf: "SP", pais: "Brasil", codigoPais: "br" };
  const r = resumirConquistas([sp, sp, { ...sp, cidade: "Campinas" }, { cidade: "Paraty", estado: "Rio de Janeiro", uf: "RJ", pais: "Brasil", codigoPais: "br" }, { cidade: null, estado: null, uf: null, pais: null, codigoPais: null }]);
  assert.deepEqual(r.cidades.map((c) => [c.nome, c.vezes]), [["São Paulo", 2], ["Campinas", 1], ["Paraty", 1]]);
  assert.deepEqual(r.estados.map((e) => [e.uf, e.cidades]), [["SP", 2], ["RJ", 1]]);
  assert.deepEqual(r.paises.map((p) => [p.nome, p.cidades]), [["Brasil", 3]]);
  assert.equal(proximaMeta(0), 1);
  assert.equal(proximaMeta(12), 15);
  assert.equal(proximaMeta(200), 250);
});
