-- Nosso Espaço · prévia de link nos planos e limite de tentativas de senha

-- Prévia do link (título, imagem e site), buscada ao salvar o plano.
alter table public.planos
  add column if not exists previa_titulo text check (length(previa_titulo) <= 200),
  add column if not exists previa_imagem text check (length(previa_imagem) <= 1000),
  add column if not exists previa_site text check (length(previa_site) <= 80);

-- Tentativas de senha por e-mail ("email:...") e por IP ("ip:...").
create table if not exists public.tentativas_login (
  chave text primary key check (length(chave) <= 300),
  falhas smallint not null default 0,
  janela_inicio timestamptz,
  bloqueado_ate timestamptz
);

alter table public.tentativas_login enable row level security;
revoke all on public.tentativas_login from anon, authenticated;
