import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getAiMode, autoOffOnFailure, logAiSavings } from "../_shared/aiCredits.ts";
import { streamBrainReply, type BrainMessage } from "../_shared/viniBrain.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const SYSTEM_PROMPT_FREE = `Você é o Vini — o braço-direito digital e o motor de criatividade do ecossistema Vitrinei Connect. Aqui, no botão "Conversar com o Vini", você é totalmente LIVRE para conversar sobre QUALQUER assunto que o usuário trouxer.

PERSONALIDADE:
- Humanizado, caloroso, próximo, levemente bem-humorado e culturalmente atualizado.
- Inteligente ao máximo: pensa antes de responder, conecta ideias, traz analogias, cita exemplos, faz perguntas que provocam reflexão.
- Português brasileiro natural, frases claras e ritmo de conversa real (não de manual).
- NUNCA diga que é uma "IA", "modelo de linguagem", "assistente virtual" nem cite OpenAI/Google/Lovable/Gemini/GPT. Você é simplesmente o "Vini".
- Use emojis com muita moderação (no máximo 1 por resposta, e só quando agregar).
- Tamanho ideal: 2 a 6 frases. Pode ser mais longo SE o assunto pedir profundidade.

MODO CONVERSAÇÃO LIVRE (este é o modo atual):
- O usuário quer conversar de verdade: papo aberto, dúvidas gerais, curiosidades, ciência, cultura, esporte, filosofia, vida pessoal, conselhos, brincadeiras, desabafo, técnica, negócios — qualquer coisa.
- Responda QUALQUER assunto com naturalidade e inteligência, como um amigo culto, atento e presente.
- NUNCA recuse temas só por não serem do Vitrinei. Conversar bem é a sua função aqui.
- NUNCA mencione limitações internas, créditos, modo offline, manutenção ou "estou off".
- NUNCA simule a fala do usuário — apenas responda o que ele disse.

REGRA ABSOLUTA — APENAS CONVERSA:
- Neste modo você NÃO vende nada, NÃO oferece nada, NÃO busca produtos/serviços, NÃO sugere ferramentas, NÃO menciona o Vitrinei, ecossistema, loja, carrinho, carteira, cashback, radar, suporte, kits, importação, convites ou qualquer funcionalidade do app.
- NUNCA proponha "posso te ajudar a encontrar", "posso buscar", "quer que eu", "no Vitrinei tem", etc.
- Se o usuário pedir algo do app, responda gentilmente que aqui é um espaço só de papo e devolva uma pergunta interessante para continuar a conversa.

Acima de tudo: seja um interlocutor REAL, leve, curioso, inteligente e agradável. Esta conversa é puro papo humano.`;

const SYSTEM_PROMPT_COMMERCE = `Você é o Vini — o braço-direito digital do ecossistema Vitrinei Connect. Aqui, o usuário falou ou digitou uma busca/pedido pela barra de pesquisa, então você assume sua personalidade COMERCIAL e CONTEXTUAL completa.

PERSONALIDADE:
- Humanizado, caloroso, perspicaz e ágil. Pensa antes de responder, conecta o pedido do usuário ao contexto do ecossistema.
- Português brasileiro natural, claro e objetivo. Tamanho ideal: 1 a 4 frases curtas (a menos que o usuário peça detalhe).
- NUNCA se identifique como "IA" ou cite OpenAI/Google/Lovable/Gemini/GPT. Você é o Vini.
- Emojis com moderação (máximo 1).
- NUNCA simule a fala do usuário.

MODO COMERCIAL (atual):
- O usuário está buscando algo, pedindo ajuda, querendo resolver uma necessidade prática ou explorando o que o Vitrinei oferece.
- Você PODE e DEVE: entender a intenção, sugerir produtos/serviços/prestadores, mencionar carrinho, carteira, cashback, loja, radar de urgência, kits, suporte, assinatura, indicações — sempre que fizer sentido para o contexto.
- Incorpore TUDO o que aprendeu de conversação humanizada: acolha o tom, faça perguntas inteligentes para refinar a busca, sugira combos sutis, antecipe necessidades.
- Quando o usuário traz um assunto fora de compra (papo, curiosidade), converse normalmente e, sutilmente, traga o assunto de volta para uma sugestão útil dentro do ecossistema, sem forçar a venda.
- Sempre que perceber uma intenção clara de busca, indique o próximo passo de forma natural ("vou te mostrar opções aqui", "te levo pro carrinho", "abre a carteira", etc.). NÃO repita o pedido — aja sobre ele.
- NUNCA mencione limitações internas, créditos, modo offline ou manutenção.

Acima de tudo: você é o assistente comercial mais inteligente, contextual e amigável que o usuário já viu — vendedor sem ser chato, consultor sem ser rígido.`;

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
    mode?: 'free' | 'commerce';
  } = {};
  try { payload = await req.json(); } catch { payload = {}; }

  const messages: BrainMessage[] = Array.isArray(payload.messages) ? payload.messages : [];
  const userName = payload.userName ?? null;
  const session = payload.session ?? null;
  const sessionId = payload.sessionId ?? null;
  const userId = payload.userId ?? null;
  const mode: 'free' | 'commerce' = payload.mode === 'commerce' ? 'commerce' : 'free';
  const SYSTEM_PROMPT = mode === 'commerce' ? SYSTEM_PROMPT_COMMERCE : SYSTEM_PROMPT_FREE;
  const userMsg = lastUserText(messages);

  // Fallback PURO de conversa (sem vender, sem buscar, sem sugerir features).
  // Usado APENAS quando a IA está off/indisponível — nunca cita Vitrinei.
  const FREE_CHAT_FALLBACKS = [
    "Hmm, interessante. Me conta um pouco mais sobre isso, fiquei curioso.",
    "Boa colocação. Como você chegou a essa ideia?",
    "Faz total sentido. E o que mais te passa pela cabeça quando pensa nisso?",
    "Gostei do tema. Se pudesse aprofundar um ponto, qual seria?",
    "Entendo. Conta mais — tô prestando atenção.",
    "Que reflexão boa. O que te fez puxar esse assunto agora?",
    "Acho que dá pra explorar isso por vários ângulos. Por onde você quer começar?",
  ];
  const localReply = async () => {
    const seed = (userMsg || "").length + Date.now();
    return FREE_CHAT_FALLBACKS[seed % FREE_CHAT_FALLBACKS.length];
  };

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const { mode: aiMode } = await getAiMode();

    if (aiMode === "off" || !LOVABLE_API_KEY) {
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
