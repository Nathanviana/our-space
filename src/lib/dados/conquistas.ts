// Mapa de conquistas: junta os pontos visitados e descobre cidade, estado e país de cada um.
import "server-only";
import { db } from "@/lib/db";
import { tabelaAusente } from "@/lib/admin/sessao";
import { chaveGeo, lerEndereco, resumirConquistas, type Conquistas, type LugarGeo } from "@/lib/conquistas";

const ok = (lat: unknown, lng: unknown) => typeof lat === "number" && typeof lng === "number";

// Cada plano feito, memória e foto com lugar conta um ponto (mesma chave = mesma região de ~1 km)
async function pontosVisitados(): Promise<string[]> {
  const c = db();
  const [planos, memorias, fotos] = await Promise.all([
    c.from("planos").select("latitude, longitude").eq("situacao", "ja_fizemos").not("latitude", "is", null),
    c.from("memorias").select("latitude, longitude").not("latitude", "is", null),
    c.from("fotos").select("latitude, longitude").not("latitude", "is", null),
  ]);
  if (planos.error || memorias.error || fotos.error) throw planos.error ?? memorias.error ?? fotos.error;
  return [...(planos.data ?? []), ...(memorias.data ?? []), ...(fotos.data ?? [])]
    .filter((p) => ok(p.latitude, p.longitude))
    .map((p) => chaveGeo(p.latitude, p.longitude));
}

interface LinhaGeo {
  chave: string;
  cidade: string | null;
  estado: string | null;
  uf: string | null;
  pais: string | null;
  codigo_pais: string | null;
}

async function cache(chaves: string[]): Promise<{ mapa: Map<string, LinhaGeo>; pendente: boolean }> {
  const mapa = new Map<string, LinhaGeo>();
  for (let i = 0; i < chaves.length; i += 200) {
    const { data, error } = await db().from("lugares_geo").select("chave, cidade, estado, uf, pais, codigo_pais").in("chave", chaves.slice(i, i + 200));
    if (tabelaAusente(error?.code)) return { mapa, pendente: true };
    if (error) throw error;
    for (const l of (data ?? []) as LinhaGeo[]) mapa.set(l.chave, l);
  }
  return { mapa, pendente: false };
}

export interface ConquistasDoCasal extends Conquistas {
  pontos: number;
  semEndereco: number; // regiões que ainda não foram consultadas
  migracaoPendente: boolean;
}

export async function conquistasDoCasal(): Promise<ConquistasDoCasal> {
  const pontos = await pontosVisitados();
  const unicas = [...new Set(pontos)];
  const { mapa, pendente } = await cache(unicas);
  const lugares: LugarGeo[] = pontos
    .map((k) => mapa.get(k))
    .filter((l): l is LinhaGeo => !!l)
    .map((l) => ({ cidade: l.cidade, estado: l.estado, uf: l.uf, pais: l.pais, codigoPais: l.codigo_pais }));
  return {
    ...resumirConquistas(lugares),
    pontos: pontos.length,
    semEndereco: unicas.filter((k) => !mapa.has(k)).length,
    migracaoPendente: pendente,
  };
}

const espera = (ms: number) => new Promise((ok) => setTimeout(ok, ms));

// Consulta até `max` regiões novas no OpenStreetMap (1 por segundo, como pede a política de uso) e guarda o resultado
export async function descobrirCidades(max = 5): Promise<number> {
  const unicas = [...new Set(await pontosVisitados())];
  const { mapa, pendente } = await cache(unicas);
  if (pendente) return 0;
  const faltam = unicas.filter((k) => !mapa.has(k));
  for (const [i, chave] of faltam.slice(0, max).entries()) {
    if (i > 0) await espera(1100);
    const [lat, lng] = chave.split(",");
    let geo: LugarGeo = { cidade: null, estado: null, uf: null, pais: null, codigoPais: null };
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=10&addressdetails=1&accept-language=pt-BR&lat=${lat}&lon=${lng}`,
        { headers: { "user-agent": "NossoEspaco/1.0 (+https://our-space-black.vercel.app)", accept: "application/json" }, signal: AbortSignal.timeout(6000) },
      );
      if (!r.ok) break; // limite do serviço: tenta de novo depois
      geo = lerEndereco(await r.json());
    } catch {
      break;
    }
    await db().from("lugares_geo").upsert({
      chave,
      cidade: geo.cidade,
      estado: geo.estado,
      uf: geo.uf,
      pais: geo.pais,
      codigo_pais: geo.codigoPais,
      atualizado_em: new Date().toISOString(),
    });
  }
  return Math.max(0, faltam.length - max);
}
