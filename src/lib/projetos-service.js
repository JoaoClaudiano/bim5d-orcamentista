import { supabase } from './supabase'

async function getUsuarioAtual() {
  if (!supabase) return null
  const { data, error } = await supabase.auth.getUser()
  if (error) throw error
  return data.user ?? null
}

export async function listarProjetos() {
  try {
    if (!supabase) return []

    const user = await getUsuarioAtual()
    if (!user) return []

    const { data, error } = await supabase
      .from('projetos')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) throw error
    return data ?? []
  } catch (error) {
    console.error('Erro ao listar projetos:', error)
    throw new Error('Não foi possível carregar os projetos.', { cause: error })
  }
}

export async function salvarProjeto({ id, nome, arquivoNome, itens, cronograma }) {
  try {
    if (!supabase) return null

    const user = await getUsuarioAtual()
    if (!user) return null

    const payload = {
      ...(id ? { id } : {}),
      user_id: user.id,
      nome,
      arquivo_nome: arquivoNome ?? null,
      itens: itens ?? [],
      cronograma: cronograma ?? null,
    }

    const { data, error } = await supabase
      .from('projetos')
      .upsert(payload, { onConflict: 'id' })
      .select('*')
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Erro ao salvar projeto:', error)
    throw new Error('Não foi possível salvar o projeto.', { cause: error })
  }
}

export async function deletarProjeto(id) {
  try {
    if (!supabase) return false

    const user = await getUsuarioAtual()
    if (!user) return false

    const { error } = await supabase
      .from('projetos')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Erro ao deletar projeto:', error)
    throw new Error('Não foi possível deletar o projeto.', { cause: error })
  }
}
