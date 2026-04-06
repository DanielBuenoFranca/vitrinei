import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: corsHeaders })
  }

  const callerClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )
  const { data: { user: caller } } = await callerClient.auth.getUser()
  if (!caller) {
    return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: corsHeaders })
  }

  const { data: callerRoles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', caller.id)
  const isMaster = callerRoles?.some(r => r.role === 'master')
  if (!isMaster) {
    return new Response(JSON.stringify({ error: 'Apenas perfil Master' }), { status: 403, headers: corsHeaders })
  }

  const { user_id, email } = await req.json()
  if (!user_id || !email) {
    return new Response(JSON.stringify({ error: 'user_id e email são obrigatórios' }), { status: 400, headers: corsHeaders })
  }

  // Generate a new invite/confirmation link for the user
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: email,
  })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders })
  }

  return new Response(JSON.stringify({ success: true, message: 'Link de confirmação reenviado' }), { headers: corsHeaders })
})
