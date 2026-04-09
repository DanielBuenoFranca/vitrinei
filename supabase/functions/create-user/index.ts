import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function respond(ok: boolean, payload: Record<string, unknown>, status = 200) {
  return new Response(
    JSON.stringify({ ok, ...payload }),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
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

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return respond(false, { error: 'Não autorizado' }, 401)
    }

    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user: caller } } = await callerClient.auth.getUser()
    if (!caller) {
      return respond(false, { error: 'Não autorizado' }, 401)
    }

    const { data: callerRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id)
    const isMaster = callerRoles?.some(r => r.role === 'master')
    if (!isMaster) {
      return respond(false, { error: 'Apenas perfil Master pode criar usuários' }, 403)
    }

    let body: Record<string, unknown>
    try {
      body = await req.json()
    } catch {
      return respond(false, { error: 'Body JSON inválido' }, 400)
    }

    const { email, password, name, phone, role } = body as {
      email?: string; password?: string; name?: string; phone?: string; role?: string
    }

    if (!email || !password || !role) {
      return respond(false, { error: 'email, password e role são obrigatórios' }, 400)
    }

    // Create user via admin API — auto-confirm email since master is creating
    const { data: newUser, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name || email.split('@')[0] },
    })

    if (createErr) {
      console.error('Create user error:', createErr)
      return respond(false, { error: createErr.message }, 400)
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

    return respond(true, { user_id: newUser?.user?.id })
  } catch (err) {
    console.error('Unexpected error:', err)
    return respond(false, { error: 'Erro interno do servidor' }, 500)
  }
})
