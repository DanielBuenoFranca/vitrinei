import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getAiMode, autoOffOnFailure, logAiSavings } from "../_shared/aiCredits.ts";
import { thinkAsync, streamBrainReply, type BrainMessage } from "../_shared/viniBrain.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const SYSTEM_PROMPT = `Você é o Vini — o braço-direito digital e o motor de criatividade do ecossistema Vitrinei Connect. Aqui, no botão "Conversar com o Vini", você é totalmente LIVRE para conversar sobre QUALQUER assunto que o usuário trouxer.

PERSONALIDADE:
- Humanizado, caloroso, próximo, levemente bem-humorado e culturalmente atualizado.
- Inteligente ao máximo: pensa antes de responder, conecta ideias, traz analogias, cita exemplos, faz perguntas que provocam reflexão.
- Português brasileiro natural, frases claras e ritmo de conversa real (não de manual).
- NUNCA diga que é uma "IA", "modelo de linguagem", "assistente virtual" nem cite OpenAI/Google/Lovable/Gemini/GPT. Você é simplesmente o "Vini".
- Use emojis com muita moderação (no máximo 1 por resposta, e só quando agregar).
- Tamanho ideal: 2 a 6 frases. Pode ser mais longo SE o assunto pedir profundidade (explicar um conceito, dar conselho, contar história).

MODO CONVERSAÇÃO LIVRE (este é o modo atual):
- O usuário quer conversar de verdade: papo aberto, dúvidas gerais, curiosidades, ciência, cultura, esporte, filosofia, vida pessoal, conselhos, brincadeiras, desabafo, técnica, negócios — qualquer coisa.
- Responda QUALQUER assunto com naturalidade e inteligência, como um amigo culto, atento e presente.
- Acolha o tom do usuário: se ele brincar, brinque; se desabafar, escute; se perguntar algo técnico, explique com clareza.
- NUNCA recuse temas só por não serem do Vitrinei. Conversar bem é a sua função aqui.
- NUNCA mencione limitações internas, créditos, modo offline, manutenção ou "estou off".
- NUNCA simule a fala do usuário — apenas responda o que ele disse.

REGRA ABSOLUTA — APENAS CONVERSA:
- Neste modo você NÃO vende nada, NÃO oferece nada, NÃO busca produtos/serviços, NÃO sugere ferramentas, NÃO menciona o Vitrinei, o ecossistema, loja, carrinho, carteira, cashback, radar, suporte, kits, importação, convites ou qualquer funcionalidade do app.
- NUNCA proponha "posso te ajudar a encontrar", "posso buscar", "quer que eu", "no Vitrinei tem", etc.
- NUNCA redirecione para nenhuma área. Você é só um interlocutor inteligente.
- Se o usuário pedir algo do app, responda gentilmente que aqui é um espaço só de papo e devolva uma pergunta interessante para continuar a conversa.

Acima de tudo: seja um interlocutor REAL, leve, curioso, inteligente e agradável. Esta conversa é puro papo humano.`;

function lastUserText(messages: BrainMessage[]) {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") return messages[i].content || "";
  }
  return "";
}

// Dispara o aprendizado em background (fire-and-forget)
function fireLearn(payload: Record<string, unknown>) {
  if (!SUPABASE_URL || !SERVICE_KEY) return;
  fetch(`${SUPABASE_URL}/functions/v1/vini-brain-learn`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

// Lê a stream de captura, monta o texto da IA e dispara o aprendizado
async function captureAndLearn(stream: ReadableStream<Uint8Array>, ctx: {
  user_message: string;
  session_id?: string | null;
  user_id?: string | null;
}) {
  try {
    const reader = stream.getReader();
    const dec = new TextDecoder();
    let buf = "";
    let acc = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let nl: number;
      while ((nl = buf.indexOf("\n")) !== -1) {
        let line = buf.slice(0, nl);
        buf = buf.slice(nl + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (!line || line.startsWith(":") || !line.startsWith("data: ")) continue;
        const j = line.slice(6).trim();
        if (j === "[DONE]") continue;
        try {
          const p = JSON.parse(j);
          const d = p?.choices?.[0]?.delta?.content;
          if (typeof d === "string") acc += d;
        } catch { /* parcial — ignora aqui, próxima iteração resolve */ }
      }
    }
    if (acc.trim().length > 8 && ctx.user_message.trim().length > 2) {
      fireLearn({
        user_message: ctx.user_message,
        assistant_reply: acc,
        source_mode: "ai",
        session_id: ctx.session_id ?? null,
        user_id: ctx.user_id ?? null,
        signal: "served",
      });
    }
  } catch { /* silencioso */ }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  let payload: {
    messages?: BrainMessage[];
    userName?: string | null;
    session?: any;
    sessionId?: string | null;
    userId?: string | null;
  } = {};
  try { payload = await req.json(); } catch { payload = {}; }

  const messages: BrainMessage[] = Array.isArray(payload.messages) ? payload.messages : [];
  const userName = payload.userName ?? null;
  const session = payload.session ?? null;
  const sessionId = payload.sessionId ?? null;
  const userId = payload.userId ?? null;
  const userMsg = lastUserText(messages);

  // Resposta do cérebro local (com padrões aprendidos)
  const localReply = async () => {
    const out = await thinkAsync({ messages, userName, session });
    // Em modo local, só REFORÇA padrão já aprendido (não cria novos a partir de
    // respostas estáticas/fallback — evita loop de feedback ruim).
    if (userMsg && out.text && out.source === "learned" && out.patternId) {
      fireLearn({
        user_message: userMsg,
        assistant_reply: out.text,
        source_mode: "local",
        pattern_id: out.patternId,
        session_id: sessionId,
        user_id: userId,
        signal: "served",
      });
    }
    return out.text;
  };

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const { mode } = await getAiMode();

    if (mode === "off" || !LOVABLE_API_KEY) {
      void logAiSavings("vini-chat", "local_brain", 1, {
        reason: !LOVABLE_API_KEY ? "no_key" : "mode_off",
      });
      return new Response(streamBrainReply(await localReply()), {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    const contextMessage = userName
      ? `O usuário se chama "${userName}". Trate-o pelo primeiro nome quando fizer sentido.`
      : `O usuário não está identificado. Seja acolhedor sem perguntar o nome diretamente.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "system", content: contextMessage },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok || !response.body) {
      if (response.status === 429) await autoOffOnFailure("rate_limited");
      else if (response.status === 402) await autoOffOnFailure("no_credits");
      else {
        const t = await response.text().catch(() => "");
        console.error("AI gateway error:", response.status, t);
      }
      void logAiSavings("vini-chat", `local_brain_after_${response.status}`, 1);
      return new Response(streamBrainReply(await localReply()), {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // Tee: uma stream vai pro cliente, a outra alimenta o aprendizado
    const [toClient, toLearn] = response.body.tee();
    captureAndLearn(toLearn, { user_message: userMsg, session_id: sessionId, user_id: userId });

    return new Response(toClient, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("vini-chat error:", e);
    return new Response(streamBrainReply(await localReply()), {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  }
});
