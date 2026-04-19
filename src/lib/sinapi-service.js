// src/lib/sinapi-service.js
// Serviço de carregamento da base SINAPI
// Prioridade: Supabase → biblioteca local (public/biblioteca/sinapi/) → dados estáticos

import { supabase } from './supabase'
import { SINAPI_DB as localDB } from './sinapi-local-db'
import { carregarBiblioteca } from './biblioteca-service'
import { logError } from './telemetry'

// Cache em memória para a sessão (evita múltiplas consultas ao Supabase)
const _cache = {}

/**
 * Carrega a base SINAPI para um estado e referência específicos.
 * Tenta o Supabase primeiro; usa os dados locais como fallback.
 *
 * @param {string} estado     - Sigla da UF (ex: 'CE', 'SP')
 * @param {string} referencia - Mês de referência no formato 'YYYY-MM' (ex: '2024-03')
 * @returns {Promise<Object>} Objeto indexado por código SINAPI com mesma estrutura de SINAPI_DB
 */
export async function carregarSinapiDB(estado = 'CE', referencia = '2024-03') {
  const key = `${estado}:${referencia}`
  if (_cache[key]) return _cache[key]

  if (!supabase) {
    // Sem Supabase: tentar biblioteca local, depois fallback estático
    const bibliotecaDB = await carregarBiblioteca(estado, referencia)
    if (bibliotecaDB) { _cache[key] = bibliotecaDB; return bibliotecaDB }
    return localDB
  }

  try {
    const { data, error } = await supabase
      .from('sinapi_composicoes')
      .select('codigo, descricao, unidade, custo_total, mo, material, estado')
      .eq('estado', estado)
      .eq('referencia', referencia)

    if (error) {
      logError('sinapi_fetch', error.message, { estado, referencia })
      return localDB
    }

    if (!data?.length) {
      // Dados ainda não importados para esta UF/referência — tentar biblioteca local
      const bibliotecaDB = await carregarBiblioteca(estado, referencia)
      if (bibliotecaDB) {
        _cache[key] = bibliotecaDB
        return bibliotecaDB
      }
      return localDB
    }

    const db = {}
    for (const row of data) {
      db[row.codigo] = {
        codigo: row.codigo,
        desc: row.descricao,
        unidade: row.unidade,
        custo_total: parseFloat(row.custo_total),
        mo: parseFloat(row.mo),
        material: parseFloat(row.material),
        estado: row.estado,
      }
    }

    _cache[key] = db
    return db
  } catch (e) {
    logError('sinapi_fetch_exception', e.message, { estado, referencia })
    // Tentar biblioteca local antes de usar dados estáticos CE
    const bibliotecaDB = await carregarBiblioteca(estado, referencia)
    return bibliotecaDB ?? localDB
  }
}

/**
 * Invalida o cache para forçar nova leitura do Supabase
 * @param {string} [estado]     - Se fornecido, invalida apenas a chave específica
 * @param {string} [referencia] - Se fornecido, invalida apenas a chave específica
 */
export function limparCacheSinapi(estado, referencia) {
  if (estado && referencia) {
    delete _cache[`${estado}:${referencia}`]
  } else {
    for (const k of Object.keys(_cache)) delete _cache[k]
  }
}
