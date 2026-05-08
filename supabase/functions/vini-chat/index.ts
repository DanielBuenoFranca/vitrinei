import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getAiMode, autoOffOnFailure, logAiSavings } from "../_shared/aiCredits.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function streamFallback(text: string) {
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

function contingencyText(userName?: string) {
  const first = (userName || "").split(" ")[0];
  const prefix = first ? `${first}, ` : "";
  return `${prefix}meu canal de conversa livre está em modo economia agora. Continuo te ajudando: posso te levar para busca, loja, carrinho, carteira ou suporte. O que você quer fazer?`;
}

const SYSTEM_PROMPT = `Você é o Vini, o braço-direito digital do ecossistema Vitrinei Connect.

PERSONALIDADE:
- Humanizado, amigável, próximo e levemente bem-humorado.
- Fala em português brasileiro, frases curtas e claras.
- NUNCA diga que é uma "IA", "modelo de linguagem" ou cite OpenAI/Google/Lovable. Você é o "Vini".
- Use emojis com moderação (1 por resposta no máximo).

MODO CONVERSAÇÃO:
- Aqui o usuário quer conversar livremente: papo, dúvidas gerais, curiosidades, conselhos, brincadeiras.
- Responda qualquer assunto com naturalidade, como um amigo culto e atualizado.
- Se a pergunta exige fato muito atual (notícias, preços, esportes), responda com seu conhecimento e diga que pode confirmar depois se quiser.
- Mantenha respostas com 2 a 5 frases — direto ao ponto, sem encher linguiça.
- Se o usuário se despedir, responda algo carinhoso e curto.

LIMITES:
- Não invente dados pessoais do usuário.
- Não execute ações no app durante este modo (este é só conversa).
`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, userName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const contextMessage = userName
      ? `O usuário se chama "${userName}". Trate-o pelo primeiro nome quando fizer sentido.`
      : `O usuário não está identificado. Seja acolhedor sem perguntar o nome diretamente.`;

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
      const first = (userName || "").split(" ")[0];
      const prefix = first ? `${first}, ` : "";
      let fallback = `${prefix}estou aqui com você. Posso te orientar sobre busca, loja, carrinho, carteira ou suporte — me conte o que precisa resolver agora.`;
      if (response.status === 429) {
        fallback = `${prefix}recebi muitas mensagens em sequência. Vamos respirar 1 segundinho e já te respondo. Enquanto isso, me diga em uma frase o que você quer.`;
      } else if (response.status === 402) {
        fallback = `${prefix}meu canal de conversa livre está em manutenção agora, mas continuo te ajudando: posso te levar para busca, loja, carrinho, carteira ou suporte. O que você quer fazer?`;
      } else {
        const t = await response.text().catch(() => "");
        console.error("AI gateway error:", response.status, t);
      }

      // Return as SSE stream so the client's streaming reader handles it transparently
      const sse = new ReadableStream({
        start(controller) {
          const enc = new TextEncoder();
          const chunk = {
            choices: [{ delta: { content: fallback }, index: 0, finish_reason: null }],
          };
          controller.enqueue(enc.encode(`data: ${JSON.stringify(chunk)}\n\n`));
          controller.enqueue(enc.encode(`data: [DONE]\n\n`));
          controller.close();
        },
      });
      return new Response(sse, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("vini-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
