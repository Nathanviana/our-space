// Prévia de link (título, imagem e site) a partir do HTML da página. Sem imports: testado com node --test.

export interface PreviaLink {
  titulo: string | null;
  imagem: string | null;
  site: string | null;
}

const ENTIDADES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", "#39": "'" };

export function decodificar(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+|#39);/gi, (m, n) => ENTIDADES[n.toLowerCase()] ?? m)
    .replace(/\s+/g, " ")
    .trim();
}

function atributos(tag: string): Record<string, string> {
  const r: Record<string, string> = {};
  for (const m of tag.matchAll(/([a-z][\w:-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/gi)) {
    r[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? "";
  }
  return r;
}

function urlAbsoluta(valor: string | undefined, base: string): string | null {
  if (!valor) return null;
  try {
    const u = new URL(decodificar(valor), base);
    return (u.protocol === "https:" || u.protocol === "http:") && u.href.length <= 1000 ? u.href : null;
  } catch {
    return null;
  }
}

const cortar = (s: string | null | undefined, n: number) => (s ? decodificar(s).slice(0, n) || null : null);

export function extrairPrevia(html: string, base: string): PreviaLink {
  const cabeca = html.slice(0, 300_000);
  const meta: Record<string, string> = {};
  for (const m of cabeca.matchAll(/<meta\b[^>]*>/gi)) {
    const a = atributos(m[0]);
    const nome = (a.property ?? a.name ?? "").toLowerCase();
    if (nome && a.content !== undefined && !(nome in meta)) meta[nome] = a.content;
  }
  const tagTitulo = cabeca.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  let site: string | null = cortar(meta["og:site_name"], 80);
  if (!site) {
    try {
      site = new URL(base).hostname.replace(/^www\./, "");
    } catch {
      site = null;
    }
  }
  return {
    titulo: cortar(meta["og:title"] ?? meta["twitter:title"] ?? tagTitulo, 200),
    imagem: urlAbsoluta(meta["og:image:secure_url"] ?? meta["og:image"] ?? meta["twitter:image"] ?? meta["twitter:image:src"], base),
    site,
  };
}

// Endereço IP de rede interna (bloqueado para a busca da prévia não acessar a rede do servidor)
export function ipPrivado(ip: string): boolean {
  const v4 = ip.startsWith("::ffff:") ? ip.slice(7) : ip;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(v4)) {
    const [a, b] = v4.split(".").map(Number);
    return (
      a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19))
    );
  }
  const s = ip.toLowerCase();
  return s === "::" || s === "::1" || /^f[cd]/.test(s) || /^fe[89ab]/.test(s);
}

// Valores vindos do formulário (prévia já buscada no navegador): só aceita o que tem forma válida
export function limparPrevia(titulo: string, imagem: string, site: string): PreviaLink {
  return {
    titulo: titulo.trim().slice(0, 200) || null,
    imagem: /^https?:\/\//i.test(imagem) && imagem.length <= 1000 ? imagem : null,
    site: site.trim().slice(0, 80) || null,
  };
}

// Sites que bloqueiam leitura da página mas oferecem a API oficial de prévia (oEmbed)
export function oembedDe(link: string): string | null {
  let u: URL;
  try {
    u = new URL(link);
  } catch {
    return null;
  }
  const h = u.hostname.replace(/^(www|m|music)\./, "");
  const alvo = encodeURIComponent(u.href);
  if (h === "youtube.com" || h === "youtu.be") return `https://www.youtube.com/oembed?format=json&url=${alvo}`;
  if (h === "open.spotify.com") return `https://open.spotify.com/oembed?url=${alvo}`;
  if (h === "vimeo.com") return `https://vimeo.com/api/oembed.json?url=${alvo}`;
  return null;
}

export function previaDeOembed(dados: unknown): PreviaLink | null {
  if (!dados || typeof dados !== "object") return null;
  const d = dados as Record<string, unknown>;
  const texto = (v: unknown, n: number) => (typeof v === "string" && v.trim() ? v.trim().slice(0, n) : null);
  const imagem = texto(d.thumbnail_url, 1000);
  const p = {
    titulo: texto(d.title, 200),
    imagem: imagem && /^https?:\/\//i.test(imagem) ? imagem : null,
    site: texto(d.provider_name, 80),
  };
  return p.titulo || p.imagem ? p : null;
}
