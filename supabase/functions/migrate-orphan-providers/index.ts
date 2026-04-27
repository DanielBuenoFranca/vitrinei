import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const slug = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '').slice(0, 32) || 'prestador'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Auth check — master only
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  const callerClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } })
  const { data: { user: caller } } = await callerClient.auth.getUser()
  if (!caller) return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', caller.id)
  if (!roles?.some(r => r.role === 'master')) {
    return new Response(JSON.stringify({ error: 'Apenas perfil Master pode executar esta migração' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const { data: orphans } = await supabase
    .from('providers')
    .select('id, name, email, phone, cpf_cnpj, segment, type, city, address, distance, rating, active, logo_url, storefront_config, auth_split_5x')
    .is('user_id', null)

  if (!orphans || orphans.length === 0) {
    return new Response(JSON.stringify({ migrated: 0, skipped: 0, errors: [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  let migrated = 0, skipped = 0
  const errors: string[] = []
  const tempPasswords: { name: string; email: string; tempPassword: string }[] = []

  for (const p of orphans) {
    try {
      // Determine email (real or generated placeholder)
      const baseEmail = (p.email || '').trim().toLowerCase()
      const generatedEmail = `${slug(p.name)}.${p.id}@vitrinei.local`
      const email = baseEmail && /\S+@\S+\.\S+/.test(baseEmail) ? baseEmail : generatedEmail

      // Skip if email already exists in auth
      const { data: existing } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
      const matched = existing?.users?.find((u: any) => u.email?.toLowerCase() === email)
      if (matched) {
        // Just link
        await supabase.from('providers').update({ user_id: matched.id }).eq('id', p.id)
        skipped++
        continue
      }

      const tempPassword = crypto.randomUUID().slice(0, 12)
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name: p.name, must_reset_password: true, migrated_from_provider: p.id },
      })

      if (createErr || !created?.user) {
        errors.push(`${p.name}: ${createErr?.message || 'erro desconhecido'}`)
        continue
      }

      const uid = created.user.id

      // Profile is auto-created by handle_new_user trigger; update with provider data
      await supabase.from('profiles').update({
        display_name: p.name,
        phone: p.phone,
        city: p.city,
        address: p.address,
        cpf_cnpj: p.cpf_cnpj,
        provider_type: p.type,
        provider_segments: p.segment,
        distance: p.distance,
        rating: p.rating,
        provider_active: p.active,
        auth_split_5x: p.auth_split_5x,
        logo_url: p.logo_url,
        storefront_config: p.storefront_config,
        is_provider: true,
      }).eq('user_id', uid)

      // Role
      await supabase.from('user_roles').insert({ user_id: uid, role: 'provider' })

      // Link provider record
      await supabase.from('providers').update({ user_id: uid }).eq('id', p.id)

      tempPasswords.push({ name: p.name, email, tempPassword })
      migrated++
    } catch (e: any) {
      errors.push(`${p.name}: ${e.message || 'exception'}`)
    }
  }

  return new Response(JSON.stringify({
    migrated, skipped, errors,
    credentials: tempPasswords,
    note: 'Senhas temporárias geradas. Usuários precisam redefinir senha no primeiro login.',
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
})
