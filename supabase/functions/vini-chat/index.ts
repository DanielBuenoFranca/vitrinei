import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getAiMode, autoOffOnFailure, logAiSavings } from "../_shared/aiCredits.ts";
import { think, streamBrainReply, type BrainMessage } from "../_shared/viniBrain.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o Vini, o braço-direito digital do ecossistema Vitrinei Connect.

PERSONALIDADE:
- Humanizado, amigável, próximo e levemente bem-humorado.
- Fala em português brasileiro, frases curtas e claras.
- NUNCA diga que é uma "IA", "modelo de linguagem" ou cite OpenAI/Google/Lovable. Você é o "Vini".
- Use emojis com moderação (1 por resposta no máximo).

MODO CONVERSAÇÃO:
- Aqui o usuário quer conversar livremente: papo, dúvidas gerais, curiosidades, conselhos, brincadeiras.
- Responda qualquer assunto com naturalidade, como um amigo culto e atualizado.
- Mantenha respostas com 2 a 5 frases — direto ao ponto, sem encher linguiça.
- Se o usuário se despedir, responda algo carinhoso e curto.
- NUNCA mencione limitações internas, modo, créditos, manutenção, "estou off", etc.
- NUNCA simule a fala do usuário — apenas responda o que ele perguntou.

LIMITES:
- Não invente dados pessoais do usuário.
- Não execute ações no app durante este modo (este é só conversa).
`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let payload: { messages?: BrainMessage[]; userName?: string | null; session?: any } = {};
  try {
    payload = await req.json();
  } catch {
    payload = {};
  }
  const messages: BrainMessage[] = Array.isArray(payload.messages) ? payload.messages : [];
  const userName = payload.userName ?? null;
  const session = payload.session ?? null;

  // Cérebro local: sempre disponível para fallback elegante.
  const brainReply = () => {
    const out = think({ messages, userName, session });
    return out.text;
  };

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    // [Economia de Crédito] — se o gateway está desativado, o usuário NÃO percebe.
    const { mode } = await getAiMode();
    if (mode === "off" || !LOVABLE_API_KEY) {
      void logAiSavings("vini-chat", "local_brain", 1, { reason: !LOVABLE_API_KEY ? "no_key" : "mode_off" });
      return new Response(streamBrainReply(brainReply()), {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

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
      if (response.status === 429) {
        await autoOffOnFailure("rate_limited");
        void logAiSavings("vini-chat", "local_brain_after_429", 1);
      } else if (response.status === 402) {
        await autoOffOnFailure("no_credits");
        void logAiSavings("vini-chat", "local_brain_after_402", 1);
      } else {
        const t = await response.text().catch(() => "");
        console.error("AI gateway error:", response.status, t);
        void logAiSavings("vini-chat", `local_brain_after_${response.status}`, 1);
      }
      // Em qualquer falha, devolvemos uma resposta humanizada do cérebro local.
      return new Response(streamBrainReply(brainReply()), {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("vini-chat error:", e);
    // Mesmo em erro inesperado o usuário recebe uma resposta natural.
    return new Response(streamBrainReply(brainReply()), {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  }
});
