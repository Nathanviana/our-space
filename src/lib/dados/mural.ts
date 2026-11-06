import "server-only";
import { BUCKET_FOTOS, db } from "@/lib/db";
import { caminhoMini } from "@/lib/dados/memorias";
import { textoDeBusca, type ItemMural } from "@/lib/mural";
import { TIPOS_PLANO, tituloDoPlano, type Tema } from "@/lib/types";

interface LinhaFotoMural {
  caminho: string;
  tirada_em: string | null;
  enviada_em: string;
}

interface LinhaMural {
  id: string;
  tema_id: string;
  titulo: string | null;
  tipo: string | null;
  link: string | null;
  previa_titulo: string | null;
  previa_imagem: string | null;
  previa_site: string | null;
  situacao: "vamos_fazer" | "ja_fizemos";
  feito_em: string | null;
  lugar_nome: string | null;
  latitude: number | null;
  criado_em: string;
  memorias:
    | { id: string; frase: string | null; data: string; lugar_nome: string | null; latitude: number | null; fotos: LinhaFotoMural[] }
    | { id: string; frase: string | null; data: string; lugar_nome: string | null; latitude: number | null; fotos: LinhaFotoMural[] }[]
    | null;
}

// Tudo do casal para o mural: cada plano vira um cartão (com a memória, quando já fizeram)
export async function itensDoMural(temas: Tema[]): Promise<ItemMural[]> {
  const { data, error } = await db()
    .from("planos")
    .select(
      "id, tema_id, titulo, tipo, link, previa_titulo, previa_imagem, previa_site, situacao, feito_em, lugar_nome, latitude, criado_em, memorias(id, frase, data, lugar_nome, latitude, fotos(caminho, tirada_em, enviada_em))",
    )
    .order("criado_em", { ascending: false })
    .limit(1000);
  if (error) throw error;
  const linhas = (data ?? []) as unknown as LinhaMural[];

  // Capa da memória: a primeira foto (pela data em que foi tirada)
  const capas = new Map<string, string>();
  const caminhos: string[] = [];
  for (const l of linhas) {
    const m = Array.isArray(l.memorias) ? l.memorias[0] : l.memorias;
    const primeira = [...(m?.fotos ?? [])].sort((a, b) => (a.tirada_em ?? a.enviada_em).localeCompare(b.tirada_em ?? b.enviada_em))[0];
    if (m && primeira) {
      capas.set(m.id, caminhoMini(primeira.caminho));
      caminhos.push(caminhoMini(primeira.caminho));
    }
  }
  const urls = new Map<string, string>();
  for (let i = 0; i < caminhos.length; i += 100) {
    const { data: assinadas } = await db().storage.from(BUCKET_FOTOS).createSignedUrls(caminhos.slice(i, i + 100), 60 * 60);
    for (const a of assinadas ?? []) if (a.path && a.signedUrl) urls.set(a.path, a.signedUrl);
  }

  return linhas.map((l) => {
    const indice = Math.max(0, temas.findIndex((t) => t.id === l.tema_id));
    const tema = temas[indice];
    const m = Array.isArray(l.memorias) ? l.memorias[0] : l.memorias;
    const titulo = tituloDoPlano(l);
    const lugar = m?.lugar_nome ?? l.lugar_nome;
    const tipo = TIPOS_PLANO.find((t) => t.valor === l.tipo)?.rotulo ?? null;
    return {
      id: l.id,
      href: m ? `/memorias/${m.id}` : `/planos/${l.id}`,
      titulo,
      temaId: l.tema_id,
      temaNome: tema?.nome ?? "",
      temaIcone: tema?.icone ?? "•",
      temaIndice: indice,
      situacao: l.situacao,
      tipo,
      site: l.previa_site,
      imagem: l.previa_imagem,
      lugar,
      temLugar: l.latitude !== null || (m?.latitude ?? null) !== null,
      criadoEm: l.criado_em,
      feitoEm: l.feito_em,
      memoria: m
        ? { id: m.id, frase: m.frase, data: m.data, capa: urls.get(capas.get(m.id) ?? "") ?? null, qtdFotos: m.fotos?.length ?? 0 }
        : null,
      busca: textoDeBusca([titulo, l.previa_titulo, l.previa_site, tema?.nome, tipo, lugar, m?.frase, l.link]),
    };
  });
}
