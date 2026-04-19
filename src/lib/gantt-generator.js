// src/lib/gantt-generator.js
// Gera cronograma de obra (4D) a partir dos itens de orçamento + produtividade SINAPI

const HORAS_POR_DIA_PADRAO = 8
const _DIAS_POR_SEMANA     = 5 // segunda a sexta (referência; weekend skipping usa getDay())

// Ordem padrão das fases construtivas
const ORDEM_FASES = [
  'Estrutura',
  'Alvenaria',
  'Instalações',
  'Cobertura',
  'Revestimento',
  'Pisos',
  'Acabamento',
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
 * Gera o cronograma completo da obra
 * @param {Array}  itens      - Itens do orçamento já mapeados
 * @param {Date}   dataInicio - Data de início da obra
 * @param {Object} [config]   - Configurações opcionais
 * @param {number} [config.horasPorDia=8] - Horas de trabalho por dia
 * @returns {{ tarefas: Array, totalDias: number, dataFim: Date }}
 */
export function gerarCronograma(itens, dataInicio = new Date(), config = {}) {
  const { horasPorDia = HORAS_POR_DIA_PADRAO } = config
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
    let maxDiaFase = diaAtual

    for (const item of itensFase) {
      const duracao = calcularDuracaoItem(item, horasPorDia)
      const inicio  = diaUtilParaData(dataInicio, diaAtual)
      const fim     = diaUtilParaData(dataInicio, diaAtual + duracao)

      tarefas.push({
        id:        `${item.codigo ?? 'sem-codigo'}-${tarefas.length}`,
        nome:      item.desc?.substring(0, 60) ?? item.categoria,
        categoria: item.categoria,
        codigo:    item.codigo,
        fase,
        inicio,
        fim,
        duracao,
        diaInicioOffset: diaAtual,
        equipe:    item.produtividade?.equipe ?? 'Equipe não definida',
        custo:     item.custo_total ?? 0,
      })

      diaAtual += duracao
      maxDiaFase = Math.max(maxDiaFase, diaAtual)
    }

    // Adiciona a tarefa-pai (fase)
    tarefas.unshift({
      id:        `fase-${fase}`,
      nome:      fase,
      fase,
      ehFase:    true,
      inicio:    diaUtilParaData(dataInicio, faseStart),
      fim:       diaUtilParaData(dataInicio, maxDiaFase),
      duracao:   maxDiaFase - faseStart,
      diaInicioOffset: faseStart,
      custo:     itensFase.reduce((s, i) => s + (i.custo_total ?? 0), 0),
    })
  }

  const totalDias = tarefas.reduce((m, t) => Math.max(m, t.diaInicioOffset + t.duracao), 0)

  return { tarefas, totalDias, dataFim: diaUtilParaData(dataInicio, totalDias) }
}

/**
 * Converte offset de dias úteis em data real (pula fins de semana)
 */
function diaUtilParaData(dataBase, offsetDias) {
  const d = new Date(dataBase)
  let util = 0
  while (util < offsetDias) {
    d.setDate(d.getDate() + 1)
    const dow = d.getDay()
    if (dow !== 0 && dow !== 6) util++
  }
  return new Date(d)
}

/**
 * Formata data para exibição pt-BR
 */
export function formatarData(date) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    .format(new Date(date))
}
