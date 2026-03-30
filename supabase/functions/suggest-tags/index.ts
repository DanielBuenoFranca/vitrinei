import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { segment, existingTags } = await req.json();

    const existingList = (existingTags || []).slice(0, 50).join(", ");
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
    const res = await fetch("https://api.lovable.dev/v1/chat/completions", {
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
    return new Response(JSON.stringify({ tags: [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
