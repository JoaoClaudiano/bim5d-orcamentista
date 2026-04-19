import { describe, it, expect } from 'vitest'
import {
  mapToSinapi,
  mapToSinapiComCustom,
  agruparPorFase,
  SINAPI_DB,
} from '../sinapi-mapper.js'

// ─── mapToSinapi ─────────────────────────────────────────────────────────────

describe('mapToSinapi', () => {
  it('maps "Basic Wall" to Alvenaria fase', () => {
    const result = mapToSinapi('Basic Wall', 100, 'm²')
    expect(result).toHaveLength(1)
    expect(result[0].fase).toBe('Alvenaria')
    expect(result[0].codigo).toBe('87503')
  })

  it('calculates custo_total = custo_unitario × quantidade', () => {
    const result = mapToSinapi('Basic Wall', 10, 'm²')
    expect(result[0].custo_total).toBeCloseTo(result[0].custo_unitario * 10)
  })

  it('maps "Floor" to Pisos fase and returns multiple codigos', () => {
    const result = mapToSinapi('Floor', 50, 'm²')
    expect(result.length).toBeGreaterThan(0)
    expect(result[0].fase).toBe('Pisos')
  })

  it('first codigo in multi-result gets confiança alta', () => {
    const result = mapToSinapi('Floor', 50, 'm²')
    expect(result[0].confianca).toBe('alta')
    if (result.length > 1) {
      expect(result[1].confianca).toBe('media')
    }
  })

  it('maps "Structural Column" to Estrutura fase', () => {
    const result = mapToSinapi('Structural Column', 5, 'm²')
    expect(result[0].fase).toBe('Estrutura')
  })

  it('maps "paint" keyword to Acabamento fase', () => {
    const result = mapToSinapi('Paint - Interior', 100, 'm²')
    expect(result[0].fase).toBe('Acabamento')
    expect(result[0].codigo).toBe('87296')
  })

  it('returns Indefinido for unknown category', () => {
    const result = mapToSinapi('Unknown XYZ Category 999', 10, 'un')
    expect(result).toHaveLength(1)
    expect(result[0].fase).toBe('Indefinido')
    expect(result[0].codigo).toBeNull()
    expect(result[0].custo_total).toBe(0)
    expect(result[0].confianca).toBe('baixa')
  })

  it('returns zero custo for unknown category', () => {
    const result = mapToSinapi('Nonexistent', 999, 'un')
    expect(result[0].custo_unitario).toBe(0)
    expect(result[0].custo_mo).toBe(0)
    expect(result[0].custo_material).toBe(0)
  })

  it('handles empty string categoria', () => {
    const result = mapToSinapi('', 10, 'm²')
    expect(result[0].fase).toBe('Indefinido')
  })

  it('handles zero quantidade', () => {
    const result = mapToSinapi('Basic Wall', 0, 'm²')
    expect(result[0].custo_total).toBe(0)
    expect(result[0].quantidade).toBe(0)
  })

  it('uses injected db when provided', () => {
    const customDB = {
      '87503': { desc: 'Custom DB item', unidade: 'm²', custo_total: 999, mo: 100, material: 899 },
    }
    const result = mapToSinapi('Basic Wall', 1, 'm²', customDB)
    expect(result[0].custo_unitario).toBe(999)
  })
})

// ─── mapToSinapiComCustom ────────────────────────────────────────────────────

describe('mapToSinapiComCustom', () => {
  it('prefers custom De-Para over default mapping', async () => {
    const customDePara = [{
      categoria: 'Basic Wall',
      categoria_normalizada: 'basic wall',
      codigo_sinapi: '87264',
    }]
    const result = await mapToSinapiComCustom('Basic Wall', 10, 'm²', customDePara)
    expect(result[0].codigo).toBe('87264')
    expect(result[0].fase).toBe('Personalizado')
    expect(result[0].confianca).toBe('alta')
  })

  it('falls back to default mapping when no custom match', async () => {
    const result = await mapToSinapiComCustom('Structural Column', 5, 'm²', [])
    expect(result[0].fase).toBe('Estrutura')
  })

  it('falls back to default mapping when customDePara is null', async () => {
    const result = await mapToSinapiComCustom('Basic Wall', 10, 'm²', null)
    expect(result[0].fase).toBe('Alvenaria')
  })

  it('matches normalized (lowercase) categoria', async () => {
    const customDePara = [{
      categoria: 'BASIC WALL',
      categoria_normalizada: 'basic wall',
      codigo_sinapi: '87296',
    }]
    const result = await mapToSinapiComCustom('basic wall', 10, 'm²', customDePara)
    expect(result[0].codigo).toBe('87296')
  })

  it('passes injected db to construirItem', async () => {
    const customDB = {
      '99999': { desc: 'Test item', unidade: 'un', custo_total: 500, mo: 50, material: 450 },
    }
    const customDePara = [{
      categoria: 'My Special Category',
      categoria_normalizada: 'my special category',
      codigo_sinapi: '99999',
    }]
    const result = await mapToSinapiComCustom('My Special Category', 2, 'un', customDePara, customDB)
    expect(result[0].custo_unitario).toBe(500)
    expect(result[0].custo_total).toBeCloseTo(1000)
  })
})

// ─── agruparPorFase ───────────────────────────────────────────────────────────

describe('agruparPorFase', () => {
  const makeItem = (fase, custo_total, custo_mo, custo_material, quantidade) => ({
    fase, custo_total, custo_mo, custo_material, quantidade,
  })

  it('groups items by fase', () => {
    const itens = [
      makeItem('Estrutura', 100, 20, 80, 1),
      makeItem('Estrutura', 200, 40, 160, 2),
      makeItem('Alvenaria', 50, 20, 30, 1),
    ]
    const result = agruparPorFase(itens)
    expect(Object.keys(result)).toContain('Estrutura')
    expect(Object.keys(result)).toContain('Alvenaria')
  })

  it('sums custo_total correctly', () => {
    const itens = [
      makeItem('Estrutura', 100, 20, 80, 1),
      makeItem('Estrutura', 200, 40, 160, 2),
    ]
    expect(agruparPorFase(itens).Estrutura.total).toBeCloseTo(300)
  })

  it('sums mo and material using quantidade multiplier', () => {
    const itens = [makeItem('Pisos', 82.74, 23.60, 59.14, 5)]
    const result = agruparPorFase(itens)
    expect(result.Pisos.total_mo).toBeCloseTo(23.60 * 5)
    expect(result.Pisos.total_material).toBeCloseTo(59.14 * 5)
  })

  it('returns empty object for empty array', () => {
    expect(agruparPorFase([])).toEqual({})
  })

  it('uses Indefinido for items without fase', () => {
    const itens = [{ custo_total: 0, custo_mo: 0, custo_material: 0, quantidade: 1 }]
    const result = agruparPorFase(itens)
    expect(result).toHaveProperty('Indefinido')
  })
})

// ─── SINAPI_DB sanity check ───────────────────────────────────────────────────

describe('SINAPI_DB (local)', () => {
  it('contains expected composition codes', () => {
    expect(SINAPI_DB).toHaveProperty('87503')
    expect(SINAPI_DB).toHaveProperty('94966')
    expect(SINAPI_DB).toHaveProperty('87296')
  })

  it('each entry has required numeric fields', () => {
    for (const entry of Object.values(SINAPI_DB)) {
      expect(typeof entry.custo_total).toBe('number')
      expect(typeof entry.mo).toBe('number')
      expect(typeof entry.material).toBe('number')
      // custo_total should approximately equal mo + material
      expect(entry.custo_total).toBeCloseTo(entry.mo + entry.material, 1)
    }
  })
})
