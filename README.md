# BIM 5D — Orçamentista Web Inteligente

> Cruzamento automatizado de quantitativos do **Revit** com a tabela **SINAPI (CAIXA)** — com cronograma 4D, persistência de projetos e base de dados configurável por estado e mês de referência.

![MIT License](https://img.shields.io/badge/license-MIT-blue)
![Vite](https://img.shields.io/badge/vite-5.x-purple)
![React](https://img.shields.io/badge/react-18-blue)
![Vitest](https://img.shields.io/badge/tests-74_passing-green)

---

## O que é isso?

Uma aplicação web que transforma o Schedule exportado pelo Revit (CSV, Excel ou `.rvt`) em um **orçamento completo** com:

- ✅ Mapeamento automático de categorias Revit → composições SINAPI
- ✅ Custo total, mão de obra e material por item
- ✅ Cronograma 4D com execução paralela, feriados e data configurável
- ✅ Distribuição de custos por fase da obra
- ✅ Exportação Excel (.xlsx) com 3 abas: Orçamento, Resumo por Fase e De-Para
- ✅ Exportação CSV
- ✅ Autenticação com Google via Supabase
- ✅ Persistência de projetos por usuário no Supabase
- ✅ De-Para customizado pessoal e por equipe (compartilhamento entre usuários)
- ✅ Seletor de UF e mês de referência SINAPI (8 UFs na biblioteca local)
- ✅ **Biblioteca SINAPI local** (`public/biblioteca/sinapi/`) — 20 composições × 8 estados
- ✅ **Scripts de atualização SINAPI** — download, conversão e importação automáticos
- ✅ **Equipes** — De-Para compartilhado entre membros do mesmo escritório/empresa
- ✅ **Calendário de obra** — horas/dia, paralelo vs sequencial, feriados nacionais
- ✅ **Upload .rvt** — extrai quantitativos direto do arquivo Revit via APS com revisão do usuário
- ✅ Plano Free (3 projetos) e Pro (ilimitado)

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + Vite 5 |
| Estilo | Tailwind CSS 3 |
| Parser CSV | PapaParse (auto-detect delimitador) |
| Parser Excel | SheetJS (xlsx) |
| Backend / Auth | Supabase (Auth, projetos, de-para, SINAPI, equipes) |
| Edge Functions | Supabase Edge Functions (Deno) — APS proxy |
| BIM processing | Autodesk Platform Services (APS) Model Derivative API |
| Testes | Vitest 2 + jsdom |
| Deploy | GitHub Pages (Actions) |

---

## Biblioteca SINAPI

A pasta `public/biblioteca/sinapi/` contém composições SINAPI em formato JSON para uso offline e como fallback quando o Supabase não tem dados para o estado/referência selecionado.

**Estados disponíveis:** CE, SP, RJ, MG, RS, BA, PE, DF (referência: 2024-03)

**Como atualizar:** veja [`biblioteca/README.md`](biblioteca/README.md) e os scripts em `scripts/`.

```bash
# Baixar tabela SINAPI de SP, junho/2024
node scripts/sinapi-download.mjs --estado SP --referencia 2024-06 --saida /tmp

# Converter Excel para JSON da biblioteca
node scripts/sinapi-to-json.mjs \
  --arquivo /tmp/SINAPI_SP_2024-06.xlsx \
  --estado SP --referencia 2024-06

# Importar para o Supabase
node scripts/sinapi-to-supabase.mjs \
  --arquivo public/biblioteca/sinapi/SP_2024-06.json
```

**Prioridade de dados:** Supabase → biblioteca local → dados estáticos (CE 2024-03)

---

## Upload de arquivo .rvt

A aba **"Arquivo .rvt (BIM 5D)"** na tela inicial permite enviar o arquivo `.rvt` diretamente do Revit, sem precisar exportar o Schedule manualmente.

**Fluxo:**
1. Usuário seleciona/arrasta o `.rvt`
2. Arquivo é enviado para o APS (Autodesk Platform Services) via Edge Function
3. APS faz a tradução SVF2 e extrai propriedades dos elementos
4. Usuário vê tabela de revisão com os quantitativos extraídos
5. Usuário pode editar quantidades, marcar/desmarcar linhas e corrigir o código SINAPI
6. Ao confirmar, o orçamento é gerado normalmente

**Configuração:**
```
Supabase → Settings → Secrets
  APS_CLIENT_ID     = <seu Client ID do app APS>
  APS_CLIENT_SECRET = <seu Client Secret do app APS>
```

Deploy das Edge Functions:
```bash
supabase functions deploy aps-upload
supabase functions deploy aps-extract
```

---

## Equipes (De-Para compartilhado)

Usuários podem criar ou entrar em uma equipe para compartilhar mapeamentos De-Para:

1. Na sidebar (usuário autenticado), clique em **+ Criar** equipe ou **Entrar** com um código
2. O código da equipe pode ser compartilhado com colegas
3. De-Para pessoal tem prioridade sobre o De-Para da equipe
4. Membros que entram automaticamente herdam o De-Para salvo pela equipe

**Migration:** `supabase/migrations/004_equipes.sql`

---

## Rodando localmente

```bash
# 1. Clone o repositório
git clone https://github.com/SEU_USUARIO/bim5d-orcamentista.git
cd bim5d-orcamentista

# 2. Instale as dependências
npm install

# 3. Configure o Supabase (opcional — funciona sem, com dados locais)
cp .env.example .env
# Edite .env com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

Abra `http://localhost:5173` no navegador.

### Testes e lint

```bash
npm run test      # executa os testes unitários (68 testes)
npm run lint      # ESLint com regras React
npm run coverage  # relatório de cobertura
```

---

## Deploy no GitHub Pages

### Automático (recomendado)

O repositório já tem o workflow em `.github/workflows/deploy.yml`.  
Basta ativar o GitHub Pages no repositório:

1. Vá em **Settings → Pages**
2. Em **Source**, selecione **GitHub Actions**
3. Faça um push para a branch `main`
4. O deploy acontece automaticamente ✅

### Manual

```bash
npm run build
# Os arquivos ficam em /dist — faça upload manual ou use:
npx gh-pages -d dist
```

---

## Configurando o Supabase

### 1. Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e crie um projeto
2. Copie a **URL** e a **anon key** do projeto
3. Crie o arquivo `.env` baseado em `.env.example`

### 2. Aplicar migrations

```bash
# Com o Supabase CLI:
supabase db push

# Ou execute manualmente no SQL Editor do Supabase:
# supabase/migrations/001_initial.sql     — tabela projetos
# supabase/migrations/002_depara.sql      — tabela depara_custom
# supabase/migrations/003_sinapi_composicoes.sql  — tabela SINAPI por estado/mês
```

### 3. Popular dados SINAPI iniciais

```bash
# Execute o seed (CE, mar/2024) no SQL Editor do Supabase:
# supabase/seed.sql
```

---

## Como usar

### Com o Revit

1. No Revit, abra a view **Schedules/Quantities**
2. Crie um schedule com as colunas: `Category`, `Family`, `Type`, `Area` (ou `Volume`, `Count`)
3. Exporte: **File → Export → Reports → Schedule**
4. Salve como `.csv` ou `.txt` (que pode renomear para `.csv`)
5. Faça upload na aplicação

### Sem o Revit (demo)

Clique em **"usar dados de demonstração"** na tela inicial — o sistema gera um CSV de exemplo com 8 categorias típicas.

---

## Estrutura do projeto

```
bim5d-orcamentista/
├── .github/
│   └── workflows/
│       └── deploy.yml              ← CI/CD automático
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial.sql         ← tabela projetos
│   │   ├── 002_depara.sql          ← tabela depara_custom
│   │   └── 003_sinapi_composicoes.sql ← tabela SINAPI por estado/mês
│   └── seed.sql                    ← dados iniciais CE/2024-03
├── src/
│   ├── lib/
│   │   ├── sinapi-local-db.js      ← dados SINAPI estáticos (fallback)
│   │   ├── sinapi-mapper.js        ← motor De-Para
│   │   ├── sinapi-service.js       ← carrega SINAPI do Supabase (cache + fallback)
│   │   ├── revit-parser.js         ← parser CSV/Excel com auto-detect
│   │   ├── gantt-generator.js      ← cronograma 4D configurável
│   │   ├── export.js               ← exportação Excel/CSV
│   │   ├── telemetry.js            ← métricas de sessão
│   │   ├── projetos-service.js     ← CRUD projetos no Supabase
│   │   ├── planos.js               ← lógica de planos (Free/Pro)
│   │   └── __tests__/             ← testes unitários (Vitest)
│   ├── components/
│   │   ├── UploadZone.jsx
│   │   ├── OrcamentoTable.jsx
│   │   ├── ResumoCards.jsx
│   │   ├── GanttChart.jsx
│   │   ├── FaseChart.jsx
│   │   ├── ProjetosSidebar.jsx
│   │   ├── EstadoSelector.jsx      ← seletor UF + referência SINAPI
│   │   └── AuthGate.jsx
│   ├── hooks/
│   │   └── useDepara.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── eslint.config.js
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## Adicionando composições SINAPI

### Via Supabase (recomendado em produção)

Insira linhas na tabela `sinapi_composicoes`:

```sql
insert into sinapi_composicoes (codigo, descricao, unidade, custo_total, mo, material, estado, referencia)
values ('87503', 'Alvenaria de vedação...', 'm²', 62.18, 28.45, 33.73, 'SP', '2024-06');
```

A aplicação usará automaticamente os dados do Supabase para a UF/mês selecionados na interface, com fallback para os dados locais (CE/2024-03) se não houver dados no banco.

### Via código (fallback local)

Edite `src/lib/sinapi-local-db.js` para adicionar composições ao fallback local.

---

## Roadmap

### Fase 1 — Produto confiável ✅
- [x] Upload CSV / Excel do Revit
- [x] Auto-detect delimitador CSV (`,`, `;`, `\t`, `|`)
- [x] Motor de mapeamento De-Para
- [x] Orçamento com MO + Material
- [x] Cronograma 4D (Gantt) com data de início configurável
- [x] Exportação Excel + CSV
- [x] Deploy GitHub Pages
- [x] ESLint + Vitest (68 testes unitários)
- [x] Telemetria de sessão (taxa de mapeamento, erros, tempo)

### Fase 2 — Dados reais ✅ (parcial)
- [x] Autenticação Supabase (Google OAuth)
- [x] Persistência de projetos por usuário
- [x] De-Para customizado persistente
- [x] Tabela SINAPI no Supabase por estado e mês
- [x] Seletor de UF e referência SINAPI na interface
- [x] Cache e fallback inteligente para dados SINAPI
- [ ] Import automatizado da planilha SINAPI mensal (script ETL)
- [ ] Múltiplas UFs com dados completos populados

### Fase 3 — Inteligência operacional
- [ ] Sugestão de composições baseada em histórico de correções
- [ ] De-Para compartilhado por equipe/empresa

### Fase 4 — Planejamento avançado
- [ ] Gantt com precedência entre tarefas
- [ ] Múltiplas frentes de trabalho em paralelo
- [ ] Calendário de obra configurável (feriados, turnos)

### Fase 5 — BIM 5D completo
- [ ] Upload de arquivo `.rvt` via Autodesk Platform Services
- [ ] Visualizador 3D no browser (Forge Viewer)
- [ ] Clique no elemento 3D → destaca linha do orçamento (BIM 5D)

### Fase 6 — IA
- [ ] Matching semântico via embeddings (pgvector + Supabase)
- [ ] Aprendizado a partir das correções manuais dos usuários

---

## Contribuindo

Pull requests são bem-vindos! Para mudanças maiores, abra uma issue primeiro.

---

## Licença

MIT — use livremente para fins educacionais e comerciais.
