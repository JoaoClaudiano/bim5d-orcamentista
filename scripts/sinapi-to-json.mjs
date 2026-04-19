#!/usr/bin/env node
/**
 * scripts/sinapi-to-json.mjs
 * Converte uma planilha Excel SINAPI (baixada da CAIXA) para o formato JSON
 * da biblioteca do Orçamentista BIM 5D.
 *
 * Uso:
 *   node scripts/sinapi-to-json.mjs \
 *     --arquivo /tmp/SINAPI_SP_2024-06.xlsx \
 *     --estado SP \
 *     --referencia 2024-06 \
 *     --saida public/biblioteca/sinapi
 *
 * Requer: npm install xlsx (dependência de dev já presente)
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { parseArgs } from 'node:util'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

const { values: args } = parseArgs({
  options: {
    arquivo:   { type: 'string', short: 'f' },
    estado:    { type: 'string', short: 'e' },
    referencia:{ type: 'string', short: 'r' },
    saida:     { type: 'string', short: 'o', default: 'public/biblioteca/sinapi' },
  },
})

if (!args.arquivo || !args.estado || !args.referencia) {
  console.error('Uso: node scripts/sinapi-to-json.mjs --arquivo <ARQUIVO.xlsx> --estado SP --referencia 2024-06')
  process.exit(1)
}

const XLSX = require('xlsx')

// Campos que a CAIXA usa na planilha sintética (colunas podem variar)
const COLUNAS_CANDIDATAS = {
  codigo:   ['CÓDIGO', 'CODIGO', 'COD', 'Código da Composição'],
  descricao:['DESCRIÇÃO', 'DESCRICAO', 'DESCRIÇÃO DA COMPOSIÇÃO', 'Descrição da Composição'],
  unidade:  ['UNIDADE', 'UN.', 'UND'],
  total:    ['CUSTO TOTAL', 'TOTAL', 'CUSTO', 'Custo Total'],
  mo:       ['MÃO DE OBRA', 'MAO DE OBRA', 'MO', 'M.O.'],
  material: ['MATERIAL', 'MATERIAIS'],
}

function encontrarColuna(headers, candidatos) {
  const headersUp = headers.map(h => String(h ?? '').toUpperCase().trim())
  for (const c of candidatos) {
    const idx = headersUp.findIndex(h => h.includes(c.toUpperCase()))
    if (idx !== -1) return headers[idx]
  }
  return null
}

function parseNum(val) {
  if (!val && val !== 0) return 0
  const str = String(val).replace(/[^\d,.]/g, '').replace(/\.(?=\d{3})/g, '').replace(',', '.')
  return parseFloat(str) || 0
}

function main() {
  console.log(`\nConvertendo: ${args.arquivo}`)

  const wb = XLSX.readFile(args.arquivo)

  // Tenta achar a aba correta (composições sintéticas)
  const abaAlvo = wb.SheetNames.find(n =>
    n.toUpperCase().includes('COMP') || n.toUpperCase().includes('SINTÉTICO') || n.toUpperCase().includes('SINTETICO')
  ) ?? wb.SheetNames[0]

  console.log(`  Aba utilizada: "${abaAlvo}"`)

  const ws  = wb.Sheets[abaAlvo]
  const raw = XLSX.utils.sheet_to_json(ws, { defval: '' })

  if (!raw.length) {
    console.error('Planilha sem dados!')
    process.exit(1)
  }

  const headers = Object.keys(raw[0])
  const colCodigo    = encontrarColuna(headers, COLUNAS_CANDIDATAS.codigo)
  const colDescricao = encontrarColuna(headers, COLUNAS_CANDIDATAS.descricao)
  const colUnidade   = encontrarColuna(headers, COLUNAS_CANDIDATAS.unidade)
  const colTotal     = encontrarColuna(headers, COLUNAS_CANDIDATAS.total)
  const colMo        = encontrarColuna(headers, COLUNAS_CANDIDATAS.mo)
  const colMaterial  = encontrarColuna(headers, COLUNAS_CANDIDATAS.material)

  console.log(`  Colunas mapeadas: código=${colCodigo} desc=${colDescricao} un=${colUnidade} total=${colTotal} mo=${colMo} mat=${colMaterial}`)

  if (!colCodigo || !colDescricao) {
    console.error('Não foi possível identificar as colunas de código e descrição.')
    console.error('Colunas disponíveis:', headers)
    process.exit(1)
  }

  const composicoes = raw
    .filter(row => row[colCodigo] && String(row[colCodigo]).trim() !== '')
    .map(row => {
      const total    = parseNum(row[colTotal])
      const mo       = parseNum(row[colMo])
      const material = parseNum(row[colMaterial]) || Math.max(0, total - mo)
      return {
        codigo:    String(row[colCodigo]).trim(),
        descricao: String(row[colDescricao] ?? '').trim(),
        unidade:   String(row[colUnidade] ?? 'un').trim(),
        custo_total: parseFloat((mo + material).toFixed(2)),
        mo:          parseFloat(mo.toFixed(2)),
        material:    parseFloat(material.toFixed(2)),
      }
    })
    .filter(c => c.codigo && c.descricao)

  console.log(`  ${composicoes.length} composições encontradas`)

  const estado    = args.estado.toUpperCase()
  const resultado = {
    estado,
    referencia: args.referencia,
    fonte: 'SINAPI CAIXA — tabela sintética de composições',
    composicoes,
  }

  const nomeArquivo = `${estado}_${args.referencia}.json`
  const destino     = path.join(args.saida, nomeArquivo)
  writeFileSync(destino, JSON.stringify(resultado, null, 2), 'utf-8')
  console.log(`✅ JSON gerado: ${destino}`)

  // Atualizar index.json
  const indexPath = path.join(args.saida, 'index.json')
  if (existsSync(indexPath)) {
    const idx = JSON.parse(readFileSync(indexPath, 'utf-8'))
    const existe = idx.datasets.some(d => d.estado === estado && d.referencia === args.referencia)
    if (!existe) {
      idx.datasets.push({ estado, referencia: args.referencia, arquivo: nomeArquivo })
      writeFileSync(indexPath, JSON.stringify(idx, null, 2), 'utf-8')
      console.log(`✅ index.json atualizado`)
    }
  }
}

main()
