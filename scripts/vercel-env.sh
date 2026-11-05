#!/usr/bin/env bash
# Envia as variáveis do .env.local para o ambiente de produção da Vercel,
# sem mostrar os valores na tela. Uso: npm run vercel-env
set -euo pipefail
cd "$(dirname "$0")/.."

[ -f .env.local ] || { echo "Arquivo .env.local não encontrado."; exit 1; }
[ -d .vercel ] || { echo "Projeto ainda não ligado à Vercel. Rode antes: npx vercel link"; exit 1; }

for nome in SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY JWT_SECRET; do
  valor=$(grep -E "^${nome}=" .env.local | head -1 | cut -d= -f2-)
  [ -n "$valor" ] || { echo "Falta ${nome} no .env.local."; exit 1; }
  npx vercel env rm "$nome" production --yes >/dev/null 2>&1 || true
  printf '%s' "$valor" | npx vercel env add "$nome" production >/dev/null
  echo "ok: ${nome}"
done
echo "Variáveis enviadas para produção."
