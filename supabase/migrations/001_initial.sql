create extension if not exists pgcrypto;

create table if not exists public.projetos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  arquivo_nome text,
  itens jsonb not null default '[]'::jsonb,
  cronograma jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_projetos_user_updated_at
  on public.projetos (user_id, updated_at desc);

alter table public.projetos enable row level security;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_projetos_updated_at on public.projetos;
create trigger trg_projetos_updated_at
before update on public.projetos
for each row
execute function public.set_updated_at();

drop policy if exists "Projetos: select own" on public.projetos;
create policy "Projetos: select own"
on public.projetos
for select
using (auth.uid() = user_id);

drop policy if exists "Projetos: insert own" on public.projetos;
create policy "Projetos: insert own"
on public.projetos
for insert
with check (auth.uid() = user_id);

drop policy if exists "Projetos: update own" on public.projetos;
create policy "Projetos: update own"
on public.projetos
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Projetos: delete own" on public.projetos;
create policy "Projetos: delete own"
on public.projetos
for delete
using (auth.uid() = user_id);
