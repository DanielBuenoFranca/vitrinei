// Mock data for the demo app

/* ─── PLANOS COM CRÉDITOS ─── */
export type PlanTier = 'bronze' | 'prata' | 'ouro';

export const plans = [
  {
    id: 'bronze' as PlanTier,
    name: 'Bronze',
    price: 29.90,
    color: '#CD7F32',
    discount: 5,
    monthlyCredits: 50,
    maxAccumulation: 100,
    loyaltyBonusPercent: 2,
    services: 'Taxa de visita grátis',
    features: [
      '50 créditos mensais',
      '5% desconto em produtos',
      'Taxa de visita grátis',
      'Suporte por e-mail',
      'Acesso ao catálogo básico',
    ],
  },
  {
    id: 'prata' as PlanTier,
    name: 'Prata',
    price: 59.90,
    color: '#C0C0C0',
    discount: 10,
    monthlyCredits: 120,
    maxAccumulation: 300,
    loyaltyBonusPercent: 5,
    services: '1 serviço mensal coberto',
    features: [
      '120 créditos mensais',
      '10% desconto em produtos',
      '1 serviço mensal coberto',
      'Suporte prioritário',
      'Carteira de pontos',
    ],
    popular: true,
  },
  {
    id: 'ouro' as PlanTier,
    name: 'Ouro',
    price: 99.90,
    color: '#FFD700',
    discount: 20,
    monthlyCredits: 250,
    maxAccumulation: 800,
    loyaltyBonusPercent: 10,
    services: 'Serviços ilimitados',
    features: [
      '250 créditos mensais',
      '20% desconto em produtos',
      'Serviços ilimitados',
      'Suporte VIP 24/7',
      'Carteira de pontos 2x',
      'Garantia estendida',
    ],
  },
];

/* ─── USUÁRIO MOCK (CLIENTE) ─── */
export const mockUser = {
  name: 'Maria Silva',
  plan: 'prata' as PlanTier,
  monthsActive: 4,
  credits: 95,
  totalCreditsEarned: 480,
  isActive: true,
};

/* ─── SERVIÇOS COM REGRAS DE ELEGIBILIDADE ─── */
export interface ServiceItem {
  id: number;
  name: string;
  icon: string;
  category: string;
  provider: string;
  rating: number;
  creditCost: number;
  minMonths: number;
  minPlan: PlanTier;
  allowComplement: boolean;
  monetaryValue: number;
  relatedProductIds: number[];
  themeTags: string[];
}

/**
 * Filtra produtos de um MEI pelo tema do serviço selecionado.
 * Compara themeTags do serviço contra category + name dos produtos.
 */
export function getContextualProducts(
  service: ServiceItem,
  products: ProductItem[]
): ProductItem[] {
  if (!service.themeTags || service.themeTags.length === 0) return products;
  const tags = service.themeTags.map(t => t.toLowerCase());
  return products.filter(p => {
    const pName = p.name.toLowerCase();
    const pCat = p.category.toLowerCase();
    return tags.some(tag => pName.includes(tag) || pCat.includes(tag));
  });
}

/**
 * Encontra MEIs relevantes para um serviço baseado no segmento/categoria.
 */
export function findRelevantMeis(service: ServiceItem): MeiProfessional[] {
  return meiProfessionals.filter(mei => mei.segment === service.category);
}

// ══════════════════════════════════════════════════
// SERVIÇOS – 10 segmentos × 20+ serviços cada
// ══════════════════════════════════════════════════

export const clientServices: ServiceItem[] = [
  // ────────────────────────────────────────────────
  // 1. MANUTENÇÃO & REPAROS (20 serviços)
  // ────────────────────────────────────────────────
  { id: 1, name: 'Eletricista Residencial', icon: '⚡', category: 'Manutenção & Reparos', provider: 'João Eletricista', rating: 4.9, creditCost: 80, minMonths: 2, minPlan: 'bronze', allowComplement: true, monetaryValue: 150.00, relatedProductIds: [7, 8, 9] },
  { id: 2, name: 'Encanador', icon: '🔧', category: 'Manutenção & Reparos', provider: 'Pedro Encanador', rating: 4.7, creditCost: 65, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 120.00, relatedProductIds: [10, 11] },
  { id: 4, name: 'Montagem de Móveis', icon: '🪑', category: 'Manutenção & Reparos', provider: 'Carlos Marceneiro', rating: 4.5, creditCost: 45, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 80.00, relatedProductIds: [12] },
  { id: 16, name: 'Pintor Residencial', icon: '🎨', category: 'Manutenção & Reparos', provider: 'Marcos Pintura', rating: 4.6, creditCost: 90, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 180.00, relatedProductIds: [] },
  { id: 100, name: 'Gesseiro / Drywall', icon: '🧱', category: 'Manutenção & Reparos', provider: 'Gesso Express', rating: 4.5, creditCost: 95, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 190.00, relatedProductIds: [] },
  { id: 101, name: 'Serralheiro', icon: '🔩', category: 'Manutenção & Reparos', provider: 'Ferro Forte', rating: 4.4, creditCost: 110, minMonths: 3, minPlan: 'prata', allowComplement: true, monetaryValue: 220.00, relatedProductIds: [] },
  { id: 102, name: 'Vidraceiro', icon: '🪟', category: 'Manutenção & Reparos', provider: 'Vidros Brasil', rating: 4.6, creditCost: 85, minMonths: 2, minPlan: 'bronze', allowComplement: true, monetaryValue: 170.00, relatedProductIds: [] },
  { id: 103, name: 'Pedreiro', icon: '🧱', category: 'Manutenção & Reparos', provider: 'Constrular MEI', rating: 4.3, creditCost: 100, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 200.00, relatedProductIds: [] },
  { id: 104, name: 'Impermeabilização', icon: '💧', category: 'Manutenção & Reparos', provider: 'ImperTech', rating: 4.7, creditCost: 130, minMonths: 3, minPlan: 'prata', allowComplement: true, monetaryValue: 260.00, relatedProductIds: [] },
  { id: 105, name: 'Instalação de Pisos', icon: '🏠', category: 'Manutenção & Reparos', provider: 'PisoMaster', rating: 4.5, creditCost: 120, minMonths: 3, minPlan: 'prata', allowComplement: true, monetaryValue: 240.00, relatedProductIds: [] },
  { id: 106, name: 'Marido de Aluguel', icon: '🛠️', category: 'Manutenção & Reparos', provider: 'Faz Tudo Express', rating: 4.8, creditCost: 50, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 90.00, relatedProductIds: [] },
  { id: 107, name: 'Chaveiro 24h', icon: '🔑', category: 'Manutenção & Reparos', provider: 'Chave Mestra', rating: 4.6, creditCost: 40, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 70.00, relatedProductIds: [] },
  { id: 108, name: 'Instalação de Ar Condicionado', icon: '❄️', category: 'Manutenção & Reparos', provider: 'ClimaFrio', rating: 4.7, creditCost: 100, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 200.00, relatedProductIds: [] },
  { id: 109, name: 'Manutenção de Aquecedor', icon: '🔥', category: 'Manutenção & Reparos', provider: 'AquaGás Pro', rating: 4.5, creditCost: 75, minMonths: 2, minPlan: 'bronze', allowComplement: true, monetaryValue: 140.00, relatedProductIds: [] },
  { id: 110, name: 'Instalação de Cerca Elétrica', icon: '⚡', category: 'Manutenção & Reparos', provider: 'SegurMax', rating: 4.4, creditCost: 140, minMonths: 3, minPlan: 'prata', allowComplement: true, monetaryValue: 280.00, relatedProductIds: [] },
  { id: 111, name: 'Reparos em Telhado', icon: '🏚️', category: 'Manutenção & Reparos', provider: 'TelhaFix', rating: 4.3, creditCost: 150, minMonths: 4, minPlan: 'prata', allowComplement: true, monetaryValue: 300.00, relatedProductIds: [] },
  { id: 112, name: 'Instalação de Antena', icon: '📡', category: 'Manutenção & Reparos', provider: 'SinalMax', rating: 4.2, creditCost: 55, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 100.00, relatedProductIds: [] },
  { id: 113, name: 'Soldador', icon: '🔥', category: 'Manutenção & Reparos', provider: 'SoldaTech', rating: 4.5, creditCost: 120, minMonths: 3, minPlan: 'prata', allowComplement: true, monetaryValue: 240.00, relatedProductIds: [] },
  { id: 114, name: 'Desentupidora', icon: '🚿', category: 'Manutenção & Reparos', provider: 'DesentupeJá', rating: 4.6, creditCost: 70, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 130.00, relatedProductIds: [] },
  { id: 115, name: 'Instalação de Portão Eletrônico', icon: '🚪', category: 'Manutenção & Reparos', provider: 'PortãoSmart', rating: 4.7, creditCost: 160, minMonths: 3, minPlan: 'ouro', allowComplement: true, monetaryValue: 320.00, relatedProductIds: [] },

  // ────────────────────────────────────────────────
  // 2. SAÚDE (20 serviços) — NOVO SEGMENTO
  // ────────────────────────────────────────────────
  { id: 200, name: 'Clínico Geral — Teleconsulta', icon: '🩺', category: 'Saúde', provider: 'Dr. Saúde Online', rating: 4.8, creditCost: 60, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 120.00, relatedProductIds: [] },
  { id: 201, name: 'Dentista — Limpeza', icon: '🦷', category: 'Saúde', provider: 'OdontoFácil', rating: 4.9, creditCost: 80, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 160.00, relatedProductIds: [] },
  { id: 202, name: 'Dentista — Clareamento', icon: '✨', category: 'Saúde', provider: 'SmilePro', rating: 4.7, creditCost: 200, minMonths: 3, minPlan: 'prata', allowComplement: true, monetaryValue: 400.00, relatedProductIds: [] },
  { id: 203, name: 'Dentista — Ortodontia', icon: '🦷', category: 'Saúde', provider: 'OrthoLife', rating: 4.8, creditCost: 180, minMonths: 3, minPlan: 'prata', allowComplement: true, monetaryValue: 350.00, relatedProductIds: [] },
  { id: 204, name: 'Medicina do Trabalho — ASO', icon: '📋', category: 'Saúde', provider: 'WorkMed', rating: 4.6, creditCost: 50, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 90.00, relatedProductIds: [] },
  { id: 205, name: 'Medicina do Trabalho — PCMSO', icon: '🏭', category: 'Saúde', provider: 'WorkMed', rating: 4.5, creditCost: 120, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 240.00, relatedProductIds: [] },
  { id: 206, name: 'Exame Laboratorial — Hemograma', icon: '🔬', category: 'Saúde', provider: 'LabExpress', rating: 4.7, creditCost: 30, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 55.00, relatedProductIds: [] },
  { id: 207, name: 'Exame Laboratorial — Check-up Completo', icon: '🧪', category: 'Saúde', provider: 'LabExpress', rating: 4.8, creditCost: 100, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 200.00, relatedProductIds: [] },
  { id: 208, name: 'Psicólogo Online', icon: '🧠', category: 'Saúde', provider: 'MenteSã', rating: 4.9, creditCost: 70, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 140.00, relatedProductIds: [] },
  { id: 209, name: 'Fonoaudiólogo', icon: '🗣️', category: 'Saúde', provider: 'FonoVida', rating: 4.6, creditCost: 65, minMonths: 2, minPlan: 'bronze', allowComplement: true, monetaryValue: 130.00, relatedProductIds: [] },
  { id: 210, name: 'Oftalmologista — Consulta', icon: '👁️', category: 'Saúde', provider: 'OlhoVivo', rating: 4.7, creditCost: 75, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 150.00, relatedProductIds: [] },
  { id: 211, name: 'Dermatologista — Teleconsulta', icon: '🧴', category: 'Saúde', provider: 'DermaCare', rating: 4.8, creditCost: 80, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 160.00, relatedProductIds: [] },
  { id: 212, name: 'Nutricionista Esportivo', icon: '🥗', category: 'Saúde', provider: 'NutriSport', rating: 4.7, creditCost: 65, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 120.00, relatedProductIds: [] },
  { id: 213, name: 'Fisioterapeuta Domiciliar', icon: '🏥', category: 'Saúde', provider: 'FisioHome Pro', rating: 4.8, creditCost: 90, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 180.00, relatedProductIds: [] },
  { id: 214, name: 'Acupunturista', icon: '📍', category: 'Saúde', provider: 'EquilíbrioVital', rating: 4.5, creditCost: 55, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 100.00, relatedProductIds: [] },
  { id: 215, name: 'Quiropraxista', icon: '🦴', category: 'Saúde', provider: 'AlinhaPro', rating: 4.6, creditCost: 70, minMonths: 2, minPlan: 'bronze', allowComplement: true, monetaryValue: 130.00, relatedProductIds: [] },
  { id: 216, name: 'Enfermeiro — Aplicação Domiciliar', icon: '💉', category: 'Saúde', provider: 'EnferHome', rating: 4.9, creditCost: 40, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 70.00, relatedProductIds: [] },
  { id: 217, name: 'Exame de Imagem — Raio-X', icon: '📸', category: 'Saúde', provider: 'ImagemDiag', rating: 4.7, creditCost: 60, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 110.00, relatedProductIds: [] },
  { id: 218, name: 'Podólogo', icon: '🦶', category: 'Saúde', provider: 'PéSaudável', rating: 4.4, creditCost: 35, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 65.00, relatedProductIds: [] },
  { id: 219, name: 'Terapeuta Ocupacional', icon: '🤲', category: 'Saúde', provider: 'VidaAtiva TO', rating: 4.6, creditCost: 75, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 150.00, relatedProductIds: [] },

  // ────────────────────────────────────────────────
  // 3. BEM-ESTAR & SAÚDE (expandido para 20)
  // ────────────────────────────────────────────────
  { id: 17, name: 'Personal Trainer', icon: '💪', category: 'Bem-estar & Saúde', provider: 'Fit Express', rating: 4.8, creditCost: 70, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 130.00, relatedProductIds: [] },
  { id: 18, name: 'Nutricionista Online', icon: '🥗', category: 'Bem-estar & Saúde', provider: 'NutriVida', rating: 4.9, creditCost: 60, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 110.00, relatedProductIds: [] },
  { id: 19, name: 'Fisioterapeuta', icon: '🏥', category: 'Bem-estar & Saúde', provider: 'FisioHome', rating: 4.7, creditCost: 95, minMonths: 3, minPlan: 'prata', allowComplement: true, monetaryValue: 190.00, relatedProductIds: [] },
  { id: 300, name: 'Instrutor de Yoga', icon: '🧘', category: 'Bem-estar & Saúde', provider: 'YogaFlow', rating: 4.8, creditCost: 55, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 100.00, relatedProductIds: [] },
  { id: 301, name: 'Instrutor de Pilates', icon: '🤸', category: 'Bem-estar & Saúde', provider: 'PilatesCore', rating: 4.7, creditCost: 60, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 110.00, relatedProductIds: [] },
  { id: 302, name: 'Massoterapeuta', icon: '💆', category: 'Bem-estar & Saúde', provider: 'RelaxPro', rating: 4.9, creditCost: 65, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 120.00, relatedProductIds: [] },
  { id: 303, name: 'Coach de Meditação', icon: '🕯️', category: 'Bem-estar & Saúde', provider: 'MindfulBR', rating: 4.6, creditCost: 45, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 80.00, relatedProductIds: [] },
  { id: 304, name: 'Educador Físico — Hidroginástica', icon: '🏊', category: 'Bem-estar & Saúde', provider: 'AquaFit', rating: 4.5, creditCost: 50, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 90.00, relatedProductIds: [] },
  { id: 305, name: 'Personal Trainer — Funcional', icon: '🏋️', category: 'Bem-estar & Saúde', provider: 'FuncionalPro', rating: 4.8, creditCost: 75, minMonths: 2, minPlan: 'bronze', allowComplement: true, monetaryValue: 140.00, relatedProductIds: [] },
  { id: 306, name: 'Terapeuta Holístico', icon: '🌿', category: 'Bem-estar & Saúde', provider: 'Equilíbrio Natural', rating: 4.4, creditCost: 50, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 90.00, relatedProductIds: [] },
  { id: 307, name: 'Reflexologia', icon: '🦶', category: 'Bem-estar & Saúde', provider: 'PontosVitais', rating: 4.5, creditCost: 45, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 80.00, relatedProductIds: [] },
  { id: 308, name: 'Coach de Saúde Mental', icon: '🧠', category: 'Bem-estar & Saúde', provider: 'MindCare', rating: 4.9, creditCost: 80, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 160.00, relatedProductIds: [] },
  { id: 309, name: 'Personal Trainer — Gestantes', icon: '🤰', category: 'Bem-estar & Saúde', provider: 'MamãeFit', rating: 4.7, creditCost: 70, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 130.00, relatedProductIds: [] },
  { id: 310, name: 'Alongamento Assistido', icon: '🙆', category: 'Bem-estar & Saúde', provider: 'FlexiBody', rating: 4.5, creditCost: 40, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 70.00, relatedProductIds: [] },
  { id: 311, name: 'Instrutor de Crossfit', icon: '🏋️', category: 'Bem-estar & Saúde', provider: 'CrossBox', rating: 4.6, creditCost: 65, minMonths: 2, minPlan: 'bronze', allowComplement: true, monetaryValue: 120.00, relatedProductIds: [] },
  { id: 312, name: 'Aromaterapia', icon: '🌸', category: 'Bem-estar & Saúde', provider: 'AromaZen', rating: 4.4, creditCost: 40, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 70.00, relatedProductIds: [] },
  { id: 313, name: 'Reiki', icon: '✋', category: 'Bem-estar & Saúde', provider: 'LuzInterior', rating: 4.3, creditCost: 45, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 80.00, relatedProductIds: [] },
  { id: 314, name: 'Instrutor de Muay Thai', icon: '🥊', category: 'Bem-estar & Saúde', provider: 'FightFit', rating: 4.7, creditCost: 60, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 110.00, relatedProductIds: [] },
  { id: 315, name: 'Educador Físico — Idosos', icon: '👴', category: 'Bem-estar & Saúde', provider: 'VidaPlena60', rating: 4.8, creditCost: 55, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 100.00, relatedProductIds: [] },
  { id: 316, name: 'Personal Trainer — Online', icon: '💻', category: 'Bem-estar & Saúde', provider: 'FitRemoto', rating: 4.6, creditCost: 40, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 70.00, relatedProductIds: [] },

  // ────────────────────────────────────────────────
  // 4. ESTÉTICA & BELEZA (expandido para 20)
  // ────────────────────────────────────────────────
  { id: 20, name: 'Cabeleireiro em Casa', icon: '💇', category: 'Estética & Beleza', provider: 'Beauty Home', rating: 4.8, creditCost: 50, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 90.00, relatedProductIds: [] },
  { id: 21, name: 'Manicure & Pedicure', icon: '💅', category: 'Estética & Beleza', provider: 'Nails Pro', rating: 4.6, creditCost: 35, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 60.00, relatedProductIds: [] },
  { id: 22, name: 'Estética Facial', icon: '✨', category: 'Estética & Beleza', provider: 'Glow Skin', rating: 4.9, creditCost: 110, minMonths: 3, minPlan: 'prata', allowComplement: true, monetaryValue: 220.00, relatedProductIds: [] },
  { id: 400, name: 'Design de Sobrancelhas', icon: '✏️', category: 'Estética & Beleza', provider: 'BrowArt', rating: 4.7, creditCost: 30, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 55.00, relatedProductIds: [] },
  { id: 401, name: 'Extensão de Cílios', icon: '👁️', category: 'Estética & Beleza', provider: 'LashLux', rating: 4.8, creditCost: 80, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 160.00, relatedProductIds: [] },
  { id: 402, name: 'Depilação a Laser', icon: '💡', category: 'Estética & Beleza', provider: 'LaserSmooth', rating: 4.7, creditCost: 120, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 240.00, relatedProductIds: [] },
  { id: 403, name: 'Massagem Modeladora', icon: '💆', category: 'Estética & Beleza', provider: 'CorpoPerfeito', rating: 4.6, creditCost: 70, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 130.00, relatedProductIds: [] },
  { id: 404, name: 'Maquiagem Profissional', icon: '💄', category: 'Estética & Beleza', provider: 'GlamUp', rating: 4.9, creditCost: 90, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 180.00, relatedProductIds: [] },
  { id: 405, name: 'Limpeza de Pele', icon: '🧴', category: 'Estética & Beleza', provider: 'PeleLinda', rating: 4.7, creditCost: 55, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 100.00, relatedProductIds: [] },
  { id: 406, name: 'Peeling Químico', icon: '✨', category: 'Estética & Beleza', provider: 'RenovaSkin', rating: 4.6, creditCost: 100, minMonths: 3, minPlan: 'prata', allowComplement: true, monetaryValue: 200.00, relatedProductIds: [] },
  { id: 407, name: 'Microblading', icon: '✏️', category: 'Estética & Beleza', provider: 'BrowPerfect', rating: 4.8, creditCost: 150, minMonths: 3, minPlan: 'prata', allowComplement: true, monetaryValue: 300.00, relatedProductIds: [] },
  { id: 408, name: 'Barbeiro em Domicílio', icon: '💈', category: 'Estética & Beleza', provider: 'BarberHome', rating: 4.7, creditCost: 40, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 70.00, relatedProductIds: [] },
  { id: 409, name: 'Drenagem Linfática', icon: '💆', category: 'Estética & Beleza', provider: 'DrenaVida', rating: 4.8, creditCost: 65, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 120.00, relatedProductIds: [] },
  { id: 410, name: 'Tratamento Capilar', icon: '💇', category: 'Estética & Beleza', provider: 'HairRevive', rating: 4.6, creditCost: 75, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 150.00, relatedProductIds: [] },
  { id: 411, name: 'Bronzeamento Natural', icon: '☀️', category: 'Estética & Beleza', provider: 'SunGlow', rating: 4.4, creditCost: 45, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 80.00, relatedProductIds: [] },
  { id: 412, name: 'Depilação com Cera', icon: '🍯', category: 'Estética & Beleza', provider: 'SmoothSkin', rating: 4.5, creditCost: 40, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 70.00, relatedProductIds: [] },
  { id: 413, name: 'Nail Designer', icon: '💅', category: 'Estética & Beleza', provider: 'NailArtist', rating: 4.8, creditCost: 50, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 90.00, relatedProductIds: [] },
  { id: 414, name: 'Micropigmentação Labial', icon: '💋', category: 'Estética & Beleza', provider: 'LipArt', rating: 4.7, creditCost: 160, minMonths: 3, minPlan: 'ouro', allowComplement: true, monetaryValue: 320.00, relatedProductIds: [] },
  { id: 415, name: 'Spa Day em Casa', icon: '🛁', category: 'Estética & Beleza', provider: 'SpaHome', rating: 4.9, creditCost: 130, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 260.00, relatedProductIds: [] },
  { id: 416, name: 'Colorimetria Capilar', icon: '🎨', category: 'Estética & Beleza', provider: 'ColorHair', rating: 4.5, creditCost: 60, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 110.00, relatedProductIds: [] },

  // ────────────────────────────────────────────────
  // 5. LAR & AMBIENTE (expandido para 20)
  // ────────────────────────────────────────────────
  { id: 5, name: 'Limpeza Residencial', icon: '🧹', category: 'Lar & Ambiente', provider: 'Maria Clean', rating: 4.6, creditCost: 55, minMonths: 2, minPlan: 'bronze', allowComplement: true, monetaryValue: 100.00, relatedProductIds: [13, 14, 15] },
  { id: 23, name: 'Jardinagem', icon: '🌿', category: 'Lar & Ambiente', provider: 'Verde Vivo', rating: 4.5, creditCost: 40, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 70.00, relatedProductIds: [] },
  { id: 24, name: 'Dedetização', icon: '🐜', category: 'Lar & Ambiente', provider: 'SafeHome', rating: 4.7, creditCost: 85, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 160.00, relatedProductIds: [] },
  { id: 500, name: 'Limpeza Pós-Obra', icon: '🏗️', category: 'Lar & Ambiente', provider: 'LimpaTudo Pro', rating: 4.6, creditCost: 100, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 200.00, relatedProductIds: [] },
  { id: 501, name: 'Limpeza de Estofados', icon: '🛋️', category: 'Lar & Ambiente', provider: 'SofáLimpo', rating: 4.7, creditCost: 60, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 110.00, relatedProductIds: [] },
  { id: 502, name: 'Limpeza de Caixa d\'Água', icon: '💧', category: 'Lar & Ambiente', provider: 'ÁguaPura', rating: 4.8, creditCost: 50, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 90.00, relatedProductIds: [] },
  { id: 503, name: 'Paisagismo', icon: '🌳', category: 'Lar & Ambiente', provider: 'GardenDesign', rating: 4.7, creditCost: 130, minMonths: 3, minPlan: 'prata', allowComplement: true, monetaryValue: 260.00, relatedProductIds: [] },
  { id: 504, name: 'Poda de Árvores', icon: '🌲', category: 'Lar & Ambiente', provider: 'PodaExpress', rating: 4.5, creditCost: 70, minMonths: 2, minPlan: 'bronze', allowComplement: true, monetaryValue: 130.00, relatedProductIds: [] },
  { id: 505, name: 'Higienização de Colchão', icon: '🛏️', category: 'Lar & Ambiente', provider: 'SonoLimpo', rating: 4.6, creditCost: 45, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 80.00, relatedProductIds: [] },
  { id: 506, name: 'Limpeza de Piscina', icon: '🏊', category: 'Lar & Ambiente', provider: 'AquaClean', rating: 4.4, creditCost: 55, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 100.00, relatedProductIds: [] },
  { id: 507, name: 'Lavagem de Cortinas', icon: '🪟', category: 'Lar & Ambiente', provider: 'CortinaFresh', rating: 4.3, creditCost: 40, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 70.00, relatedProductIds: [] },
  { id: 508, name: 'Instalação de Pergolado', icon: '🏡', category: 'Lar & Ambiente', provider: 'MadeiraViva', rating: 4.6, creditCost: 150, minMonths: 4, minPlan: 'prata', allowComplement: true, monetaryValue: 300.00, relatedProductIds: [] },
  { id: 509, name: 'Decoração de Interiores', icon: '🎨', category: 'Lar & Ambiente', provider: 'DecorStyle', rating: 4.8, creditCost: 120, minMonths: 3, minPlan: 'prata', allowComplement: true, monetaryValue: 240.00, relatedProductIds: [] },
  { id: 510, name: 'Organização Residencial', icon: '📦', category: 'Lar & Ambiente', provider: 'OrganizaJá', rating: 4.7, creditCost: 55, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 100.00, relatedProductIds: [] },
  { id: 511, name: 'Impermeabilização de Sofá', icon: '🛋️', category: 'Lar & Ambiente', provider: 'ProtegeEstofo', rating: 4.5, creditCost: 50, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 90.00, relatedProductIds: [] },
  { id: 512, name: 'Automatização Residencial', icon: '🏠', category: 'Lar & Ambiente', provider: 'SmartHome BR', rating: 4.8, creditCost: 180, minMonths: 3, minPlan: 'ouro', allowComplement: true, monetaryValue: 360.00, relatedProductIds: [] },
  { id: 513, name: 'Lavanderia Express', icon: '👔', category: 'Lar & Ambiente', provider: 'PassaFácil', rating: 4.4, creditCost: 30, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 55.00, relatedProductIds: [] },
  { id: 514, name: 'Caça Vazamento', icon: '💧', category: 'Lar & Ambiente', provider: 'DetectaFix', rating: 4.7, creditCost: 80, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 160.00, relatedProductIds: [] },
  { id: 515, name: 'Descarte de Entulho', icon: '🚛', category: 'Lar & Ambiente', provider: 'LimpaObra', rating: 4.3, creditCost: 60, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 110.00, relatedProductIds: [] },

  // ────────────────────────────────────────────────
  // 6. AUTOMOTIVO (expandido para 20)
  // ────────────────────────────────────────────────
  { id: 25, name: 'Lavagem Automotiva', icon: '🚗', category: 'Automotivo', provider: 'Auto Brilho', rating: 4.4, creditCost: 30, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 50.00, relatedProductIds: [] },
  { id: 26, name: 'Mecânico Domiciliar', icon: '🔩', category: 'Automotivo', provider: 'MecFix', rating: 4.7, creditCost: 100, minMonths: 3, minPlan: 'prata', allowComplement: true, monetaryValue: 200.00, relatedProductIds: [] },
  { id: 27, name: 'Funilaria Express', icon: '🛠️', category: 'Automotivo', provider: 'AutoRestore', rating: 4.5, creditCost: 130, minMonths: 4, minPlan: 'prata', allowComplement: true, monetaryValue: 260.00, relatedProductIds: [] },
  { id: 600, name: 'Troca de Óleo', icon: '🛢️', category: 'Automotivo', provider: 'ÓleoRápido', rating: 4.6, creditCost: 35, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 65.00, relatedProductIds: [] },
  { id: 601, name: 'Alinhamento e Balanceamento', icon: '🔧', category: 'Automotivo', provider: 'RodaCerta', rating: 4.7, creditCost: 50, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 90.00, relatedProductIds: [] },
  { id: 602, name: 'Polimento e Cristalização', icon: '✨', category: 'Automotivo', provider: 'BrilhoAuto', rating: 4.8, creditCost: 80, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 160.00, relatedProductIds: [] },
  { id: 603, name: 'Higienização Interna', icon: '🧼', category: 'Automotivo', provider: 'InteriorClean', rating: 4.5, creditCost: 45, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 80.00, relatedProductIds: [] },
  { id: 604, name: 'Instalação de Som Automotivo', icon: '🔊', category: 'Automotivo', provider: 'SomCar', rating: 4.6, creditCost: 90, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 180.00, relatedProductIds: [] },
  { id: 605, name: 'Elétrica Automotiva', icon: '⚡', category: 'Automotivo', provider: 'AutoEletric', rating: 4.5, creditCost: 75, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 150.00, relatedProductIds: [] },
  { id: 606, name: 'Instalação de Película', icon: '🪟', category: 'Automotivo', provider: 'FilmCar', rating: 4.7, creditCost: 60, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 110.00, relatedProductIds: [] },
  { id: 607, name: 'Troca de Pastilhas de Freio', icon: '🛑', category: 'Automotivo', provider: 'FreioSafe', rating: 4.8, creditCost: 55, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 100.00, relatedProductIds: [] },
  { id: 608, name: 'Diagnóstico Computadorizado', icon: '💻', category: 'Automotivo', provider: 'ScanCar', rating: 4.6, creditCost: 40, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 70.00, relatedProductIds: [] },
  { id: 609, name: 'Martelinho de Ouro', icon: '🔨', category: 'Automotivo', provider: 'DentFix', rating: 4.7, creditCost: 70, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 130.00, relatedProductIds: [] },
  { id: 610, name: 'Pintura Automotiva', icon: '🎨', category: 'Automotivo', provider: 'PintaCar', rating: 4.5, creditCost: 200, minMonths: 4, minPlan: 'ouro', allowComplement: true, monetaryValue: 400.00, relatedProductIds: [] },
  { id: 611, name: 'Envelopamento Automotivo', icon: '🚗', category: 'Automotivo', provider: 'WrapDesign', rating: 4.8, creditCost: 250, minMonths: 4, minPlan: 'ouro', allowComplement: true, monetaryValue: 500.00, relatedProductIds: [] },
  { id: 612, name: 'Borracheiro Móvel', icon: '🔧', category: 'Automotivo', provider: 'PneuFix', rating: 4.4, creditCost: 35, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 60.00, relatedProductIds: [] },
  { id: 613, name: 'Guincho / Reboque', icon: '🚛', category: 'Automotivo', provider: 'SocorroJá', rating: 4.6, creditCost: 80, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 150.00, relatedProductIds: [] },
  { id: 614, name: 'Instalação de Rastreador', icon: '📡', category: 'Automotivo', provider: 'TrackCar', rating: 4.7, creditCost: 70, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 130.00, relatedProductIds: [] },
  { id: 615, name: 'Revisão Completa', icon: '🔍', category: 'Automotivo', provider: 'CheckupAuto', rating: 4.8, creditCost: 120, minMonths: 3, minPlan: 'prata', allowComplement: true, monetaryValue: 240.00, relatedProductIds: [] },
  { id: 616, name: 'Recarga de Ar Condicionado', icon: '❄️', category: 'Automotivo', provider: 'ClimaAuto', rating: 4.5, creditCost: 55, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 100.00, relatedProductIds: [] },

  // ────────────────────────────────────────────────
  // 7. DIGITAL & CRIATIVO (expandido para 20)
  // ────────────────────────────────────────────────
  { id: 3, name: 'Designer Gráfico', icon: '🎨', category: 'Digital & Criativo', provider: 'Ana Design', rating: 4.8, creditCost: 100, minMonths: 3, minPlan: 'prata', allowComplement: true, monetaryValue: 200.00, relatedProductIds: [] },
  { id: 6, name: 'Fotógrafo de Eventos', icon: '📸', category: 'Digital & Criativo', provider: 'Lucas Foto', rating: 4.9, creditCost: 180, minMonths: 6, minPlan: 'ouro', allowComplement: false, monetaryValue: 350.00, relatedProductIds: [] },
  { id: 700, name: 'Social Media Manager', icon: '📱', category: 'Digital & Criativo', provider: 'SocialPro', rating: 4.7, creditCost: 90, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 180.00, relatedProductIds: [] },
  { id: 701, name: 'Editor de Vídeo', icon: '🎬', category: 'Digital & Criativo', provider: 'CutMaster', rating: 4.8, creditCost: 120, minMonths: 3, minPlan: 'prata', allowComplement: true, monetaryValue: 240.00, relatedProductIds: [] },
  { id: 702, name: 'Desenvolvedor de Sites', icon: '💻', category: 'Digital & Criativo', provider: 'WebDev MEI', rating: 4.9, creditCost: 200, minMonths: 3, minPlan: 'ouro', allowComplement: true, monetaryValue: 400.00, relatedProductIds: [] },
  { id: 703, name: 'Copywriter', icon: '✍️', category: 'Digital & Criativo', provider: 'TextoPro', rating: 4.6, creditCost: 70, minMonths: 2, minPlan: 'bronze', allowComplement: true, monetaryValue: 130.00, relatedProductIds: [] },
  { id: 704, name: 'Gestor de Tráfego Pago', icon: '📊', category: 'Digital & Criativo', provider: 'AdsManager', rating: 4.8, creditCost: 150, minMonths: 3, minPlan: 'prata', allowComplement: true, monetaryValue: 300.00, relatedProductIds: [] },
  { id: 705, name: 'Criador de Conteúdo', icon: '🎥', category: 'Digital & Criativo', provider: 'ContentLab', rating: 4.7, creditCost: 80, minMonths: 2, minPlan: 'bronze', allowComplement: true, monetaryValue: 160.00, relatedProductIds: [] },
  { id: 706, name: 'Assistente Virtual', icon: '🤖', category: 'Digital & Criativo', provider: 'VirtualPro', rating: 4.5, creditCost: 50, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 90.00, relatedProductIds: [] },
  { id: 707, name: 'SEO Specialist', icon: '🔍', category: 'Digital & Criativo', provider: 'RankUp', rating: 4.7, creditCost: 110, minMonths: 3, minPlan: 'prata', allowComplement: true, monetaryValue: 220.00, relatedProductIds: [] },
  { id: 708, name: 'Ilustrador Digital', icon: '🖌️', category: 'Digital & Criativo', provider: 'PixelArt', rating: 4.8, creditCost: 90, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 180.00, relatedProductIds: [] },
  { id: 709, name: 'Motion Designer', icon: '🎞️', category: 'Digital & Criativo', provider: 'MotionLab', rating: 4.6, creditCost: 130, minMonths: 3, minPlan: 'prata', allowComplement: true, monetaryValue: 260.00, relatedProductIds: [] },
  { id: 710, name: 'Locutor / Narrador', icon: '🎙️', category: 'Digital & Criativo', provider: 'VozPro', rating: 4.7, creditCost: 60, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 110.00, relatedProductIds: [] },
  { id: 711, name: 'Tradutor Freelance', icon: '🌐', category: 'Digital & Criativo', provider: 'TraduçãoJá', rating: 4.5, creditCost: 55, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 100.00, relatedProductIds: [] },
  { id: 712, name: 'UI/UX Designer', icon: '📐', category: 'Digital & Criativo', provider: 'DesignFlow', rating: 4.9, creditCost: 140, minMonths: 3, minPlan: 'prata', allowComplement: true, monetaryValue: 280.00, relatedProductIds: [] },
  { id: 713, name: 'Podcast Producer', icon: '🎧', category: 'Digital & Criativo', provider: 'PodStudio', rating: 4.6, creditCost: 100, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 200.00, relatedProductIds: [] },
  { id: 714, name: 'Fotógrafo de Produto', icon: '📷', category: 'Digital & Criativo', provider: 'ClickPro', rating: 4.8, creditCost: 70, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 130.00, relatedProductIds: [] },
  { id: 715, name: 'Desenvolvimento de App', icon: '📱', category: 'Digital & Criativo', provider: 'AppDev MEI', rating: 4.9, creditCost: 250, minMonths: 4, minPlan: 'ouro', allowComplement: true, monetaryValue: 500.00, relatedProductIds: [] },
  { id: 716, name: 'Suporte de TI Remoto', icon: '🖥️', category: 'Digital & Criativo', provider: 'TechHelp', rating: 4.5, creditCost: 45, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 80.00, relatedProductIds: [] },
  { id: 717, name: 'Community Manager', icon: '👥', category: 'Digital & Criativo', provider: 'CommunityPro', rating: 4.6, creditCost: 75, minMonths: 2, minPlan: 'bronze', allowComplement: true, monetaryValue: 140.00, relatedProductIds: [] },

  // ────────────────────────────────────────────────
  // 8. TECNOLOGIA & INFORMÁTICA (20 serviços) — NOVO
  // ────────────────────────────────────────────────
  { id: 800, name: 'Formatação de Computador', icon: '💻', category: 'Tecnologia & Informática', provider: 'FormatPC', rating: 4.6, creditCost: 40, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 70.00, relatedProductIds: [] },
  { id: 801, name: 'Manutenção de Notebook', icon: '🔧', category: 'Tecnologia & Informática', provider: 'NoteFix', rating: 4.7, creditCost: 55, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 100.00, relatedProductIds: [] },
  { id: 802, name: 'Instalação de Rede Wi-Fi', icon: '📶', category: 'Tecnologia & Informática', provider: 'NetSetup', rating: 4.8, creditCost: 60, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 110.00, relatedProductIds: [] },
  { id: 803, name: 'Configuração de Impressora', icon: '🖨️', category: 'Tecnologia & Informática', provider: 'PrintHelp', rating: 4.4, creditCost: 30, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 55.00, relatedProductIds: [] },
  { id: 804, name: 'Recuperação de Dados', icon: '💾', category: 'Tecnologia & Informática', provider: 'DataRescue', rating: 4.9, creditCost: 120, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 240.00, relatedProductIds: [] },
  { id: 805, name: 'Montagem de PC Gamer', icon: '🎮', category: 'Tecnologia & Informática', provider: 'GameBuild', rating: 4.8, creditCost: 80, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 160.00, relatedProductIds: [] },
  { id: 806, name: 'Instalação de CFTV', icon: '📹', category: 'Tecnologia & Informática', provider: 'VigiTech', rating: 4.7, creditCost: 100, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 200.00, relatedProductIds: [] },
  { id: 807, name: 'Conserto de Celular', icon: '📱', category: 'Tecnologia & Informática', provider: 'CellFix', rating: 4.6, creditCost: 50, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 90.00, relatedProductIds: [] },
  { id: 808, name: 'Troca de Tela de Celular', icon: '🔲', category: 'Tecnologia & Informática', provider: 'ScreenNew', rating: 4.7, creditCost: 65, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 120.00, relatedProductIds: [] },
  { id: 809, name: 'Backup em Nuvem', icon: '☁️', category: 'Tecnologia & Informática', provider: 'CloudSafe', rating: 4.5, creditCost: 35, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 60.00, relatedProductIds: [] },
  { id: 810, name: 'Configuração Smart TV', icon: '📺', category: 'Tecnologia & Informática', provider: 'TVSetup', rating: 4.4, creditCost: 30, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 55.00, relatedProductIds: [] },
  { id: 811, name: 'Suporte Office 365', icon: '📊', category: 'Tecnologia & Informática', provider: 'OfficePro', rating: 4.5, creditCost: 40, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 70.00, relatedProductIds: [] },
  { id: 812, name: 'Criação de E-commerce', icon: '🛒', category: 'Tecnologia & Informática', provider: 'ShopBuilder', rating: 4.8, creditCost: 200, minMonths: 3, minPlan: 'ouro', allowComplement: true, monetaryValue: 400.00, relatedProductIds: [] },
  { id: 813, name: 'Automação com IA', icon: '🤖', category: 'Tecnologia & Informática', provider: 'AIAutomate', rating: 4.9, creditCost: 180, minMonths: 3, minPlan: 'ouro', allowComplement: true, monetaryValue: 360.00, relatedProductIds: [] },
  { id: 814, name: 'Consultoria de Cibersegurança', icon: '🔒', category: 'Tecnologia & Informática', provider: 'CyberShield', rating: 4.7, creditCost: 150, minMonths: 3, minPlan: 'prata', allowComplement: true, monetaryValue: 300.00, relatedProductIds: [] },
  { id: 815, name: 'Instalação de Home Office', icon: '🏠', category: 'Tecnologia & Informática', provider: 'OfficeSetup', rating: 4.6, creditCost: 70, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 130.00, relatedProductIds: [] },
  { id: 816, name: 'Aulas de Informática', icon: '🎓', category: 'Tecnologia & Informática', provider: 'TechLearn', rating: 4.5, creditCost: 45, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 80.00, relatedProductIds: [] },
  { id: 817, name: 'Conserto de Videogame', icon: '🎮', category: 'Tecnologia & Informática', provider: 'GameFix', rating: 4.4, creditCost: 55, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 100.00, relatedProductIds: [] },
  { id: 818, name: 'Instalação de Alarme', icon: '🚨', category: 'Tecnologia & Informática', provider: 'AlarmePro', rating: 4.6, creditCost: 85, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 170.00, relatedProductIds: [] },
  { id: 819, name: 'Consultoria em Planilhas', icon: '📈', category: 'Tecnologia & Informática', provider: 'ExcelMaster', rating: 4.5, creditCost: 50, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 90.00, relatedProductIds: [] },

  // ────────────────────────────────────────────────
  // 9. EDUCAÇÃO & CURSOS (20 serviços) — NOVO
  // ────────────────────────────────────────────────
  { id: 900, name: 'Professor Particular — Matemática', icon: '📐', category: 'Educação & Cursos', provider: 'MatFácil', rating: 4.8, creditCost: 45, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 80.00, relatedProductIds: [] },
  { id: 901, name: 'Professor Particular — Inglês', icon: '🇺🇸', category: 'Educação & Cursos', provider: 'EnglishNow', rating: 4.9, creditCost: 50, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 90.00, relatedProductIds: [] },
  { id: 902, name: 'Professor Particular — Espanhol', icon: '🇪🇸', category: 'Educação & Cursos', provider: 'HablaBien', rating: 4.6, creditCost: 45, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 80.00, relatedProductIds: [] },
  { id: 903, name: 'Reforço Escolar — Fundamental', icon: '📚', category: 'Educação & Cursos', provider: 'ReforçoKids', rating: 4.7, creditCost: 40, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 70.00, relatedProductIds: [] },
  { id: 904, name: 'Preparatório ENEM', icon: '🎯', category: 'Educação & Cursos', provider: 'ENEMPro', rating: 4.8, creditCost: 60, minMonths: 2, minPlan: 'bronze', allowComplement: true, monetaryValue: 110.00, relatedProductIds: [] },
  { id: 905, name: 'Preparatório Concursos', icon: '📋', category: 'Educação & Cursos', provider: 'ConcursoTop', rating: 4.7, creditCost: 70, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 130.00, relatedProductIds: [] },
  { id: 906, name: 'Aulas de Música — Violão', icon: '🎸', category: 'Educação & Cursos', provider: 'MúsicaViva', rating: 4.8, creditCost: 45, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 80.00, relatedProductIds: [] },
  { id: 907, name: 'Aulas de Música — Piano', icon: '🎹', category: 'Educação & Cursos', provider: 'PianoClass', rating: 4.7, creditCost: 55, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 100.00, relatedProductIds: [] },
  { id: 908, name: 'Curso de Culinária', icon: '👨‍🍳', category: 'Educação & Cursos', provider: 'ChefEmCasa', rating: 4.9, creditCost: 60, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 110.00, relatedProductIds: [] },
  { id: 909, name: 'Curso de Confeitaria', icon: '🎂', category: 'Educação & Cursos', provider: 'DoceArte', rating: 4.8, creditCost: 55, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 100.00, relatedProductIds: [] },
  { id: 910, name: 'Curso de Costura', icon: '🧵', category: 'Educação & Cursos', provider: 'CosturaCriativa', rating: 4.5, creditCost: 50, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 90.00, relatedProductIds: [] },
  { id: 911, name: 'Aulas de Natação', icon: '🏊', category: 'Educação & Cursos', provider: 'AquaNado', rating: 4.7, creditCost: 55, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 100.00, relatedProductIds: [] },
  { id: 912, name: 'Autoescola — Aulas Práticas', icon: '🚗', category: 'Educação & Cursos', provider: 'DireitoDirigir', rating: 4.4, creditCost: 80, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 160.00, relatedProductIds: [] },
  { id: 913, name: 'Curso de Marketing Digital', icon: '📣', category: 'Educação & Cursos', provider: 'DigitalSchool', rating: 4.8, creditCost: 90, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 180.00, relatedProductIds: [] },
  { id: 914, name: 'Curso de Excel Avançado', icon: '📊', category: 'Educação & Cursos', provider: 'ExcelPro', rating: 4.6, creditCost: 50, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 90.00, relatedProductIds: [] },
  { id: 915, name: 'Mentoria de Carreira', icon: '🚀', category: 'Educação & Cursos', provider: 'CarreiraPro', rating: 4.9, creditCost: 100, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 200.00, relatedProductIds: [] },
  { id: 916, name: 'Curso de Fotografia', icon: '📷', category: 'Educação & Cursos', provider: 'FotoAcademy', rating: 4.7, creditCost: 65, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 120.00, relatedProductIds: [] },
  { id: 917, name: 'Aulas de Desenho', icon: '✏️', category: 'Educação & Cursos', provider: 'ArteViva', rating: 4.6, creditCost: 40, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 70.00, relatedProductIds: [] },
  { id: 918, name: 'Curso de Programação', icon: '💻', category: 'Educação & Cursos', provider: 'CodeStart', rating: 4.8, creditCost: 80, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 160.00, relatedProductIds: [] },
  { id: 919, name: 'Curso de Primeiros Socorros', icon: '🩹', category: 'Educação & Cursos', provider: 'SalvaVida', rating: 4.7, creditCost: 45, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 80.00, relatedProductIds: [] },

  // ────────────────────────────────────────────────
  // 10. PET & ANIMAIS (20 serviços) — NOVO
  // ────────────────────────────────────────────────
  { id: 1000, name: 'Banho & Tosa', icon: '🐕', category: 'Pet & Animais', provider: 'PetClean', rating: 4.7, creditCost: 35, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 60.00, relatedProductIds: [] },
  { id: 1001, name: 'Veterinário Domiciliar', icon: '🏥', category: 'Pet & Animais', provider: 'VetHome', rating: 4.9, creditCost: 80, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 150.00, relatedProductIds: [] },
  { id: 1002, name: 'Dog Walker', icon: '🦮', category: 'Pet & Animais', provider: 'WalkDog', rating: 4.6, creditCost: 25, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 45.00, relatedProductIds: [] },
  { id: 1003, name: 'Adestramento', icon: '🎓', category: 'Pet & Animais', provider: 'PetSchool', rating: 4.8, creditCost: 70, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 130.00, relatedProductIds: [] },
  { id: 1004, name: 'Pet Sitter (Hospedagem)', icon: '🏠', category: 'Pet & Animais', provider: 'PetStay', rating: 4.7, creditCost: 50, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 90.00, relatedProductIds: [] },
  { id: 1005, name: 'Creche para Pets', icon: '🐾', category: 'Pet & Animais', provider: 'DayCare Pet', rating: 4.5, creditCost: 40, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 70.00, relatedProductIds: [] },
  { id: 1006, name: 'Tosa Artística', icon: '✂️', category: 'Pet & Animais', provider: 'PetStyle', rating: 4.8, creditCost: 55, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 100.00, relatedProductIds: [] },
  { id: 1007, name: 'Vacinação Pet', icon: '💉', category: 'Pet & Animais', provider: 'VacinaPet', rating: 4.9, creditCost: 45, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 80.00, relatedProductIds: [] },
  { id: 1008, name: 'Nutricionista Animal', icon: '🥩', category: 'Pet & Animais', provider: 'NutriPet', rating: 4.6, creditCost: 60, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 110.00, relatedProductIds: [] },
  { id: 1009, name: 'Transporte Pet', icon: '🚗', category: 'Pet & Animais', provider: 'PetTaxi', rating: 4.4, creditCost: 30, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 55.00, relatedProductIds: [] },
  { id: 1010, name: 'Fisioterapia Animal', icon: '🐕‍🦺', category: 'Pet & Animais', provider: 'FisioPet', rating: 4.7, creditCost: 90, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 180.00, relatedProductIds: [] },
  { id: 1011, name: 'Acupuntura Veterinária', icon: '📍', category: 'Pet & Animais', provider: 'AcuPet', rating: 4.5, creditCost: 75, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 140.00, relatedProductIds: [] },
  { id: 1012, name: 'Fotógrafo de Pets', icon: '📸', category: 'Pet & Animais', provider: 'PetClick', rating: 4.8, creditCost: 55, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 100.00, relatedProductIds: [] },
  { id: 1013, name: 'Castração — Clínica Parceira', icon: '🏥', category: 'Pet & Animais', provider: 'CastraPet', rating: 4.6, creditCost: 100, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 200.00, relatedProductIds: [] },
  { id: 1014, name: 'Limpeza Dental Pet', icon: '🦷', category: 'Pet & Animais', provider: 'DentePet', rating: 4.5, creditCost: 65, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 120.00, relatedProductIds: [] },
  { id: 1015, name: 'Dermatologista Veterinário', icon: '🧴', category: 'Pet & Animais', provider: 'DermaPet', rating: 4.7, creditCost: 85, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 170.00, relatedProductIds: [] },
  { id: 1016, name: 'Exames Laboratoriais Pet', icon: '🔬', category: 'Pet & Animais', provider: 'LabPet', rating: 4.6, creditCost: 50, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 90.00, relatedProductIds: [] },
  { id: 1017, name: 'Comportamentalista Animal', icon: '🧠', category: 'Pet & Animais', provider: 'PetMind', rating: 4.8, creditCost: 80, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 160.00, relatedProductIds: [] },
  { id: 1018, name: 'Aquarismo — Montagem', icon: '🐠', category: 'Pet & Animais', provider: 'AquaDesign', rating: 4.5, creditCost: 70, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 130.00, relatedProductIds: [] },
  { id: 1019, name: 'Pet Shop Delivery', icon: '🛒', category: 'Pet & Animais', provider: 'PetEntrega', rating: 4.4, creditCost: 20, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 35.00, relatedProductIds: [] },

  // ────────────────────────────────────────────────
  // 11. EVENTOS & FESTAS (20 serviços) — NOVO
  // ────────────────────────────────────────────────
  { id: 1100, name: 'Buffet para Festas', icon: '🍰', category: 'Eventos & Festas', provider: 'SaborFesta', rating: 4.8, creditCost: 200, minMonths: 3, minPlan: 'ouro', allowComplement: true, monetaryValue: 400.00, relatedProductIds: [] },
  { id: 1101, name: 'DJ para Eventos', icon: '🎧', category: 'Eventos & Festas', provider: 'DJBeat', rating: 4.7, creditCost: 150, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 300.00, relatedProductIds: [] },
  { id: 1102, name: 'Decoração de Festas', icon: '🎈', category: 'Eventos & Festas', provider: 'FestaDécor', rating: 4.9, creditCost: 120, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 240.00, relatedProductIds: [] },
  { id: 1103, name: 'Garçom para Eventos', icon: '🍽️', category: 'Eventos & Festas', provider: 'ServiçoFino', rating: 4.6, creditCost: 60, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 110.00, relatedProductIds: [] },
  { id: 1104, name: 'Brinquedos Infláveis', icon: '🏰', category: 'Eventos & Festas', provider: 'PulaPula', rating: 4.5, creditCost: 80, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 150.00, relatedProductIds: [] },
  { id: 1105, name: 'Animador de Festa Infantil', icon: '🤡', category: 'Eventos & Festas', provider: 'AlegriaKids', rating: 4.8, creditCost: 70, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 130.00, relatedProductIds: [] },
  { id: 1106, name: 'Fotógrafo de Festa', icon: '📸', category: 'Eventos & Festas', provider: 'ClickFesta', rating: 4.9, creditCost: 130, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 260.00, relatedProductIds: [] },
  { id: 1107, name: 'Cerimonialista', icon: '📜', category: 'Eventos & Festas', provider: 'EventoPro', rating: 4.7, creditCost: 180, minMonths: 3, minPlan: 'ouro', allowComplement: true, monetaryValue: 360.00, relatedProductIds: [] },
  { id: 1108, name: 'Bartender para Eventos', icon: '🍸', category: 'Eventos & Festas', provider: 'DrinkMaster', rating: 4.8, creditCost: 90, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 180.00, relatedProductIds: [] },
  { id: 1109, name: 'Banda Musical', icon: '🎵', category: 'Eventos & Festas', provider: 'BandaShow', rating: 4.7, creditCost: 250, minMonths: 4, minPlan: 'ouro', allowComplement: true, monetaryValue: 500.00, relatedProductIds: [] },
  { id: 1110, name: 'Aluguel de Cadeiras e Mesas', icon: '🪑', category: 'Eventos & Festas', provider: 'LocaFesta', rating: 4.4, creditCost: 40, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 70.00, relatedProductIds: [] },
  { id: 1111, name: 'Confeiteira — Bolos Personalizados', icon: '🎂', category: 'Eventos & Festas', provider: 'DoceEncanto', rating: 4.9, creditCost: 100, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 200.00, relatedProductIds: [] },
  { id: 1112, name: 'Iluminação para Eventos', icon: '💡', category: 'Eventos & Festas', provider: 'LuzShow', rating: 4.6, creditCost: 110, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 220.00, relatedProductIds: [] },
  { id: 1113, name: 'Aluguel de Espaço', icon: '🏢', category: 'Eventos & Festas', provider: 'EspaçoFesta', rating: 4.5, creditCost: 150, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 300.00, relatedProductIds: [] },
  { id: 1114, name: 'Churrasqueiro', icon: '🥩', category: 'Eventos & Festas', provider: 'ChurrasPro', rating: 4.8, creditCost: 80, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 150.00, relatedProductIds: [] },
  { id: 1115, name: 'Cabine Fotográfica', icon: '📷', category: 'Eventos & Festas', provider: 'PhotoBooth BR', rating: 4.7, creditCost: 90, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 180.00, relatedProductIds: [] },
  { id: 1116, name: 'Pipoqueiro / Algodão Doce', icon: '🍿', category: 'Eventos & Festas', provider: 'DoceShow', rating: 4.5, creditCost: 35, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 60.00, relatedProductIds: [] },
  { id: 1117, name: 'Segurança para Eventos', icon: '🛡️', category: 'Eventos & Festas', provider: 'GuardaEvento', rating: 4.6, creditCost: 100, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 200.00, relatedProductIds: [] },
  { id: 1118, name: 'Convites Personalizados', icon: '💌', category: 'Eventos & Festas', provider: 'ConviteArt', rating: 4.7, creditCost: 30, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 55.00, relatedProductIds: [] },
  { id: 1119, name: 'Mágico para Eventos', icon: '🎩', category: 'Eventos & Festas', provider: 'MagiaPura', rating: 4.8, creditCost: 85, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 170.00, relatedProductIds: [] },

  // ────────────────────────────────────────────────
  // 12. MÚSICA (20 serviços) — NOVO
  // ────────────────────────────────────────────────
  { id: 1200, name: 'Aula de Violão', icon: '🎸', category: 'Música', provider: 'ViolãoMaster', rating: 4.8, creditCost: 45, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 80.00, relatedProductIds: [] },
  { id: 1201, name: 'Aula de Guitarra', icon: '🎸', category: 'Música', provider: 'GuitarPro', rating: 4.7, creditCost: 50, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 90.00, relatedProductIds: [] },
  { id: 1202, name: 'Aula de Piano / Teclado', icon: '🎹', category: 'Música', provider: 'PianoClass', rating: 4.9, creditCost: 55, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 100.00, relatedProductIds: [] },
  { id: 1203, name: 'Aula de Bateria', icon: '🥁', category: 'Música', provider: 'DrumBeat', rating: 4.6, creditCost: 55, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 100.00, relatedProductIds: [] },
  { id: 1204, name: 'Aula de Baixo Elétrico', icon: '🎸', category: 'Música', provider: 'BassLine', rating: 4.5, creditCost: 50, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 90.00, relatedProductIds: [] },
  { id: 1205, name: 'Aula de Canto / Vocal Coach', icon: '🎤', category: 'Música', provider: 'VocalPro', rating: 4.9, creditCost: 60, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 110.00, relatedProductIds: [] },
  { id: 1206, name: 'Aula de Ukulele', icon: '🪕', category: 'Música', provider: 'UkeFun', rating: 4.7, creditCost: 40, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 70.00, relatedProductIds: [] },
  { id: 1207, name: 'Aula de Violino', icon: '🎻', category: 'Música', provider: 'ViolinArte', rating: 4.8, creditCost: 65, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 120.00, relatedProductIds: [] },
  { id: 1208, name: 'Aula de Saxofone', icon: '🎷', category: 'Música', provider: 'SaxMaster', rating: 4.6, creditCost: 60, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 110.00, relatedProductIds: [] },
  { id: 1209, name: 'Aula de Flauta Transversal', icon: '🪈', category: 'Música', provider: 'FlautaPro', rating: 4.5, creditCost: 50, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 90.00, relatedProductIds: [] },
  { id: 1210, name: 'Aula de Acordeão / Sanfona', icon: '🪗', category: 'Música', provider: 'SanfonaViva', rating: 4.7, creditCost: 55, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 100.00, relatedProductIds: [] },
  { id: 1211, name: 'Produção Musical / Home Studio', icon: '🎧', category: 'Música', provider: 'BeatMaker', rating: 4.8, creditCost: 100, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 200.00, relatedProductIds: [] },
  { id: 1212, name: 'Aula de DJ / Mixagem', icon: '🎧', category: 'Música', provider: 'DJSchool', rating: 4.7, creditCost: 80, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 160.00, relatedProductIds: [] },
  { id: 1213, name: 'Teoria Musical e Harmonia', icon: '🎼', category: 'Música', provider: 'MúsicaTeoria', rating: 4.6, creditCost: 40, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 70.00, relatedProductIds: [] },
  { id: 1214, name: 'Afinação e Manutenção de Piano', icon: '🎹', category: 'Música', provider: 'AfinaPiano', rating: 4.9, creditCost: 90, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 180.00, relatedProductIds: [] },
  { id: 1215, name: 'Músico para Eventos', icon: '🎵', category: 'Música', provider: 'ShowBand', rating: 4.8, creditCost: 150, minMonths: 3, minPlan: 'prata', allowComplement: true, monetaryValue: 300.00, relatedProductIds: [] },
  { id: 1216, name: 'Gravação em Estúdio', icon: '🎙️', category: 'Música', provider: 'StudioRec', rating: 4.7, creditCost: 120, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 240.00, relatedProductIds: [] },
  { id: 1217, name: 'Mixagem e Masterização', icon: '🔊', category: 'Música', provider: 'MixMaster', rating: 4.8, creditCost: 130, minMonths: 3, minPlan: 'prata', allowComplement: true, monetaryValue: 260.00, relatedProductIds: [] },
  { id: 1218, name: 'Aula de Percussão / Cajon', icon: '🥁', category: 'Música', provider: 'PercussãoBR', rating: 4.6, creditCost: 45, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 80.00, relatedProductIds: [] },
  { id: 1219, name: 'Sonorização de Eventos', icon: '🔈', category: 'Música', provider: 'SomTotal', rating: 4.7, creditCost: 110, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 220.00, relatedProductIds: [] },

  // ────────────────────────────────────────────────
  // 13. NATUREZA & VIDA NATURAL (20 serviços) — NOVO
  // ────────────────────────────────────────────────
  { id: 1300, name: 'Jardinagem Orgânica', icon: '🌱', category: 'Natureza & Vida Natural', provider: 'HortaViva', rating: 4.8, creditCost: 50, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 90.00, relatedProductIds: [] },
  { id: 1301, name: 'Montagem de Horta Urbana', icon: '🥬', category: 'Natureza & Vida Natural', provider: 'UrbanGreen', rating: 4.9, creditCost: 70, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 130.00, relatedProductIds: [] },
  { id: 1302, name: 'Paisagismo Sustentável', icon: '🌳', category: 'Natureza & Vida Natural', provider: 'EcoPaisagem', rating: 4.7, creditCost: 120, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 240.00, relatedProductIds: [] },
  { id: 1303, name: 'Jardineiro — Manutenção Mensal', icon: '🌿', category: 'Natureza & Vida Natural', provider: 'JardimFeliz', rating: 4.6, creditCost: 40, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 70.00, relatedProductIds: [] },
  { id: 1304, name: 'Poda e Topiaria Artística', icon: '✂️', category: 'Natureza & Vida Natural', provider: 'ArtVerde', rating: 4.5, creditCost: 65, minMonths: 2, minPlan: 'bronze', allowComplement: true, monetaryValue: 120.00, relatedProductIds: [] },
  { id: 1305, name: 'Compostagem Doméstica', icon: '♻️', category: 'Natureza & Vida Natural', provider: 'CompostaBR', rating: 4.7, creditCost: 45, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 80.00, relatedProductIds: [] },
  { id: 1306, name: 'Alimentação Natural — Consulta', icon: '🥗', category: 'Natureza & Vida Natural', provider: 'NutriNatural', rating: 4.9, creditCost: 65, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 120.00, relatedProductIds: [] },
  { id: 1307, name: 'Chef de Comida Natural / Vegana', icon: '👨‍🍳', category: 'Natureza & Vida Natural', provider: 'ChefVerde', rating: 4.8, creditCost: 80, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 160.00, relatedProductIds: [] },
  { id: 1308, name: 'Marmita Fit / Natural — Delivery', icon: '🍱', category: 'Natureza & Vida Natural', provider: 'FitFood', rating: 4.7, creditCost: 35, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 60.00, relatedProductIds: [] },
  { id: 1309, name: 'Fitoterapia — Consulta', icon: '🌿', category: 'Natureza & Vida Natural', provider: 'FitoSaúde', rating: 4.8, creditCost: 60, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 110.00, relatedProductIds: [] },
  { id: 1310, name: 'Manipulação de Fitoterápicos', icon: '💊', category: 'Natureza & Vida Natural', provider: 'HerbFarmácia', rating: 4.6, creditCost: 50, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 90.00, relatedProductIds: [] },
  { id: 1311, name: 'Aromaterapia Clínica', icon: '🌸', category: 'Natureza & Vida Natural', provider: 'AromaVida', rating: 4.7, creditCost: 55, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 100.00, relatedProductIds: [] },
  { id: 1312, name: 'Naturopatia — Consulta', icon: '🍃', category: 'Natureza & Vida Natural', provider: 'NaturoVita', rating: 4.5, creditCost: 70, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 130.00, relatedProductIds: [] },
  { id: 1313, name: 'Cultivo de Plantas Medicinais', icon: '🌱', category: 'Natureza & Vida Natural', provider: 'PlantaMedic', rating: 4.8, creditCost: 45, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 80.00, relatedProductIds: [] },
  { id: 1314, name: 'Apicultura Urbana', icon: '🐝', category: 'Natureza & Vida Natural', provider: 'MelUrbano', rating: 4.6, creditCost: 90, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 180.00, relatedProductIds: [] },
  { id: 1315, name: 'Irrigação Automatizada', icon: '💧', category: 'Natureza & Vida Natural', provider: 'AquaJardim', rating: 4.7, creditCost: 100, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 200.00, relatedProductIds: [] },
  { id: 1316, name: 'Curso de Permacultura', icon: '🌍', category: 'Natureza & Vida Natural', provider: 'PermaVida', rating: 4.9, creditCost: 80, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 160.00, relatedProductIds: [] },
  { id: 1317, name: 'Terapia Floral de Bach', icon: '🌺', category: 'Natureza & Vida Natural', provider: 'FloralVida', rating: 4.6, creditCost: 50, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 90.00, relatedProductIds: [] },
  { id: 1318, name: 'Desidratação de Alimentos', icon: '🍎', category: 'Natureza & Vida Natural', provider: 'NaturalDry', rating: 4.5, creditCost: 40, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 70.00, relatedProductIds: [] },
  { id: 1319, name: 'Jardim Vertical — Instalação', icon: '🌿', category: 'Natureza & Vida Natural', provider: 'VertGreen', rating: 4.8, creditCost: 110, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 220.00, relatedProductIds: [] },
];

/* ─── PROFISSIONAIS MEI POR SEGMENTO ─── */
export interface MeiProfessional {
  id: number;
  name: string;
  segment: string;
  specialty: string;
  rating: number;
  completedJobs: number;
  city: string;
  avatar: string;
  ownProducts: ProductItem[];
  dropshippingProducts: ProductItem[];
}

// Helper to generate products for MEIs
const createOwnProducts = (meiId: number, segment: string, items: Array<{ name: string; price: number; category: string; image: string }>): ProductItem[] =>
  items.map((item, i) => ({
    id: meiId * 1000 + i + 1,
    name: item.name,
    price: item.price,
    category: item.category,
    image: item.image,
    rating: 4.2 + Math.round(Math.random() * 7) / 10,
    supplier: 'Estoque Próprio',
    relatedServiceIds: [],
  }));

const createDropProducts = (meiId: number, segment: string, items: Array<{ name: string; price: number; category: string; image: string; platform: string }>): ProductItem[] =>
  items.map((item, i) => ({
    id: meiId * 1000 + 100 + i + 1,
    name: item.name,
    price: item.price,
    category: item.category,
    image: item.image,
    rating: 4.0 + Math.round(Math.random() * 9) / 10,
    supplier: `Dropshipping — ${item.platform}`,
    relatedServiceIds: [],
  }));

export const meiProfessionals: MeiProfessional[] = [
  // ══════════════════════════════════════════
  // MANUTENÇÃO & REPAROS — 10 MEIs
  // ══════════════════════════════════════════
  ...[
    { id: 1, name: 'João Silva — Eletricista', specialty: 'Elétrica Residencial e Predial', city: 'São Paulo, SP' },
    { id: 2, name: 'Pedro Santos — Encanador', specialty: 'Hidráulica e Gás', city: 'Rio de Janeiro, RJ' },
    { id: 3, name: 'Carlos Oliveira — Marceneiro', specialty: 'Montagem e Reparos em Madeira', city: 'Belo Horizonte, MG' },
    { id: 4, name: 'Marcos Pereira — Pintor', specialty: 'Pintura Interna e Externa', city: 'Curitiba, PR' },
    { id: 5, name: 'André Costa — Gesseiro', specialty: 'Forro e Drywall', city: 'Salvador, BA' },
    { id: 6, name: 'Roberto Lima — Serralheiro', specialty: 'Grades e Portões', city: 'Brasília, DF' },
    { id: 7, name: 'Antônio Souza — Vidraceiro', specialty: 'Box e Janelas', city: 'Fortaleza, CE' },
    { id: 8, name: 'Fernando Rocha — Pedreiro', specialty: 'Reformas Residenciais', city: 'Porto Alegre, RS' },
    { id: 9, name: 'Lucas Almeida — Chaveiro', specialty: 'Fechaduras e Cofres', city: 'Recife, PE' },
    { id: 10, name: 'Ricardo Ferreira — Climatização', specialty: 'Ar Condicionado e Aquecedores', city: 'Goiânia, GO' },
  ].map(mei => ({
    ...mei,
    segment: 'Manutenção & Reparos',
    rating: 4.4 + Math.round(Math.random() * 5) / 10,
    completedJobs: 50 + Math.floor(Math.random() * 200),
    avatar: '👷',
    ownProducts: createOwnProducts(mei.id, 'Manutenção', [
      { name: 'Fio Elétrico 2.5mm (100m)', price: 89.90, category: 'Material Elétrico', image: '🔌' },
      { name: 'Kit Tomadas e Interruptores', price: 45.90, category: 'Material Elétrico', image: '💡' },
      { name: 'Fita Isolante Premium 20m', price: 12.90, category: 'Material Elétrico', image: '🛠️' },
      { name: 'Chave de Fenda Isolada', price: 29.90, category: 'Ferramentas', image: '🪛' },
      { name: 'Alicate Universal Profissional', price: 49.90, category: 'Ferramentas', image: '🔧' },
      { name: 'Multímetro Digital', price: 79.90, category: 'Ferramentas', image: '📊' },
      { name: 'Disjuntor 20A', price: 18.90, category: 'Material Elétrico', image: '⚡' },
      { name: 'Caixa de Luz 4x2', price: 3.90, category: 'Material Elétrico', image: '📦' },
      { name: 'Parafusos e Buchas (kit 100pcs)', price: 19.90, category: 'Ferramentas', image: '🔩' },
      { name: 'Canaleta PVC 2m', price: 8.90, category: 'Material Elétrico', image: '📏' },
    ]),
    dropshippingProducts: createDropProducts(mei.id, 'Manutenção', [
      { name: 'Furadeira de Impacto 750W', price: 199.90, category: 'Ferramentas', image: '🔧', platform: 'Mercado Livre' },
      { name: 'Parafusadeira a Bateria 12V', price: 149.90, category: 'Ferramentas', image: '🔩', platform: 'Mercado Livre' },
      { name: 'Trena Laser 40m', price: 89.90, category: 'Ferramentas', image: '📏', platform: 'Shopee' },
      { name: 'Serra Circular 7.1/4"', price: 329.90, category: 'Ferramentas', image: '🪚', platform: 'OLX' },
      { name: 'Nível a Laser 360°', price: 159.90, category: 'Ferramentas', image: '📐', platform: 'Mercado Livre' },
      { name: 'Kit Brocas Aço Rápido 25pcs', price: 49.90, category: 'Ferramentas', image: '🔧', platform: 'Shopee' },
      { name: 'Escada Alumínio 7 Degraus', price: 279.90, category: 'Ferramentas', image: '🪜', platform: 'Mercado Livre' },
      { name: 'Câmera de Segurança WiFi', price: 149.90, category: 'Segurança', image: '📷', platform: 'Shopee' },
      { name: 'Sensor de Presença LED', price: 34.90, category: 'Iluminação', image: '💡', platform: 'OLX' },
      { name: 'Luminária LED Painel 18W', price: 29.90, category: 'Iluminação', image: '💡', platform: 'Mercado Livre' },
    ]),
  })),

  // ══════════════════════════════════════════
  // SAÚDE — 10 MEIs
  // ══════════════════════════════════════════
  ...[
    { id: 20, name: 'Dra. Ana Mendes — Clínica Geral', specialty: 'Teleconsultas e Atestados', city: 'São Paulo, SP' },
    { id: 21, name: 'Dr. Paulo Ribeiro — Dentista', specialty: 'Odontologia Geral e Estética', city: 'Rio de Janeiro, RJ' },
    { id: 22, name: 'Dra. Carla Nunes — Ortodontista', specialty: 'Aparelhos e Alinhadores', city: 'Belo Horizonte, MG' },
    { id: 23, name: 'Dr. Marcos Teixeira — Med. Trabalho', specialty: 'ASO e PCMSO', city: 'Curitiba, PR' },
    { id: 24, name: 'Dra. Juliana Lopes — Psicóloga', specialty: 'Terapia Cognitivo-Comportamental', city: 'Salvador, BA' },
    { id: 25, name: 'Dr. Bruno Cardoso — Fisioterapeuta', specialty: 'Reabilitação e RPG', city: 'Brasília, DF' },
    { id: 26, name: 'Dra. Fernanda Vieira — Nutricionista', specialty: 'Nutrição Esportiva e Clínica', city: 'Fortaleza, CE' },
    { id: 27, name: 'Dra. Patrícia Moura — Oftalmologista', specialty: 'Consultas e Exames', city: 'Porto Alegre, RS' },
    { id: 28, name: 'Dr. Rafael Gomes — Dermatologista', specialty: 'Tratamentos Estéticos e Clínicos', city: 'Recife, PE' },
    { id: 29, name: 'Dra. Camila Duarte — Enfermeira', specialty: 'Aplicações e Curativos Domiciliares', city: 'Goiânia, GO' },
  ].map(mei => ({
    ...mei,
    segment: 'Saúde',
    rating: 4.5 + Math.round(Math.random() * 4) / 10,
    completedJobs: 80 + Math.floor(Math.random() * 300),
    avatar: '👨‍⚕️',
    ownProducts: createOwnProducts(mei.id, 'Saúde', [
      { name: 'Kit Primeiros Socorros Completo', price: 59.90, category: 'Saúde', image: '🩹' },
      { name: 'Termômetro Digital Infravermelho', price: 49.90, category: 'Saúde', image: '🌡️' },
      { name: 'Oxímetro de Pulso', price: 39.90, category: 'Saúde', image: '❤️' },
      { name: 'Escova Dental Elétrica', price: 89.90, category: 'Odontologia', image: '🦷' },
      { name: 'Kit Fio Dental Premium (6un)', price: 29.90, category: 'Odontologia', image: '🧵' },
      { name: 'Gel Clareador Dental', price: 69.90, category: 'Odontologia', image: '✨' },
      { name: 'Vitamina D3 (120 caps)', price: 34.90, category: 'Suplementos', image: '💊' },
      { name: 'Ômega 3 (90 caps)', price: 44.90, category: 'Suplementos', image: '💊' },
      { name: 'Protetor Solar FPS 50', price: 39.90, category: 'Dermatologia', image: '☀️' },
      { name: 'Colírio Lubrificante (15ml)', price: 24.90, category: 'Oftalmologia', image: '👁️' },
    ]),
    dropshippingProducts: createDropProducts(mei.id, 'Saúde', [
      { name: 'Aparelho de Pressão Digital', price: 99.90, category: 'Saúde', image: '💓', platform: 'Mercado Livre' },
      { name: 'Balança Digital com Bioimpedância', price: 159.90, category: 'Saúde', image: '⚖️', platform: 'Shopee' },
      { name: 'Irrigador Oral Portátil', price: 129.90, category: 'Odontologia', image: '💧', platform: 'Mercado Livre' },
      { name: 'Nebulizador Ultrassônico', price: 119.90, category: 'Saúde', image: '💨', platform: 'OLX' },
      { name: 'Massageador Cervical Elétrico', price: 89.90, category: 'Bem-estar', image: '💆', platform: 'Shopee' },
      { name: 'Faixa Elástica Kit 5 Intensidades', price: 34.90, category: 'Fisioterapia', image: '🏋️', platform: 'Mercado Livre' },
      { name: 'Almofada Ortopédica Lombar', price: 79.90, category: 'Ortopedia', image: '🪑', platform: 'Shopee' },
      { name: 'Óculos Bloqueador Luz Azul', price: 49.90, category: 'Oftalmologia', image: '👓', platform: 'OLX' },
      { name: 'Whey Protein 900g', price: 89.90, category: 'Suplementos', image: '🥤', platform: 'Mercado Livre' },
      { name: 'Creatina Monohidratada 300g', price: 59.90, category: 'Suplementos', image: '💪', platform: 'Shopee' },
    ]),
  })),

  // ══════════════════════════════════════════
  // BEM-ESTAR & SAÚDE — 10 MEIs
  // ══════════════════════════════════════════
  ...[
    { id: 30, name: 'Thiago Martins — Personal Trainer', specialty: 'Treino Funcional e Musculação', city: 'São Paulo, SP' },
    { id: 31, name: 'Amanda Reis — Yoga', specialty: 'Hatha e Vinyasa Yoga', city: 'Rio de Janeiro, RJ' },
    { id: 32, name: 'Bruna Castro — Pilates', specialty: 'Pilates Solo e Aparelhos', city: 'Belo Horizonte, MG' },
    { id: 33, name: 'Diego Araújo — Massoterapia', specialty: 'Massagem Relaxante e Desportiva', city: 'Curitiba, PR' },
    { id: 34, name: 'Natália Freitas — Meditação', specialty: 'Mindfulness e Meditação Guiada', city: 'Salvador, BA' },
    { id: 35, name: 'Gustavo Barbosa — CrossFit', specialty: 'CrossFit e HIIT', city: 'Brasília, DF' },
    { id: 36, name: 'Isabela Pinto — Nutrição', specialty: 'Nutrição Funcional', city: 'Fortaleza, CE' },
    { id: 37, name: 'Mateus Correia — Artes Marciais', specialty: 'Muay Thai e Jiu-Jitsu', city: 'Porto Alegre, RS' },
    { id: 38, name: 'Laura Nascimento — Fisio', specialty: 'Pilates Clínico', city: 'Recife, PE' },
    { id: 39, name: 'Felipe Azevedo — Educador Físico', specialty: 'Treinamento para Idosos', city: 'Goiânia, GO' },
  ].map(mei => ({
    ...mei,
    segment: 'Bem-estar & Saúde',
    rating: 4.5 + Math.round(Math.random() * 4) / 10,
    completedJobs: 60 + Math.floor(Math.random() * 250),
    avatar: '🧘',
    ownProducts: createOwnProducts(mei.id, 'Bem-estar', [
      { name: 'Tapete de Yoga Premium', price: 79.90, category: 'Fitness', image: '🧘' },
      { name: 'Par de Halteres 5kg', price: 69.90, category: 'Fitness', image: '🏋️' },
      { name: 'Bola de Pilates 65cm', price: 49.90, category: 'Fitness', image: '⚽' },
      { name: 'Faixa Elástica Kit', price: 34.90, category: 'Fitness', image: '💪' },
      { name: 'Corda de Pular Profissional', price: 29.90, category: 'Fitness', image: '🏃' },
      { name: 'Rolo de Espuma Massageador', price: 44.90, category: 'Recuperação', image: '🔄' },
      { name: 'Óleo Essencial Lavanda 10ml', price: 24.90, category: 'Aromaterapia', image: '🌸' },
      { name: 'Incenso Natural (pacote 20un)', price: 14.90, category: 'Bem-estar', image: '🕯️' },
      { name: 'Garrafa Térmica 1L Inox', price: 59.90, category: 'Acessórios', image: '🫗' },
      { name: 'Luvas de Treino', price: 39.90, category: 'Fitness', image: '🥊' },
    ]),
    dropshippingProducts: createDropProducts(mei.id, 'Bem-estar', [
      { name: 'Esteira Elétrica Dobrável', price: 1299.90, category: 'Fitness', image: '🏃', platform: 'Mercado Livre' },
      { name: 'Bicicleta Ergométrica', price: 899.90, category: 'Fitness', image: '🚲', platform: 'OLX' },
      { name: 'Smartwatch Fitness Tracker', price: 199.90, category: 'Tecnologia', image: '⌚', platform: 'Shopee' },
      { name: 'Kit Caneleiras 1-5kg', price: 89.90, category: 'Fitness', image: '🦵', platform: 'Mercado Livre' },
      { name: 'Banco Supino Regulável', price: 449.90, category: 'Fitness', image: '🏋️', platform: 'OLX' },
      { name: 'Kettlebell 12kg', price: 119.90, category: 'Fitness', image: '🏋️', platform: 'Shopee' },
      { name: 'Difusor de Aromas Ultrassônico', price: 69.90, category: 'Bem-estar', image: '🌸', platform: 'Mercado Livre' },
      { name: 'Pistola de Massagem', price: 179.90, category: 'Recuperação', image: '💆', platform: 'Shopee' },
      { name: 'Whey Protein Isolado 1kg', price: 129.90, category: 'Suplementos', image: '🥤', platform: 'Mercado Livre' },
      { name: 'BCAA 120 caps', price: 49.90, category: 'Suplementos', image: '💊', platform: 'Shopee' },
    ]),
  })),

  // ══════════════════════════════════════════
  // ESTÉTICA & BELEZA — 10 MEIs
  // ══════════════════════════════════════════
  ...[
    { id: 40, name: 'Vanessa Lima — Cabeleireira', specialty: 'Coloração e Cortes Modernos', city: 'São Paulo, SP' },
    { id: 41, name: 'Priscila Ramos — Manicure', specialty: 'Nail Art e Alongamento', city: 'Rio de Janeiro, RJ' },
    { id: 42, name: 'Tatiana Borges — Esteticista', specialty: 'Tratamentos Faciais', city: 'Belo Horizonte, MG' },
    { id: 43, name: 'Renata Dias — Sobrancelhas', specialty: 'Design e Micropigmentação', city: 'Curitiba, PR' },
    { id: 44, name: 'Camila Ferraz — Extensão Cílios', specialty: 'Fio a Fio e Volume Russo', city: 'Salvador, BA' },
    { id: 45, name: 'Juliana Mello — Depilação', specialty: 'Laser e Cera', city: 'Brasília, DF' },
    { id: 46, name: 'Marina Coelho — Maquiadora', specialty: 'Noivas e Eventos', city: 'Fortaleza, CE' },
    { id: 47, name: 'Gabriela Santos — Barbeira', specialty: 'Barba e Corte Masculino', city: 'Porto Alegre, RS' },
    { id: 48, name: 'Larissa Monteiro — Drenagem', specialty: 'Drenagem Linfática e Modeladora', city: 'Recife, PE' },
    { id: 49, name: 'Bianca Oliveira — Spa', specialty: 'Day Spa e Tratamentos Corporais', city: 'Goiânia, GO' },
  ].map(mei => ({
    ...mei,
    segment: 'Estética & Beleza',
    rating: 4.5 + Math.round(Math.random() * 4) / 10,
    completedJobs: 100 + Math.floor(Math.random() * 300),
    avatar: '💇',
    ownProducts: createOwnProducts(mei.id, 'Beleza', [
      { name: 'Kit Esmaltes Gel (12 cores)', price: 89.90, category: 'Unhas', image: '💅' },
      { name: 'Secador Profissional 2200W', price: 149.90, category: 'Cabelos', image: '💨' },
      { name: 'Prancha Alisadora Titanium', price: 129.90, category: 'Cabelos', image: '✨' },
      { name: 'Kit Pincéis Maquiagem (15pcs)', price: 79.90, category: 'Maquiagem', image: '🖌️' },
      { name: 'Máscara Capilar Hidratação 500g', price: 34.90, category: 'Cabelos', image: '💇' },
      { name: 'Cera Depilatória Roll-On', price: 24.90, category: 'Depilação', image: '🍯' },
      { name: 'Sérum Facial Vitamina C', price: 49.90, category: 'Skincare', image: '🧴' },
      { name: 'Hidratante Corporal 400ml', price: 29.90, category: 'Corpo', image: '🧴' },
      { name: 'Óleo de Argan 60ml', price: 39.90, category: 'Cabelos', image: '✨' },
      { name: 'Espelho de Maquiagem LED', price: 59.90, category: 'Acessórios', image: '🪞' },
    ]),
    dropshippingProducts: createDropProducts(mei.id, 'Beleza', [
      { name: 'Ring Light 18" com Tripé', price: 159.90, category: 'Acessórios', image: '💡', platform: 'Mercado Livre' },
      { name: 'Autoclave 12L para Esterilização', price: 899.90, category: 'Equipamentos', image: '🔬', platform: 'OLX' },
      { name: 'Cadeira de Maquiagem Portátil', price: 249.90, category: 'Mobiliário', image: '💺', platform: 'Mercado Livre' },
      { name: 'Máquina Dermapen Profissional', price: 349.90, category: 'Estética', image: '📍', platform: 'Shopee' },
      { name: 'Kit Base e Corretivo (10 tons)', price: 199.90, category: 'Maquiagem', image: '💄', platform: 'Mercado Livre' },
      { name: 'Vaporizador Facial Profissional', price: 179.90, category: 'Estética', image: '💨', platform: 'Shopee' },
      { name: 'Maca Portátil Dobrável', price: 399.90, category: 'Mobiliário', image: '🛏️', platform: 'OLX' },
      { name: 'Kit Alongamento Cílios Fio a Fio', price: 129.90, category: 'Cílios', image: '👁️', platform: 'Shopee' },
      { name: 'Cabelo Humano para Mega Hair', price: 299.90, category: 'Cabelos', image: '💇', platform: 'Mercado Livre' },
      { name: 'LED UV Cabine para Unhas', price: 89.90, category: 'Unhas', image: '💅', platform: 'Shopee' },
    ]),
  })),

  // ══════════════════════════════════════════
  // LAR & AMBIENTE — 10 MEIs
  // ══════════════════════════════════════════
  ...[
    { id: 50, name: 'Maria Aparecida — Diarista', specialty: 'Limpeza Residencial Completa', city: 'São Paulo, SP' },
    { id: 51, name: 'José Jardim — Jardineiro', specialty: 'Paisagismo e Manutenção', city: 'Rio de Janeiro, RJ' },
    { id: 52, name: 'Sandra Oliveira — Organização', specialty: 'Personal Organizer', city: 'Belo Horizonte, MG' },
    { id: 53, name: 'Cláudio Dedetizador', specialty: 'Dedetização e Descupinização', city: 'Curitiba, PR' },
    { id: 54, name: 'Eliane Costa — Lavanderia', specialty: 'Lavagem e Passadoria', city: 'Salvador, BA' },
    { id: 55, name: 'Reginaldo Pool — Piscineiro', specialty: 'Manutenção de Piscinas', city: 'Brasília, DF' },
    { id: 56, name: 'Ana Décor — Decoradora', specialty: 'Decoração de Interiores', city: 'Fortaleza, CE' },
    { id: 57, name: 'Paulo Limpeza — Pós-Obra', specialty: 'Limpeza Pesada e Pós-Obra', city: 'Porto Alegre, RS' },
    { id: 58, name: 'Vera Estofados — Higienização', specialty: 'Limpeza de Estofados e Carpetes', city: 'Recife, PE' },
    { id: 59, name: 'Raimundo Poda — Árvores', specialty: 'Poda e Remoção de Árvores', city: 'Goiânia, GO' },
  ].map(mei => ({
    ...mei,
    segment: 'Lar & Ambiente',
    rating: 4.3 + Math.round(Math.random() * 6) / 10,
    completedJobs: 70 + Math.floor(Math.random() * 200),
    avatar: '🏠',
    ownProducts: createOwnProducts(mei.id, 'Lar', [
      { name: 'Kit Limpeza Multiuso (5 itens)', price: 39.90, category: 'Limpeza', image: '🧴' },
      { name: 'Desinfetante Concentrado 5L', price: 29.90, category: 'Limpeza', image: '🫧' },
      { name: 'Vassoura + Rodo Profissional', price: 49.90, category: 'Limpeza', image: '🧹' },
      { name: 'Luvas de Borracha (3 pares)', price: 14.90, category: 'Limpeza', image: '🧤' },
      { name: 'Adubo Orgânico 5kg', price: 24.90, category: 'Jardinagem', image: '🌱' },
      { name: 'Kit Ferramentas Jardim 5pcs', price: 59.90, category: 'Jardinagem', image: '🌿' },
      { name: 'Mangueira 30m com Enrolador', price: 79.90, category: 'Jardinagem', image: '🚿' },
      { name: 'Organizador Multiuso (set 6)', price: 49.90, category: 'Organização', image: '📦' },
      { name: 'Saco para Aspirador (pacote 6)', price: 19.90, category: 'Limpeza', image: '🧹' },
      { name: 'Pano Microfibra (kit 10)', price: 29.90, category: 'Limpeza', image: '🧻' },
    ]),
    dropshippingProducts: createDropProducts(mei.id, 'Lar', [
      { name: 'Aspirador Robô Inteligente', price: 599.90, category: 'Eletrônicos', image: '🤖', platform: 'Mercado Livre' },
      { name: 'Lavadora de Alta Pressão', price: 449.90, category: 'Limpeza', image: '💧', platform: 'OLX' },
      { name: 'Cortador de Grama Elétrico', price: 349.90, category: 'Jardinagem', image: '🌿', platform: 'Mercado Livre' },
      { name: 'Soprador de Folhas a Bateria', price: 279.90, category: 'Jardinagem', image: '🍃', platform: 'Shopee' },
      { name: 'Purificador de Ar com HEPA', price: 399.90, category: 'Casa', image: '🌬️', platform: 'Mercado Livre' },
      { name: 'Vaporizador de Roupas Portátil', price: 129.90, category: 'Lavanderia', image: '👔', platform: 'Shopee' },
      { name: 'Caixa Organizadora Empilhável (kit 4)', price: 89.90, category: 'Organização', image: '📦', platform: 'OLX' },
      { name: 'Extratora de Estofados', price: 699.90, category: 'Limpeza', image: '🛋️', platform: 'Mercado Livre' },
      { name: 'Kit Iluminação Solar Jardim (6un)', price: 149.90, category: 'Jardim', image: '☀️', platform: 'Shopee' },
      { name: 'Lixeira Automática Sensor 50L', price: 199.90, category: 'Casa', image: '🗑️', platform: 'Mercado Livre' },
    ]),
  })),

  // ══════════════════════════════════════════
  // AUTOMOTIVO — 10 MEIs
  // ══════════════════════════════════════════
  ...[
    { id: 60, name: 'Rodrigo Auto — Mecânico', specialty: 'Mecânica Geral e Injeção', city: 'São Paulo, SP' },
    { id: 61, name: 'Marcelo Wash — Lavador', specialty: 'Lavagem e Detalhamento', city: 'Rio de Janeiro, RJ' },
    { id: 62, name: 'Wilson Funileiro', specialty: 'Funilaria e Pintura', city: 'Belo Horizonte, MG' },
    { id: 63, name: 'Eduardo Elétrica Auto', specialty: 'Elétrica Automotiva', city: 'Curitiba, PR' },
    { id: 64, name: 'Fábio Pneu — Borracheiro', specialty: 'Pneus e Alinhamento', city: 'Salvador, BA' },
    { id: 65, name: 'Alex Som — Instalação', specialty: 'Som e Acessórios', city: 'Brasília, DF' },
    { id: 66, name: 'Jorge Martelinho', specialty: 'Martelinho de Ouro', city: 'Fortaleza, CE' },
    { id: 67, name: 'Leonardo Wrap — Envelopamento', specialty: 'Envelopamento e Película', city: 'Porto Alegre, RS' },
    { id: 68, name: 'Sérgio Guincho — Reboque', specialty: 'Guincho e Socorro 24h', city: 'Recife, PE' },
    { id: 69, name: 'Henrique Track — Rastreador', specialty: 'Rastreamento e Segurança', city: 'Goiânia, GO' },
  ].map(mei => ({
    ...mei,
    segment: 'Automotivo',
    rating: 4.3 + Math.round(Math.random() * 6) / 10,
    completedJobs: 80 + Math.floor(Math.random() * 250),
    avatar: '🔧',
    ownProducts: createOwnProducts(mei.id, 'Auto', [
      { name: 'Óleo Motor 5W30 Sintético 1L', price: 39.90, category: 'Lubrificantes', image: '🛢️' },
      { name: 'Filtro de Óleo Universal', price: 24.90, category: 'Filtros', image: '🔧' },
      { name: 'Palheta Limpador (par)', price: 34.90, category: 'Acessórios', image: '🚗' },
      { name: 'Lâmpada LED Farol H7 (par)', price: 79.90, category: 'Iluminação', image: '💡' },
      { name: 'Cera Automotiva Premium 300g', price: 49.90, category: 'Limpeza', image: '✨' },
      { name: 'Shampoo Automotivo 5L', price: 29.90, category: 'Limpeza', image: '🧴' },
      { name: 'Aromatizante Automotivo', price: 14.90, category: 'Acessórios', image: '🌸' },
      { name: 'Flanela Microfibra Auto (kit 5)', price: 24.90, category: 'Limpeza', image: '🧻' },
      { name: 'Kit Chaves Combinadas 12pcs', price: 89.90, category: 'Ferramentas', image: '🔧' },
      { name: 'Macaco Hidráulico 2T', price: 99.90, category: 'Ferramentas', image: '🔩' },
    ]),
    dropshippingProducts: createDropProducts(mei.id, 'Auto', [
      { name: 'Scanner OBD2 Bluetooth', price: 89.90, category: 'Diagnóstico', image: '💻', platform: 'Mercado Livre' },
      { name: 'Compressor de Ar Portátil 12V', price: 129.90, category: 'Ferramentas', image: '🌬️', platform: 'Shopee' },
      { name: 'Câmera de Ré HD', price: 69.90, category: 'Segurança', image: '📷', platform: 'Mercado Livre' },
      { name: 'Central Multimídia 7"', price: 449.90, category: 'Som', image: '📺', platform: 'OLX' },
      { name: 'Rastreador GPS Veicular', price: 149.90, category: 'Segurança', image: '📡', platform: 'Shopee' },
      { name: 'Película Automotiva Fumê 5m', price: 59.90, category: 'Película', image: '🪟', platform: 'Mercado Livre' },
      { name: 'Tapete Emborrachado Universal', price: 79.90, category: 'Acessórios', image: '🚗', platform: 'OLX' },
      { name: 'Capa para Banco Universal', price: 129.90, category: 'Acessórios', image: '💺', platform: 'Shopee' },
      { name: 'Kit Polimento 3 Etapas', price: 99.90, category: 'Limpeza', image: '✨', platform: 'Mercado Livre' },
      { name: 'Aspirador Automotivo 12V', price: 89.90, category: 'Limpeza', image: '🧹', platform: 'Shopee' },
    ]),
  })),

  // ══════════════════════════════════════════
  // DIGITAL & CRIATIVO — 10 MEIs
  // ══════════════════════════════════════════
  ...[
    { id: 70, name: 'Ana Clara — Designer', specialty: 'Branding e Identidade Visual', city: 'São Paulo, SP' },
    { id: 71, name: 'Lucas Foto — Fotógrafo', specialty: 'Eventos e Ensaios', city: 'Rio de Janeiro, RJ' },
    { id: 72, name: 'Rafael Social — Social Media', specialty: 'Instagram e TikTok', city: 'Belo Horizonte, MG' },
    { id: 73, name: 'Mariana Vídeo — Editora', specialty: 'Reels e YouTube', city: 'Curitiba, PR' },
    { id: 74, name: 'Daniel Web — Desenvolvedor', specialty: 'Sites e Landing Pages', city: 'Salvador, BA' },
    { id: 75, name: 'Carla Copy — Copywriter', specialty: 'Textos para Vendas', city: 'Brasília, DF' },
    { id: 76, name: 'Bruno Ads — Tráfego Pago', specialty: 'Google Ads e Meta Ads', city: 'Fortaleza, CE' },
    { id: 77, name: 'Juliana UX — Designer', specialty: 'UI/UX e Prototipação', city: 'Porto Alegre, RS' },
    { id: 78, name: 'Vinícius Pod — Podcast', specialty: 'Produção e Edição', city: 'Recife, PE' },
    { id: 79, name: 'Camila App — Desenvolvedora', specialty: 'Apps Mobile e PWA', city: 'Goiânia, GO' },
  ].map(mei => ({
    ...mei,
    segment: 'Digital & Criativo',
    rating: 4.5 + Math.round(Math.random() * 4) / 10,
    completedJobs: 40 + Math.floor(Math.random() * 150),
    avatar: '💻',
    ownProducts: createOwnProducts(mei.id, 'Digital', [
      { name: 'Template Pack Instagram (50 artes)', price: 49.90, category: 'Templates', image: '🎨' },
      { name: 'Preset Lightroom (pack 10)', price: 29.90, category: 'Fotografia', image: '📸' },
      { name: 'E-book Marketing Digital', price: 19.90, category: 'Educação', image: '📚' },
      { name: 'Pack Mockups PSD (20 cenas)', price: 39.90, category: 'Design', image: '🖼️' },
      { name: 'Curso Canva para Negócios', price: 69.90, category: 'Cursos', image: '🎓' },
      { name: 'Pack Fontes Premium (15 fontes)', price: 34.90, category: 'Design', image: '✍️' },
      { name: 'Kit Identidade Visual Template', price: 89.90, category: 'Branding', image: '🎨' },
      { name: 'Planilha Gestão de Projetos', price: 24.90, category: 'Ferramentas', image: '📊' },
      { name: 'Pack Stories Animados', price: 44.90, category: 'Templates', image: '📱' },
      { name: 'Checklist SEO Completo', price: 14.90, category: 'Marketing', image: '✅' },
    ]),
    dropshippingProducts: createDropProducts(mei.id, 'Digital', [
      { name: 'Webcam Full HD 1080p', price: 149.90, category: 'Equipamento', image: '📷', platform: 'Mercado Livre' },
      { name: 'Microfone Condensador USB', price: 199.90, category: 'Áudio', image: '🎙️', platform: 'Shopee' },
      { name: 'Mesa Digitalizadora Wacom', price: 349.90, category: 'Design', image: '✏️', platform: 'Mercado Livre' },
      { name: 'Ring Light 26cm com Tripé', price: 89.90, category: 'Iluminação', image: '💡', platform: 'Shopee' },
      { name: 'SSD Externo 500GB USB-C', price: 279.90, category: 'Armazenamento', image: '💾', platform: 'OLX' },
      { name: 'Teclado Mecânico RGB', price: 199.90, category: 'Periféricos', image: '⌨️', platform: 'Mercado Livre' },
      { name: 'Mouse Ergonômico Vertical', price: 89.90, category: 'Periféricos', image: '🖱️', platform: 'Shopee' },
      { name: 'Suporte Monitor Articulado', price: 129.90, category: 'Ergonomia', image: '🖥️', platform: 'Mercado Livre' },
      { name: 'Fone de Ouvido Studio', price: 249.90, category: 'Áudio', image: '🎧', platform: 'OLX' },
      { name: 'Hub USB-C 7 em 1', price: 119.90, category: 'Acessórios', image: '🔌', platform: 'Shopee' },
    ]),
  })),

  // ══════════════════════════════════════════
  // TECNOLOGIA & INFORMÁTICA — 10 MEIs
  // ══════════════════════════════════════════
  ...[
    { id: 80, name: 'Renato TI — Suporte', specialty: 'Formatação e Manutenção', city: 'São Paulo, SP' },
    { id: 81, name: 'Leandro Redes — Infraestrutura', specialty: 'Redes e Wi-Fi', city: 'Rio de Janeiro, RJ' },
    { id: 82, name: 'Victor Cell — Celular', specialty: 'Conserto de Smartphones', city: 'Belo Horizonte, MG' },
    { id: 83, name: 'Marcos CFTV — Segurança', specialty: 'Câmeras e Alarmes', city: 'Curitiba, PR' },
    { id: 84, name: 'Diego Game — PC Gamer', specialty: 'Montagem e Upgrade', city: 'Salvador, BA' },
    { id: 85, name: 'Thais E-commerce', specialty: 'Criação de Lojas Online', city: 'Brasília, DF' },
    { id: 86, name: 'Anderson IA — Automação', specialty: 'Chatbots e Automação com IA', city: 'Fortaleza, CE' },
    { id: 87, name: 'Paula Cyber — Segurança', specialty: 'Consultoria de Cibersegurança', city: 'Porto Alegre, RS' },
    { id: 88, name: 'Gabriel Office — Suporte', specialty: 'Office 365 e Planilhas', city: 'Recife, PE' },
    { id: 89, name: 'Flávia Data — Recuperação', specialty: 'Backup e Recuperação de Dados', city: 'Goiânia, GO' },
  ].map(mei => ({
    ...mei,
    segment: 'Tecnologia & Informática',
    rating: 4.4 + Math.round(Math.random() * 5) / 10,
    completedJobs: 60 + Math.floor(Math.random() * 200),
    avatar: '🖥️',
    ownProducts: createOwnProducts(mei.id, 'Tech', [
      { name: 'Cabo HDMI 2.1 (2m)', price: 29.90, category: 'Cabos', image: '🔌' },
      { name: 'Pasta Térmica Premium 4g', price: 19.90, category: 'Componentes', image: '🧴' },
      { name: 'Pen Drive 64GB USB 3.0', price: 34.90, category: 'Armazenamento', image: '💾' },
      { name: 'Adaptador USB-C para HDMI', price: 49.90, category: 'Adaptadores', image: '🔌' },
      { name: 'Película de Vidro (pack 3)', price: 14.90, category: 'Celular', image: '📱' },
      { name: 'Capinha Anti-Impacto', price: 29.90, category: 'Celular', image: '📱' },
      { name: 'Cabo USB-C (2m) Reforçado', price: 24.90, category: 'Cabos', image: '🔌' },
      { name: 'Memória RAM DDR4 8GB', price: 119.90, category: 'Componentes', image: '💻' },
      { name: 'SSD 240GB SATA', price: 129.90, category: 'Armazenamento', image: '💾' },
      { name: 'Roteador Wi-Fi AC1200', price: 149.90, category: 'Redes', image: '📶' },
    ]),
    dropshippingProducts: createDropProducts(mei.id, 'Tech', [
      { name: 'Monitor 24" Full HD IPS', price: 699.90, category: 'Monitor', image: '🖥️', platform: 'Mercado Livre' },
      { name: 'Teclado e Mouse Sem Fio', price: 99.90, category: 'Periféricos', image: '⌨️', platform: 'Shopee' },
      { name: 'Nobreak 600VA', price: 349.90, category: 'Energia', image: '🔋', platform: 'OLX' },
      { name: 'Câmera IP WiFi 360°', price: 129.90, category: 'Segurança', image: '📹', platform: 'Mercado Livre' },
      { name: 'Kit 4 Câmeras CFTV + DVR', price: 599.90, category: 'Segurança', image: '📹', platform: 'Shopee' },
      { name: 'Placa de Vídeo GTX 1650', price: 899.90, category: 'Componentes', image: '🎮', platform: 'OLX' },
      { name: 'Cadeira Gamer Ergonômica', price: 699.90, category: 'Mobiliário', image: '🪑', platform: 'Mercado Livre' },
      { name: 'Switch de Rede 8 Portas', price: 79.90, category: 'Redes', image: '📡', platform: 'Shopee' },
      { name: 'HD Externo 1TB USB 3.0', price: 249.90, category: 'Armazenamento', image: '💾', platform: 'Mercado Livre' },
      { name: 'Smart Speaker Alexa', price: 299.90, category: 'Smart Home', image: '🔊', platform: 'Shopee' },
    ]),
  })),

  // ══════════════════════════════════════════
  // EDUCAÇÃO & CURSOS — 10 MEIs
  // ══════════════════════════════════════════
  ...[
    { id: 90, name: 'Prof. Roberto — Matemática', specialty: 'Reforço e Preparatório', city: 'São Paulo, SP' },
    { id: 91, name: 'Teacher Sarah — Inglês', specialty: 'Conversação e Certificações', city: 'Rio de Janeiro, RJ' },
    { id: 92, name: 'Prof. Diego — Música', specialty: 'Violão e Teclado', city: 'Belo Horizonte, MG' },
    { id: 93, name: 'Chef Patrícia — Culinária', specialty: 'Gastronomia e Confeitaria', city: 'Curitiba, PR' },
    { id: 94, name: 'Prof. Marina — ENEM', specialty: 'Preparatório Vestibular', city: 'Salvador, BA' },
    { id: 95, name: 'Coach Fernando — Carreira', specialty: 'Mentoria e Desenvolvimento', city: 'Brasília, DF' },
    { id: 96, name: 'Prof. Lúcia — Costura', specialty: 'Corte e Costura Criativa', city: 'Fortaleza, CE' },
    { id: 97, name: 'Prof. André — Programação', specialty: 'Python, JavaScript e IA', city: 'Porto Alegre, RS' },
    { id: 98, name: 'Prof. Aline — Fotografia', specialty: 'Técnicas e Edição', city: 'Recife, PE' },
    { id: 99, name: 'Prof. Marcelo — Natação', specialty: 'Natação Infantil e Adulto', city: 'Goiânia, GO' },
  ].map(mei => ({
    ...mei,
    segment: 'Educação & Cursos',
    rating: 4.6 + Math.round(Math.random() * 3) / 10,
    completedJobs: 50 + Math.floor(Math.random() * 200),
    avatar: '🎓',
    ownProducts: createOwnProducts(mei.id, 'Educação', [
      { name: 'Apostila ENEM Completa', price: 49.90, category: 'Material Didático', image: '📚' },
      { name: 'Caderno Inteligente A4', price: 59.90, category: 'Material Escolar', image: '📓' },
      { name: 'Kit Canetas Coloridas (24un)', price: 29.90, category: 'Material Escolar', image: '🖊️' },
      { name: 'Dicionário Inglês-Português', price: 34.90, category: 'Livros', image: '📖' },
      { name: 'Kit Pincéis para Pintura', price: 39.90, category: 'Artes', image: '🖌️' },
      { name: 'Metrônomo Digital', price: 44.90, category: 'Música', image: '🎵' },
      { name: 'Avental de Cozinha Profissional', price: 29.90, category: 'Culinária', image: '👨‍🍳' },
      { name: 'Kit Agulhas de Crochê (15pcs)', price: 24.90, category: 'Artesanato', image: '🧶' },
      { name: 'Quadro Branco 60x40cm', price: 49.90, category: 'Material Didático', image: '📋' },
      { name: 'Óculos de Natação Profissional', price: 39.90, category: 'Esportes', image: '🥽' },
    ]),
    dropshippingProducts: createDropProducts(mei.id, 'Educação', [
      { name: 'Tablet 10" para Estudos', price: 599.90, category: 'Eletrônicos', image: '📱', platform: 'Mercado Livre' },
      { name: 'Violão Clássico Nylon', price: 249.90, category: 'Instrumentos', image: '🎸', platform: 'OLX' },
      { name: 'Teclado Musical 61 Teclas', price: 399.90, category: 'Instrumentos', image: '🎹', platform: 'Mercado Livre' },
      { name: 'Kit Confeitaria 50 Peças', price: 149.90, category: 'Culinária', image: '🎂', platform: 'Shopee' },
      { name: 'Máquina de Costura Portátil', price: 299.90, category: 'Costura', image: '🧵', platform: 'OLX' },
      { name: 'Kindle Paperwhite', price: 499.90, category: 'Leitura', image: '📖', platform: 'Mercado Livre' },
      { name: 'Câmera Fotográfica DSLR Usada', price: 899.90, category: 'Fotografia', image: '📷', platform: 'OLX' },
      { name: 'Tripé Profissional 1.8m', price: 149.90, category: 'Fotografia', image: '📐', platform: 'Shopee' },
      { name: 'Fone com Cancelamento de Ruído', price: 199.90, category: 'Áudio', image: '🎧', platform: 'Mercado Livre' },
      { name: 'Luminária de Mesa LED', price: 79.90, category: 'Iluminação', image: '💡', platform: 'Shopee' },
    ]),
  })),

  // ══════════════════════════════════════════
  // PET & ANIMAIS — 10 MEIs
  // ══════════════════════════════════════════
  ...[
    { id: 110, name: 'Carla Pet — Banho e Tosa', specialty: 'Banho, Tosa e Hidratação', city: 'São Paulo, SP' },
    { id: 111, name: 'Dr. Márcio Vet — Veterinário', specialty: 'Clínica Geral e Vacinação', city: 'Rio de Janeiro, RJ' },
    { id: 112, name: 'Bruno Walker — Dog Walker', specialty: 'Passeios e Socialização', city: 'Belo Horizonte, MG' },
    { id: 113, name: 'Sônia Adestramento', specialty: 'Adestramento Comportamental', city: 'Curitiba, PR' },
    { id: 114, name: 'Pedro Pet Sitter', specialty: 'Hospedagem em Casa', city: 'Salvador, BA' },
    { id: 115, name: 'Ana Nutri Pet', specialty: 'Nutrição Animal Natural', city: 'Brasília, DF' },
    { id: 116, name: 'Dr. Fábio Fisio Pet', specialty: 'Fisioterapia Animal', city: 'Fortaleza, CE' },
    { id: 117, name: 'Luana Pet Photo', specialty: 'Fotografia de Pets', city: 'Porto Alegre, RS' },
    { id: 118, name: 'Ricardo Aqua — Aquarismo', specialty: 'Montagem e Manutenção', city: 'Recife, PE' },
    { id: 119, name: 'Patrícia Pet Shop', specialty: 'Pet Shop e Delivery', city: 'Goiânia, GO' },
  ].map(mei => ({
    ...mei,
    segment: 'Pet & Animais',
    rating: 4.5 + Math.round(Math.random() * 4) / 10,
    completedJobs: 70 + Math.floor(Math.random() * 200),
    avatar: '🐕',
    ownProducts: createOwnProducts(mei.id, 'Pet', [
      { name: 'Ração Premium Cães 15kg', price: 89.90, category: 'Alimentação', image: '🦴' },
      { name: 'Ração Premium Gatos 10kg', price: 79.90, category: 'Alimentação', image: '🐱' },
      { name: 'Shampoo Pet Neutro 500ml', price: 24.90, category: 'Higiene', image: '🧴' },
      { name: 'Coleira Ajustável Refletiva', price: 29.90, category: 'Acessórios', image: '📿' },
      { name: 'Guia Retrátil 5m', price: 49.90, category: 'Passeio', image: '🦮' },
      { name: 'Brinquedo Mordedor Dental', price: 19.90, category: 'Brinquedos', image: '🦷' },
      { name: 'Tapete Higiênico (pacote 30)', price: 34.90, category: 'Higiene', image: '🧻' },
      { name: 'Comedouro Inox Antiderrapante', price: 24.90, category: 'Alimentação', image: '🥣' },
      { name: 'Areia Higiênica Gatos 4kg', price: 19.90, category: 'Higiene', image: '📦' },
      { name: 'Antipulgas Pipeta (3 doses)', price: 39.90, category: 'Saúde', image: '💊' },
    ]),
    dropshippingProducts: createDropProducts(mei.id, 'Pet', [
      { name: 'Cama Pet Ortopédica G', price: 149.90, category: 'Conforto', image: '🛏️', platform: 'Mercado Livre' },
      { name: 'Fonte de Água Automática Pet', price: 99.90, category: 'Alimentação', image: '💧', platform: 'Shopee' },
      { name: 'Câmera Pet WiFi com Dispenser', price: 249.90, category: 'Tecnologia', image: '📹', platform: 'Mercado Livre' },
      { name: 'Transportadora para Cães M', price: 129.90, category: 'Transporte', image: '📦', platform: 'OLX' },
      { name: 'GPS Pet Tracker Coleira', price: 179.90, category: 'Segurança', image: '📡', platform: 'Shopee' },
      { name: 'Portão para Pets Retrátil', price: 89.90, category: 'Segurança', image: '🚪', platform: 'Mercado Livre' },
      { name: 'Aquário Completo 50L', price: 299.90, category: 'Aquarismo', image: '🐠', platform: 'OLX' },
      { name: 'Escovadeira Automática Pet', price: 69.90, category: 'Higiene', image: '🖌️', platform: 'Shopee' },
      { name: 'Kit Agility para Cães', price: 199.90, category: 'Treinamento', image: '🏃', platform: 'Mercado Livre' },
      { name: 'Casinha de Cachorro Plástica G', price: 179.90, category: 'Conforto', image: '🏠', platform: 'Shopee' },
    ]),
  })),

  // ══════════════════════════════════════════
  // EVENTOS & FESTAS — 10 MEIs
  // ══════════════════════════════════════════
  ...[
    { id: 120, name: 'Chef Ricardo — Buffet', specialty: 'Buffet e Catering', city: 'São Paulo, SP' },
    { id: 121, name: 'DJ Marcos — Eventos', specialty: 'DJ e Sonorização', city: 'Rio de Janeiro, RJ' },
    { id: 122, name: 'Simone Décor — Decoração', specialty: 'Decoração de Festas e Casamentos', city: 'Belo Horizonte, MG' },
    { id: 123, name: 'Eduardo Garçom — Serviço', specialty: 'Garçom e Copeiro', city: 'Curitiba, PR' },
    { id: 124, name: 'Palhaço Pipoca — Animação', specialty: 'Animação Infantil', city: 'Salvador, BA' },
    { id: 125, name: 'Foto Click — Fotógrafo', specialty: 'Fotos e Vídeos de Eventos', city: 'Brasília, DF' },
    { id: 126, name: 'Lu Cerimonial', specialty: 'Cerimonial e Assessoria', city: 'Fortaleza, CE' },
    { id: 127, name: 'Drink Master — Bartender', specialty: 'Drinks e Open Bar', city: 'Porto Alegre, RS' },
    { id: 128, name: 'Doce Encanto — Confeiteira', specialty: 'Bolos e Doces Artesanais', city: 'Recife, PE' },
    { id: 129, name: 'Show de Mágica — Mágico', specialty: 'Mágica e Entretenimento', city: 'Goiânia, GO' },
  ].map(mei => ({
    ...mei,
    segment: 'Eventos & Festas',
    rating: 4.5 + Math.round(Math.random() * 4) / 10,
    completedJobs: 30 + Math.floor(Math.random() * 150),
    avatar: '🎉',
    ownProducts: createOwnProducts(mei.id, 'Eventos', [
      { name: 'Kit Decoração Festa (balões + faixas)', price: 49.90, category: 'Decoração', image: '🎈' },
      { name: 'Toalha de Mesa TNT 10un', price: 19.90, category: 'Mesa', image: '🍽️' },
      { name: 'Copos Descartáveis Premium 100un', price: 14.90, category: 'Descartáveis', image: '🥤' },
      { name: 'Velas Decorativas (kit 12)', price: 24.90, category: 'Decoração', image: '🕯️' },
      { name: 'Guardanapos Personalizados 100un', price: 19.90, category: 'Mesa', image: '🧻' },
      { name: 'Kit Doces Finos (100un)', price: 89.90, category: 'Doces', image: '🍬' },
      { name: 'Bolo Decorado até 3kg', price: 129.90, category: 'Confeitaria', image: '🎂' },
      { name: 'Salgados Variados (100un)', price: 69.90, category: 'Salgados', image: '🥟' },
      { name: 'Kit Drinks sem Álcool (20 porções)', price: 59.90, category: 'Bebidas', image: '🍹' },
      { name: 'Convites Personalizados (50un)', price: 34.90, category: 'Convites', image: '💌' },
    ]),
    dropshippingProducts: createDropProducts(mei.id, 'Eventos', [
      { name: 'Caixa de Som Bluetooth 100W', price: 349.90, category: 'Som', image: '🔊', platform: 'Mercado Livre' },
      { name: 'Máquina de Fumaça 1500W', price: 299.90, category: 'Efeitos', image: '💨', platform: 'OLX' },
      { name: 'Globo de Espelhos LED', price: 89.90, category: 'Iluminação', image: '✨', platform: 'Shopee' },
      { name: 'Refletor LED RGB 50W', price: 79.90, category: 'Iluminação', image: '💡', platform: 'Mercado Livre' },
      { name: 'Arco de Balões Estrutura', price: 49.90, category: 'Decoração', image: '🎈', platform: 'Shopee' },
      { name: 'Máquina de Algodão Doce', price: 399.90, category: 'Equipamentos', image: '🍭', platform: 'OLX' },
      { name: 'Máquina de Pipoca Profissional', price: 349.90, category: 'Equipamentos', image: '🍿', platform: 'Mercado Livre' },
      { name: 'Kit Bartender Profissional', price: 149.90, category: 'Bar', image: '🍸', platform: 'Shopee' },
      { name: 'Totem Fotográfico Portátil', price: 899.90, category: 'Foto', image: '📷', platform: 'Mercado Livre' },
      { name: 'Painel de LED Letreiro', price: 199.90, category: 'Decoração', image: '💡', platform: 'Shopee' },
    ]),
  })),

  // ══════════════════════════════════════════
  // MÚSICA — 10 MEIs
  // ══════════════════════════════════════════
  ...[
    { id: 130, name: 'Prof. Rodrigo — Violão', specialty: 'Violão Popular e Clássico', city: 'São Paulo, SP' },
    { id: 131, name: 'Prof. Beatriz — Piano', specialty: 'Piano Clássico e Popular', city: 'Rio de Janeiro, RJ' },
    { id: 132, name: 'Prof. Caio — Guitarra', specialty: 'Rock, Blues e Jazz', city: 'Belo Horizonte, MG' },
    { id: 133, name: 'Prof. Daniela — Canto', specialty: 'Técnica Vocal e Performance', city: 'Curitiba, PR' },
    { id: 134, name: 'Prof. Eduardo — Bateria', specialty: 'Bateria e Percussão', city: 'Salvador, BA' },
    { id: 135, name: 'Prof. Fábio — Produção', specialty: 'Produção Musical e Home Studio', city: 'Brasília, DF' },
    { id: 136, name: 'Prof. Giovana — Violino', specialty: 'Violino Clássico e MPB', city: 'Fortaleza, CE' },
    { id: 137, name: 'Prof. Henrique — Saxofone', specialty: 'Saxofone e Sopros', city: 'Porto Alegre, RS' },
    { id: 138, name: 'Prof. Igor — DJ', specialty: 'DJ, Mixagem e Produção Eletrônica', city: 'Recife, PE' },
    { id: 139, name: 'Prof. Juliana — Ukulele', specialty: 'Ukulele e Musicalização Infantil', city: 'Goiânia, GO' },
  ].map(mei => ({
    ...mei,
    segment: 'Música',
    rating: 4.5 + Math.round(Math.random() * 4) / 10,
    completedJobs: 40 + Math.floor(Math.random() * 180),
    avatar: '🎵',
    ownProducts: createOwnProducts(mei.id, 'Música', [
      { name: 'Encordoamento Violão Nylon', price: 24.90, category: 'Cordas', image: '🎸' },
      { name: 'Encordoamento Guitarra 0.10', price: 29.90, category: 'Cordas', image: '🎸' },
      { name: 'Palhetas Kit 12un', price: 14.90, category: 'Acessórios', image: '🎵' },
      { name: 'Afinador Cromático Clip-on', price: 34.90, category: 'Acessórios', image: '🎼' },
      { name: 'Capotraste Violão', price: 19.90, category: 'Acessórios', image: '🎸' },
      { name: 'Metrônomo Digital', price: 44.90, category: 'Acessórios', image: '⏱️' },
      { name: 'Baquetas 5A (par)', price: 29.90, category: 'Percussão', image: '🥁' },
      { name: 'Cabo P10 Guitarra 3m', price: 34.90, category: 'Cabos', image: '🔌' },
      { name: 'Palheta Cajon Vassourinha', price: 24.90, category: 'Percussão', image: '🥁' },
      { name: 'Método de Violão Livro', price: 39.90, category: 'Didático', image: '📚' },
    ]),
    dropshippingProducts: createDropProducts(mei.id, 'Música', [
      { name: 'Violão Clássico Nylon Iniciante', price: 249.90, category: 'Instrumentos', image: '🎸', platform: 'Mercado Livre' },
      { name: 'Guitarra Stratocaster Iniciante', price: 599.90, category: 'Instrumentos', image: '🎸', platform: 'OLX' },
      { name: 'Teclado Musical 61 Teclas', price: 399.90, category: 'Instrumentos', image: '🎹', platform: 'Mercado Livre' },
      { name: 'Bateria Eletrônica Compacta', price: 1299.90, category: 'Instrumentos', image: '🥁', platform: 'OLX' },
      { name: 'Microfone Condensador USB', price: 199.90, category: 'Áudio', image: '🎙️', platform: 'Shopee' },
      { name: 'Fone de Ouvido Studio Monitor', price: 249.90, category: 'Áudio', image: '🎧', platform: 'Mercado Livre' },
      { name: 'Interface de Áudio USB 2 Canais', price: 349.90, category: 'Áudio', image: '🎛️', platform: 'Shopee' },
      { name: 'Controladora MIDI 25 Teclas', price: 299.90, category: 'Produção', image: '🎹', platform: 'Mercado Livre' },
      { name: 'Amplificador Guitarra 15W', price: 399.90, category: 'Amplificação', image: '🔊', platform: 'OLX' },
      { name: 'Ukulele Concert com Bag', price: 149.90, category: 'Instrumentos', image: '🪕', platform: 'Shopee' },
    ]),
  })),

  // ══════════════════════════════════════════
  // NATUREZA & VIDA NATURAL — 10 MEIs
  // ══════════════════════════════════════════
  ...[
    { id: 140, name: 'José Horta — Jardineiro Orgânico', specialty: 'Hortas Urbanas e Orgânicas', city: 'São Paulo, SP' },
    { id: 141, name: 'Ana Verde — Paisagista', specialty: 'Paisagismo Sustentável', city: 'Rio de Janeiro, RJ' },
    { id: 142, name: 'Chef Renata — Comida Natural', specialty: 'Culinária Vegana e Natural', city: 'Belo Horizonte, MG' },
    { id: 143, name: 'Dra. Cláudia — Fitoterapeuta', specialty: 'Fitoterapia e Plantas Medicinais', city: 'Curitiba, PR' },
    { id: 144, name: 'Paulo Mel — Apicultor', specialty: 'Apicultura Urbana e Mel Artesanal', city: 'Salvador, BA' },
    { id: 145, name: 'Marina Floral — Terapeuta', specialty: 'Florais de Bach e Aromaterapia', city: 'Brasília, DF' },
    { id: 146, name: 'Roberto Perma — Permacultor', specialty: 'Permacultura e Agrofloresta', city: 'Fortaleza, CE' },
    { id: 147, name: 'Lúcia Nutri — Naturista', specialty: 'Nutrição Natural e Detox', city: 'Porto Alegre, RS' },
    { id: 148, name: 'Carlos Irrigação — Jardins', specialty: 'Irrigação e Automação de Jardins', city: 'Recife, PE' },
    { id: 149, name: 'Fernanda Fit — Marmitas', specialty: 'Marmitas Fit e Alimentação Natural', city: 'Goiânia, GO' },
  ].map(mei => ({
    ...mei,
    segment: 'Natureza & Vida Natural',
    rating: 4.5 + Math.round(Math.random() * 4) / 10,
    completedJobs: 40 + Math.floor(Math.random() * 180),
    avatar: '🌿',
    ownProducts: createOwnProducts(mei.id, 'Natureza', [
      { name: 'Adubo Orgânico Premium 5kg', price: 29.90, category: 'Jardinagem', image: '🌱' },
      { name: 'Sementes Orgânicas Kit (10 tipos)', price: 34.90, category: 'Jardinagem', image: '🌿' },
      { name: 'Chá Fitoterápico Mix (10 sachês)', price: 19.90, category: 'Fitoterapia', image: '🍵' },
      { name: 'Óleo Essencial Melaleuca 10ml', price: 24.90, category: 'Aromaterapia', image: '🌸' },
      { name: 'Tintura de Própolis 30ml', price: 14.90, category: 'Fitoterapia', image: '🍯' },
      { name: 'Kit Florais de Bach (5 essências)', price: 49.90, category: 'Florais', image: '🌺' },
      { name: 'Mel Orgânico Silvestre 500g', price: 39.90, category: 'Alimentação', image: '🍯' },
      { name: 'Granola Artesanal 1kg', price: 29.90, category: 'Alimentação', image: '🥣' },
      { name: 'Vaso Autoirrigável (kit 3)', price: 44.90, category: 'Jardinagem', image: '🪴' },
      { name: 'Substrato Orgânico 10L', price: 19.90, category: 'Jardinagem', image: '🌍' },
    ]),
    dropshippingProducts: createDropProducts(mei.id, 'Natureza', [
      { name: 'Composteira Doméstica 3 Caixas', price: 149.90, category: 'Compostagem', image: '♻️', platform: 'Mercado Livre' },
      { name: 'Kit Horta Vertical 5 Módulos', price: 199.90, category: 'Jardinagem', image: '🌿', platform: 'Shopee' },
      { name: 'Desidratador de Alimentos 5 Bandejas', price: 299.90, category: 'Cozinha', image: '🍎', platform: 'Mercado Livre' },
      { name: 'Extrator de Suco a Frio', price: 349.90, category: 'Cozinha', image: '🥤', platform: 'OLX' },
      { name: 'Irrigação por Gotejamento Kit', price: 89.90, category: 'Jardinagem', image: '💧', platform: 'Shopee' },
      { name: 'Difusor Ultrassônico Aromaterapia', price: 69.90, category: 'Aromaterapia', image: '🌸', platform: 'Mercado Livre' },
      { name: 'Kit Óleos Essenciais (12 frascos)', price: 129.90, category: 'Aromaterapia', image: '🧴', platform: 'Shopee' },
      { name: 'Estufa para Mudas 120x60cm', price: 179.90, category: 'Jardinagem', image: '🌱', platform: 'OLX' },
      { name: 'Panela de Barro Artesanal Kit', price: 99.90, category: 'Cozinha', image: '🍲', platform: 'Mercado Livre' },
      { name: 'Germinador de Brotos Automático', price: 89.90, category: 'Alimentação', image: '🌱', platform: 'Shopee' },
    ]),
  })),
];

/* ─── PRODUTOS LEGADO (mantido para compatibilidade) ─── */
export interface ProductItem {
  id: number;
  name: string;
  price: number;
  category: string;
  image: string;
  rating: number;
  supplier: string;
  relatedServiceIds: number[];
}

export const clientProducts: ProductItem[] = [
  { id: 1, name: 'Smartphone Xiaomi Redmi 13C', price: 899.90, category: 'Eletrônicos', image: '📱', rating: 4.5, supplier: 'TechDrop BR', relatedServiceIds: [] },
  { id: 2, name: 'Fone Bluetooth TWS Pro', price: 79.90, category: 'Acessórios', image: '🎧', rating: 4.8, supplier: 'AudioMax', relatedServiceIds: [] },
  { id: 3, name: 'Smartwatch Band 8', price: 199.90, category: 'Eletrônicos', image: '⌚', rating: 4.3, supplier: 'TechDrop BR', relatedServiceIds: [] },
  { id: 4, name: 'Carregador Turbo USB-C', price: 89.90, category: 'Acessórios', image: '🔌', rating: 4.6, supplier: 'PowerTech', relatedServiceIds: [] },
  { id: 5, name: 'Câmera de Segurança WiFi', price: 149.90, category: 'Casa', image: '📷', rating: 4.4, supplier: 'SecureTech', relatedServiceIds: [1] },
  { id: 6, name: 'Echo Dot 5ª Geração', price: 349.90, category: 'Casa', image: '🔊', rating: 4.7, supplier: 'SmartHome BR', relatedServiceIds: [] },
  { id: 7, name: 'Fio Elétrico 2.5mm (100m)', price: 89.90, category: 'Material Elétrico', image: '🔌', rating: 4.6, supplier: 'EletroParts', relatedServiceIds: [1] },
  { id: 8, name: 'Fita Isolante Premium', price: 12.90, category: 'Material Elétrico', image: '🛠️', rating: 4.4, supplier: 'EletroParts', relatedServiceIds: [1] },
  { id: 9, name: 'Kit Tomadas e Interruptores', price: 45.90, category: 'Material Elétrico', image: '💡', rating: 4.5, supplier: 'EletroParts', relatedServiceIds: [1] },
  { id: 10, name: 'Kit Conexões PVC', price: 34.90, category: 'Material Hidráulico', image: '🔧', rating: 4.3, supplier: 'HidroMax', relatedServiceIds: [2] },
  { id: 11, name: 'Torneira Monocomando Inox', price: 129.90, category: 'Material Hidráulico', image: '🚿', rating: 4.7, supplier: 'HidroMax', relatedServiceIds: [2] },
  { id: 12, name: 'Kit Parafusos e Buchas', price: 19.90, category: 'Ferramentas', image: '🔩', rating: 4.2, supplier: 'FerraTudo', relatedServiceIds: [4] },
  { id: 13, name: 'Kit Limpeza Multiuso (5 itens)', price: 39.90, category: 'Limpeza', image: '🧴', rating: 4.5, supplier: 'CleanPro', relatedServiceIds: [5] },
  { id: 14, name: 'Vassoura + Rodo Profissional', price: 49.90, category: 'Limpeza', image: '🧹', rating: 4.3, supplier: 'CleanPro', relatedServiceIds: [5] },
  { id: 15, name: 'Desinfetante Concentrado 5L', price: 29.90, category: 'Limpeza', image: '🫧', rating: 4.6, supplier: 'CleanPro', relatedServiceIds: [5] },
];

/* ─── LÓGICA DE ELEGIBILIDADE ─── */
export type EligibilityStatus = 'disponivel_total' | 'disponivel_parcial' | 'bloqueado';

const planTierOrder: Record<PlanTier, number> = { bronze: 1, prata: 2, ouro: 3 };

export function checkEligibility(
  service: ServiceItem,
  userCredits: number,
  userMonths: number,
  userPlan: PlanTier
): {
  status: EligibilityStatus;
  creditsUsed: number;
  extraValue: number;
  monthsRemaining: number;
  needsUpgrade: boolean;
  suggestedPlan?: PlanTier;
} {
  const planOk = planTierOrder[userPlan] >= planTierOrder[service.minPlan];
  const timeOk = userMonths >= service.minMonths;

  if (!planOk || !timeOk) {
    const monthsRemaining = timeOk ? 0 : service.minMonths - userMonths;
    const suggestedPlan = !planOk ? service.minPlan : undefined;
    return {
      status: 'bloqueado',
      creditsUsed: 0,
      extraValue: service.monetaryValue,
      monthsRemaining,
      needsUpgrade: !planOk,
      suggestedPlan,
    };
  }

  if (userCredits >= service.creditCost) {
    return {
      status: 'disponivel_total',
      creditsUsed: service.creditCost,
      extraValue: 0,
      monthsRemaining: 0,
      needsUpgrade: false,
    };
  }

  if (service.allowComplement && userCredits > 0) {
    const creditsUsed = userCredits;
    const remaining = service.creditCost - userCredits;
    const extraValue = (remaining / service.creditCost) * service.monetaryValue;
    return {
      status: 'disponivel_parcial',
      creditsUsed,
      extraValue: Math.round(extraValue * 100) / 100,
      monthsRemaining: 0,
      needsUpgrade: false,
    };
  }

  return {
    status: 'bloqueado',
    creditsUsed: 0,
    extraValue: service.monetaryValue,
    monthsRemaining: 0,
    needsUpgrade: false,
  };
}

/* ─── CATEGORIAS COM ÍCONES ─── */
export const serviceCategories = [
  { name: 'Manutenção & Reparos', icon: '🔧', color: '#F59E0B' },
  { name: 'Saúde', icon: '🩺', color: '#EF4444' },
  { name: 'Bem-estar & Saúde', icon: '💪', color: '#10B981' },
  { name: 'Estética & Beleza', icon: '💇', color: '#EC4899' },
  { name: 'Lar & Ambiente', icon: '🏠', color: '#6366F1' },
  { name: 'Automotivo', icon: '🚗', color: '#3B82F6' },
  { name: 'Digital & Criativo', icon: '🎨', color: '#8B5CF6' },
  { name: 'Tecnologia & Informática', icon: '💻', color: '#06B6D4' },
  { name: 'Educação & Cursos', icon: '🎓', color: '#F97316' },
  { name: 'Pet & Animais', icon: '🐕', color: '#84CC16' },
  { name: 'Eventos & Festas', icon: '🎉', color: '#D946EF' },
  { name: 'Música', icon: '🎵', color: '#E11D48' },
  { name: 'Natureza & Vida Natural', icon: '🌿', color: '#15803D' },
];

/* ─── DASHBOARD MEI ─── */
export const meiDashboard = {
  revenue: {
    total: 12450.00,
    thisMonth: 3280.00,
    growth: 18.5,
  },
  orders: {
    total: 156,
    pending: 8,
    completed: 142,
    cancelled: 6,
  },
  topProducts: [
    { name: 'Smartphone Xiaomi Redmi', sold: 45, revenue: 4500 },
    { name: 'Fone Bluetooth TWS', sold: 38, revenue: 1520 },
    { name: 'Capinha Silicone Premium', sold: 62, revenue: 930 },
    { name: 'Película 3D', sold: 55, revenue: 825 },
    { name: 'Carregador Turbo 65W', sold: 28, revenue: 1120 },
  ],
  revenueChart: [
    { month: 'Jan', value: 1800 },
    { month: 'Fev', value: 2200 },
    { month: 'Mar', value: 1950 },
    { month: 'Abr', value: 2800 },
    { month: 'Mai', value: 3100 },
    { month: 'Jun', value: 3280 },
  ],
  stock: [
    { id: 1, name: 'Smartphone Xiaomi Redmi 13C', qty: 15, price: 899.90, supplier: 'TechDrop BR', status: 'available' },
    { id: 2, name: 'Fone Bluetooth TWS Pro', qty: 42, price: 79.90, supplier: 'AudioMax', status: 'available' },
    { id: 3, name: 'Capinha Silicone iPhone 15', qty: 0, price: 29.90, supplier: 'CasePro', status: 'out_of_stock' },
    { id: 4, name: 'Película 3D Samsung S24', qty: 8, price: 19.90, supplier: 'ScreenGuard', status: 'low_stock' },
    { id: 5, name: 'Carregador Turbo USB-C 65W', qty: 23, price: 89.90, supplier: 'PowerTech', status: 'available' },
    { id: 6, name: 'Smartwatch Band 8', qty: 5, price: 199.90, supplier: 'TechDrop BR', status: 'low_stock' },
  ],
  financials: {
    cashFlow: [
      { date: '20/06', income: 850, expense: 320 },
      { date: '21/06', income: 1200, expense: 450 },
      { date: '22/06', income: 680, expense: 200 },
      { date: '23/06', income: 950, expense: 380 },
      { date: '24/06', income: 1500, expense: 520 },
      { date: '25/06', income: 780, expense: 290 },
    ],
    accountsReceivable: 4250.00,
    accountsPayable: 1890.00,
    balance: 8320.00,
  },
  servicesPerformed: [
    { serviceId: 1, name: 'Eletricista Residencial', completedJobs: 28, revenue: 4200, productsUpsold: 45, productRevenue: 2100, avgRating: 4.9 },
    { serviceId: 5, name: 'Limpeza Residencial', completedJobs: 35, revenue: 3500, productsUpsold: 62, productRevenue: 1800, avgRating: 4.6 },
    { serviceId: 4, name: 'Montagem de Móveis', completedJobs: 18, revenue: 1440, productsUpsold: 22, productRevenue: 440, avgRating: 4.5 },
  ],
  meiSuggestions: [
    { type: 'upsell', message: 'Clientes de Eletricista compraram 45 produtos — ofereça kit de materiais junto ao serviço para +R$47/job', icon: '💡' },
    { type: 'expansion', message: 'Há 12 pedidos de Encanamento na sua região sem MEI ativo — considere adicionar este serviço', icon: '📈' },
    { type: 'retention', message: '8 clientes completaram 3 meses — momento ideal para sugerir upgrade de plano para Ouro', icon: '🎯' },
    { type: 'pricing', message: 'Seu preço de Limpeza Residencial está 15% abaixo da média — considere reajuste para R$115', icon: '💰' },
  ],
};
