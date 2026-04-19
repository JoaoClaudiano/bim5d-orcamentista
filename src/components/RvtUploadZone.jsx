// src/components/RvtUploadZone.jsx
// Zona de upload para arquivos .rvt — dispara processamento via APS
import { useState, useRef } from 'react'
import { enviarArquivoRvt, aguardarExtracaoRvt } from '../lib/aps-service'

const FASES_STATUS = {
  idle:       { label: 'Enviar arquivo .rvt',  cor: 'text-white/50' },
  uploading:  { label: 'Enviando para APS…',   cor: 'text-brand-300' },
  processing: { label: 'Processando modelo…',  cor: 'text-yellow-300' },
  extracting: { label: 'Extraindo quantitativos…', cor: 'text-sinapi-300' },
  done:       { label: 'Extração concluída!',  cor: 'text-sinapi-400' },
  error:      { label: 'Erro no processamento', cor: 'text-red-400' },
}

export default function RvtUploadZone({ onQuantitativosProntos }) {
  const [fase,       setFase]       = useState('idle')
  const [progresso,  setProgresso]  = useState('')
  const [erro,       setErro]       = useState('')
  const [drag,       setDrag]       = useState(false)
  const inputRef = useRef(null)

  async function processarArquivo(file) {
    if (!file || !file.name.toLowerCase().endsWith('.rvt')) {
      setErro('Por favor, selecione um arquivo .rvt do Revit.')
      return
    }

    setErro('')
    setFase('uploading')
    setProgresso('')

    try {
      // 1. Upload do arquivo para APS
      const { urn } = await enviarArquivoRvt(file)

      setFase('processing')
      setProgresso('Traduzindo modelo 3D…')

      // 2. Aguardar tradução com polling
      const resultado = await aguardarExtracaoRvt(
        urn,
        (status, prog) => {
          setFase(status === 'success' ? 'extracting' : 'processing')
          setProgresso(prog || 'Processando…')
        },
      )

      setFase('done')
      setProgresso(`${resultado.quantitativos?.length ?? 0} categorias extraídas`)

      // 3. Passa os dados para o componente pai
      onQuantitativosProntos?.(resultado.quantitativos ?? [], file.name)
    } catch (e) {
      setFase('error')
      setErro(e.message)
    }
  }

  function handleDrop(e) {
    e.preventDefault()
    setDrag(false)
    processarArquivo(e.dataTransfer.files[0])
  }

  const info = FASES_STATUS[fase]
  const isLoading = ['uploading', 'processing', 'extracting'].includes(fase)

  return (
    <div className="space-y-3">
      {/* Aviso APS */}
      <div className="px-3 py-2 rounded-lg bg-yellow-900/15 border border-yellow-700/20 text-yellow-200/70 text-xs flex items-start gap-2">
        <span className="shrink-0 mt-0.5">⚠</span>
        <span>
          O processamento de arquivos .rvt requer credenciais <strong>Autodesk Platform Services (APS)</strong>.
          Configure <code className="font-mono text-yellow-100">APS_CLIENT_ID</code> e <code className="font-mono text-yellow-100">APS_CLIENT_SECRET</code>{' '}
          nos Secrets do Supabase e faça deploy das Edge Functions (<code className="font-mono text-yellow-100">aps-upload</code>, <code className="font-mono text-yellow-100">aps-extract</code>).
          Veja <code className="font-mono text-yellow-100">supabase/functions/</code> no repositório.
        </span>
      </div>

      {/* Zona de drop */}
      <div
        onClick={() => !isLoading && inputRef.current.click()}
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
        className={`
          relative cursor-pointer rounded-2xl p-10 text-center transition-all duration-300
          border-2 border-dashed
          ${drag
            ? 'border-yellow-400 bg-yellow-950/20 scale-[1.01]'
            : 'border-white/10 hover:border-yellow-500/40 hover:bg-white/[0.02]'}
          ${isLoading ? 'pointer-events-none opacity-70' : ''}
        `}
      >
        {/* Ícone */}
        <div className={`mx-auto mb-4 w-16 h-16 rounded-2xl flex items-center justify-center
          ${fase === 'done' ? 'bg-sinapi-900/40 border border-sinapi-700/40' : 'bg-yellow-900/20 border border-yellow-700/20'}`}>
          {isLoading ? (
            <svg className="w-7 h-7 text-yellow-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
          ) : fase === 'done' ? (
            <svg className="w-7 h-7 text-sinapi-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          ) : (
            <svg className="w-7 h-7 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"/>
            </svg>
          )}
        </div>

        <p className={`font-medium text-base mb-1 ${info.cor}`}>{info.label}</p>
        <p className="text-white/40 text-sm">
          {isLoading ? progresso || 'Aguarde…' : 'Arquivo .rvt — arraste ou clique'}
        </p>

        {!isLoading && fase !== 'done' && (
          <div className="mt-5 flex justify-center">
            <span className="text-xs px-3 py-1 rounded-full bg-yellow-900/20 border border-yellow-700/20 text-yellow-200/50">
              .rvt (Revit)
            </span>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept=".rvt"
          className="hidden"
          onChange={e => processarArquivo(e.target.files[0])}
        />
      </div>

      {erro && (
        <div className="px-3 py-2 rounded-lg bg-red-900/15 border border-red-700/20 text-red-300 text-xs">
          {erro}
          <button
            onClick={() => { setFase('idle'); setErro('') }}
            className="ml-3 underline hover:text-red-200"
          >
            Tentar novamente
          </button>
        </div>
      )}
    </div>
  )
}
