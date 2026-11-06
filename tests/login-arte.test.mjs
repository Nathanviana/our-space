import { test } from "node:test";
import assert from "node:assert/strict";
import { validarArteLogin, lugaresDasPolaroids, nomeDoAparelho, origemDe } from "../src/lib/login-arte.ts";

const id = (n) => `00000000-0000-4000-8000-00000000000${n}`;

test("validarArteLogin: coração sem fotos é válido", () => {
  assert.deepEqual(validarArteLogin("coracao", ""), { modo: "coracao", ids: [] });
});

test("validarArteLogin: polaroids exigem 1 a 5 fotos sem repetir", () => {
  assert.ok(validarArteLogin("polaroids", "").erro);
  assert.deepEqual(validarArteLogin("polaroids", `${id(1)}, ${id(2)}`).ids, [id(1), id(2)]);
  assert.ok(validarArteLogin("polaroids", `${id(1)},${id(1)}`).erro);
  assert.ok(validarArteLogin("polaroids", [1, 2, 3, 4, 5, 6].map(id).join(",")).erro);
  assert.ok(validarArteLogin("polaroids", "nao-e-uuid").erro);
  assert.ok(validarArteLogin("outro", "").erro);
});

test("lugaresDasPolaroids: uma posição por foto; a 5ª some no celular", () => {
  assert.equal(lugaresDasPolaroids(0).length, 0);
  for (let n = 1; n <= 5; n++) assert.equal(lugaresDasPolaroids(n).length, n);
  const cinco = lugaresDasPolaroids(5);
  assert.equal(cinco[4].celular, null);
  assert.ok(cinco.slice(0, 4).every((l) => l.celular));
  assert.equal(lugaresDasPolaroids(9).length, 5);
});

test("nomeDoAparelho: sistema e navegador", () => {
  assert.equal(
    nomeDoAparelho("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1"),
    "iPhone · Safari",
  );
  assert.equal(nomeDoAparelho("Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36"), "Android · Chrome");
  assert.equal(nomeDoAparelho("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 Edg/130.0"), "Windows · Edge");
  assert.equal(nomeDoAparelho(""), "Aparelho");
});

test("origemDe: https em produção, http só no localhost", () => {
  assert.deepEqual(origemDe("our-space-black.vercel.app", "https"), { rpID: "our-space-black.vercel.app", origin: "https://our-space-black.vercel.app" });
  assert.deepEqual(origemDe("localhost:3000", null), { rpID: "localhost", origin: "http://localhost:3000" });
  assert.equal(origemDe("exemplo.com", "http"), null);
  assert.equal(origemDe("ruim/host", "https"), null);
  assert.equal(origemDe(null, "https"), null);
});
