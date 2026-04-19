-- supabase/seed.sql
-- Dados iniciais SINAPI — CE, mar/2024
-- Fonte: SINAPI CAIXA — dados com fins educacionais / demonstração
-- Execute: supabase db reset  ou  psql ... < seed.sql

insert into public.sinapi_composicoes
  (codigo, descricao, unidade, custo_total, mo, material, estado, referencia)
values
  ('87503', 'Alvenaria de vedação de blocos cerâmicos furados na horizontal 9x19x19cm, e=9cm',          'm²', 62.18, 28.45, 33.73, 'CE', '2024-03'),
  ('87251', 'Contrapiso em argamassa traço 1:3 (cimento/areia), preparo mecânico, esp=4cm',              'm²', 38.92, 14.20, 24.72, 'CE', '2024-03'),
  ('94966', 'Concreto usinado bombeável fck=25MPa, lançado, adensado e acabado em lajes',                'm³', 548.30, 62.10, 486.20, 'CE', '2024-03'),
  ('94978', 'Concreto usinado bombeável fck=30MPa, lançado, adensado e acabado em pilares',              'm³', 578.50, 68.40, 510.10, 'CE', '2024-03'),
  ('92793', 'Armação de aço CA-50 diâm. 10,0mm',                                                        'kg',  14.82,  4.30,  10.52, 'CE', '2024-03'),
  ('87447', 'Forma para lajes, em chapa de madeira compensada plastificada e=18mm, 1 uso',               'm²', 58.16, 22.40,  35.76, 'CE', '2024-03'),
  ('87264', 'Revestimento cerâmico para piso, carga elevada, 35x35cm (a=0.30m²/peça)',                  'm²', 82.74, 23.60,  59.14, 'CE', '2024-03'),
  ('87549', 'Chapisco rolado de paredes internas de concreto, traço 1:4 cimento/areia',                  'm²',  8.94,  5.10,   3.84, 'CE', '2024-03'),
  ('74209', 'Revestimento de gesso liso em teto, espessura de 2mm',                                     'm²', 28.40, 18.90,   9.50, 'CE', '2024-03'),
  ('87296', 'Pintura acrílica em paredes internas, 2 demãos + selador, tinta 1ª linha',                 'm²', 22.60, 10.20,  12.40, 'CE', '2024-03')
on conflict (codigo, estado, referencia) do nothing;
