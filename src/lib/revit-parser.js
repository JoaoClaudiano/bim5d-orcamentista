// src/lib/revit-parser.js
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

/**
 * Infere a unidade de medida a partir dos campos da linha
 */
export function inferUnit(row) {
  for (const [k] of Object.entries(row)) {
    const kl = k.toLowerCase()
    if (kl.includes('volume') || kl.includes('m³') || kl.includes('m3')) return 'm³'
    if (kl.includes('area')   || kl.includes('área') || kl.includes('m²') || kl.includes('m2')) return 'm²'
    if (kl.includes('length') || kl.includes('comprimento') || kl.includes('perimeter')) return 'm'
  }
  return 'un'
}

/**
 * Extrai o valor numérico da quantidade, removendo unidades e formatação brasileira
 */
export function parseQuantidade(val) {
  if (!val && val !== 0) return 0
  const str = String(val)
    .replace(/[^\d.,]/g, '')      // remove letras e símbolos
    .replace(/\.(?=\d{3})/g, '')  // separador de milhar BR (ex: 1.234 → 1234)
    .replace(',', '.')             // decimal BR
  return parseFloat(str) || 0
}

/**
 * Detecta qual campo contém a quantidade principal usando sistema de pontuação
 */
export function detectQuantidadeField(headers) {
  const scored = headers.map(h => {
    const hl = h.toLowerCase()
    let score = 0
    if (hl.includes('m²') || hl.includes('m2'))                           score = 98
    else if (hl.includes('area') || hl.includes('área'))                   score = 95
    else if (hl.includes('m³') || hl.includes('m3'))                       score = 90
    else if (hl.includes('volume'))                                         score = 88
    else if (hl.includes('length') || hl.includes('comprimento'))          score = 80
    else if (hl.includes('count') || hl.includes('contagem'))              score = 70
    else if (hl.includes('quantidade') || hl.includes('quantity'))        score = 65
    else if (hl.includes('perimeter') || hl.includes('perímetro'))        score = 60
    return { h, score }
  })

  const best = scored.sort((a, b) => b.score - a.score)[0]
  if (best.score > 0) return best.h
  return headers[headers.length - 1] // último campo como fallback
}

/**
 * Detecta qual campo contém a categoria/nome do elemento
 */
export function detectCategoriaField(headers) {
  const candidates = [
    'category', 'categoria', 'family', 'família', 'familia',
    'type', 'tipo', 'description', 'descrição', 'name', 'nome',
  ]
  for (const c of candidates) {
    const found = headers.find(h => h.toLowerCase().includes(c))
    if (found) return found
  }
  return headers[0]
}

/**
 * Normaliza um array de objetos crus do CSV/Excel para o formato interno
 */
function normalizeRows(data) {
  if (!data.length) return []

  const headers = Object.keys(data[0])
  const campoCategoria  = detectCategoriaField(headers)
  const campoQuantidade = detectQuantidadeField(headers)

  return data
    .filter(row => {
      const cat = row[campoCategoria]
      return cat && String(cat).trim() !== '' && String(cat).trim() !== campoCategoria
    })
    .map(row => ({
      categoria:  String(row[campoCategoria] ?? '').trim(),
      quantidade: parseQuantidade(row[campoQuantidade]),
      unidade:    inferUnit(row),
      rawRow:     row,
    }))
}

/**
 * Faz parse de arquivo CSV exportado do Revit
 * Detecta automaticamente o delimitador (`,`, `;`, `\t`, `|`) e
 * remove o BOM UTF-8 quando presente.
 */
export function parseRevitCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      encoding: 'UTF-8',
      delimiter: '',      // auto-detect: ',', ';', '\t', '|'
      transformHeader: h => h.replace(/^\uFEFF/, '').trim(), // strip BOM do header
      complete: ({ data, errors }) => {
        if (errors.length && !data.length) {
          reject(new Error(
            `Erro ao processar CSV: ${errors[0]?.message}. ` +
            'Certifique-se de exportar o Schedule pelo Revit em File → Export → Reports → Schedule.',
          ))
          return
        }
        if (!data.length) {
          reject(new Error(
            'Arquivo CSV vazio ou sem linhas de dados. ' +
            'Verifique se o Schedule foi exportado corretamente com as colunas Category, Family e uma coluna de quantidade.',
          ))
          return
        }
        resolve(normalizeRows(data))
      },
      error: (err) => reject(new Error(`Falha ao ler arquivo CSV: ${err.message}`)),
    })
  })
}

/**
 * Faz parse de arquivo Excel (.xlsx / .xls) exportado do Revit
 */
export function parseRevitExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wb    = XLSX.read(e.target.result, { type: 'array' })
        const sheet = wb.Sheets[wb.SheetNames[0]]
        const data  = XLSX.utils.sheet_to_json(sheet, { defval: '' })
        if (!data.length) {
          reject(new Error(
            'Planilha Excel sem dados. ' +
            'Verifique se a primeira aba contém o Schedule exportado pelo Revit.',
          ))
          return
        }
        resolve(normalizeRows(data))
      } catch (err) {
        reject(new Error(`Erro ao processar Excel: ${err.message}`))
      }
    }
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo. Verifique se está corrompido.'))
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Entry point unificado: detecta tipo pelo nome do arquivo
 */
export async function parseRevitFile(file) {
  const ext = file.name.split('.').pop().toLowerCase()
  if (ext === 'csv' || ext === 'txt') {
    return parseRevitCSV(file)
  } else if (['xlsx', 'xls'].includes(ext)) {
    return parseRevitExcel(file)
  }
  throw new Error(
    `Formato ".${ext}" não suportado. Use CSV (.csv) ou Excel (.xlsx) exportado pelo Revit.`,
  )
}

/**
 * Gera um arquivo CSV de demonstração para testar sem ter o Revit
 */
export function gerarCSVDemo() {
  const linhas = [
    'Category,Family,Type,Area,Volume,Count',
    'Basic Wall,Wall-Exterior-Brick,150mm,320.50,,',
    'Basic Wall,Wall-Interior-Generic,90mm,180.20,,',
    'Floor,Floor-Concrete,200mm,,,,',
    'Floor,Floor-Ceramic,10mm,245.80,,',
    'Structural Column,Column-Concrete,300x300,,0.95,12',
    'Structural Framing,Beam-Concrete,200x400,,1.80,8',
    'Roof,Basic Roof,Flat-200mm,180.00,,',
    'Ceiling,Compound Ceiling,GWB,180.00,,',
  ]
  const blob = new Blob([linhas.join('\n')], { type: 'text/csv;charset=utf-8;' })
  return new File([blob], 'revit-schedule-demo.csv', { type: 'text/csv' })
}
