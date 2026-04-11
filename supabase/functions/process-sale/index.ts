import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Validate auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data: { user }, error: authErr } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const body = await req.json()
    const { seller_id, amount, description, installments = 1, items = [] } = body

    if (!seller_id || !amount || amount <= 0) {
      return new Response(JSON.stringify({ error: 'seller_id e amount são obrigatórios' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (installments > 1) {
      // Check if seller has auth_split_5x
      const { data: provider } = await supabase
        .from('providers')
        .select('auth_split_5x, name')
        .eq('cpf_cnpj', seller_id)
        .maybeSingle()

      // Also check by user link if needed  
      if (provider && !provider.auth_split_5x && installments > 1) {
        return new Response(JSON.stringify({ 
          error: `Prestador ${provider.name || ''} não autorizado para parcelamento em ${installments}x` 
        }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    // Call the atomic split function
    const { data, error } = await supabase.rpc('process_sale_split', {
      _buyer_id: user.id,
      _seller_id: seller_id,
      _amount: amount,
      _description: description || 'Compra de produtos/serviços',
      _installments: Math.min(installments, 5),
    })

    if (error) {
      await supabase.from('system_logs').insert({
        level: 'error',
        action: 'process-sale',
        message: `Erro no split: ${error.message}`,
        context: { buyer_id: user.id, seller_id, amount, installments, items },
        user_id: user.id,
      })

      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (data?.error) {
      return new Response(JSON.stringify({ error: data.error }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
