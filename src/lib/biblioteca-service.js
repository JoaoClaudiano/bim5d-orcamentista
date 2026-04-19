// src/lib/biblioteca-service.js
// Carrega composições SINAPI da biblioteca local (public/biblioteca/sinapi/)
// Serve como fallback secundário: Supabase → biblioteca local → dados estáticos

const _cache = {}

/**
 * Retorna o manifest (index.json) da biblioteca.
 */
export async function carregarIndice() {
  if (_cache['_index']) return _cache['_index']
  try {
    const resp = await fetch('./biblioteca/sinapi/index.json')
    if (!resp.ok) return null
    const data = await resp.json()
    _cache['_index'] = data
    return data
  } catch {
    return null
  }
}

/**
 * Verifica se existe um dataset na biblioteca para a UF e referência.
 */
export async function existeNaBiblioteca(estado, referencia) {
  const idx = await carregarIndice()
  if (!idx) return false
  return idx.datasets.some(d => d.estado === estado && d.referencia === referencia)
}

/**
 * Carrega composições da biblioteca para o estado e referência.
 * Retorna um objeto indexado por código SINAPI, ou null se não disponível.
 */
export async function carregarBiblioteca(estado = 'CE', referencia = '2024-03') {
  const key = `${estado}:${referencia}`
  if (_cache[key]) return _cache[key]

  try {
    const resp = await fetch(`./biblioteca/sinapi/${estado}_${referencia}.json`)
    if (!resp.ok) return null
    const data = await resp.json()
    if (!data?.composicoes?.length) return null

    const db = {}
    for (const c of data.composicoes) {
      db[c.codigo] = {
        codigo:     c.codigo,
        desc:       c.descricao,
        unidade:    c.unidade,
        custo_total: parseFloat(c.custo_total),
        mo:          parseFloat(c.mo),
        material:    parseFloat(c.material),
        estado,
      }
    }

    _cache[key] = db
    return db
  } catch {
    return null
  }
}

/**
 * Invalida o cache da biblioteca para forçar nova leitura
 */
export function limparCacheBiblioteca(estado, referencia) {
  if (estado && referencia) {
    delete _cache[`${estado}:${referencia}`]
  } else {
    for (const k of Object.keys(_cache)) delete _cache[k]
  }
}
