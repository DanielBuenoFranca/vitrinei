import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Não autorizado' }, 401)

    const callerClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user: caller } } = await callerClient.auth.getUser()
    if (!caller) return json({ error: 'Não autorizado' }, 401)

    const { data: callerRoles } = await supabase.from('user_roles').select('role').eq('user_id', caller.id)
    if (!callerRoles?.some(r => r.role === 'master' || r.role === 'admin')) {
      return json({ error: 'Apenas perfil Master/Admin' }, 403)
    }

    let body: any = {}
    try { body = await req.json() } catch { return json({ error: 'JSON inválido' }, 400) }

    const { user_id, enable_selling } = body
    if (!user_id || typeof user_id !== 'string') return json({ error: 'user_id é obrigatório' }, 400)
    if (!UUID_RE.test(user_id)) {
      return json({ error: 'Este registro é um Lead importado sem conta. Use "Editar" para criar a conta com e-mail/senha.' }, 400)
    }

    const summary: string[] = []

    // 1) Confirm email
    const { data: updatedUser, error: updateErr } = await supabase.auth.admin.updateUserById(user_id, { email_confirm: true })
    if (updateErr) return json({ error: updateErr.message }, 400)
    summary.push('✓ E-mail confirmado / conta ativada')

    const meta = updatedUser?.user?.user_metadata || {}
    const userEmail = updatedUser?.user?.email || ''
    const selectedProfile = meta.selected_profile || 'client'

    // 2) Resolve plan (use selected, else system default = middle plan)
    let selectedPlan: string = meta.selected_plan || ''
    let planPrice = 100
    let planName = 'Prata'
    let allPlans: any[] = [
      { id: 'bronze', name: 'Bronze', price: 50 },
      { id: 'prata',  name: 'Prata',  price: 100 },
      { id: 'ouro',   name: 'Ouro',   price: 200 },
    ]
    try {
      const { data: settingsData } = await supabase
        .from('site_settings').select('value').eq('key', 'subscription_plans').maybeSingle()
      const v: any = settingsData?.value
      const arr = Array.isArray(v) ? v : (Array.isArray(v?.plans) ? v.plans : null)
      if (arr && arr.length) allPlans = arr.filter((p: any) => p.active !== false)
    } catch { /* defaults */ }

    if (!selectedPlan) {
      // pick the median-priced plan
      const sorted = [...allPlans].sort((a, b) => Number(a.price) - Number(b.price))
      const mid = sorted[Math.floor(sorted.length / 2)] || sorted[0]
      selectedPlan = mid.id
      planPrice = Number(mid.price) || 100
      planName = mid.name || selectedPlan
      summary.push(`✓ Plano padrão (médio) atribuído: ${planName} (R$ ${planPrice.toFixed(2)})`)
    } else {
      const matched = allPlans.find((p: any) => p.id === selectedPlan)
      if (matched) { planPrice = Number(matched.price) || 100; planName = matched.name || selectedPlan }
      summary.push(`✓ Plano selecionado: ${planName} (R$ ${planPrice.toFixed(2)})`)
    }

    // 3) Ensure role
    const { data: existingRoles } = await supabase.from('user_roles').select('id, role').eq('user_id', user_id)
    if (!existingRoles?.length) {
      await supabase.from('user_roles').insert({ user_id, role: selectedProfile })
      summary.push(`✓ Papel atribuído: ${selectedProfile}`)
    }

    // 4) Ensure subscription record (Lead → Active)
    const { data: existingSub } = await supabase
      .from('subscriptions').select('id, plan').eq('user_id', user_id).maybeSingle()
    if (!existingSub) {
      await supabase.from('subscriptions').insert({ user_id, plan: selectedPlan, price: planPrice, status: 'active' })
      summary.push('✓ Assinatura criada (status: ativa)')
    } else if (existingSub.plan !== selectedPlan) {
      await supabase.from('subscriptions').update({ plan: selectedPlan, price: planPrice, status: 'active' }).eq('id', existingSub.id)
      summary.push('✓ Assinatura atualizada')
    } else {
      summary.push('• Assinatura já existente — mantida')
    }

    // 5) Wallet debit (only when explicitly enabling selling / final payment phase)
    if (enable_selling) {
      const { data: walletData } = await supabase.from('wallets').select('id, balance').eq('user_id', user_id).maybeSingle()
      if (walletData) {
        const { data: existingDebit } = await supabase
          .from('wallet_transactions').select('id').eq('user_id', user_id).eq('type', 'subscription_debit').maybeSingle()
        if (!existingDebit) {
          await supabase.from('wallets').update({ balance: Number(walletData.balance || 0) - planPrice }).eq('id', walletData.id)
          await supabase.from('wallet_transactions').insert({
            user_id, wallet_id: walletData.id,
            amount: -planPrice, type: 'subscription_debit',
            description: `[Assinatura] Adesão ao Plano ${planName} (R$ ${planPrice.toFixed(2)})`,
          })
          summary.push(`✓ Débito de assinatura aplicado: -R$ ${planPrice.toFixed(2)}`)
        } else {
          summary.push('• Débito de assinatura já registrado')
        }
      }

      // Provider provisioning
      if (selectedProfile === 'provider' || selectedProfile === 'mixed') {
        const { data: profile } = await supabase
          .from('profiles').select('display_name, phone, cpf_cnpj').eq('user_id', user_id).maybeSingle()
        const providerName = profile?.display_name || meta.full_name || userEmail.split('@')[0]
        const { data: existingProv } = await supabase
          .from('providers').select('id').eq('user_id', user_id).maybeSingle()
        if (!existingProv) {
          await supabase.from('providers').insert({
            name: providerName, segment: ['Geral'], type: 'mei',
            email: userEmail, phone: profile?.phone || '',
            cpf_cnpj: profile?.cpf_cnpj || null,
            user_id, active: true, storefront_config: {},
          })
          summary.push('✓ Vitrine de prestador provisionada')
        } else {
          summary.push('• Vitrine de prestador já existente')
        }
        await supabase.from('profiles').update({
          is_provider: true, is_customer: selectedProfile === 'mixed',
        }).eq('user_id', user_id)
      } else {
        await supabase.from('profiles').update({ is_customer: true }).eq('user_id', user_id)
      }
      summary.push('✓ Lead convertido em USUÁRIO ATIVO')
    } else {
      summary.push('• Jornada de Lead iniciada — aguardando pagamento para liberar venda')
    }

    return json({ success: true, summary, plan: { id: selectedPlan, name: planName, price: planPrice } })
  } catch (e: any) {
    console.error('activate-user fatal:', e)
    return json({ error: e?.message || 'Erro interno' }, 500)
  }
})
