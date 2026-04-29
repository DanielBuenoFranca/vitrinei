// Edge function: busca uma imagem profissional gratuita no Unsplash → fallback Pixabay.
// Faz upload no Storage e retorna a URL pública. Usado quando o modo IA está OFF
// ou quando a chamada paga falha (Graceful Degradation).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function tryUnsplash(query: string): Promise<{ url: string; source: string } | null> {
  const key = Deno.env.get("UNSPLASH_ACCESS_KEY");
  if (!key) return null;
  try {
    const r = await fetch(`https://api.unsplash.com/search/photos?per_page=1&orientation=squarish&query=${encodeURIComponent(query)}`, {
      headers: { Authorization: `Client-ID ${key}` },
    });
    if (!r.ok) return null;
    const j = await r.json();
    const url = j?.results?.[0]?.urls?.regular;
    return url ? { url, source: "unsplash" } : null;
  } catch { return null; }
}

async function tryPixabay(query: string): Promise<{ url: string; source: string } | null> {
  const key = Deno.env.get("PIXABAY_API_KEY");
  if (!key) return null;
  try {
    const r = await fetch(`https://pixabay.com/api/?key=${key}&q=${encodeURIComponent(query)}&image_type=photo&per_page=3&safesearch=true`);
    if (!r.ok) return null;
    const j = await r.json();
    const url = j?.hits?.[0]?.largeImageURL || j?.hits?.[0]?.webformatURL;
    return url ? { url, source: "pixabay" } : null;
  } catch { return null; }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { kind, id, name, segment } = await req.json();
    if (!kind || !id || !name) {
      return new Response(JSON.stringify({ error: "kind, id and name required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const query = [name, segment].filter(Boolean).join(" ");
    let pick = await tryUnsplash(query);
    if (!pick) pick = await tryPixabay(query);
    if (!pick) {
      return new Response(JSON.stringify({ error: "no-free-image", hint: "Sem chaves Unsplash/Pixabay ou sem resultados" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // baixa
    const imgRes = await fetch(pick.url);
    if (!imgRes.ok) {
      return new Response(JSON.stringify({ error: "download-failed" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const buf = new Uint8Array(await imgRes.arrayBuffer());
    const ct = imgRes.headers.get("content-type") || "image/jpeg";
    const ext = ct.includes("png") ? "png" : ct.includes("webp") ? "webp" : "jpg";

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const bucket = kind === "provider" ? "provider-logos" : "storefront-assets";
    const folder = kind === "provider" ? "" : `${kind}-images/`;
    const safe = String(name).replace(/[^a-zA-Z0-9]/g, "_").slice(0, 30);
    const fileName = `${folder}free-${kind}-${id}-${Date.now()}-${safe}.${ext}`;

    const { error: upErr } = await supabase.storage.from(bucket).upload(fileName, buf, { contentType: ct, upsert: true });
    if (upErr) throw upErr;
    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(fileName);
    const url = pub.publicUrl;

    if (kind === "provider") await supabase.from("providers").update({ logo_url: url }).eq("id", id);
    else if (kind === "product") await supabase.from("dynamic_products").update({ image_url: url }).eq("id", id);
    else if (kind === "kit") await supabase.from("kits").update({ image_url: url }).eq("id", id);

    // log economia (~1 crédito de IA economizado por imagem)
    await supabase.from("ai_savings_log").insert({
      feature: "image_sanitize",
      fallback_used: pick.source,
      estimated_credits: 1,
      context: { kind, id, query },
    });

    return new Response(JSON.stringify({ imageUrl: url, source: pick.source }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("fetch-free-image error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
