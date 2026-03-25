// Mock data for the demo app

export const plans = [
  {
    id: 'bronze',
    name: 'Bronze',
    price: 29.90,
    color: '#CD7F32',
    discount: 5,
    services: 'Taxa de visita grátis',
    features: [
      '5% desconto em produtos',
      'Taxa de visita grátis',
      'Suporte por e-mail',
      'Acesso ao catálogo básico',
    ],
  },
  {
    id: 'prata',
    name: 'Prata',
    price: 59.90,
    color: '#C0C0C0',
    discount: 10,
    services: '1 serviço mensal coberto',
    features: [
      '10% desconto em produtos',
      '1 serviço mensal coberto',
      'Suporte prioritário',
      'Acesso ao catálogo completo',
      'Carteira de pontos',
    ],
    popular: true,
  },
  {
    id: 'ouro',
    name: 'Ouro',
    price: 99.90,
    color: '#FFD700',
    discount: 20,
    services: 'Serviços ilimitados',
    features: [
      '20% desconto em produtos',
      'Serviços ilimitados',
      'Suporte VIP 24/7',
      'Acesso premium total',
      'Carteira de pontos 2x',
      'Garantia estendida',
    ],
  },
];

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
};

export const clientProducts = [
  { id: 1, name: 'Smartphone Xiaomi Redmi 13C', price: 899.90, category: 'Eletrônicos', image: '📱', rating: 4.5 },
  { id: 2, name: 'Fone Bluetooth TWS Pro', price: 79.90, category: 'Acessórios', image: '🎧', rating: 4.8 },
  { id: 3, name: 'Smartwatch Band 8', price: 199.90, category: 'Eletrônicos', image: '⌚', rating: 4.3 },
  { id: 4, name: 'Carregador Turbo USB-C', price: 89.90, category: 'Acessórios', image: '🔌', rating: 4.6 },
  { id: 5, name: 'Câmera de Segurança WiFi', price: 149.90, category: 'Casa', image: '📷', rating: 4.4 },
  { id: 6, name: 'Echo Dot 5ª Geração', price: 349.90, category: 'Casa', image: '🔊', rating: 4.7 },
];

export const clientServices = [
  { id: 1, name: 'Eletricista Residencial', price: 150.00, category: 'Casa', icon: '⚡', rating: 4.9, provider: 'João Eletricista' },
  { id: 2, name: 'Encanador', price: 120.00, category: 'Casa', icon: '🔧', rating: 4.7, provider: 'Pedro Encanador' },
  { id: 3, name: 'Designer Gráfico', price: 200.00, category: 'Digital', icon: '🎨', rating: 4.8, provider: 'Ana Design' },
  { id: 4, name: 'Montagem de Móveis', price: 80.00, category: 'Casa', icon: '🪑', rating: 4.5, provider: 'Carlos Marceneiro' },
  { id: 5, name: 'Limpeza Residencial', price: 100.00, category: 'Casa', icon: '🧹', rating: 4.6, provider: 'Maria Clean' },
  { id: 6, name: 'Fotógrafo de Eventos', price: 350.00, category: 'Eventos', icon: '📸', rating: 4.9, provider: 'Lucas Foto' },
];
