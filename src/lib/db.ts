// Cliente do Supabase só no servidor, com a chave de serviço (PRD v3, 7.4).
import "server-only";
import { createClient } from "@supabase/supabase-js";

import type { SupabaseClient } from "@supabase/supabase-js";

let cliente: SupabaseClient | null = null;

// Criado na primeira chamada, para a build não exigir as chaves.
export function db(): SupabaseClient {
  if (cliente) return cliente;
  const url = process.env.SUPABASE_URL;
  const chaveServico = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chaveServico) {
    throw new Error("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar no .env.local.");
  }
  cliente = createClient(url, chaveServico, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cliente;
}

export const BUCKET_FOTOS = "fotos";
