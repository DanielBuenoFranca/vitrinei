// ─────────────────────────────────────────────────────────────
// viniBrain — Inteligência local compartilhada do Vini.
//
// Objetivo: responder em PT-BR de forma natural, variada e contextual
// SEM revelar nenhum estado interno (modo economia, fallback, etc.).
// É usado por vini-chat (quando o gateway está indisponível ou desligado)
// e por qualquer outra edge que precise gerar uma resposta humanizada.
//
// Princípios:
//   1) Nunca simular fala do usuário. Só geramos turnos de "assistant".
//   2) Nunca dizer que somos IA, modelo, ou que estamos limitados.
//   3) Usar o histórico para encadear o assunto (continuidade).
//   4) Variar a resposta para não parecer script.
//   5) Conectar a conversa a ações reais do Vitrinei (busca, loja, carteira,
//      carrinho, suporte, radar, vitrine), mas sem empurrar — sugerindo.
// ─────────────────────────────────────────────────────────────

export type BrainMessage = { role: "user" | "assistant"; content: string };

export interface BrainInput {
  messages: BrainMessage[];
  userName?: string | null;
  session?: {
    tags?: string[];
    segments?: string[];
    lastIntent?: string;
    lastQuery?: string;
  } | null;
}

export interface BrainOutput {
  text: string;
  topic: string;
  followUp?: string;
}

// ── Helpers ──────────────────────────────────────────────────
const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const firstName = (name?: string | null) => (name || "").trim().split(/\s+/)[0] || "";

function pick<T>(arr: T[], seed: number): T {
  if (!arr.length) return arr[0];
  const i = Math.abs(seed) % arr.length;
  return arr[i];
}

function seedOf(text: string) {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) | 0;
  return h ^ Math.floor(Date.now() / 60000); // muda a cada minuto
}

function lastUser(messages: BrainMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") return messages[i].content || "";
  }
  return "";
}

function lastAssistant(messages: BrainMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "assistant") return messages[i].content || "";
  }
  return "";
}

function withName(name: string, text: string) {
  if (!name) return text.charAt(0).toUpperCase() + text.slice(1);
  // se a frase já começa com nome, evita duplicar
  if (text.toLowerCase().startsWith(name.toLowerCase())) return text;
  return `${name}, ${text}`;
}

// ── Pequenos "skills" determinísticos ────────────────────────
function tryMath(q: string): string | null {
  // calc simples: "quanto é 12*7", "12 + 4", "2^10"
  const m = q.match(/(-?\d+(?:[.,]\d+)?)\s*([+\-*/x×÷^])\s*(-?\d+(?:[.,]\d+)?)/);
  if (!m) return null;
  const a = parseFloat(m[1].replace(",", "."));
  const b = parseFloat(m[3].replace(",", "."));
  const op = m[2];
  let r: number;
  switch (op) {
    case "+": r = a + b; break;
    case "-": r = a - b; break;
    case "*": case "x": case "×": r = a * b; break;
    case "/": case "÷": r = b === 0 ? NaN : a / b; break;
    case "^": r = Math.pow(a, b); break;
    default: return null;
  }
  if (!isFinite(r)) return null;
  const out = Number.isInteger(r) ? String(r) : r.toFixed(2).replace(".", ",");
  return `${a} ${op} ${b} = ${out}`;
}

function tryDateTime(q: string): string | null {
  if (!/\b(que horas|hora agora|que dia|hoje é|data de hoje|dia da semana)\b/.test(q)) return null;
  const now = new Date();
  const dias = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
  const meses = ["janeiro","fevereiro","março","abril","maio","junho","julho","agosto","setembro","outubro","novembro","dezembro"];
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  if (/hora/.test(q)) return `Aqui são ${hh}:${mm} agora.`;
  return `Hoje é ${dias[now.getDay()]}, ${now.getDate()} de ${meses[now.getMonth()]}.`;
}

// ── Catálogo de tópicos ──────────────────────────────────────
type Topic = {
  id: string;
  match: RegExp;
  replies: ((ctx: { name: string; q: string }) => string)[];
  followUp?: (ctx: { name: string; q: string }) => string | undefined;
};

const TOPICS: Topic[] = [
  {
    id: "greeting",
    match: /\b(oi+|ol[áa]|e a[ií]|opa|hey|bom dia|boa tarde|boa noite|tudo bem|tudo certo|como vai)\b/,
    replies: [
      ({ name }) => `${name ? `Oi ${name}!` : "Oi!"} Tô por aqui, com tempo pra você. O que vamos resolver hoje?`,
      ({ name }) => `${name ? `E aí, ${name}!` : "E aí!"} Pode mandar — pergunta, ideia, dúvida ou só papo, tô dentro.`,
      ({ name }) => `${name ? `Olá, ${name}.` : "Olá."} Bora conversar. Você quer falar de quê?`,
      ({ name }) => `${name ? `Oi, ${name}!` : "Oi!"} Tudo certinho por aqui. E você, no que tá pensando agora?`,
    ],
  },
  {
    id: "identity",
    match: /\b(quem [eé] voc[eê]|seu nome|voc[eê] [eé] (uma )?(ia|robo|rob[oô]|bot|maquina))\b/,
    replies: [
      ({ name }) => `Eu sou o Vini${name ? `, ${name}` : ""} — seu braço-direito aqui no Vitrinei. Converso, organizo ideia, te ajudo a achar quem resolve e te encaminho pro lugar certo do app.`,
      ({ name }) => `Pode me chamar de Vini${name ? `, ${name}` : ""}. Tô aqui pra entender o que você precisa e transformar em ação dentro do Vitrinei.`,
      () => `Sou o Vini, parceiro digital do Vitrinei Connect. Conversa comigo como conversa com um amigo que conhece o ecossistema.`,
    ],
  },
  {
    id: "capabilities",
    match: /\b(o que voc[eê] (faz|sabe|pode)|como voc[eê] funciona|me ajuda(r)?|para que serve|pra que serve)\b/,
    replies: [
      ({ name }) =>
        `${name ? `${name}, ` : ""}eu te ajudo de várias formas: bater papo, entender o que você precisa, achar prestadores e produtos, organizar carrinho, explicar carteira e cashback, montar sua vitrine e abrir suporte. Me conta o que tá na sua cabeça agora.`,
      () => `Posso conversar livre, buscar serviços e produtos, te orientar na carteira, no carrinho, na sua loja e no suporte. Por onde você quer começar?`,
      ({ name }) => `Resumo rápido${name ? `, ${name}` : ""}: converso, busco, organizo e te levo pra ação certa dentro do Vitrinei. Qual parte te interessa primeiro?`,
    ],
    followUp: () => "Quer começar pela busca, pela loja ou pela carteira?",
  },
  {
    id: "search",
    match: /\b(procur|busc|preciso de|quero (achar|encontrar)|onde (eu )?acho|tem (algum|alguem)|profissional|prestador|servi[cç]o|produto|kit)\b/,
    replies: [
      ({ name, q }) =>
        `${name ? `${name}, ` : ""}entendi a necessidade. Pelo que você falou (“${q.slice(0, 80)}”), posso transformar isso numa busca direcionada — me diz bairro, urgência e faixa de preço pra eu refinar.`,
      ({ name }) =>
        `${name ? `Bora, ${name}.` : "Bora."} Pra eu já te entregar quem resolve, me passa em uma frase: o que precisa, pra quando e onde.`,
      () => `Posso abrir a busca já com o que você descreveu. Quer que eu filtre por mais perto, mais barato ou mais bem avaliado?`,
    ],
    followUp: () => "Quer que eu abra a busca agora?",
  },
  {
    id: "cart",
    match: /\b(carrinho|finalizar|checkout|pagar|pagamento|comprar|fechar pedido)\b/,
    replies: [
      ({ name }) => `${name ? `${name}, ` : ""}no carrinho você junta vários itens e finaliza com cashback, pix ou cartão. Quer que eu te explique cada parte ou te leve direto pro checkout?`,
      () => `O carrinho aceita produtos e serviços juntos, com agendamento por item. Me diz o que você quer fazer e eu te oriento o próximo passo.`,
    ],
  },
  {
    id: "wallet",
    match: /\b(saldo|carteira|cashback|extrato|emprest|antecipa|split|recarga)\b/,
    replies: [
      ({ name }) => `${name ? `${name}, ` : ""}na carteira você vê saldo, cashback liberado, cashback bloqueado e extrato. Cashback paga sem taxa interna, e dá pra usar pra adiantar venda. Qual ponto você quer destrinchar?`,
      () => `A carteira mostra tudo: saldo, cashback, transações e seus benefícios da assinatura. Quer ver entrada, saída ou benefícios?`,
    ],
  },
  {
    id: "store",
    match: /\b(minha loja|vitrine|loja virtual|montar loja|vender|prestador|cnpj|mei)\b/,
    replies: [
      ({ name }) => `${name ? `${name}, ` : ""}sua loja no Vitrinei é sua vitrine viva: serviços, kits, produtos, fotos, preço e horário de atendimento. Posso te guiar passo a passo se quiser.`,
      () => `Dá pra montar a loja em minutos: cadastra serviços, vincula produtos, define preços e ativa kits. Quer começar pelo essencial ou pelo avançado?`,
    ],
  },
  {
    id: "subscription",
    match: /\b(assinatura|plano|mensalidade|fideliza|elite)\b/,
    replies: [
      ({ name }) => `${name ? `${name}, ` : ""}a assinatura libera vitrine completa, taxas reduzidas e benefícios progressivos. Conforme você usa, ganha cobertura e eleva o selo de fidelidade.`,
      () => `O plano funciona como um clube: quanto mais ativo, mais benefício você acumula. Quer entender cobertura, custo ou o selo Elite?`,
    ],
  },
  {
    id: "support",
    match: /\b(suporte|ajuda|reclama|problema|erro|n[ãa]o consigo|deu erro|bug|atendimento)\b/,
    replies: [
      ({ name }) => `${name ? `${name}, ` : ""}me conta em uma frase o que aconteceu. Se for algo que eu não resolvo aqui no papo, abro o atendimento humano com seu contexto pronto.`,
      () => `Tô junto. Descreve o que tentou e onde travou, que eu já organizo o caminho — autoatendimento ou suporte humano, o que fizer mais sentido.`,
    ],
  },
  {
    id: "radar",
    match: /\b(urgenc|urgência|agora|emergencia|emergência|radar|imediato|r[áa]pido)\b/,
    replies: [
      ({ name }) => `${name ? `${name}, ` : ""}pra urgência tem o Radar: ele acha quem tá disponível mais perto e em movimento. Quer que eu te leve direto pra lá?`,
      () => `Em urgência o caminho mais curto é o Radar — encontra quem tá ativo agora. Te encaminho?`,
    ],
  },
  {
    id: "thanks",
    match: /\b(obrigad[ao]|valeu|agradec|brigad[ao]|tmj)\b/,
    replies: [
      ({ name }) => `Imagina${name ? `, ${name}` : ""}. Tô aqui sempre que precisar.`,
      () => `Disponha. Qualquer coisa, é só me chamar de novo.`,
      ({ name }) => `Tranquilo${name ? `, ${name}` : ""}! Bora pro próximo passo quando você quiser.`,
    ],
  },
  {
    id: "feeling",
    match: /\b(triste|cansad[ao]|estress|ansios|feliz|animad[ao]|com raiva|preocupad[ao])\b/,
    replies: [
      ({ name }) => `${name ? `${name}, ` : ""}te entendo. Conta um pouco mais — às vezes só nomear o que tá pesando já desafoga.`,
      () => `Que bom que dividiu isso comigo. Quer continuar conversando sobre isso ou prefere que a gente foque em algo prático?`,
    ],
  },
  {
    id: "joke",
    match: /\b(piada|me faz rir|conta algo engra[cç]ado)\b/,
    replies: [
      () => `Vai uma leve: o MEI foi no banco e disse "quero abrir uma conta". O gerente respondeu: "no Vitrinei é mais fácil, abre a vitrine que o cliente vem". 😄`,
      () => `Olha essa: o cliente perguntou ao prestador — "quanto custa?". O prestador respondeu — "depende do café que você me oferece primeiro". ☕`,
    ],
  },
  {
    id: "knowledge",
    match: /\b(o que [eé]|por que|porque|como funciona|me explica|defini[cç]ao|definição|significa)\b/,
    replies: [
      ({ name, q }) =>
        `${name ? `${name}, ` : ""}boa pergunta. Sobre “${q.slice(0, 60)}”, eu posso te ajudar a transformar isso em ação dentro do Vitrinei — buscar quem entende, achar produto relacionado ou abrir um conteúdo. Quer ir por qual caminho?`,
      ({ q }) =>
        `Tema interessante (“${q.slice(0, 60)}”). Posso te conectar com prestadores ou conteúdos relacionados, e a gente continua a conversa em cima do que aparecer. Topa?`,
    ],
  },
  {
    id: "yesno_continuation",
    match: /^(sim|claro|pode|bora|vamos|quero|positivo|isso mesmo|com certeza|ok)\b/,
    replies: [
      () => `Fechado. Me passa um detalhe extra que eu já encaminho do jeito certo.`,
      ({ name }) => `Show${name ? `, ${name}` : ""}! Pra eu agir certo, me dá um detalhe (o quê / onde / quando).`,
    ],
  },
  {
    id: "negation",
    match: /^(nao|não|n|negativo|agora não|deixa pra l[áa])\b/,
    replies: [
      () => `Tranquilo. Mudamos de assunto: quer falar de outra coisa ou já encerramos por aqui?`,
      ({ name }) => `Beleza${name ? `, ${name}` : ""}. Tô por aqui — se quiser, escolhe outro tema.`,
    ],
  },
];

// ── Saudação inicial (quando não há histórico) ───────────────
const OPENERS = [
  (n: string) => `${n ? `Oi ${n}!` : "Oi!"} Sobre o que vamos conversar hoje?`,
  (n: string) => `${n ? `E aí, ${n}!` : "E aí!"} Pode falar — papo livre ou ação prática, eu acompanho.`,
  (n: string) => `${n ? `Olá, ${n}.` : "Olá."} Tô curioso. Manda sua pergunta ou ideia.`,
];

// ── Resposta padrão quando nada casou (curiosidade ativa) ────
const FALLBACKS = [
  ({ name, q }: { name: string; q: string }) =>
    `${name ? `${name}, ` : ""}interessante essa colocação (“${q.slice(0, 70)}”). Conta um pouco mais — quer aprofundar a ideia ou transformar em ação aqui no Vitrinei?`,
  ({ name }: { name: string; q: string }) =>
    `${name ? `Faz sentido, ${name}.` : "Faz sentido."} Quer que a gente continue puxando esse fio ou prefere que eu te leve pra uma área específica do app?`,
  ({ q }: { name: string; q: string }) =>
    `Te ouvi. Sobre “${q.slice(0, 70)}”, posso responder do meu jeito ou conectar com quem manja do assunto aqui dentro. Como você prefere?`,
];

// ── Núcleo ──────────────────────────────────────────────────
export function think(input: BrainInput): BrainOutput {
  const messages = input.messages || [];
  const name = firstName(input.userName);
  const userText = lastUser(messages);
  const previousAssistant = lastAssistant(messages);

  // Sem mensagem do usuário → abertura.
  if (!userText.trim()) {
    const opener = pick(OPENERS, seedOf(name + "open"))(name);
    return { text: opener, topic: "opener" };
  }

  const q = userText.trim();
  const nq = norm(q);

  // Skills determinísticos primeiro
  const math = tryMath(nq);
  if (math) {
    return { text: withName(name, `${math}. Quer que eu use isso em algo aqui no Vitrinei?`), topic: "math" };
  }
  const dt = tryDateTime(nq);
  if (dt) return { text: withName(name, dt), topic: "datetime" };

  // Despedida
  if (/\b(tchau|fui|encerrar|at[ée] mais|at[ée] logo|bye)\b/.test(nq)) {
    return {
      text: name
        ? `Foi muito bom conversar contigo, ${name}. Volta quando quiser. 👋`
        : `Foi ótimo nosso papo. Me chama de novo quando precisar. 👋`,
      topic: "farewell",
    };
  }

  // Tópicos
  const candidates = TOPICS.filter((t) => t.match.test(nq));

  // Continuidade: se a última fala minha era pergunta e o usuário respondeu curto,
  // mantém o tópico anterior (extraído via session.lastIntent quando houver).
  const lastIntent = input.session?.lastIntent;
  if (
    candidates.length === 0 &&
    previousAssistant.trim().endsWith("?") &&
    lastIntent &&
    TOPICS.find((t) => t.id === lastIntent)
  ) {
    candidates.push(TOPICS.find((t) => t.id === lastIntent)!);
  }

  let chosen: Topic | null = null;
  if (candidates.length) {
    // Evita repetir o mesmo tópico que acabou de ser usado
    const filtered = candidates.filter((t) => !previousAssistant.toLowerCase().includes(`#${t.id}`));
    chosen = pick(filtered.length ? filtered : candidates, seedOf(nq));
  }

  if (chosen) {
    const reply = pick(chosen.replies, seedOf(nq + chosen.id))({ name, q });
    const fu = chosen.followUp?.({ name, q });
    return { text: fu ? `${reply}\n\n${fu}` : reply, topic: chosen.id, followUp: fu };
  }

  // Fallback curioso e humano (sem revelar limitação)
  const fb = pick(FALLBACKS, seedOf(nq))({ name, q });
  return { text: fb, topic: "open" };
}

// SSE helper compartilhado: empacota a resposta como stream OpenAI-like
export function streamBrainReply(text: string): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      const enc = new TextEncoder();
      // Quebra em pedaços pra simular fluxo natural (não é simulação de fala —
      // é só renderização progressiva no cliente que já espera SSE)
      const chunks = text.match(/.{1,28}(\s|$)|.+/g) || [text];
      for (const part of chunks) {
        const payload = { choices: [{ delta: { content: part }, index: 0, finish_reason: null }] };
        controller.enqueue(enc.encode(`data: ${JSON.stringify(payload)}\n\n`));
      }
      controller.enqueue(enc.encode(`data: [DONE]\n\n`));
      controller.close();
    },
  });
}
