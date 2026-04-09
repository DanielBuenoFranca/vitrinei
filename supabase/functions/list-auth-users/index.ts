import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

function respond(payload: unknown, status = 200) {
  return new Response(
    JSON.stringify(payload),
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
      return respond({ error: 'Não autorizado' }, 401)
    }

    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user: caller } } = await callerClient.auth.getUser()
    if (!caller) {
      return respond({ error: 'Não autorizado' }, 401)
    }

    const { data: callerRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id)
    const isMaster = callerRoles?.some(r => r.role === 'master')
    if (!isMaster) {
      return respond({ error: 'Apenas perfil Master' }, 403)
    }

    const { data: { users }, error } = await supabase.auth.admin.listUsers({ perPage: 1000 })
    if (error) {
      return respond({ error: error.message }, 500)
    }

    // Also backfill: ensure every auth user has a profile
    const { data: existingProfiles } = await supabase.from('profiles').select('user_id')
    const profileUserIds = new Set((existingProfiles || []).map((p: any) => p.user_id))

    for (const u of users) {
      if (!profileUserIds.has(u.id)) {
        // Backfill profile silently
        await supabase.from('profiles').insert({
          user_id: u.id,
          display_name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'Usuário',
        })
      }
    }

    const result = users.map(u => ({
      id: u.id,
      email: u.email,
      email_confirmed_at: u.email_confirmed_at,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
    }))

    return respond(result)
  } catch (err) {
    console.error('Unexpected error:', err)
    return respond({ error: 'Erro interno' }, 500)
  }
})
