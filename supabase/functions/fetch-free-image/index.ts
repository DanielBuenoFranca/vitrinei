// Edge function: busca uma imagem profissional gratuita.
// Ordem: Unsplash → Pixabay → Openverse (sem chave) → Loremflickr (sem chave)
// → Picsum (seed determinístico) / UI-Avatars (provider). NUNCA retorna 404.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Pick = { url: string; source: string } | null;

async function tryUnsplash(query: string): Promise<Pick> {
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

async function tryPixabay(query: string): Promise<Pick> {
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

// Openverse — API pública e gratuita (sem chave)
async function tryOpenverse(query: string): Promise<Pick> {
  try {
    const r = await fetch(`https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&page_size=3&license_type=commercial`);
    if (!r.ok) return null;
    const j = await r.json();
    const url = j?.results?.[0]?.url || j?.results?.[0]?.thumbnail;
    return url ? { url, source: "openverse" } : null;
  } catch { return null; }
}

// Loremflickr — devolve uma foto temática sem chave
async function tryLoremflickr(query: string): Promise<Pick> {
  try {
    const tag = encodeURIComponent(query.replace(/\s+/g, ","));
    const url = `https://loremflickr.com/640/640/${tag}`;
    // valida que responde
    const r = await fetch(url, { method: "GET" });
    if (!r.ok) return null;
    return { url: r.url || url, source: "loremflickr" };
  } catch { return null; }
}

// Sempre devolve algo
function placeholder(kind: string, name: string): { url: string; source: string } {
  const seed = encodeURIComponent(`${kind}-${name}`.slice(0, 60));
  if (kind === "provider") {
    const initials = encodeURIComponent(
      name.split(/\s+/).map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "V"
    );
    return {
      url: `https://ui-avatars.com/api/?name=${initials}&size=512&background=6d28d9&color=fff&bold=true&format=png`,
      source: "ui-avatars",
    };
  }
  return { url: `https://picsum.photos/seed/${seed}/640/640`, source: "picsum" };
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
    const candidates: Array<{ url: string; source: string } | null> = [
      await tryUnsplash(query),
      await tryPixabay(query),
      await tryOpenverse(query),
      await tryLoremflickr(query),
      placeholder(kind, name),
    ];

    // tenta cada candidato sequencialmente; se download falhar, passa para o próximo
    let buf: Uint8Array | null = null;
    let ct = "image/jpeg";
    let usedSource = "svg-fallback";
    for (const c of candidates) {
      if (!c) continue;
      try {
        const r = await fetch(c.url, { redirect: "follow" });
        if (!r.ok) continue;
        const ab = await r.arrayBuffer();
        if (!ab || ab.byteLength < 200) continue;
        buf = new Uint8Array(ab);
        ct = r.headers.get("content-type") || "image/jpeg";
        usedSource = c.source;
        break;
      } catch { /* tenta próximo */ }
    }

    // fallback final garantido: SVG gerado localmente (não depende de rede)
    if (!buf) {
      const initials = (name.split(/\s+/).map((p: string) => p[0]).filter(Boolean).slice(0, 2).join("") || "V").toUpperCase();
      const palette = ["#6d28d9", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];
      const color = palette[Math.abs([...String(name)].reduce((a, c) => a + c.charCodeAt(0), 0)) % palette.length];
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 640 640"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${color}"/><stop offset="1" stop-color="#111827"/></linearGradient></defs><rect width="640" height="640" fill="url(#g)"/><text x="50%" y="50%" font-family="Inter,Arial,sans-serif" font-size="220" font-weight="800" fill="#ffffff" text-anchor="middle" dominant-baseline="central">${initials}</text></svg>`;
      buf = new TextEncoder().encode(svg);
      ct = "image/svg+xml";
      usedSource = "svg-fallback";
    }

    const pick = { url: "", source: usedSource };
    const ext = ct.includes("svg") ? "svg" : ct.includes("png") ? "png" : ct.includes("webp") ? "webp" : "jpg";

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
    else if (kind === "service") await supabase.from("dynamic_services").update({ image_url: url }).eq("id", id);
    else if (kind === "segment") await supabase.from("segments").update({ image_url: url }).eq("id", id);
    else if (kind === "profile") await supabase.from("profiles").update({ avatar_url: url }).eq("user_id", String(id));

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
