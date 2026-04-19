// src/components/CalendarioConfig.jsx
// Configuração do calendário de obra: feriados e horas por dia
import { useState } from 'react'

const FERIADOS_NACIONAIS_2024 = [
  '2024-01-01', '2024-02-12', '2024-02-13', '2024-03-29',
  '2024-04-21', '2024-05-01', '2024-06-20', '2024-09-07',
  '2024-10-12', '2024-11-02', '2024-11-15', '2024-12-25',
]

const FERIADOS_NACIONAIS_2025 = [
  '2025-01-01', '2025-03-03', '2025-03-04', '2025-04-18',
  '2025-04-21', '2025-05-01', '2025-06-19', '2025-09-07',
  '2025-10-12', '2025-11-02', '2025-11-15', '2025-12-25',
]

const inputCls = 'px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white/80 text-xs outline-none focus:border-brand-500/60'

export default function CalendarioConfig({ config, onChange }) {
  const [novoFeriado, setNovoFeriado] = useState('')
  const [aberto, setAberto] = useState(false)

  const feriados    = config.feriados    ?? []
  const horasPorDia = config.horasPorDia ?? 8
  const paralelo    = config.paralelo    ?? true

  function toggleFeriado(data) {
    const novos = feriados.includes(data)
      ? feriados.filter(d => d !== data)
      : [...feriados, data].sort()
    onChange({ ...config, feriados: novos })
  }

  function adicionarFeriado() {
    const d = novoFeriado.trim()
    if (!d || feriados.includes(d)) return
    onChange({ ...config, feriados: [...feriados, d].sort() })
    setNovoFeriado('')
  }

  function carregarFeriadosNacionais(ano) {
    const lista = ano === 2025 ? FERIADOS_NACIONAIS_2025 : FERIADOS_NACIONAIS_2024
    const novos = [...new Set([...feriados, ...lista])].sort()
    onChange({ ...config, feriados: novos })
  }

  return (
    <div className="glass rounded-xl border border-white/8 overflow-hidden">
      <button
        onClick={() => setAberto(v => !v)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm text-white/70 font-medium">⚙ Calendário da Obra</span>
          <span className="text-xs text-white/30">
            {horasPorDia}h/dia · {feriados.length} feriados · {paralelo ? 'paralelo' : 'sequencial'}
          </span>
        </div>
        <span className="text-white/30 text-xs">{aberto ? '▲' : '▼'}</span>
      </button>

      {aberto && (
        <div className="px-4 pb-4 space-y-4 border-t border-white/8 animate-fade-in">
          {/* Horas por dia */}
          <div className="flex items-center gap-3 pt-3">
            <label className="text-xs text-white/50 w-32 shrink-0">Horas/dia de trabalho</label>
            <input
              type="number" min={4} max={12} step={1}
              value={horasPorDia}
              onChange={e => onChange({ ...config, horasPorDia: parseInt(e.target.value, 10) || 8 })}
              className={`${inputCls} w-16 text-center`}
            />
            <span className="text-xs text-white/30">horas</span>
          </div>

          {/* Execução paralela */}
          <div className="flex items-center gap-3">
            <label className="text-xs text-white/50 w-32 shrink-0">Itens da mesma fase</label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={paralelo}
                onChange={e => onChange({ ...config, paralelo: e.target.checked })}
                className="accent-brand-500 w-3.5 h-3.5"
              />
              <span className="text-xs text-white/70">
                {paralelo ? 'executar em paralelo (mais rápido)' : 'executar em sequência'}
              </span>
            </label>
          </div>

          {/* Feriados */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/50">Feriados ({feriados.length} marcados)</span>
              <div className="flex gap-2">
                <button
                  onClick={() => carregarFeriadosNacionais(2025)}
                  className="text-xs px-2 py-1 rounded bg-white/5 border border-white/10 text-white/50 hover:text-white/70 transition-colors"
                >
                  + Nacionais 2025
                </button>
                <button
                  onClick={() => carregarFeriadosNacionais(2024)}
                  className="text-xs px-2 py-1 rounded bg-white/5 border border-white/10 text-white/50 hover:text-white/70 transition-colors"
                >
                  + Nacionais 2024
                </button>
                {feriados.length > 0 && (
                  <button
                    onClick={() => onChange({ ...config, feriados: [] })}
                    className="text-xs px-2 py-1 rounded bg-red-900/20 border border-red-700/30 text-red-300 hover:bg-red-900/30 transition-colors"
                  >
                    Limpar
                  </button>
                )}
              </div>
            </div>

            {/* Adicionar feriado manual */}
            <div className="flex gap-2">
              <input
                type="date"
                value={novoFeriado}
                onChange={e => setNovoFeriado(e.target.value)}
                className={`${inputCls} flex-1`}
              />
              <button
                onClick={adicionarFeriado}
                disabled={!novoFeriado}
                className="px-2 py-1 rounded-lg text-xs bg-brand-700/20 border border-brand-600/30 text-brand-200 hover:bg-brand-700/30 disabled:opacity-50 transition-colors"
              >
                + Adicionar
              </button>
            </div>

            {/* Lista de feriados ativos */}
            {feriados.length > 0 && (
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                {feriados.map(d => (
                  <button
                    key={d}
                    onClick={() => toggleFeriado(d)}
                    title="Clique para remover"
                    className="text-xs px-2 py-0.5 rounded-full bg-yellow-900/20 border border-yellow-700/30 text-yellow-200 hover:bg-red-900/30 hover:border-red-700/30 hover:text-red-300 transition-colors"
                  >
                    {d} ✕
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
