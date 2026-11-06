// Mural: tudo do casal num lugar só, com busca e filtros. Sem imports: testado com node --test.

export interface ItemMural {
  id: string; // id do plano
  href: string;
  titulo: string;
  temaId: string;
  temaNome: string;
  temaIcone: string;
  temaIndice: number; // para o tom pastel do tema
  situacao: "vamos_fazer" | "ja_fizemos";
  tipo: string | null;
  site: string | null;
  imagem: string | null; // capa da página do link
  lugar: string | null;
  temLugar: boolean;
  criadoEm: string;
  feitoEm: string | null;
  memoria: { id: string; frase: string | null; data: string; capa: string | null; qtdFotos: number } | null;
  busca: string; // texto normalizado para a busca
}

export interface FiltroMural {
  texto: string;
  situacao: "tudo" | "vamos_fazer" | "ja_fizemos";
  tema: string | null;
  comFoto: boolean;
  ordem: "recentes" | "antigos" | "az";
}

export const FILTRO_INICIAL: FiltroMural = { texto: "", situacao: "tudo", tema: null, comFoto: false, ordem: "recentes" };

// Minúsculas e sem acento: "Café" encontra "cafe"
export function normalizar(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

export function textoDeBusca(partes: (string | null | undefined)[]): string {
  return normalizar(partes.filter(Boolean).join(" · "));
}

// Data que conta para ordenar: quando fizeram (ou a da memória), senão quando guardaram
export const dataDoItem = (i: Pick<ItemMural, "criadoEm" | "feitoEm" | "memoria">) => i.memoria?.data ?? i.feitoEm ?? i.criadoEm;

export function filtrarMural(itens: ItemMural[], f: FiltroMural): ItemMural[] {
  const termos = normalizar(f.texto).split(/\s+/).filter(Boolean);
  const r = itens.filter(
    (i) =>
      (f.situacao === "tudo" || i.situacao === f.situacao) &&
      (!f.tema || i.temaId === f.tema) &&
      (!f.comFoto || !!i.memoria?.capa || !!i.imagem) &&
      termos.every((t) => i.busca.includes(t)),
  );
  return r.sort((a, b) =>
    f.ordem === "az"
      ? a.titulo.localeCompare(b.titulo, "pt-BR")
      : f.ordem === "antigos"
        ? dataDoItem(a).localeCompare(dataDoItem(b))
        : dataDoItem(b).localeCompare(dataDoItem(a)),
  );
}

// Como o cartão aparece no mural
export type JeitoCartao = "polaroid" | "capa" | "bilhete" | "feito";
export function jeitoDoCartao(i: Pick<ItemMural, "memoria" | "imagem" | "situacao">): JeitoCartao {
  if (i.memoria?.capa) return "polaroid";
  if (i.imagem) return "capa";
  return i.situacao === "ja_fizemos" ? "feito" : "bilhete";
}

// Inclinação leve e estável de cada bilhete (mesmo id, mesma inclinação)
export function inclinacao(id: string): number {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) | 0;
  return ((Math.abs(h) % 7) - 3) * 0.8; // -2.4° a 2.4°
}

// Trechos do texto com a busca destacada
export function destacar(texto: string, busca: string): { t: string; marca: boolean }[] {
  const termos = normalizar(busca).split(/\s+/).filter((t) => t.length > 1);
  if (!termos.length) return [{ t: texto, marca: false }];
  const base = normalizar(texto);
  const marcas = new Array(texto.length).fill(false);
  for (const termo of termos) {
    let i = base.indexOf(termo);
    while (i >= 0) {
      for (let k = i; k < i + termo.length; k++) marcas[k] = true;
      i = base.indexOf(termo, i + termo.length);
    }
  }
  const partes: { t: string; marca: boolean }[] = [];
  for (let i = 0; i < texto.length; i++) {
    const ultimo = partes[partes.length - 1];
    if (ultimo && ultimo.marca === marcas[i]) ultimo.t += texto[i];
    else partes.push({ t: texto[i], marca: marcas[i] });
  }
  return partes;
}
