// src/lib/sinapi-mapper.js
// Motor de mapeamento De-Para: palavras-chave do Revit → composições SINAPI

import { SINAPI_DB, PRODUTIVIDADE } from './sinapi-local-db'

// Re-exporta para quem precisar dos dados locais diretamente
export { SINAPI_DB, PRODUTIVIDADE }

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
  // Cobertura / Telhado
  {
    keywords: ['roof', 'telhado', 'cobertura', 'telha'],
    codigos: ['87551'],
    fase: 'Cobertura',
  },
  // Forro / Teto
  {
    keywords: ['ceiling', 'teto', 'forro'],
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
  // Fundação
  {
    keywords: ['foundation', 'fundação', 'fundacao', 'sapata', 'baldrame', 'radier'],
    codigos: ['72137', '72136'],
    fase: 'Fundação',
  },
  // Instalações hidráulicas
  {
    keywords: ['plumbing', 'hidráulica', 'hidraulica', 'pipe', 'tubo', 'esgoto', 'água', 'agua'],
    codigos: ['88271', '88267'],
    fase: 'Instalações',
  },
  // Instalações elétricas
  {
    keywords: ['electrical', 'elétrica', 'eletrica', 'conduit', 'eletroduto', 'tomada', 'fiação', 'fiacao'],
    codigos: ['93358', '93359'],
    fase: 'Instalações',
  },
  // Impermeabilização
  {
    keywords: ['waterproof', 'impermeabilização', 'impermeabilizacao', 'manta', 'membrana'],
    codigos: ['74252'],
    fase: 'Estrutura',
  },
  // Portas
  {
    keywords: ['door', 'porta', 'portão', 'portao'],
    codigos: ['74128'],
    fase: 'Acabamento',
  },
  // Janelas
  {
    keywords: ['window', 'janela', 'esquadria', 'vidro'],
    codigos: ['74130'],
    fase: 'Acabamento',
  },
]

/**
 * Constrói um item de orçamento a partir dos dados SINAPI
 * @param {Object} params   - Dados da composição
 * @param {Object} [db]     - Base SINAPI a usar (padrão: dados locais)
 */
function construirItem({ categoria, quantidade, unidade, codigo, fase, confianca }, db = SINAPI_DB) {
  const sinapi = db[codigo]
  const qtdFinal = parseFloat(quantidade) || 0

  return {
    categoria,
    codigo,
    desc: sinapi?.desc ?? 'Composição não encontrada na base',
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
 * @param {Object} [db]      - Base SINAPI a usar (padrão: dados locais)
 * @returns {Array} lista de itens mapeados
 */
export function mapToSinapi(categoria, quantidade, unidade, db = SINAPI_DB) {
  const key = (categoria || '').toLowerCase().trim()

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
        }, db),
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
 * @param {string} categoria
 * @param {number} quantidade
 * @param {string} unidade
 * @param {Array}  [customDePara] - Correções salvas pelo usuário
 * @param {Object} [db]           - Base SINAPI a usar (padrão: dados locais)
 */
export async function mapToSinapiComCustom(categoria, quantidade, unidade, customDePara = [], db) {
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
    }, db)]
  }

  return mapToSinapi(categoria, quantidade, unidade, db)
}

/**
 * Agrupa e totaliza itens por fase da obra
 * @param {Array} itens
 * @returns {Object} mapa fase → { itens, total, total_mo, total_material }
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
