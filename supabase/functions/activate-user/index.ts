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

  const { user_id, enable_selling } = await req.json()
  if (!user_id) {
    return new Response(JSON.stringify({ error: 'user_id é obrigatório' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // Confirm user email via admin API
  const { data: updatedUser, error: updateErr } = await supabase.auth.admin.updateUserById(user_id, {
    email_confirm: true,
  })

  if (updateErr) {
    return new Response(JSON.stringify({ error: updateErr.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // If enable_selling flag is set, apply wallet/subscription rules
  if (enable_selling) {
    const meta = updatedUser?.user?.user_metadata || {}
    const selectedPlan = meta.selected_plan || 'bronze'
    const selectedProfile = meta.selected_profile || 'client'

    // Get plan price
    let planPrice = 50
    let planName = 'Bronze'
    try {
      const { data: settingsData } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'subscription_plans')
        .maybeSingle()
      if (settingsData?.value) {
        const plans = (settingsData.value as any)?.plans || []
        const matched = plans.find((p: any) => p.id === selectedPlan)
        if (matched) {
          planPrice = Number(matched.price) || 50
          planName = matched.name || selectedPlan
        }
      }
    } catch { /* defaults */ }

    const fallback: Record<string, { price: number; name: string }> = {
      bronze: { price: 50, name: 'Bronze' },
      prata: { price: 100, name: 'Prata' },
      ouro: { price: 200, name: 'Ouro' },
    }
    if (planPrice === 50 && fallback[selectedPlan]) {
      planPrice = fallback[selectedPlan].price
      planName = fallback[selectedPlan].name
    }

    // Ensure role
    const { data: existingRole } = await supabase
      .from('user_roles').select('id').eq('user_id', user_id).maybeSingle()
    if (!existingRole) {
      await supabase.from('user_roles').insert({ user_id, role: selectedProfile })
    }

    // Ensure subscription
    const { data: existingSub } = await supabase
      .from('subscriptions').select('id').eq('user_id', user_id).maybeSingle()
    if (!existingSub) {
      await supabase.from('subscriptions').insert({
        user_id, plan: selectedPlan, price: planPrice,
      })
    }

    // Ensure wallet debit
    const { data: walletData } = await supabase
      .from('wallets').select('id, balance').eq('user_id', user_id).maybeSingle()
    if (walletData) {
      const { data: existingDebit } = await supabase
        .from('wallet_transactions').select('id')
        .eq('user_id', user_id).eq('type', 'subscription_debit').maybeSingle()
      if (!existingDebit) {
        await supabase.from('wallets').update({ balance: -planPrice }).eq('id', walletData.id)
        await supabase.from('wallet_transactions').insert({
          user_id, wallet_id: walletData.id,
          amount: -planPrice, type: 'subscription_debit',
          description: `[Assinatura] Adesão ao Plano ${planName} (R$ ${planPrice.toFixed(2)})`,
        })
      }
    }

    // Auto-create provider record if profile is provider or mixed
    if (selectedProfile === 'provider' || selectedProfile === 'mixed') {
      const { data: profile } = await supabase
        .from('profiles').select('display_name, phone').eq('user_id', user_id).maybeSingle()
      const providerName = profile?.display_name || meta.full_name || 'Prestador'
      
      // Check if provider already exists for this user
      const { data: existingProv } = await supabase
        .from('providers').select('id').eq('email', updatedUser?.user?.email || '').maybeSingle()
      
      if (!existingProv) {
        await supabase.from('providers').insert({
          name: providerName,
          segment: ['Geral'],
          type: 'mei',
          email: updatedUser?.user?.email || '',
          phone: profile?.phone || '',
          active: true,
          storefront_config: {},
        })
      }

      // Update profile flags
      await supabase.from('profiles').update({
        is_provider: true,
        is_customer: selectedProfile === 'mixed',
      }).eq('user_id', user_id)
    } else if (selectedProfile === 'client') {
      await supabase.from('profiles').update({
        is_customer: true,
      }).eq('user_id', user_id)
    }
  }

  return new Response(JSON.stringify({ 
    success: true, 
    email_confirmed_at: updatedUser?.user?.email_confirmed_at 
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
})