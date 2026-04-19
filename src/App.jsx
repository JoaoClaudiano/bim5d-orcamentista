// src/App.jsx
import { useEffect, useMemo, useState } from 'react'
import UploadZone from './components/UploadZone'
import OrcamentoTable from './components/OrcamentoTable'
import ResumoCards from './components/ResumoCards'
import GanttChart from './components/GanttChart'
import FaseChart from './components/FaseChart'
import ProjetosSidebar from './components/ProjetosSidebar'
import EstadoSelector from './components/EstadoSelector'
import { useAuth } from './components/AuthGate'
import { useDepara } from './hooks/useDepara'
import { parseRevitFile, gerarCSVDemo } from './lib/revit-parser'
import { agruparPorFase, mapToSinapiComCustom } from './lib/sinapi-mapper'
import { gerarCronograma } from './lib/gantt-generator'
import { exportarExcel, exportarCSV } from './lib/export'
import { deletarProjeto, listarProjetos, salvarProjeto } from './lib/projetos-service'
import { atingiuLimiteProjetos, obterPlanoUsuario, PLANOS } from './lib/planos'
import { carregarSinapiDB } from './lib/sinapi-service'
import { logError, logProcessing } from './lib/telemetry'

const TABS = [
  { id: 'orcamento', label: 'Orçamento', icon: '₿' },
  { id: 'gantt', label: 'Cronograma', icon: '📅' },
  { id: 'resumo', label: 'Distribuição', icon: '◉' },
]

export default function App() {
  const { user, signOut } = useAuth()
  const { depara, salvarDepara } = useDepara()

  const [itens, setItens] = useState([])
  const [cronograma, setCronograma] = useState(null)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState(null)
  const [tab, setTab] = useState('orcamento')
  const [fileName, setFileName] = useState(null)

  const [projetos, setProjetos] = useState([])
  const [loadingProjetos, setLoadingProjetos] = useState(false)
  const [projetoAtualId, setProjetoAtualId] = useState(null)
  const [limiteAtingido, setLimiteAtingido] = useState(false)

  // SINAPI — UF, mês de referência e base carregada
  const [estado, setEstado] = useState('CE')
  const [referencia, setReferencia] = useState('2024-03')
  const [sinapiDB, setSinapiDB] = useState(null)
  const [loadingSinapi, setLoadingSinapi] = useState(false)

  // Data de início do cronograma (Gantt)
  const [dataInicio, setDataInicio] = useState(() => new Date().toISOString().split('T')[0])

  const planoUsuario = useMemo(() => obterPlanoUsuario(user), [user])

  useEffect(() => {
    async function carregarProjetos() {
      if (!user) {
        setProjetos([])
        setProjetoAtualId(null)
        return
      }

      setLoadingProjetos(true)
      try {
        const data = await listarProjetos()
        setProjetos(data)
      } catch (error) {
        setErro(error.message)
      } finally {
        setLoadingProjetos(false)
      }
    }

    carregarProjetos()
  }, [user])

  // Carrega a base SINAPI sempre que estado ou referência mudar
  useEffect(() => {
    let cancelled = false
    async function loadSinapi() {
      setLoadingSinapi(true)
      try {
        const db = await carregarSinapiDB(estado, referencia)
        if (!cancelled) setSinapiDB(db)
      } catch (e) {
        logError('sinapi_load', e.message, { estado, referencia })
      } finally {
        if (!cancelled) setLoadingSinapi(false)
      }
    }
    loadSinapi()
    return () => { cancelled = true }
  }, [estado, referencia])

  async function mapearItens(revitData) {
    const resultado = []

    for (const row of revitData) {
      const mapeados = await mapToSinapiComCustom(
        row.categoria,
        row.quantidade,
        row.unidade,
        depara,
        sinapiDB || undefined,
      )
      resultado.push(...mapeados)
    }

    return resultado
  }

  function resolverDataInicio() {
    // Usa a data selecionada pelo usuário; cria no meio-dia para evitar
    // ambiguidade de fuso horário ao converter de string ISO
    return dataInicio ? new Date(`${dataInicio}T12:00:00`) : new Date()
  }

  function atualizarEstadoProjeto(nomeArquivo, mapeados) {
    setItens(mapeados)

    const startDate = resolverDataInicio()
    const { tarefas, totalDias, dataFim } = gerarCronograma(mapeados, startDate)
    setCronograma({ tarefas, totalDias, dataFim })

    setFileName(nomeArquivo)
    setTab('orcamento')

    return { tarefas, totalDias, dataFim }
  }

  async function tentarSalvarProjetoNovo({ nome, arquivoNome, itensProjeto, cronogramaProjeto }) {
    if (!user) return

    if (atingiuLimiteProjetos(projetos.length, planoUsuario)) {
      setLimiteAtingido(true)
      return
    }

    try {
      const salvo = await salvarProjeto({
        nome,
        arquivoNome,
        itens: itensProjeto,
        cronograma: cronogramaProjeto,
      })

      if (salvo) {
        setProjetoAtualId(salvo.id)
        setProjetos(prev => [salvo, ...prev])
      }
    } catch (error) {
      setErro(error.message)
    }
  }

  async function processarArquivo(file) {
    setErro(null)
    setLimiteAtingido(false)
    setLoading(true)
    const t0 = performance.now()

    try {
      const revitData = await parseRevitFile(file)
      if (!revitData.length) {
        setErro(
          'Nenhum dado encontrado no arquivo. ' +
          'Certifique-se de exportar o Schedule pelo Revit com as colunas Category, Family e uma coluna de quantidade (Area, Volume ou Count).',
        )
        return
      }

      const mapeados = await mapearItens(revitData)
      const cronogramaGerado = atualizarEstadoProjeto(file.name, mapeados)
      setProjetoAtualId(null)

      // Telemetria
      const unmapped = mapeados.filter(i => i.confianca === 'baixa').length
      logProcessing({
        totalRows: revitData.length,
        mappedRows: mapeados.length - unmapped,
        unmappedRows: unmapped,
        ms: Math.round(performance.now() - t0),
        estado,
        referencia,
      })

      await tentarSalvarProjetoNovo({
        nome: file.name,
        arquivoNome: file.name,
        itensProjeto: mapeados,
        cronogramaProjeto: cronogramaGerado,
      })
    } catch (e) {
      logError('process_file', e.message, { fileName: file?.name })
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
    const total = itens.reduce((s, i) => s + i.custo_total, 0)
    const total_mo = itens.reduce((s, i) => s + i.custo_mo * i.quantidade, 0)
    const total_material = itens.reduce((s, i) => s + i.custo_material * i.quantidade, 0)
    exportarExcel(itens, { total, total_mo, total_material, porFase })
  }

  async function handleSelecionarProjeto(projeto) {
    try {
      setErro(null)
      setProjetoAtualId(projeto.id)
      setTab('orcamento')
      setFileName(projeto.arquivo_nome || projeto.nome)
      setItens(Array.isArray(projeto.itens) ? projeto.itens : [])
      setCronograma(projeto.cronograma || null)
    } catch (error) {
      setErro('Não foi possível carregar este projeto.')
    }
  }

  async function handleDeletarProjeto(id) {
    try {
      await deletarProjeto(id)
      setProjetos(prev => prev.filter(p => p.id !== id))
      if (projetoAtualId === id) {
        handleNovoProjeto()
      }
    } catch (error) {
      setErro(error.message)
    }
  }

  function handleNovoProjeto() {
    setProjetoAtualId(null)
    setItens([])
    setCronograma(null)
    setFileName(null)
    setErro(null)
    setTab('orcamento')
  }

  async function handleCorrigirDepara(item, index, codigo) {
    try {
      await salvarDepara(item.categoria, codigo)
      const corrigido = await mapToSinapiComCustom(
        item.categoria,
        item.quantidade,
        item.unidade,
        [{ categoria: item.categoria, codigo_sinapi: codigo, codigo }],
        sinapiDB || undefined,
      )

      const novoItem = {
        ...corrigido[0],
        fase: item.fase === 'Indefinido' ? corrigido[0].fase : item.fase,
        confianca: 'alta',
      }

      const novosItens = itens.map((atual, i) => (i === index ? novoItem : atual))
      setItens(novosItens)

      const novoCronograma = gerarCronograma(novosItens, resolverDataInicio())
      setCronograma(novoCronograma)

      if (user && projetoAtualId) {
        const atualizado = await salvarProjeto({
          id: projetoAtualId,
          nome: fileName || 'Projeto sem nome',
          arquivoNome: fileName,
          itens: novosItens,
          cronograma: novoCronograma,
        })
        if (atualizado) {
          setProjetos(prev => prev.map(p => (p.id === atualizado.id ? atualizado : p)))
        }
      }
    } catch (error) {
      setErro(error.message)
    }
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

          <div className="flex items-center gap-2 text-xs text-white/30 flex-wrap">
            <EstadoSelector
              estado={estado}
              referencia={referencia}
              loading={loadingSinapi}
              onChange={({ estado: uf, referencia: ref }) => {
                setEstado(uf)
                setReferencia(ref)
              }}
            />

            <div className="flex items-center gap-1.5">
              <span className="text-white/20 hidden sm:inline">Início:</span>
              <input
                type="date"
                value={dataInicio}
                onChange={e => setDataInicio(e.target.value)}
                aria-label="Data de início da obra"
                className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-white/70 text-xs outline-none focus:border-brand-500/60 cursor-pointer"
              />
            </div>

            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/50 hover:text-white/80 transition-colors"
            >
              GitHub
            </a>
            {user && (
              <button
                onClick={signOut}
                className="px-3 py-1.5 rounded-lg bg-red-900/20 border border-red-700/40 hover:bg-red-900/35 text-red-200 transition-colors"
              >
                Sair
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {limiteAtingido && (
          <div className="glass rounded-xl border border-yellow-700/30 bg-yellow-950/20 p-4 flex items-center justify-between gap-4 flex-wrap animate-fade-in">
            <p className="text-yellow-100 text-sm">
              Você atingiu o limite de 3 projetos gratuitos. Faça upgrade para o plano Pro para projetos ilimitados.
            </p>
            <a
              href="#planos"
              className="px-3 py-1.5 rounded-lg text-sm bg-yellow-700/30 border border-yellow-600/40 text-yellow-100 hover:bg-yellow-700/40 transition-colors"
            >
              Ver planos
            </a>
          </div>
        )}

        <div className={user ? 'grid lg:grid-cols-[280px_minmax(0,1fr)] gap-6' : ''}>
          {user && (
            <ProjetosSidebar
              projetos={projetos}
              projetoAtualId={projetoAtualId}
              onNovoProjeto={handleNovoProjeto}
              onSelecionarProjeto={handleSelecionarProjeto}
              onDeletarProjeto={handleDeletarProjeto}
              loading={loadingProjetos}
            />
          )}

          <div className="space-y-8">
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
                    { icon: '📅', title: 'Cronograma 4D', desc: 'Prazo calculado pela produtividade SINAPI' },
                    { icon: '📊', title: 'Exportação completa', desc: 'Excel com orçamento, fases e de-para' },
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
                    <div className="w-2 h-2 rounded-full bg-sinapi-500 animate-pulse-slow" />
                    <span className="text-white/60 text-sm">{fileName}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/30">
                      {itens.length} composições
                    </span>
                    {user && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/40">
                        Plano {planoUsuario.nome} {planoUsuario.id === 'free' ? `(${projetos.length}/${PLANOS.free.limiteProjetos})` : '(ilimitado)'}
                      </span>
                    )}
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
                      onClick={handleNovoProjeto}
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
                {tab === 'orcamento' && (
                  <OrcamentoTable
                    itens={itens}
                    onCorrigirDepara={handleCorrigirDepara}
                  />
                )}
                {tab === 'gantt' && cronograma && (
                  <GanttChart tarefas={cronograma.tarefas} totalDias={cronograma.totalDias} />
                )}
                {tab === 'resumo' && <FaseChart porFase={porFase} />}
              </div>
            )}
          </div>
        </div>

        {erro && hasData && (
          <div className="p-3 rounded-lg bg-red-950/30 border border-red-800/30 text-red-300 text-sm">
            ⚠ {erro}
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
