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

  const { email, password, name, phone, role } = await req.json()
  if (!email || !password || !role) {
    return new Response(JSON.stringify({ error: 'email, password e role são obrigatórios' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // Create user via admin API — auto-confirm email since master is creating
  const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name || email.split('@')[0] },
  })

  if (createErr) {
    return new Response(JSON.stringify({ error: createErr.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // Assign role
  if (newUser?.user) {
    const { error: roleErr } = await supabase.from('user_roles').insert({ user_id: newUser.user.id, role })
    if (roleErr) {
      console.error('Role insert error:', roleErr)
    }

    // Update profile phone if provided
    if (phone) {
      await supabase.from('profiles').update({ phone }).eq('user_id', newUser.user.id)
    }
  }

  return new Response(JSON.stringify({ success: true, user_id: newUser?.user?.id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
})
