# Scripts de Importação SINAPI

Scripts Node.js para baixar, converter e importar dados SINAPI da CAIXA.

## Pré-requisitos

```bash
# Node.js 18+ (suporte nativo a fetch e ESM)
node --version  # >= 18.x

# Para scripts de Supabase: configure o .env
cp ../.env.example ../.env
# Preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY
```

## Scripts disponíveis

| Script | Função |
|--------|--------|
| `sinapi-download.mjs` | Baixa planilha SINAPI do site da CAIXA |
| `sinapi-to-json.mjs` | Converte Excel SINAPI para JSON da biblioteca |
| `sinapi-to-supabase.mjs` | Importa JSON da biblioteca para o Supabase |

## Uso

### 1. Baixar planilha da CAIXA

```bash
node scripts/sinapi-download.mjs --estado SP --referencia 2024-06 --saida /tmp
```

O script baixa o arquivo ZIP do site oficial da CAIXA, extrai a planilha Excel e salva em `/tmp/SINAPI_SP_2024-06.xlsx`.

### 2. Converter para JSON

```bash
node scripts/sinapi-to-json.mjs \
  --arquivo /tmp/SINAPI_SP_2024-06.xlsx \
  --estado SP \
  --referencia 2024-06 \
  --saida public/biblioteca/sinapi
```

Gera `public/biblioteca/sinapi/SP_2024-06.json` e atualiza `index.json`.

### 3. Importar para Supabase

```bash
node scripts/sinapi-to-supabase.mjs \
  --arquivo public/biblioteca/sinapi/SP_2024-06.json
```

Usa `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` do `.env` para fazer upsert.

## Fluxo completo (um estado + mês)

```bash
ESTADO=RS
REF=2024-06

node scripts/sinapi-download.mjs --estado $ESTADO --referencia $REF --saida /tmp
node scripts/sinapi-to-json.mjs \
  --arquivo /tmp/SINAPI_${ESTADO}_${REF}.xlsx \
  --estado $ESTADO --referencia $REF \
  --saida public/biblioteca/sinapi
node scripts/sinapi-to-supabase.mjs \
  --arquivo public/biblioteca/sinapi/${ESTADO}_${REF}.json
```

## Observações

- Os dados SINAPI são publicados mensalmente pela CAIXA e são de domínio público.
- Os arquivos JSON resultantes ficam em `public/biblioteca/sinapi/` e são servidos como assets estáticos.
- A aplicação usa a biblioteca como fallback quando o Supabase não tem dados para a UF/mês selecionados.
