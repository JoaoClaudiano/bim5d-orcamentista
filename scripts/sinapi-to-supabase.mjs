#!/usr/bin/env node
/**
 * scripts/sinapi-to-supabase.mjs
 * Importa um arquivo JSON da biblioteca SINAPI para a tabela sinapi_composicoes
 * no Supabase (upsert seguro).
 *
 * Uso:
 *   node scripts/sinapi-to-supabase.mjs --arquivo public/biblioteca/sinapi/SP_2024-06.json
 *
 * Variáveis necessárias (no .env ou como variáveis de ambiente):
 *   VITE_SUPABASE_URL       URL do projeto Supabase
 *   VITE_SUPABASE_ANON_KEY  chave anon do Supabase (ou service_role para maior permissão)
 *
 * Requer: npm install @supabase/supabase-js dotenv (ambas já presentes)
 */

import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { parseArgs } from 'node:util'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

const { values: args } = parseArgs({
  options: {
    arquivo:     { type: 'string', short: 'f' },
    batch:       { type: 'string', default: '100' },
  },
})

if (!args.arquivo) {
  console.error('Uso: node scripts/sinapi-to-supabase.mjs --arquivo public/biblioteca/sinapi/SP_2024-06.json')
  process.exit(1)
}

// Carrega .env se disponível
const envPath = path.resolve('.env')
if (existsSync(envPath)) {
  const linhas = readFileSync(envPath, 'utf-8').split('\n')
  for (const linha of linhas) {
    const [k, ...rest] = linha.trim().split('=')
    if (k && !process.env[k]) process.env[k] = rest.join('=').replace(/^["']|["']$/g, '')
  }
}

const url  = process.env.VITE_SUPABASE_URL
const key  = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env')
  process.exit(1)
}

const { createClient } = require('@supabase/supabase-js')
const supabase = createClient(url, key)

async function main() {
  console.log(`\nImportando: ${args.arquivo}`)
  const dados = JSON.parse(readFileSync(args.arquivo, 'utf-8'))

  const { estado, referencia, composicoes } = dados
  console.log(`  Estado: ${estado} | Referência: ${referencia} | Composições: ${composicoes.length}`)

  const batchSize = parseInt(args.batch, 10)
  let importados = 0
  let erros = 0

  for (let i = 0; i < composicoes.length; i += batchSize) {
    const lote = composicoes.slice(i, i + batchSize).map(c => ({
      codigo:      c.codigo,
      descricao:   c.descricao,
      unidade:     c.unidade,
      custo_total: c.custo_total,
      mo:          c.mo,
      material:    c.material,
      estado,
      referencia,
    }))

    const { error } = await supabase
      .from('sinapi_composicoes')
      .upsert(lote, { onConflict: 'codigo,estado,referencia' })

    if (error) {
      console.error(`  ✗ Lote ${i / batchSize + 1}: ${error.message}`)
      erros += lote.length
    } else {
      importados += lote.length
      process.stdout.write(`\r  Progresso: ${importados}/${composicoes.length}`)
    }
  }

  console.log(`\n\n✅ Importação concluída: ${importados} composições inseridas, ${erros} erros`)
  if (erros > 0) {
    console.warn('  Verifique se a tabela sinapi_composicoes existe (migration 003_sinapi_composicoes.sql)')
  }
}

main().catch(e => { console.error(e.message); process.exit(1) })
