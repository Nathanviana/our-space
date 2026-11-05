-- Nosso Espaço · estrutura inicial (PRD v3, seções 7.1 e 7.4)
-- Acesso só pelo servidor da aplicação (chave de serviço). RLS ativada sem políticas públicas.

create table public.usuarios (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text not null unique,
  senha_hash text not null,
  criado_em timestamptz not null default now()
);

create table public.espaco (
  id smallint primary key default 1 check (id = 1),
  data_amizade date not null,
  data_namoro date not null
);

create table public.temas (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (length(trim(nome)) > 0),
  icone text not null default '✦',
  padrao boolean not null default false,
  criado_em timestamptz not null default now()
);

create table public.planos (
  id uuid primary key default gen_random_uuid(),
  tema_id uuid not null references public.temas (id) on delete restrict,
  titulo text,
  tipo text check (tipo in ('filme', 'lugar', 'receita', 'programa')),
  link text,
  situacao text not null default 'vamos_fazer' check (situacao in ('vamos_fazer', 'ja_fizemos')),
  feito_em date,
  lugar_nome text,
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  criado_por uuid references public.usuarios (id) on delete set null,
  criado_em timestamptz not null default now(),
  constraint plano_titulo_ou_link check (coalesce(trim(titulo), '') <> '' or coalesce(trim(link), '') <> ''),
  constraint plano_feito_com_data check ((situacao = 'ja_fizemos') = (feito_em is not null))
);

create table public.memorias (
  id uuid primary key default gen_random_uuid(),
  plano_id uuid not null unique references public.planos (id) on delete cascade,
  frase text check (length(frase) <= 280),
  musica_link text,
  lugar_nome text,
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  data date not null default current_date,
  registrada_por uuid references public.usuarios (id) on delete set null,
  criado_em timestamptz not null default now()
);

create table public.fotos (
  id uuid primary key default gen_random_uuid(),
  memoria_id uuid not null references public.memorias (id) on delete cascade,
  caminho text not null unique,
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  tirada_em timestamptz,
  enviada_por uuid references public.usuarios (id) on delete set null,
  enviada_em timestamptz not null default now()
);

create table public.sorteios (
  id uuid primary key default gen_random_uuid(),
  plano_id uuid not null references public.planos (id) on delete cascade,
  tema_id uuid references public.temas (id) on delete set null,
  sorteado_por uuid references public.usuarios (id) on delete set null,
  data timestamptz not null default now()
);

create index planos_tema_situacao on public.planos (tema_id, situacao);
create index fotos_memoria on public.fotos (memoria_id);
create index fotos_enviada_em on public.fotos (enviada_em desc);
create index sorteios_plano on public.sorteios (plano_id);

-- RLS ativada em todas as tabelas, sem nenhuma política: bloqueia anon e authenticated.
alter table public.usuarios enable row level security;
alter table public.espaco enable row level security;
alter table public.temas enable row level security;
alter table public.planos enable row level security;
alter table public.memorias enable row level security;
alter table public.fotos enable row level security;
alter table public.sorteios enable row level security;

revoke all on all tables in schema public from anon, authenticated;

-- Temas padrão (REQ-10, C11)
insert into public.temas (nome, icone, padrao) values
  ('Passeios', '🌿', true),
  ('Viagens', '✈️', true),
  ('Brincadeiras', '🎲', true),
  ('Filmes e séries', '🎬', true),
  ('Cozinhar', '🍝', true),
  ('Praia', '🌊', true),
  ('Comer fora', '🍣', true);

-- Bucket privado das fotos (RNF-02)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
