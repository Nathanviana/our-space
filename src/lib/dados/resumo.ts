import "server-only";
import { db } from "@/lib/db";

export interface Resumo {
  dataAmizade: string | null;
  dataNamoro: string | null;
  vamosFazer: number;
  jaFizemos: number;
  memorias: number;
  fotos: number;
  lugares: number;
}

// REQ-13 e REQ-14: datas do casal e números do espaço
export async function resumoDoEspaco(): Promise<Resumo> {
  const c = db();
  const total = async (tabela: string, campo?: [string, string]) => {
    let q = c.from(tabela).select("id", { count: "exact", head: true });
    if (campo) q = q.eq(campo[0], campo[1]);
    const { count, error } = await q;
    if (error) throw error;
    return count ?? 0;
  };

  const [espaco, vamosFazer, jaFizemos, memorias, fotos, lugaresPlanos, lugaresMemorias] = await Promise.all([
    c.from("espaco").select("data_amizade, data_namoro").eq("id", 1).maybeSingle(),
    total("planos", ["situacao", "vamos_fazer"]),
    total("planos", ["situacao", "ja_fizemos"]),
    total("memorias"),
    total("fotos"),
    c.from("planos").select("latitude, longitude").not("latitude", "is", null),
    c.from("memorias").select("latitude, longitude").not("latitude", "is", null),
  ]);

  // Lugares distintos (arredondados para ~100 m)
  const chaves = new Set(
    [...(lugaresPlanos.data ?? []), ...(lugaresMemorias.data ?? [])].map(
      (l) => `${Number(l.latitude).toFixed(3)},${Number(l.longitude).toFixed(3)}`,
    ),
  );

  return {
    dataAmizade: espaco.data?.data_amizade ?? null,
    dataNamoro: espaco.data?.data_namoro ?? null,
    vamosFazer,
    jaFizemos,
    memorias,
    fotos,
    lugares: chaves.size,
  };
}
