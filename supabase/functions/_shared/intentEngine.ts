// Motor determinístico de intenção do Vini.
// Mapeia a fala/escrita do usuário a um Segmento + tags e cruza com o
// estoque (segments / dynamic_services / dynamic_products) via PostgREST.
// Sempre que existir mais de um segmento candidato com itens reais, devolve
// uma pergunta de refinamento. Quando converge para 1 candidato claro,
// devolve intent='search' já com query, item_type e segments prontos para
// abrir a tela de busca filtrada.

const URL_BASE = Deno.env.get("SUPABASE_URL");
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const headers = () => ({
  apikey: SERVICE_KEY ?? "",
  Authorization: `Bearer ${SERVICE_KEY ?? ""}`,
  "Content-Type": "application/json",
});

const norm = (s: string) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

// Núcleo léxico: para cada "necessidade" mapeamos palavras‑chave (gatilhos)
// e os segmentos prováveis em PT‑BR. A busca de segmentos no banco usa LIKE
// case‑insensitive, então variações como "Alimentação", "Restaurantes",
// "Restaurante e Lanchonetes" continuam casando.
type Need = {
  id: string;
  triggers: RegExp;
  segments: string[]; // candidatos para casar contra a tabela `segments`
  itemType: "service" | "product" | "both";
  query: string; // termo base para a busca
  followUp?: { question: string; suggestions: string[] };
};

// ──────────────────────────────────────────────────────────────────────────
// CONCEPT GRAPH — interpretação ampla do contexto.
// Mapeia termos específicos (ex.: "hamburguer", "pizza", "sushi") em uma
// constelação semântica de palavras relacionadas (carne, lanche, comida,
// fome, etc.). Essa expansão é injetada tanto na detecção de necessidade
// quanto na busca por palavras‑chave no estoque, fazendo o Vini "entender"
// que quem pede um hamburguer também está com fome / quer comida / lanche.
// Para ampliar, basta adicionar novas entradas no mapa abaixo.
type ConceptEntry = { match: RegExp; expand: string[] };
const CONCEPT_GRAPH: ConceptEntry[] = [
  // Comida — itens específicos puxam o universo "fome / comida / lanche"
  { match: /\b(hamburguer|hamb[uú]rguer|burger|x[- ]?burger|x[- ]?tudo|x[- ]?salada|cheeseburger)\b/,
    expand: ["hamburguer", "burger", "lanche", "carne", "comida", "fome", "alimentacao", "sanduiche"] },
  { match: /\b(pizza|calzone|pizzaria)\b/,
    expand: ["pizza", "comida", "fome", "alimentacao", "italiana", "lanche", "queijo"] },
  { match: /\b(sushi|temaki|sashimi|japonesa|japones|yakisoba)\b/,
    expand: ["sushi", "japonesa", "comida", "fome", "alimentacao", "peixe", "oriental"] },
  { match: /\b(churrasc|picanha|costela|espetinho)\b/,
    expand: ["churrasco", "carne", "comida", "fome", "alimentacao", "brasileira"] },
  { match: /\b(a[cç]a[ií]|sorvete|sobremesa|doce|bolo|brigadeiro|chocolate)\b/,
    expand: ["doce", "sobremesa", "comida", "fome", "alimentacao", "lanche"] },
  { match: /\b(salgad|coxinha|pastel|esfiha|empad)\b/,
    expand: ["salgado", "lanche", "comida", "fome", "alimentacao", "padaria"] },
  { match: /\b(suco|refrigerante|bebida|cerveja|vinho|drink|coquetel|caipirinha|agua)\b/,
    expand: ["bebida", "comida", "fome", "alimentacao", "drink"] },
  { match: /\b(caf[eé] da manh[aã]|caf[eé]|p[aã]o|padaria|bolacha|biscoit)\b/,
    expand: ["padaria", "cafe", "comida", "fome", "alimentacao", "lanche"] },
  { match: /\b(marmita|marmitex|prato feito|pf|self service|comida caseira|vegetariana|vegana|saud[aá]vel|fit)\b/,
    expand: ["marmita", "comida", "fome", "almoco", "alimentacao", "refeicao"] },

  // Saúde — sintomas específicos puxam "remédio / dor / saúde"
  { match: /\b(cabe[cç]a|enxaqueca)\b/,
    expand: ["cabeca", "dor", "remedio", "analgesico", "saude"] },
  { match: /\b(barriga|estomag|est[oô]mago|intestino|c[oó]lica|diarr|n[aá]usea)\b/,
    expand: ["barriga", "estomago", "dor", "remedio", "saude", "antiacido"] },
  { match: /\b(garganta|tosse|gripe|resfriad|sinusite|rinite)\b/,
    expand: ["garganta", "gripe", "remedio", "xarope", "saude", "antigripal"] },
  { match: /\b(febre|temperatura|calafrio)\b/,
    expand: ["febre", "remedio", "antitermico", "saude"] },
  { match: /\b(alergia|al[eé]rgic|coceira|urtic[aá]ria)\b/,
    expand: ["alergia", "remedio", "antialergico", "saude"] },

  // Casa / serviços — termos específicos puxam famílias amplas
  { match: /\b(vazamento|torneira|cano|chuveiro|pia|esgoto|encanador)\b/,
    expand: ["encanador", "hidraulica", "vazamento", "casa", "reparo", "manutencao"] },
  { match: /\b(tomada|disjuntor|curto|fia[cç]ao|el[eé]tric|chuveiro queimado|lampada)\b/,
    expand: ["eletricista", "eletrica", "casa", "reparo", "manutencao"] },
  { match: /\b(faxina|limpeza pesada|diarista|passar roupa|jardim)\b/,
    expand: ["faxina", "limpeza", "diarista", "casa", "domestico"] },

  // Beleza
  { match: /\b(cabel|corte|escova|progressiva|hidrata[cç]ao|coloracao|mecha)\b/,
    expand: ["cabelo", "salao", "beleza", "estetica"] },
  { match: /\b(unha|manicure|pedicure|esmalte|gel)\b/,
    expand: ["unha", "manicure", "beleza", "estetica", "salao"] },

  // Auto
  { match: /\b(pneu furado|borracharia|guincho|bater[ií]a descarregada|alinhamento|balanceamento)\b/,
    expand: ["carro", "automotivo", "oficina", "mecanico", "veiculo"] },
];

// Aplica o grafo conceitual à frase normalizada. Devolve o conjunto de
// palavras‑gatilho expandidas (sem duplicatas) — vazio se nada bater.
function expandConcepts(qNorm: string): string[] {
  const out = new Set<string>();
  for (const c of CONCEPT_GRAPH) {
    if (c.match.test(qNorm)) c.expand.forEach((w) => out.add(w));
  }
  return Array.from(out);
}

const NEEDS: Need[] = [
  {
    id: "fome",
    triggers:
      /\b(fome|comer|comida|almoc|jantar|lanch|faminto|barriga roncando|com vontade de comer|petisc|refei[cç]ao|hamburguer|hamb[uú]rguer|burger|pizza|sushi|churrasc|marmita|salgad|sorvete|a[cç]a[ií]|doce|sobremesa|p[aã]o|padaria|caf[eé] da manh[aã])\b/,
    segments: ["aliment", "restaurant", "lanchonete", "food", "padaria", "delivery"],
    itemType: "both",
    query: "comida",
    followUp: {
      question: "Que tipo de comida você está com vontade hoje? Comida japonesa, hamburguer, brasileira, vegana ou doces?",
      suggestions: ["Japonesa", "Hambúrguer", "Brasileira", "Doces"],
    },
  },
  {
    id: "dor",
    triggers:
      /\b(dor|dores|doendo|doi|d[oó]i|machucad|desconforto|com dor|febre|gripe|resfriad|enxaqueca|inflama|c[oó]lica|n[aá]usea|enj[oô]o|tontura|tosse|alergia|al[eé]rgic|coceira|azia|refluxo|diarr[eé]ia|prisao de ventre|intestino|garganta|sinusite|rinite|otite|cistite|infec[cç]ao|mal estar|adoec|doente|ferida|queimadura|pressao alta|diabet|inson[ií]a|ansied|estress|depress|enxaqueca)\b/,
    segments: ["sa[uú]de", "farm[aá]ci", "drogaria", "cl[ií]nic", "hospital", "rem[eé]dio", "natur"],
    itemType: "both",
    query: "alívio para dor",
    followUp: {
      question: "Onde é a dor e que tipo de desconforto você está sentindo? (ex.: cabeça, dente, costas, muscular, garganta, barriga)",
      suggestions: ["Cabeça", "Dente", "Costas", "Garganta", "Barriga"],
    },
  },
  {
    id: "remedio",
    triggers:
      /\b(rem[eé]di|medicament|farm[aá]ci|drogaria|antibi[oó]tic|anti[- ]?inflamat|analg[eé]sic|antial[eé]rgic|antit[eé]rmic|fitoter[aá]pic|pomada|xarope|comprimido|c[aá]psula|gotas|soro|vitamina|suplement|cha medicinal|ch[aá] medicinal|raiz medicinal|erva medicinal|natural para)\b/,
    segments: ["rem[eé]dio", "farm[aá]ci", "drogaria", "sa[uú]de", "natur", "fitoter"],
    itemType: "product",
    query: "remédio",
    followUp: {
      question: "Para qual sintoma você precisa do remédio? (ex.: dor, febre, alergia, gripe, estômago, sono)",
      suggestions: ["Dor", "Febre", "Alergia", "Gripe", "Estômago"],
    },
  },
  {
    id: "beleza",
    triggers: /\b(cabel|barba|unha|estetic|maquiag|sobrancelh|salao|sal[aã]o|depilac)\b/,
    segments: ["beleza", "estetic"],
    itemType: "service",
    query: "beleza",
  },
  {
    id: "casa",
    triggers:
      /\b(encanador|eletric|reform|pedreiro|obra|vazamento|conserto|pintura|marceneiro|gesso|telhado)\b/,
    segments: ["constru", "reform", "manuten", "casa"],
    itemType: "both",
    query: "reforma",
  },
  {
    id: "limpeza",
    triggers: /\b(faxina|limpeza|diarista|jardin|passadeira|camareira|dom[eé]stic)\b/,
    segments: ["dom[eé]stic", "limpeza", "servi[cç]os gerais"],
    itemType: "service",
    query: "limpeza",
  },
  {
    id: "auto",
    triggers: /\b(carro|moto|pneu|[oó]leo|guincho|mec[aâ]nic|bater[ií]a|alinha|balanc)\b/,
    segments: ["automot", "oficina", "ve[ií]cul"],
    itemType: "both",
    query: "automotivo",
  },
  {
    id: "saude_pro",
    triggers:
      /\b(m[eé]dic|dentist|psic[oó]log|terapeut|fisio|nutricion|consulta)\b/,
    segments: ["sa[uú]de", "cl[ií]nic", "consult"],
    itemType: "service",
    query: "consulta",
  },
  {
    id: "educacao",
    triggers: /\b(aula|curso|professor|mentoria|treinamento|estud)\b/,
    segments: ["educa", "ensino", "curso"],
    itemType: "service",
    query: "aula",
  },
  {
    id: "tech",
    triggers: /\b(internet|wifi|computador|notebook|celular|tv|smart|t[eé]cnico em inform)\b/,
    segments: ["tecnolog", "inform[aá]tic", "telecom"],
    itemType: "both",
    query: "tecnologia",
  },
];

const ACTION_INTENTS: { id: "cart" | "wallet" | "story" | "support"; rx: RegExp; msg: string }[] = [
  { id: "cart", rx: /\b(carrinho|finaliz|checkout|pagamento|comprar agora)\b/, msg: "Vou abrir seu carrinho." },
  { id: "wallet", rx: /\b(carteira|saldo|cashback|extrato|saque)\b/, msg: "Abrindo sua carteira." },
  { id: "support", rx: /\b(suporte|ajuda|reclam|n[aã]o achei|falta no sistema|atendimento)\b/, msg: "Vou levar para a Central de Atendimento." },
  { id: "story", rx: /\b(quem [eé] voc[eê]|sua historia|sobre o vini|sobre voc[eê])\b/, msg: "Posso te contar minha história." },
];

async function fetchSegments(): Promise<{ id: number; name: string; suggested_tags: string[] }[]> {
  if (!URL_BASE || !SERVICE_KEY) return [];
  try {
    const r = await fetch(
      `${URL_BASE}/rest/v1/segments?select=id,name,suggested_tags&order=name.asc&limit=200`,
      { headers: headers() },
    );
    if (!r.ok) return [];
    return await r.json();
  } catch { return []; }
}

// Stopwords PT‑BR para extrair tokens "interessantes" do que o usuário disse
const STOPWORDS = new Set([
  "estou","com","para","tem","que","uma","uns","umas","dos","das","meu","minha",
  "quero","preciso","muito","bem","mal","ola","oi","olá","tô","to","ta","tá",
  "vou","sou","eu","na","no","de","da","do","em","um","os","as","pra","por",
  "the","and","i","my","me","is","are",
]);

function extractKeywords(raw: string): string[] {
  const norm = (raw || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const words = norm.match(/\b[a-z0-9]{3,}\b/g) || [];
  return Array.from(new Set(words.filter((w) => !STOPWORDS.has(w))));
}

// Busca direta no estoque por palavras‑chave nas tabelas dynamic_products
// (name + tags) e dynamic_services (name). Sempre que algum item bater,
// devolvemos uma rota de busca com alta confiança usando o termo encontrado.
async function searchInventoryByKeywords(
  keywords: string[],
): Promise<{ products: any[]; services: any[]; segments: string[]; matchedKeyword?: string }> {
  if (!URL_BASE || !SERVICE_KEY || keywords.length === 0) {
    return { products: [], services: [], segments: [] };
  }
  for (const kw of keywords) {
    try {
      const enc = encodeURIComponent(kw);
      const [pRes, sRes] = await Promise.all([
        fetch(
          `${URL_BASE}/rest/v1/dynamic_products?select=name,tags,segments,provider&or=(name.ilike.*${enc}*,tags.cs.{${enc}},segments.cs.{${enc}})&limit=10`,
          { headers: headers() },
        ),
        fetch(
          `${URL_BASE}/rest/v1/dynamic_services?select=name,segment,segments,provider&or=(name.ilike.*${enc}*,segment.ilike.*${enc}*,segments.cs.{${enc}})&limit=10`,
          { headers: headers() },
        ),
      ]);
      const products = pRes.ok ? await pRes.json() : [];
      const services = sRes.ok ? await sRes.json() : [];
      if (products.length + services.length > 0) {
        const segs = new Set<string>();
        services.forEach((s: any) => s.segment && segs.add(s.segment));
        products.forEach((p: any) => Array.isArray(p.segments) && p.segments.forEach((x: string) => segs.add(x)));
        return { products, services, segments: Array.from(segs), matchedKeyword: kw };
      }
    } catch { /* tenta próximo */ }
  }
  return { products: [], services: [], segments: [] };
}

async function fetchSegmentInventory(segmentName: string): Promise<{ services: number; products: number; sample: string[] }> {
  if (!URL_BASE || !SERVICE_KEY) return { services: 0, products: 0, sample: [] };
  const enc = (v: string) => encodeURIComponent(v);
  try {
    const [svcRes, prdRes] = await Promise.all([
      fetch(`${URL_BASE}/rest/v1/dynamic_services?select=name&segment=eq.${enc(segmentName)}&limit=20`, { headers: headers() }),
      // produtos são associados a serviços; usamos tags como proxy
      fetch(`${URL_BASE}/rest/v1/dynamic_products?select=name&tags=cs.{${enc(segmentName)}}&limit=20`, { headers: headers() }),
    ]);
    const svc = svcRes.ok ? await svcRes.json() : [];
    const prd = prdRes.ok ? await prdRes.json() : [];
    const sample = [...svc.slice(0, 3).map((s: any) => s.name), ...prd.slice(0, 3).map((p: any) => p.name)];
    return { services: svc.length, products: prd.length, sample };
  } catch { return { services: 0, products: 0, sample: [] }; }
}

export type EngineResult = {
  intent: "chat" | "search" | "support" | "cart" | "story";
  next_agent: "vini" | "search" | "support" | "cart";
  tags: string[];
  segments: string[];
  query: string;
  item_type: "service" | "product" | "both";
  needs_more_info: boolean;
  follow_up_question?: string;
  suggestions: string[];
  transition_message: string;
  confidence: number;
  source: "engine";
};

const baseResult = (): EngineResult => ({
  intent: "chat",
  next_agent: "vini",
  tags: [],
  segments: [],
  query: "",
  item_type: "both",
  needs_more_info: false,
  suggestions: [],
  transition_message: "",
  confidence: 0,
  source: "engine",
});

export async function classifyMessage(message: string, sessionCtx: any = {}): Promise<EngineResult | null> {
  const raw = (message || "").trim();
  if (!raw) return null;
  const q = norm(raw);
  const out = baseResult();

  // 1) Intents de ação direta (carrinho/carteira/suporte/história)
  for (const a of ACTION_INTENTS) {
    if (a.rx.test(q)) {
      out.intent = a.id;
      out.next_agent = a.id === "story" ? "vini" : a.id;
      out.transition_message = a.msg;
      out.confidence = 0.85;
      return out;
    }
  }

  // 2) Necessidade detectada por gatilho léxico
  const need = NEEDS.find((n) => n.triggers.test(q));

  // 2.a) Busca direta no estoque pelas palavras‑chave da frase do usuário.
  //      Isso garante que mesmo sem um segmento mapeado, se houver um item
  //      cujo nome/tag bate com a fala (ex.: "Raiz para dor"), abrimos a
  //      tela de busca já filtrada.
  const keywords = extractKeywords(raw);
  // Expansão conceitual: "hamburguer" → ["lanche","carne","comida","fome",...]
  const concepts = expandConcepts(q);
  // Se houver necessidade detectada, expande com sinônimos da need (ex.:
  // "quero remédio" também tenta "dor", "alivio", etc.) e adiciona o grafo.
  const expandedKeywords = Array.from(new Set([
    ...keywords,
    ...concepts,
    ...(need ? [...norm(need.query).split(/\s+/).filter((w) => w.length >= 3), need.id] : []),
  ]));
  const inv = await searchInventoryByKeywords(expandedKeywords);

  // Refinamento: se a frase é muito vaga (poucas palavras "úteis") e a need
  // tem follow-up, primeiro pergunta para precisar a busca em vez de chutar.
  // Ex.: "quero remédio" → "Para qual sintoma?". Já "remédio para dor de
  // cabeça" tem keywords suficientes (>=2 úteis) e segue para a busca.
  // Se o grafo conceitual já trouxe expansão (termo específico como
  // "hamburguer"), não pedimos refinamento — vamos direto pra busca.
  const refinementDone = sessionCtx?.lastIntent === "chat" && sessionCtx?.needs_more_info;
  const isVague = need?.followUp && keywords.length <= 1 && concepts.length === 0 && !refinementDone;

  if (isVague) {
    out.intent = "chat";
    out.next_agent = "vini";
    out.needs_more_info = true;
    out.follow_up_question = need!.followUp!.question;
    out.suggestions = need!.followUp!.suggestions;
    out.tags = [need!.id];
    out.query = need!.query;
    out.item_type = need!.itemType;
    out.confidence = 0.8;
    return out;
  }

  if (inv.products.length + inv.services.length > 0) {
    const sample = inv.products[0]?.name || inv.services[0]?.name || inv.matchedKeyword;
    out.intent = "search";
    out.next_agent = "search";
    out.query = inv.matchedKeyword || raw;
    out.segments = inv.segments;
    out.tags = [need?.id, inv.matchedKeyword, ...keywords.slice(0, 3)].filter(Boolean) as string[];
    out.item_type = inv.products.length && !inv.services.length
      ? "product"
      : inv.services.length && !inv.products.length
        ? "service"
        : "both";
    out.transition_message = `Encontrei "${sample}" no estoque. Já vou abrir a busca filtrada pra você.`;
    out.confidence = 0.95;
    return out;
  }

  if (!need) return null; // deixa o caller decidir (chat puro / IA)

  // Busca segmentos reais no banco que casem com os candidatos
  const segs = await fetchSegments();
  const matched = segs.filter((s) => {
    const sn = norm(s.name);
    return need.segments.some((c) => new RegExp(c).test(sn));
  });

  // Se nada na base, retorna search com a query natural (a tela busca filtra
  // por nome/descrição mesmo sem segmento explícito).
  if (matched.length === 0) {
    out.intent = "support";
    out.next_agent = "vini";
    out.query = raw;
    out.item_type = need.itemType;
    out.tags = [need.id];
    out.transition_message = `Infelizmente não encontrei "${raw}" no estoque agora. Gostaria que eu acionasse a nossa Central de Atendimento para buscarem isso para você?`;
    out.confidence = 0.7;
    return out;
  }

  // Se múltiplos segmentos têm itens, gera follow‑up. Caso contrário, fecha.
  const inventories = await Promise.all(
    matched.map(async (s) => ({ seg: s, inv: await fetchSegmentInventory(s.name) })),
  );
  const withItems = inventories.filter((x) => x.inv.services + x.inv.products > 0);

  // contexto: se a sessão já fixou um segmento antes, prioriza
  const lockedSeg = Array.isArray(sessionCtx?.segments) && sessionCtx.segments.length === 1
    ? String(sessionCtx.segments[0])
    : null;

  if (lockedSeg) {
    const locked = withItems.find((x) => norm(x.seg.name) === norm(lockedSeg));
    if (locked) {
      out.intent = "search";
      out.next_agent = "search";
      out.segments = [locked.seg.name];
      out.tags = [need.id, ...locked.seg.suggested_tags.slice(0, 4)];
      out.query = `${need.query} ${raw}`.trim();
      out.item_type = need.itemType;
      out.transition_message = `Já estou abrindo ${locked.seg.name.toLowerCase()} para você.`;
      out.confidence = 0.92;
      return out;
    }
  }

  // 1 segmento com itens → fecha direto
  if (withItems.length === 1) {
    const only = withItems[0];
    out.intent = "search";
    out.next_agent = "search";
    out.segments = [only.seg.name];
    out.tags = [need.id, ...only.seg.suggested_tags.slice(0, 4)];
    out.query = need.query;
    out.item_type = need.itemType;
    out.transition_message = `Encontrei opções em ${only.seg.name}. Já vou abrir filtrado pra você.`;
    out.confidence = 0.9;
    return out;
  }

  // 2+ segmentos → pede refinamento
  if (withItems.length >= 2) {
    const suggestions = withItems.slice(0, 4).map((x) => x.seg.name);
    out.intent = "chat";
    out.next_agent = "vini";
    out.needs_more_info = true;
    out.follow_up_question =
      need.followUp?.question ||
      `Encontrei opções em ${suggestions.join(", ")}. Por qual você quer começar?`;
    out.suggestions = need.followUp?.suggestions?.length ? need.followUp.suggestions : suggestions;
    out.tags = [need.id];
    out.segments = suggestions;
    out.query = need.query;
    out.item_type = need.itemType;
    out.confidence = 0.7;
    return out;
  }

  // matched mas sem itens → Sugere acionar central
  out.intent = "support";
  out.next_agent = "vini";
  out.segments = matched.slice(0, 3).map((s) => s.name);
  out.tags = [need.id];
  out.query = need.query;
  out.item_type = need.itemType;
  out.transition_message = `Infelizmente não encontrei itens disponíveis em ${out.segments.join(", ")} no momento. Gostaria que eu acionasse a nossa Central de Atendimento para buscarem o que você precisa?`;
  out.confidence = 0.6;
  return out;
}
