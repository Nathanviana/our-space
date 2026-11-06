import { test } from "node:test";
import assert from "node:assert/strict";
import { extrairPrevia, decodificar, ipPrivado, limparPrevia } from "../src/lib/previa.ts";

test("extrairPrevia: usa og:title, og:image e og:site_name", () => {
  const html = `<html><head><title>Ignorado</title>
    <meta property="og:title" content="Duna: Parte Dois &amp; mais">
    <meta content='/capa.jpg' property='og:image'>
    <meta property="og:site_name" content="Netflix"></head></html>`;
  assert.deepEqual(extrairPrevia(html, "https://www.netflix.com/title/1"), {
    titulo: "Duna: Parte Dois & mais",
    imagem: "https://www.netflix.com/capa.jpg",
    site: "Netflix",
  });
});

test("extrairPrevia: cai para <title>, twitter:image e o domínio", () => {
  const html = `<title>
     Bolo de cenoura &#8211; Receitas</title><meta name="twitter:image" content="https://img.exemplo.com/a.png">`;
  assert.deepEqual(extrairPrevia(html, "https://www.tudogostoso.com.br/receita/1"), {
    titulo: "Bolo de cenoura – Receitas",
    imagem: "https://img.exemplo.com/a.png",
    site: "tudogostoso.com.br",
  });
});

test("extrairPrevia: ignora imagem com protocolo estranho e página sem nada", () => {
  assert.equal(extrairPrevia(`<meta property="og:image" content="javascript:alert(1)">`, "https://a.com").imagem, null);
  assert.deepEqual(extrairPrevia("", "https://a.com/x"), { titulo: null, imagem: null, site: "a.com" });
});

test("decodificar: entidades e espaços", () => {
  assert.equal(decodificar("  Caf&eacute;&#x21; &quot;ok&quot; "), "Caf&eacute;! \"ok\"");
});

test("ipPrivado: redes internas bloqueadas, públicas liberadas", () => {
  for (const ip of ["127.0.0.1", "10.1.2.3", "172.20.0.1", "192.168.0.10", "169.254.169.254", "100.64.0.1", "0.0.0.0", "::1", "fd00::1", "fe80::1", "::ffff:10.0.0.1"]) {
    assert.ok(ipPrivado(ip), ip);
  }
  for (const ip of ["8.8.8.8", "172.32.0.1", "200.147.67.142", "2606:4700::1111"]) assert.ok(!ipPrivado(ip), ip);
});

test("limparPrevia: aceita só imagem http(s) e corta tamanhos", () => {
  assert.deepEqual(limparPrevia(" Filme ", "javascript:x", ""), { titulo: "Filme", imagem: null, site: null });
  assert.equal(limparPrevia("a".repeat(300), "https://x.com/a.jpg", "S").titulo.length, 200);
});

test("oembedDe: YouTube, Spotify e Vimeo; outros sites não", async () => {
  const { oembedDe, previaDeOembed } = await import("../src/lib/previa.ts");
  assert.match(oembedDe("https://youtu.be/abc"), /^https:\/\/www\.youtube\.com\/oembed\?format=json&url=/);
  assert.match(oembedDe("https://m.youtube.com/watch?v=x"), /youtube\.com\/oembed/);
  assert.match(oembedDe("https://open.spotify.com/track/1"), /^https:\/\/open\.spotify\.com\/oembed/);
  assert.match(oembedDe("https://vimeo.com/1"), /vimeo\.com\/api\/oembed/);
  assert.equal(oembedDe("https://netflix.com/x"), null);
  assert.deepEqual(previaDeOembed({ title: "Duna", thumbnail_url: "https://i.ytimg.com/a.jpg", provider_name: "YouTube" }), {
    titulo: "Duna", imagem: "https://i.ytimg.com/a.jpg", site: "YouTube",
  });
  assert.equal(previaDeOembed({ html: "<iframe>" }), null);
});
