/* ──────────────────────────────────────────────────────────
   Vini Brain — contextual greetings + suggestion variations
   Vini é o "braço direito" do usuário no Vitrinei.
   NUNCA deve dizer que é uma IA.
   ────────────────────────────────────────────────────────── */

export type ViniMood = 'bem-estar' | 'utilidade' | 'surpresa';

const MOODS: ViniMood[] = ['bem-estar', 'utilidade', 'surpresa'];

const SUGGESTIONS: Record<ViniMood, string[]> = {
  'bem-estar': [
    'Que tal um momento só para você? Conheço terapeutas e massagistas perto daí.',
    'Um café especial para clarear a mente — posso achar a melhor cafeteria da região.',
    'Yoga, meditação ou um spa rápido? Te indico onde recarregar as energias.',
  ],
  utilidade: [
    'Posso resolver um problema da sua casa agora — encanamento, elétrica ou faxina.',
    'Vamos organizar essa lista de tarefas? Encontro os profissionais ideais.',
    'Precisa de manutenção no carro? Tenho mecânicos avaliados aqui pertinho.',
  ],
  surpresa: [
    'Tenho uma sugestão fora do comum: uma experiência nova que você ainda não testou.',
    'Que tal descobrir um serviço novo hoje? Acabei de receber novidades quentes.',
    'Surpresa: preparei um combo exclusivo baseado no que você já gostou antes.',
  ],
};

const TIME_GREETINGS = [
  { from: 5, to: 11, text: 'Bom dia ☀️ Pronto para um dia produtivo?' },
  { from: 11, to: 14, text: 'Hora do almoço 🍽️ Quer uma sugestão deliciosa?' },
  { from: 14, to: 18, text: 'Boa tarde ☕ Posso adiantar algo para você?' },
  { from: 18, to: 22, text: 'Boa noite 🌙 Hora de relaxar — me chama!' },
  { from: 22, to: 24, text: 'Ainda acordado? 🌌 Posso ajudar com algo rápido.' },
  { from: 0, to: 5, text: 'Madrugada por aqui 🌌 Estou de plantão para você.' },
];

export function getGreeting(now = new Date()): string {
  const h = now.getHours();
  const slot = TIME_GREETINGS.find((g) => h >= g.from && h < g.to);
  return slot?.text || 'Olá! Sou o Vini, seu braço direito no Vitrinei.';
}

export function getRandomMoodSuggestion(history: string[] = []): { mood: ViniMood; text: string } {
  const mood = MOODS[Math.floor(Math.random() * MOODS.length)];
  const pool = SUGGESTIONS[mood];
  // priorizar termos do histórico se houver
  if (history.length > 0) {
    const last = history[history.length - 1].toLowerCase();
    const KEYWORDS: Record<string, string[]> = {
      construção: ['Posso buscar pedreiros, eletricistas e materiais para sua obra.', 'Que tal um orçamento rápido com fornecedores parceiros?'],
      casa: ['Tenho diaristas e jardineiros disponíveis para hoje.', 'Posso organizar uma manutenção completa na sua casa.'],
      saúde: ['Conheço médicos, dentistas e nutricionistas perto de você.', 'Quer um check-up rápido? Te conecto com profissionais agora.'],
      beleza: ['Cabeleireiros e maquiadoras com horários abertos hoje.', 'Posso reservar um momento de cuidado pessoal para você.'],
    };
    for (const [k, options] of Object.entries(KEYWORDS)) {
      if (last.includes(k)) {
        const text = options[Math.floor(Math.random() * options.length)];
        return { mood: 'utilidade', text };
      }
    }
  }
  return { mood, text: pool[Math.floor(Math.random() * pool.length)] };
}

export const VINI_PERSONA = {
  intro: 'Sou o Vini, seu braço direito no Vitrinei. Conte comigo a qualquer hora.',
  capabilities: [
    'Encontrar profissionais perto de você',
    'Sugerir combos com cashback',
    'Resolver tarefas da sua rotina',
  ],
};
