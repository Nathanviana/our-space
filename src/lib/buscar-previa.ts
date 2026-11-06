// Busca a página do link e extrai a prévia. Só no servidor, com proteção contra acessar a rede interna.
import "server-only";
import { lookup } from "node:dns/promises";
import { extrairPrevia, ipPrivado, oembedDe, previaDeOembed, type PreviaLink } from "./previa";

const LIMITE_BYTES = 600_000;
const MAX_REDIRECIONAMENTOS = 3;

async function enderecoPublico(url: URL): Promise<boolean> {
  if (url.protocol !== "https:" && url.protocol !== "http:") return false;
  if (url.port && url.port !== "80" && url.port !== "443") return false;
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal")) return false;
  try {
    const ips = await lookup(host, { all: true });
    return ips.length > 0 && ips.every((i) => !ipPrivado(i.address));
  } catch {
    return false;
  }
}

function charsetDe(tipo: string): string {
  const c = tipo.match(/charset=([\w-]+)/i)?.[1]?.toLowerCase() ?? "utf-8";
  try {
    new TextDecoder(c);
    return c;
  } catch {
    return "utf-8";
  }
}

async function lerAte(res: Response, limite: number): Promise<Uint8Array> {
  const leitor = res.body?.getReader();
  if (!leitor) return new Uint8Array();
  const partes: Uint8Array[] = [];
  let total = 0;
  while (total < limite) {
    const { done, value } = await leitor.read();
    if (done || !value) break;
    partes.push(value);
    total += value.length;
  }
  await leitor.cancel().catch(() => {});
  const tudo = new Uint8Array(Math.min(total, limite));
  let pos = 0;
  for (const p of partes) {
    const pedaco = p.subarray(0, Math.max(0, tudo.length - pos));
    tudo.set(pedaco, pos);
    pos += pedaco.length;
  }
  return tudo;
}

// API oficial de prévia (YouTube, Spotify, Vimeo)
async function viaOembed(endpoint: string): Promise<PreviaLink | null> {
  const res = await fetch(endpoint, { signal: AbortSignal.timeout(5000), headers: { accept: "application/json" } });
  if (!res.ok) return null;
  return previaDeOembed(JSON.parse(new TextDecoder().decode(await lerAte(res, 100_000))));
}

// Nunca lança: sem prévia, o plano é salvo do mesmo jeito
export async function buscarPrevia(link: string): Promise<PreviaLink | null> {
  try {
    const oembed = oembedDe(link);
    if (oembed) return await viaOembed(oembed);
    let url = new URL(link);
    for (let i = 0; i <= MAX_REDIRECIONAMENTOS; i++) {
      if (!(await enderecoPublico(url))) return null;
      const res = await fetch(url, {
        redirect: "manual",
        signal: AbortSignal.timeout(5000),
        headers: {
          "user-agent": "Mozilla/5.0 (compatible; NossoEspaco/1.0; +https://our-space-black.vercel.app)",
          accept: "text/html,application/xhtml+xml",
          "accept-language": "pt-BR,pt;q=0.9,en;q=0.6",
        },
      });
      if (res.status >= 300 && res.status < 400) {
        const destino = res.headers.get("location");
        if (!destino) return null;
        url = new URL(destino, url);
        continue;
      }
      const tipo = res.headers.get("content-type") ?? "";
      if (!res.ok || !/html/i.test(tipo)) return null;
      const html = new TextDecoder(charsetDe(tipo)).decode(await lerAte(res, LIMITE_BYTES));
      const previa = extrairPrevia(html, url.href);
      return previa.titulo || previa.imagem ? previa : null;
    }
    return null;
  } catch {
    return null;
  }
}
