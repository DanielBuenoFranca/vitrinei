/* ──────────────────────────────────────────────────────────
   Vini Stories — textos lúdicos rotativos sobre o personagem
   Cada texto termina com um CTA implícito de "Indique e Ganhe".
   ────────────────────────────────────────────────────────── */

export type ViniStory = {
  title: string;
  body: string;
  ctaHint: string;
};

const STORIES: ViniStory[] = [
  {
    title: '✨ Quem é o Vini?',
    body:
      'O Vini nasceu numa madrugada de café forte e código brilhante. Foi criado por um time de gente boa do Vitrinei Connect com um único objetivo: ser o seu braço-direito de bolso, encontrando os melhores prestadores e produtos perto de você — sem enrolação, sem ladainha.',
    ctaHint: 'Convide alguém e ganhe junto comigo!',
  },
  {
    title: '🚀 Por que o Vini existe?',
    body:
      'Porque pedir ajuda devia ser tão fácil quanto chamar um amigo. O Vini foi treinado para entender o que você precisa, achar quem resolve e ainda sugerir um cashback bonitinho no caminho. Tudo dentro do ecossistema Vitrinei.',
    ctaHint: 'Indique e ganhe — todo mundo sai feliz.',
  },
  {
    title: '💼 Vantagens para quem é Cliente',
    body:
      'Como cliente, você tem o Vini achando o melhor preço, a melhor avaliação e a melhor distância — tudo em segundos. Acumula cashback a cada compra, ganha bônus por indicação e pode parcelar serviços em até 5x sem complicação.',
    ctaHint: 'Chame um amigo e ganhem juntos.',
  },
  {
    title: '🛠️ Vantagens para quem é Prestador',
    body:
      'Sua loja virtual em segundos, vitrine personalizável com IA, antecipação de recebíveis e clientes chegando no seu radar de urgência. O Vini coloca seu serviço onde ele precisa estar: na frente de quem está procurando agora.',
    ctaHint: 'Traga outro prestador e dobrem os ganhos.',
  },
  {
    title: '🧠 Como o Vini pensa',
    body:
      'Ele lê o contexto da sua frase, cruza com o estoque dos prestadores parceiros e te entrega a melhor sugestão direto na busca. Se nada der match localmente, ele vai além e busca alternativas — sem te deixar na mão.',
    ctaHint: 'Indica essa magia para alguém!',
  },
  {
    title: '🎁 Indique e Ganhe',
    body:
      'A cada amigo que entra pelo seu convite e finaliza o cadastro, vocês dois ganham bônus na carteira. Quanto mais a sua rede cresce, maior o seu cashback recorrente. É o Vini transformando boca-a-boca em renda extra.',
    ctaHint: 'Comece sua rede agora.',
  },
  {
    title: '🌎 O sonho do Vini',
    body:
      'Conectar todo MEI do Brasil ao cliente certo, na hora certa, com o preço justo. Um ecossistema onde quem faz bem feito é encontrado, e quem precisa de ajuda nunca fica sozinho. Esse é o Vitrinei — e o Vini é a voz dele.',
    ctaHint: 'Bora construir esse sonho juntos?',
  },
];

export function getRandomStory(): ViniStory {
  return STORIES[Math.floor(Math.random() * STORIES.length)];
}

export function getStoryByIndex(i: number): ViniStory {
  return STORIES[i % STORIES.length];
}

export const STORY_COUNT = STORIES.length;
