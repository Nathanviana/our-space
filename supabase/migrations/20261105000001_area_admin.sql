-- Nosso Espaço · área de admin (docs/superpowers/specs/2026-11-05-area-admin-design.md)

-- 5.2: a troca de senha grava now() aqui e derruba os JWT emitidos antes.
-- Valor antigo nas linhas existentes para que aplicar a migração não desconecte ninguém.
alter table public.usuarios
  add column if not exists sessao_desde timestamptz not null default '1970-01-01';

-- 5.4: números de infra lidos de dentro do banco. Só a chave de serviço pode chamar.
create or replace function public.admin_infra()
returns jsonb
language sql
stable
security definer
set search_path = public, storage, pg_catalog
as $$
  select jsonb_build_object(
    'banco_bytes', pg_database_size(current_database()),
    'fotos_bytes', coalesce((select sum((o.metadata->>'size')::bigint) from storage.objects o where o.bucket_id = 'fotos'), 0),
    'fotos_arquivos', (select count(*) from storage.objects o where o.bucket_id = 'fotos'),
    -- candidatos a órfão: só arquivos com mais de 10 minutos, para não pegar uma foto no meio do envio
    'objetos', coalesce((select jsonb_agg(o.name) from storage.objects o
                         where o.bucket_id = 'fotos' and o.created_at < now() - interval '10 minutes'), '[]'::jsonb),
    'tabelas', jsonb_build_object(
      'usuarios', (select count(*) from public.usuarios),
      'espaco', (select count(*) from public.espaco),
      'temas', (select count(*) from public.temas),
      'planos', (select count(*) from public.planos),
      'memorias', (select count(*) from public.memorias),
      'fotos', (select count(*) from public.fotos),
      'sorteios', (select count(*) from public.sorteios)
    )
  );
$$;

revoke all on function public.admin_infra() from public, anon, authenticated;
grant execute on function public.admin_infra() to service_role;
