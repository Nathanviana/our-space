"use server";

import { exigirSessao } from "@/lib/auth";
import { descobrirCidades } from "@/lib/dados/conquistas";

// Chamado pela tela até não sobrar região sem cidade
export async function continuarDescobrindo(): Promise<{ restam: number }> {
  await exigirSessao();
  return { restam: await descobrirCidades(5) };
}
