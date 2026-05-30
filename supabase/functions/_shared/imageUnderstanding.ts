// Shared "Vini understanding" layer for image picking.
// Goal: turn (name + segment + tags + description + linkedNames) into a precise
// English search query plus must/block term lists used to rerank free-image
// candidates so we never pick a flower picture for "Couve Flor", a snowy
// landscape for "Pão Congelado", etc.

import { getAiMode } from "./aiCredits.ts";

export type SubjectInput = {
  name: string;
  segment?: string;
  tags?: string[];
  description?: string;
  linkedNames?: string[];
  providerType?: string;
  kind?: string; // product | service | kit | provider | segment | profile
};

export type SubjectUnderstanding = {
  query: string;       // English search query for stock photo APIs
  must: string[];      // tokens that should appear (lowercased, accent-free)
  block: string[];     // tokens that must NOT appear
  category: string;    // human label: food, tool, garment, service, ...
  rationale: string;
};

const norm = (s: string) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

// Domain dictionaries (PT -> EN search hints + must/block).
// Each rule: if any "match" token is contained in the normalized name, apply.
type Rule = {
  match: string[];
  query: string;
  must?: string[];
  block?: string[];
  category: string;
};

const RULES: Rule[] = [
  // ---- Hortaliças / vegetais (a famosa "Couve Flor") ----
  { match: ["couve flor", "couve-flor", "couveflor"], query: "fresh cauliflower vegetable on wooden board",
    must: ["cauliflower"], block: ["flower", "bouquet", "rose", "tulip", "decor"], category: "food-vegetable" },
  { match: ["couve"], query: "fresh kale leaves vegetable",
    must: ["kale"], block: ["flower", "bouquet"], category: "food-vegetable" },
  { match: ["alface"], query: "fresh lettuce head vegetable", must: ["lettuce"], category: "food-vegetable" },
  { match: ["tomate"], query: "fresh ripe tomato vegetable", must: ["tomato"], category: "food-vegetable" },
  { match: ["cebola"], query: "fresh onion vegetable", must: ["onion"], category: "food-vegetable" },
  { match: ["batata doce"], query: "sweet potato fresh vegetable", must: ["sweet potato"], category: "food-vegetable" },
  { match: ["batata"], query: "fresh potato vegetable", must: ["potato"], category: "food-vegetable" },
  { match: ["cenoura"], query: "fresh carrot vegetable", must: ["carrot"], category: "food-vegetable" },
  { match: ["brocolis", "brócolis"], query: "fresh broccoli vegetable", must: ["broccoli"], category: "food-vegetable" },

  // ---- Pães ----
  { match: ["pao congelado", "pão congelado"], query: "frozen raw bread dough loaves on tray bakery",
    must: ["bread", "dough"], block: ["snow", "ice mountain", "winter landscape", "iceberg"], category: "food-bakery" },
  { match: ["pao recheado", "pão recheado"], query: "stuffed bread filled with meat cheese bakery",
    must: ["bread"], block: ["plain landscape"], category: "food-bakery" },
  { match: ["pao de queijo", "pão de queijo"], query: "brazilian cheese bread pao de queijo",
    must: ["cheese bread"], category: "food-bakery" },
  { match: ["pao frances", "pão francês", "pao francês"], query: "french bread baguette bakery",
    must: ["bread"], category: "food-bakery" },
  { match: ["pao", "pão"], query: "fresh bread loaf bakery",
    must: ["bread"], block: ["snow", "ice landscape"], category: "food-bakery" },

  // ---- Carnes / proteínas ----
  { match: ["picanha"], query: "raw picanha beef cut meat", must: ["beef", "meat"], category: "food-meat" },
  { match: ["frango"], query: "raw chicken meat", must: ["chicken"], category: "food-meat" },
  { match: ["peixe"], query: "fresh fish fillet seafood", must: ["fish"], category: "food-meat" },
  { match: ["carne"], query: "raw beef red meat steak", must: ["meat", "beef"], category: "food-meat" },

  // ---- Bebidas ----
  { match: ["cafe", "café"], query: "coffee cup beans", must: ["coffee"], category: "food-drink" },
  { match: ["suco"], query: "fresh fruit juice glass", must: ["juice"], category: "food-drink" },
  { match: ["agua", "água"], query: "bottle of mineral water", must: ["water"], category: "food-drink" },

  // ---- Refeições prontas ----
  { match: ["marmita"], query: "brazilian lunch box marmita rice beans meat",
    must: ["lunch", "meal"], category: "food-meal" },
  { match: ["lasanha"], query: "lasagna pasta dish", must: ["lasagna"], category: "food-meal" },
  { match: ["pizza"], query: "fresh pizza italian", must: ["pizza"], category: "food-meal" },

  // ---- Saúde / dor ----
  { match: ["dipirona", "paracetamol", "ibuprofeno", "remedio dor", "remédio dor"],
    query: "pain relief medicine pills blister pack pharmacy", must: ["medicine", "pill"], category: "pharmacy" },
  { match: ["pomada"], query: "ointment cream tube pharmacy", must: ["ointment"], category: "pharmacy" },

  // ---- Beleza ----
  { match: ["shampoo"], query: "shampoo bottle hair care", must: ["shampoo"], category: "beauty" },
  { match: ["esmalte"], query: "nail polish bottle", must: ["nail polish"], category: "beauty" },

  // ---- Limpeza ----
  { match: ["sabao", "sabão", "detergente"], query: "cleaning detergent soap bottle",
    must: ["detergent"], category: "cleaning" },
];

// Segment-level English mapping when no specific rule matches.
const SEGMENT_HINTS: Record<string, { query: string; block?: string[]; category: string }> = {
  alimentacao: { query: "food product photography", block: ["landscape", "scenery"], category: "food" },
  alimentação: { query: "food product photography", block: ["landscape", "scenery"], category: "food" },
  comida: { query: "food product photography", block: ["landscape", "scenery"], category: "food" },
  bebidas: { query: "drink beverage product", category: "drink" },
  hortifruti: { query: "fresh vegetable produce market", block: ["flower", "bouquet"], category: "food-vegetable" },
  padaria: { query: "bakery bread product", block: ["snow", "ice landscape"], category: "food-bakery" },
  acougue: { query: "raw meat butcher product", category: "food-meat" },
  açougue: { query: "raw meat butcher product", category: "food-meat" },
  farmacia: { query: "pharmacy medicine product", category: "pharmacy" },
  farmácia: { query: "pharmacy medicine product", category: "pharmacy" },
  beleza: { query: "beauty cosmetic product", category: "beauty" },
  estetica: { query: "beauty salon service", category: "beauty" },
  estética: { query: "beauty salon service", category: "beauty" },
  limpeza: { query: "cleaning supply product", category: "cleaning" },
  petshop: { query: "pet supplies product", category: "pet" },
  pet: { query: "pet supplies product", category: "pet" },
  servicos: { query: "professional service workplace", category: "service" },
  serviços: { query: "professional service workplace", category: "service" },
  tecnologia: { query: "technology gadget product", category: "tech" },
  moda: { query: "fashion clothing product", category: "fashion" },
  vestuario: { query: "clothing apparel product", category: "fashion" },
  vestuário: { query: "clothing apparel product", category: "fashion" },
};

function localUnderstand(input: SubjectInput): SubjectUnderstanding {
  const n = norm(input.name);
  for (const r of RULES) {
    if (r.match.some((m) => n.includes(m))) {
      return {
        query: r.query,
        must: r.must ?? [],
        block: r.block ?? [],
        category: r.category,
        rationale: `local-rule:${r.match[0]}`,
      };
    }
  }
  const seg = norm(input.segment || "");
  const segHint = SEGMENT_HINTS[seg];
  const tagStr = (input.tags || []).map(norm).filter(Boolean).slice(0, 4).join(" ");
  const baseQuery = [
    input.name,
    segHint?.query || input.segment || "",
    tagStr,
  ].filter(Boolean).join(" ").trim();
  return {
    query: baseQuery,
    must: [],
    block: segHint?.block ?? [],
    category: segHint?.category ?? "general",
    rationale: segHint ? `segment:${seg}` : "fallback",
  };
}

// Optionally refine via Lovable AI when mode=on. Cheap text-only call.
async function aiRefine(input: SubjectInput, base: SubjectUnderstanding): Promise<SubjectUnderstanding> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) return base;
  try {
    const sys = `You translate Brazilian Portuguese product/service descriptions into precise English STOCK PHOTO search queries. 
    STRATEGY: Analyze the Name, Segment, Type (kind) and Description together to define with maximum precision what the object is. 
    Disambiguate tricky names (e.g. "Couve Flor" = cauliflower, NOT a flower; "Pão Congelado" = frozen raw bread dough, NOT a snowy landscape). 
    Return STRICT JSON: {"query":string,"must":string[],"block":string[],"category":string}. 
    "must" = English nouns/adjectives the picture MUST depict. 
    "block" = English nouns/adjectives the picture MUST NOT depict. 
    Keep arrays short (max 5 each), lowercase, single words or short phrases.`;
    const usr = JSON.stringify({
      name: input.name,
      segment: input.segment,
      tags: (input.tags || []).slice(0, 6),
      description: (input.description || "").slice(0, 400),
      linked: (input.linkedNames || []).slice(0, 4),
      kind: input.kind,
      providerType: input.providerType,
      heuristic: base,
    });
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: usr },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!r.ok) return base;
    const j = await r.json();
    const raw = j?.choices?.[0]?.message?.content;
    if (!raw) return base;
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return {
      query: String(parsed.query || base.query).trim() || base.query,
      must: Array.isArray(parsed.must) ? parsed.must.map((s: any) => norm(String(s))).filter(Boolean).slice(0, 5) : base.must,
      block: Array.isArray(parsed.block) ? parsed.block.map((s: any) => norm(String(s))).filter(Boolean).slice(0, 6) : base.block,
      category: String(parsed.category || base.category),
      rationale: `${base.rationale}+ai`,
    };
  } catch (e) {
    console.warn("aiRefine failed", e);
    return base;
  }
}

export async function understandSubject(input: SubjectInput): Promise<SubjectUnderstanding> {
  const base = localUnderstand(input);
  // Merge with strong heuristic block list always.
  const { mode } = await getAiMode().catch(() => ({ mode: "off" as const }));
  if (mode === "off") return base;
  const refined = await aiRefine(input, base);
  // Always keep the local block terms (safety net) merged with AI block.
  refined.block = Array.from(new Set([...(base.block || []), ...(refined.block || [])]));
  refined.must = Array.from(new Set([...(base.must || []), ...(refined.must || [])]));
  return refined;
}

// Score a candidate (title/description/tags) against must/block.
export function scoreCandidate(haystack: string, must: string[], block: string[]): number {
  const h = norm(haystack);
  if (!h) return 0;
  let score = 0;
  for (const b of block) if (b && h.includes(norm(b))) score -= 10;
  for (const m of must) if (m && h.includes(norm(m))) score += 5;
  return score;
}
