// src/components/QuantidadesReview.jsx
// Tabela de verificação de quantitativos extraídos do .rvt pelo APS.
// O usuário pode revisar, editar e confirmar antes de gerar o orçamento.
import { useState, useMemo } from 'react'

const SINAPI_DB = {
  '87503': '87503', '87251': '87251', '94966': '94966', '94978': '94978',
  '92793': '92793', '87447': '87447', '87264': '87264', '87549': '87549',
  '74209': '74209', '87296': '87296', '72136': '72136', '72137': '72137',
  '88267': '88267', '88271': '88271', '93358': '93358', '93359': '93359',
  '87551': '87551', '74252': '74252', '74128': '74128', '74130': '74130',
}

// Mapeamento simples de categoria APS → código SINAPI sugerido
const SUGESTOES_SINAPI = {
  'basic wall':        '87503',
  'walls':             '87503',
  'floors':            '87251',
  'structural floors': '94966',
  'structural columns':'94978',
  'structural framing':'94966',
  'roofs':             '87551',
  'ceilings':          '74209',
  'doors':             '74128',
  'windows':           '74130',
  'foundation slabs':  '72136',
}

function sugerirCodigo(categoria) {
  const cl = (categoria ?? '').toLowerCase()
  for (const [k, v] of Object.entries(SUGESTOES_SINAPI)) {
    if (cl.includes(k)) return v
  }
  return ''
}

function fmt(n) {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(n ?? 0)
}

export default function QuantidadesReview({ quantitativos = [], arquivoNome = '', onConfirmar, onCancelar }) {
  const [linhas, setLinhas] = useState(() =>
    quantitativos.map(q => ({
      ...q,
      checked:       true,
      codigoSinapi:  sugerirCodigo(q.categoria),
      qtdEditada:    q.quantidade,
    }))
  )
  const [filtro, setFiltro] = useState('')

  const linhasFiltradas = useMemo(() =>
    linhas.filter(l =>
      !filtro ||
      l.categoria.toLowerCase().includes(filtro.toLowerCase()) ||
      l.familia?.toLowerCase().includes(filtro.toLowerCase()) ||
      l.tipo?.toLowerCase().includes(filtro.toLowerCase())
    ),
    [linhas, filtro]
  )

  function toggleLinha(idx) {
    setLinhas(prev => prev.map((l, i) => i === idx ? { ...l, checked: !l.checked } : l))
  }

  function editarQtd(idx, val) {
    const n = parseFloat(String(val).replace(',', '.')) || 0
    setLinhas(prev => prev.map((l, i) => i === idx ? { ...l, qtdEditada: n } : l))
  }

  function editarCodigo(idx, val) {
    setLinhas(prev => prev.map((l, i) => i === idx ? { ...l, codigoSinapi: val.trim() } : l))
  }

  function confirmar() {
    const selecionadas = linhas
      .filter(l => l.checked && l.qtdEditada > 0)
      .map(l => ({
        categoria:   l.categoria + (l.familia ? ` / ${l.familia}` : ''),
        quantidade:  l.qtdEditada,
        unidade:     l.unidade,
        codigoSinapi: l.codigoSinapi || null,
      }))
    onConfirmar?.(selecionadas)
  }

  const checkedCount   = linhas.filter(l => l.checked).length
  const semCodigo      = linhas.filter(l => l.checked && !l.codigoSinapi).length

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-white/80 font-medium text-sm">
            Verificar quantitativos extraídos
          </h3>
          <p className="text-white/40 text-xs mt-0.5">
            Arquivo: <span className="font-mono text-white/60">{arquivoNome}</span> ·{' '}
            {checkedCount} de {linhas.length} linhas selecionadas
          </p>
          {semCodigo > 0 && (
            <p className="text-yellow-300/70 text-xs mt-1">
              ⚠ {semCodigo} {semCodigo === 1 ? 'linha sem' : 'linhas sem'} código SINAPI — preencha para incluir no orçamento.
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setLinhas(prev => prev.map(l => ({ ...l, checked: true })))}
            className="text-xs px-2 py-1 rounded glass text-white/50 hover:text-white/70"
          >
            Selecionar tudo
          </button>
          <button
            onClick={() => setLinhas(prev => prev.map(l => ({ ...l, checked: false })))}
            className="text-xs px-2 py-1 rounded glass text-white/50 hover:text-white/70"
          >
            Desmarcar tudo
          </button>
        </div>
      </div>

      {/* Filtro */}
      <input
        type="search"
        placeholder="Filtrar por categoria, família, tipo…"
        value={filtro}
        onChange={e => setFiltro(e.target.value)}
        className="w-full px-3 py-1.5 rounded-lg text-sm bg-white/5 border border-white/10 text-white/80 placeholder-white/30 outline-none focus:border-brand-500/60"
      />

      {/* Tabela */}
      <div className="overflow-x-auto rounded-xl border border-white/8">
        <table className="w-full text-xs min-w-[700px]">
          <thead>
            <tr className="border-b border-white/8 bg-white/[0.03]">
              <th className="px-3 py-2.5 text-left text-white/40 w-8">✓</th>
              <th className="px-3 py-2.5 text-left text-white/40">Categoria</th>
              <th className="px-3 py-2.5 text-left text-white/40">Família / Tipo</th>
              <th className="px-3 py-2.5 text-right text-white/40">Qtd.</th>
              <th className="px-3 py-2.5 text-center text-white/40">Unid.</th>
              <th className="px-3 py-2.5 text-center text-white/40">Cód. SINAPI</th>
              <th className="px-3 py-2.5 text-center text-white/40">Elem.</th>
            </tr>
          </thead>
          <tbody>
            {linhasFiltradas.map((linha, i) => {
              // Encontrar índice real na lista não filtrada
              const idxReal = linhas.indexOf(linha)
              return (
                <tr
                  key={i}
                  className={`border-b border-white/5 transition-colors
                    ${linha.checked ? 'hover:bg-brand-950/30' : 'opacity-40 bg-white/[0.01]'}`}
                >
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={linha.checked}
                      onChange={() => toggleLinha(idxReal)}
                      className="accent-brand-500 w-3.5 h-3.5 cursor-pointer"
                    />
                  </td>
                  <td className="px-3 py-2 text-white/70 max-w-[160px] truncate" title={linha.categoria}>
                    {linha.categoria}
                  </td>
                  <td className="px-3 py-2 text-white/40 max-w-[160px] truncate"
                    title={[linha.familia, linha.tipo].filter(Boolean).join(' / ')}>
                    {[linha.familia, linha.tipo].filter(Boolean).join(' / ') || '—'}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <input
                      type="number"
                      value={linha.qtdEditada}
                      onChange={e => editarQtd(idxReal, e.target.value)}
                      disabled={!linha.checked}
                      min={0}
                      step="any"
                      className="w-20 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-white/80 text-xs text-right outline-none focus:border-brand-500/50 disabled:opacity-30"
                    />
                  </td>
                  <td className="px-3 py-2 text-center text-white/40">{linha.unidade}</td>
                  <td className="px-3 py-2 text-center">
                    <input
                      type="text"
                      value={linha.codigoSinapi}
                      onChange={e => editarCodigo(idxReal, e.target.value)}
                      disabled={!linha.checked}
                      placeholder="código"
                      className={`w-20 px-1.5 py-0.5 rounded text-xs font-mono text-center outline-none
                        ${linha.codigoSinapi
                          ? 'bg-brand-900/20 border border-brand-700/30 text-brand-300'
                          : 'bg-yellow-900/15 border border-yellow-700/25 text-yellow-200/60'}
                        focus:border-brand-500/50 disabled:opacity-30`}
                    />
                  </td>
                  <td className="px-3 py-2 text-center text-white/30">
                    {fmt(linha.elementCount)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {linhasFiltradas.length === 0 && (
        <p className="text-center text-white/30 py-6 text-sm">Nenhum item para o filtro aplicado.</p>
      )}

      {/* Ações */}
      <div className="flex gap-3 justify-end pt-1">
        {onCancelar && (
          <button
            onClick={onCancelar}
            className="px-4 py-2 rounded-lg text-sm glass text-white/60 hover:text-white/80 transition-colors"
          >
            Cancelar
          </button>
        )}
        <button
          onClick={confirmar}
          disabled={checkedCount === 0}
          className="px-5 py-2 rounded-lg text-sm bg-brand-700/30 border border-brand-600/40 text-brand-200 hover:bg-brand-700/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          Gerar orçamento com {checkedCount} {checkedCount === 1 ? 'item' : 'itens'}
        </button>
      </div>
    </div>
  )
}
