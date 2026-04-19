// src/lib/aps-service.js
// Cliente Autodesk Platform Services (APS / Forge)
// Usa Supabase Edge Functions como proxy para proteger as credenciais APS

import { supabase } from './supabase'
import { logError } from './telemetry'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

/**
 * Chama uma Edge Function do Supabase com método e payload.
 * Inclui o token de autenticação automaticamente.
 */
async function callEdgeFunction(nome, body, options = {}) {
  if (!supabase || !SUPABASE_URL) {
    throw new Error('Supabase não configurado. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.')
  }

  const { data: { session } } = await supabase.auth.getSession()
  const authHeader = session?.access_token ? `Bearer ${session.access_token}` : ''

  const resp = await fetch(`${SUPABASE_URL}/functions/v1/${nome}`, {
    method: 'POST',
    headers: {
      ...(!options.isFormData && { 'Content-Type': 'application/json' }),
      ...(authHeader && { Authorization: authHeader }),
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
    },
    body: options.isFormData ? body : JSON.stringify(body),
  })

  if (!resp.ok) {
    const texto = await resp.text().catch(() => resp.statusText)
    throw new Error(`Edge Function ${nome} retornou ${resp.status}: ${texto}`)
  }

  return resp.json()
}

/**
 * Envia o arquivo .rvt para processamento no APS.
 * Retorna { urn, jobId, status } para uso em polling.
 *
 * @param {File} arquivo - Arquivo .rvt
 * @returns {Promise<{ urn: string, jobId: string, status: string }>}
 */
export async function enviarArquivoRvt(arquivo) {
  try {
    const formData = new FormData()
    formData.append('file', arquivo, arquivo.name)
    formData.append('filename', arquivo.name)

    const resultado = await callEdgeFunction('aps-upload', formData, { isFormData: true })
    return resultado
  } catch (e) {
    logError('aps_upload', e.message, { filename: arquivo?.name })
    throw e
  }
}

/**
 * Consulta o status da tradução e (quando completa) retorna os quantitativos extraídos.
 * Deve ser chamado em polling até status === 'success' ou 'failed'.
 *
 * @param {string} urn    - URN do modelo no APS
 * @returns {Promise<{ status: 'pending'|'inprogress'|'success'|'failed', progress?: string, quantitativos?: Array }>}
 */
export async function consultarExtracaoRvt(urn) {
  try {
    return await callEdgeFunction('aps-extract', { urn })
  } catch (e) {
    logError('aps_extract', e.message, { urn })
    throw e
  }
}

/**
 * Aguarda a conclusão da tradução APS fazendo polling.
 * Chama onProgress(status, progress) a cada iteração.
 *
 * @param {string}   urn         - URN retornado por enviarArquivoRvt
 * @param {Function} onProgress  - Callback chamado com (status, progressStr)
 * @param {number}   [timeout=300000] - Timeout máximo em ms (padrão 5 min)
 */
export async function aguardarExtracaoRvt(urn, onProgress, timeout = 300_000) {
  const inicio = Date.now()
  const INTERVALO = 5_000  // 5 segundos

  while (Date.now() - inicio < timeout) {
    const resultado = await consultarExtracaoRvt(urn)
    onProgress?.(resultado.status, resultado.progress ?? '')

    if (resultado.status === 'success') return resultado
    if (resultado.status === 'failed') throw new Error('Tradução APS falhou.')

    await new Promise(r => setTimeout(r, INTERVALO))
  }

  throw new Error('Timeout: extração APS demorou mais de 5 minutos.')
}
