"use server";

import { revalidatePath } from "next/cache";
import type { RegistrationResponseJSON } from "@simplewebauthn/server";
import { exigirSessao } from "@/lib/auth";
import { db } from "@/lib/db";
import { tabelaAusente } from "@/lib/admin/sessao";
import { validarArteLogin } from "@/lib/login-arte";
import { MSG_MIGRACAO, concluirCadastro, opcoesDeCadastro } from "@/lib/passkey";

export interface EstadoForm {
  erro?: string;
  ok?: string;
}

// Arte do login: coração ou polaroids com até 5 fotos, na ordem escolhida
export async function salvarArteLogin(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  await exigirSessao();
  const v = validarArteLogin(String(form.get("modo") ?? ""), String(form.get("fotos") ?? ""));
  if (v.erro || !v.modo || !v.ids) return { erro: v.erro };

  const c = db();
  const cfg = await c.from("login_config").upsert({ id: 1, modo: v.modo, atualizado_em: new Date().toISOString() });
  if (tabelaAusente(cfg.error?.code)) return { erro: "Falta aplicar a migração da arte do login no banco." };
  if (cfg.error) return { erro: "Não foi possível salvar." };
  // Polaroids: troca a lista inteira. Coração: mantém as fotos guardadas para a próxima troca.
  if (v.modo === "polaroids") {
    const apagar = await c.from("login_fotos").delete().gte("ordem", 0);
    if (apagar.error) return { erro: "Não foi possível salvar as fotos." };
    const inserir = await c.from("login_fotos").insert(v.ids.map((foto_id, ordem) => ({ foto_id, ordem })));
    if (inserir.error?.code === "23503") return { erro: "Uma das fotos foi apagada. Recarregue a página." };
    if (inserir.error) return { erro: "Não foi possível salvar as fotos." };
  }
  revalidatePath("/login");
  revalidatePath("/admin/login");
  return { ok: v.modo === "polaroids" ? "Pronto! As polaroids já aparecem no login." : "Pronto! O login voltou para o coração." };
}

// ——— Passkeys: cadastrar este aparelho e remover ———

export async function opcoesCadastroPasskey() {
  const sessao = await exigirSessao();
  const { data: eu } = await db().from("usuarios").select("id, nome, email").eq("id", sessao.sub).maybeSingle();
  if (!eu) return { erro: "Conta não encontrada." };
  try {
    return { opcoes: await opcoesDeCadastro(eu) };
  } catch (e) {
    return { erro: e instanceof Error && e.message === MSG_MIGRACAO ? MSG_MIGRACAO : "Não foi possível começar o cadastro." };
  }
}

export async function concluirCadastroPasskey(resposta: RegistrationResponseJSON) {
  const sessao = await exigirSessao();
  const r = await concluirCadastro(sessao.sub, resposta);
  if (r.ok) revalidatePath("/admin/login");
  return r;
}

export async function removerPasskey(id: string): Promise<EstadoForm> {
  await exigirSessao();
  if (!id || id.length > 512) return { erro: "Passkey inválida." };
  const { error } = await db().from("passkeys").delete().eq("id", id);
  if (error) return { erro: "Não foi possível remover." };
  revalidatePath("/admin/login");
  return { ok: "Removida." };
}
