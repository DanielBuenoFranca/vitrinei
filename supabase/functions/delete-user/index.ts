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

    const body = await req.json()
    const userIds = Array.isArray(body?.user_ids)
      ? body.user_ids.filter(Boolean)
      : body?.user_id
        ? [body.user_id]
        : []
    if (userIds.length === 0) return respond({ error: 'user_id ou user_ids é obrigatório' }, 400)

    const results: Array<{ user_id: string; ok: boolean; error?: string }> = []

    for (const user_id of userIds) {

    // Prevent self-deletion
    if (user_id === caller.id) {
      results.push({ user_id, ok: false, error: 'Não é possível excluir a si mesmo' })
      continue
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
        results.push({ user_id, ok: false, error: 'Não é possível excluir o último Master' })
        continue
      }
    }

    // Delete related data first
    const { data: ownedProviders } = await supabase.from('providers').select('id').eq('user_id', user_id)
    const providerIds = (ownedProviders || []).map((p: any) => p.id)
    if (providerIds.length) {
      await supabase.from('stock_movements').delete().in('provider_id', providerIds)
      const { data: entries } = await supabase.from('stock_entries').select('id').in('provider_id', providerIds)
      const entryIds = (entries || []).map((e: any) => e.id)
      if (entryIds.length) await supabase.from('stock_entry_items').delete().in('entry_id', entryIds)
      await supabase.from('stock_entries').delete().in('provider_id', providerIds)
      const { data: kitRows } = await supabase.from('kits').select('id').in('owner_provider_id', providerIds)
      const kitIds = (kitRows || []).map((k: any) => k.id)
      if (kitIds.length) await supabase.from('kit_items').delete().in('kit_id', kitIds)
      if (kitIds.length) await supabase.from('kits').delete().in('id', kitIds)
      await supabase.from('dynamic_services').delete().in('provider_id', providerIds)
      await supabase.from('dynamic_products').delete().in('provider_id', providerIds)
      await supabase.from('providers').delete().in('id', providerIds)
    }
    await supabase.from('referrals').delete().eq('referred_id', user_id)
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
      results.push({ user_id, ok: false, error: error.message })
      continue
    }

    results.push({ user_id, ok: true })
    }

    const failed = results.filter((r) => !r.ok)
    return respond({ ok: failed.length === 0, results, deleted: results.filter((r) => r.ok).length, failed: failed.length }, failed.length ? 207 : 200)
  } catch (err) {
    console.error('Unexpected error:', err)
    return respond({ error: 'Erro interno' }, 500)
  }
})
