// Edge function: busca uma imagem profissional gratuita.
// Agora com reranking por entendimento (must/block) — evita "Couve Flor" virar
// foto de buquê, "Pão Congelado" virar paisagem nevada, etc.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { understandSubject, scoreCandidate, type SubjectUnderstanding } from "../_shared/imageUnderstanding.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Cand = { url: string; source: string; score: number; meta: string };

async function tryUnsplash(query: string, u: SubjectUnderstanding, seed?: number): Promise<Cand[]> {
  const key = Deno.env.get("UNSPLASH_ACCESS_KEY");
  if (!key) return [];
  try {
    const page = ((seed || 0) % 5) + 1; // Usa o seed do frontend se disponível
    const r = await fetch(
      `https://api.unsplash.com/search/photos?per_page=12&page=${page}&orientation=squarish&query=${encodeURIComponent(query)}`,
      { headers: { Authorization: `Client-ID ${key}` } },
    );
    if (!r.ok) return [];
    const j = await r.json();
    return (j?.results || []).map((p: any) => {
      const meta = [p.alt_description, p.description, (p.tags || []).map((t: any) => t.title).join(" ")]
        .filter(Boolean).join(" ");
      return {
        url: p?.urls?.regular,
        source: "unsplash",
        meta,
        score: scoreCandidate(`${query} ${meta}`, u.must, u.block),
      };
    }).filter((c: Cand) => !!c.url);
  } catch { return []; }
}

async function tryPixabay(query: string, u: SubjectUnderstanding, seed?: number): Promise<Cand[]> {
  const key = Deno.env.get("PIXABAY_API_KEY");
  if (!key) return [];
  try {
    const page = ((seed || 0) % 3) + 1;
    const r = await fetch(
      `https://pixabay.com/api/?key=${key}&q=${encodeURIComponent(query)}&image_type=photo&per_page=15&page=${page}&safesearch=true`,
    );
    if (!r.ok) return [];
    const j = await r.json();
    return (j?.hits || []).map((h: any) => {
      const meta = `${h.tags || ""}`;
      return {
        url: h.largeImageURL || h.webformatURL,
        source: "pixabay",
        meta,
        score: scoreCandidate(`${query} ${meta}`, u.must, u.block),
      };
    }).filter((c: Cand) => !!c.url);
  } catch { return []; }
}

async function tryOpenverse(query: string, u: SubjectUnderstanding, seed?: number): Promise<Cand[]> {
  try {
    const page = ((seed || 0) % 4) + 1;
    const r = await fetch(
      `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&page=${page}&page_size=12&license_type=commercial`,
    );
    if (!r.ok) return [];
    const j = await r.json();
    return (j?.results || []).map((p: any) => {
      const meta = `${p.title || ""} ${(p.tags || []).map((t: any) => t.name).join(" ")}`;
      return {
        url: p.url || p.thumbnail,
        source: "openverse",
        meta,
        score: scoreCandidate(`${query} ${meta}`, u.must, u.block),
      };
    }).filter((c: Cand) => !!c.url);
  } catch { return []; }
}

function tryLoremflickr(query: string): Cand[] {
  try {
    const tag = encodeURIComponent(query.replace(/\s+/g, ","));
    return [{ url: `https://loremflickr.com/640/640/${tag}`, source: "loremflickr", meta: query, score: 0 }];
  } catch { return []; }
}

function placeholderCand(kind: string, name: string): Cand {
  const seed = encodeURIComponent(`${kind}-${name}`.slice(0, 60));
  if (kind === "provider" || kind === "profile") {
    const initials = encodeURIComponent(
      name.split(/\s+/).map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "V",
    );
    return {
      url: `https://ui-avatars.com/api/?name=${initials}&size=512&background=6d28d9&color=fff&bold=true&format=png`,
      source: "ui-avatars", meta: name, score: -100,
    };
  }
  return { url: `https://picsum.photos/seed/${seed}/640/640`, source: "picsum", meta: name, score: -100 };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json();
    const { kind, id, name, segment, tags, description, linkedNames, currentImageUrl, seed } = body;
    if (!kind || !id || !name) {
      return new Response(JSON.stringify({ error: "kind, id and name required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Allow caller to pass an already-computed understanding to avoid double work.
    let understanding: SubjectUnderstanding | null = body.understanding || null;
    if (!understanding) {
      understanding = await understandSubject({
        name, segment, tags, description, linkedNames, kind,
      });
    }
    const query = understanding.query || [name, segment].filter(Boolean).join(" ");

    // Gather candidates across sources, then rank by score.
    const all: Cand[] = [];
    all.push(...(await tryUnsplash(query, understanding, seed)));
    all.push(...(await tryPixabay(query, understanding, seed)));
    if (all.length < 4) all.push(...(await tryOpenverse(query, understanding, seed)));
    if (all.length === 0) all.push(...tryLoremflickr(query));
    all.push(placeholderCand(kind, name));

    // Sort: highest score first; break ties by source preference order.
    const order = ["unsplash", "pixabay", "openverse", "loremflickr", "picsum", "ui-avatars"];
    all.sort((a, b) => b.score - a.score || order.indexOf(a.source) - order.indexOf(b.source));

    // Reject any candidate that contains a block term (negative score) OR matches current image
    let safe = all.filter((c) => c.score > -10 && c.url !== currentImageUrl);
    
    // If we have multiple high-score candidates, pick one semi-randomly from the top 3
    // to allow the user to "cycle" through images by clicking again.
    if (safe.length > 1) {
      const topScore = safe[0].score;
      const topCandidates = safe.filter(c => c.score >= topScore - 5).slice(0, 3);
      if (topCandidates.length > 1) {
        // Shuffle the top few to avoid picking the same one every time
        topCandidates.sort(() => Math.random() - 0.5);
        safe = [...topCandidates, ...safe.filter(c => !topCandidates.includes(c))];
      }
    }

    const queue = safe.length ? safe : all;

    let buf: Uint8Array | null = null;
    let ct = "image/jpeg";
    let usedSource = "svg-fallback";
    let usedQuery = query;
    for (const c of queue) {
      try {
        const r = await fetch(c.url, { redirect: "follow" });
        if (!r.ok) continue;
        const ab = await r.arrayBuffer();
        if (!ab || ab.byteLength < 200) continue;
        buf = new Uint8Array(ab);
        ct = r.headers.get("content-type") || "image/jpeg";
        usedSource = c.source;
        break;
      } catch { /* next */ }
    }

    // SVG fallback final
    if (!buf) {
      const initials = (name.split(/\s+/).map((p: string) => p[0]).filter(Boolean).slice(0, 2).join("") || "V").toUpperCase();
      const palette = ["#6d28d9", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];
      const color = palette[Math.abs([...String(name)].reduce((a, c) => a + c.charCodeAt(0), 0)) % palette.length];
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 640 640"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${color}"/><stop offset="1" stop-color="#111827"/></linearGradient></defs><rect width="640" height="640" fill="url(#g)"/><text x="50%" y="50%" font-family="Inter,Arial,sans-serif" font-size="220" font-weight="800" fill="#ffffff" text-anchor="middle" dominant-baseline="central">${initials}</text></svg>`;
      buf = new TextEncoder().encode(svg);
      ct = "image/svg+xml";
      usedSource = "svg-fallback";
    }

    const ext = ct.includes("svg") ? "svg" : ct.includes("png") ? "png" : ct.includes("webp") ? "webp" : "jpg";
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const bucket = kind === "provider" ? "provider-logos" : "storefront-assets";
    const folder = kind === "provider" ? "" : `${kind}-images/`;
    const safe2 = String(name).replace(/[^a-zA-Z0-9]/g, "_").slice(0, 30);
    const fileName = `${folder}free-${kind}-${id}-${Date.now()}-${safe2}.${ext}`;

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

    await supabase.from("ai_savings_log").insert({
      feature: "image_sanitize",
      fallback_used: usedSource,
      estimated_credits: 1,
      context: { kind, id, query: usedQuery, understanding },
    });

    return new Response(JSON.stringify({ imageUrl: url, source: usedSource, understanding }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("fetch-free-image error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
