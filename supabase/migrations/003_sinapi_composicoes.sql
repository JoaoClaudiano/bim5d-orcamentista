-- supabase/migrations/003_sinapi_composicoes.sql
-- Tabela de composições SINAPI por estado e mês de referência
-- Permite atualizar preços mensalmente sem redeploy da aplicação

create table if not exists public.sinapi_composicoes (
  id           uuid        primary key default gen_random_uuid(),
  codigo       text        not null,
  descricao    text        not null,
  unidade      text        not null,
  custo_total  numeric(12, 2) not null,
  mo           numeric(12, 2) not null,
  material     numeric(12, 2) not null,
  estado       char(2)     not null,
  referencia   text        not null,  -- ex: '2024-03'
  created_at   timestamptz not null default now()
);

-- Índice único para evitar duplicatas por código + estado + referência
create unique index if not exists uq_sinapi_codigo_estado_ref
  on public.sinapi_composicoes (codigo, estado, referencia);

-- Índice para filtros por estado + referência (query principal)
create index if not exists idx_sinapi_estado_ref
  on public.sinapi_composicoes (estado, referencia);

-- Habilita RLS (os dados SINAPI são públicos, mas a RLS protege contra writes não autorizados)
alter table public.sinapi_composicoes enable row level security;

-- Leitura pública — dados SINAPI são publicados pela CAIXA
drop policy if exists "SINAPI: leitura pública" on public.sinapi_composicoes;
create policy "SINAPI: leitura pública"
  on public.sinapi_composicoes
  for select
  using (true);
