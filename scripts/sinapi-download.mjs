#!/usr/bin/env node
/**
 * scripts/sinapi-download.mjs
 * Baixa a planilha sintética de composições SINAPI do site da CAIXA.
 *
 * Uso:
 *   node scripts/sinapi-download.mjs --estado SP --referencia 2024-06 --saida /tmp
 *
 * A CAIXA disponibiliza os arquivos em:
 *   https://www.caixa.gov.br/Downloads/sinapi-tabela-sintetica-de-composicoes/
 * O padrão do arquivo ZIP varia por período; este script tenta URLs comuns.
 */

import { createWriteStream, mkdirSync } from 'node:fs'
import { pipeline } from 'node:stream/promises'
import { createUnzip } from 'node:zlib'
import path from 'node:path'
import { parseArgs } from 'node:util'

const { values: args } = parseArgs({
  options: {
    estado:    { type: 'string', short: 'e' },
    referencia:{ type: 'string', short: 'r' },
    saida:     { type: 'string', short: 'o', default: '/tmp' },
  },
})

if (!args.estado || !args.referencia) {
  console.error('Uso: node scripts/sinapi-download.mjs --estado SP --referencia 2024-06')
  process.exit(1)
}

const estado     = args.estado.toUpperCase()
const [ano, mes] = args.referencia.split('-')
const saida      = args.saida

// Nome do mês por extenso (pt-BR)
const MESES = {
  '01':'JANEIRO','02':'FEVEREIRO','03':'MARCO','04':'ABRIL',
  '05':'MAIO','06':'JUNHO','07':'JULHO','08':'AGOSTO',
  '09':'SETEMBRO','10':'OUTUBRO','11':'NOVEMBRO','12':'DEZEMBRO',
}
const mesNome = MESES[mes] ?? mes

// Possíveis padrões de URL usados pela CAIXA
const candidatos = [
  `https://www.caixa.gov.br/Downloads/sinapi-tabela-sintetica-de-composicoes/SINAPI_Composicoes_Sintetico_${estado}_${ano}_${mesNome}.zip`,
  `https://www.caixa.gov.br/Downloads/sinapi-tabela-sintetica-de-composicoes/SINAPI_Composicoes_Sintetico_${estado}_${ano}${mes}.zip`,
  `https://www.caixa.gov.br/Downloads/sinapi-tabela-sintetica-de-composicoes/SINAPI_Composicoes_Sintetico_${estado}_${mesNome}_${ano}.zip`,
]

async function baixar(url, destino) {
  const resp = await fetch(url)
  if (!resp.ok) throw new Error(`HTTP ${resp.status} para ${url}`)
  mkdirSync(path.dirname(destino), { recursive: true })
  await pipeline(resp.body, createWriteStream(destino))
}

async function main() {
  console.log(`\nBaixando SINAPI ${estado} ${args.referencia}…`)

  let baixado = false
  for (const url of candidatos) {
    try {
      console.log(`Tentando: ${url}`)
      const zipDest = path.join(saida, `SINAPI_${estado}_${args.referencia}.zip`)
      await baixar(url, zipDest)
      console.log(`✅ Baixado em: ${zipDest}`)
      console.log(`\nDescompacte com:\n  unzip ${zipDest} -d ${saida}`)
      console.log(`\nEm seguida, converta com:\n  node scripts/sinapi-to-json.mjs --arquivo ${saida}/SINAPI_${estado}_${args.referencia}.xlsx --estado ${estado} --referencia ${args.referencia}`)
      baixado = true
      break
    } catch (e) {
      console.warn(`  ✗ Falhou: ${e.message}`)
    }
  }

  if (!baixado) {
    console.error('\n❌ Não foi possível baixar automaticamente.')
    console.error('Acesse manualmente:')
    console.error('  https://www.caixa.gov.br/poder-publico/modernizacao-gestao/sinapi/Paginas/default.aspx')
    console.error(`Baixe a planilha de ${estado} - ${args.referencia} e execute:`)
    console.error(`  node scripts/sinapi-to-json.mjs --arquivo <ARQUIVO.xlsx> --estado ${estado} --referencia ${args.referencia}`)
    process.exit(1)
  }
}

main().catch(e => { console.error(e.message); process.exit(1) })
