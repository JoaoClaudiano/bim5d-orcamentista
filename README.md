# BIM 5D — Orçamentista Web Inteligente

> Cruzamento automatizado de quantitativos do **Revit** com a tabela **SINAPI (CAIXA)** — com cronograma 4D e preparado para visualizador BIM 3D.

![MIT License](https://img.shields.io/badge/license-MIT-blue)
![Vite](https://img.shields.io/badge/vite-5.x-purple)
![React](https://img.shields.io/badge/react-18-blue)

---

## O que é isso?

Uma aplicação web que transforma o Schedule exportado pelo Revit (CSV ou Excel) em um **orçamento completo** com:

- ✅ Mapeamento automático de categorias Revit → composições SINAPI
- ✅ Custo total, mão de obra e material por item
- ✅ Cronograma 4D (Gráfico de Gantt) calculado pela produtividade SINAPI
- ✅ Distribuição de custos por fase da obra
- ✅ Exportação Excel (.xlsx) com 3 abas: Orçamento, Resumo por Fase e De-Para
- 🔜 Visualizador BIM 3D (Autodesk Platform Services / Forge)
- 🔜 IA para sugestão de composições via embeddings

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + Vite 5 |
| Estilo | Tailwind CSS 3 |
| Parser CSV | PapaParse |
| Parser Excel | SheetJS (xlsx) |
| Deploy | GitHub Pages (Actions) |
| Backend (futuro) | Supabase (tabela SINAPI por estado) |

---

## Rodando localmente

```bash
# 1. Clone o repositório
git clone https://github.com/SEU_USUARIO/bim5d-orcamentista.git
cd bim5d-orcamentista

# 2. Instale as dependências
npm install

# 3. Inicie o servidor de desenvolvimento
npm run dev
```

Abra `http://localhost:5173` no navegador.

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
│       └── deploy.yml          ← CI/CD automático
├── src/
│   ├── lib/
│   │   ├── sinapi-mapper.js    ← Motor de mapeamento De-Para
│   │   ├── revit-parser.js     ← Parser CSV / Excel
│   │   ├── gantt-generator.js  ← Cronograma 4D
│   │   └── export.js           ← Exportação Excel / CSV
│   ├── components/
│   │   ├── UploadZone.jsx
│   │   ├── OrcamentoTable.jsx
│   │   ├── ResumoCards.jsx
│   │   ├── GanttChart.jsx
│   │   └── FaseChart.jsx
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## Adicionando composições SINAPI

O arquivo `src/lib/sinapi-mapper.js` contém dois objetos para editar:

### 1. `SINAPI_DB` — base de composições

```js
'87503': {
  codigo: '87503',
  desc: 'Alvenaria de vedação de blocos cerâmicos...',
  unidade: 'm²',
  custo_total: 62.18,
  mo: 28.45,
  material: 33.73,
  estado: 'CE',
},
```

Adicione quantas composições precisar. Os preços estão na tabela SINAPI disponível em:  
👉 https://www.caixa.gov.br/poder-publico/modernizacao-gestao/sinapi/Paginas/default.aspx

### 2. `DE_PARA` — mapeamento de palavras-chave

```js
{
  keywords: ['basic wall', 'wall', 'parede', 'alvenaria'],
  codigos: ['87503'],
  fase: 'Alvenaria',
},
```

Adicione entradas para mapear automaticamente as categorias do seu modelo Revit.

---

## Roadmap

### MVP (atual)
- [x] Upload CSV / Excel do Revit
- [x] Motor de mapeamento De-Para
- [x] Orçamento com MO + Material
- [x] Cronograma 4D (Gantt)
- [x] Exportação Excel
- [x] Deploy GitHub Pages

### Fase 2 — Backend
- [ ] Integração com Supabase (tabela SINAPI completa por estado e mês)
- [ ] Sistema de De-Para persistente (usuário corrige e salva)
- [ ] Múltiplos estados (SP, RJ, MG, CE...)

### Fase 3 — IA
- [ ] Sugestão de composições via embeddings (similaridade semântica)
- [ ] Aprendizado a partir das correções manuais dos usuários

### Fase 4 — BIM 3D
- [ ] Upload de arquivo `.rvt` via Autodesk Platform Services
- [ ] Visualizador 3D no browser (Forge Viewer)
- [ ] Clique no elemento 3D → destaca linha do orçamento (BIM 5D)

---

## Contribuindo

Pull requests são bem-vindos! Para mudanças maiores, abra uma issue primeiro.

---

## Licença

MIT — use livremente para fins educacionais e comerciais.
