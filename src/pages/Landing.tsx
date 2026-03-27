import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ArrowRight, Zap, Sparkles, Clock, MapPin, DollarSign,
  Wrench, Heart, Scissors, Home, Car, Monitor, Headphones,
  ShoppingCart, BarChart3, ChevronRight, Send, Star,
  Package, TrendingDown, Navigation, Users, Shield, MessageCircle,
  Stethoscope, GraduationCap, PawPrint, PartyPopper, Cpu, Leaf
} from 'lucide-react';
import { AiAvatar } from '@/components/AiAvatarGlobal';

const segments = [
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

// ── Mapeamento semântico: expressões naturais → segmentos + keywords ──
const naturalLanguageMap: { triggers: string[]; segments: string[]; keywords: string[]; aiFollowUp?: string }[] = [
  // ── Saúde / Fitoterapia / Dor ──
  { triggers: ['dor de barriga', 'dor de estômago', 'dor abdominal', 'mal estar', 'enjoo', 'náusea', 'azia', 'gastrite', 'indigestão'], segments: ['natureza', 'saude_clinica'], keywords: ['fitoterapia', 'fitoterápico', 'chá', 'plantas medicinais', 'clínico', 'consulta', 'remédio'], aiFollowUp: 'Entendi que você está com desconforto abdominal. Vou buscar fitoterápicos e profissionais de saúde para te ajudar!' },
  { triggers: ['dor de cabeça', 'enxaqueca', 'cefaleia', 'dor no corpo', 'febre', 'gripe', 'resfriado'], segments: ['natureza', 'saude_clinica'], keywords: ['fitoterapia', 'aromaterapia', 'consulta', 'clínico', 'chá', 'remédio'], aiFollowUp: 'Vou buscar remédios e profissionais para aliviar sua dor.' },
  { triggers: ['insônia', 'não consigo dormir', 'ansiedade', 'estresse', 'nervoso', 'cansaço'], segments: ['natureza', 'bem_estar'], keywords: ['aromaterapia', 'fitoterapia', 'floral', 'massagem', 'yoga', 'meditação'] },
  { triggers: ['alergia', 'coceira', 'irritação na pele', 'dermatite'], segments: ['natureza', 'saude_clinica'], keywords: ['fitoterapia', 'plantas medicinais', 'consulta', 'remédio'] },
  // Remédios / Medicamentos / Dores genéricas
  { triggers: ['remédio', 'remedio', 'medicamento', 'preciso de remédio', 'farmácia', 'farmacia'], segments: ['natureza', 'saude_clinica'], keywords: ['fitoterapia', 'fitoterápico', 'chá', 'consulta', 'clínico', 'remédio'], aiFollowUp: 'Você precisa de um remédio! Pode me dizer onde está doendo ou qual o sintoma? Enquanto isso, vou listar opções fitoterápicas e profissionais de saúde.' },
  { triggers: ['machuquei o pé', 'machuquei', 'torci o pé', 'torção', 'dor no pé', 'pé inchado', 'dor no tornozelo', 'entorse'], segments: ['saude_clinica', 'natureza'], keywords: ['consulta', 'clínico', 'fisioterapia', 'fitoterapia', 'anti-inflamatório', 'remédio'], aiFollowUp: 'Parece que você se machucou! Vou buscar profissionais de saúde e produtos para aliviar a dor e inflamação.' },
  { triggers: ['dor nas costas', 'dor lombar', 'coluna', 'dor muscular', 'câimbra', 'contratura'], segments: ['saude_clinica', 'bem_estar', 'natureza'], keywords: ['fisioterapia', 'massagem', 'consulta', 'fitoterapia', 'anti-inflamatório'] },
  { triggers: ['dor de dente', 'dente doendo', 'gengiva', 'dor na boca'], segments: ['saude_clinica'], keywords: ['dentista', 'consulta', 'remédio'] },
  { triggers: ['tosse', 'garganta inflamada', 'dor de garganta', 'rouquidão'], segments: ['natureza', 'saude_clinica'], keywords: ['chá', 'mel', 'fitoterapia', 'consulta', 'remédio'], aiFollowUp: 'Vou buscar chás, fitoterápicos e profissionais para cuidar da sua garganta!' },
  // ── Vestuário / Roupas / Moda ──
  { triggers: ['blusa', 'camiseta', 'camisa', 'regata', 'top', 'cropped', 'moletom', 'jaqueta', 'casaco', 'blazer', 'suéter'], segments: ['moda', 'vestuario'], keywords: ['blusa', 'camiseta', 'camisa', 'roupa', 'moda', 'vestuário'], aiFollowUp: 'Buscando profissionais com essa peça em estoque para você!' },
  { triggers: ['calça', 'calça jeans', 'legging', 'bermuda', 'short', 'saia', 'shorts'], segments: ['moda', 'vestuario'], keywords: ['calça', 'jeans', 'legging', 'bermuda', 'saia', 'roupa', 'moda'] },
  { triggers: ['vestido', 'macacão', 'conjunto', 'roupa', 'look', 'outfit', 'moda'], segments: ['moda', 'vestuario'], keywords: ['vestido', 'roupa', 'moda', 'vestuário', 'look'] },
  { triggers: ['sapato', 'tênis', 'sandália', 'bota', 'chinelo', 'salto', 'calçado'], segments: ['moda', 'vestuario'], keywords: ['sapato', 'tênis', 'sandália', 'calçado', 'moda'] },
  // ── Jóias / Acessórios / Adereços ──
  { triggers: ['jóia', 'joia', 'anel', 'aliança', 'brinco', 'colar', 'pulseira', 'corrente', 'pingente', 'cordão'], segments: ['acessorios', 'moda'], keywords: ['jóia', 'anel', 'brinco', 'colar', 'pulseira', 'ouro', 'prata', 'bijuteria'] },
  { triggers: ['relógio', 'óculos', 'bolsa', 'carteira', 'cinto', 'chapéu', 'boné', 'lenço', 'cachecol', 'gravata'], segments: ['acessorios', 'moda'], keywords: ['relógio', 'óculos', 'bolsa', 'acessório', 'moda'] },
  { triggers: ['bijuteria', 'piercing', 'adereço', 'broche', 'presilha', 'tiara', 'faixa de cabelo'], segments: ['acessorios', 'moda'], keywords: ['bijuteria', 'acessório', 'adereço', 'moda'] },
  // ── Jardinagem / Grama / Plantas ──
  { triggers: ['cortar grama', 'grama alta', 'capinar', 'jardim sujo', 'podar', 'mato alto', 'limpar jardim', 'quintal sujo', 'aparar grama'], segments: ['natureza', 'casa'], keywords: ['jardinagem', 'jardineiro', 'poda', 'grama', 'paisagismo'] },
  { triggers: ['plantar', 'horta', 'vaso', 'muda', 'semente', 'adubo', 'terra', 'fertilizante'], segments: ['natureza'], keywords: ['horta', 'jardinagem', 'sementes', 'orgânico', 'permacultura'] },
  // Automotivo
  { triggers: ['carro não liga', 'carro falhando', 'barulho no carro', 'freio ruim', 'pneu furado'], segments: ['auto'], keywords: ['mecânico', 'guincho', 'pneu', 'auto'] },
  { triggers: ['lavar carro', 'carro sujo', 'polir carro'], segments: ['auto'], keywords: ['lavagem', 'polimento', 'auto'] },
  // Casa / Limpeza
  { triggers: ['casa suja', 'preciso limpar', 'faxina', 'limpeza pesada', 'vidros sujos'], segments: ['casa'], keywords: ['limpeza', 'faxina', 'casa'] },
  { triggers: ['torneira vazando', 'cano furado', 'entupiu', 'vaso entupido', 'descarga quebrou'], segments: ['manutencao'], keywords: ['encanador', 'reparo', 'manutenção'] },
  { triggers: ['tomada não funciona', 'luz apagou', 'curto circuito', 'chuveiro queimou', 'fiação'], segments: ['manutencao'], keywords: ['eletricista', 'instalação', 'manutenção'] },
  // Beleza
  { triggers: ['cabelo feio', 'preciso cortar cabelo', 'tintura', 'pintar cabelo'], segments: ['beleza'], keywords: ['cabelo', 'corte', 'barbeiro'] },
  { triggers: ['unha quebrou', 'fazer unha', 'pé e mão'], segments: ['beleza'], keywords: ['manicure', 'estética'] },
  // Pet
  { triggers: ['meu cachorro', 'meu gato', 'meu pet', 'animal doente', 'vacina pet', 'pulga', 'carrapato'], segments: ['pet'], keywords: ['veterinário', 'pet', 'banho', 'tosa'] },
  // Educação / Música
  { triggers: ['aprender inglês', 'aula particular', 'reforço escolar', 'estudar para concurso'], segments: ['educacao'], keywords: ['professor', 'aula', 'inglês', 'concurso'] },
  { triggers: ['aprender violão', 'aprender guitarra', 'aula de piano', 'aprender música', 'tocar bateria'], segments: ['musica'], keywords: ['violão', 'guitarra', 'piano', 'bateria', 'aula de música'] },
  // Tecnologia
  { triggers: ['computador lento', 'pc travando', 'vírus no pc', 'celular quebrou', 'tela quebrada'], segments: ['tech'], keywords: ['formatação', 'computador', 'celular', 'conserto'] },
  // Eventos
  { triggers: ['festa de aniversário', 'casamento', 'organizar festa', 'buffet', 'precisamos de dj'], segments: ['eventos'], keywords: ['festa', 'buffet', 'dj', 'casamento', 'decoração'] },
];

const mockResults = [
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
  // Jardinagem específica
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
];

const aiSuggestions = [
  '🔌 Baseado no seu perfil, recomendamos uma revisão elétrica completa — você não faz há 8 meses!',
  '💇 Agende seu corte mensal com 15% de desconto no seu plano Prata!',
  '🏠 Combo Casa Limpa: Faxina + Jardinagem com 20% OFF juntos',
  '🚗 Seu carro está próximo da revisão dos 30.000 km — agende agora!',
];


const Landing = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSegments, setActiveSegments] = useState<string[]>([]);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [aiChat, setAiChat] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [currentSuggestion, setCurrentSuggestion] = useState(0);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSuggestion((prev) => (prev + 1) % aiSuggestions.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const placeholders = [
    'Estou com dor de barriga...',
    'Preciso cortar a grama do jardim...',
    'Meu carro está fazendo barulho...',
    'Preciso de uma faxineira...',
    'Quero aprender violão...',
    'Meu cachorro precisa de vacina...',
  ];
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setPlaceholderIdx((p) => (p + 1) % placeholders.length), 3000);
    return () => clearInterval(interval);
  }, []);

  const toggleSegment = (id: string) => {
    setActiveSegments((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  };

  // ── Motor de busca semântica ──
  const filteredResults = (() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query && activeSegments.length === 0) return mockResults;

    // 1. Verificar correspondência com linguagem natural
    const matchedNLMaps = naturalLanguageMap.filter((nlm) =>
      nlm.triggers.some((t) => query.includes(t) || t.includes(query))
    );

    // 2. Extrair segmentos e keywords da linguagem natural
    const nlSegments = matchedNLMaps.flatMap((m) => m.segments);
    const nlKeywords = matchedNLMaps.flatMap((m) => m.keywords);

    return mockResults.filter((r) => {
      // Filtro por segmento selecionado (chips)
      const matchesSegment = activeSegments.length === 0 || activeSegments.includes(r.segment);
      if (!matchesSegment) return false;

      if (!query) return true;

      // Match direto por nome/provider
      const directMatch = r.name.toLowerCase().includes(query) || r.provider.toLowerCase().includes(query);
      if (directMatch) return true;

      // Match por keywords do segmento
      const segmentKeywordMatch = segments.find((s) => s.id === r.segment)?.keywords.some((k) => k.includes(query) || query.includes(k));
      if (segmentKeywordMatch) return true;

      // Match semântico: segmento + keywords da linguagem natural
      if (matchedNLMaps.length > 0) {
        const inNLSegment = nlSegments.includes(r.segment);
        const hasNLKeyword = nlKeywords.some((kw) =>
          r.name.toLowerCase().includes(kw) ||
          r.products.some((p) => p.toLowerCase().includes(kw)) ||
          segments.find((s) => s.id === r.segment)?.keywords.some((sk) => sk.includes(kw))
        );
        if (inNLSegment || hasNLKeyword) return true;
      }

      // Match por produtos
      const productMatch = r.products.some((p) => p.toLowerCase().includes(query) || query.includes(p.toLowerCase()));
      if (productMatch) return true;

      return false;
    });
  })();

  const handleAiSend = () => {
    if (!aiMessage.trim()) return;
    const msg = aiMessage.trim();
    setAiChat((prev) => [...prev, { role: 'user', text: msg }]);
    setAiSpeaking(true);

    // IA semântica: buscar resultados relevantes baseado na mensagem
    const msgLower = msg.toLowerCase();
    const matched = naturalLanguageMap.filter((nlm) =>
      nlm.triggers.some((t) => msgLower.includes(t) || t.includes(msgLower))
    );

    let aiResponse = '';
    if (matched.length > 0) {
      const matchedSegmentIds = matched.flatMap((m) => m.segments);
      const matchedKeywords = matched.flatMap((m) => m.keywords);
      const relevantResults = mockResults.filter((r) =>
        matchedSegmentIds.includes(r.segment) ||
        matchedKeywords.some((kw) => r.name.toLowerCase().includes(kw) || r.products.some((p) => p.toLowerCase().includes(kw)))
      );

      if (relevantResults.length > 0) {
        const top = relevantResults.slice(0, 3);
        const serviceList = top.map((r) => `• **${r.name}** — ${r.provider} (${r.distance}, ⭐${r.rating})${r.products.length > 0 ? ` | Produtos: ${r.products.join(', ')}` : ''}`).join('\n');
        aiResponse = `Entendi sua necessidade! 🧠 Encontrei ${relevantResults.length} resultado(s) relevante(s):\n\n${serviceList}\n\n${relevantResults.length > 3 ? `E mais ${relevantResults.length - 3} opções! ` : ''}Posso agendar o mais próximo para você?`;
        // Atualizar busca automaticamente
        setSearchQuery(msg);
      } else {
        aiResponse = `Entendi o que você precisa! 🔍 Estou buscando profissionais e produtos para atender sua solicitação. Encaminhando para a Central de Atendimento — SLA de 24h para encontrar a melhor solução!`;
      }
    } else {
      const fallbackResponses = [
        'Encontrei 3 opções na sua região! O mais próximo é o Carlos MEI, a 2.3 km, com avaliação 4.9⭐. Posso agendar para você?',
        'Analisando fornecedores cadastrados e estoque disponível via drop-shipping... Encontrei a melhor opção: preço 15% menor que a média, com entrega em 24h!',
        'Encaminhando sua solicitação para a Central de Atendimento. SLA de resposta: máximo 24 horas. Você receberá uma notificação assim que tivermos a solução!',
      ];
      aiResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    }

    setTimeout(() => {
      setAiChat((prev) => [...prev, { role: 'ai', text: aiResponse }]);
      setTimeout(() => setAiSpeaking(false), 2000);
    }, 1200);
    setAiMessage('');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">EcoMEI</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/client')}>
              <ShoppingCart className="w-4 h-4 mr-1" /> App Cliente
            </Button>
            <Button size="sm" onClick={() => navigate('/mei')}>
              <BarChart3 className="w-4 h-4 mr-1" /> Painel MEI
            </Button>
            <div className="relative group">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                Mais ▾
              </Button>
              <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 min-w-[200px] z-50">
                <div className="p-2 space-y-1">
                  <button onClick={() => navigate('/processos')} className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">Fluxos de Processos</button>
                  <button onClick={() => navigate('/gestao')} className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">Gestão de Serviços</button>
                  <button onClick={() => navigate('/jornada-cliente')} className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">Jornada do Cliente</button>
                  <button onClick={() => navigate('/mei-acompanhamento')} className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">Gestor MEI</button>
                  <button onClick={() => navigate('/dropshipping')} className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">Drop-shipping Global</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-24 pb-4 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="container mx-auto text-center relative max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-extrabold text-foreground mb-3 leading-tight tracking-tight">
              Seu problema, <span className="text-primary">nossa solução.</span><br />
              <span className="text-muted-foreground text-2xl md:text-3xl lg:text-4xl font-bold">A inteligência que encontra tudo por você.</span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
              Serviços, produtos, profissionais — tudo em um só lugar. Se não existir aqui, nossa IA vasculha o ecossistema inteiro e entrega a melhor opção.
            </p>
          </motion.div>

          {/* CTA buttons */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }} className="flex gap-3 justify-center mb-6">
            <Button size="lg" className="gap-2 px-6" onClick={() => navigate('/mei')}>
              <BarChart3 className="w-4 h-4" /> Painel MEI
            </Button>
            <Button size="lg" variant="outline" className="gap-2 px-6" onClick={() => navigate('/client')}>
              <ShoppingCart className="w-4 h-4" /> App Cliente
            </Button>
          </motion.div>
        </div>
      </section>

      {/* AI Avatar + Search Section */}
      <section className="px-4 pb-8">
        <div className="container mx-auto max-w-5xl">
          {/* Avatar + greeting */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.6, type: 'spring' }}
            className="flex flex-col items-center mb-6"
          >
            <AiAvatar size={80} speaking={aiSpeaking} onClick={() => setShowAiPanel(true)} />
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mt-4 bg-card border border-border rounded-2xl rounded-tl-md px-5 py-3 shadow-md max-w-md relative"
            >
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-card border-l border-t border-border rotate-45" />
              <p className="text-sm text-foreground font-medium relative z-10">
                Olá! 👋 O que você procura hoje?<br />
                <span className="text-muted-foreground font-normal">Serviço, produto ou profissional — me conta que eu resolvo.</span>
              </p>
            </motion.div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5, duration: 0.5 }}>
            {/* Search bar */}
            <div className="relative mb-6">
              <div className="relative flex items-center bg-card border-2 border-primary/30 rounded-2xl shadow-lg hover:shadow-xl hover:border-primary/50 transition-all duration-300 overflow-hidden">
                <Search className="w-5 h-5 text-primary absolute left-4" />
                <Input
                  ref={searchRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={placeholders[placeholderIdx]}
                  className="border-0 pl-12 pr-4 py-6 text-base md:text-lg bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <div className="flex items-center gap-2 pr-3">
                  <Button size="sm" variant="ghost" className="gap-1 text-muted-foreground hover:text-primary" onClick={() => setShowAiPanel(!showAiPanel)}>
                    <MessageCircle className="w-4 h-4" />
                    <span className="hidden sm:inline text-xs">Falar com IA</span>
                  </Button>
                  <Button size="sm" className="gap-1 rounded-xl">
                    <Search className="w-4 h-4" /> Buscar
                  </Button>
                </div>
              </div>

              {/* AI Suggestion banner */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSuggestion}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={{ duration: 0.3 }}
                  className="mt-2 flex items-center gap-2 text-sm text-muted-foreground px-2"
                >
                  <Sparkles className="w-4 h-4 text-accent shrink-0" />
                  <span>{aiSuggestions[currentSuggestion]}</span>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Segment chips */}
            <div className="flex flex-wrap gap-2 mb-6 justify-center">
              {segments.map((seg) => {
                const Icon = seg.icon;
                const isActive = activeSegments.includes(seg.id);
                return (
                  <motion.button
                    key={seg.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleSegment(seg.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                      isActive
                        ? 'bg-primary text-primary-foreground border-primary shadow-md'
                        : 'bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {seg.label}
                  </motion.button>
                );
              })}
            </div>

            {/* Results grid */}
            <AnimatePresence>
              {(searchQuery || activeSegments.length > 0) && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                    {filteredResults.map((result, idx) => {
                      const seg = segments.find((s) => s.id === result.segment);
                      const SegIcon = seg?.icon || Wrench;
                      return (
                        <motion.div key={result.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                          <Card
                            className="border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-pointer group"
                            onClick={() => {
                              const params = new URLSearchParams({
                                serviceName: result.name,
                                serviceProvider: result.provider,
                                servicePrice: String(result.price),
                                serviceRating: String(result.rating),
                                serviceDistance: result.distance,
                                serviceTime: result.time,
                                serviceSegment: result.segment,
                                serviceProducts: JSON.stringify(result.products),
                              });
                              navigate(`/jornada-cliente?${params.toString()}`);
                            }}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <SegIcon className="w-4 h-4 text-primary" />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-sm text-foreground">{result.name}</h4>
                                    <p className="text-xs text-muted-foreground">{result.provider}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 text-xs text-accent-foreground">
                                  <Star className="w-3 h-3 fill-accent text-accent" />
                                  {result.rating}
                                </div>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                                <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> R$ {result.price}</span>
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {result.time}</span>
                                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {result.distance}</span>
                              </div>
                              {result.products.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {result.products.map((p) => (
                                    <Badge key={p} variant="secondary" className="text-[10px] px-2 py-0">
                                      <Package className="w-2.5 h-2.5 mr-1" />{p}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                              <div className="mt-2 flex items-center gap-1 text-[10px] text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowRight className="w-3 h-3" /> Simular contratação
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>

                  {filteredResults.length === 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                      <AiAvatar size={72} speaking={true} onClick={() => setShowAiPanel(true)} />
                      <h3 className="font-display font-bold text-lg text-foreground mb-2 mt-4">Não encontrou? Deixa comigo!</h3>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
                        Estou buscando em todos os fornecedores, estoques próprios e catálogos drop-shipping para encontrar a melhor opção por <strong>preço, tempo e proximidade</strong>.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button className="gap-2" onClick={() => setShowAiPanel(true)}>
                          <Sparkles className="w-4 h-4" /> Pedir para a IA buscar
                        </Button>
                        <Button variant="outline" className="gap-2" onClick={() => {
                          setShowAiPanel(true);
                          setAiChat((prev) => [...prev,
                            { role: 'user', text: `Preciso de: ${searchQuery}` },
                            { role: 'ai', text: 'Encaminhando para a Central de Atendimento EcoMEI. Prazo: até 24 horas. Você será notificado assim que encontrarmos a solução ideal! 📩' },
                          ]);
                        }}>
                          <Headphones className="w-4 h-4" /> Central de Atendimento (SLA 24h)
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Idle state */}
            {!searchQuery && activeSegments.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="text-center py-6">
                <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto mb-8">
                  {[
                    { icon: TrendingDown, title: 'Melhor Preço', desc: 'IA compara todos os fornecedores e acha o menor preço do ecossistema', color: 'text-primary' },
                    { icon: Navigation, title: 'Mais Próximo', desc: 'Prioriza prestadores na sua região para atendimento rápido', color: 'text-success' },
                    { icon: Clock, title: 'Menor Tempo', desc: 'Agenda automática com o profissional disponível mais cedo', color: 'text-accent-foreground' },
                  ].map((feat, idx) => (
                    <motion.div
                      key={feat.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 + idx * 0.15 }}
                    >
                      <Card className="border-border/50 hover:border-primary/20 transition-all duration-300 h-full">
                        <CardContent className="p-5 text-center">
                          <motion.div
                            animate={{ y: [0, -4, 0] }}
                            transition={{ duration: 2, repeat: Infinity, delay: idx * 0.3 }}
                            className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3"
                          >
                            <feat.icon className={`w-6 h-6 ${feat.color}`} />
                          </motion.div>
                          <h3 className="font-display font-bold text-foreground mb-1">{feat.title}</h3>
                          <p className="text-xs text-muted-foreground">{feat.desc}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {/* Trust bar */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-primary" /> 2.450+ MEIs ativos</span>
                  <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-success" /> Pagamento seguro</span>
                  <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-accent" /> 4.8 avaliação média</span>
                  <span className="flex items-center gap-1.5"><Headphones className="w-4 h-4 text-primary" /> Suporte 24h</span>
                </motion.div>

                {/* Not found CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.4 }}
                  className="mt-8 mx-auto max-w-2xl"
                >
                  <Card className="border-primary/20 bg-primary/5 overflow-hidden relative">
                    <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-4">
                      <AiAvatar size={56} speaking={false} onClick={() => setShowAiPanel(true)} />
                      <div className="text-left">
                        <h3 className="font-display font-bold text-foreground mb-1">Não achou o que precisa?</h3>
                        <p className="text-sm text-muted-foreground">
                          Fale comigo! Eu cruzo <strong>todos os fornecedores</strong>, estoques e catálogos drop-shipping do ecossistema.
                          Se eu não encontrar, a <strong>Central de Atendimento</strong> resolve em até <strong>24 horas</strong>.
                        </p>
                      </div>
                      <Button variant="outline" className="shrink-0 gap-1" onClick={() => setShowAiPanel(true)}>
                        <Sparkles className="w-4 h-4" /> Conversar
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* AI Chat Panel */}
      <AnimatePresence>
        {showAiPanel && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed right-0 top-14 bottom-0 w-full sm:w-96 bg-card border-l border-border shadow-2xl z-50 flex flex-col"
          >
            <div className="p-4 border-b border-border flex items-center justify-between bg-primary/5">
              <div className="flex items-center gap-3">
                <AiAvatar size={40} speaking={aiSpeaking} />
                <div>
                  <h3 className="font-display font-bold text-sm text-foreground">Assistente EcoMEI</h3>
                  <div className="flex items-center gap-1.5">
                    <motion.div
                      className="w-2 h-2 rounded-full bg-success"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <p className="text-xs text-muted-foreground">IA • Online agora</p>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowAiPanel(false)}>✕</Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {aiChat.length === 0 && (
                <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-2">👋 Olá! Sou a IA do EcoMEI.</p>
                  <p className="mb-3">Me conta o que você precisa — eu busco a melhor opção por:</p>
                  <ul className="space-y-1.5">
                    <li className="flex items-center gap-2"><DollarSign className="w-3.5 h-3.5 text-primary" /> Melhor preço</li>
                    <li className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-primary" /> Menor tempo de atendimento</li>
                    <li className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-primary" /> Proximidade da sua região</li>
                  </ul>
                  <p className="mt-3 text-xs">Se não encontrar, encaminho para a <strong>Central de Atendimento</strong> (SLA 24h).</p>
                </div>
              )}

              {aiChat.map((msg, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start gap-2'}`}>
                  {msg.role === 'ai' && <AiAvatar size={28} speaking={false} />}
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted text-foreground rounded-bl-md'
                  }`}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="p-3 border-t border-border">
              <div className="flex gap-2">
                <Input
                  value={aiMessage}
                  onChange={(e) => setAiMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAiSend()}
                  placeholder="Descreva o que você precisa..."
                  className="rounded-xl"
                />
                <Button size="icon" className="rounded-xl shrink-0" onClick={handleAiSend}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <button
                onClick={() => {
                  setAiSpeaking(true);
                  setAiChat((prev) => [...prev,
                    { role: 'user', text: 'Não encontrei o que preciso, podem me ajudar?' },
                    { role: 'ai', text: 'Claro! Encaminhando para a Central de Atendimento EcoMEI. Nosso SLA é de no máximo 24 horas. Você receberá uma notificação com a melhor solução! 📩✅' },
                  ]);
                  setTimeout(() => setAiSpeaking(false), 2000);
                }}
                className="w-full mt-2 text-xs text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1 py-1.5"
              >
                <Headphones className="w-3 h-3" /> Encaminhar para Central de Atendimento (SLA 24h)
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-4">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-foreground">EcoMEI</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 EcoMEI — Demo para apresentação a investidores</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
