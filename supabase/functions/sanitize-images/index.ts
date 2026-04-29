// Edge function: saneamento de imagens (modo ON = IA paga, modo OFF = imagem grátis).
// Verifica site_settings.ai_credits_mode antes de chamar a IA. Se OFF ou se a IA falhar,
// delega para fetch-free-image (Unsplash → Pixabay) — Graceful Degradation total.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function callFreeFallback(supabase: any, payload: any) {
  const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/fetch-free-image`;
  const r = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
    },
    body: JSON.stringify(payload),
  });
  return r;
}

async function autoOffOnFailure(supabase: any, reason: string) {
  try {
    const { data } = await supabase.from("site_settings").select("id, value").eq("key","ai_credits_mode").maybeSingle();
    const cfg = (data?.value || {}) as any;
    if (cfg?.auto_off_on_error && cfg?.mode !== "off") {
      const next = { ...cfg, mode: "off", last_auto_off_reason: reason, last_auto_off_at: new Date().toISOString() };
      if (data?.id) await supabase.from("site_settings").update({ value: next, updated_at: new Date().toISOString() }).eq("id", data.id);
    }
  } catch (e) { console.warn("autoOff failed", e); }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const payload = await req.json();
    const { kind, id, name, segment } = payload || {};
    if (!kind || !id || !name) {
      return new Response(JSON.stringify({ error: "kind, id and name are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // 1) lê toggle
    const { data: settings } = await supabase.from("site_settings").select("value").eq("key","ai_credits_mode").maybeSingle();
    const aiMode = ((settings?.value as any)?.mode || "on") as "on" | "off";

    // 2) modo OFF → free direto
    if (aiMode === "off") {
      const r = await callFreeFallback(supabase, { kind, id, name, segment });
      return new Response(await r.text(), { status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 3) tenta IA paga
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      await autoOffOnFailure(supabase, "missing_lovable_key");
      const r = await callFreeFallback(supabase, { kind, id, name, segment });
      return new Response(await r.text(), { status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let prompt = "";
    if (kind === "provider") {
      prompt = `Modern minimalist logo icon for a small business "${name}" in "${segment || 'services'}". Bold colors, geometric, on clean white background, no text, flat design, suitable as avatar.`;
    } else if (kind === "product") {
      prompt = `Professional studio product photo of "${name}" (category: ${segment || 'general'}), clean white background, e-commerce catalog style, no text or watermarks.`;
    } else if (kind === "kit") {
      prompt = `Professional photo of a product kit/bundle named "${name}" (${segment || 'general'}), multiple items grouped, clean white background, e-commerce style, no text.`;
    } else {
      return new Response(JSON.stringify({ error: "invalid kind" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    // 402 (sem crédito) ou 429 → auto-off + free fallback (silencioso)
    if (aiRes.status === 402 || aiRes.status === 429) {
      await autoOffOnFailure(supabase, aiRes.status === 402 ? "no_credits" : "rate_limited");
      const r = await callFreeFallback(supabase, { kind, id, name, segment });
      return new Response(await r.text(), { status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!aiRes.ok) {
      console.error("AI error:", aiRes.status, await aiRes.text());
      const r = await callFreeFallback(supabase, { kind, id, name, segment });
      return new Response(await r.text(), { status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiData = await aiRes.json();
    const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageData?.startsWith("data:image")) {
      const r = await callFreeFallback(supabase, { kind, id, name, segment });
      return new Response(await r.text(), { status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const m = imageData.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
    if (!m) throw new Error("invalid image data");
    const ext = m[1] === "jpeg" ? "jpg" : m[1];
    const bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));

    const bucket = kind === "provider" ? "provider-logos" : "storefront-assets";
    const folder = kind === "provider" ? "" : `${kind}-images/`;
    const safeName = name.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 30);
    const fileName = `${folder}sanitized-${kind}-${id}-${Date.now()}-${safeName}.${ext}`;

    const { error: upErr } = await supabase.storage.from(bucket).upload(fileName, bytes, { contentType: `image/${m[1]}`, upsert: true });
    if (upErr) throw upErr;
    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(fileName);
    const url = pub.publicUrl;

    if (kind === "provider") await supabase.from("providers").update({ logo_url: url }).eq("id", id);
    else if (kind === "product") await supabase.from("dynamic_products").update({ image_url: url }).eq("id", id);
    else if (kind === "kit") await supabase.from("kits").update({ image_url: url }).eq("id", id);

    return new Response(JSON.stringify({ imageUrl: url, source: "ai" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("sanitize-images error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
