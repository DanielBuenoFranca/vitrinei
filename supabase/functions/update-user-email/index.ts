import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401 })
  }

  // Verify caller is master
  const callerClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )
  const { data: { user: caller } } = await callerClient.auth.getUser()
  if (!caller) {
    return new Response(JSON.stringify({ error: 'Não autorizado' }), { status: 401 })
  }

  const { data: callerRoles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', caller.id)
  const isMaster = callerRoles?.some(r => r.role === 'master')
  if (!isMaster) {
    return new Response(JSON.stringify({ error: 'Apenas perfil Master pode alterar e-mails' }), { status: 403 })
  }

  const { user_id, new_email } = await req.json()
  if (!user_id || !new_email) {
    return new Response(JSON.stringify({ error: 'user_id e new_email são obrigatórios' }), { status: 400 })
  }

  const { error } = await supabase.auth.admin.updateUserById(user_id, {
    email: new_email,
    email_confirm: true,
  })

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  return new Response(JSON.stringify({ success: true }))
})
