const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'LOVABLE_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { rows, existingSegments } = await req.json()

    const prompt = `Você é um assistente de dados para um marketplace de serviços e produtos.
Recebeu linhas de uma planilha de importação com campos possivelmente vazios.
Para cada linha, preencha APENAS os campos vazios com dados genéricos plausíveis baseados no contexto da linha (nome do prestador, segmento, serviço/produto).

Regras:
- Se "segment" está vazio, sugira um dos segmentos existentes: ${existingSegments.join(', ')} ou "Geral"
- Se "phone" está vazio, gere um telefone fictício brasileiro (11) 9XXXX-XXXX
- Se "email" está vazio, gere um email baseado no nome do prestador: nome@email.com
- Se "city" está vazio, use "São Paulo"
- Se "servicePrice" está vazio mas tem serviço, sugira um preço razoável para o segmento (entre 50 e 500)
- Se "productPrice" está vazio mas tem produto, sugira um preço razoável (entre 10 e 200)
- Se "serviceUnit" está vazio, use "hr"
- Se "productUnit" está vazio, use "un"
- Se "productStockType" está vazio, use "fisico"
- NÃO altere campos que já possuem valor
- Retorne APENAS o JSON com o array de linhas enriquecidas

Dados de entrada:
${JSON.stringify(rows)}

Retorne um JSON com a chave "enriched" contendo o array de linhas com os campos preenchidos.`

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'Você é um assistente de enriquecimento de dados. Responda APENAS com JSON válido.' },
          { role: 'user', content: prompt },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'enrich_rows',
              description: 'Return enriched import rows with AI-generated data for empty fields',
              parameters: {
                type: 'object',
                properties: {
                  enriched: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        _id: { type: 'number' },
                        providerName: { type: 'string' },
                        segment: { type: 'string' },
                        serviceName: { type: 'string' },
                        servicePrice: { type: 'string' },
                        serviceUnit: { type: 'string' },
                        productName: { type: 'string' },
                        productPrice: { type: 'string' },
                        productUnit: { type: 'string' },
                        productStockType: { type: 'string' },
                        phone: { type: 'string' },
                        email: { type: 'string' },
                        city: { type: 'string' },
                        cpfCnpj: { type: 'string' },
                      },
                      required: ['_id'],
                    },
                  },
                },
                required: ['enriched'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'enrich_rows' } },
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('AI gateway error:', response.status, errorText)
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Limite de requisições atingido. Tente novamente em alguns segundos.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Créditos de IA esgotados.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      return new Response(JSON.stringify({ error: 'Erro ao enriquecer dados' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const data = await response.json()
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0]
    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments)
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Resposta inesperada da IA' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Enrich error:', err)
    return new Response(JSON.stringify({ error: 'Erro interno no enriquecimento' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
