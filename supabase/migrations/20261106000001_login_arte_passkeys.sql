-- Nosso Espaço · arte da tela de login e entrada com passkey (Face ID / digital)

-- Arte do login escolhida no admin: o coração 3D ou polaroids com fotos do casal.
create table if not exists public.login_config (
  id smallint primary key default 1 check (id = 1),
  modo text not null default 'coracao' check (modo in ('coracao', 'polaroids')),
  atualizado_em timestamptz not null default now()
);
insert into public.login_config (id) values (1) on conflict (id) do nothing;

-- Fotos das polaroids (até 5, na ordem escolhida). Apagar a foto tira ela do login.
create table if not exists public.login_fotos (
  foto_id uuid primary key references public.fotos (id) on delete cascade,
  ordem smallint not null check (ordem between 0 and 4)
);

-- Passkeys (WebAuthn): uma por aparelho. Só a chave pública fica aqui.
create table if not exists public.passkeys (
  id text primary key,                                   -- credential id (base64url)
  usuario_id uuid not null references public.usuarios (id) on delete cascade,
  chave_publica text not null,                           -- chave pública COSE em base64url
  contador bigint not null default 0,
  transportes text[] not null default '{}',
  aparelho text not null default 'Aparelho',
  criado_em timestamptz not null default now(),
  usado_em timestamptz
);
create index if not exists passkeys_usuario on public.passkeys (usuario_id);

-- Mesma regra das outras tabelas: RLS sem políticas, acesso só pela chave de serviço.
alter table public.login_config enable row level security;
alter table public.login_fotos enable row level security;
alter table public.passkeys enable row level security;
revoke all on public.login_config, public.login_fotos, public.passkeys from anon, authenticated;
