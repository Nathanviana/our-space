import { pontosDoMapa } from "@/lib/dados/mapa";
import { Mapa } from "./mapa";

// Tela Mapa (PRD v3 7.2, REQ-12)
export default async function MapaPage({ searchParams }: { searchParams: Promise<{ memoria?: string }> }) {
  const [{ memoria }, pontos] = await Promise.all([searchParams, pontosDoMapa()]);
  return <Mapa pontos={pontos} foco={memoria ?? null} />;
}
