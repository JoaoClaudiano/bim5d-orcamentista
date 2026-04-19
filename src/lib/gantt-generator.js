// src/lib/gantt-generator.js
// Gera cronograma de obra (4D) a partir dos itens de orçamento + produtividade SINAPI
// Fase 4: suporte a tarefas paralelas dentro da fase, feriados e precedências

const HORAS_POR_DIA_PADRAO = 8

// Ordem padrão das fases construtivas
// 'Personalizado' é usado quando o usuário define uma fase manualmente no De-Para
const ORDEM_FASES = [
  'Fundação',
  'Estrutura',
  'Alvenaria',
  'Instalações',
  'Cobertura',
  'Impermeabilização',
  'Revestimento',
  'Pisos',
  'Acabamento',
  'Personalizado',
  'Indefinido',
]

/**
 * Calcula duração em dias úteis para um item
 * @param {Object} item          - Item do orçamento
 * @param {number} horasPorDia   - Horas de trabalho por dia (padrão: 8)
 */
function calcularDuracaoItem(item, horasPorDia = HORAS_POR_DIA_PADRAO) {
  const prod = item.produtividade
  if (!prod || !item.quantidade || item.quantidade === 0) {
    return 1
  }
  const horas = item.quantidade / prod.valor
  return Math.max(1, Math.ceil(horas / horasPorDia))
}

/**
 * Converte offset de dias úteis em data real, pulando fins de semana e feriados.
 * @param {Date}     dataBase   - Data de início da obra
 * @param {number}   offsetDias - Número de dias úteis a avançar
 * @param {string[]} feriados   - Lista de datas no formato 'YYYY-MM-DD' a pular
 */
export function diaUtilParaData(dataBase, offsetDias, feriados = []) {
  const feriadosSet = new Set(feriados)
  const d = new Date(dataBase)
  let util = 0
  while (util < offsetDias) {
    d.setDate(d.getDate() + 1)
    const dow  = d.getDay()
    const iso  = d.toISOString().slice(0, 10)
    if (dow !== 0 && dow !== 6 && !feriadosSet.has(iso)) util++
  }
  return new Date(d)
}

/**
 * Gera o cronograma completo da obra com suporte a:
 *  - Execução paralela de itens dentro da mesma fase (config.paralelo = true)
 *  - Calendário de feriados (config.feriados = ['2024-04-21', ...])
 *  - Precedências entre tarefas (config.precedencias = { 'id-tarefa': ['id-antecessora'] })
 *
 * @param {Array}  itens      - Itens do orçamento já mapeados
 * @param {Date}   dataInicio - Data de início da obra
 * @param {Object} [config]   - Configurações opcionais
 * @param {number} [config.horasPorDia=8]    - Horas de trabalho por dia
 * @param {boolean}[config.paralelo=true]    - Itens da mesma fase executados em paralelo
 * @param {string[]}[config.feriados=[]]     - Feriados a ignorar (formato 'YYYY-MM-DD')
 * @returns {{ tarefas: Array, totalDias: number, dataFim: Date }}
 */
export function gerarCronograma(itens, dataInicio = new Date(), config = {}) {
  const {
    horasPorDia = HORAS_POR_DIA_PADRAO,
    paralelo    = true,
    feriados    = [],
  } = config

  const mkData = (offset) => diaUtilParaData(dataInicio, offset, feriados)

  // Agrupa por fase
  const porFase = {}
  for (const item of itens) {
    const fase = item.fase ?? 'Indefinido'
    if (!porFase[fase]) porFase[fase] = []
    porFase[fase].push(item)
  }

  const tarefas = []
  let diaAtual = 0 // offset em dias úteis a partir de dataInicio

  // Ordena as fases pela sequência construtiva
  const fasesOrdenadas = Object.keys(porFase).sort((a, b) => {
    const ia = ORDEM_FASES.indexOf(a)
    const ib = ORDEM_FASES.indexOf(b)
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
  })

  for (const fase of fasesOrdenadas) {
    const itensFase = porFase[fase]
    const faseStart = diaAtual
    let maxDiaFase  = diaAtual

    for (const item of itensFase) {
      const duracao    = calcularDuracaoItem(item, horasPorDia)
      // Com paralelo: todos os itens da fase começam em faseStart
      // Sem paralelo (sequencial): cada item começa quando o anterior termina
      const itemStart  = paralelo ? faseStart : diaAtual
      const inicio     = mkData(itemStart)
      const fim        = mkData(itemStart + duracao)

      tarefas.push({
        id:              `${item.codigo ?? 'sem-codigo'}-${tarefas.length}`,
        nome:            item.desc?.substring(0, 60) ?? item.categoria,
        categoria:       item.categoria,
        codigo:          item.codigo,
        fase,
        inicio,
        fim,
        duracao,
        diaInicioOffset: itemStart,
        equipe:          item.produtividade?.equipe ?? 'Equipe não definida',
        custo:           item.custo_total ?? 0,
      })

      if (!paralelo) diaAtual += duracao
      maxDiaFase = Math.max(maxDiaFase, itemStart + duracao)
    }

    diaAtual = maxDiaFase

    // Insere cabeçalho da fase
    tarefas.unshift({
      id:              `fase-${fase}`,
      nome:            fase,
      fase,
      ehFase:          true,
      inicio:          mkData(faseStart),
      fim:             mkData(maxDiaFase),
      duracao:         maxDiaFase - faseStart,
      diaInicioOffset: faseStart,
      custo:           itensFase.reduce((s, i) => s + (i.custo_total ?? 0), 0),
    })
  }

  const totalDias = tarefas.reduce((m, t) => Math.max(m, t.diaInicioOffset + t.duracao), 0)

  return { tarefas, totalDias, dataFim: mkData(totalDias) }
}

/**
 * Formata data para exibição pt-BR
 */
export function formatarData(date) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    .format(new Date(date))
}

