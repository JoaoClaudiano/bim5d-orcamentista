// src/components/OrcamentoTable.jsx
import { useState } from 'react'

const CONFIANCA_CONFIG = {
  alta:  { label: 'Alta',  className: 'bg-sinapi-700/30 text-sinapi-100 border border-sinapi-600/30' },
  media: { label: 'Média', className: 'bg-yellow-900/30 text-yellow-200 border border-yellow-600/30' },
  baixa: { label: 'Baixa', className: 'bg-red-900/30 text-red-300 border border-red-600/30' },
}

function Badge({ confianca }) {
  const cfg = CONFIANCA_CONFIG[confianca] ?? CONFIANCA_CONFIG.baixa
  return (
    <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}

function fmt(n) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n ?? 0)
}

export default function OrcamentoTable({ itens, onEditar, onCorrigirDepara }) {
  const [sortField, setSortField] = useState('fase')
  const [sortDir,   setSortDir]   = useState('asc')
  const [filtro,    setFiltro]    = useState('')
  const [editando,  setEditando]  = useState(null)
  const [codigo,    setCodigo]    = useState('')
  const [salvando,  setSalvando]  = useState(false)

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const itensFiltrados = itens
    .filter(i =>
      !filtro ||
      i.categoria?.toLowerCase().includes(filtro.toLowerCase()) ||
      i.desc?.toLowerCase().includes(filtro.toLowerCase()) ||
      i.codigo?.includes(filtro) ||
      i.fase?.toLowerCase().includes(filtro.toLowerCase())
    )
    .sort((a, b) => {
      const va = a[sortField] ?? ''
      const vb = b[sortField] ?? ''
      const r  = typeof va === 'number' ? va - vb : String(va).localeCompare(String(vb))
      return sortDir === 'asc' ? r : -r
    })

  const SortIcon = ({ field }) => (
    <span className={`ml-1 text-xs ${sortField === field ? 'text-brand-400' : 'text-white/20'}`}>
      {sortField === field ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </span>
  )

  const Th = ({ field, label, className = '' }) => (
    <th
      onClick={() => toggleSort(field)}
      className={`px-3 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider cursor-pointer select-none hover:text-white/70 transition-colors ${className}`}
    >
      {label}<SortIcon field={field} />
    </th>
  )

  const semCorrespondencia = itens.filter(i => i.confianca === 'baixa').length

  async function confirmarCorrecao(item, indexReal) {
    if (!onCorrigirDepara) return
    const codigoFinal = codigo.trim()
    if (!codigoFinal) return

    setSalvando(true)
    try {
      await onCorrigirDepara(item, indexReal, codigoFinal)
      setEditando(null)
      setCodigo('')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="animate-fade-in">
      {/* Header da tabela */}
      <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="text-white/70 text-sm">{itens.length} itens mapeados</span>
          {semCorrespondencia > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-900/30 border border-red-700/30 text-red-300">
              ⚠ {semCorrespondencia} sem correspondência
            </span>
          )}
        </div>
        <input
          type="search"
          placeholder="Filtrar por categoria, código, fase…"
          value={filtro}
          onChange={e => setFiltro(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-sm bg-white/5 border border-white/10 text-white/80 placeholder-white/30 outline-none focus:border-brand-500/60 w-72"
        />
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto rounded-xl border border-white/8">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="border-b border-white/8 bg-white/[0.03]">
              <Th field="categoria"   label="Categoria (Revit)" />
              <Th field="codigo"      label="Cód. SINAPI"      className="font-mono" />
              <Th field="desc"        label="Descrição"        />
              <Th field="unidade"     label="Unid."            />
              <Th field="quantidade"  label="Qtd."             />
              <Th field="custo_unitario" label="Unit. (R$)"    />
              <Th field="custo_total" label="Total (R$)"       />
              <Th field="fase"        label="Fase"             />
              <Th field="confianca"   label="Conf."            />
            </tr>
          </thead>
          <tbody>
            {itensFiltrados.map((item, i) => {
              const indexReal = itens.indexOf(item)
              return (
                <tr
                  key={i}
                  className={`
                    border-b border-white/5 animate-fade-in stagger-row
                    transition-colors hover:bg-brand-950/40
                    ${item.confianca === 'baixa' ? 'bg-red-950/10' : ''}
                  `}
                >
                  <td className="px-3 py-2.5 text-white/80 max-w-[160px] truncate" title={item.categoria}>
                    {item.categoria}
                  </td>
                  <td className="px-3 py-2.5 font-mono">
                    {item.codigo ? (
                      <span className="text-brand-400 font-medium">{item.codigo}</span>
                    ) : (
                      <span className="text-white/20">—</span>
                    )}

                    {item.confianca === 'baixa' && onCorrigirDepara && (
                      <div className="mt-1">
                        {editando === indexReal ? (
                          <div className="flex items-center gap-1">
                            <input
                              value={codigo}
                              onChange={(e) => setCodigo(e.target.value)}
                              placeholder="Código"
                              className="w-20 px-1.5 py-1 rounded bg-white/5 border border-white/15 text-[11px] text-white/80 outline-none focus:border-brand-500/60"
                            />
                            <button
                              onClick={() => confirmarCorrecao(item, indexReal)}
                              disabled={salvando}
                              className="text-[11px] px-1.5 py-1 rounded bg-brand-700/30 border border-brand-600/40 text-brand-200 hover:bg-brand-700/40 disabled:opacity-50"
                            >
                              Salvar
                            </button>
                            <button
                              onClick={() => { setEditando(null); setCodigo('') }}
                              className="text-[11px] px-1.5 py-1 rounded glass text-white/60"
                            >
                              X
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditando(indexReal)
                              setCodigo('')
                            }}
                            className="text-[11px] px-1.5 py-0.5 rounded bg-yellow-900/25 border border-yellow-700/30 text-yellow-200 hover:bg-yellow-900/35"
                          >
                            Corrigir
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-white/60 max-w-[260px] text-xs leading-tight" title={item.desc}>
                    <span className="line-clamp-2">{item.desc}</span>
                  </td>
                  <td className="px-3 py-2.5 text-white/50 text-xs text-center">{item.unidade}</td>
                  <td className="px-3 py-2.5 text-right text-white/80 tabular-nums">
                    {item.quantidade?.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-2.5 text-right text-white/60 tabular-nums text-xs">
                    {item.custo_unitario > 0 ? fmt(item.custo_unitario) : <span className="text-white/20">—</span>}
                  </td>
                  <td className="px-3 py-2.5 text-right font-medium tabular-nums">
                    {item.custo_total > 0
                      ? <span className="text-white">{fmt(item.custo_total)}</span>
                      : <span className="text-white/20">—</span>
                    }
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="text-xs px-2 py-0.5 rounded-md bg-white/5 text-white/50">{item.fase}</span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <Badge confianca={item.confianca} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {itensFiltrados.length === 0 && (
        <p className="text-center text-white/30 py-8 text-sm">Nenhum item para o filtro aplicado.</p>
      )}
    </div>
  )
}
