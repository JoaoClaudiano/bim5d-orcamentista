// supabase/functions/aps-extract/index.ts
// Deno Edge Function: consulta o status da tradução APS e,
// quando concluída, extrai as propriedades e retorna quantitativos agrupados.
//
// Variáveis de ambiente necessárias (Supabase Secrets):
//   APS_CLIENT_ID     — Client ID do app APS
//   APS_CLIENT_SECRET — Client Secret do app APS

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const APS_AUTH_URL = 'https://developer.api.autodesk.com/authentication/v2/token'
const APS_MD_BASE  = 'https://developer.api.autodesk.com/modelderivative/v2/designdata'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, x-client-info, content-type',
}

async function getApsToken(): Promise<string> {
  const clientId     = Deno.env.get('APS_CLIENT_ID')
  const clientSecret = Deno.env.get('APS_CLIENT_SECRET')
  if (!clientId || !clientSecret) throw new Error('Credenciais APS não configuradas.')

  const resp = await fetch(APS_AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId, client_secret: clientSecret,
      scope: 'data:read',
    }),
  })
  if (!resp.ok) throw new Error(`APS auth: ${resp.status}`)
  return (await resp.json()).access_token
}

type PropMap = Record<string, string>

/**
 * Extrai valor numérico de um campo de propriedade APS.
 * APS retorna valores como "45.32 m²" ou "9.06 m³".
 */
function parseValor(val: unknown): number {
  if (typeof val === 'number') return val
  const m = String(val ?? '').match(/[\d.,]+/)
  return m ? parseFloat(m[0].replace(',', '.')) : 0
}

function detectarUnidade(props: PropMap): string {
  for (const [k, v] of Object.entries(props)) {
    const ku = k.toLowerCase()
    const vu = String(v).toLowerCase()
    if (ku.includes('area') || vu.includes('m²')) return 'm²'
    if (ku.includes('volume') || vu.includes('m³')) return 'm³'
    if (ku.includes('length') || ku.includes('comprimento') || vu.includes(' m')) return 'm'
    if (ku.includes('weight') || ku.includes('mass') || vu.includes('kg')) return 'kg'
  }
  return 'un'
}

function extrairQuantidade(props: PropMap, unidade: string): number {
  const prioridade: Record<string, string[]> = {
    'm²': ['area', 'área'],
    'm³': ['volume'],
    'm':  ['length', 'comprimento'],
    'kg': ['weight', 'mass', 'peso'],
    'un': ['count', 'quantidade', 'number of'],
  }
  const candidatos = prioridade[unidade] ?? []
  for (const [k, v] of Object.entries(props)) {
    const kl = k.toLowerCase()
    if (candidatos.some(c => kl.includes(c))) {
      const n = parseValor(v)
      if (n > 0) return n
    }
  }
  return 1
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { urn } = await req.json() as { urn: string }
    if (!urn) return new Response(JSON.stringify({ error: 'urn obrigatório' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

    const token = await getApsToken()

    // 1. Verificar status do manifest
    const manifestResp = await fetch(`${APS_MD_BASE}/${urn}/manifest`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (manifestResp.status === 404) {
      return new Response(JSON.stringify({ status: 'pending', progress: 'aguardando' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!manifestResp.ok) throw new Error(`Manifest APS: ${manifestResp.status}`)

    const manifest = await manifestResp.json()
    const progress = manifest.progress ?? ''
    const status   = manifest.status   // 'pending' | 'inprogress' | 'success' | 'failed'

    if (status !== 'success') {
      return new Response(JSON.stringify({ status, progress }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Buscar metadados (GUIDs dos modelos 3D)
    const metaResp = await fetch(`${APS_MD_BASE}/${urn}/metadata`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!metaResp.ok) throw new Error(`Metadata APS: ${metaResp.status}`)
    const meta = await metaResp.json()

    // Escolher o primeiro viewable 3D
    const viewable3d = (meta.data?.metadata ?? []).find((m: {role?: string}) => m.role === '3d')
      ?? meta.data?.metadata?.[0]
    if (!viewable3d) throw new Error('Nenhum viewable 3D encontrado no modelo.')

    const guid = viewable3d.guid

    // 3. Extrair propriedades dos elementos
    const propsResp = await fetch(`${APS_MD_BASE}/${urn}/metadata/${guid}/properties?forceget=true`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!propsResp.ok) throw new Error(`Properties APS: ${propsResp.status}`)
    const propsData = await propsResp.json()
    const elementos = propsData.data?.collection ?? []

    // 4. Agregar por categoria/família/tipo
    const grupos: Record<string, {
      categoria: string, familia: string, tipo: string,
      unidade: string, quantidade: number, elementCount: number,
    }> = {}

    for (const el of elementos) {
      const props: PropMap = el.properties ?? {}
      const categoria = props['Category'] ?? props['Categoria'] ?? el.name ?? 'Outros'
      const familia   = props['Family']   ?? props['Família']   ?? ''
      const tipo      = props['Type']     ?? props['Tipo']      ?? ''

      const unidade     = detectarUnidade(props)
      const quantidade  = extrairQuantidade(props, unidade)

      const chave = `${categoria}||${familia}||${tipo}||${unidade}`
      if (!grupos[chave]) {
        grupos[chave] = { categoria, familia, tipo, unidade, quantidade: 0, elementCount: 0 }
      }
      grupos[chave].quantidade   += quantidade
      grupos[chave].elementCount += 1
    }

    const quantitativos = Object.values(grupos)
      .map(g => ({ ...g, quantidade: Math.round(g.quantidade * 100) / 100 }))
      .sort((a, b) => a.categoria.localeCompare(b.categoria))

    return new Response(JSON.stringify({ status: 'success', progress: 'complete', quantitativos }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('aps-extract error:', err)
    return new Response(JSON.stringify({ error: String(err.message) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
