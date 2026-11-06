// Mapa de conquistas: cidades, estados e países visitados. Sem imports: testado com node --test.

export interface LugarGeo {
  cidade: string | null;
  estado: string | null;
  uf: string | null; // "SP" (de ISO3166-2 "BR-SP")
  pais: string | null;
  codigoPais: string | null; // "br"
}

// Pontos a ~1 km viram a mesma chave: menos consultas de endereço
export function chaveGeo(lat: number, lng: number): string {
  return `${lat.toFixed(2)},${lng.toFixed(2)}`;
}

// Resposta do Nominatim (reverse, zoom 10) -> cidade, estado e país
export function lerEndereco(dados: unknown): LugarGeo {
  const a = ((dados as { address?: Record<string, string> })?.address ?? {}) as Record<string, string>;
  const iso = a["ISO3166-2-lvl4"] ?? a["ISO3166-2-lvl3"] ?? "";
  return {
    cidade: a.city ?? a.town ?? a.village ?? a.municipality ?? a.city_district ?? a.county ?? null,
    estado: a.state ?? a.region ?? null,
    uf: iso.includes("-") ? iso.split("-")[1] : null,
    pais: a.country ?? null,
    codigoPais: a.country_code?.toLowerCase() ?? null,
  };
}

export function bandeira(codigo: string | null): string {
  if (!codigo || !/^[a-z]{2}$/i.test(codigo)) return "🏳️";
  return String.fromCodePoint(...[...codigo.toUpperCase()].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

export interface Conquistas {
  cidades: { nome: string; uf: string | null; codigoPais: string | null; vezes: number }[];
  estados: { nome: string; uf: string | null; codigoPais: string | null; cidades: number }[];
  paises: { nome: string; codigoPais: string | null; cidades: number }[];
}

// vezes: quantos pontos (planos, memórias, fotos) caíram em cada cidade
export function resumirConquistas(lugares: LugarGeo[]): Conquistas {
  const cidades = new Map<string, Conquistas["cidades"][number] & { estado: string | null; pais: string | null }>();
  for (const l of lugares) {
    if (!l.cidade) continue;
    const k = `${l.cidade}|${l.estado ?? ""}|${l.codigoPais ?? ""}`;
    const c = cidades.get(k);
    if (c) c.vezes++;
    else cidades.set(k, { nome: l.cidade, uf: l.uf, codigoPais: l.codigoPais, vezes: 1, estado: l.estado, pais: l.pais });
  }
  const estados = new Map<string, Conquistas["estados"][number]>();
  const paises = new Map<string, Conquistas["paises"][number]>();
  for (const c of cidades.values()) {
    if (c.estado) {
      const k = `${c.estado}|${c.codigoPais ?? ""}`;
      const e = estados.get(k) ?? { nome: c.estado, uf: c.uf, codigoPais: c.codigoPais, cidades: 0 };
      e.cidades++;
      estados.set(k, e);
    }
    if (c.pais) {
      const p = paises.get(c.pais) ?? { nome: c.pais, codigoPais: c.codigoPais, cidades: 0 };
      p.cidades++;
      paises.set(c.pais, p);
    }
  }
  const porQtd = <T extends { nome: string }>(n: (x: T) => number) => (a: T, b: T) => n(b) - n(a) || a.nome.localeCompare(b.nome, "pt-BR");
  return {
    cidades: [...cidades.values()].map(({ nome, uf, codigoPais, vezes }) => ({ nome, uf, codigoPais, vezes })).sort(porQtd((x) => x.vezes)),
    estados: [...estados.values()].sort(porQtd((x) => x.cidades)),
    paises: [...paises.values()].sort(porQtd((x) => x.cidades)),
  };
}

const METAS = [1, 3, 5, 10, 15, 20, 25, 30, 40, 50, 75, 100, 150, 200];

// Próxima meta de cidades ("faltam 3 para 15")
export function proximaMeta(qtd: number): number {
  return METAS.find((m) => m > qtd) ?? Math.ceil((qtd + 1) / 50) * 50;
}
