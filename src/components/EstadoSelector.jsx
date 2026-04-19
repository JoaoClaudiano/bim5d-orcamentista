// src/components/EstadoSelector.jsx
// Seletor de UF e mês de referência da tabela SINAPI

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
  'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
  'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]

const REFERENCIAS = [
  { value: '2024-03', label: 'Mar/2024' },
  { value: '2024-06', label: 'Jun/2024' },
  { value: '2024-09', label: 'Set/2024' },
  { value: '2024-12', label: 'Dez/2024' },
  { value: '2025-03', label: 'Mar/2025' },
  { value: '2025-06', label: 'Jun/2025' },
]

const selectClass =
  'px-2 py-1 rounded-md bg-white/5 border border-white/10 text-white/70 text-xs ' +
  'outline-none focus:border-brand-500/60 disabled:opacity-50 cursor-pointer'

export default function EstadoSelector({ estado, referencia, onChange, loading }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-white/30 hidden sm:inline">SINAPI</span>

      <select
        value={estado}
        onChange={e => onChange({ estado: e.target.value, referencia })}
        disabled={loading}
        aria-label="Estado SINAPI"
        className={selectClass}
      >
        {UFS.map(uf => (
          <option key={uf} value={uf} className="bg-[#0a0f1e]">{uf}</option>
        ))}
      </select>

      <select
        value={referencia}
        onChange={e => onChange({ estado, referencia: e.target.value })}
        disabled={loading}
        aria-label="Mês de referência SINAPI"
        className={selectClass}
      >
        {REFERENCIAS.map(r => (
          <option key={r.value} value={r.value} className="bg-[#0a0f1e]">{r.label}</option>
        ))}
      </select>

      {loading && (
        <span className="text-xs text-white/30 animate-pulse">carregando…</span>
      )}
    </div>
  )
}
