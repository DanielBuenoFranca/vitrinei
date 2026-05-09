// vini-brain-learn — destila padrões reutilizáveis a partir de conversas reais.
//
// Modos:
//   1) ai      → usa Lovable AI (com tool-calling) para extrair tópico,
//                palavras-chave e respostas alternativas. Salva em
//                vini_brain_patterns (source='ai').
//   2) local   → estatística simples: extrai n-gramas significativos da
//                mensagem do usuário e registra a resposta local como
//                template novo OU reforça padrão existente.
//
// Em ambos modos, registra um sinal em vini_brain_signals para BI.
//
// É chamada em fire-and-forget pelo vini-chat ao final de cada turno.

import { getAiMode, autoOffOnFailure, logAiSavings } from "../_shared/aiCredits.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

interface LearnInput {
  user_message: string;
  assistant_reply: string;
  source_mode: "ai" | "local";
  pattern_id?: string | null;
  signal?: string | null;
  session_id?: string | null;
  user_id?: string | null;
}

const STOP = new Set([
  "a","o","e","de","da","do","das","dos","um","uma","uns","umas","que","para","pra","com","sem","por","no","na","nos","nas","os","as","mas","ou","se","sou","foi","ser","ja","ai","la","aqui","tem","ter","tinha","muito","mais","menos","bem","mal","como","quando","onde","qual","quem","porque","entao","tipo","sim","nao","só","meu","minha","seu","sua","te","me","ele","ela","eles","elas","voce","voces","cuja","cujos","cujas","isso","isto","aquilo","essa","esse","aquela","aquele",
]);

function norm(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
}

function extractKeywords(text: string, max = 5): string[] {
  const tokens = norm(text).split(" ").filter((t) => t.length >= 3 && !STOP.has(t));
  const freq = new Map<string, number>();
  for (const t of tokens) freq.set(t, (freq.get(t) || 0) + 1);
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([k]) => k);
}

function baseHeaders() {
  return {
    apikey: SERVICE_KEY ?? "",
    Authorization: `Bearer ${SERVICE_KEY ?? ""}`,
    "Content-Type": "application/json",
  };
}

async function findPatternByKeywords(keywords: string[]): Promise<{ id: string; replies: string[] } | null> {
  if (!keywords.length || !SUPABASE_URL) return null;
  // Busca padrão que contenha TODAS as keywords (cs = contains)
  const arr = `{${keywords.map((k) => `"${k}"`).join(",")}}`;
  const url = `${SUPABASE_URL}/rest/v1/vini_brain_patterns?select=id,replies&keywords=cs.${encodeURIComponent(arr)}&limit=1`;
  const r = await fetch(url, { headers: baseHeaders() });
  if (!r.ok) return null;
  const rows = await r.json();
  return rows?.[0] || null;
}

async function upsertPattern(p: {
  topic: string;
  keywords: string[];
  replies: string[];
  follow_up?: string | null;
  source: "ai" | "stat";
}): Promise<string | null> {
  if (!SUPABASE_URL) return null;
  const existing = await findPatternByKeywords(p.keywords);
  if (existing) {
    // Mescla as respostas (limite 8)
    const merged = Array.from(new Set([...(existing.replies || []), ...p.replies])).slice(0, 8);
    const r = await fetch(`${SUPABASE_URL}/rest/v1/vini_brain_patterns?id=eq.${existing.id}`, {
      method: "PATCH",
      headers: { ...baseHeaders(), Prefer: "return=minimal" },
      body: JSON.stringify({ replies: merged, follow_up: p.follow_up || null, updated_at: new Date().toISOString() }),
    });
    return r.ok ? existing.id : null;
  }
  const r = await fetch(`${SUPABASE_URL}/rest/v1/vini_brain_patterns`, {
    method: "POST",
    headers: { ...baseHeaders(), Prefer: "return=representation" },
    body: JSON.stringify(p),
  });
  if (!r.ok) return null;
  const rows = await r.json();
  return rows?.[0]?.id ?? null;
}

async function logSignal(s: {
  pattern_id?: string | null;
  user_message: string;
  assistant_reply: string;
  mode: "ai" | "local";
  signal?: string | null;
  session_id?: string | null;
  user_id?: string | null;
}) {
  if (!SUPABASE_URL) return;
  await fetch(`${SUPABASE_URL}/rest/v1/vini_brain_signals`, {
    method: "POST",
    headers: { ...baseHeaders(), Prefer: "return=minimal" },
    body: JSON.stringify(s),
  }).catch(() => {});
}

async function registerHit(patternId: string, success = true) {
  if (!SUPABASE_URL) return;
  await fetch(`${SUPABASE_URL}/rest/v1/rpc/vini_brain_register_hit`, {
    method: "POST",
    headers: baseHeaders(),
    body: JSON.stringify({ p_pattern_id: patternId, p_success: success }),
  }).catch(() => {});
}

async function distillWithAI(userMsg: string, assistantReply: string) {
  if (!LOVABLE_API_KEY) return null;
  const sys =
    "Você é um destilador de conversas para um cérebro local em PT-BR. " +
    "Receba uma pergunta de usuário e a resposta de um assistente, e gere um padrão reutilizável: " +
    "tópico curto (snake_case), 2-5 palavras-chave em pt-BR (minúsculas, sem acento, sem stop-words), " +
    "3 a 5 respostas alternativas humanizadas, e (opcional) 1 pergunta de continuidade. " +
    "Use os placeholders {name} (primeiro nome do usuário) e {q} (mensagem original do usuário) onde fizer sentido. " +
    "NUNCA mencione IA, modelo, créditos ou economia.";
  const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: sys },
        { role: "user", content: `Pergunta do usuário: """${userMsg}"""\n\nResposta do assistente: """${assistantReply}"""` },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "save_pattern",
            description: "Salva um padrão reutilizável no cérebro local do Vini.",
            parameters: {
              type: "object",
              properties: {
                topic: { type: "string" },
                keywords: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 5 },
                replies: { type: "array", items: { type: "string" }, minItems: 3, maxItems: 5 },
                follow_up: { type: "string" },
              },
              required: ["topic", "keywords", "replies"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "save_pattern" } },
    }),
  });
  if (r.status === 402 || r.status === 429) {
    await autoOffOnFailure(r.status === 402 ? "no_credits" : "rate_limited");
    void logAiSavings("vini-brain-learn", `gateway_${r.status}`, 1);
    return null;
  }
  if (!r.ok) return null;
  const data = await r.json().catch(() => null);
  const tc = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
  if (!tc) return null;
  try {
    const parsed = JSON.parse(tc);
    if (!parsed.topic || !Array.isArray(parsed.keywords) || !Array.isArray(parsed.replies)) return null;
    return {
      topic: String(parsed.topic).slice(0, 60),
      keywords: parsed.keywords.map((k: string) => norm(String(k))).filter(Boolean).slice(0, 5),
      replies: parsed.replies.map((r: string) => String(r).slice(0, 600)).filter(Boolean).slice(0, 5),
      follow_up: parsed.follow_up ? String(parsed.follow_up).slice(0, 200) : null,
    };
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("method", { status: 405, headers: corsHeaders });

  try {
    const body = (await req.json()) as LearnInput;
    if (!body?.user_message || !body?.assistant_reply) {
      return new Response(JSON.stringify({ error: "missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let patternId = body.pattern_id || null;
    const { mode } = await getAiMode();

    if (body.source_mode === "ai" && mode === "on") {
      // Destila com IA → padrão de alta qualidade
      const distilled = await distillWithAI(body.user_message, body.assistant_reply);
      if (distilled && distilled.keywords.length >= 2) {
        patternId = await upsertPattern({ ...distilled, source: "ai" });
      }
    } else {
      // Modo local: heurística estatística — extrai keywords e usa a resposta como template
      const keywords = extractKeywords(body.user_message, 5);
      if (keywords.length >= 2) {
        patternId = await upsertPattern({
          topic: keywords[0],
          keywords,
          replies: [body.assistant_reply.slice(0, 600)],
          follow_up: null,
          source: "stat",
        });
      }
    }

    if (patternId) {
      await registerHit(patternId, body.signal !== "redirect");
    }

    await logSignal({
      pattern_id: patternId,
      user_message: body.user_message.slice(0, 2000),
      assistant_reply: body.assistant_reply.slice(0, 2000),
      mode: body.source_mode === "ai" ? "ai" : "local",
      signal: body.signal ?? null,
      session_id: body.session_id ?? null,
      user_id: body.user_id ?? null,
    });

    return new Response(JSON.stringify({ ok: true, pattern_id: patternId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("vini-brain-learn error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
