import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

function normalizarCategoria(categoria) {
  return (categoria || '').toLowerCase().trim()
}

export function useDepara() {
  const [depara, setDepara] = useState([])

  const carregarDepara = useCallback(async () => {
    try {
      if (!supabase) {
        setDepara([])
        return
      }

      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!userData.user) {
        setDepara([])
        return
      }

      const { data, error } = await supabase
        .from('depara_custom')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('updated_at', { ascending: false })

      if (error) throw error
      setDepara(data ?? [])
    } catch (error) {
      console.error('Erro ao carregar De-Para customizado:', error)
    }
  }, [])

  useEffect(() => {
    carregarDepara()

    if (!supabase) return undefined

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      carregarDepara()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [carregarDepara])

  const salvarDepara = useCallback(async (categoria, codigo) => {
    try {
      if (!supabase) return null

      const categoriaNormalizada = normalizarCategoria(categoria)
      const codigoLimpo = (codigo || '').trim()
      if (!categoriaNormalizada || !codigoLimpo) return null

      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!userData.user) return null

      const payload = {
        user_id: userData.user.id,
        categoria,
        categoria_normalizada: categoriaNormalizada,
        codigo_sinapi: codigoLimpo,
      }

      const { data, error } = await supabase
        .from('depara_custom')
        .upsert(payload, { onConflict: 'user_id,categoria_normalizada' })
        .select('*')
        .single()

      if (error) throw error
      setDepara(prev => {
        const semAtual = prev.filter(item => item.categoria_normalizada !== categoriaNormalizada)
        return [data, ...semAtual]
      })

      return data
    } catch (error) {
      console.error('Erro ao salvar De-Para customizado:', error)
      throw new Error('Não foi possível salvar a correção.', { cause: error })
    }
  }, [])

  const removerDepara = useCallback(async (categoria) => {
    try {
      if (!supabase) return false

      const categoriaNormalizada = normalizarCategoria(categoria)
      if (!categoriaNormalizada) return false

      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!userData.user) return false

      const { error } = await supabase
        .from('depara_custom')
        .delete()
        .eq('user_id', userData.user.id)
        .eq('categoria_normalizada', categoriaNormalizada)

      if (error) throw error

      setDepara(prev => prev.filter(item => item.categoria_normalizada !== categoriaNormalizada))
      return true
    } catch (error) {
      console.error('Erro ao remover De-Para customizado:', error)
      throw new Error('Não foi possível remover a correção.', { cause: error })
    }
  }, [])

  return { depara, salvarDepara, removerDepara }
}
