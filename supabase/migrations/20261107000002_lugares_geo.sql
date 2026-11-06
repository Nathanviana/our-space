-- Nosso Espaço · mapa de conquistas: cidade, estado e país de cada ponto visitado (cache da busca reversa)

create table if not exists public.lugares_geo (
  chave text primary key check (length(chave) <= 40),   -- "lat,lng" com 2 casas (~1 km)
  cidade text,
  estado text,
  uf text,
  pais text,
  codigo_pais text,
  atualizado_em timestamptz not null default now()
);

alter table public.lugares_geo enable row level security;
revoke all on public.lugares_geo from anon, authenticated;
