// src/lib/revit-parser.js
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

/**
 * Infere a unidade de medida a partir dos campos da linha
 */
function inferUnit(row) {
  const keys = Object.keys(row).map(k => k.toLowerCase())
  const vals = Object.entries(row)

  for (const [k, v] of vals) {
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
function parseQuantidade(val) {
  if (!val && val !== 0) return 0
  const str = String(val)
    .replace(/[^\d.,]/g, '')   // remove letras e símbolos
    .replace(/\.(?=\d{3})/g, '') // separador de milhar BR
    .replace(',', '.')           // decimal BR
  return parseFloat(str) || 0
}

/**
 * Detecta qual campo contém a quantidade principal
 */
function detectQuantidadeField(headers) {
  const priority = [
    'area', 'área', 'volume', 'length', 'comprimento',
    'count', 'contagem', 'quantidade', 'quantity', 'perimeter', 'perímetro',
  ]
  for (const p of priority) {
    const found = headers.find(h => h.toLowerCase().includes(p))
    if (found) return found
  }
  return headers[headers.length - 1] // último campo como fallback
}

/**
 * Detecta qual campo contém a categoria/nome do elemento
 */
function detectCategoriaField(headers) {
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
 */
export function parseRevitCSV(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      encoding: 'UTF-8',
      complete: ({ data, errors }) => {
        if (errors.length && !data.length) {
          reject(new Error('Erro ao processar CSV: ' + errors[0]?.message))
          return
        }
        resolve(normalizeRows(data))
      },
      error: (err) => reject(new Error(err.message)),
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
        const wb   = XLSX.read(e.target.result, { type: 'array' })
        const sheet = wb.Sheets[wb.SheetNames[0]]
        const data  = XLSX.utils.sheet_to_json(sheet, { defval: '' })
        resolve(normalizeRows(data))
      } catch (err) {
        reject(new Error('Erro ao processar Excel: ' + err.message))
      }
    }
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'))
    reader.readAsArrayBuffer(file)
  })
}

/**
 * Entry point unificado: detecta tipo pelo nome do arquivo
 */
export async function parseRevitFile(file) {
  const ext = file.name.split('.').pop().toLowerCase()
  if (ext === 'csv') {
    return parseRevitCSV(file)
  } else if (['xlsx', 'xls'].includes(ext)) {
    return parseRevitExcel(file)
  }
  throw new Error('Formato não suportado. Use CSV ou Excel (.xlsx).')
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
