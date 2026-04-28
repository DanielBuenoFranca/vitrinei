// Edge function: saneamento de imagens
// Recebe { kind: 'provider'|'product'|'kit', id, name, segment? }
// Gera imagem via AI (Lovable Gateway), faz upload no Storage e atualiza o registro.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { kind, id, name, segment } = await req.json();
    if (!kind || !id || !name) {
      return new Response(JSON.stringify({ error: "kind, id and name are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

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

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI error:", aiRes.status, errText);
      return new Response(JSON.stringify({ error: `AI failed: ${aiRes.status}` }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiRes.json();
    const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageData?.startsWith("data:image")) {
      return new Response(JSON.stringify({ error: "no image generated" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const m = imageData.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/);
    if (!m) throw new Error("invalid image data");
    const ext = m[1] === "jpeg" ? "jpg" : m[1];
    const bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const bucket = kind === "provider" ? "provider-logos" : "storefront-assets";
    const folder = kind === "provider" ? "" : `${kind}-images/`;
    const safeName = name.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 30);
    const fileName = `${folder}sanitized-${kind}-${id}-${Date.now()}-${safeName}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from(bucket)
      .upload(fileName, bytes, { contentType: `image/${m[1]}`, upsert: true });
    if (upErr) {
      console.error("upload err:", upErr);
      throw upErr;
    }

    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(fileName);
    const url = pub.publicUrl;

    // Update record
    if (kind === "provider") {
      await supabase.from("providers").update({ logo_url: url }).eq("id", id);
    } else if (kind === "product") {
      await supabase.from("dynamic_products").update({ image_url: url }).eq("id", id);
    } else if (kind === "kit") {
      await supabase.from("kits").update({ image_url: url }).eq("id", id);
    }

    return new Response(JSON.stringify({ imageUrl: url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("sanitize-images error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
