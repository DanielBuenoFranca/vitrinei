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
    loyaltyBonusPercent: 2, // +2% créditos por mês ativo
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
  isActive: true, // adimplente
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
  monetaryValue: number; // valor de referência em R$
  relatedProductIds: number[];
}

export const clientServices: ServiceItem[] = [
  // Manutenção & Reparos (Marido de aluguel)
  { id: 1, name: 'Eletricista Residencial', icon: '⚡', category: 'Manutenção & Reparos', provider: 'João Eletricista', rating: 4.9, creditCost: 80, minMonths: 2, minPlan: 'bronze', allowComplement: true, monetaryValue: 150.00, relatedProductIds: [7, 8, 9] },
  { id: 2, name: 'Encanador', icon: '🔧', category: 'Manutenção & Reparos', provider: 'Pedro Encanador', rating: 4.7, creditCost: 65, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 120.00, relatedProductIds: [10, 11] },
  { id: 4, name: 'Montagem de Móveis', icon: '🪑', category: 'Manutenção & Reparos', provider: 'Carlos Marceneiro', rating: 4.5, creditCost: 45, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 80.00, relatedProductIds: [12] },
  { id: 16, name: 'Pintor Residencial', icon: '🎨', category: 'Manutenção & Reparos', provider: 'Marcos Pintura', rating: 4.6, creditCost: 90, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 180.00, relatedProductIds: [] },
  // Bem-estar & Saúde
  { id: 17, name: 'Personal Trainer', icon: '💪', category: 'Bem-estar & Saúde', provider: 'Fit Express', rating: 4.8, creditCost: 70, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 130.00, relatedProductIds: [] },
  { id: 18, name: 'Nutricionista Online', icon: '🥗', category: 'Bem-estar & Saúde', provider: 'NutriVida', rating: 4.9, creditCost: 60, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 110.00, relatedProductIds: [] },
  { id: 19, name: 'Fisioterapeuta', icon: '🏥', category: 'Bem-estar & Saúde', provider: 'FisioHome', rating: 4.7, creditCost: 95, minMonths: 3, minPlan: 'prata', allowComplement: true, monetaryValue: 190.00, relatedProductIds: [] },
  // Estética & Beleza
  { id: 20, name: 'Cabeleireiro em Casa', icon: '💇', category: 'Estética & Beleza', provider: 'Beauty Home', rating: 4.8, creditCost: 50, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 90.00, relatedProductIds: [] },
  { id: 21, name: 'Manicure & Pedicure', icon: '💅', category: 'Estética & Beleza', provider: 'Nails Pro', rating: 4.6, creditCost: 35, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 60.00, relatedProductIds: [] },
  { id: 22, name: 'Estética Facial', icon: '✨', category: 'Estética & Beleza', provider: 'Glow Skin', rating: 4.9, creditCost: 110, minMonths: 3, minPlan: 'prata', allowComplement: true, monetaryValue: 220.00, relatedProductIds: [] },
  // Lar & Ambiente
  { id: 5, name: 'Limpeza Residencial', icon: '🧹', category: 'Lar & Ambiente', provider: 'Maria Clean', rating: 4.6, creditCost: 55, minMonths: 2, minPlan: 'bronze', allowComplement: true, monetaryValue: 100.00, relatedProductIds: [13, 14, 15] },
  { id: 23, name: 'Jardinagem', icon: '🌿', category: 'Lar & Ambiente', provider: 'Verde Vivo', rating: 4.5, creditCost: 40, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 70.00, relatedProductIds: [] },
  { id: 24, name: 'Dedetização', icon: '🐜', category: 'Lar & Ambiente', provider: 'SafeHome', rating: 4.7, creditCost: 85, minMonths: 2, minPlan: 'prata', allowComplement: true, monetaryValue: 160.00, relatedProductIds: [] },
  // Automotivo
  { id: 25, name: 'Lavagem Automotiva', icon: '🚗', category: 'Automotivo', provider: 'Auto Brilho', rating: 4.4, creditCost: 30, minMonths: 1, minPlan: 'bronze', allowComplement: true, monetaryValue: 50.00, relatedProductIds: [] },
  { id: 26, name: 'Mecânico Domiciliar', icon: '🔩', category: 'Automotivo', provider: 'MecFix', rating: 4.7, creditCost: 100, minMonths: 3, minPlan: 'prata', allowComplement: true, monetaryValue: 200.00, relatedProductIds: [] },
  { id: 27, name: 'Funilaria Express', icon: '🛠️', category: 'Automotivo', provider: 'AutoRestore', rating: 4.5, creditCost: 130, minMonths: 4, minPlan: 'prata', allowComplement: true, monetaryValue: 260.00, relatedProductIds: [] },
  // Others
  { id: 3, name: 'Designer Gráfico', icon: '🎨', category: 'Digital & Criativo', provider: 'Ana Design', rating: 4.8, creditCost: 100, minMonths: 3, minPlan: 'prata', allowComplement: true, monetaryValue: 200.00, relatedProductIds: [] },
  { id: 6, name: 'Fotógrafo de Eventos', icon: '📸', category: 'Digital & Criativo', provider: 'Lucas Foto', rating: 4.9, creditCost: 180, minMonths: 6, minPlan: 'ouro', allowComplement: false, monetaryValue: 350.00, relatedProductIds: [] },
];

/* ─── PRODUTOS (com correlação a serviços) ─── */
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
  // Eletrônicos gerais
  { id: 1, name: 'Smartphone Xiaomi Redmi 13C', price: 899.90, category: 'Eletrônicos', image: '📱', rating: 4.5, supplier: 'TechDrop BR', relatedServiceIds: [] },
  { id: 2, name: 'Fone Bluetooth TWS Pro', price: 79.90, category: 'Acessórios', image: '🎧', rating: 4.8, supplier: 'AudioMax', relatedServiceIds: [] },
  { id: 3, name: 'Smartwatch Band 8', price: 199.90, category: 'Eletrônicos', image: '⌚', rating: 4.3, supplier: 'TechDrop BR', relatedServiceIds: [] },
  { id: 4, name: 'Carregador Turbo USB-C', price: 89.90, category: 'Acessórios', image: '🔌', rating: 4.6, supplier: 'PowerTech', relatedServiceIds: [] },
  { id: 5, name: 'Câmera de Segurança WiFi', price: 149.90, category: 'Casa', image: '📷', rating: 4.4, supplier: 'SecureTech', relatedServiceIds: [1] },
  { id: 6, name: 'Echo Dot 5ª Geração', price: 349.90, category: 'Casa', image: '🔊', rating: 4.7, supplier: 'SmartHome BR', relatedServiceIds: [] },
  // Produtos correlacionados com Eletricista (serviço 1)
  { id: 7, name: 'Fio Elétrico 2.5mm (100m)', price: 89.90, category: 'Material Elétrico', image: '🔌', rating: 4.6, supplier: 'EletroParts', relatedServiceIds: [1] },
  { id: 8, name: 'Fita Isolante Premium', price: 12.90, category: 'Material Elétrico', image: '🛠️', rating: 4.4, supplier: 'EletroParts', relatedServiceIds: [1] },
  { id: 9, name: 'Kit Tomadas e Interruptores', price: 45.90, category: 'Material Elétrico', image: '💡', rating: 4.5, supplier: 'EletroParts', relatedServiceIds: [1] },
  // Produtos correlacionados com Encanador (serviço 2)
  { id: 10, name: 'Kit Conexões PVC', price: 34.90, category: 'Material Hidráulico', image: '🔧', rating: 4.3, supplier: 'HidroMax', relatedServiceIds: [2] },
  { id: 11, name: 'Torneira Monocomando Inox', price: 129.90, category: 'Material Hidráulico', image: '🚿', rating: 4.7, supplier: 'HidroMax', relatedServiceIds: [2] },
  // Produtos correlacionados com Montagem de Móveis (serviço 4)
  { id: 12, name: 'Kit Parafusos e Buchas', price: 19.90, category: 'Ferramentas', image: '🔩', rating: 4.2, supplier: 'FerraTudo', relatedServiceIds: [4] },
  // Produtos correlacionados com Limpeza (serviço 5)
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
  // MEI service performance
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
