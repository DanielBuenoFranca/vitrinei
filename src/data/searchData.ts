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

export const naturalLanguageMap: { triggers: string[]; segments: string[]; keywords: string[]; aiFollowUp?: string }[] = [
  { triggers: ['dor de barriga', 'dor de estômago', 'dor abdominal', 'mal estar', 'enjoo', 'náusea', 'azia', 'gastrite', 'indigestão'], segments: ['natureza', 'saude_clinica'], keywords: ['fitoterapia', 'fitoterápico', 'chá', 'plantas medicinais', 'clínico', 'consulta', 'remédio'], aiFollowUp: 'Entendi que você está com desconforto abdominal. Vou buscar fitoterápicos e profissionais de saúde para te ajudar!' },
  { triggers: ['dor de cabeça', 'enxaqueca', 'cefaleia', 'dor no corpo', 'febre', 'gripe', 'resfriado'], segments: ['natureza', 'saude_clinica'], keywords: ['fitoterapia', 'aromaterapia', 'consulta', 'clínico', 'chá', 'remédio'], aiFollowUp: 'Vou buscar remédios e profissionais para aliviar sua dor.' },
  { triggers: ['insônia', 'não consigo dormir', 'ansiedade', 'estresse', 'nervoso', 'cansaço'], segments: ['natureza', 'bem_estar'], keywords: ['aromaterapia', 'fitoterapia', 'floral', 'massagem', 'yoga', 'meditação'] },
  { triggers: ['alergia', 'coceira', 'irritação na pele', 'dermatite'], segments: ['natureza', 'saude_clinica'], keywords: ['fitoterapia', 'plantas medicinais', 'consulta', 'remédio'] },
  { triggers: ['remédio', 'remedio', 'medicamento', 'preciso de remédio', 'farmácia', 'farmacia'], segments: ['natureza', 'saude_clinica'], keywords: ['fitoterapia', 'fitoterápico', 'chá', 'consulta', 'clínico', 'remédio'], aiFollowUp: 'Você precisa de um remédio! Pode me dizer onde está doendo ou qual o sintoma? Enquanto isso, vou listar opções fitoterápicas e profissionais de saúde.' },
  { triggers: ['machuquei o pé', 'machuquei', 'torci o pé', 'torção', 'dor no pé', 'pé inchado', 'dor no tornozelo', 'entorse'], segments: ['saude_clinica', 'natureza'], keywords: ['consulta', 'clínico', 'fisioterapia', 'fitoterapia', 'anti-inflamatório', 'remédio'], aiFollowUp: 'Parece que você se machucou! Vou buscar profissionais de saúde e produtos para aliviar a dor e inflamação.' },
  { triggers: ['dor nas costas', 'dor lombar', 'coluna', 'dor muscular', 'câimbra', 'contratura'], segments: ['saude_clinica', 'bem_estar', 'natureza'], keywords: ['fisioterapia', 'massagem', 'consulta', 'fitoterapia', 'anti-inflamatório'] },
  { triggers: ['dor de dente', 'dente doendo', 'gengiva', 'dor na boca'], segments: ['saude_clinica'], keywords: ['dentista', 'consulta', 'remédio'] },
  { triggers: ['tosse', 'garganta inflamada', 'dor de garganta', 'rouquidão'], segments: ['natureza', 'saude_clinica'], keywords: ['chá', 'mel', 'fitoterapia', 'consulta', 'remédio'], aiFollowUp: 'Vou buscar chás, fitoterápicos e profissionais para cuidar da sua garganta!' },
  { triggers: ['blusa', 'camiseta', 'camisa', 'regata', 'top', 'cropped', 'moletom', 'jaqueta', 'casaco', 'blazer', 'suéter'], segments: ['moda', 'vestuario'], keywords: ['blusa', 'camiseta', 'camisa', 'roupa', 'moda', 'vestuário'], aiFollowUp: 'Buscando profissionais com essa peça em estoque para você!' },
  { triggers: ['calça', 'calça jeans', 'legging', 'bermuda', 'short', 'saia', 'shorts'], segments: ['moda', 'vestuario'], keywords: ['calça', 'jeans', 'legging', 'bermuda', 'saia', 'roupa', 'moda'] },
  { triggers: ['vestido', 'macacão', 'conjunto', 'roupa', 'look', 'outfit', 'moda'], segments: ['moda', 'vestuario'], keywords: ['vestido', 'roupa', 'moda', 'vestuário', 'look'] },
  { triggers: ['sapato', 'tênis', 'sandália', 'bota', 'chinelo', 'salto', 'calçado'], segments: ['moda', 'vestuario'], keywords: ['sapato', 'tênis', 'sandália', 'calçado', 'moda'] },
  { triggers: ['jóia', 'joia', 'anel', 'aliança', 'brinco', 'colar', 'pulseira', 'corrente', 'pingente', 'cordão'], segments: ['acessorios', 'moda'], keywords: ['jóia', 'anel', 'brinco', 'colar', 'pulseira', 'ouro', 'prata', 'bijuteria'] },
  { triggers: ['relógio', 'óculos', 'bolsa', 'carteira', 'cinto', 'chapéu', 'boné', 'lenço', 'cachecol', 'gravata'], segments: ['acessorios', 'moda'], keywords: ['relógio', 'óculos', 'bolsa', 'acessório', 'moda'] },
  { triggers: ['bijuteria', 'piercing', 'adereço', 'broche', 'presilha', 'tiara', 'faixa de cabelo'], segments: ['acessorios', 'moda'], keywords: ['bijuteria', 'acessório', 'adereço', 'moda'] },
  { triggers: ['cortar grama', 'grama alta', 'capinar', 'jardim sujo', 'podar', 'mato alto', 'limpar jardim', 'quintal sujo', 'aparar grama'], segments: ['natureza', 'casa'], keywords: ['jardinagem', 'jardineiro', 'poda', 'grama', 'paisagismo'] },
  { triggers: ['plantar', 'horta', 'vaso', 'muda', 'semente', 'adubo', 'terra', 'fertilizante'], segments: ['natureza'], keywords: ['horta', 'jardinagem', 'sementes', 'orgânico', 'permacultura'] },
  { triggers: ['carro não liga', 'carro falhando', 'barulho no carro', 'freio ruim', 'pneu furado'], segments: ['auto'], keywords: ['mecânico', 'guincho', 'pneu', 'auto'] },
  { triggers: ['lavar carro', 'carro sujo', 'polir carro'], segments: ['auto'], keywords: ['lavagem', 'polimento', 'auto'] },
  { triggers: ['casa suja', 'preciso limpar', 'faxina', 'limpeza pesada', 'vidros sujos'], segments: ['casa'], keywords: ['limpeza', 'faxina', 'casa'] },
  { triggers: ['torneira vazando', 'cano furado', 'entupiu', 'vaso entupido', 'descarga quebrou'], segments: ['manutencao'], keywords: ['encanador', 'reparo', 'manutenção'] },
  { triggers: ['tomada não funciona', 'luz apagou', 'curto circuito', 'chuveiro queimou', 'fiação'], segments: ['manutencao'], keywords: ['eletricista', 'instalação', 'manutenção'] },
  { triggers: ['cabelo feio', 'preciso cortar cabelo', 'tintura', 'pintar cabelo'], segments: ['beleza'], keywords: ['cabelo', 'corte', 'barbeiro'] },
  { triggers: ['unha quebrou', 'fazer unha', 'pé e mão'], segments: ['beleza'], keywords: ['manicure', 'estética'] },
  { triggers: ['meu cachorro', 'meu gato', 'meu pet', 'animal doente', 'vacina pet', 'pulga', 'carrapato'], segments: ['pet'], keywords: ['veterinário', 'pet', 'banho', 'tosa'] },
  { triggers: ['aprender inglês', 'aula particular', 'reforço escolar', 'estudar para concurso'], segments: ['educacao'], keywords: ['professor', 'aula', 'inglês', 'concurso'] },
  { triggers: ['aprender violão', 'aprender guitarra', 'aula de piano', 'aprender música', 'tocar bateria'], segments: ['musica'], keywords: ['violão', 'guitarra', 'piano', 'bateria', 'aula de música'] },
  { triggers: ['computador lento', 'pc travando', 'vírus no pc', 'celular quebrou', 'tela quebrada'], segments: ['tech'], keywords: ['formatação', 'computador', 'celular', 'conserto'] },
  { triggers: ['festa de aniversário', 'casamento', 'organizar festa', 'buffet', 'precisamos de dj'], segments: ['eventos'], keywords: ['festa', 'buffet', 'dj', 'casamento', 'decoração'] },
];

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

/** Search mockResults using the semantic engine */
export function semanticSearch(query: string): { results: typeof mockResults; followUp?: string } {
  const q = query.toLowerCase().trim();
  if (!q) return { results: [] };

  const matched = naturalLanguageMap.filter((nlm) =>
    nlm.triggers.some((t) => q.includes(t) || t.includes(q))
  );

  const nlSegments = matched.flatMap((m) => m.segments);
  const nlKeywords = matched.flatMap((m) => m.keywords);
  const followUp = matched.find((m) => m.aiFollowUp)?.aiFollowUp;

  const results = mockResults.filter((r) => {
    const directMatch = r.name.toLowerCase().includes(q) || r.provider.toLowerCase().includes(q);
    if (directMatch) return true;

    const segmentKeywordMatch = segments.find((s) => s.id === r.segment)?.keywords.some((k) => k.includes(q) || q.includes(k));
    if (segmentKeywordMatch) return true;

    if (matched.length > 0) {
      const inNLSegment = nlSegments.includes(r.segment);
      const hasNLKeyword = nlKeywords.some((kw) =>
        r.name.toLowerCase().includes(kw) ||
        r.products.some((p) => p.toLowerCase().includes(kw)) ||
        segments.find((s) => s.id === r.segment)?.keywords.some((sk) => sk.includes(kw))
      );
      if (inNLSegment || hasNLKeyword) return true;
    }

    const productMatch = r.products.some((p) => p.toLowerCase().includes(q) || q.includes(p.toLowerCase()));
    if (productMatch) return true;

    return false;
  });

  // Sort by rating desc then distance
  results.sort((a, b) => b.rating - a.rating);

  return { results, followUp };
}
