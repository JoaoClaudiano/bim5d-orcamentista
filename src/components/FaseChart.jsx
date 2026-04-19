// src/components/FaseChart.jsx
// Gráfico de pizza simples (SVG puro) para distribuição por fase

function fmt(n) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n ?? 0)
}

const CORES = [
  '#3391fe', '#f97316', '#a855f7', '#22c55e',
  '#f59e0b', '#06b6d4', '#ec4899', '#6b7280',
]

export default function FaseChart({ porFase }) {
  const entries = Object.entries(porFase).sort((a, b) => b[1].total - a[1].total)
  const total   = entries.reduce((s, [, v]) => s + v.total, 0)
  if (total === 0) return null

  // Construir arcos SVG
  const R = 70, cx = 90, cy = 90
  let angle = -Math.PI / 2
  const arcos = entries.map(([fase, v], i) => {
    const frac    = v.total / total
    const start   = angle
    angle += frac * 2 * Math.PI
    const end     = angle
    const large   = frac > 0.5 ? 1 : 0
    const x1 = cx + R * Math.cos(start)
    const y1 = cy + R * Math.sin(start)
    const x2 = cx + R * Math.cos(end)
    const y2 = cy + R * Math.sin(end)
    return { fase, frac, path: `M ${cx} ${cy} L ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} Z`, cor: CORES[i % CORES.length], total: v.total }
  })

  return (
    <div className="glass rounded-xl p-5 animate-fade-in">
      <h3 className="text-white/70 text-sm font-medium mb-4">Distribuição por Fase</h3>
      <div className="flex gap-6 items-start flex-wrap">
        {/* Donut */}
        <svg width="180" height="180" viewBox="0 0 180 180">
          {arcos.map(a => (
            <path key={a.fase} d={a.path} fill={a.cor} opacity="0.9" stroke="#0a0f1e" strokeWidth="1.5"/>
          ))}
          {/* Buraco central */}
          <circle cx={cx} cy={cy} r={40} fill="#0a0f1e"/>
          <text x={cx} y={cy - 5} textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="9" fontFamily="DM Sans">Total</text>
          <text x={cx} y={cy + 10} textAnchor="middle" fill="white" fontSize="9" fontFamily="DM Sans" fontWeight="500">
            {new Intl.NumberFormat('pt-BR', { notation: 'compact', currency: 'BRL', style: 'currency' }).format(total)}
          </text>
        </svg>

        {/* Legenda */}
        <div className="flex-1 space-y-2 min-w-[180px]">
          {arcos.map(a => (
            <div key={a.fase} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: a.cor }}/>
                <span className="text-xs text-white/60">{a.fase}</span>
              </div>
              <div className="flex items-center gap-2 text-right">
                <span className="text-xs text-white/40 tabular-nums">{Math.round(a.frac * 100)}%</span>
                <span className="text-xs text-white/70 tabular-nums font-medium">{fmt(a.total)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
