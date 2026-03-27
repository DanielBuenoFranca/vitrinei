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
    aiFollowUp: 'Encontrei opções de peças para você! Veja o estoque disponível:'
  },
  {
    triggers: ['calça', 'calça jeans', 'legging', 'bermuda', 'short', 'saia', 'shorts'],
    segments: ['moda', 'vestuario'], keywords: ['calça', 'jeans', 'legging', 'bermuda', 'roupa'],
    relevantServiceIds: [40],
  },
  {
    triggers: ['vestido', 'macacão', 'conjunto', 'roupa', 'look', 'outfit', 'moda'],
    segments: ['moda', 'vestuario'], keywords: ['vestido', 'roupa', 'moda', 'look'],
    relevantServiceIds: [41],
  },
  {
    triggers: ['sapato', 'tênis', 'sandália', 'bota', 'chinelo', 'salto', 'calçado'],
    segments: ['moda', 'vestuario'], keywords: ['sapato', 'tênis', 'sandália', 'calçado'],
    relevantServiceIds: [42],
  },
  {
    triggers: ['jóia', 'joia', 'anel', 'aliança', 'brinco', 'colar', 'pulseira', 'corrente', 'pingente', 'cordão'],
    segments: ['acessorios', 'moda'], keywords: ['jóia', 'anel', 'brinco', 'colar', 'pulseira'],
    relevantServiceIds: [44],
  },
  {
    triggers: ['relógio', 'óculos', 'bolsa', 'carteira', 'cinto', 'chapéu', 'boné', 'lenço', 'cachecol', 'gravata'],
    segments: ['acessorios', 'moda'], keywords: ['relógio', 'óculos', 'bolsa', 'acessório'],
    relevantServiceIds: [46, 47],
  },
  {
    triggers: ['bijuteria', 'piercing', 'adereço', 'broche', 'presilha', 'tiara', 'faixa de cabelo'],
    segments: ['acessorios', 'moda'], keywords: ['bijuteria', 'acessório'],
    relevantServiceIds: [45],
  },
  {
    triggers: ['cortar grama', 'grama alta', 'capinar', 'jardim sujo', 'podar', 'mato alto', 'limpar jardim', 'quintal sujo', 'aparar grama'],
    segments: ['natureza', 'casa'], keywords: ['jardinagem', 'jardineiro', 'poda', 'grama'],
    relevantServiceIds: [29, 30],
  },
  {
    triggers: ['plantar', 'horta', 'vaso', 'muda', 'semente', 'adubo', 'terra', 'fertilizante'],
    segments: ['natureza'], keywords: ['horta', 'jardinagem', 'sementes'],
    relevantServiceIds: [26],
  },
  {
    triggers: ['carro não liga', 'carro falhando', 'barulho no carro', 'freio ruim', 'pneu furado'],
    segments: ['auto'], keywords: ['mecânico', 'guincho', 'pneu'],
    relevantServiceIds: [33, 11],
  },
  {
    triggers: ['lavar carro', 'carro sujo', 'polir carro'],
    segments: ['auto'], keywords: ['lavagem', 'polimento'],
    relevantServiceIds: [12],
  },
  {
    triggers: ['casa suja', 'preciso limpar', 'faxina', 'limpeza pesada', 'vidros sujos'],
    segments: ['casa'], keywords: ['limpeza', 'faxina'],
    relevantServiceIds: [10],
  },
  {
    triggers: ['torneira vazando', 'cano furado', 'entupiu', 'vaso entupido', 'descarga quebrou'],
    segments: ['manutencao'], keywords: ['encanador', 'reparo'],
    relevantServiceIds: [32],
  },
  {
    triggers: ['tomada não funciona', 'luz apagou', 'curto circuito', 'chuveiro queimou', 'fiação'],
    segments: ['manutencao'], keywords: ['eletricista', 'instalação'],
    relevantServiceIds: [1],
  },
  {
    triggers: ['cabelo feio', 'preciso cortar cabelo', 'tintura', 'pintar cabelo'],
    segments: ['beleza'], keywords: ['cabelo', 'corte', 'barbeiro'],
    relevantServiceIds: [8],
  },
  {
    triggers: ['unha quebrou', 'fazer unha', 'pé e mão'],
    segments: ['beleza'], keywords: ['manicure', 'estética'],
    relevantServiceIds: [35],
  },
  {
    triggers: ['meu cachorro', 'meu gato', 'meu pet', 'animal doente', 'vacina pet', 'pulga', 'carrapato'],
    segments: ['pet'], keywords: ['veterinário', 'pet', 'banho', 'tosa'],
    relevantServiceIds: [18, 19, 36],
  },
  {
    triggers: ['aprender inglês', 'aula particular', 'reforço escolar', 'estudar para concurso'],
    segments: ['educacao'], keywords: ['professor', 'aula', 'inglês'],
    relevantServiceIds: [16, 17],
  },
  {
    triggers: ['aprender violão', 'aprender guitarra', 'aula de piano', 'aprender música', 'tocar bateria'],
    segments: ['musica'], keywords: ['violão', 'guitarra', 'piano', 'bateria'],
    relevantServiceIds: [23, 24, 25, 37],
  },
  {
    triggers: ['computador lento', 'pc travando', 'vírus no pc', 'celular quebrou', 'tela quebrada'],
    segments: ['tech'], keywords: ['formatação', 'computador', 'celular'],
    relevantServiceIds: [14, 15],
  },
  {
    triggers: ['festa de aniversário', 'casamento', 'organizar festa', 'buffet', 'precisamos de dj'],
    segments: ['eventos'], keywords: ['festa', 'buffet', 'dj', 'casamento'],
    relevantServiceIds: [20, 21],
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
  suggestedServices?: typeof mockResults; // AI-suggested services when only products match
}

export function semanticSearch(query: string): SearchResult {
  const q = query.toLowerCase().trim();
  if (!q) return { products: [], services: [] };

  // 1. Match NL triggers
  const matched = naturalLanguageMap.filter((nlm) =>
    nlm.triggers.some((t) => q.includes(t) || t.includes(q))
  );

  const followUp = matched.find((m) => m.aiFollowUp)?.aiFollowUp;
  const needLabel = matched.find((m) => m.needLabel)?.needLabel;

  // 2. Find relevant PRODUCTS via tags + NL mapping
  let matchedProducts: ProductItem[] = [];
  if (matched.length > 0) {
    const nlProductIds = matched.flatMap((m) => m.relevantProductIds || []);
    // Products from NL mapping
    const fromNL = productInventory.filter((p) => nlProductIds.includes(p.id));
    // Products matching tags
    const fromTags = productInventory.filter((p) =>
      !nlProductIds.includes(p.id) &&
      p.tags.some((tag) => q.includes(tag) || tag.includes(q) || matched.some(m => m.triggers.some(t => tag.includes(t.split(' ')[0]))))
    );
    matchedProducts = [...fromNL, ...fromTags];
  } else {
    // Direct product search by name/tags
    matchedProducts = productInventory.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      p.tags.some((tag) => q.includes(tag) || tag.includes(q))
    );
  }

  // Remove duplicates
  matchedProducts = [...new Map(matchedProducts.map(p => [p.id, p])).values()];
  matchedProducts.sort((a, b) => b.rating - a.rating);

  // 3. Find relevant SERVICES
  let matchedServices: typeof mockResults = [];
  if (matched.length > 0) {
    const nlServiceIds = matched.flatMap((m) => m.relevantServiceIds || []);
    if (nlServiceIds.length > 0) {
      // Use specific service IDs from NL map — precision over broad segment
      matchedServices = mockResults.filter((r) => nlServiceIds.includes(r.id));
    } else {
      // Fallback to segment match only if no specific IDs
      const nlSegments = matched.flatMap((m) => m.segments);
      matchedServices = mockResults.filter((r) => nlSegments.includes(r.segment));
    }
  } else {
    // Direct search: name, provider, products, segment keywords
    matchedServices = mockResults.filter((r) => {
      if (r.name.toLowerCase().includes(q) || r.provider.toLowerCase().includes(q)) return true;
      if (r.products.some((p) => p.toLowerCase().includes(q))) return true;
      const seg = segments.find((s) => s.id === r.segment);
      if (seg?.keywords.some((k) => k.includes(q) || q.includes(k))) return true;
      return false;
    });
  }

  matchedServices.sort((a, b) => b.rating - a.rating);

  // 4. Cross-suggestion: if only products found, suggest related services
  let suggestedServices: typeof mockResults = [];
  if (matchedProducts.length > 0 && matchedServices.length === 0) {
    const relatedIds = [...new Set(matchedProducts.flatMap((p) => p.relatedServiceIds))];
    suggestedServices = mockResults.filter((r) => relatedIds.includes(r.id));
    suggestedServices.sort((a, b) => b.rating - a.rating);
  }

  // 5. If only services found, suggest products from those services
  if (matchedServices.length > 0 && matchedProducts.length === 0) {
    const serviceIds = matchedServices.map(s => s.id);
    matchedProducts = productInventory.filter(p => p.relatedServiceIds.some(id => serviceIds.includes(id)));
    matchedProducts.sort((a, b) => b.rating - a.rating);
  }

  return { products: matchedProducts, services: matchedServices, followUp, needLabel, suggestedServices };
}

// Legacy compat: returns combined results in old format
export function semanticSearchLegacy(query: string): { results: typeof mockResults; followUp?: string } {
  const { services, followUp } = semanticSearch(query);
  return { results: services, followUp };
}
