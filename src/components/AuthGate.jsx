import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Auth } from '@supabase/auth-ui-react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({
  user: null,
  session: null,
  isGuest: false,
  signOut: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export default function AuthGate({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(Boolean(supabase))
  const [isGuest, setIsGuest] = useState(false)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      setIsGuest(true)
      return undefined
    }

    let mounted = true

    async function carregarSessao() {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error
        if (!mounted) return
        setSession(data.session ?? null)
      } catch (error) {
        console.error('Erro ao carregar sessão:', error)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    carregarSessao()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setIsGuest(false)
      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const authValue = useMemo(() => ({
    user: session?.user ?? null,
    session,
    isGuest,
    signOut: async () => {
      if (!supabase) return
      try {
        await supabase.auth.signOut()
      } catch (error) {
        console.error('Erro ao encerrar sessão:', error)
      }
    },
  }), [isGuest, session])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] grid-bg flex items-center justify-center">
        <p className="text-white/50 text-sm animate-pulse">Carregando autenticação…</p>
      </div>
    )
  }

  if (supabase && !session && !isGuest) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] grid-bg flex items-center justify-center px-6">
        <div className="w-full max-w-md glass rounded-2xl p-6 space-y-5 border border-white/10">
          <div>
            <h1 className="text-white text-xl font-semibold font-display">Acesse sua conta</h1>
            <p className="text-white/40 text-sm mt-1">Entre para sincronizar seus projetos no Supabase.</p>
          </div>

          <div className="text-white">
            <Auth
              supabaseClient={supabase}
              providers={['google']}
              theme="dark"
            />
          </div>

          <button
            onClick={() => setIsGuest(true)}
            className="w-full px-4 py-2 rounded-lg glass text-sm text-white/70 hover:text-white transition-colors"
          >
            Continuar no modo demo/offline
          </button>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  )
}
