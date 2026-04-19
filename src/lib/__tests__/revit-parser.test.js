import { describe, it, expect } from 'vitest'
import {
  parseQuantidade,
  inferUnit,
  detectCategoriaField,
  detectQuantidadeField,
  gerarCSVDemo,
} from '../revit-parser.js'

// ─── parseQuantidade ─────────────────────────────────────────────────────────

describe('parseQuantidade', () => {
  it('parses integer string', () => {
    expect(parseQuantidade('100')).toBe(100)
  })

  it('parses decimal US format', () => {
    expect(parseQuantidade('320.50')).toBeCloseTo(320.5)
  })

  it('parses BR decimal with comma', () => {
    expect(parseQuantidade('1234,56')).toBeCloseTo(1234.56)
  })

  it('parses BR thousand separator with decimal', () => {
    expect(parseQuantidade('1.234,56')).toBeCloseTo(1234.56)
  })

  it('strips trailing unit label', () => {
    expect(parseQuantidade('45.20 m²')).toBeCloseTo(45.2)
  })

  it('returns 0 for empty string', () => {
    expect(parseQuantidade('')).toBe(0)
  })

  it('returns 0 for null', () => {
    expect(parseQuantidade(null)).toBe(0)
  })

  it('returns 0 for undefined', () => {
    expect(parseQuantidade(undefined)).toBe(0)
  })

  it('handles numeric zero', () => {
    expect(parseQuantidade(0)).toBe(0)
  })

  it('handles large BR formatted number', () => {
    expect(parseQuantidade('10.000')).toBe(10000)
  })
})

// ─── inferUnit ───────────────────────────────────────────────────────────────

describe('inferUnit', () => {
  it('detects m² from Area key', () => {
    expect(inferUnit({ Area: '100', Count: '1' })).toBe('m²')
  })

  it('detects m² from lowercase area key', () => {
    expect(inferUnit({ area: '100' })).toBe('m²')
  })

  it('detects m³ from Volume key', () => {
    expect(inferUnit({ Volume: '5.2', Count: '1' })).toBe('m³')
  })

  it('detects m from Length key', () => {
    expect(inferUnit({ Length: '10', Count: '1' })).toBe('m')
  })

  it('detects m from Comprimento key', () => {
    expect(inferUnit({ Comprimento: '8', Count: '1' })).toBe('m')
  })

  it('defaults to un when no known key found', () => {
    expect(inferUnit({ Count: '5', Name: 'Test' })).toBe('un')
  })

  it('volume takes priority over area when volume key comes first', () => {
    // Both keys present — volume key listed first should win
    expect(inferUnit({ Volume: '1', Area: '10' })).toBe('m³')
  })
})

// ─── detectCategoriaField ────────────────────────────────────────────────────

describe('detectCategoriaField', () => {
  it('finds Category column (case-insensitive prefix)', () => {
    expect(detectCategoriaField(['Category', 'Family', 'Area'])).toBe('Category')
  })

  it('finds Categoria (pt-BR)', () => {
    expect(detectCategoriaField(['Categoria', 'Familia', 'Area'])).toBe('Categoria')
  })

  it('finds Family when Category absent', () => {
    expect(detectCategoriaField(['Family', 'Type', 'Area'])).toBe('Family')
  })

  it('falls back to first column when no known key', () => {
    expect(detectCategoriaField(['Col1', 'Col2', 'Col3'])).toBe('Col1')
  })
})

// ─── detectQuantidadeField ───────────────────────────────────────────────────

describe('detectQuantidadeField', () => {
  it('prefers Area over Volume and Count', () => {
    expect(detectQuantidadeField(['Category', 'Area', 'Volume', 'Count'])).toBe('Area')
  })

  it('prefers Volume over Count', () => {
    expect(detectQuantidadeField(['Category', 'Volume', 'Count'])).toBe('Volume')
  })

  it('uses Count when no dimensional column present', () => {
    expect(detectQuantidadeField(['Category', 'Type', 'Count'])).toBe('Count')
  })

  it('falls back to last column when nothing matches', () => {
    expect(detectQuantidadeField(['Col1', 'Col2', 'Col3'])).toBe('Col3')
  })

  it('m² label in header gets high priority', () => {
    expect(detectQuantidadeField(['Name', 'Área m²', 'Count'])).toBe('Área m²')
  })
})

// ─── gerarCSVDemo ─────────────────────────────────────────────────────────────

describe('gerarCSVDemo', () => {
  it('returns a File instance', () => {
    const f = gerarCSVDemo()
    expect(f).toBeInstanceOf(File)
  })

  it('has correct filename', () => {
    expect(gerarCSVDemo().name).toBe('revit-schedule-demo.csv')
  })

  it('has csv mime type', () => {
    expect(gerarCSVDemo().type).toBe('text/csv')
  })

  it('file size is greater than zero', () => {
    expect(gerarCSVDemo().size).toBeGreaterThan(0)
  })
})
