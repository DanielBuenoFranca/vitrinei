import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, code, name } = await req.json()

    console.log(`Sending activation email to ${email} with code ${code}`)

    // Here you would integrate with SendGrid, Mailgun, Resend, etc.
    // For now, we will simulate the success.
    // Example with Resend:
    /*
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      },
      body: JSON.stringify({
        from: 'Vitrinei <onboarding@resend.dev>',
        to: [email],
        subject: 'Ative sua conta no Vitrinei',
        html: `
          <h1>Olá, ${name}!</h1>
          <p>Seja bem-vindo ao Vitrinei. Para ativar sua conta, utilize o código abaixo:</p>
          <div style="background: #f4f4f4; padding: 20px; text-align: center; border-radius: 8px;">
            <h2 style="font-family: monospace; letter-spacing: 5px; font-size: 32px; color: #7c3aed;">${code}</h2>
          </div>
          <p>Este código expira em 24 horas.</p>
          <p>Se você não solicitou este cadastro, por favor ignore este e-mail.</p>
        `,
      }),
    })
    */

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
