function formatarData(dataIso) {
  if (!dataIso) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dataIso))
}

export default function ProjetosSidebar({
  projetos,
  projetoAtualId,
  onNovoProjeto,
  onSelecionarProjeto,
  onDeletarProjeto,
  loading,
}) {
  return (
    <aside className="glass rounded-2xl border border-white/10 p-4 h-fit sticky top-24 animate-slide-in">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="text-white/80 text-sm font-medium">Projetos salvos</h3>
        <button
          onClick={onNovoProjeto}
          className="px-2.5 py-1 rounded-md bg-brand-700/20 border border-brand-600/40 text-brand-200 text-xs hover:bg-brand-700/30 transition-colors"
        >
          Novo projeto
        </button>
      </div>

      {loading && (
        <p className="text-xs text-white/40 py-3">Carregando projetos…</p>
      )}

      {!loading && projetos.length === 0 && (
        <p className="text-xs text-white/35 py-3">
          Nenhum projeto salvo ainda.
        </p>
      )}

      <div className="space-y-2 max-h-[60vh] overflow-auto pr-1">
        {projetos.map((projeto) => (
          <div
            key={projeto.id}
            className={`rounded-lg border p-2.5 transition-colors ${
              projetoAtualId === projeto.id
                ? 'border-brand-500/50 bg-brand-900/20'
                : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
            }`}
          >
            <button
              onClick={() => onSelecionarProjeto(projeto)}
              className="w-full text-left"
            >
              <p className="text-sm text-white/80 truncate" title={projeto.nome}>{projeto.nome}</p>
              <p className="text-xs text-white/35 truncate" title={projeto.arquivo_nome || projeto.nome}>
                {projeto.arquivo_nome || projeto.nome}
              </p>
              <p className="text-[11px] text-white/25 mt-1">
                Atualizado em {formatarData(projeto.updated_at)}
              </p>
            </button>

            <div className="mt-2 pt-2 border-t border-white/10 flex justify-end">
              <button
                onClick={() => {
                  const confirmou = window.confirm(`Deseja realmente deletar o projeto "${projeto.nome}"?`)
                  if (confirmou) onDeletarProjeto(projeto.id)
                }}
                className="text-[11px] px-2 py-1 rounded-md bg-red-900/20 border border-red-700/30 text-red-300 hover:bg-red-900/35 transition-colors"
              >
                Deletar
              </button>
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}
