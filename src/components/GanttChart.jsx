// src/components/GanttChart.jsx
import { formatarData } from '../lib/gantt-generator'

const FASE_COLORS = {
  'Estrutura':    { bar: '#3391fe', bg: 'rgba(51,145,254,0.12)' },
  'Alvenaria':    { bar: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  'Pisos':        { bar: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
  'Cobertura':    { bar: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
  'Revestimento': { bar: '#22c55e', bg: 'rgba(34,197,94,0.12)'  },
  'Acabamento':   { bar: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  'Instalações':  { bar: '#ec4899', bg: 'rgba(236,72,153,0.12)' },
  'Indefinido':   { bar: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
}

function getColor(fase) {
  return FASE_COLORS[fase] ?? { bar: '#6b7280', bg: 'rgba(107,114,128,0.12)' }
}

export default function GanttChart({ tarefas, totalDias }) {
  if (!tarefas?.length) return null

  const fmt = (d) => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(d))

  return (
    <div className="animate-fade-in">
      <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="text-white/80 font-medium">Cronograma 4D — Gráfico de Gantt</h3>
          <p className="text-white/30 text-xs mt-0.5">Duração calculada pela produtividade SINAPI</p>
        </div>
        <span className="text-xs px-3 py-1 rounded-full bg-brand-900/40 border border-brand-700/30 text-brand-300">
          {totalDias} dias úteis
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/8">
        <table className="w-full text-xs min-w-[700px]">
          <thead>
            <tr className="border-b border-white/8 bg-white/[0.03]">
              <th className="px-4 py-2.5 text-left text-white/40 font-medium w-56">Tarefa</th>
              <th className="px-3 py-2.5 text-left text-white/40 font-medium w-24">Início</th>
              <th className="px-3 py-2.5 text-left text-white/40 font-medium w-24">Fim</th>
              <th className="px-3 py-2.5 text-left text-white/40 font-medium w-16">Dias</th>
              <th className="px-3 py-2.5 text-left text-white/40 font-medium">Progresso</th>
            </tr>
          </thead>
          <tbody>
            {tarefas.map((t) => {
              const color = getColor(t.fase)
              const pct   = totalDias > 0 ? (t.duracao / totalDias) * 100 : 0
              const left  = totalDias > 0 ? (t.diaInicioOffset / totalDias) * 100 : 0

              return (
                <tr
                  key={t.id}
                  className={`border-b border-white/5 ${t.ehFase ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]'}`}
                >
                  <td className="px-4 py-2.5">
                    <div className={`flex items-center gap-2 ${t.ehFase ? '' : 'pl-3'}`}>
                      {t.ehFase && (
                        <div className="w-2 h-2 rounded-sm flex-shrink-0" style={{ background: color.bar }}/>
                      )}
                      <span className={`${t.ehFase ? 'text-white/80 font-medium' : 'text-white/50'} truncate max-w-[180px]`}
                            title={t.nome}>
                        {t.nome}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-white/40 tabular-nums">{fmt(t.inicio)}</td>
                  <td className="px-3 py-2.5 text-white/40 tabular-nums">{fmt(t.fim)}</td>
                  <td className="px-3 py-2.5 text-white/60 tabular-nums text-center">{t.duracao}</td>
                  <td className="px-3 py-2.5">
                    <div className="relative h-5 w-full rounded bg-white/5">
                      <div
                        className="absolute top-0.5 h-4 rounded transition-all"
                        style={{
                          left:       `${left}%`,
                          width:      `${Math.max(pct, 0.5)}%`,
                          background: t.ehFase ? color.bar : `${color.bar}99`,
                          minWidth:   '4px',
                        }}
                      />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Legenda de fases */}
      <div className="mt-4 flex flex-wrap gap-3">
        {Object.entries(FASE_COLORS).map(([fase, c]) => (
          <div key={fase} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: c.bar }}/>
            <span className="text-xs text-white/40">{fase}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
