// supabase/functions/aps-upload/index.ts
// Deno Edge Function: recebe o arquivo .rvt via FormData,
// faz upload para o APS Object Storage e inicia a tradução Model Derivative.
//
// Variáveis de ambiente necessárias (Supabase Secrets):
//   APS_CLIENT_ID     — Client ID do app APS
//   APS_CLIENT_SECRET — Client Secret do app APS

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const APS_AUTH_URL = 'https://developer.api.autodesk.com/authentication/v2/token'
const APS_OSS_URL  = 'https://developer.api.autodesk.com/oss/v2/buckets'
const APS_MD_URL   = 'https://developer.api.autodesk.com/modelderivative/v2/designdata/job'
const BUCKET_KEY   = 'bim5d-orcamentista'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, x-client-info, content-type',
}

async function getApsToken(): Promise<string> {
  const clientId     = Deno.env.get('APS_CLIENT_ID')
  const clientSecret = Deno.env.get('APS_CLIENT_SECRET')

  if (!clientId || !clientSecret) {
    throw new Error('APS_CLIENT_ID e APS_CLIENT_SECRET não configurados nos secrets do Supabase.')
  }

  const resp = await fetch(APS_AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'client_credentials',
      client_id:     clientId,
      client_secret: clientSecret,
      scope:         'data:read data:write data:create bucket:create bucket:read',
    }),
  })

  if (!resp.ok) throw new Error(`APS auth falhou: ${resp.status} ${await resp.text().catch(() => resp.statusText)}`)
  const data = await resp.json()
  return data.access_token
}

async function garantirBucket(token: string): Promise<void> {
  const resp = await fetch(`${APS_OSS_URL}/${BUCKET_KEY}/details`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (resp.status === 404) {
    // Criar bucket
    const criar = await fetch(APS_OSS_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ bucketKey: BUCKET_KEY, policyKey: 'transient' }),
    })
    if (!criar.ok && criar.status !== 409) {
      throw new Error(`Falha ao criar bucket: ${criar.status}`)
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const filename = (formData.get('filename') as string) || file?.name || 'modelo.rvt'

    if (!file) {
      return new Response(JSON.stringify({ error: 'Arquivo não encontrado no FormData.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const token = await getApsToken()
    await garantirBucket(token)

    // Upload do arquivo para APS OSS
    const objectKey = `${Date.now()}-${filename}`
    const uploadResp = await fetch(`${APS_OSS_URL}/${BUCKET_KEY}/objects/${encodeURIComponent(objectKey)}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/octet-stream',
      },
      body: file.stream(),
    })

    if (!uploadResp.ok) {
      throw new Error(`Upload APS falhou: ${uploadResp.status} ${await uploadResp.text()}`)
    }

    const uploadData = await uploadResp.json()
    const objectId = uploadData.objectId  // urn:adsk.objects:os.object:...

    // Codifica o objectId em base64url para gerar o URN
    const urn = btoa(objectId).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')

    // Inicia a tradução Model Derivative → SVF2
    const jobResp = await fetch(APS_MD_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-ads-force': 'true',
      },
      body: JSON.stringify({
        input: { urn },
        output: {
          formats: [{
            type: 'svf2',
            views: ['2d', '3d'],
          }],
        },
      }),
    })

    if (!jobResp.ok) {
      throw new Error(`Job de tradução APS falhou: ${jobResp.status} ${await jobResp.text()}`)
    }

    return new Response(JSON.stringify({ urn, status: 'pending', filename }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('aps-upload error:', err)
    return new Response(JSON.stringify({ error: String(err.message) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
