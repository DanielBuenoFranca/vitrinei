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

    // Verify caller is master
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user: caller } } = await callerClient.auth.getUser()
    if (!caller) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: callerRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id)
    const isMaster = callerRoles?.some(r => r.role === 'master')
    if (!isMaster) {
      return new Response(JSON.stringify({ error: 'Apenas perfil Master' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { user_id, new_password } = await req.json()

    // Update password and set must_reset_password flag in user metadata
    const { error } = await supabase.auth.admin.updateUserById(user_id, {
      password: new_password,
      user_metadata: { must_reset_password: true }
    })

    if (error) {
      console.log('Password update error:', error.message)
      // Para qualquer erro, vamos retornar 200 e informar o tipo do erro
      // Assim o frontend não trava na rede e pode decidir o que mostrar
      const errLower = error.message.toLowerCase()
      const isWeak = errLower.includes('senha é conhecida por ser fraca') || 
                    errLower.includes('password is too weak') ||
                    errLower.includes('escolha uma diferente')

      return new Response(JSON.stringify({ 
        error: error.message, 
        is_weak: isWeak,
        handled_as_warning: true
      }), { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }
    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Erro interno' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
