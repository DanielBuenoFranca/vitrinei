// Edge function: gera imagens IA para segmentos e prestadores em lote
// e faz upload no storage. Idempotente: só gera para itens sem imagem
// (a menos que `force=true`).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getAiMode, autoOffOnFailure, logAiSavings } from "../_shared/aiCredits.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

async function genImage(prompt: string): Promise<Uint8Array | null> {
  try {
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });
    if (r.status === 402 || r.status === 429) {
      await autoOffOnFailure(r.status === 402 ? "no_credits" : "rate_limited");
      void logAiSavings("bulk-generate-catalog-images", `gateway_${r.status}`, 1, { auto_off: true });
      return null;
    }
    if (!r.ok) {
      console.error("AI gen failed", r.status, await r.text());
      return null;
    }
    const data = await r.json();
    const url: string | undefined = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!url || !url.startsWith("data:image")) return null;
    const b64 = url.split(",")[1];
    return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  } catch (e) {
    console.error("gen err", e);
    return null;
  }
}

async function uploadPng(bucket: string, path: string, bytes: Uint8Array): Promise<string | null> {
  const { error } = await supabase.storage.from(bucket).upload(path, bytes, {
    contentType: "image/png",
    upsert: true,
  });
  if (error) {
    console.error("upload err", error);
    return null;
  }
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

function segmentPrompt(name: string): string {
  return `3D rendered glossy app icon for category "${name}", Brazilian small business service category, plasticine clay style, soft volumetric lighting, vibrant colors, isolated on a clean transparent-style neutral background, centered, app store icon look, ultra high detail, no text, no logo, square 1:1`;
}

function providerPrompt(name: string, segments: string[]): string {
  const seg = segments.join(", ") || "service provider";
  return `Photorealistic portrait of a friendly Brazilian professional working as ${seg}, smiling warmly at camera, wearing appropriate uniform/work outfit, holding tools or items related to ${seg}, clean workshop or workplace background slightly blurred, natural soft lighting, high quality marketplace seller photo, square framing, no text, no watermark`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Hard time budget to stay below the 60s edge timeout
  const startedAt = Date.now();
  const TIME_BUDGET_MS = 45_000;
  const isOutOfBudget = () => Date.now() - startedAt > TIME_BUDGET_MS;

  try {
    const body = await req.json().catch(() => ({}));
    const force = !!body.force;
    const target: "all" | "segments" | "providers" = body.target ?? "all";
    // Batch limit per invocation so the client can iterate without hitting the 60s timeout.
    const batchLimit = Math.max(1, Math.min(20, Number(body.limit) || 6));

    // [Economia de Crédito] Block bulk image generation entirely while saving.
    const { mode } = await getAiMode();
    if (mode === "off") {
      void logAiSavings("bulk-generate-catalog-images", "skipped_saving_mode", 1, { target, force });
      return new Response(
        JSON.stringify({
          success: false,
          skipped: true,
          reason: "ai_credits_mode=off",
          message: "Geração em lote pausada pelo modo Economia de Crédito.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const result = {
      segments: { ok: 0, skip: 0, fail: 0, processed: 0, remaining: 0 },
      providers: { ok: 0, skip: 0, fail: 0, processed: 0, remaining: 0 },
      batch_limit: batchLimit,
      time_budget_hit: false,
    };

    if (target === "all" || target === "segments") {
      const q = supabase.from("segments").select("id, name, image_url");
      const { data: segs } = force ? await q : await q.is("image_url", null);
      const pending = segs ?? [];
      result.segments.remaining = pending.length;
      for (const s of pending) {
        if (result.segments.processed >= batchLimit) break;
        if (isOutOfBudget()) { result.time_budget_hit = true; break; }
        result.segments.processed++;
        if (!force && s.image_url) { result.segments.skip++; continue; }
        const bytes = await genImage(segmentPrompt(s.name));
        if (!bytes) { result.segments.fail++; continue; }
        const url = await uploadPng("segment-images", `seg-${s.id}-${Date.now()}.png`, bytes);
        if (!url) { result.segments.fail++; continue; }
        await supabase.from("segments").update({ image_url: url }).eq("id", s.id);
        result.segments.ok++;
      }
      result.segments.remaining = Math.max(0, pending.length - result.segments.processed);
    }

    if (target === "all" || target === "providers") {
      if (!result.time_budget_hit) {
        const q = supabase.from("providers").select("id, name, segment, logo_url").eq("active", true);
        const { data: provs } = force ? await q : await q.is("logo_url", null);
        const pending = provs ?? [];
        result.providers.remaining = pending.length;
        for (const p of pending) {
          if (result.providers.processed >= batchLimit) break;
          if (isOutOfBudget()) { result.time_budget_hit = true; break; }
          result.providers.processed++;
          if (!force && p.logo_url) { result.providers.skip++; continue; }
          const bytes = await genImage(providerPrompt(p.name, p.segment ?? []));
          if (!bytes) { result.providers.fail++; continue; }
          const url = await uploadPng("segment-images", `prov-${p.id}-${Date.now()}.png`, bytes);
          if (!url) { result.providers.fail++; continue; }
          await supabase.from("providers").update({ logo_url: url }).eq("id", p.id);
          result.providers.ok++;
        }
        result.providers.remaining = Math.max(0, pending.length - result.providers.processed);
      }
    }

    const has_more = result.segments.remaining > 0 || result.providers.remaining > 0;
    return new Response(JSON.stringify({ success: true, result, has_more }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error(e);
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
