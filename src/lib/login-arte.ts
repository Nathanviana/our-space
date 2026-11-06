// Regras puras da arte do login e das passkeys. Sem imports: testado com node --test.

export type ModoArte = "coracao" | "polaroids";
export const MAX_POLAROIDS = 5;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Escolha feita no admin: modo + ids das fotos na ordem (sem repetir, até 5).
export function validarArteLogin(modo: string, idsTexto: string): { erro?: string; modo?: ModoArte; ids?: string[] } {
  if (modo !== "coracao" && modo !== "polaroids") return { erro: "Escolha o coração ou as polaroids." };
  const ids = idsTexto.split(",").map((s) => s.trim()).filter(Boolean);
  if (ids.some((id) => !UUID.test(id))) return { erro: "Foto inválida." };
  if (new Set(ids).size !== ids.length) return { erro: "A mesma foto foi escolhida duas vezes." };
  if (ids.length > MAX_POLAROIDS) return { erro: `Escolha no máximo ${MAX_POLAROIDS} fotos.` };
  if (modo === "polaroids" && ids.length === 0) return { erro: "Escolha pelo menos uma foto para as polaroids." };
  return { modo, ids };
}

// Posição de cada polaroid (x, y em % do painel; r em graus), conforme a quantidade de fotos.
type Posicao = [number, number, number];
const DESKTOP: Record<number, Posicao[]> = {
  1: [[34, 20, -3]],
  2: [[14, 14, -7], [50, 30, 6]],
  3: [[8, 10, -8], [58, 8, 7], [32, 36, -2]],
  4: [[8, 8, -8], [58, 6, 7], [10, 44, 6], [56, 42, -5]],
  5: [[6, 6, -9], [60, 4, 8], [8, 46, 5], [58, 44, -6], [33, 24, -2]],
};
const CELULAR: Record<number, Posicao[]> = {
  1: [[36.5, 8, -3]],
  2: [[22, 10, -6], [51, 14, 5]],
  3: [[8, 12, -7], [65, 14, 7], [36.5, 6, 2]],
  4: [[4, 12, -8], [26, 6, 4], [48, 14, -4], [70, 8, 7]],
};

export interface LugarPolaroid {
  desktop: Posicao;
  celular: Posicao | null; // null: não aparece no celular (painel baixo)
}

export function lugaresDasPolaroids(qtd: number): LugarPolaroid[] {
  const n = Math.max(0, Math.min(MAX_POLAROIDS, qtd));
  if (n === 0) return [];
  const celular = CELULAR[Math.min(n, 4)];
  return DESKTOP[n].map((d, i) => ({ desktop: d, celular: celular[i] ?? null }));
}

// Nome amigável do aparelho onde a passkey foi criada (mostrado no admin).
export function nomeDoAparelho(ua: string): string {
  const s = ua || "";
  const sistema = /iPhone/.test(s)
    ? "iPhone"
    : /iPad/.test(s)
      ? "iPad"
      : /Android/.test(s)
        ? "Android"
        : /Macintosh|Mac OS X/.test(s)
          ? "Mac"
          : /Windows/.test(s)
            ? "Windows"
            : /Linux/.test(s)
              ? "Linux"
              : "Aparelho";
  const navegador = /Edg\//.test(s)
    ? "Edge"
    : /SamsungBrowser/.test(s)
      ? "Samsung Internet"
      : /Firefox\//.test(s)
        ? "Firefox"
        : /(Chrome|CriOS)\//.test(s)
          ? "Chrome"
          : /Safari\//.test(s)
            ? "Safari"
            : "";
  return navegador ? `${sistema} · ${navegador}` : sistema;
}

// Origem e domínio (rpID) da passkey a partir dos cabeçalhos da requisição.
export function origemDe(host: string | null, proto: string | null): { rpID: string; origin: string } | null {
  const h = (host ?? "").split(",")[0].trim().toLowerCase();
  if (!h || !/^[a-z0-9.-]+(:\d+)?$/.test(h)) return null;
  const rpID = h.replace(/:\d+$/, "");
  const local = rpID === "localhost" || rpID === "127.0.0.1";
  const p = (proto ?? "").split(",")[0].trim() || (local ? "http" : "https");
  if (p !== "http" && p !== "https") return null;
  if (p === "http" && !local) return null; // passkey exige https fora do localhost
  return { rpID, origin: `${p}://${h}` };
}
