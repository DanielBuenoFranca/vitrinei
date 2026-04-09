import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Replicate the same hash logic used on the client
function generateActivationCode(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash) + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString().slice(0, 6).padStart(6, '0');
}

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

  // Validate code against both email-based and id-based codes
  const codeFromEmail = generateActivationCode(email)
  const codeFromId = generateActivationCode(user.id)
  
  if (code !== codeFromEmail && code !== codeFromId) {
    return new Response(JSON.stringify({ error: 'Código de ativação inválido' }), {
      status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

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

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
})
