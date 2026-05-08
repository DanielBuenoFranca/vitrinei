import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { getAiMode, autoOffOnFailure, logAiSavings } from "../_shared/aiCredits.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Deterministic SVG initials logo as zero-credit fallback.
function buildInitialsSvg(name: string, segment?: string): string {
  const words = (name || "?").trim().split(/\s+/).filter(Boolean);
  const initials = (words[0]?.[0] || "?") + (words[1]?.[0] || "");
  const palette = [
    ["#0EA5E9", "#1E3A8A"], ["#F97316", "#7C2D12"], ["#10B981", "#064E3B"],
    ["#A855F7", "#4C1D95"], ["#EF4444", "#7F1D1D"], ["#EAB308", "#713F12"],
  ];
  let h = 0; for (const c of (segment || name || "x")) h = (h * 31 + c.charCodeAt(0)) | 0;
  const [c1, c2] = palette[Math.abs(h) % palette.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="256" height="256" rx="48" fill="url(#g)"/><text x="50%" y="55%" text-anchor="middle" font-family="Inter,Helvetica,Arial,sans-serif" font-size="120" font-weight="800" fill="white" dominant-baseline="middle">${initials.toUpperCase()}</text></svg>`;
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}


serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { providerName, segment } = await req.json();
    if (!providerName) {
      return new Response(JSON.stringify({ error: "providerName is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // [Economia de Crédito] Honor the global toggle.
    const { mode } = await getAiMode();
    if (mode === "off") {
      void logAiSavings("generate-provider-logo", "initials_svg", 1, { providerName });
      return new Response(JSON.stringify({ logoUrl: buildInitialsSvg(providerName, segment) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate artistic logo using AI image generation
    const prompt = `Create a modern, professional, minimalist logo icon for a small business called "${providerName}" in the "${segment || 'services'}" industry. The logo should be a simple, creative symbol or monogram, using bold colors on a clean white background. Style: flat design, geometric shapes, vibrant accent color, no text, suitable as a profile picture or avatar. High contrast, professional look.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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

    if (response.status === 402 || response.status === 429) {
      await autoOffOnFailure(response.status === 402 ? "no_credits" : "rate_limited");
      void logAiSavings("generate-provider-logo", `gateway_${response.status}`, 1, { auto_off: true });
      return new Response(JSON.stringify({ logoUrl: buildInitialsSvg(providerName, segment) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ logoUrl: buildInitialsSvg(providerName, segment) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await response.json();
    const imageUrl = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl || !imageUrl.startsWith("data:image")) {
      return new Response(JSON.stringify({ error: "No image generated" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Decode base64 and upload to storage
    const base64Data = imageUrl.split(",")[1];
    const binaryStr = atob(base64Data);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const fileName = `ai-logo-${Date.now()}-${Math.random().toString(36).slice(2)}.png`;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: uploadError } = await supabase.storage
      .from("provider-logos")
      .upload(fileName, bytes, { contentType: "image/png", upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return new Response(JSON.stringify({ error: "Upload failed: " + uploadError.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: urlData } = supabase.storage.from("provider-logos").getPublicUrl(fileName);

    return new Response(JSON.stringify({ logoUrl: urlData.publicUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
