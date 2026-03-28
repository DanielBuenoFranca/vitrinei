import {
  Wrench, Heart, Scissors, Home, Car, Monitor, Headphones,
  Stethoscope, GraduationCap, PawPrint, PartyPopper, Cpu, Leaf
} from 'lucide-react';

export const segments = [
  { id: 'manutencao', label: 'Manutenção & Reparos', icon: Wrench, color: 'hsl(var(--primary))', keywords: ['eletricista', 'encanador', 'pintor', 'marido de aluguel', 'reparo', 'instalação', 'manutenção', 'gesseiro', 'serralheiro', 'pedreiro'] },
  { id: 'saude_clinica', label: 'Saúde', icon: Stethoscope, color: 'hsl(0 84% 60%)', keywords: ['médico', 'dentista', 'odontologia', 'laboratório', 'exame', 'consulta', 'clínico', 'ortodontia', 'psicólogo', 'enfermeiro', 'medicina do trabalho'] },
  { id: 'bem_estar', label: 'Bem-estar & Saúde', icon: Heart, color: 'hsl(var(--success))', keywords: ['personal', 'yoga', 'pilates', 'massagem', 'fisioterapia', 'nutricionista', 'meditação', 'crossfit'] },
  { id: 'beleza', label: 'Estética & Beleza', icon: Scissors, color: 'hsl(var(--accent))', keywords: ['cabelo', 'manicure', 'estética', 'beleza', 'maquiagem', 'depilação', 'sobrancelha', 'cílios', 'barbeiro'] },
  { id: 'casa', label: 'Lar & Ambiente', icon: Home, color: 'hsl(150 60% 40%)', keywords: ['limpeza', 'faxina', 'jardinagem', 'decoração', 'mudança', 'casa', 'piscina', 'organização'] },
  { id: 'auto', label: 'Automotivo', icon: Car, color: 'hsl(var(--warning))', keywords: ['mecânico', 'funilaria', 'lavagem', 'carro', 'auto', 'pneu', 'polimento', 'guincho', 'rastreador'] },
  { id: 'digital', label: 'Digital & Criativo', icon: Monitor, color: 'hsl(270 70% 60%)', keywords: ['design', 'fotógrafo', 'vídeo', 'social media', 'copywriter', 'marketing', 'ui', 'ux', 'podcast'] },
  { id: 'tech', label: 'Tecnologia & Informática', icon: Cpu, color: 'hsl(190 80% 45%)', keywords: ['computador', 'celular', 'rede', 'formatação', 'cftv', 'câmera', 'e-commerce', 'ia', 'impressora'] },
  { id: 'educacao', label: 'Educação & Cursos', icon: GraduationCap, color: 'hsl(25 90% 55%)', keywords: ['professor', 'aula', 'inglês', 'música', 'violão', 'culinária', 'enem', 'concurso', 'programação'] },
  { id: 'pet', label: 'Pet & Animais', icon: PawPrint, color: 'hsl(85 60% 45%)', keywords: ['pet', 'veterinário', 'banho', 'tosa', 'dog walker', 'adestramento', 'ração', 'gato', 'cachorro'] },
  { id: 'eventos', label: 'Eventos & Festas', icon: PartyPopper, color: 'hsl(290 70% 55%)', keywords: ['buffet', 'dj', 'decoração', 'festa', 'casamento', 'aniversário', 'bartender', 'fotógrafo', 'bolo'] },
  { id: 'musica', label: 'Música', icon: Headphones, color: 'hsl(350 80% 50%)', keywords: ['violão', 'guitarra', 'piano', 'teclado', 'bateria', 'canto', 'aula de música', 'produção musical', 'dj', 'saxofone', 'violino', 'ukulele'] },
  { id: 'natureza', label: 'Natureza & Vida Natural', icon: Leaf, color: 'hsl(145 60% 35%)', keywords: ['jardinagem', 'horta', 'fitoterapia', 'comida natural', 'vegano', 'orgânico', 'plantas medicinais', 'aromaterapia', 'permacultura', 'compostagem', 'floral'] },
];

// ── NL Map: now with specific service & product IDs for precision ──
export const naturalLanguageMap: {
  triggers: string[];
  segments: string[];
  keywords: string[];
  relevantServiceIds?: number[];
  relevantProductIds?: number[];
  aiFollowUp?: string;
  needLabel?: string;
}[] = [
  {
    triggers: ['dor de barriga', 'dor de estômago', 'dor abdominal', 'mal estar', 'enjoo', 'náusea', 'azia', 'gastrite', 'indigestão'],
    segments: ['natureza', 'saude_clinica'], keywords: ['fitoterapia', 'fitoterápico', 'chá', 'remédio', 'abdominal'],
    relevantServiceIds: [27, 38, 4], // Fitoterapia, Florais, Teleconsulta
    relevantProductIds: [101, 102, 103, 104, 105, 106],
    needLabel: 'Desconforto abdominal',
    aiFollowUp: 'Identifiquei: **Desconforto abdominal**. Separei produtos para alívio imediato e profissionais especializados.'
  },
  {
    triggers: ['dor de cabeça', 'enxaqueca', 'cefaleia'],
    segments: ['natureza', 'saude_clinica'], keywords: ['fitoterapia', 'aromaterapia', 'remédio', 'analgésico'],
    relevantServiceIds: [31, 27, 4],
    relevantProductIds: [107, 108, 109, 103],
    needLabel: 'Dor de cabeça',
    aiFollowUp: 'Identifiquei: **Dor de cabeça**. Separei produtos para alívio e profissionais que podem ajudar.'
  },
  {
    triggers: ['dor no corpo', 'febre', 'gripe', 'resfriado'],
    segments: ['natureza', 'saude_clinica'], keywords: ['fitoterapia', 'chá', 'remédio'],
    relevantServiceIds: [27, 4, 38],
    relevantProductIds: [110, 103, 104, 111],
    needLabel: 'Gripe / Resfriado',
    aiFollowUp: 'Identifiquei: **Gripe/Resfriado**. Veja produtos para alívio dos sintomas e profissionais disponíveis.'
  },
  {
    triggers: ['insônia', 'não consigo dormir', 'ansiedade', 'estresse', 'nervoso', 'cansaço'],
    segments: ['natureza', 'bem_estar'], keywords: ['aromaterapia', 'fitoterapia', 'floral', 'massagem', 'yoga', 'meditação'],
    relevantServiceIds: [31, 38, 34, 7],
    relevantProductIds: [112, 113, 114, 115],
    needLabel: 'Ansiedade / Insônia',
    aiFollowUp: 'Identifiquei: **Ansiedade/Insônia**. Separei produtos calmantes e serviços de relaxamento.'
  },
  {
    triggers: ['alergia', 'coceira', 'irritação na pele', 'dermatite'],
    segments: ['natureza', 'saude_clinica'], keywords: ['fitoterapia', 'plantas medicinais', 'remédio'],
    relevantServiceIds: [27, 4, 38],
    relevantProductIds: [116, 117, 104],
    needLabel: 'Alergia / Irritação',
    aiFollowUp: 'Identifiquei: **Alergia/Irritação na pele**. Veja produtos naturais e profissionais para consulta.'
  },
  {
    triggers: ['remédio', 'remedio', 'medicamento', 'preciso de remédio', 'farmácia', 'farmacia'],
    segments: ['natureza', 'saude_clinica'], keywords: ['fitoterapia', 'fitoterápico', 'chá', 'remédio'],
    relevantServiceIds: [27, 38, 4],
    relevantProductIds: [101, 102, 103, 104, 105, 106, 107, 108],
    needLabel: 'Remédios',
    aiFollowUp: 'Você precisa de um remédio! Pode me dizer **onde está doendo ou qual o sintoma**? Enquanto isso, veja opções fitoterápicas disponíveis:'
  },
  {
    triggers: ['machuquei o pé', 'machuquei', 'torci o pé', 'torção', 'dor no pé', 'pé inchado', 'dor no tornozelo', 'entorse'],
    segments: ['saude_clinica', 'natureza'], keywords: ['fisioterapia', 'anti-inflamatório', 'remédio'],
    relevantServiceIds: [49, 4],
    relevantProductIds: [118, 119, 105],
    needLabel: 'Lesão / Torção',
    aiFollowUp: 'Identifiquei: **Lesão/Torção**. Separei anti-inflamatórios, compressas e profissionais especializados.'
  },
  {
    triggers: ['dor nas costas', 'dor lombar', 'coluna', 'dor muscular', 'câimbra', 'contratura'],
    segments: ['saude_clinica', 'bem_estar', 'natureza'], keywords: ['fisioterapia', 'massagem', 'anti-inflamatório'],
    relevantServiceIds: [49, 7, 27],
    relevantProductIds: [118, 119, 120],
    needLabel: 'Dor muscular / Lombar',
    aiFollowUp: 'Identifiquei: **Dor muscular/lombar**. Veja produtos para alívio e profissionais disponíveis.'
  },
  {
    triggers: ['dor de dente', 'dente doendo', 'gengiva', 'dor na boca'],
    segments: ['saude_clinica'], keywords: ['dentista', 'consulta', 'remédio'],
    relevantServiceIds: [3],
    relevantProductIds: [121, 105],
    needLabel: 'Dor de dente',
    aiFollowUp: 'Identifiquei: **Dor de dente**. Veja um analgésico para alívio imediato e agende uma consulta.'
  },
  {
    triggers: ['tosse', 'garganta inflamada', 'dor de garganta', 'rouquidão'],
    segments: ['natureza', 'saude_clinica'], keywords: ['chá', 'mel', 'fitoterapia', 'remédio'],
    relevantServiceIds: [27, 4],
    relevantProductIds: [110, 111, 103, 122],
    needLabel: 'Dor de garganta / Tosse',
    aiFollowUp: 'Identifiquei: **Dor de garganta/Tosse**. Separei chás, mel e pastilhas para alívio.'
  },
  {
    triggers: ['blusa', 'camiseta', 'camisa', 'regata', 'top', 'cropped', 'moletom', 'jaqueta', 'casaco', 'blazer', 'suéter'],
    segments: ['moda', 'vestuario'], keywords: ['blusa', 'camiseta', 'roupa', 'moda'],
    relevantServiceIds: [39],
    relevantProductIds: [201, 202, 203],
    needLabel: 'Vestuário - Tops',
    aiFollowUp: 'Encontrei peças para você! Veja o estoque disponível com opções físicas e drop-shipping:'
  },
  {
    triggers: ['calça', 'calça jeans', 'legging', 'bermuda', 'short', 'saia', 'shorts'],
    segments: ['moda', 'vestuario'], keywords: ['calça', 'jeans', 'legging', 'bermuda', 'roupa'],
    relevantServiceIds: [40],
    relevantProductIds: [204, 205, 206],
    needLabel: 'Vestuário - Calças',
    aiFollowUp: 'Separei opções de calças e shorts para você:'
  },
  {
    triggers: ['vestido', 'macacão', 'conjunto', 'roupa', 'look', 'outfit', 'moda'],
    segments: ['moda', 'vestuario'], keywords: ['vestido', 'roupa', 'moda', 'look'],
    relevantServiceIds: [41],
    relevantProductIds: [207, 208, 209],
    needLabel: 'Moda - Looks',
    aiFollowUp: 'Veja as melhores opções de looks completos:'
  },
  {
    triggers: ['sapato', 'tênis', 'sandália', 'bota', 'chinelo', 'salto', 'calçado'],
    segments: ['moda', 'vestuario'], keywords: ['sapato', 'tênis', 'sandália', 'calçado'],
    relevantServiceIds: [42],
    relevantProductIds: [210, 211, 212],
    needLabel: 'Calçados',
    aiFollowUp: 'Encontrei calçados disponíveis para você:'
  },
  {
    triggers: ['jóia', 'joia', 'anel', 'aliança', 'brinco', 'colar', 'pulseira', 'corrente', 'pingente', 'cordão'],
    segments: ['acessorios', 'moda'], keywords: ['jóia', 'anel', 'brinco', 'colar', 'pulseira'],
    relevantServiceIds: [44],
    relevantProductIds: [213, 214, 215, 216],
    needLabel: 'Jóias & Acessórios',
    aiFollowUp: 'Separei jóias e acessórios disponíveis:'
  },
  {
    triggers: ['relógio', 'óculos', 'bolsa', 'carteira', 'cinto', 'chapéu', 'boné', 'lenço', 'cachecol', 'gravata'],
    segments: ['acessorios', 'moda'], keywords: ['relógio', 'óculos', 'bolsa', 'acessório'],
    relevantServiceIds: [46, 47],
    relevantProductIds: [217, 218, 219],
    needLabel: 'Acessórios',
    aiFollowUp: 'Encontrei acessórios disponíveis para você:'
  },
  {
    triggers: ['bijuteria', 'piercing', 'adereço', 'broche', 'presilha', 'tiara', 'faixa de cabelo'],
    segments: ['acessorios', 'moda'], keywords: ['bijuteria', 'acessório'],
    relevantServiceIds: [45],
    relevantProductIds: [220, 221],
    needLabel: 'Bijuterias',
    aiFollowUp: 'Separei bijuterias e adereços para você:'
  },
  {
    triggers: ['cortar grama', 'grama alta', 'capinar', 'jardim sujo', 'podar', 'mato alto', 'limpar jardim', 'quintal sujo', 'aparar grama'],
    segments: ['natureza', 'casa'], keywords: ['jardinagem', 'jardineiro', 'poda', 'grama'],
    relevantServiceIds: [29, 30],
    relevantProductIds: [301, 302, 303],
    needLabel: 'Jardinagem',
    aiFollowUp: 'Identifiquei: **Jardinagem**. Separei ferramentas, insumos e profissionais para cuidar do seu jardim.'
  },
  {
    triggers: ['plantar', 'horta', 'vaso', 'muda', 'semente', 'adubo', 'terra', 'fertilizante'],
    segments: ['natureza'], keywords: ['horta', 'jardinagem', 'sementes'],
    relevantServiceIds: [26],
    relevantProductIds: [304, 305, 306],
    needLabel: 'Horta & Plantio',
    aiFollowUp: 'Identifiquei: **Horta/Plantio**. Veja sementes, vasos e profissionais especializados.'
  },
  {
    triggers: ['carro não liga', 'carro falhando', 'barulho no carro', 'freio ruim', 'pneu furado'],
    segments: ['auto'], keywords: ['mecânico', 'guincho', 'pneu'],
    relevantServiceIds: [33, 11],
    relevantProductIds: [401, 402, 403, 404],
    needLabel: 'Problema no carro',
    aiFollowUp: 'Identifiquei: **Problema automotivo**. Separei peças para reparos e mecânicos disponíveis.'
  },
  {
    triggers: ['lavar carro', 'carro sujo', 'polir carro'],
    segments: ['auto'], keywords: ['lavagem', 'polimento'],
    relevantServiceIds: [12],
    relevantProductIds: [405, 406],
    needLabel: 'Lavagem automotiva',
    aiFollowUp: 'Identifiquei: **Lavagem/Polimento**. Veja produtos e serviço profissional:'
  },
  {
    triggers: ['casa suja', 'preciso limpar', 'faxina', 'limpeza pesada', 'vidros sujos'],
    segments: ['casa'], keywords: ['limpeza', 'faxina'],
    relevantServiceIds: [10],
    relevantProductIds: [501, 502, 503],
    needLabel: 'Limpeza residencial',
    aiFollowUp: 'Identifiquei: **Limpeza**. Separei produtos de limpeza e profissionais disponíveis.'
  },
  {
    triggers: ['torneira vazando', 'cano furado', 'entupiu', 'vaso entupido', 'descarga quebrou'],
    segments: ['manutencao'], keywords: ['encanador', 'reparo'],
    relevantServiceIds: [32],
    relevantProductIds: [601, 602, 603],
    needLabel: 'Problema hidráulico',
    aiFollowUp: 'Identifiquei: **Problema hidráulico**. Separei materiais e encanador disponível.'
  },
  {
    triggers: ['tomada não funciona', 'luz apagou', 'curto circuito', 'chuveiro queimou', 'fiação'],
    segments: ['manutencao'], keywords: ['eletricista', 'instalação'],
    relevantServiceIds: [1],
    relevantProductIds: [604, 605, 606],
    needLabel: 'Problema elétrico',
    aiFollowUp: 'Identifiquei: **Problema elétrico**. Separei materiais elétricos e eletricista disponível.'
  },
  {
    triggers: ['cabelo feio', 'preciso cortar cabelo', 'tintura', 'pintar cabelo'],
    segments: ['beleza'], keywords: ['cabelo', 'corte', 'barbeiro'],
    relevantServiceIds: [8],
    relevantProductIds: [701, 702, 703],
    needLabel: 'Cuidados com cabelo',
    aiFollowUp: 'Identifiquei: **Cuidados capilares**. Veja produtos e profissionais disponíveis.'
  },
  {
    triggers: ['unha quebrou', 'fazer unha', 'pé e mão'],
    segments: ['beleza'], keywords: ['manicure', 'estética'],
    relevantServiceIds: [35],
    relevantProductIds: [704, 705],
    needLabel: 'Unhas & Estética',
    aiFollowUp: 'Identifiquei: **Unhas/Estética**. Veja kits e profissionais.'
  },
  {
    triggers: ['meu cachorro', 'meu gato', 'meu pet', 'animal doente', 'vacina pet', 'pulga', 'carrapato'],
    segments: ['pet'], keywords: ['veterinário', 'pet', 'banho', 'tosa'],
    relevantServiceIds: [18, 19, 36],
    relevantProductIds: [801, 802, 803, 804],
    needLabel: 'Cuidados com Pet',
    aiFollowUp: 'Identifiquei: **Cuidados com Pet**. Separei produtos e profissionais especializados.'
  },
  {
    triggers: ['aprender inglês', 'aula particular', 'reforço escolar', 'estudar para concurso'],
    segments: ['educacao'], keywords: ['professor', 'aula', 'inglês'],
    relevantServiceIds: [16, 17],
    relevantProductIds: [901, 902, 903],
    needLabel: 'Educação',
    aiFollowUp: 'Identifiquei: **Educação**. Veja materiais didáticos e professores disponíveis.'
  },
  {
    triggers: ['aprender violão', 'aprender guitarra', 'aula de piano', 'aprender música', 'tocar bateria'],
    segments: ['musica'], keywords: ['violão', 'guitarra', 'piano', 'bateria'],
    relevantServiceIds: [23, 24, 25, 37],
    relevantProductIds: [1001, 1002, 1003, 1004],
    needLabel: 'Aulas de Música',
    aiFollowUp: 'Identifiquei: **Música**. Separei instrumentos, acessórios e professores.'
  },
  {
    triggers: ['computador lento', 'pc travando', 'vírus no pc', 'celular quebrou', 'tela quebrada'],
    segments: ['tech'], keywords: ['formatação', 'computador', 'celular'],
    relevantServiceIds: [14, 15],
    relevantProductIds: [1101, 1102, 1103],
    needLabel: 'Problema tecnológico',
    aiFollowUp: 'Identifiquei: **Problema com dispositivo**. Veja acessórios e técnicos disponíveis.'
  },
  {
    triggers: ['festa de aniversário', 'casamento', 'organizar festa', 'buffet', 'precisamos de dj'],
    segments: ['eventos'], keywords: ['festa', 'buffet', 'dj', 'casamento'],
    relevantServiceIds: [20, 21],
    relevantProductIds: [1201, 1202, 1203],
    needLabel: 'Evento / Festa',
    aiFollowUp: 'Identifiquei: **Evento/Festa**. Separei itens de decoração/doces e profissionais.'
  },
];

// ── Product Inventory (individual products with stock type) ──
export type StockType = 'fisico' | 'drop';

export interface ProductItem {
  id: number;
  name: string;
  price: number;
  provider: string;
  stockType: StockType;
  rating: number;
  distance: string;
  relatedServiceIds: number[];
  tags: string[]; // for matching symptoms/needs
}

export const productInventory: ProductItem[] = [
  // ── Abdominal / Estômago ──
  { id: 101, name: 'Chá Camomila Orgânico 30g', price: 12, provider: 'NaturalFarma MEI', stockType: 'fisico', rating: 4.8, distance: '1 km', relatedServiceIds: [27, 38], tags: ['dor de barriga', 'estômago', 'calmante', 'digestivo', 'abdominal', 'azia', 'gastrite'] },
  { id: 102, name: 'Chá Boldo 20 sachês', price: 9, provider: 'NaturalFarma MEI', stockType: 'fisico', rating: 4.7, distance: '1 km', relatedServiceIds: [27], tags: ['dor de barriga', 'fígado', 'digestão', 'abdominal', 'enjoo', 'mal estar'] },
  { id: 103, name: 'Própolis Spray 30ml', price: 18, provider: 'NaturalFarma MEI', stockType: 'fisico', rating: 4.9, distance: '1 km', relatedServiceIds: [27, 4], tags: ['imunidade', 'garganta', 'gripe', 'anti-inflamatório'] },
  { id: 104, name: 'Pomada Calêndula 50g', price: 22, provider: 'NaturalFarma MEI', stockType: 'fisico', rating: 4.7, distance: '1 km', relatedServiceIds: [27], tags: ['pele', 'irritação', 'alergia', 'cicatrizante'] },
  { id: 105, name: 'Arnica Gel 60g', price: 25, provider: 'FitoSaúde', stockType: 'fisico', rating: 4.8, distance: '2.5 km', relatedServiceIds: [27, 49], tags: ['dor', 'inflamação', 'muscular', 'torção', 'pancada', 'hematoma'] },
  { id: 106, name: 'Digestivo Fitoterápico Gotas', price: 28, provider: 'FloralVida', stockType: 'fisico', rating: 4.6, distance: '2.8 km', relatedServiceIds: [38, 27], tags: ['dor de barriga', 'digestão', 'estômago', 'abdominal', 'indigestão', 'azia', 'gastrite'] },

  // ── Dor de cabeça ──
  { id: 107, name: 'Óleo Essencial Lavanda 10ml', price: 32, provider: 'AromaVida', stockType: 'fisico', rating: 4.9, distance: '2 km', relatedServiceIds: [31], tags: ['dor de cabeça', 'enxaqueca', 'relaxante', 'calmante', 'ansiedade'] },
  { id: 108, name: 'Roll-On Alívio Cabeça (Menta+Lavanda)', price: 24, provider: 'AromaVida', stockType: 'fisico', rating: 4.8, distance: '2 km', relatedServiceIds: [31], tags: ['dor de cabeça', 'enxaqueca', 'cefaleia', 'alívio rápido'] },
  { id: 109, name: 'Chá Erva-Cidreira 30g', price: 10, provider: 'NaturalFarma MEI', stockType: 'fisico', rating: 4.7, distance: '1 km', relatedServiceIds: [27], tags: ['dor de cabeça', 'calmante', 'nervoso', 'ansiedade', 'insônia'] },

  // ── Gripe / Resfriado ──
  { id: 110, name: 'Mel Orgânico 300g', price: 28, provider: 'ChefVerde', stockType: 'fisico', rating: 4.9, distance: '4 km', relatedServiceIds: [28], tags: ['gripe', 'tosse', 'garganta', 'imunidade', 'resfriado'] },
  { id: 111, name: 'Chá de Gengibre + Limão 20 sachês', price: 14, provider: 'NaturalFarma MEI', stockType: 'fisico', rating: 4.7, distance: '1 km', relatedServiceIds: [27], tags: ['gripe', 'resfriado', 'tosse', 'garganta', 'imunidade', 'febre'] },

  // ── Ansiedade / Insônia ──
  { id: 112, name: 'Floral de Bach - Rescue 20ml', price: 45, provider: 'FloralVida', stockType: 'fisico', rating: 4.8, distance: '2.8 km', relatedServiceIds: [38], tags: ['ansiedade', 'estresse', 'nervoso', 'pânico', 'calmante'] },
  { id: 113, name: 'Kit Óleos Essenciais Relaxamento', price: 65, provider: 'AromaVida', stockType: 'fisico', rating: 4.9, distance: '2 km', relatedServiceIds: [31], tags: ['insônia', 'ansiedade', 'relaxamento', 'calmante', 'estresse'] },
  { id: 114, name: 'Chá Passiflora + Mulungu 30g', price: 16, provider: 'NaturalFarma MEI', stockType: 'fisico', rating: 4.7, distance: '1 km', relatedServiceIds: [27], tags: ['insônia', 'ansiedade', 'calmante', 'nervoso'] },
  { id: 115, name: 'Difusor Ultrassônico Aromaterapia', price: 89, provider: 'AromaVida', stockType: 'drop', rating: 4.8, distance: '2 km', relatedServiceIds: [31], tags: ['aromaterapia', 'relaxamento', 'insônia', 'bem-estar'] },

  // ── Alergia / Pele ──
  { id: 116, name: 'Sabonete Calêndula Natural', price: 15, provider: 'NaturalFarma MEI', stockType: 'fisico', rating: 4.6, distance: '1 km', relatedServiceIds: [27], tags: ['alergia', 'coceira', 'pele', 'irritação', 'dermatite'] },
  { id: 117, name: 'Loção Calmante Aloe Vera 200ml', price: 35, provider: 'NaturalFarma MEI', stockType: 'drop', rating: 4.7, distance: '1 km', relatedServiceIds: [27], tags: ['alergia', 'irritação', 'pele', 'coceira', 'queimadura'] },

  // ── Lesão / Muscular ──
  { id: 118, name: 'Bolsa Térmica Gel Quente/Frio', price: 30, provider: 'FisioHome', stockType: 'fisico', rating: 4.8, distance: '2 km', relatedServiceIds: [49], tags: ['dor muscular', 'torção', 'lombar', 'costas', 'inflamação', 'lesão'] },
  { id: 119, name: 'Faixa Elástica Compressão', price: 22, provider: 'FisioHome', stockType: 'fisico', rating: 4.7, distance: '2 km', relatedServiceIds: [49], tags: ['torção', 'entorse', 'pé', 'tornozelo', 'compressão', 'lesão'] },
  { id: 120, name: 'Spray Relaxante Muscular 100ml', price: 38, provider: 'FitoSaúde', stockType: 'drop', rating: 4.6, distance: '2.5 km', relatedServiceIds: [27, 49], tags: ['dor muscular', 'câimbra', 'costas', 'lombar', 'contratura'] },

  // ── Dor de dente ──
  { id: 121, name: 'Gel Anestésico Oral 10g', price: 18, provider: 'NaturalFarma MEI', stockType: 'fisico', rating: 4.5, distance: '1 km', relatedServiceIds: [3], tags: ['dor de dente', 'gengiva', 'boca', 'anestésico'] },

  // ── Garganta / Tosse ──
  { id: 122, name: 'Pastilha Própolis + Mel 10un', price: 12, provider: 'NaturalFarma MEI', stockType: 'fisico', rating: 4.8, distance: '1 km', relatedServiceIds: [27, 4], tags: ['garganta', 'tosse', 'rouquidão', 'inflamação'] },

  // ── Moda - Tops ──
  { id: 201, name: 'Blusa Algodão P/M/G', price: 39, provider: 'ModaFácil MEI', stockType: 'fisico', rating: 4.7, distance: '1.2 km', relatedServiceIds: [39], tags: ['blusa', 'camiseta', 'roupa', 'camisa', 'regata', 'moda'] },
  { id: 202, name: 'Camiseta Estampada Unissex', price: 49, provider: 'ModaFácil MEI', stockType: 'fisico', rating: 4.6, distance: '1.2 km', relatedServiceIds: [39], tags: ['camiseta', 'estampada', 'roupa', 'moda', 'blusa'] },
  { id: 203, name: 'Moletom Canguru Unissex', price: 89, provider: 'HomemStyle MEI', stockType: 'drop', rating: 4.7, distance: '4 km', relatedServiceIds: [43], tags: ['moletom', 'casaco', 'jaqueta', 'frio', 'roupa'] },

  // ── Moda - Calças ──
  { id: 204, name: 'Calça Jeans Skinny', price: 89, provider: 'JeansStore MEI', stockType: 'fisico', rating: 4.6, distance: '2.5 km', relatedServiceIds: [40], tags: ['calça', 'jeans', 'skinny', 'roupa', 'moda'] },
  { id: 205, name: 'Legging Suplex Fitness', price: 45, provider: 'JeansStore MEI', stockType: 'fisico', rating: 4.7, distance: '2.5 km', relatedServiceIds: [40], tags: ['legging', 'fitness', 'calça', 'academia', 'roupa'] },
  { id: 206, name: 'Bermuda Sarja Masculina', price: 59, provider: 'HomemStyle MEI', stockType: 'fisico', rating: 4.5, distance: '4 km', relatedServiceIds: [43], tags: ['bermuda', 'short', 'shorts', 'roupa', 'masculina'] },

  // ── Moda - Looks ──
  { id: 207, name: 'Vestido Midi Floral', price: 79, provider: 'ElaStyle MEI', stockType: 'fisico', rating: 4.8, distance: '3 km', relatedServiceIds: [41], tags: ['vestido', 'floral', 'roupa', 'look', 'moda', 'outfit'] },
  { id: 208, name: 'Conjunto Cropped + Saia', price: 99, provider: 'ElaStyle MEI', stockType: 'fisico', rating: 4.7, distance: '3 km', relatedServiceIds: [41], tags: ['conjunto', 'cropped', 'saia', 'look', 'outfit', 'moda'] },
  { id: 209, name: 'Macacão Longo Feminino', price: 119, provider: 'ElaStyle MEI', stockType: 'drop', rating: 4.6, distance: '3 km', relatedServiceIds: [41], tags: ['macacão', 'roupa', 'look', 'moda'] },

  // ── Calçados ──
  { id: 210, name: 'Sandália Rasteira Confort', price: 59, provider: 'PéBonito MEI', stockType: 'fisico', rating: 4.7, distance: '1.8 km', relatedServiceIds: [42], tags: ['sandália', 'rasteira', 'calçado', 'sapato'] },
  { id: 211, name: 'Tênis Casual Unissex', price: 129, provider: 'PéBonito MEI', stockType: 'drop', rating: 4.8, distance: '1.8 km', relatedServiceIds: [42], tags: ['tênis', 'casual', 'calçado', 'sapato'] },
  { id: 212, name: 'Bota Cano Curto', price: 149, provider: 'PéBonito MEI', stockType: 'drop', rating: 4.6, distance: '1.8 km', relatedServiceIds: [42], tags: ['bota', 'calçado', 'sapato', 'chinelo'] },

  // ── Jóias ──
  { id: 213, name: 'Anel Prata 925', price: 85, provider: 'BrilhoJóias MEI', stockType: 'fisico', rating: 4.9, distance: '2 km', relatedServiceIds: [44], tags: ['anel', 'prata', 'jóia', 'joia', 'aliança'] },
  { id: 214, name: 'Brinco Argola Ouro 18k', price: 220, provider: 'BrilhoJóias MEI', stockType: 'fisico', rating: 4.9, distance: '2 km', relatedServiceIds: [44], tags: ['brinco', 'ouro', 'jóia', 'joia', 'argola'] },
  { id: 215, name: 'Corrente Prata 60cm', price: 150, provider: 'BrilhoJóias MEI', stockType: 'fisico', rating: 4.8, distance: '2 km', relatedServiceIds: [44], tags: ['corrente', 'colar', 'prata', 'jóia', 'joia', 'pingente', 'cordão'] },
  { id: 216, name: 'Pulseira Berloques Prata', price: 95, provider: 'BrilhoJóias MEI', stockType: 'fisico', rating: 4.7, distance: '2 km', relatedServiceIds: [44], tags: ['pulseira', 'berloque', 'jóia', 'joia', 'prata'] },

  // ── Acessórios ──
  { id: 217, name: 'Relógio Digital Esportivo', price: 95, provider: 'TempoStyle MEI', stockType: 'fisico', rating: 4.6, distance: '2.8 km', relatedServiceIds: [47], tags: ['relógio', 'digital', 'esportivo', 'acessório'] },
  { id: 218, name: 'Óculos de Sol UV400', price: 79, provider: 'TempoStyle MEI', stockType: 'drop', rating: 4.7, distance: '2.8 km', relatedServiceIds: [47], tags: ['óculos', 'sol', 'uv', 'acessório'] },
  { id: 219, name: 'Bolsa Transversal Feminina', price: 85, provider: 'BagStore MEI', stockType: 'fisico', rating: 4.7, distance: '3.2 km', relatedServiceIds: [46], tags: ['bolsa', 'carteira', 'mochila', 'acessório'] },

  // ── Bijuterias ──
  { id: 220, name: 'Colar Choker Preto', price: 18, provider: 'AcessóriosPop MEI', stockType: 'fisico', rating: 4.5, distance: '800 m', relatedServiceIds: [45], tags: ['bijuteria', 'colar', 'choker', 'adereço'] },
  { id: 221, name: 'Kit Presilhas Pérola 6un', price: 22, provider: 'AcessóriosPop MEI', stockType: 'fisico', rating: 4.6, distance: '800 m', relatedServiceIds: [45], tags: ['presilha', 'tiara', 'faixa', 'cabelo', 'bijuteria', 'adereço'] },

  // ── Jardinagem ──
  { id: 301, name: 'Tesoura de Poda Profissional', price: 45, provider: 'GardenPro', stockType: 'fisico', rating: 4.8, distance: '3.5 km', relatedServiceIds: [30, 29], tags: ['poda', 'tesoura', 'jardim', 'grama', 'jardinagem'] },
  { id: 302, name: 'Adubo Orgânico 5kg', price: 25, provider: 'VerdeVivo', stockType: 'fisico', rating: 4.7, distance: '1.8 km', relatedServiceIds: [29, 26], tags: ['adubo', 'fertilizante', 'jardim', 'grama', 'horta'] },
  { id: 303, name: 'Luva de Jardinagem Par', price: 18, provider: 'GardenPro', stockType: 'fisico', rating: 4.6, distance: '3.5 km', relatedServiceIds: [30, 29], tags: ['luva', 'jardinagem', 'jardim', 'proteção'] },

  // ── Horta & Plantio ──
  { id: 304, name: 'Kit Sementes Orgânicas 10 tipos', price: 35, provider: 'UrbanGreen', stockType: 'fisico', rating: 4.9, distance: '3 km', relatedServiceIds: [26], tags: ['semente', 'horta', 'orgânico', 'plantar', 'muda'] },
  { id: 305, name: 'Vaso Autoirrigável 15cm', price: 29, provider: 'UrbanGreen', stockType: 'fisico', rating: 4.8, distance: '3 km', relatedServiceIds: [26], tags: ['vaso', 'horta', 'plantar', 'autoirrigável'] },
  { id: 306, name: 'Substrato Vegetal 10L', price: 22, provider: 'UrbanGreen', stockType: 'fisico', rating: 4.7, distance: '3 km', relatedServiceIds: [26], tags: ['terra', 'substrato', 'adubo', 'horta', 'fertilizante'] },

  // ── Automotivo ──
  { id: 401, name: 'Óleo Motor 5W30 Sintético 1L', price: 45, provider: 'ÓleoRápido', stockType: 'fisico', rating: 4.7, distance: '5 km', relatedServiceIds: [11, 33], tags: ['óleo', 'motor', 'carro', 'troca', 'sintético'] },
  { id: 402, name: 'Filtro de Óleo Universal', price: 28, provider: 'ÓleoRápido', stockType: 'fisico', rating: 4.6, distance: '5 km', relatedServiceIds: [11], tags: ['filtro', 'óleo', 'carro', 'motor'] },
  { id: 403, name: 'Vela de Ignição Kit 4un', price: 55, provider: 'MecFácil', stockType: 'fisico', rating: 4.6, distance: '5 km', relatedServiceIds: [33], tags: ['vela', 'ignição', 'carro', 'motor', 'falhando'] },
  { id: 404, name: 'Filtro de Ar Motor', price: 32, provider: 'MecFácil', stockType: 'drop', rating: 4.5, distance: '5 km', relatedServiceIds: [33], tags: ['filtro', 'ar', 'carro', 'motor'] },
  { id: 405, name: 'Kit Polimento Automotivo', price: 65, provider: 'BrilhoAuto', stockType: 'fisico', rating: 4.8, distance: '3 km', relatedServiceIds: [12], tags: ['polimento', 'cera', 'carro', 'brilho', 'lavagem'] },
  { id: 406, name: 'Shampoo Automotivo 500ml', price: 22, provider: 'BrilhoAuto', stockType: 'fisico', rating: 4.6, distance: '3 km', relatedServiceIds: [12], tags: ['shampoo', 'lavagem', 'carro', 'lavar'] },

  // ── Casa / Limpeza ──
  { id: 501, name: 'Kit Limpeza Completo 8 itens', price: 45, provider: 'Maria Clean', stockType: 'fisico', rating: 4.6, distance: '3.2 km', relatedServiceIds: [10], tags: ['limpeza', 'faxina', 'casa', 'produto', 'desinfetante'] },
  { id: 502, name: 'Desinfetante Concentrado 1L', price: 15, provider: 'Maria Clean', stockType: 'fisico', rating: 4.5, distance: '3.2 km', relatedServiceIds: [10], tags: ['desinfetante', 'limpeza', 'casa', 'faxina'] },
  { id: 503, name: 'Limpa Vidros Profissional 500ml', price: 18, provider: 'Maria Clean', stockType: 'drop', rating: 4.7, distance: '3.2 km', relatedServiceIds: [10], tags: ['vidro', 'limpeza', 'casa', 'janela'] },

  // ── Manutenção Hidráulica ──
  { id: 601, name: 'Fita Veda-Rosca 18mm 50m', price: 8, provider: 'Pedro Encanador', stockType: 'fisico', rating: 4.7, distance: '3.1 km', relatedServiceIds: [32], tags: ['fita', 'veda-rosca', 'encanamento', 'torneira', 'vazamento'] },
  { id: 602, name: 'Sifão Universal Flexível', price: 22, provider: 'Pedro Encanador', stockType: 'fisico', rating: 4.6, distance: '3.1 km', relatedServiceIds: [32], tags: ['sifão', 'pia', 'encanamento', 'entupido'] },
  { id: 603, name: 'Desentupidor Líquido 1L', price: 18, provider: 'Pedro Encanador', stockType: 'drop', rating: 4.5, distance: '3.1 km', relatedServiceIds: [32], tags: ['desentupidor', 'entupiu', 'entupido', 'vaso', 'pia', 'descarga'] },

  // ── Manutenção Elétrica ──
  { id: 604, name: 'Disjuntor 20A Unipolar', price: 12, provider: 'João Eletricista', stockType: 'fisico', rating: 4.8, distance: '2.3 km', relatedServiceIds: [1], tags: ['disjuntor', 'elétrica', 'curto', 'circuito', 'luz'] },
  { id: 605, name: 'Fio Elétrico 2.5mm 100m', price: 85, provider: 'João Eletricista', stockType: 'fisico', rating: 4.7, distance: '2.3 km', relatedServiceIds: [1], tags: ['fio', 'elétrico', 'fiação', 'tomada', 'instalação'] },
  { id: 606, name: 'Resistência Chuveiro Universal', price: 15, provider: 'João Eletricista', stockType: 'fisico', rating: 4.6, distance: '2.3 km', relatedServiceIds: [1], tags: ['chuveiro', 'resistência', 'queimou', 'elétrica'] },

  // ── Beleza - Cabelo ──
  { id: 701, name: 'Shampoo Profissional 500ml', price: 35, provider: 'Beauty Home', stockType: 'fisico', rating: 4.8, distance: '800 m', relatedServiceIds: [8], tags: ['shampoo', 'cabelo', 'lavagem', 'capilar'] },
  { id: 702, name: 'Kit Tintura Capilar', price: 45, provider: 'Beauty Home', stockType: 'fisico', rating: 4.7, distance: '800 m', relatedServiceIds: [8], tags: ['tintura', 'cabelo', 'pintar', 'cor', 'coloração'] },
  { id: 703, name: 'Máscara Hidratação Capilar 500g', price: 38, provider: 'Beauty Home', stockType: 'drop', rating: 4.8, distance: '800 m', relatedServiceIds: [8], tags: ['máscara', 'hidratação', 'cabelo', 'tratamento'] },

  // ── Beleza - Unhas ──
  { id: 704, name: 'Kit Esmaltes Gel 6 cores', price: 55, provider: 'NailArt', stockType: 'fisico', rating: 4.8, distance: '600 m', relatedServiceIds: [35], tags: ['esmalte', 'unha', 'gel', 'manicure'] },
  { id: 705, name: 'Kit Alicate + Lixa Profissional', price: 32, provider: 'NailArt', stockType: 'fisico', rating: 4.7, distance: '600 m', relatedServiceIds: [35], tags: ['alicate', 'unha', 'lixa', 'manicure', 'pedicure'] },

  // ── Pet ──
  { id: 801, name: 'Shampoo Pet Neutro 500ml', price: 28, provider: 'PetClean', stockType: 'fisico', rating: 4.7, distance: '1 km', relatedServiceIds: [18], tags: ['shampoo', 'pet', 'cachorro', 'gato', 'banho'] },
  { id: 802, name: 'Antipulgas Comprimido 3un', price: 45, provider: 'VetHome', stockType: 'fisico', rating: 4.9, distance: '2.5 km', relatedServiceIds: [19], tags: ['pulga', 'carrapato', 'antipulgas', 'pet', 'cachorro', 'gato'] },
  { id: 803, name: 'Ração Premium 15kg', price: 120, provider: 'PetClean', stockType: 'drop', rating: 4.6, distance: '1 km', relatedServiceIds: [18, 19], tags: ['ração', 'pet', 'cachorro', 'gato', 'alimentação'] },
  { id: 804, name: 'Guia Retrátil 5m', price: 35, provider: 'DogTrainer', stockType: 'fisico', rating: 4.7, distance: '4 km', relatedServiceIds: [36], tags: ['guia', 'coleira', 'passeio', 'cachorro', 'pet', 'adestramento'] },

  // ── Educação ──
  { id: 901, name: 'Dicionário Inglês-Português', price: 35, provider: 'EnglishNow', stockType: 'drop', rating: 4.8, distance: 'Online', relatedServiceIds: [16], tags: ['dicionário', 'inglês', 'livro', 'estudo'] },
  { id: 902, name: 'Apostila ENEM 2026 Completa', price: 65, provider: 'ENEMPro', stockType: 'fisico', rating: 4.9, distance: 'Online', relatedServiceIds: [17], tags: ['apostila', 'enem', 'concurso', 'estudo', 'reforço'] },
  { id: 903, name: 'Kit Cadernos + Canetas Study', price: 28, provider: 'ENEMPro', stockType: 'drop', rating: 4.5, distance: 'Online', relatedServiceIds: [16, 17], tags: ['caderno', 'caneta', 'estudo', 'aula', 'escolar'] },

  // ── Música ──
  { id: 1001, name: 'Encordoamento Nylon Violão', price: 22, provider: 'ViolãoMaster', stockType: 'fisico', rating: 4.8, distance: '1.5 km', relatedServiceIds: [23], tags: ['corda', 'violão', 'nylon', 'encordoamento', 'música'] },
  { id: 1002, name: 'Kit Palhetas Guitarra 12un', price: 18, provider: 'RockSchool', stockType: 'fisico', rating: 4.7, distance: '2 km', relatedServiceIds: [37], tags: ['palheta', 'guitarra', 'música', 'acessório'] },
  { id: 1003, name: 'Metrônomo Digital Clip', price: 35, provider: 'PianoClass', stockType: 'drop', rating: 4.8, distance: '2 km', relatedServiceIds: [24], tags: ['metrônomo', 'piano', 'teclado', 'ritmo', 'música'] },
  { id: 1004, name: 'Interface de Áudio USB 2 canais', price: 250, provider: 'BeatMaker', stockType: 'drop', rating: 4.9, distance: 'Remoto', relatedServiceIds: [25], tags: ['interface', 'áudio', 'usb', 'gravação', 'produção', 'home studio'] },

  // ── Tecnologia ──
  { id: 1101, name: 'Antivírus Premium 1 ano', price: 49, provider: 'FormatPC', stockType: 'drop', rating: 4.6, distance: '1.8 km', relatedServiceIds: [14], tags: ['antivírus', 'vírus', 'computador', 'pc', 'segurança'] },
  { id: 1102, name: 'Película Vidro Temperado Celular', price: 15, provider: 'CellFix', stockType: 'fisico', rating: 4.7, distance: '2.5 km', relatedServiceIds: [15], tags: ['película', 'celular', 'tela', 'vidro', 'proteção'] },
  { id: 1103, name: 'Cabo USB-C Carregador Rápido', price: 25, provider: 'CellFix', stockType: 'fisico', rating: 4.6, distance: '2.5 km', relatedServiceIds: [15], tags: ['cabo', 'usb', 'carregador', 'celular'] },

  // ── Eventos ──
  { id: 1201, name: 'Kit Doces Finos 100un', price: 120, provider: 'SaborFesta', stockType: 'fisico', rating: 4.8, distance: '5 km', relatedServiceIds: [20], tags: ['doce', 'festa', 'aniversário', 'casamento', 'buffet'] },
  { id: 1202, name: 'Kit Decoração Balões 50un', price: 35, provider: 'SaborFesta', stockType: 'drop', rating: 4.6, distance: '5 km', relatedServiceIds: [20], tags: ['decoração', 'balão', 'festa', 'aniversário'] },
  { id: 1203, name: 'Toalha de Mesa Festa 10un', price: 28, provider: 'SaborFesta', stockType: 'drop', rating: 4.5, distance: '5 km', relatedServiceIds: [20], tags: ['toalha', 'mesa', 'festa', 'decoração', 'evento'] },
];

// ── Service results (original mock) ──
export const mockResults = [
  { id: 1, name: 'Eletricista Residencial', segment: 'manutencao', provider: 'João Eletricista', price: 150, rating: 4.9, distance: '2.3 km', time: '30 min', products: ['Disjuntor 20A', 'Fio 2.5mm'] },
  { id: 2, name: 'Instalação de Câmeras', segment: 'tech', provider: 'VigiTech MEI', price: 350, rating: 4.7, distance: '4.1 km', time: '1h', products: ['Câmera IP WiFi', 'Cabo Cat6'] },
  { id: 3, name: 'Dentista — Limpeza', segment: 'saude_clinica', provider: 'OdontoFácil', price: 160, rating: 4.9, distance: '1.2 km', time: '40 min', products: ['Escova Dental Elétrica'] },
  { id: 4, name: 'Clínico Geral — Teleconsulta', segment: 'saude_clinica', provider: 'Dr. Saúde Online', price: 120, rating: 4.8, distance: 'Online', time: '30 min', products: [] },
  { id: 5, name: 'Medicina do Trabalho — ASO', segment: 'saude_clinica', provider: 'WorkMed', price: 90, rating: 4.6, distance: '3.5 km', time: '20 min', products: [] },
  { id: 6, name: 'Personal Trainer', segment: 'bem_estar', provider: 'Fit Express', price: 130, rating: 4.8, distance: '1.5 km', time: '1h', products: ['Faixa Elástica Kit'] },
  { id: 7, name: 'Massagem Relaxante', segment: 'bem_estar', provider: 'RelaxPro', price: 120, rating: 4.9, distance: '2 km', time: '1h', products: ['Óleo essencial lavanda'] },
  { id: 8, name: 'Corte + Escova', segment: 'beleza', provider: 'Beauty Home', price: 90, rating: 4.8, distance: '800 m', time: '1h', products: ['Shampoo profissional'] },
  { id: 9, name: 'Design de Sobrancelhas', segment: 'beleza', provider: 'BrowArt', price: 55, rating: 4.7, distance: '1.5 km', time: '30 min', products: [] },
  { id: 10, name: 'Limpeza Residencial', segment: 'casa', provider: 'Maria Clean', price: 100, rating: 4.6, distance: '3.2 km', time: '3h', products: ['Kit limpeza completo'] },
  { id: 11, name: 'Troca de Óleo', segment: 'auto', provider: 'ÓleoRápido', price: 65, rating: 4.6, distance: '5 km', time: '40 min', products: ['Óleo 5W30 sintético', 'Filtro de óleo'] },
  { id: 12, name: 'Polimento e Cristalização', segment: 'auto', provider: 'BrilhoAuto', price: 160, rating: 4.8, distance: '3 km', time: '2h', products: [] },
  { id: 13, name: 'Designer Gráfico', segment: 'digital', provider: 'Ana Design', price: 200, rating: 4.8, distance: 'Remoto', time: '2 dias', products: ['Kit Identidade Visual'] },
  { id: 14, name: 'Formatação de PC', segment: 'tech', provider: 'FormatPC', price: 70, rating: 4.6, distance: '1.8 km', time: '2h', products: ['Antivírus 1 ano'] },
  { id: 15, name: 'Conserto de Celular', segment: 'tech', provider: 'CellFix', price: 90, rating: 4.6, distance: '2.5 km', time: '1h', products: ['Película de Vidro'] },
  { id: 16, name: 'Professor de Inglês', segment: 'educacao', provider: 'EnglishNow', price: 90, rating: 4.9, distance: 'Online', time: '1h', products: ['Dicionário Inglês-Português'] },
  { id: 17, name: 'Preparatório ENEM', segment: 'educacao', provider: 'ENEMPro', price: 110, rating: 4.8, distance: 'Online', time: '1.5h', products: ['Apostila ENEM'] },
  { id: 18, name: 'Banho & Tosa', segment: 'pet', provider: 'PetClean', price: 60, rating: 4.7, distance: '1 km', time: '1h', products: ['Shampoo Pet'] },
  { id: 19, name: 'Veterinário Domiciliar', segment: 'pet', provider: 'VetHome', price: 150, rating: 4.9, distance: '2.5 km', time: '30 min', products: [] },
  { id: 20, name: 'Buffet para Festas', segment: 'eventos', provider: 'SaborFesta', price: 400, rating: 4.8, distance: '5 km', time: '4h', products: ['Kit Doces Finos'] },
  { id: 21, name: 'DJ para Eventos', segment: 'eventos', provider: 'DJBeat', price: 300, rating: 4.7, distance: '8 km', time: '5h', products: [] },
  { id: 22, name: 'Exame Laboratorial — Check-up', segment: 'saude_clinica', provider: 'LabExpress', price: 200, rating: 4.8, distance: '3 km', time: '1h', products: [] },
  { id: 23, name: 'Aula de Violão', segment: 'musica', provider: 'ViolãoMaster', price: 80, rating: 4.8, distance: '1.5 km', time: '1h', products: ['Encordoamento Nylon'] },
  { id: 24, name: 'Aula de Piano / Teclado', segment: 'musica', provider: 'PianoClass', price: 100, rating: 4.9, distance: '2 km', time: '1h', products: ['Metrônomo Digital'] },
  { id: 25, name: 'Produção Musical / Home Studio', segment: 'musica', provider: 'BeatMaker', price: 200, rating: 4.8, distance: 'Remoto', time: '2h', products: ['Interface de Áudio USB'] },
  { id: 26, name: 'Montagem de Horta Urbana', segment: 'natureza', provider: 'UrbanGreen', price: 130, rating: 4.9, distance: '3 km', time: '2h', products: ['Sementes Orgânicas', 'Vaso Autoirrigável'] },
  { id: 27, name: 'Fitoterapia — Consulta', segment: 'natureza', provider: 'FitoSaúde', price: 110, rating: 4.8, distance: '2.5 km', time: '45 min', products: ['Chá Fitoterápico Mix'] },
  { id: 28, name: 'Chef de Comida Natural / Vegana', segment: 'natureza', provider: 'ChefVerde', price: 160, rating: 4.8, distance: '4 km', time: '3h', products: ['Granola Artesanal', 'Mel Orgânico'] },
  { id: 29, name: 'Jardineiro — Corte de Grama', segment: 'natureza', provider: 'VerdeVivo', price: 80, rating: 4.7, distance: '1.8 km', time: '1.5h', products: ['Adubo Orgânico', 'Semente de Grama'] },
  { id: 30, name: 'Poda e Paisagismo', segment: 'natureza', provider: 'GardenPro', price: 150, rating: 4.9, distance: '3.5 km', time: '3h', products: ['Tesoura de Poda', 'Luva de Jardinagem'] },
  { id: 31, name: 'Aromaterapia — Sessão', segment: 'natureza', provider: 'AromaVida', price: 90, rating: 4.8, distance: '2 km', time: '1h', products: ['Kit Óleos Essenciais', 'Difusor Ultrassônico'] },
  { id: 32, name: 'Encanador Residencial', segment: 'manutencao', provider: 'Pedro Encanador', price: 120, rating: 4.7, distance: '3.1 km', time: '1h', products: ['Fita Veda-Rosca', 'Sifão Universal'] },
  { id: 33, name: 'Mecânico Domiciliar', segment: 'auto', provider: 'MecFácil', price: 200, rating: 4.6, distance: '5 km', time: '2h', products: ['Vela de Ignição', 'Filtro de Ar'] },
  { id: 34, name: 'Yoga & Meditação', segment: 'bem_estar', provider: 'ZenFlow', price: 80, rating: 4.9, distance: '1 km', time: '1h', products: ['Tapete de Yoga', 'Incenso Natural'] },
  { id: 35, name: 'Manicure & Pedicure', segment: 'beleza', provider: 'NailArt', price: 50, rating: 4.8, distance: '600 m', time: '1h', products: ['Kit Esmaltes'] },
  { id: 36, name: 'Adestramento de Cães', segment: 'pet', provider: 'DogTrainer', price: 120, rating: 4.8, distance: '4 km', time: '1h', products: ['Guia Retrátil', 'Petiscos Training'] },
  { id: 37, name: 'Aula de Guitarra Elétrica', segment: 'musica', provider: 'RockSchool', price: 90, rating: 4.7, distance: '2 km', time: '1h', products: ['Palhetas Kit', 'Cabo P10'] },
  { id: 38, name: 'Consulta Naturista — Florais', segment: 'natureza', provider: 'FloralVida', price: 95, rating: 4.7, distance: '2.8 km', time: '45 min', products: ['Floral de Bach Kit', 'Tintura Fitoterápica'] },
  { id: 39, name: 'Blusas e Camisetas', segment: 'moda', provider: 'ModaFácil MEI', price: 49, rating: 4.7, distance: '1.2 km', time: 'Pronta entrega', products: ['Blusa Algodão P/M/G', 'Camiseta Estampada', 'Regata Fitness'] },
  { id: 40, name: 'Calças e Jeans', segment: 'moda', provider: 'JeansStore MEI', price: 89, rating: 4.6, distance: '2.5 km', time: 'Pronta entrega', products: ['Calça Jeans Skinny', 'Legging Suplex', 'Bermuda Sarja'] },
  { id: 41, name: 'Vestidos e Conjuntos', segment: 'moda', provider: 'ElaStyle MEI', price: 79, rating: 4.8, distance: '3 km', time: 'Pronta entrega', products: ['Vestido Midi Floral', 'Conjunto Cropped+Saia', 'Macacão Longo'] },
  { id: 42, name: 'Calçados Femininos', segment: 'moda', provider: 'PéBonito MEI', price: 69, rating: 4.7, distance: '1.8 km', time: 'Pronta entrega', products: ['Sandália Rasteira', 'Tênis Casual', 'Bota Cano Curto'] },
  { id: 43, name: 'Moda Masculina', segment: 'moda', provider: 'HomemStyle MEI', price: 65, rating: 4.6, distance: '4 km', time: 'Pronta entrega', products: ['Camisa Social Slim', 'Bermuda Tactel', 'Moletom Canguru'] },
  { id: 44, name: 'Jóias em Prata e Ouro', segment: 'acessorios', provider: 'BrilhoJóias MEI', price: 120, rating: 4.9, distance: '2 km', time: 'Pronta entrega', products: ['Anel Prata 925', 'Brinco Argola Ouro', 'Corrente Prata', 'Aliança Compromisso'] },
  { id: 45, name: 'Bijuterias e Adereços', segment: 'acessorios', provider: 'AcessóriosPop MEI', price: 25, rating: 4.5, distance: '800 m', time: 'Pronta entrega', products: ['Colar Choker', 'Pulseira Berloques', 'Brinco Argola Acrílico', 'Presilha Pérola'] },
  { id: 46, name: 'Bolsas e Carteiras', segment: 'acessorios', provider: 'BagStore MEI', price: 85, rating: 4.7, distance: '3.2 km', time: 'Pronta entrega', products: ['Bolsa Transversal', 'Carteira Couro Sintético', 'Mochila Feminina'] },
  { id: 47, name: 'Relógios e Óculos', segment: 'acessorios', provider: 'TempoStyle MEI', price: 95, rating: 4.6, distance: '2.8 km', time: 'Pronta entrega', products: ['Relógio Digital Esportivo', 'Óculos de Sol UV400', 'Relógio Analógico Clássico'] },
  { id: 48, name: 'Remédios Naturais e Fitoterápicos', segment: 'saude_clinica', provider: 'NaturalFarma MEI', price: 35, rating: 4.8, distance: '1 km', time: 'Pronta entrega', products: ['Chá Camomila 30g', 'Própolis Spray', 'Arnica Gel', 'Pomada Calêndula'] },
  { id: 49, name: 'Fisioterapia Domiciliar', segment: 'saude_clinica', provider: 'FisioHome', price: 140, rating: 4.9, distance: '2 km', time: '1h', products: ['Faixa Elástica Reabilitação', 'Bolsa Térmica Gel'] },
];

// ── Intelligent Search Engine ──

export interface SearchResult {
  products: ProductItem[];
  services: typeof mockResults;
  followUp?: string;
  needLabel?: string;
  suggestedServices?: typeof mockResults;
}

// ── Helpers for universal fuzzy matching ──

/** Normalize accents & lowercase */
function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/** Break a phrase into meaningful tokens (2+ chars) */
function tokenize(s: string): string[] {
  return normalize(s).split(/\s+/).filter(t => t.length >= 2);
}

/** Score how well a set of tokens matches a target string */
function tokenMatchScore(tokens: string[], target: string): number {
  const t = normalize(target);
  let score = 0;
  for (const tok of tokens) {
    if (t.includes(tok)) score += tok.length; // longer matches = higher score
  }
  return score;
}

/** Score a product against query tokens */
function scoreProduct(p: ProductItem, tokens: string[]): number {
  let score = 0;
  score += tokenMatchScore(tokens, p.name) * 3;
  score += tokenMatchScore(tokens, p.provider) * 1;
  for (const tag of p.tags) {
    score += tokenMatchScore(tokens, tag) * 2;
  }
  return score;
}

/** Score a service against query tokens */
function scoreService(s: typeof mockResults[0], tokens: string[]): number {
  let score = 0;
  score += tokenMatchScore(tokens, s.name) * 3;
  score += tokenMatchScore(tokens, s.provider) * 1;
  for (const p of s.products) {
    score += tokenMatchScore(tokens, p) * 2;
  }
  const seg = segments.find(sg => sg.id === s.segment);
  if (seg) {
    for (const kw of seg.keywords) {
      score += tokenMatchScore(tokens, kw) * 1.5;
    }
  }
  return score;
}

/** Generate a dynamic need label from matched segments */
function generateNeedLabel(matchedSegs: string[], tokens: string[]): string {
  const segLabels = matchedSegs
    .map(id => segments.find(s => s.id === id)?.label)
    .filter(Boolean)
    .slice(0, 2);
  if (segLabels.length > 0) return segLabels.join(' + ');
  // Fallback: capitalize first meaningful token
  const main = tokens.find(t => t.length >= 3);
  return main ? main.charAt(0).toUpperCase() + main.slice(1) : 'Busca personalizada';
}

/** Generate dynamic AI follow-up */
function generateFollowUp(needLabel: string, productCount: number, serviceCount: number): string {
  if (productCount > 0 && serviceCount > 0) {
    return `Identifiquei: **${needLabel}**. Separei ${productCount} produto(s) e ${serviceCount} serviço(s) relevantes para você.`;
  }
  if (productCount > 0) {
    return `Identifiquei: **${needLabel}**. Encontrei ${productCount} produto(s) disponíveis. Veja abaixo:`;
  }
  if (serviceCount > 0) {
    return `Identifiquei: **${needLabel}**. Encontrei ${serviceCount} serviço(s) profissional(is) para você.`;
  }
  return `Entendi sua necessidade! 🧠 Estou buscando as melhores opções...`;
}

/**
 * Universal semantic search with optional conversation context.
 * Pass previous user messages as `conversationContext` to enable
 * multi-turn intelligence (e.g. "remédio" → "barriga" → combined).
 */
export function semanticSearch(query: string, conversationContext?: string[]): SearchResult {
  const q = normalize(query.trim());
  if (!q) return { products: [], services: [] };

  // ── Build enriched query from conversation context ──
  const contextTokens: string[] = [];
  if (conversationContext && conversationContext.length > 0) {
    // Use last 5 user messages as context
    const recent = conversationContext.slice(-5);
    for (const msg of recent) {
      contextTokens.push(...tokenize(msg));
    }
  }
  const queryTokens = tokenize(q);
  const allTokens = [...new Set([...queryTokens, ...contextTokens])];

  // ── 1. Match NL triggers (exact match, using both current + context) ──
  const combinedQuery = allTokens.join(' ');
  const matched = naturalLanguageMap.filter((nlm) =>
    nlm.triggers.some((t) => {
      const nt = normalize(t);
      return combinedQuery.includes(nt) || nt.includes(q);
    })
  );

  let followUp = matched.find((m) => m.aiFollowUp)?.aiFollowUp;
  let needLabel = matched.find((m) => m.needLabel)?.needLabel;

  // ── 2. Find PRODUCTS ──
  let matchedProducts: ProductItem[] = [];

  if (matched.length > 0) {
    // Precision: use NL-mapped IDs first
    const nlProductIds = matched.flatMap((m) => m.relevantProductIds || []);
    const allProducts = getAllProducts();
    const fromNL = allProducts.filter((p) => nlProductIds.includes(p.id));
    // Also fuzzy-match remaining products
    const fromFuzzy = allProducts
      .filter((p) => !nlProductIds.includes(p.id))
      .map(p => ({ product: p, score: scoreProduct(p, allTokens) }))
      .filter(x => x.score >= 4)
      .sort((a, b) => b.score - a.score)
      .map(x => x.product);
    matchedProducts = [...fromNL, ...fromFuzzy];
  } else {
    // Pure fuzzy search across all products
    matchedProducts = getAllProducts()
      .map(p => ({ product: p, score: scoreProduct(p, allTokens) }))
      .filter(x => x.score >= 4)
      .sort((a, b) => b.score - a.score)
      .map(x => x.product);
  }

  // Remove duplicates
  matchedProducts = [...new Map(matchedProducts.map(p => [p.id, p])).values()];

  // ── 3. Find SERVICES ──
  let matchedServices: typeof mockResults = [];
  const allSvcs = getAllServices();

  if (matched.length > 0) {
    const nlServiceIds = matched.flatMap((m) => m.relevantServiceIds || []);
    if (nlServiceIds.length > 0) {
      matchedServices = allSvcs.filter((r) => nlServiceIds.includes(r.id));
    } else {
      const nlSegments = matched.flatMap((m) => m.segments);
      matchedServices = allSvcs.filter((r) => nlSegments.includes(r.segment));
    }
    // Also add fuzzy-matched services not already included
    const existingIds = new Set(matchedServices.map(s => s.id));
    const fuzzyServices = allSvcs
      .filter(s => !existingIds.has(s.id))
      .map(s => ({ service: s, score: scoreService(s, allTokens) }))
      .filter(x => x.score >= 6)
      .sort((a, b) => b.score - a.score)
      .map(x => x.service);
    matchedServices = [...matchedServices, ...fuzzyServices];
  } else {
    // Pure fuzzy search across all services
    matchedServices = allSvcs
      .map(s => ({ service: s, score: scoreService(s, allTokens) }))
      .filter(x => x.score >= 4)
      .sort((a, b) => b.score - a.score)
      .map(x => x.service);
  }

  matchedServices.sort((a, b) => b.rating - a.rating);

  // ── 4. Cross-suggestion ──
  let suggestedServices: typeof mockResults = [];
  if (matchedProducts.length > 0 && matchedServices.length === 0) {
    const relatedIds = [...new Set(matchedProducts.flatMap((p) => p.relatedServiceIds))];
    suggestedServices = allSvcs.filter((r) => relatedIds.includes(r.id));
    suggestedServices.sort((a, b) => b.rating - a.rating);
  }

  // ── 5. If services found but no products → pull related products ──
  if (matchedServices.length > 0 && matchedProducts.length === 0) {
    const serviceIds = matchedServices.map(s => s.id);
    matchedProducts = getAllProducts().filter(p => p.relatedServiceIds.some(id => serviceIds.includes(id)));
    matchedProducts.sort((a, b) => b.rating - a.rating);
  }

  // ── 6. Generate dynamic labels if no NL match ──
  if (!needLabel && (matchedProducts.length > 0 || matchedServices.length > 0)) {
    const matchedSegIds = [...new Set(matchedServices.map(s => s.segment))];
    needLabel = generateNeedLabel(matchedSegIds, queryTokens);
  }

  if (!followUp && (matchedProducts.length > 0 || matchedServices.length > 0)) {
    followUp = generateFollowUp(needLabel || 'Sua busca', matchedProducts.length, matchedServices.length);
  }

  return { products: matchedProducts, services: matchedServices, followUp, needLabel, suggestedServices };
}

// Legacy compat
export function semanticSearchLegacy(query: string): { results: typeof mockResults; followUp?: string } {
  const { services, followUp } = semanticSearch(query);
  return { results: services, followUp };
}

// ── Contextual Suggestion System ──
// When the AI can't find direct results, it analyzes the query and suggests
// related services/products by deriving the likely segment.

export interface ContextualSuggestion {
  segment: string;
  segmentLabel: string;
  suggestedServices: { name: string; description: string }[];
  suggestedProducts: { name: string; description: string }[];
  derivedContext: string;
}

/** Map of common terms to segments with service/product suggestions */
const contextualMap: {
  keywords: string[];
  segment: string;
  services: { name: string; description: string }[];
  products: { name: string; description: string }[];
}[] = [
  {
    keywords: ['esgoto', 'encanamento', 'encanador', 'cano', 'tubulação', 'desentupir', 'entupido', 'entupimento', 'ralo', 'fossa', 'sifão', 'pia', 'vaso sanitário', 'descarga', 'vazamento', 'torneira', 'água', 'hidráulico', 'hidraulico', 'bomba d\'água', 'caixa d\'água', 'registro'],
    segment: 'manutencao',
    services: [
      { name: 'Encanador - Reparos Hidráulicos', description: 'Reparos em torneiras, válvulas, canos e conexões' },
      { name: 'Desentupimento de Esgoto', description: 'Desentupimento profissional de tubulações e ralos' },
      { name: 'Troca de Encanamento', description: 'Substituição de canos danificados ou antigos' },
    ],
    products: [
      { name: 'Ácido Desentupidor Líquido 1L', description: 'Desentupidor químico para pias e ralos' },
      { name: 'Kit Vedação p/ Vaso Sanitário', description: 'Anel de vedação e parafusos para vaso' },
      { name: 'Torneira Monocomando Inox', description: 'Torneira de cozinha/banheiro' },
    ],
  },
  {
    keywords: ['telhado', 'goteira', 'infiltração', 'calha', 'telha', 'laje', 'impermeabilização'],
    segment: 'manutencao',
    services: [
      { name: 'Reparo de Telhado', description: 'Troca de telhas quebradas e manutenção' },
      { name: 'Impermeabilização de Laje', description: 'Proteção contra infiltrações' },
      { name: 'Instalação de Calhas', description: 'Calhas e rufos para escoamento de água' },
    ],
    products: [
      { name: 'Manta Asfáltica Impermeabilizante', description: 'Proteção contra infiltrações' },
      { name: 'Telha de Fibrocimento', description: 'Telha resistente para reposição' },
      { name: 'Selante Multiuso 280g', description: 'Vedação de frestas e juntas' },
    ],
  },
  {
    keywords: ['eletricista', 'elétrica', 'eletrica', 'tomada', 'disjuntor', 'fiação', 'curto circuito', 'chuveiro elétrico', 'luz', 'lustre', 'interruptor', 'quadro elétrico', 'instalação elétrica'],
    segment: 'manutencao',
    services: [
      { name: 'Eletricista Residencial', description: 'Instalações e reparos elétricos em geral' },
      { name: 'Troca de Fiação Elétrica', description: 'Substituição de fiação antiga ou danificada' },
      { name: 'Instalação de Tomadas e Interruptores', description: 'Novas tomadas, interruptores e pontos de luz' },
    ],
    products: [
      { name: 'Disjuntor Bipolar 20A', description: 'Disjuntor de proteção para circuitos' },
      { name: 'Fio Elétrico Flexível 2.5mm 100m', description: 'Fio para instalações residenciais' },
      { name: 'Kit Tomadas e Espelhos 10un', description: 'Tomadas e espelhos para acabamento' },
    ],
  },
  {
    keywords: ['pedreiro', 'alvenaria', 'construção', 'construcao', 'reforma', 'muro', 'laje', 'contrapiso', 'piso', 'revestimento', 'azulejo'],
    segment: 'manutencao',
    services: [
      { name: 'Pedreiro - Obras e Reformas', description: 'Construção, reforma e alvenaria em geral' },
      { name: 'Assentamento de Pisos e Azulejos', description: 'Instalação de revestimentos cerâmicos' },
      { name: 'Construção de Muros e Lajes', description: 'Alvenaria estrutural' },
    ],
    products: [
      { name: 'Cimento CP-II 50kg', description: 'Cimento para construção civil' },
      { name: 'Argamassa Colante 20kg', description: 'Para assentamento de pisos e azulejos' },
      { name: 'Tijolo Cerâmico 6 furos (100un)', description: 'Tijolo para alvenaria' },
    ],
  },
  {
    keywords: ['ar condicionado', 'climatização', 'ventilação', 'refrigeração', 'aquecedor', 'ar quente'],
    segment: 'manutencao',
    services: [
      { name: 'Instalação de Ar Condicionado', description: 'Instalação profissional com garantia' },
      { name: 'Manutenção Preventiva de AC', description: 'Limpeza e revisão de split' },
      { name: 'Higienização de Ar Condicionado', description: 'Limpeza profunda do equipamento' },
    ],
    products: [
      { name: 'Filtro para Ar Condicionado', description: 'Filtro de reposição universal' },
      { name: 'Spray Higienizador AC 300ml', description: 'Limpeza bactericida para split' },
      { name: 'Suporte para Condensadora', description: 'Suporte metálico para unidade externa' },
    ],
  },
  {
    keywords: ['pintura', 'pintor', 'parede', 'tinta', 'reboco', 'massa corrida', 'gesso', 'textura', 'gesseiro', 'pintar parede', 'pintar casa'],
    segment: 'manutencao',
    services: [
      { name: 'Pintor Residencial', description: 'Pintura interna e externa de ambientes' },
      { name: 'Aplicação de Textura', description: 'Texturas decorativas em paredes' },
      { name: 'Reparo em Gesso e Reboco', description: 'Correção de fissuras e buracos' },
    ],
    products: [
      { name: 'Tinta Acrílica Premium 18L', description: 'Tinta lavável de alta cobertura' },
      { name: 'Kit Rolo + Bandeja + Pincel', description: 'Kit completo para pintura' },
      { name: 'Massa Corrida PVA 25kg', description: 'Nivelamento de superfícies' },
    ],
  },
  {
    keywords: ['mudança', 'frete', 'carreto', 'transportar', 'transporte', 'caminhão'],
    segment: 'casa',
    services: [
      { name: 'Mudança Residencial', description: 'Transporte de móveis e pertences' },
      { name: 'Frete e Carreto', description: 'Transporte de itens avulsos' },
      { name: 'Montagem/Desmontagem de Móveis', description: 'Montagem profissional' },
    ],
    products: [
      { name: 'Caixa de Papelão Reforçada (5un)', description: 'Para embalar pertences' },
      { name: 'Plástico Bolha Rolo 10m', description: 'Proteção de itens frágeis' },
      { name: 'Fita Adesiva Larga 100m', description: 'Para lacrar caixas' },
    ],
  },
  {
    keywords: ['chaveiro', 'chave', 'fechadura', 'cadeado', 'trancado', 'cofre'],
    segment: 'manutencao',
    services: [
      { name: 'Chaveiro 24h', description: 'Abertura de portas e veículos' },
      { name: 'Troca de Fechadura', description: 'Instalação de novas fechaduras' },
      { name: 'Cópia de Chaves', description: 'Duplicação de chaves residenciais e automotivas' },
    ],
    products: [
      { name: 'Fechadura Digital Biométrica', description: 'Fechadura com senha e digital' },
      { name: 'Cadeado de Alta Segurança', description: 'Cadeado reforçado anti-arrombamento' },
      { name: 'Kit Maçaneta Interna', description: 'Maçaneta com fechadura embutida' },
    ],
  },
  {
    keywords: ['dedetização', 'barata', 'rato', 'formiga', 'cupim', 'mosquito', 'dengue', 'praga', 'inseto'],
    segment: 'casa',
    services: [
      { name: 'Dedetização Residencial', description: 'Controle de pragas profissional' },
      { name: 'Descupinização', description: 'Eliminação de cupins em madeira e alvenaria' },
      { name: 'Controle de Roedores', description: 'Eliminação segura de ratos e ratazanas' },
    ],
    products: [
      { name: 'Inseticida Spray Multiação 500ml', description: 'Elimina baratas, formigas e moscas' },
      { name: 'Armadilha Adesiva para Insetos (5un)', description: 'Captura sem veneno' },
      { name: 'Repelente Ultrassônico Eletrônico', description: 'Afasta insetos e roedores' },
    ],
  },
  {
    keywords: ['segurança', 'alarme', 'cerca elétrica', 'portão', 'interfone', 'câmera', 'vigilância', 'monitoramento'],
    segment: 'tech',
    services: [
      { name: 'Instalação de Cerca Elétrica', description: 'Cerca elétrica perimetral' },
      { name: 'Instalação de Alarme Residencial', description: 'Sistema de alarme com sensores' },
      { name: 'Manutenção de Portão Eletrônico', description: 'Reparo e lubrificação de motores' },
    ],
    products: [
      { name: 'Sensor de Presença Infravermelho', description: 'Detecção de movimento' },
      { name: 'Sirene de Alarme 120dB', description: 'Sirene para sistema de segurança' },
      { name: 'Controle Remoto p/ Portão', description: 'Controle extra para portão eletrônico' },
    ],
  },
  {
    keywords: ['costura', 'costureira', 'roupa ajustar', 'bainha', 'zíper', 'customização'],
    segment: 'moda',
    services: [
      { name: 'Ajuste de Roupas', description: 'Bainha, ajuste de cintura e customizações' },
      { name: 'Costura Sob Medida', description: 'Roupas feitas sob encomenda' },
      { name: 'Conserto de Zíper e Botões', description: 'Reparos rápidos em vestuário' },
    ],
    products: [
      { name: 'Kit Costura Completo', description: 'Linha, agulha, tesoura e acessórios' },
      { name: 'Zíper Universal Kit 10un', description: 'Zíperes de vários tamanhos' },
      { name: 'Botões Sortidos 100un', description: 'Botões de vários modelos e cores' },
    ],
  },
  {
    keywords: ['tatuagem', 'tattoo', 'piercing', 'body piercing', 'tatuador'],
    segment: 'beleza',
    services: [
      { name: 'Tatuagem Artística', description: 'Tatuagem profissional com agendamento' },
      { name: 'Colocação de Piercing', description: 'Piercing seguro e higiênico' },
      { name: 'Cover-up de Tatuagem', description: 'Cobertura de tatuagens antigas' },
    ],
    products: [
      { name: 'Pomada Cicatrizante p/ Tattoo', description: 'Cuidado pós-tatuagem' },
      { name: 'Piercing Cirúrgico Aço Inox', description: 'Piercing hipoalergênico' },
      { name: 'Filme Protetor p/ Tatuagem', description: 'Proteção durante a cicatrização' },
    ],
  },
  {
    keywords: ['acupuntura', 'quiropraxia', 'osteopatia', 'reflexologia', 'terapia alternativa', 'reiki', 'homeopatia'],
    segment: 'bem_estar',
    services: [
      { name: 'Sessão de Acupuntura', description: 'Tratamento com agulhas terapêuticas' },
      { name: 'Quiropraxia - Ajuste Postural', description: 'Alinhamento da coluna e articulações' },
      { name: 'Reflexologia Podal', description: 'Massagem terapêutica nos pés' },
    ],
    products: [
      { name: 'Tapete de Acupressão', description: 'Estimulação de pontos de pressão' },
      { name: 'Óleo Essencial Terapêutico Mix', description: 'Blend para relaxamento profundo' },
      { name: 'Almofada Ortopédica Cervical', description: 'Apoio para postura cervical' },
    ],
  },
  {
    keywords: ['fotografia', 'ensaio fotográfico', 'book', 'filmagem', 'vídeo casamento'],
    segment: 'digital',
    services: [
      { name: 'Ensaio Fotográfico', description: 'Sessão profissional de fotos' },
      { name: 'Filmagem de Eventos', description: 'Cobertura completa em vídeo' },
      { name: 'Edição de Fotos e Vídeos', description: 'Tratamento e montagem profissional' },
    ],
    products: [
      { name: 'Álbum de Fotos Premium 20x30', description: 'Álbum encadernado com capa dura' },
      { name: 'Pendrive com Fotos HD', description: 'Entrega digital em pen drive personalizado' },
      { name: 'Quadro Canvas Personalizado', description: 'Impressão em tela de algodão' },
    ],
  },
];

/**
 * Generate contextual suggestions when no direct results are found.
 * Analyzes the query to derive the segment and suggest related services/products.
 */
export function generateContextualSuggestions(query: string): ContextualSuggestion | null {
  const q = normalize(query);
  const tokens = tokenize(query);

  // Score each contextualMap entry — pick the BEST match, not the first
  let bestEntry: typeof contextualMap[0] | null = null;
  let bestScore = 0;

  for (const entry of contextualMap) {
    let score = 0;
    for (const kw of entry.keywords) {
      const nkw = normalize(kw);
      // Exact match (query equals keyword)
      if (q === nkw) { score += 100; continue; }
      // Query contains keyword entirely
      if (q.includes(nkw)) { score += nkw.length * 3; continue; }
      // Keyword contains query entirely (e.g. "encanador" in "encanamento" — but not partial 3-char)
      if (nkw.includes(q) && q.length >= 4) { score += q.length * 2; continue; }
      // Token-level matching — require tokens >= 4 chars for precision
      for (const t of tokens) {
        if (t.length < 4) continue;
        if (nkw === t) { score += t.length * 3; }
        else if (nkw.includes(t) && t.length >= 5) { score += t.length; }
        else if (t.includes(nkw) && nkw.length >= 5) { score += nkw.length; }
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestEntry = entry;
    }
  }

  if (bestEntry && bestScore >= 4) {
    const seg = segments.find(s => s.id === bestEntry!.segment);
    return {
      segment: bestEntry.segment,
      segmentLabel: seg?.label || bestEntry.segment,
      suggestedServices: bestEntry.services,
      suggestedProducts: bestEntry.products,
      derivedContext: `Analisei sua pesquisa por "${query}" e identifiquei que você precisa de um profissional da área de **${seg?.label || bestEntry.segment}**.`,
    };
  }

  // Fallback: match against segment keywords with scoring
  let bestSeg: typeof segments[0] | null = null;
  let bestSegScore = 0;

  for (const seg of segments) {
    let score = 0;
    for (const kw of seg.keywords) {
      const nkw = normalize(kw);
      if (q === nkw) { score += 100; continue; }
      if (q.includes(nkw)) { score += nkw.length * 3; continue; }
      if (nkw.includes(q) && q.length >= 4) { score += q.length * 2; continue; }
      for (const t of tokens) {
        if (t.length < 4) continue;
        if (nkw === t) { score += t.length * 3; }
        else if (nkw.includes(t) && t.length >= 5) { score += t.length; }
      }
    }
    if (score > bestSegScore) {
      bestSegScore = score;
      bestSeg = seg;
    }
  }

  if (bestSeg && bestSegScore >= 4) {
    // Generate specific suggestions based on the matched keyword
    const matchedKw = bestSeg.keywords.find(kw => {
      const nkw = normalize(kw);
      return q === nkw || q.includes(nkw) || (nkw.includes(q) && q.length >= 4);
    }) || tokens.find(t => t.length >= 3) || query.trim();
    const capKw = matchedKw.charAt(0).toUpperCase() + matchedKw.slice(1);
    
    return {
      segment: bestSeg.id,
      segmentLabel: bestSeg.label,
      suggestedServices: [
        { name: `${capKw} - Atendimento Profissional`, description: `Profissional especializado em ${matchedKw.toLowerCase()}` },
        { name: `${capKw} - Serviço Completo`, description: `Pacote completo com avaliação e execução` },
        { name: `Consultoria em ${capKw}`, description: `Análise e orientação especializada` },
      ],
      suggestedProducts: [
        { name: `Kit ${capKw} Essencial`, description: `Produtos básicos para ${matchedKw.toLowerCase()}` },
        { name: `Material Profissional ${capKw}`, description: `Produto de alta qualidade` },
        { name: `Acessório para ${capKw}`, description: `Complemento para o serviço` },
      ],
      derivedContext: `Analisei sua pesquisa por "${query}" e identifiquei que você precisa de um profissional da área de **${bestSeg.label}** — especificamente **${capKw}**.`,
    };
  }

  // Generic fallback: derive from query itself
  const mainWord = tokens.find(t => t.length >= 3) || query.trim();
  const capitalizedWord = mainWord.charAt(0).toUpperCase() + mainWord.slice(1);
  return {
    segment: 'manutencao',
    segmentLabel: capitalizedWord,
    suggestedServices: [
      { name: `Serviço de ${capitalizedWord}`, description: `Profissional especializado em ${capitalizedWord.toLowerCase()}` },
      { name: `Manutenção de ${capitalizedWord}`, description: `Reparo e manutenção relacionada` },
      { name: `Instalação / ${capitalizedWord}`, description: `Instalação profissional com garantia` },
    ],
    suggestedProducts: [
      { name: `Kit ${capitalizedWord} Básico`, description: `Produtos essenciais relacionados` },
      { name: `Produto para ${capitalizedWord}`, description: `Produto profissional` },
      { name: `Acessório ${capitalizedWord}`, description: `Complemento útil` },
    ],
    derivedContext: `Analisei sua pesquisa por "${query}" e preparei sugestões de serviços e produtos que podem atender sua necessidade.`,
  };
}

// ── Dynamic Entry System (persisted to Supabase) ──
import { supabase } from '@/integrations/supabase/client';

export interface DynamicEntry {
  type: 'service' | 'product';
  service?: typeof mockResults[0];
  products?: ProductItem[];
  maxPerSegment?: number;
}

// In-memory cache (loaded from DB on init)
let dynamicServices: typeof mockResults = [];
let dynamicProducts: ProductItem[] = [];
let _loaded = false;

/** Load dynamic entries from database into memory cache */
export async function loadDynamicEntries(): Promise<void> {
  if (_loaded) return;
  try {
    const [svcRes, prodRes] = await Promise.all([
      supabase.from('dynamic_services').select('*').order('created_at', { ascending: true }),
      supabase.from('dynamic_products').select('*').order('created_at', { ascending: true }),
    ]);
    if (svcRes.data) {
      dynamicServices = svcRes.data.map((row: any) => ({
        id: row.service_id,
        name: row.name,
        segment: row.segment,
        provider: row.provider,
        price: Number(row.price),
        rating: Number(row.rating),
        distance: row.distance,
        time: row.time,
        products: row.products || [],
      }));
    }
    if (prodRes.data) {
      dynamicProducts = prodRes.data.map((row: any) => ({
        id: row.product_id,
        name: row.name,
        price: Number(row.price),
        provider: row.provider,
        stockType: row.stock_type as StockType,
        rating: Number(row.rating),
        distance: row.distance,
        relatedServiceIds: row.related_service_ids || [],
        tags: row.tags || [],
      }));
    }
    _loaded = true;
  } catch (e) {
    console.error('Failed to load dynamic entries:', e);
  }
}

/**
 * Add dynamic entries from the Support Center demo.
 * Persists to Supabase and applies 1:1 replacement rule.
 */
export async function addDynamicEntries(entries: DynamicEntry[]): Promise<void> {
  for (const entry of entries) {
    if (entry.service) {
      const max = entry.maxPerSegment || 5;
      const segment = entry.service.segment;
      const inSegment = dynamicServices.filter(s => s.segment === segment);

      // 1:1 replacement: remove oldest dynamic entry in segment if over limit
      if (inSegment.length >= max) {
        const oldest = dynamicServices.find(s => s.segment === segment);
        if (oldest) {
          await supabase.from('dynamic_services').delete().eq('service_id', oldest.id);
          // Also remove related products
          await supabase.from('dynamic_products').delete().eq('provider', oldest.provider);
          dynamicServices = dynamicServices.filter(s => s.id !== oldest.id);
          dynamicProducts = dynamicProducts.filter(p => p.provider !== oldest.provider);
        }
      }

      // Insert new service
      await supabase.from('dynamic_services').insert({
        service_id: entry.service.id,
        name: entry.service.name,
        segment: entry.service.segment,
        provider: entry.service.provider,
        price: entry.service.price,
        rating: entry.service.rating,
        distance: entry.service.distance,
        time: entry.service.time,
        products: entry.service.products,
      });
      dynamicServices.push(entry.service);
    }
    if (entry.products) {
      for (const product of entry.products) {
        if (dynamicProducts.length > 20) {
          const removed = dynamicProducts.shift();
          if (removed) {
            await supabase.from('dynamic_products').delete().eq('product_id', removed.id);
          }
        }
        await supabase.from('dynamic_products').insert({
          product_id: product.id,
          name: product.name,
          price: product.price,
          provider: product.provider,
          stock_type: product.stockType,
          rating: product.rating,
          distance: product.distance,
          related_service_ids: product.relatedServiceIds,
          tags: product.tags,
        });
        dynamicProducts.push(product);
      }
    }
  }
}

/** Get all services — only from database (dynamic entries) */
export function getAllServices(): typeof mockResults {
  return [...dynamicServices];
}

/** Get all products — only from database (dynamic entries) */
export function getAllProducts(): ProductItem[] {
  return [...dynamicProducts];
}

/**
 * Build a structured summary from conversation context for the Support Center.
 */
export function buildSupportSummary(messages: { role: string; text: string }[], query: string): string {
  const userMsgs = messages.filter(m => m.role === 'user').map(m => m.text);
  if (userMsgs.length === 0) return `Cliente buscou: "${query}". Nenhum resultado encontrado no hub.`;
  return `Conversa do cliente:\n${userMsgs.map((m, i) => `${i + 1}. "${m}"`).join('\n')}\n\nNecessidade identificada: "${query}"\nStatus: Sem resultados no hub atual.`;
}
