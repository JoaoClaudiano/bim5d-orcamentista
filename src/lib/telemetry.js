// src/lib/telemetry.js
// Métricas de sessão em memória — sem envio externo de dados
// Útil para debug, monitorar taxa de mapeamento e rastrear erros

const _session = {
  startedAt: Date.now(),
  errors: [],
  processingRuns: [],
}

/**
 * Registra um erro ocorrido durante o processamento
 * @param {string} type   - Categoria do erro (ex: 'parse_error', 'sinapi_fetch')
 * @param {string} detail - Mensagem ou stack do erro
 * @param {Object} [ctx]  - Contexto adicional (estado, arquivo, etc.)
 */
export function logError(type, detail, ctx = {}) {
  const entry = { type, detail, ...ctx, ts: Date.now() }
  _session.errors.push(entry)
  console.warn('[BIM5D]', type, detail, ctx)
}

/**
 * Registra métricas de uma execução de processamento de arquivo
 * @param {Object} params
 * @param {number} params.totalRows     - Total de linhas lidas do arquivo
 * @param {number} params.mappedRows    - Linhas mapeadas com sucesso (confiança alta/média)
 * @param {number} params.unmappedRows  - Linhas sem correspondência (confiança baixa)
 * @param {number} params.ms            - Tempo de processamento em milissegundos
 * @param {string} params.estado        - UF de referência SINAPI
 * @param {string} params.referencia    - Mês/ano de referência SINAPI (ex: '2024-03')
 */
export function logProcessing({ totalRows, mappedRows, unmappedRows, ms, estado, referencia }) {
  const matchRate = totalRows > 0 ? Math.round((mappedRows / totalRows) * 100) : 0
  const entry = { totalRows, mappedRows, unmappedRows, matchRate, ms, estado, referencia, ts: Date.now() }
  _session.processingRuns.push(entry)
  console.info(
    `[BIM5D] Processamento: ${mappedRows}/${totalRows} composições mapeadas (${matchRate}%) em ${ms}ms [SINAPI ${estado} ${referencia}]`,
  )
}

/**
 * Retorna as métricas acumuladas da sessão atual
 * @returns {{ sessionAge: number, errorCount: number, runs: number, lastRun: Object|null, errors: Object[] }}
 */
export function getSessionMetrics() {
  return {
    sessionAge: Date.now() - _session.startedAt,
    errorCount: _session.errors.length,
    runs: _session.processingRuns.length,
    lastRun: _session.processingRuns.at(-1) ?? null,
    errors: [..._session.errors],
  }
}
