import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { getAiMode, autoOffOnFailure, logAiSavings } from "../_shared/aiCredits.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function callFreeFallback(payload: any) {
  const url = `${Deno.env.get('SUPABASE_URL')}/functions/v1/fetch-free-image`;
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify(payload),
    });
    if (!r.ok) return null;
    const d = await r.json();
    return d?.imageUrl || d?.url || null;
  } catch { return null; }
}


Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { productName, segment, itemType } = await req.json()
    if (!productName) {
      return new Response(JSON.stringify({ error: 'productName is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'AI key not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Priority 1: Try to find a professional image via AI description
    // Priority 2: Generate one via AI image generation
    const searchPrompt = `Generate a professional, clean product photo for: "${productName}" (category: ${segment || 'general'}, type: ${itemType || 'product'}). The image should be a high-quality studio photo on a clean white background, suitable for an e-commerce catalog. No text or watermarks.`

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3.1-flash-image-preview',
        messages: [{ role: 'user', content: searchPrompt }],
        modalities: ['image', 'text'],
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('AI image generation error:', response.status, errText)
      return new Response(JSON.stringify({ error: 'Failed to generate image', imageUrl: null }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const data = await response.json()
    const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url

    if (!imageData) {
      return new Response(JSON.stringify({ error: 'No image generated', imageUrl: null }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Upload to Supabase Storage
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Extract base64 data
    const base64Match = imageData.match(/^data:image\/(png|jpeg|jpg|webp);base64,(.+)$/)
    if (!base64Match) {
      return new Response(JSON.stringify({ imageUrl: imageData }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const ext = base64Match[1] === 'jpeg' ? 'jpg' : base64Match[1]
    const base64Data = base64Match[2]
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))
    const fileName = `product-images/${Date.now()}-${productName.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30)}.${ext}`

    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from('storefront-assets')
      .upload(fileName, binaryData, {
        contentType: `image/${base64Match[1]}`,
        upsert: true,
      })

    if (uploadErr) {
      console.error('Upload error:', uploadErr)
      // Return base64 as fallback
      return new Response(JSON.stringify({ imageUrl: imageData }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data: publicUrl } = supabase.storage
      .from('storefront-assets')
      .getPublicUrl(fileName)

    return new Response(JSON.stringify({ imageUrl: publicUrl.publicUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error('search-product-image error:', err)
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
