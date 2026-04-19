-- supabase/migrations/004_equipes.sql
-- Tabela de equipes/empresas para compartilhamento de De-Para

create table if not exists public.equipes (
  id          uuid    primary key default gen_random_uuid(),
  codigo      text    not null unique,   -- código de acesso (slug)
  nome        text    not null,
  criador_id  uuid    not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- Membros de cada equipe
create table if not exists public.equipe_membros (
  id          uuid    primary key default gen_random_uuid(),
  equipe_id   uuid    not null references public.equipes(id) on delete cascade,
  user_id     uuid    not null references auth.users(id) on delete cascade,
  papel       text    not null default 'membro',  -- 'admin' | 'membro'
  joined_at   timestamptz not null default now(),
  unique (equipe_id, user_id)
);

create index if not exists idx_equipe_membros_user on public.equipe_membros (user_id);

-- Coluna equipe_id opcional em depara_custom (NULL = pessoal, UUID = equipe)
alter table public.depara_custom
  add column if not exists equipe_id uuid references public.equipes(id) on delete cascade;

create index if not exists idx_depara_custom_equipe
  on public.depara_custom (equipe_id, categoria_normalizada)
  where equipe_id is not null;

-- RLS para equipes
alter table public.equipes enable row level security;
alter table public.equipe_membros enable row level security;

drop policy if exists "Equipes: select member" on public.equipes;
create policy "Equipes: select member"
  on public.equipes for select
  using (
    criador_id = auth.uid() or
    exists (select 1 from public.equipe_membros m where m.equipe_id = id and m.user_id = auth.uid())
  );

drop policy if exists "Equipes: insert own" on public.equipes;
create policy "Equipes: insert own"
  on public.equipes for insert
  with check (criador_id = auth.uid());

drop policy if exists "Equipes: update admin" on public.equipes;
create policy "Equipes: update admin"
  on public.equipes for update
  using (criador_id = auth.uid())
  with check (criador_id = auth.uid());

drop policy if exists "Membros: select own" on public.equipe_membros;
create policy "Membros: select own"
  on public.equipe_membros for select
  using (user_id = auth.uid() or
    exists (select 1 from public.equipes e where e.id = equipe_id and e.criador_id = auth.uid()));

drop policy if exists "Membros: insert self" on public.equipe_membros;
create policy "Membros: insert self"
  on public.equipe_membros for insert
  with check (user_id = auth.uid());

drop policy if exists "Membros: delete self" on public.equipe_membros;
create policy "Membros: delete self"
  on public.equipe_membros for delete
  using (user_id = auth.uid() or
    exists (select 1 from public.equipes e where e.id = equipe_id and e.criador_id = auth.uid()));

-- De-Para da equipe visível a todos os membros
drop policy if exists "DePara equipe: select member" on public.depara_custom;
create policy "DePara equipe: select member"
  on public.depara_custom for select
  using (
    auth.uid() = user_id
    or (
      equipe_id is not null and
      exists (select 1 from public.equipe_membros m where m.equipe_id = depara_custom.equipe_id and m.user_id = auth.uid())
    )
  );
