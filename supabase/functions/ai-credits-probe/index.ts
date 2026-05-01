// ai-credits-probe — Disjuntor inteligente.
// Faz uma chamada mínima na Lovable AI para confirmar que há créditos disponíveis.
// Retorna { ok: true } se conseguiu resposta válida, ou { ok: false, code, reason } em caso de 402/429/erro.
// Usado pelo painel ADM antes de ligar (ON) o consumo pago de IA.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    return new Response(
      JSON.stringify({ ok: false, code: 500, reason: "no_api_key" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [{ role: "user", content: "ok" }],
        max_tokens: 1,
      }),
    });

    if (r.status === 402) {
      return new Response(JSON.stringify({ ok: false, code: 402, reason: "no_credits" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (r.status === 429) {
      return new Response(JSON.stringify({ ok: false, code: 429, reason: "rate_limited" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!r.ok) {
      return new Response(JSON.stringify({ ok: false, code: r.status, reason: "upstream_error" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ ok: true, code: 200 }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, code: 0, reason: "network_error", error: String((e as Error)?.message || e) }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
