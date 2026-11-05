"use server";

import { revalidatePath } from "next/cache";
import { exigirSessao } from "@/lib/auth";
import { BUCKET_FOTOS, db } from "@/lib/db";
import { dadosInfra } from "@/lib/dados/admin";
import { LIMITE_LOTE, confirmacaoOk } from "@/lib/admin/lote";

// Spec 5.4: apaga arquivos do bucket que não pertencem a nenhuma foto do banco.
// Recalcula as órfãs no servidor e só apaga o que continua órfão.
export async function apagarOrfas(caminhos: string[], confirmacao: string): Promise<{ erro?: string; ok?: string }> {
  await exigirSessao();
  if (!confirmacaoOk(confirmacao)) return { erro: "Digite apagar para confirmar." };
  const pedidos = Array.isArray(caminhos) ? [...new Set(caminhos.map(String))] : [];
  if (!pedidos.length) return { erro: "Nenhum arquivo para apagar." };
  if (pedidos.length > LIMITE_LOTE) return { erro: `No máximo ${LIMITE_LOTE} arquivos por vez.` };

  const infra = await dadosInfra();
  if (infra.pendente) return { erro: "Falta aplicar a migração da área de admin no banco." };
  const orfas = new Set(infra.orfas);
  const alvo = pedidos.filter((c) => orfas.has(c));
  if (!alvo.length) return { ok: "Nada a apagar: esses arquivos já não estão órfãos." };

  const { error } = await db().storage.from(BUCKET_FOTOS).remove(alvo);
  if (error) return { erro: "Não consegui apagar os arquivos do armazenamento." };
  revalidatePath("/admin/infra");
  return { ok: `${alvo.length} arquivo(s) órfão(s) apagado(s).` };
}
