// src/components/EquipeSelector.jsx
// Componente para criar/entrar em equipes e compartilhar De-Para
import { useState } from 'react'
import { supabase } from '../lib/supabase'

const input = 'w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white/80 text-sm outline-none focus:border-brand-500/60 placeholder-white/30'
const btn   = 'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50'

export default function EquipeSelector({ user, equipeAtual, onEquipeMudou }) {
  const [modo,    setModo]    = useState(null)   // 'criar' | 'entrar' | null
  const [nome,    setNome]    = useState('')
  const [codigo,  setCodigo]  = useState('')
  const [loading, setLoading] = useState(false)
  const [erro,    setErro]    = useState('')
  const [sucesso, setSucesso] = useState('')

  if (!supabase || !user) return null

  async function criarEquipe() {
    if (!nome.trim()) { setErro('Informe um nome para a equipe.'); return }
    setLoading(true); setErro(''); setSucesso('')
    try {
      const slug = nome.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') +
                   '-' + Math.random().toString(36).slice(2, 7)
      const { data: equipe, error: errE } = await supabase
        .from('equipes')
        .insert({ nome: nome.trim(), codigo: slug, criador_id: user.id })
        .select('*').single()
      if (errE) throw errE

      await supabase.from('equipe_membros').insert({ equipe_id: equipe.id, user_id: user.id, papel: 'admin' })
      setSucesso(`Equipe criada! Compartilhe o código: ${equipe.codigo}`)
      onEquipeMudou?.(equipe)
      setModo(null); setNome('')
    } catch (e) {
      setErro(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function entrarEquipe() {
    if (!codigo.trim()) { setErro('Informe o código da equipe.'); return }
    setLoading(true); setErro(''); setSucesso('')
    try {
      const { data: equipe, error: errE } = await supabase
        .from('equipes').select('*').eq('codigo', codigo.trim().toLowerCase()).single()
      if (errE) throw new Error('Equipe não encontrada. Verifique o código.')

      const { error: errM } = await supabase
        .from('equipe_membros').insert({ equipe_id: equipe.id, user_id: user.id, papel: 'membro' })
      if (errM && errM.code !== '23505') throw errM   // 23505 = duplicate (já é membro)

      setSucesso(`Você entrou na equipe: ${equipe.nome}`)
      onEquipeMudou?.(equipe)
      setModo(null); setCodigo('')
    } catch (e) {
      setErro(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass rounded-xl border border-white/8 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-white/70 text-sm font-medium">Equipe</p>
          {equipeAtual
            ? <p className="text-brand-400 text-xs mt-0.5">{equipeAtual.nome} · código: <span className="font-mono">{equipeAtual.codigo}</span></p>
            : <p className="text-white/30 text-xs mt-0.5">Sem equipe (De-Para apenas pessoal)</p>
          }
        </div>

        {!modo && (
          <div className="flex gap-2">
            <button onClick={() => { setModo('criar'); setErro(''); setSucesso('') }}
              className={`${btn} bg-brand-700/20 border border-brand-600/30 text-brand-200 hover:bg-brand-700/30`}>
              + Criar
            </button>
            <button onClick={() => { setModo('entrar'); setErro(''); setSucesso('') }}
              className={`${btn} glass text-white/60 hover:text-white/80`}>
              Entrar
            </button>
          </div>
        )}
      </div>

      {modo === 'criar' && (
        <div className="space-y-2 animate-fade-in">
          <input value={nome} onChange={e => setNome(e.target.value)}
            placeholder="Nome da equipe / empresa"
            className={input} />
          <div className="flex gap-2">
            <button onClick={criarEquipe} disabled={loading}
              className={`${btn} bg-brand-700/30 border border-brand-600/40 text-brand-200 hover:bg-brand-700/40`}>
              {loading ? 'Criando…' : 'Criar equipe'}
            </button>
            <button onClick={() => { setModo(null); setErro('') }}
              className={`${btn} glass text-white/50`}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {modo === 'entrar' && (
        <div className="space-y-2 animate-fade-in">
          <input value={codigo} onChange={e => setCodigo(e.target.value)}
            placeholder="Código da equipe"
            className={`${input} font-mono`} />
          <div className="flex gap-2">
            <button onClick={entrarEquipe} disabled={loading}
              className={`${btn} bg-sinapi-700/20 border border-sinapi-600/30 text-sinapi-200 hover:bg-sinapi-700/30`}>
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
            <button onClick={() => { setModo(null); setErro('') }}
              className={`${btn} glass text-white/50`}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {erro    && <p className="text-red-300 text-xs">{erro}</p>}
      {sucesso && <p className="text-sinapi-300 text-xs">{sucesso}</p>}
    </div>
  )
}
