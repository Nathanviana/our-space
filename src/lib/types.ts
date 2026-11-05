// Entidades do PRD v3, seção 7.1

export type TipoPlano = "filme" | "lugar" | "receita" | "programa";
export type SituacaoPlano = "vamos_fazer" | "ja_fizemos";

export interface Lugar {
  nome: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface Tema {
  id: string;
  nome: string;
  icone: string;
  padrao: boolean;
}

export interface Plano {
  id: string;
  temaId: string;
  titulo: string | null;
  tipo: TipoPlano | null;
  link: string | null;
  situacao: SituacaoPlano;
  feitoEm: string | null;
  lugar: Lugar;
  criadoPor: string | null;
  criadoEm: string;
  memoriaId: string | null;
}

export interface Foto {
  id: string;
  memoriaId: string;
  caminho: string;
  url: string;
  latitude: number | null;
  longitude: number | null;
  tiradaEm: string | null;
  enviadaEm: string;
}

export interface Memoria {
  id: string;
  planoId: string;
  frase: string | null;
  musicaLink: string | null;
  lugar: Lugar;
  data: string;
  registradaPor: string | null;
  fotos: Foto[];
}

export const TIPOS_PLANO: { valor: TipoPlano; rotulo: string }[] = [
  { valor: "filme", rotulo: "Filme" },
  { valor: "lugar", rotulo: "Lugar" },
  { valor: "receita", rotulo: "Receita" },
  { valor: "programa", rotulo: "Programa" },
];

// Título exibido: o título, ou o endereço do link quando o plano foi criado só com o link (REQ-03)
export function tituloDoPlano(p: Pick<Plano, "titulo" | "link">): string {
  if (p.titulo) return p.titulo;
  if (p.link) {
    try {
      return new URL(p.link).hostname.replace(/^www\./, "");
    } catch {
      return p.link;
    }
  }
  return "Plano sem título";
}

export function formatarData(iso: string | null): string {
  if (!iso) return "";
  const [a, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(a, m - 1, d).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
}
