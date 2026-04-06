import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { input, type, existing } = await req.json();
    // type: 'product' | 'service'
    // input: what user typed
    // existing: array of existing names

    const existingList = (existing || []).slice(0, 50).join(", ");
    const prompt = `Você é um assistente de padronização de cadastros para uma plataforma de serviços e produtos.

O usuário está cadastrando um ${type === 'product' ? 'PRODUTO' : 'SERVIÇO'} e digitou: "${input}"

Cadastros existentes no sistema: [${existingList}]

Regras:
1. Se já existe um cadastro similar/idêntico na lista, retorne esse nome exato como primeira sugestão
2. Caso contrário, sugira nomes padronizados e profissionais para o que foi digitado
3. Retorne no máximo 3 sugestões, da mais relevante para menos
4. Os nomes devem ser curtos, claros e padronizados (primeira letra maiúscula, sem abreviações ambíguas)

Responda APENAS em JSON: {"suggestions": ["Nome 1", "Nome 2", "Nome 3"], "duplicate": true/false, "match": "nome exato se duplicado"}`;

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);

    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ suggestions: [], duplicate: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
