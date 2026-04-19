// src/components/ResumoCards.jsx
function fmt(n) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n ?? 0)
}

function KpiCard({ label, value, sub, accent }) {
  return (
    <div className="glass rounded-xl p-4">
      <p className="text-xs text-white/40 mb-1 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-semibold font-display tabular-nums ${accent ?? 'text-white'}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-white/30 mt-1">{sub}</p>}
    </div>
  )
}

export default function ResumoCards({ itens, totalDias, dataFim }) {
  const total          = itens.reduce((s, i) => s + (i.custo_total ?? 0), 0)
  const total_mo       = itens.reduce((s, i) => s + (i.custo_mo ?? 0) * (i.quantidade ?? 0), 0)
  const total_material = itens.reduce((s, i) => s + (i.custo_material ?? 0) * (i.quantidade ?? 0), 0)
  const alta = itens.filter(i => i.confianca === 'alta').length
  const pct  = itens.length > 0 ? Math.round((alta / itens.length) * 100) : 0

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-in">
      <KpiCard
        label="Custo Total"
        value={fmt(total)}
        sub="M.O. + Material"
        accent="text-brand-300"
      />
      <KpiCard
        label="Mão de Obra"
        value={fmt(total_mo)}
        sub={`${total > 0 ? Math.round((total_mo / total) * 100) : 0}% do total`}
      />
      <KpiCard
        label="Material"
        value={fmt(total_material)}
        sub={`${total > 0 ? Math.round((total_material / total) * 100) : 0}% do total`}
      />
      <KpiCard
        label="Prazo Estimado"
        value={`${totalDias ?? '—'} dias`}
        sub={dataFim ? new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(dataFim) : ''}
        accent="text-orange-300"
      />
    </div>
  )
}
