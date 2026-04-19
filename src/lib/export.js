// src/lib/export.js
// Exportação do orçamento para Excel (.xlsx)
import * as XLSX from 'xlsx'

/**
 * Exporta o orçamento completo para Excel
 */
export function exportarExcel(itens, resumo) {
  const wb = XLSX.utils.book_new()

  // --- Aba 1: Orçamento detalhado ---
  const linhasOrcamento = [
    ['ORÇAMENTO BIM 5D — Gerado por Orçamentista Inteligente'],
    [`Data de geração: ${new Date().toLocaleDateString('pt-BR')}`],
    [`Estado de referência: CE | Fonte: SINAPI`],
    [],
    ['Categoria (Revit)', 'Código SINAPI', 'Descrição', 'Unid.', 'Quantidade', 'Custo Unit.', 'M.O. Unit.', 'Material Unit.', 'Custo Total', 'Fase', 'Confiança'],
    ...itens.map(i => [
      i.categoria,
      i.codigo ?? 'N/A',
      i.desc,
      i.unidade,
      i.quantidade,
      i.custo_unitario,
      i.custo_mo,
      i.custo_material,
      i.custo_total,
      i.fase,
      i.confianca,
    ]),
    [],
    ['', '', '', '', '', '', '', 'TOTAL GERAL', resumo.total, '', ''],
  ]

  const ws1 = XLSX.utils.aoa_to_sheet(linhasOrcamento)

  // Larguras de coluna
  ws1['!cols'] = [
    { wch: 30 }, { wch: 12 }, { wch: 60 }, { wch: 8 },
    { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
    { wch: 14 }, { wch: 16 }, { wch: 12 },
  ]
  XLSX.utils.book_append_sheet(wb, ws1, 'Orçamento Detalhado')

  // --- Aba 2: Resumo por fase ---
  const linhasResumo = [
    ['RESUMO POR FASE'],
    [],
    ['Fase', 'Custo Total (R$)', 'M.O. (R$)', 'Material (R$)', '% do Total'],
    ...Object.entries(resumo.porFase).map(([fase, dados]) => [
      fase,
      dados.total.toFixed(2),
      dados.total_mo.toFixed(2),
      dados.total_material.toFixed(2),
      resumo.total > 0 ? ((dados.total / resumo.total) * 100).toFixed(1) + '%' : '0%',
    ]),
    [],
    ['TOTAL', resumo.total.toFixed(2), resumo.total_mo.toFixed(2), resumo.total_material.toFixed(2), '100%'],
  ]
  const ws2 = XLSX.utils.aoa_to_sheet(linhasResumo)
  ws2['!cols'] = [{ wch: 20 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 12 }]
  XLSX.utils.book_append_sheet(wb, ws2, 'Resumo por Fase')

  // --- Aba 3: De-Para aplicado ---
  const linhasDePara = [
    ['DE-PARA APLICADO — Mapeamento Revit → SINAPI'],
    [],
    ['Categoria Revit Original', 'Código SINAPI Sugerido', 'Nível de Confiança', 'Observação'],
    ...itens.map(i => [
      i.categoria,
      i.codigo ?? '—',
      i.confianca,
      i.confianca === 'baixa' ? 'Revisar manualmente — sem correspondência automática' : 'OK',
    ]),
  ]
  const ws3 = XLSX.utils.aoa_to_sheet(linhasDePara)
  ws3['!cols'] = [{ wch: 30 }, { wch: 22 }, { wch: 18 }, { wch: 50 }]
  XLSX.utils.book_append_sheet(wb, ws3, 'De-Para')

  XLSX.writeFile(wb, `orcamento-bim5d-${new Date().toISOString().slice(0,10)}.xlsx`)
}

/**
 * Exporta orçamento como CSV simples
 */
export function exportarCSV(itens) {
  const linhas = [
    ['Categoria', 'SINAPI', 'Descrição', 'Unid', 'Qtd', 'Custo Total', 'Fase'].join(';'),
    ...itens.map(i =>
      [i.categoria, i.codigo ?? '', i.desc, i.unidade, i.quantidade, i.custo_total.toFixed(2), i.fase].join(';')
    ),
  ]
  const blob = new Blob(['\uFEFF' + linhas.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `orcamento-bim5d-${new Date().toISOString().slice(0,10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
