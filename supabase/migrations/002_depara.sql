create table if not exists public.depara_custom (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  categoria text not null,
  categoria_normalizada text not null,
  codigo_sinapi text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, categoria_normalizada)
);

create index if not exists idx_depara_custom_user_updated_at
  on public.depara_custom (user_id, updated_at desc);

alter table public.depara_custom enable row level security;

drop trigger if exists trg_depara_custom_updated_at on public.depara_custom;
create trigger trg_depara_custom_updated_at
before update on public.depara_custom
for each row
execute function public.set_updated_at();

drop policy if exists "DePara: select own" on public.depara_custom;
create policy "DePara: select own"
on public.depara_custom
for select
using (auth.uid() = user_id);

drop policy if exists "DePara: insert own" on public.depara_custom;
create policy "DePara: insert own"
on public.depara_custom
for insert
with check (auth.uid() = user_id);

drop policy if exists "DePara: update own" on public.depara_custom;
create policy "DePara: update own"
on public.depara_custom
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "DePara: delete own" on public.depara_custom;
create policy "DePara: delete own"
on public.depara_custom
for delete
using (auth.uid() = user_id);
