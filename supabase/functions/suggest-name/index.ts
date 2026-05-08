import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getAiMode, autoOffOnFailure, logAiSavings } from "../_shared/aiCredits.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function heuristic(input: string, existing: string[]): { suggestions: string[]; duplicate: boolean; match?: string } {
  const norm = (s: string) => (s || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const ni = norm(input);
  const exact = existing.find((e) => norm(e) === ni);
  if (exact) return { suggestions: [exact], duplicate: true, match: exact };
  const tidy = (input || "").trim().replace(/\s+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const similar = existing
    .filter((e) => norm(e).includes(ni) || ni.includes(norm(e)))
    .slice(0, 2);
  return { suggestions: [tidy, ...similar].filter(Boolean).slice(0, 3), duplicate: false };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { input, type, existing } = await req.json();
    const existingArr: string[] = Array.isArray(existing) ? existing : [];

    // [Economia de Crédito] Honor the global toggle.
    const { mode } = await getAiMode();
    if (mode === "off") {
      void logAiSavings("suggest-name", "heuristic_local", 1, { type });
      return new Response(JSON.stringify(heuristic(input, existingArr)), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const existingList = existingArr.slice(0, 50).join(", ");
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

    if (res.status === 402 || res.status === 429) {
      await autoOffOnFailure(res.status === 402 ? "no_credits" : "rate_limited");
      void logAiSavings("suggest-name", `gateway_${res.status}`, 1, { auto_off: true });
      return new Response(JSON.stringify(heuristic(input, existingArr)), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
