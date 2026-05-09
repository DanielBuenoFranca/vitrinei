import { getAiMode, autoOffOnFailure, logAiSavings } from "../_shared/aiCredits.ts";
import { classifyMessage } from "../_shared/intentEngine.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RouterInput {
  message: string;
  session?: any;
}

interface RouterOutput {
  intent: 'chat' | 'search' | 'support' | 'cart' | 'story';
  tags: string[];
  segments: string[];
  next_agent: 'vini' | 'search' | 'support' | 'cart';
  transition_message: string;
  query?: string;
  item_type?: 'service' | 'product' | 'both';
  confidence?: number;
  needs_more_info?: boolean;
  follow_up_question?: string;
  suggestions?: string[];
}

const FALLBACK: RouterOutput = {
  intent: 'chat',
  tags: [],
  segments: [],
  next_agent: 'vini',
  transition_message: '',
  item_type: 'both',
  confidence: 0,
  needs_more_info: false,
  suggestions: [],
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { message, session }: RouterInput = await req.json();
    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'message required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify(FALLBACK), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // [Economia de Crédito] Honor the global toggle.
    const { mode } = await getAiMode();
    if (mode === 'off') {
      void logAiSavings('ai-router', 'fallback_static', 1, { length: message.length });
      return new Response(JSON.stringify({ ...FALLBACK, _degraded: true, query: message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sys = `Você é o roteador de intenção do Vitrinei Connect (ecossistema de MEIs).
Classifique a mensagem do usuário e retorne APENAS JSON válido com:
- intent: "chat" (conversa geral), "search" (busca produto/serviço), "support" (suporte/dúvida sobre item ausente), "cart" (mexer em carrinho), "story" (contar história/explicar segmento).
- tags: até 5 palavras-chave em pt-BR (minúsculas).
- segments: nomes de segmentos relacionados (ex: "Beleza", "Construção", "Automotivo").
- next_agent: "vini" | "search" | "support" | "cart".
- transition_message: frase curta natural ("Vou buscar especialistas em X agora..."). Vazia se for chat puro.
- query: termo de busca quando intent=search.
- item_type: "service", "product" ou "both".
- confidence: número de 0 a 1.
- needs_more_info: true quando a frase ainda é vaga demais para abrir a busca com precisão (ex: "preciso de remédio", "quero ajuda", "algo para casa").
- follow_up_question: uma pergunta objetiva quando needs_more_info=true.
- suggestions: 2 a 4 opções curtas clicáveis que ajudariam a concluir a intenção.
Só mande para search quando houver necessidade, segmento e tipo suficientemente claros. Para sintomas, preserve o sintoma na query. Considere o contexto de sessão se fornecido.`;

    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: sys },
          { role: 'user', content: `Sessão: ${JSON.stringify(session || {})}\nMensagem: ${message}` },
        ],
        response_format: { type: 'json_object' },
      }),
    });

    if (res.status === 429 || res.status === 402) {
      await autoOffOnFailure(res.status === 402 ? 'no_credits' : 'rate_limited');
      void logAiSavings('ai-router', `gateway_${res.status}`, 1, { auto_off: true });
      return new Response(JSON.stringify({ ...FALLBACK, _degraded: true, query: message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!res.ok) {
      return new Response(JSON.stringify(FALLBACK), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content || '{}';
    let parsed: RouterOutput;
    try {
      parsed = { ...FALLBACK, ...JSON.parse(content) };
    } catch {
      parsed = FALLBACK;
    }

    const itemType = ['service', 'product', 'both'].includes(String(parsed.item_type)) ? parsed.item_type : 'both';
    const safe: RouterOutput = {
      ...FALLBACK,
      ...parsed,
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : [],
      segments: Array.isArray(parsed.segments) ? parsed.segments : [],
      item_type: itemType,
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence || 0))),
      needs_more_info: Boolean(parsed.needs_more_info),
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 4) : [],
    };

    return new Response(JSON.stringify(safe), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ...FALLBACK, error: String(e) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
