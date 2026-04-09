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

    // Verify caller is master
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return respond({ error: 'Não autorizado' }, 401)

    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user: caller } } = await callerClient.auth.getUser()
    if (!caller) return respond({ error: 'Não autorizado' }, 401)

    const { data: callerRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id)
    const isMaster = callerRoles?.some(r => r.role === 'master')
    if (!isMaster) return respond({ error: 'Apenas perfil Master' }, 403)

    const { user_id } = await req.json()
    if (!user_id) return respond({ error: 'user_id é obrigatório' }, 400)

    // Prevent self-deletion
    if (user_id === caller.id) {
      return respond({ error: 'Não é possível excluir a si mesmo' }, 400)
    }

    // Prevent deleting last master
    const { data: targetRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user_id)
    const isTargetMaster = targetRoles?.some(r => r.role === 'master')
    if (isTargetMaster) {
      const { count } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'master')
      if ((count ?? 0) <= 1) {
        return respond({ error: 'Não é possível excluir o último Master' }, 400)
      }
    }

    // Delete related data first
    await supabase.from('wallet_transactions').delete().eq('user_id', user_id)
    await supabase.from('wallets').delete().eq('user_id', user_id)
    await supabase.from('subscriptions').delete().eq('user_id', user_id)
    await supabase.from('referrals').delete().eq('referrer_id', user_id)
    await supabase.from('user_roles').delete().eq('user_id', user_id)
    await supabase.from('profiles').delete().eq('user_id', user_id)

    // Delete from auth
    const { error } = await supabase.auth.admin.deleteUser(user_id)
    if (error) {
      console.error('Error deleting auth user:', error)
      return respond({ error: error.message }, 500)
    }

    return respond({ ok: true })
  } catch (err) {
    console.error('Unexpected error:', err)
    return respond({ error: 'Erro interno' }, 500)
  }
})
