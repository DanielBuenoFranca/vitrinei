// Edge function: saneamento de imagens com inteligência contextual.
// Enriquece o prompt com dados reais do banco (segmento, tags, prestador, vínculos,
// descrição) para gerar imagens profissionais, realistas e fiéis ao item.
// Modo ON = IA paga, modo OFF = imagem grátis (Unsplash → Pixabay → ...).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { understandSubject } from "../_shared/imageUnderstanding.ts";

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

// ---------- Context enrichment ----------
type EnrichedContext = {
  name: string;
  segment?: string;
  tags: string[];
  description?: string;
  providerName?: string;
  providerType?: string; // "mei", "user", "empresa", etc.
  itemType?: string;     // "fisico", "digital", etc.
  linkedNames: string[];
  unit?: string;
  price?: number;
};

async function enrichContext(supabase: any, kind: string, id: number, base: any): Promise<EnrichedContext> {
  const ctx: EnrichedContext = {
    name: base.name,
    segment: base.segment,
    tags: Array.isArray(base.tags) ? base.tags.filter(Boolean) : [],
    description: base.description,
    providerName: base.providerName,
    providerType: base.type || base.providerType,
    itemType: base.type || base.stock_type,
    linkedNames: [],
    unit: base.unit,
    price: base.price,
  };

  try {
    if (kind === "product" && id) {
      const { data } = await supabase.from("dynamic_products")
        .select("name, tags, unit, price, provider, provider_id, related_service_ids, segments, stock_type")
        .eq("id", id).maybeSingle();
      if (data) {
        ctx.tags = Array.from(new Set([...(ctx.tags || []), ...((data.tags as string[]) || [])]));
        ctx.unit = ctx.unit || data.unit;
        ctx.price = ctx.price ?? Number(data.price);
        ctx.providerName = ctx.providerName || data.provider;
        ctx.itemType = ctx.itemType || data.stock_type;
        if (!ctx.segment && Array.isArray(data.segments) && data.segments.length) {
          ctx.segment = data.segments[0];
        }
        if (data.provider_id) {
          const { data: prov } = await supabase.from("providers")
            .select("name, type, segment").eq("id", data.provider_id).maybeSingle();
          if (prov) {
            ctx.providerName = ctx.providerName || prov.name;
            ctx.providerType = ctx.providerType || prov.type;
            if (!ctx.segment && Array.isArray(prov.segment) && prov.segment.length) {
              ctx.segment = prov.segment[0];
            }
          }
        }
        // serviços relacionados
        if (Array.isArray(data.related_service_ids) && data.related_service_ids.length) {
          const { data: svcs } = await supabase.from("dynamic_services")
            .select("name").in("id", data.related_service_ids).limit(5);
          ctx.linkedNames = (svcs || []).map((s: any) => s.name);
        }
      }
    } else if (kind === "service" && id) {
      const { data } = await supabase.from("dynamic_services")
        .select("name, segment, price, provider, provider_id, linked_product_ids, products, unit, segments")
        .eq("id", id).maybeSingle();
      if (data) {
        ctx.segment = ctx.segment || data.segment || (Array.isArray(data.segments) ? data.segments[0] : undefined);
        ctx.unit = ctx.unit || data.unit;
        ctx.price = ctx.price ?? Number(data.price);
        ctx.providerName = ctx.providerName || data.provider;
        if (Array.isArray(data.products)) ctx.linkedNames.push(...data.products);
        if (Array.isArray(data.linked_product_ids) && data.linked_product_ids.length) {
          const { data: prods } = await supabase.from("dynamic_products")
            .select("name, tags").in("id", data.linked_product_ids).limit(8);
          (prods || []).forEach((p: any) => {
            ctx.linkedNames.push(p.name);
            if (Array.isArray(p.tags)) ctx.tags.push(...p.tags);
          });
        }
        if (data.provider_id) {
          const { data: prov } = await supabase.from("providers")
            .select("type").eq("id", data.provider_id).maybeSingle();
          if (prov) ctx.providerType = ctx.providerType || prov.type;
        }
      }
    } else if (kind === "kit" && id) {
      const { data } = await supabase.from("kits")
        .select("name, description, price, owner_provider_id").eq("id", id).maybeSingle();
      if (data) {
        ctx.description = ctx.description || (data as any).description;
        ctx.price = ctx.price ?? Number(data.price);
        if (data.owner_provider_id) {
          const { data: prov } = await supabase.from("providers")
            .select("name, type, segment").eq("id", data.owner_provider_id).maybeSingle();
          if (prov) {
            ctx.providerName = ctx.providerName || prov.name;
            ctx.providerType = ctx.providerType || prov.type;
            if (!ctx.segment && Array.isArray(prov.segment) && prov.segment.length) ctx.segment = prov.segment[0];
          }
        }
        const { data: items } = await supabase.from("kit_items")
          .select("snapshot_name").eq("kit_id", id).limit(10);
        ctx.linkedNames = (items || []).map((i: any) => i.snapshot_name).filter(Boolean);
      }
    } else if (kind === "provider" && id) {
      const { data } = await supabase.from("providers")
        .select("name, type, segment, city").eq("id", id).maybeSingle();
      if (data) {
        ctx.providerType = ctx.providerType || data.type;
        if (!ctx.segment && Array.isArray(data.segment) && data.segment.length) ctx.segment = data.segment.join(", ");
      }
    } else if (kind === "segment" && id) {
      const { data } = await supabase.from("segments")
        .select("name, suggested_tags").eq("id", id).maybeSingle();
      if (data) {
        ctx.tags = Array.from(new Set([...(ctx.tags || []), ...((data.suggested_tags as string[]) || [])]));
      }
    } else if (kind === "profile" && id) {
      const { data } = await supabase.from("profiles")
        .select("display_name, provider_segments, is_provider").eq("user_id", String(id)).maybeSingle();
      if (data) {
        ctx.name = ctx.name || data.display_name || "Usuário";
        if (Array.isArray(data.provider_segments) && data.provider_segments.length) {
          ctx.segment = ctx.segment || data.provider_segments[0];
        }
        ctx.providerType = ctx.providerType || (data.is_provider ? "mei" : "user");
      }
    }
  } catch (e) {
    console.warn("enrichContext warn:", e);
  }

  // dedup + limit
  ctx.tags = Array.from(new Set(ctx.tags.map(t => String(t).trim()).filter(Boolean))).slice(0, 8);
  ctx.linkedNames = Array.from(new Set(ctx.linkedNames.filter(Boolean))).slice(0, 6);
  return ctx;
}

function buildPrompt(kind: string, ctx: EnrichedContext): string {
  const tagsStr = ctx.tags.length ? ` Keywords: ${ctx.tags.join(", ")}.` : "";
  const linkedStr = ctx.linkedNames.length ? ` Related items: ${ctx.linkedNames.join(", ")}.` : "";
  const segStr = ctx.segment ? ` Category/Segment: ${ctx.segment}.` : "";
  const descStr = ctx.description ? ` Description: ${ctx.description}.` : "";
  const provStr = ctx.providerName ? ` Provider: ${ctx.providerName}.` : "";
  const typeStr = ctx.itemType ? ` Type: ${ctx.itemType}.` : (ctx.providerType ? ` Type: ${ctx.providerType}.` : "");

  const base = `Subject: "${ctx.name}".${segStr}${typeStr}${tagsStr}${linkedStr}${descStr}${provStr}`;

  if (kind === "provider") {
    return `Create a modern, minimalist BRAND LOGO ICON for the small business "${ctx.name}".${segStr}${typeStr}${tagsStr}${descStr} ` +
      `Style: bold geometric mark, flat vector, 2-3 brand colors, professional, memorable, suitable as circular avatar. ` +
      `Clean solid white background, NO TEXT, NO LETTERS, NO WORDS, no watermarks, no photo realism. ` +
      `The icon must visually represent the business sector and feel trustworthy and professional. Square format, centered.`;
  }
  if (kind === "product") {
    return `Photorealistic professional studio PRODUCT PHOTO of: "${ctx.name}". ${base} ` +
      `Make sure the object shown is exactly this item (use the description, category and type to disambiguate precisely). ` +
      `High-end e-commerce catalog style: clean seamless white background, soft studio lighting, sharp focus, ` +
      `accurate proportions and materials, realistic textures, subtle shadow, centered composition, square framing. ` +
      `NO text, NO labels with brand names, NO watermarks, NO collages, single hero subject, ultra detailed 8k.`;
  }
  if (kind === "kit") {
    return `Photorealistic studio photo of a PRODUCT KIT / BUNDLE named "${ctx.name}". ${base} ` +
      `Use the description to understand each component. Show the related items grouped together as a curated set, neatly arranged. ` +
      `Clean white background, professional e-commerce styling, accurate materials, soft shadow, centered, square. ` +
      `NO text, NO watermarks, NO logos.`;
  }
  if (kind === "service") {
    return `Premium 3D illustrated ICON representing the SERVICE "${ctx.name}". ${base} ` +
      `Show tools, scene or symbolic objects that clearly communicate this exact service (use description and category). ` +
      `Style: glossy 3D render, vibrant brand-friendly colors, soft realistic lighting, ambient occlusion, ` +
      `subtle reflections, beveled edges, app-icon framing, clean white background, soft drop shadow, centered. ` +
      `NO text, NO watermarks. The icon must be instantly recognizable as this specific service.`;
  }
  if (kind === "segment") {
    return `Hyper-realistic premium 3D APP ICON representing the category "${ctx.name}".${tagsStr} ` +
      `Pixar/Disney style, glossy materials, vibrant colorful objects floating, soft realistic lighting, ` +
      `ambient occlusion, reflections, depth of field, beveled edges, soft drop shadow, clean white seamless background, ` +
      `centered composition, NO text, NO watermarks, square app-icon framing, ultra-detailed 8k.`;
  }
  if (kind === "profile") {
    return `Modern, minimalist AVATAR for the user "${ctx.name}".${segStr}${tagsStr} ` +
      `Style: friendly geometric portrait icon, soft gradients, 2-3 colors, professional. ` +
      `Clean white background, NO TEXT, NO LETTERS, no watermarks. Square format, centered, suitable as circular avatar.`;
  }
  return `Professional photo of "${ctx.name}". ${base} Clean white background, no text.`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const payload = await req.json();
    const { kind, id, name, currentImageUrl } = payload || {};
    if (!kind || !id || !name) {
      return new Response(JSON.stringify({ error: "kind, id and name are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Enriquece contexto a partir do banco + payload
    const ctx = await enrichContext(supabase, kind, Number(id) || 0, payload);

    // "Vini understanding": vira nome+segmento+tags+descrição em query precisa
    // em inglês + listas must/block para escolher/desambiguar a imagem.
    const understanding = await understandSubject({
      name: ctx.name, segment: ctx.segment, tags: ctx.tags,
      description: ctx.description, linkedNames: ctx.linkedNames, kind,
      providerType: ctx.providerType || ctx.itemType,
    });
    const freePayload = {
      kind, id, name,
      segment: ctx.segment, tags: ctx.tags,
      description: ctx.description, linkedNames: ctx.linkedNames,
      understanding,
      currentImageUrl,
      seed: Math.floor(Math.random() * 1000000), // Injeção de aleatoriedade
    };

    // 1) lê toggle
    const { data: settings } = await supabase.from("site_settings").select("value").eq("key","ai_credits_mode").maybeSingle();
    const aiMode = ((settings?.value as any)?.mode || "on") as "on" | "off";

    // 2) modo OFF → free direto (com understanding)
    if (aiMode === "off") {
      const r = await callFreeFallback(supabase, freePayload);
      return new Response(await r.text(), { status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 3) tenta IA paga
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      await autoOffOnFailure(supabase, "missing_lovable_key");
      const r = await callFreeFallback(supabase, freePayload);
      return new Response(await r.text(), { status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Reforça o prompt da IA com o entendimento (must/block) — evita derrapagens.
    let prompt = buildPrompt(kind, ctx);
    if (understanding.must.length) prompt += ` MUST clearly depict: ${understanding.must.join(", ")}.`;
    if (understanding.block.length) prompt += ` MUST NOT depict: ${understanding.block.join(", ")}.`;
    if (understanding.query) prompt += ` Visual reference query: ${understanding.query}.`;
    
    // Se já existe uma imagem, pede explicitamente uma variação ou ângulo diferente
    if (currentImageUrl) {
      prompt += " NOTE: This item is being updated. Please provide a fresh, high-quality variation, perhaps from a different professional angle or background, ensuring maximum compatibility with the product description.";
    }
    
    // Adiciona um fator de variação temporal para evitar repetições do modelo
    prompt += ` [Variation ID: ${Date.now() % 10000}]`;
    
    console.log("[sanitize-images] prompt:", prompt.slice(0, 300));

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (aiRes.status === 402 || aiRes.status === 429) {
      await autoOffOnFailure(supabase, aiRes.status === 402 ? "no_credits" : "rate_limited");
      const r = await callFreeFallback(supabase, freePayload);
      return new Response(await r.text(), { status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!aiRes.ok) {
      console.error("AI error:", aiRes.status, await aiRes.text());
      const r = await callFreeFallback(supabase, freePayload);
      return new Response(await r.text(), { status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiData = await aiRes.json();
    const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageData?.startsWith("data:image")) {
      const r = await callFreeFallback(supabase, freePayload);
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
    else if (kind === "service") await supabase.from("dynamic_services").update({ image_url: url }).eq("id", id);
    else if (kind === "segment") await supabase.from("segments").update({ image_url: url }).eq("id", id);
    else if (kind === "profile") await supabase.from("profiles").update({ avatar_url: url }).eq("user_id", String(id));

    return new Response(JSON.stringify({ imageUrl: url, source: "ai", contextUsed: ctx }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("sanitize-images error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
