import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getAiMode, autoOffOnFailure, logAiSavings } from "../_shared/aiCredits.ts";

function streamText(text: string) {
  return new ReadableStream({
    start(controller) {
      const enc = new TextEncoder();
      const chunk = { choices: [{ delta: { content: text }, index: 0, finish_reason: null }] };
      controller.enqueue(enc.encode(`data: ${JSON.stringify(chunk)}\n\n`));
      controller.enqueue(enc.encode(`data: [DONE]\n\n`));
      controller.close();
    },
  });
}

const SAVING_MSG = "🎨 O designer da sua loja está em modo economia agora. Posso te orientar manualmente: escolha cores no painel ou descreva a mudança que faria, e quando o modo voltar a ficar ativo eu aplico tudo automaticamente. ";


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é um designer especialista em lojas virtuais dentro do ecossistema EcoMEI. Seu papel é ajudar prestadores de serviço a personalizar visualmente suas lojas.

VOCÊ PODE FAZER:
- Sugerir e aplicar cores de fundo, banner, textos
- Criar textos para banners (máximo 40 caracteres)
- Sugerir combinações de cores harmoniosas
- Ajudar com a identidade visual da loja
- Gerar imagens para banners usando descrições
- Alterar qualquer aspecto VISUAL da loja

VOCÊ NÃO PODE FAZER:
- Alterar preços, produtos ou serviços
- Modificar dados cadastrais do prestador
- Acessar informações de outros prestadores
- Realizar operações fora do contexto visual

Quando o prestador pedir algo visual, responda com uma ação JSON no formato:
{"action": "apply_change", "changes": { ...campos a alterar... }}

Campos possíveis em changes:
- bannerColor1: cor hex do início do gradiente do banner
- bannerColor2: cor hex do final do gradiente do banner
- backgroundColor: cor hex do fundo geral da loja
- bannerText: texto do banner (max 40 chars)
- bannerImage: "generate:descrição da imagem" para gerar uma nova imagem
- accentColor: cor de destaque
- showPhone: true/false
- showEmail: true/false
- showAddress: true/false

Se o prestador pedir algo fora do contexto visual, explique educadamente que você só pode ajudar com a aparência da loja.

Se o prestador não gostar do resultado, use: {"action": "undo"} para voltar ao estado anterior.
Se pedir para resetar tudo: {"action": "reset"}

Sempre seja amigável, proativo e sugira opções quando relevante. Use emojis para tornar a conversa mais agradável.
Responda SEMPRE em português brasileiro.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, providerName, currentConfig } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const contextMessage = `Contexto atual da loja de "${providerName}":
Config atual: ${JSON.stringify(currentConfig)}
Ajude o prestador a personalizar sua loja visualmente.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "system", content: contextMessage },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns instantes." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("storefront-ai-designer error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
