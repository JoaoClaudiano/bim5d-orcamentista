// src/lib/sinapi-mapper.js
// Motor de mapeamento De-Para: palavras-chave do Revit → composições SINAPI

// Produtividade SINAPI por composição (m² ou m³ por hora por equipe)
// Usado para gerar o cronograma 4D
export const PRODUTIVIDADE = {
  '87503': { valor: 1.2,  unidade: 'm²/h', equipe: '1 pedreiro + 1 servente' },
  '87251': { valor: 2.5,  unidade: 'm²/h', equipe: '1 pedreiro + 1 servente' },
  '94966': { valor: 5.0,  unidade: 'm³/h', equipe: 'equipe de concretagem' },
  '94978': { valor: 4.5,  unidade: 'm³/h', equipe: 'equipe de concretagem' },
  '92793': { valor: 80.0, unidade: 'kg/h', equipe: '1 armador + 1 ajudante' },
  '87447': { valor: 8.0,  unidade: 'm²/h', equipe: '1 carpinteiro + 1 ajudante' },
  '87264': { valor: 3.0,  unidade: 'm²/h', equipe: '1 pedreiro + 1 servente' },
  '87549': { valor: 2.0,  unidade: 'm²/h', equipe: '1 pedreiro + 1 servente' },
  '74209': { valor: 1.5,  unidade: 'm²/h', equipe: '1 pedreiro + 1 servente' },
  '87296': { valor: 4.0,  unidade: 'm²/h', equipe: '1 pedreiro + 1 servente' },
}

// Tabela de composições SINAPI com preços de referência (CE, mar/2024)
// Em produção: buscar do Supabase por estado e mês
export const SINAPI_DB = {
  '87503': {
    codigo: '87503',
    desc: 'Alvenaria de vedação de blocos cerâmicos furados na horizontal 9x19x19cm, e=9cm',
    unidade: 'm²',
    custo_total: 62.18,
    mo: 28.45,
    material: 33.73,
    estado: 'CE',
  },
  '87251': {
    codigo: '87251',
    desc: 'Contrapiso em argamassa traço 1:3 (cimento/areia), preparo mecânico, esp=4cm',
    unidade: 'm²',
    custo_total: 38.92,
    mo: 14.20,
    material: 24.72,
    estado: 'CE',
  },
  '94966': {
    codigo: '94966',
    desc: 'Concreto usinado bombeável fck=25MPa, lançado, adensado e acabado em lajes',
    unidade: 'm³',
    custo_total: 548.30,
    mo: 62.10,
    material: 486.20,
    estado: 'CE',
  },
  '94978': {
    codigo: '94978',
    desc: 'Concreto usinado bombeável fck=30MPa, lançado, adensado e acabado em pilares',
    unidade: 'm³',
    custo_total: 578.50,
    mo: 68.40,
    material: 510.10,
    estado: 'CE',
  },
  '92793': {
    codigo: '92793',
    desc: 'Armação de aço CA-50 diâm. 10,0mm',
    unidade: 'kg',
    custo_total: 14.82,
    mo: 4.30,
    material: 10.52,
    estado: 'CE',
  },
  '87447': {
    codigo: '87447',
    desc: 'Forma para lajes, em chapa de madeira compensada plastificada e=18mm, 1 uso',
    unidade: 'm²',
    custo_total: 58.16,
    mo: 22.40,
    material: 35.76,
    estado: 'CE',
  },
  '87264': {
    codigo: '87264',
    desc: 'Revestimento cerâmico para piso, carga elevada, 35x35cm (a=0.30m²/peça)',
    unidade: 'm²',
    custo_total: 82.74,
    mo: 23.60,
    material: 59.14,
    estado: 'CE',
  },
  '87549': {
    codigo: '87549',
    desc: 'Chapisco rolado de paredes internas de concreto, traço 1:4 cimento/areia',
    unidade: 'm²',
    custo_total: 8.94,
    mo: 5.10,
    material: 3.84,
    estado: 'CE',
  },
  '74209': {
    codigo: '74209',
    desc: 'Revestimento de gesso liso em teto, espessura de 2mm',
    unidade: 'm²',
    custo_total: 28.40,
    mo: 18.90,
    material: 9.50,
    estado: 'CE',
  },
  '87296': {
    codigo: '87296',
    desc: 'Pintura acrílica em paredes internas, 2 demãos + selador, tinta 1ª linha',
    unidade: 'm²',
    custo_total: 22.60,
    mo: 10.20,
    material: 12.40,
    estado: 'CE',
  },
}

// Dicionário de palavras-chave: nome da categoria Revit → lista de composições candidatas
const DE_PARA = [
  // Alvenaria / Paredes
  {
    keywords: ['basic wall', 'wall', 'parede', 'alvenaria', 'vedação', 'vedacao'],
    codigos: ['87503'],
    fase: 'Alvenaria',
  },
  // Pisos / Contrapiso
  {
    keywords: ['floor', 'piso', 'contrapiso', 'laje'],
    codigos: ['87251', '87264'],
    fase: 'Pisos',
  },
  // Concreto estrutural / Lajes
  {
    keywords: ['structural floor', 'floor slab', 'laje', 'slab', 'concrete'],
    codigos: ['94966', '87447'],
    fase: 'Estrutura',
  },
  // Pilares / Colunas
  {
    keywords: ['structural column', 'column', 'pilar', 'coluna'],
    codigos: ['94978', '92793'],
    fase: 'Estrutura',
  },
  // Vigas
  {
    keywords: ['structural framing', 'beam', 'viga', 'framing'],
    codigos: ['94966', '92793'],
    fase: 'Estrutura',
  },
  // Cobertura
  {
    keywords: ['roof', 'ceiling', 'cobertura', 'teto', 'forro'],
    codigos: ['74209'],
    fase: 'Acabamento',
  },
  // Revestimento
  {
    keywords: ['wall finish', 'revestimento', 'chapisco', 'reboco', 'gesso'],
    codigos: ['87549', '74209', '87296'],
    fase: 'Acabamento',
  },
  // Pintura
  {
    keywords: ['paint', 'pintura', 'tinta'],
    codigos: ['87296'],
    fase: 'Acabamento',
  },
]

function construirItem({ categoria, quantidade, unidade, codigo, fase, confianca }) {
  const sinapi = SINAPI_DB[codigo]
  const qtdFinal = parseFloat(quantidade) || 0

  return {
    categoria,
    codigo,
    desc: sinapi?.desc ?? 'Composição não encontrada na base local',
    unidade: sinapi?.unidade ?? unidade,
    quantidade: qtdFinal,
    custo_unitario: sinapi?.custo_total ?? 0,
    custo_mo: sinapi?.mo ?? 0,
    custo_material: sinapi?.material ?? 0,
    custo_total: (sinapi?.custo_total ?? 0) * qtdFinal,
    fase: fase ?? 'Indefinido',
    confianca: confianca ?? 'baixa',
    produtividade: PRODUTIVIDADE[codigo] ?? null,
  }
}

/**
 * Mapeia uma categoria do Revit para composições SINAPI
 * @param {string} categoria - Nome da categoria do Revit
 * @param {number} quantidade
 * @param {string} unidade
 * @returns {Array} lista de itens mapeados
 */
export function mapToSinapi(categoria, quantidade, unidade) {
  const key = (categoria || '').toLowerCase().trim()

  // Busca exata / parcial no dicionário
  for (const entry of DE_PARA) {
    const match = entry.keywords.some(kw => key.includes(kw))
    if (match) {
      return entry.codigos.map((codigo, idx) =>
        construirItem({
          categoria,
          quantidade,
          unidade,
          codigo,
          fase: entry.fase,
          confianca: idx === 0 ? 'alta' : 'media',
        }),
      )
    }
  }

  // Sem correspondência
  return [{
    categoria,
    codigo: null,
    desc: 'Sem correspondência — revisão manual necessária',
    unidade,
    quantidade: parseFloat(quantidade) || 0,
    custo_unitario: 0,
    custo_mo: 0,
    custo_material: 0,
    custo_total: 0,
    fase: 'Indefinido',
    confianca: 'baixa',
    produtividade: null,
  }]
}

/**
 * Mapeia categoria usando De-Para customizado do usuário antes do dicionário padrão
 */
export async function mapToSinapiComCustom(categoria, quantidade, unidade, customDePara = []) {
  const key = (categoria || '').toLowerCase().trim()
  const entradaCustom = (customDePara || []).find(item => {
    const categoriaCustom = (
      item?.categoria_normalizada ||
      item?.categoria ||
      ''
    ).toLowerCase().trim()

    return categoriaCustom && categoriaCustom === key
  })

  if (entradaCustom?.codigo_sinapi || entradaCustom?.codigo) {
    const codigo = String(entradaCustom.codigo_sinapi || entradaCustom.codigo).trim()
    return [construirItem({
      categoria,
      quantidade,
      unidade,
      codigo,
      fase: 'Personalizado',
      confianca: 'alta',
    })]
  }

  return mapToSinapi(categoria, quantidade, unidade)
}

/**
 * Agrupa e totaliza itens por fase da obra
 */
export function agruparPorFase(itens) {
  const grupos = {}
  for (const item of itens) {
    const fase = item.fase ?? 'Indefinido'
    if (!grupos[fase]) {
      grupos[fase] = { itens: [], total: 0, total_mo: 0, total_material: 0 }
    }
    grupos[fase].itens.push(item)
    grupos[fase].total += item.custo_total ?? 0
    grupos[fase].total_mo += (item.custo_mo ?? 0) * (item.quantidade ?? 0)
    grupos[fase].total_material += (item.custo_material ?? 0) * (item.quantidade ?? 0)
  }
  return grupos
}
