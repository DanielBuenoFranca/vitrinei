import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getAiMode, autoOffOnFailure, logAiSavings } from "../_shared/aiCredits.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Heuristic fallback per segment when AI is OFF.
const SEG_FALLBACK: Record<string, string[]> = {
  beleza: ["esmalte","shampoo","condicionador","tinta de cabelo","escova","secador","creme","mascara","alicate","algodao"],
  construcao: ["cimento","areia","brita","tijolo","argamassa","cal","tinta","pincel","rolo","prego","parafuso","martelo"],
  automotivo: ["oleo","filtro","pneu","pastilha","fluido","bateria","correia","vela","aditivo","amortecedor"],
  saude: ["luva","mascara","alcool","gaze","esparadrapo","seringa","termometro","oximetro","atadura"],
  pet: ["racao","petisco","areia","shampoo pet","coleira","brinquedo","vermifugo","caixa de transporte"],
  alimentacao: ["embalagem","guardanapo","talher descartavel","copo","luva descartavel","papel toalha","sacola"],
};

function heuristicTags(segment: string, existing: string[]): string[] {
  const norm = (s: string) => (s || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const key = Object.keys(SEG_FALLBACK).find((k) => norm(segment).includes(k));
  const base = key ? SEG_FALLBACK[key] : ["produto","insumo","ferramenta","peca","material","acessorio","kit","manutencao","suprimento","embalagem"];
  const have = new Set(existing.map(norm));
  return base.filter((t) => !have.has(norm(t))).slice(0, 15);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { segment, existingTags } = await req.json();
    const existingArr: string[] = Array.isArray(existingTags) ? existingTags : [];

    // [Economia de Crédito] Honor the global toggle.
    const { mode } = await getAiMode();
    if (mode === "off") {
      void logAiSavings("suggest-tags", "heuristic_local", 1, { segment });
      return new Response(JSON.stringify({ tags: heuristicTags(segment || "", existingArr) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const existingList = existingArr.slice(0, 50).join(", ");
    const prompt = `Você é um especialista em categorização de produtos para uma plataforma de serviços e marketplace.

O segmento é: "${segment}"

Tags já existentes nesse segmento: [${existingList}]

Regras:
1. Sugira tags de produtos que fazem sentido para esse segmento de atuação profissional
2. As tags devem ser palavras-chave curtas que categorizam PRODUTOS (não serviços)
3. Pense em materiais, ferramentas, insumos, peças e itens que profissionais desse segmento usam ou vendem
4. Retorne entre 10 e 20 tags relevantes
5. Não repita tags que já existem na lista
6. Tags devem ser em português, minúsculas, sem acentos desnecessários

Responda APENAS em JSON: {"tags": ["tag1", "tag2", ...]}`;

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
      void logAiSavings("suggest-tags", `gateway_${res.status}`, 1, { auto_off: true });
      return new Response(JSON.stringify({ tags: heuristicTags(segment || "", existingArr) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);
    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ tags: [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
