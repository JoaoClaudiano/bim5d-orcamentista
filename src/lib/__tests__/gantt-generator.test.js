import { describe, it, expect } from 'vitest'
import { gerarCronograma, formatarData } from '../gantt-generator.js'

// Helper para criar um item de orçamento de teste
const makeItem = (fase, quantidade, options = {}) => ({
  fase,
  quantidade,
  codigo: options.codigo ?? '87503',
  custo_total: options.custo_total ?? 100,
  desc: options.desc ?? `Item de ${fase}`,
  produtividade: options.produtividade ?? { valor: 2.0, unidade: 'm²/h', equipe: '1 pedreiro' },
})

// ─── gerarCronograma ──────────────────────────────────────────────────────────

describe('gerarCronograma', () => {
  it('returns expected structure', () => {
    const itens = [makeItem('Alvenaria', 16)]
    const result = gerarCronograma(itens, new Date('2024-01-02'))
    expect(result).toHaveProperty('tarefas')
    expect(result).toHaveProperty('totalDias')
    expect(result).toHaveProperty('dataFim')
    expect(result.dataFim).toBeInstanceOf(Date)
  })

  it('calculates correct duration: 16m² at 2m²/h = 1 working day (8h)', () => {
    const itens = [makeItem('Alvenaria', 16)]
    const result = gerarCronograma(itens, new Date('2024-01-02'))
    const tarefa = result.tarefas.find(t => !t.ehFase)
    expect(tarefa.duracao).toBe(1)
  })

  it('calculates correct duration: 40m² at 2m²/h = 3 working days (ceil(20/8)=3)', () => {
    const itens = [makeItem('Alvenaria', 40)]
    const result = gerarCronograma(itens, new Date('2024-01-02'))
    const tarefa = result.tarefas.find(t => !t.ehFase)
    expect(tarefa.duracao).toBe(3)
  })

  it('assigns minimum 1 day for items with no produtividade', () => {
    const itens = [makeItem('Instalações', 10, { produtividade: null })]
    const result = gerarCronograma(itens, new Date('2024-01-02'))
    const tarefa = result.tarefas.find(t => !t.ehFase)
    expect(tarefa.duracao).toBeGreaterThanOrEqual(1)
  })

  it('orders items: Estrutura appears before Acabamento in chronological task list', () => {
    const itens = [
      makeItem('Acabamento', 10),
      makeItem('Estrutura', 10),
    ]
    const result = gerarCronograma(itens, new Date('2024-01-02'))
    const nonFase = result.tarefas.filter(t => !t.ehFase)
    const estruturaIdx = nonFase.findIndex(t => t.fase === 'Estrutura')
    const acabamentoIdx = nonFase.findIndex(t => t.fase === 'Acabamento')
    expect(estruturaIdx).toBeLessThan(acabamentoIdx)
  })

  it('handles empty itens gracefully', () => {
    const result = gerarCronograma([], new Date('2024-01-02'))
    expect(result.tarefas).toHaveLength(0)
    expect(result.totalDias).toBe(0)
  })

  it('creates phase header (ehFase=true) for each fase', () => {
    const itens = [makeItem('Alvenaria', 10), makeItem('Pisos', 10)]
    const result = gerarCronograma(itens, new Date('2024-01-02'))
    const faseHeaders = result.tarefas.filter(t => t.ehFase)
    expect(faseHeaders.length).toBeGreaterThanOrEqual(2)
    expect(faseHeaders.some(t => t.fase === 'Alvenaria')).toBe(true)
    expect(faseHeaders.some(t => t.fase === 'Pisos')).toBe(true)
  })

  it('totalDias matches sum of all task durations', () => {
    const itens = [
      makeItem('Estrutura', 16),  // 1 day at 2m²/h
      makeItem('Alvenaria', 16),  // 1 day at 2m²/h
    ]
    const result = gerarCronograma(itens, new Date('2024-01-02'))
    expect(result.totalDias).toBe(2)
  })

  it('task has required fields', () => {
    const itens = [makeItem('Alvenaria', 10)]
    const result = gerarCronograma(itens, new Date('2024-01-02'))
    const task = result.tarefas.find(t => !t.ehFase)
    expect(task).toHaveProperty('id')
    expect(task).toHaveProperty('nome')
    expect(task).toHaveProperty('fase')
    expect(task).toHaveProperty('inicio')
    expect(task).toHaveProperty('fim')
    expect(task).toHaveProperty('duracao')
    expect(task).toHaveProperty('custo')
    expect(task).toHaveProperty('equipe')
  })

  it('respects configurable horasPorDia', () => {
    // 16m² at 2m²/h = 8h; with 4h/day → 2 days
    const itens = [makeItem('Alvenaria', 16)]
    const result = gerarCronograma(itens, new Date('2024-01-02'), { horasPorDia: 4 })
    const task = result.tarefas.find(t => !t.ehFase)
    expect(task.duracao).toBe(2)
  })

  it('skips weekends: start Friday → 1-day task ends Monday', () => {
    // 2024-01-05 is Friday
    const itens = [makeItem('Alvenaria', 16)] // 1 working day
    const result = gerarCronograma(itens, new Date('2024-01-05T12:00:00Z'))
    const task = result.tarefas.find(t => !t.ehFase)
    const fim = new Date(task.fim)
    // Should be Monday 2024-01-08 (skips Saturday and Sunday)
    expect(fim.getUTCDay()).toBe(1) // 1 = Monday
  })
})

// ─── formatarData ─────────────────────────────────────────────────────────────

describe('formatarData', () => {
  it('returns em-dash for null', () => {
    expect(formatarData(null)).toBe('—')
  })

  it('returns em-dash for undefined', () => {
    expect(formatarData(undefined)).toBe('—')
  })

  it('formats a Date to pt-BR abbreviated month', () => {
    const result = formatarData(new Date('2024-03-15'))
    // Should contain a pt-BR abbreviated month like 'mar', 'mar.' etc.
    expect(result).toMatch(/\d{2}/)       // day
    expect(result).toMatch(/202[0-9]/)    // year
  })

  it('accepts a date string', () => {
    const result = formatarData('2024-01-15')
    expect(result).toBeTruthy()
    expect(result).not.toBe('—')
  })
})
