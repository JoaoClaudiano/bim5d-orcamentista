// src/App.jsx
import { useState } from 'react'
import UploadZone    from './components/UploadZone'
import OrcamentoTable from './components/OrcamentoTable'
import ResumoCards   from './components/ResumoCards'
import GanttChart    from './components/GanttChart'
import FaseChart     from './components/FaseChart'
import { parseRevitFile, gerarCSVDemo } from './lib/revit-parser'
import { mapToSinapi, agruparPorFase } from './lib/sinapi-mapper'
import { gerarCronograma }             from './lib/gantt-generator'
import { exportarExcel, exportarCSV }  from './lib/export'

const TABS = [
  { id: 'orcamento', label: 'Orçamento',   icon: '₿' },
  { id: 'gantt',     label: 'Cronograma',  icon: '📅' },
  { id: 'resumo',    label: 'Distribuição',icon: '◉' },
]

export default function App() {
  const [itens,    setItens]    = useState([])
  const [cronograma, setCronograma] = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [erro,     setErro]     = useState(null)
  const [tab,      setTab]      = useState('orcamento')
  const [fileName, setFileName] = useState(null)

  async function processarArquivo(file) {
    setErro(null)
    setLoading(true)
    setFileName(file.name)
    try {
      const revitData = await parseRevitFile(file)
      if (!revitData.length) {
        setErro('O arquivo está vazio ou no formato incorreto. Use o Schedule do Revit.')
        return
      }

      // Mapear cada linha para SINAPI
      const mapeados = revitData.flatMap(row =>
        mapToSinapi(row.categoria, row.quantidade, row.unidade)
      )
      setItens(mapeados)

      // Gerar cronograma 4D
      const { tarefas, totalDias, dataFim } = gerarCronograma(mapeados, new Date())
      setCronograma({ tarefas, totalDias, dataFim })

      setTab('orcamento')
    } catch (e) {
      setErro(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function usarDemo() {
    const demoFile = gerarCSVDemo()
    await processarArquivo(demoFile)
  }

  function handleExportExcel() {
    const porFase = agruparPorFase(itens)
    const total   = itens.reduce((s, i) => s + i.custo_total, 0)
    const total_mo       = itens.reduce((s, i) => s + i.custo_mo * i.quantidade, 0)
    const total_material = itens.reduce((s, i) => s + i.custo_material * i.quantidade, 0)
    exportarExcel(itens, { total, total_mo, total_material, porFase })
  }

  const porFase = agruparPorFase(itens)
  const hasData = itens.length > 0

  return (
    <div className="min-h-screen bg-[#0a0f1e] grid-bg">
      {/* Header */}
      <header className="border-b border-white/8 bg-[#0a0f1e]/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold font-display">5D</span>
            </div>
            <div>
              <h1 className="text-white font-semibold font-display text-base leading-none">
                Orçamentista BIM 5D
              </h1>
              <p className="text-white/30 text-xs mt-0.5">Revit + SINAPI — MVP</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-white/30">
            <span className="px-2 py-1 rounded-md bg-white/5 border border-white/8">SINAPI CE / Mar 2024</span>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/50 hover:text-white/80 transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Upload area */}
        {!hasData && (
          <div className="max-w-2xl mx-auto animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold font-display text-white mb-3">
                <span className="text-gradient">Quantitativos do Revit</span>
                <br />para orçamento em segundos
              </h2>
              <p className="text-white/40 text-sm max-w-md mx-auto">
                Faça upload do Schedule exportado pelo Revit. O sistema cruza automaticamente com as composições da SINAPI e gera orçamento + cronograma.
              </p>
            </div>

            <UploadZone onFile={processarArquivo} loading={loading} />

            {erro && (
              <div className="mt-4 p-3 rounded-lg bg-red-950/30 border border-red-800/30 text-red-300 text-sm">
                ⚠ {erro}
              </div>
            )}

            <div className="mt-4 text-center">
              <button
                onClick={usarDemo}
                disabled={loading}
                className="text-sm text-brand-400 hover:text-brand-300 underline underline-offset-4 transition-colors disabled:opacity-50"
              >
                Não tenho o Revit agora — usar dados de demonstração
              </button>
            </div>

            {/* Features */}
            <div className="mt-10 grid grid-cols-3 gap-3">
              {[
                { icon: '⚡', title: 'Mapeamento automático', desc: 'De-Para inteligente: categoria Revit → código SINAPI' },
                { icon: '📅', title: 'Cronograma 4D',         desc: 'Prazo calculado pela produtividade SINAPI' },
                { icon: '📊', title: 'Exportação completa',   desc: 'Excel com orçamento, fases e de-para' },
              ].map(f => (
                <div key={f.title} className="glass rounded-xl p-4 text-center">
                  <div className="text-2xl mb-2">{f.icon}</div>
                  <p className="text-white/70 font-medium text-xs mb-1">{f.title}</p>
                  <p className="text-white/30 text-xs">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {hasData && (
          <div className="space-y-6">
            {/* File info + actions */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-sinapi-500 animate-pulse-slow"/>
                <span className="text-white/60 text-sm">{fileName}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/30">
                  {itens.length} composições
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportExcel}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-sinapi-700/20 border border-sinapi-600/30 text-sinapi-200 hover:bg-sinapi-700/30 transition-colors"
                >
                  ↓ Excel
                </button>
                <button
                  onClick={() => exportarCSV(itens)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm glass text-white/60 hover:text-white/80 transition-colors"
                >
                  ↓ CSV
                </button>
                <button
                  onClick={() => { setItens([]); setCronograma(null); setFileName(null) }}
                  className="px-4 py-2 rounded-lg text-sm glass text-white/40 hover:text-white/60 transition-colors"
                >
                  Novo arquivo
                </button>
              </div>
            </div>

            {/* KPI cards */}
            <ResumoCards
              itens={itens}
              totalDias={cronograma?.totalDias}
              dataFim={cronograma?.dataFim}
            />

            {/* Tabs */}
            <div className="border-b border-white/8">
              <nav className="flex gap-1">
                {TABS.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`
                      px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px
                      ${tab === t.id
                        ? 'border-brand-500 text-brand-300'
                        : 'border-transparent text-white/40 hover:text-white/60'}
                    `}
                  >
                    {t.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab content */}
            {tab === 'orcamento' && <OrcamentoTable itens={itens} />}
            {tab === 'gantt'     && cronograma && (
              <GanttChart tarefas={cronograma.tarefas} totalDias={cronograma.totalDias} />
            )}
            {tab === 'resumo'    && <FaseChart porFase={porFase} />}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between text-xs text-white/20">
          <span>Orçamentista BIM 5D — MVP Open Source</span>
          <span>SINAPI CE | Dados com fins educacionais</span>
        </div>
      </footer>
    </div>
  )
}
