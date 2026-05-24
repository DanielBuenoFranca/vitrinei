import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

function maskEmail(email: string) {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const maskedLocal = local.length > 2 ? local.substring(0, 2) + '*'.repeat(local.length - 2) : local + '*';
  const domainParts = domain.split('.');
  const maskedDomain = domainParts[0].length > 2 ? domainParts[0].substring(0, 2) + '*'.repeat(domainParts[0].length - 2) : domainParts[0] + '*';
  return `${maskedLocal}@${maskedDomain}.${domainParts.slice(1).join('.')}`;
}

function maskName(name: string) {
  return name.split(' ').map(part => {
    if (part.length <= 2) return part;
    return part.substring(0, 2) + '*'.repeat(part.length - 2);
  }).join(' ');
}

function maskPhone(phone: string) {
  if (!phone) return 'N/A';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return phone;
  const last4 = digits.slice(-4);
  const ddd = digits.slice(0, 2);
  return `(${ddd}) *****-${last4}`;
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

    const { cpf_cnpj, email, phone, is_exempt } = await req.json()

    const conflicts = []

    // 1. Universal Validation: CPF
    if (cpf_cnpj && !is_exempt) {
      const normalizedCpf = cpf_cnpj.replace(/\D/g, '')
      const { data: profileByCpf } = await supabase
        .from('registration_check_view')
        .select('*')
        .eq('cpf_cnpj_normalized', normalizedCpf)
        .maybeSingle()

      if (profileByCpf) {
        conflicts.push({
          type: 'CPF',
          name: maskName(profileByCpf.display_name || 'Usuário'),
          email: profileByCpf.email ? maskEmail(profileByCpf.email) : 'N/A',
          phone: maskPhone(profileByCpf.phone),
          status: profileByCpf.status || 'Ativo'
        })
      }
    }

    // 2. Conditional Validation (Exempt users)
    if (is_exempt) {
      // First: Email
      if (email) {
        const { data: profileByEmail } = await supabase
          .from('registration_check_view')
          .select('*')
          .eq('email', email)
          .maybeSingle()
        
        if (profileByEmail) {
          conflicts.push({
            type: 'Email',
            name: maskName(profileByEmail.display_name || email.split('@')[0] || 'Usuário'),
            email: maskEmail(email),
            phone: maskPhone(profileByEmail.phone),
            status: profileByEmail.status || 'Ativo'
          })
        }
      }

      // Second: Phone (only if email not already found as duplicate)
      if (conflicts.length === 0 && phone) {
        const normalizedInputPhone = phone.replace(/\D/g, '')
        
        // We can query the profiles table using the normalize_phone function if we want to be thorough
        // but for now, let's just query profiles where normalized phone matches
        const { data: profileByPhone } = await supabase
          .rpc('get_profile_by_normalized_phone', { _phone: normalizedInputPhone })

        if (profileByPhone && profileByPhone.length > 0) {
          const p = profileByPhone[0]
          conflicts.push({
            type: 'Telefone',
            name: maskName(p.display_name || 'Usuário'),
            email: p.email ? maskEmail(p.email) : 'N/A',
            phone: maskPhone(p.phone || phone),
            status: p.status || 'Ativo'
          })
        }
      }
    }

    if (conflicts.length > 0) {
      return new Response(
        JSON.stringify({ ok: false, conflicts }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
