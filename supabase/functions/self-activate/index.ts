import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Activation code is now stored in user_activations table

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { email, code } = await req.json()
  if (!email || !code) {
    return new Response(JSON.stringify({ error: 'Email e código são obrigatórios' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Find user by email
  const { data: { users }, error: listErr } = await supabase.auth.admin.listUsers()
  if (listErr) {
    return new Response(JSON.stringify({ error: 'Erro ao buscar usuários' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const user = users.find(u => u.email === email)
  if (!user) {
    return new Response(JSON.stringify({ error: 'Usuário não encontrado' }), {
      status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Validate code against database
  const { data: activationData, error: tokenErr } = await supabase
    .from('user_activations')
    .select('id')
    .eq('email', email)
    .eq('code', code)
    .eq('is_used', false)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()
  
  if (tokenErr || !activationData) {
    return new Response(JSON.stringify({ error: 'Código de ativação inválido ou expirado' }), {
      status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Mark token as used
  await supabase
    .from('user_activations')
    .update({ is_used: true, used_at: new Date().toISOString() })
    .eq('id', activationData.id)

  // Already confirmed
  if (user.email_confirmed_at) {
    return new Response(JSON.stringify({ success: true, already_confirmed: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Confirm user email
  const { error: updateErr } = await supabase.auth.admin.updateUserById(user.id, {
    email_confirm: true,
  })

  if (updateErr) {
    return new Response(JSON.stringify({ error: updateErr.message }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  // Update profile status and activation
  await supabase
    .from('profiles')
    .update({ is_activated: true, status: 'active' })
    .eq('user_id', user.id)

  // --- LEDGER: Ensure wallet, subscription, role and initial debit exist ---

  const meta = user.user_metadata || {}
  const selectedPlan = meta.selected_plan || 'bronze'
  const selectedProfile = meta.selected_profile || 'client'

  // Get plan price from site_settings or fallback
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
      const matchedPlan = plans.find((p: any) => p.id === selectedPlan)
      if (matchedPlan) {
        planPrice = Number(matchedPlan.price) || 50
        planName = matchedPlan.name || selectedPlan
      }
    }
  } catch { /* use defaults */ }

  // Fallback plan prices
  const fallbackPrices: Record<string, { price: number; name: string }> = {
    bronze: { price: 50, name: 'Bronze' },
    prata: { price: 100, name: 'Prata' },
    ouro: { price: 200, name: 'Ouro' },
  }
  if (planPrice === 50 && fallbackPrices[selectedPlan]) {
    planPrice = fallbackPrices[selectedPlan].price
    planName = fallbackPrices[selectedPlan].name
  }

  // Ensure role exists
  const { data: existingRole } = await supabase
    .from('user_roles')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!existingRole) {
    await supabase.from('user_roles').insert({
      user_id: user.id,
      role: selectedProfile,
    })
  }

  // Ensure subscription exists
  const { data: existingSub } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!existingSub) {
    await supabase.from('subscriptions').insert({
      user_id: user.id,
      plan: selectedPlan,
      price: planPrice,
    })
  }

  // Ensure wallet has initial debit
  const { data: walletData } = await supabase
    .from('wallets')
    .select('id, balance')
    .eq('user_id', user.id)
    .maybeSingle()

  if (walletData) {
    // Check if initial debit transaction exists
    const { data: existingDebit } = await supabase
      .from('wallet_transactions')
      .select('id')
      .eq('user_id', user.id)
      .eq('type', 'subscription_debit')
      .maybeSingle()

    if (!existingDebit) {
      // Set negative balance
      await supabase.from('wallets').update({
        balance: -planPrice,
      }).eq('id', walletData.id)

      // Register debit transaction in ledger
      await supabase.from('wallet_transactions').insert({
        user_id: user.id,
        wallet_id: walletData.id,
        amount: -planPrice,
        type: 'subscription_debit',
        description: `[Assinatura] Adesão ao Plano ${planName} (R$ ${planPrice.toFixed(2)})`,
      })
    }
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
})
