import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft, Search, ShoppingCart, Star, ChevronRight, ChevronLeft,
  Play, Package, Zap, Filter, MapPin, Clock, Truck, Globe,
  Heart, TrendingDown, CheckCircle2, CreditCard, Gift, BarChart3,
  Percent, Tag, ArrowUpDown, ShoppingBag, Sparkles, Timer, Coins,
  Store, AlertCircle, Warehouse, Navigation
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── PRODUCTS DB ─── */
const allProducts = [
  { id: 1, name: 'Kit LED Inteligente Philips', price: 189.90, originalPrice: 299.90, image: '💡', supplier: 'EletroParts BR', supplierFlag: '🇧🇷', category: 'eletrica', rating: 4.8, reviews: 234, mei: 'João Eletricista', meiAvatar: '⚡', withService: true, servicePrice: 80, sla: '2-3 dias', worldwide: false, stockType: 'fisico' as const },
  { id: 2, name: 'Xiaomi Smart Socket WiFi', price: 45.90, originalPrice: 89.90, image: '🔌', supplier: 'Shenzhen Direct', supplierFlag: '🇨🇳', category: 'eletrica', rating: 4.5, reviews: 1893, mei: 'João Eletricista', meiAvatar: '⚡', withService: true, servicePrice: 50, sla: '15-25 dias', worldwide: true, stockType: 'drop' as const },
  { id: 3, name: 'Torneira Sensor Automática', price: 129.90, originalPrice: 219.90, image: '🚿', supplier: 'HidroTech', supplierFlag: '🇧🇷', category: 'hidraulica', rating: 4.6, reviews: 87, mei: 'Pedro Encanador', meiAvatar: '🔧', withService: true, servicePrice: 65, sla: '3-5 dias', worldwide: false, stockType: 'fisico' as const },
  { id: 4, name: 'Robot Aspirador Xiaomi', price: 899.90, originalPrice: 1499.90, image: '🤖', supplier: 'Global Imports', supplierFlag: '🇨🇳', category: 'limpeza', rating: 4.9, reviews: 3421, mei: 'Maria Clean', meiAvatar: '🧹', withService: false, servicePrice: 0, sla: '10-20 dias', worldwide: true, stockType: 'drop' as const },
  { id: 5, name: 'SSD NVMe 1TB Samsung', price: 349.90, originalPrice: 499.90, image: '💾', supplier: 'TechParts Korea', supplierFlag: '🇰🇷', category: 'informatica', rating: 4.9, reviews: 5672, mei: 'TechFix Informática', meiAvatar: '💻', withService: true, servicePrice: 90, sla: '7-12 dias', worldwide: true, stockType: 'drop' as const },
  { id: 6, name: 'Vestido Linho Premium', price: 89.90, originalPrice: 159.90, image: '👗', supplier: 'Milano Fashion', supplierFlag: '🇮🇹', category: 'moda', rating: 4.4, reviews: 312, mei: 'Boutique Ana', meiAvatar: '👗', withService: false, servicePrice: 0, sla: '12-18 dias', worldwide: true, stockType: 'drop' as const },
  { id: 7, name: 'Luminária Nórdica Artesanal', price: 199.90, originalPrice: 349.90, image: '🏮', supplier: 'Nordic Design', supplierFlag: '🇸🇪', category: 'casa', rating: 4.7, reviews: 156, mei: 'Decor House', meiAvatar: '🏠', withService: true, servicePrice: 40, sla: '14-21 dias', worldwide: true, stockType: 'drop' as const },
  { id: 8, name: 'Kit Ferramentas Bosch Pro', price: 459.90, originalPrice: 699.90, image: '🧰', supplier: 'ToolWorld DE', supplierFlag: '🇩🇪', category: 'eletrica', rating: 4.8, reviews: 892, mei: 'João Eletricista', meiAvatar: '⚡', withService: false, servicePrice: 0, sla: '8-15 dias', worldwide: true, stockType: 'drop' as const },
];

const categories = [
  { id: 'all', label: 'Todos', emoji: '🌐' },
  { id: 'eletrica', label: 'Elétrica', emoji: '⚡' },
  { id: 'hidraulica', label: 'Hidráulica', emoji: '🔧' },
  { id: 'limpeza', label: 'Limpeza', emoji: '🧹' },
  { id: 'informatica', label: 'Informática', emoji: '💻' },
  { id: 'moda', label: 'Moda', emoji: '👗' },
  { id: 'casa', label: 'Casa & Decor', emoji: '🏠' },
];

/* ─── STEPS: variam conforme tipo de produto ─── */
const localSteps = [
  { id: 'select', label: 'Produto Selecionado', icon: ShoppingBag, emoji: '📦', desc: 'Produto do estoque do prestador' },
  { id: 'confirm', label: 'Confirmação', icon: CheckCircle2, emoji: '✅', desc: 'Dados do pedido e SLA local' },
  { id: 'dispatch', label: 'Despacho', icon: Truck, emoji: '🚚', desc: 'Prestador separa e envia junto com o serviço' },
  { id: 'delivery', label: 'Entrega', icon: Navigation, emoji: '📍', desc: 'Entrega rápida com o técnico' },
  { id: 'done', label: 'Concluído', icon: Gift, emoji: '🎉', desc: 'Produto entregue e instalado' },
];

const dropSteps = [
  { id: 'select', label: 'Produto Selecionado', icon: ShoppingBag, emoji: '🌍', desc: 'Produto de fornecedor global' },
  { id: 'confirm', label: 'Confirmação', icon: CheckCircle2, emoji: '✅', desc: 'Dados do pedido e SLA internacional' },
  { id: 'supplier', label: 'Fornecedor', icon: Globe, emoji: '🏭', desc: 'Ordem enviada ao fornecedor' },
  { id: 'transit', label: 'Em Trânsito', icon: Truck, emoji: '✈️', desc: 'Rastreio internacional em tempo real' },
  { id: 'delivery', label: 'Entrega', icon: Navigation, emoji: '📦', desc: 'Chegou ao destino' },
  { id: 'done', label: 'Concluído', icon: Gift, emoji: '🎉', desc: 'Produto recebido com sucesso' },
];

const genericSteps = [
  { id: 'browse', label: 'Explorar', icon: Search, emoji: '🔍', desc: 'Catálogo global de produtos' },
  { id: 'compare', label: 'Comparar', icon: ArrowUpDown, emoji: '⚖️', desc: 'Preços e fornecedores' },
  { id: 'cart', label: 'Carrinho', icon: ShoppingCart, emoji: '🛒', desc: 'Multi-fornecedor e serviços' },
  { id: 'checkout', label: 'Pagamento', icon: CreditCard, emoji: '💳', desc: 'Descontos do plano aplicados' },
  { id: 'tracking', label: 'Rastreio', icon: Truck, emoji: '📦', desc: 'Entregas em tempo real' },
  { id: 'benefits', label: 'Benefícios', icon: Gift, emoji: '🎁', desc: 'Economia e vantagens' },
];

const PhoneFrame = ({ children }: { children: React.ReactNode }) => (
  <div className="mx-auto max-w-sm">
    <div className="relative mx-auto w-full max-w-[360px] rounded-[2.5rem] border-[6px] border-foreground/20 bg-card shadow-2xl overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-foreground/20 rounded-b-2xl z-10" />
      <div className="pt-8 bg-primary/5 border-b border-border px-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-primary" /><span className="text-xs font-bold text-foreground">EcoMEI Shop</span></div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1"><Coins className="w-3 h-3 text-primary" /><span className="text-[10px] font-bold">95 cr</span></div>
            <div className="relative"><ShoppingCart className="w-4 h-4 text-foreground" /><div className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full text-[7px] text-white flex items-center justify-center">1</div></div>
          </div>
        </div>
      </div>
      <div className="h-[520px] overflow-y-auto bg-background">{children}</div>
    </div>
  </div>
);

/* ──────────────────────────────────────────── */
const DropshippingDemo = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [favorites, setFavorites] = useState<number[]>([1, 4]);
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'discount'>('discount');
  const [deliveryProgress, setDeliveryProgress] = useState(0);

  // Context from URL params
  const contextProduct = searchParams.get('productName');
  const contextType = searchParams.get('productType') as 'fisico' | 'drop' | null;
  const contextPrice = searchParams.get('productPrice');
  const contextProvider = searchParams.get('productProvider');

  const isContextual = !!contextProduct;
  const isLocal = contextType === 'fisico';
  const steps = isContextual ? (isLocal ? localSteps : dropSteps) : genericSteps;
  const step = steps[currentStep];

  useEffect(() => {
    if (!autoPlay) return;
    const t = setTimeout(() => { if (currentStep < steps.length - 1) setCurrentStep(c => c + 1); else setAutoPlay(false); }, 4000);
    return () => clearTimeout(t);
  }, [autoPlay, currentStep, steps.length]);

  useEffect(() => {
    const trackingStepId = step?.id;
    if (trackingStepId === 'transit' || trackingStepId === 'tracking' || trackingStepId === 'delivery') {
      setDeliveryProgress(0);
      const i = setInterval(() => setDeliveryProgress(p => p >= 100 ? (clearInterval(i), 100) : p + 1.5), 60);
      return () => clearInterval(i);
    }
  }, [currentStep, step?.id]);

  const filteredProducts = allProducts.filter(p => selectedCategory === 'all' || p.category === selectedCategory);
  const sortedProducts = [...filteredProducts].sort((a, b) => sortBy === 'price' ? a.price - b.price : sortBy === 'rating' ? b.rating - a.rating : (b.originalPrice / b.price) - (a.originalPrice / a.price));

  const cartItems = [allProducts[0], allProducts[2], allProducts[4]];
  const cartTotal = cartItems.reduce((s, p) => s + p.price, 0);
  const servicesTotal = cartItems.filter(p => p.withService).reduce((s, p) => s + p.servicePrice, 0);
  const planDiscount = (cartTotal + servicesTotal) * 0.1;

  /* ─── CONTEXTUAL RENDER (estoque local ou drop) ─── */
  const renderContextualStep = () => {
    const productName = contextProduct || 'Produto';
    const productPrice = contextPrice ? parseFloat(contextPrice) : 99.90;
    const provider = contextProvider || 'Fornecedor';

    switch (step.id) {
      case 'select':
        return (
          <div className="p-3 space-y-3">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-card border border-border rounded-xl p-3">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${isLocal ? 'bg-primary/10' : 'bg-accent/10'}`}>
                  {isLocal ? '📦' : '🌍'}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-foreground">{productName}</p>
                  <p className="text-[10px] text-muted-foreground">{provider}</p>
                  <Badge variant={isLocal ? 'default' : 'secondary'} className="text-[9px] mt-1">
                    {isLocal ? <><Warehouse className="w-2.5 h-2.5 mr-0.5" /> Estoque Local</> : <><Globe className="w-2.5 h-2.5 mr-0.5" /> Dropshipping</>}
                  </Badge>
                </div>
                <p className="text-sm font-bold text-foreground">R$ {productPrice.toFixed(2)}</p>
              </div>

              {/* SLA Info */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className={`rounded-lg p-2.5 border ${isLocal ? 'bg-green-500/5 border-green-500/20' : 'bg-accent/5 border-accent/20'}`}>
                <p className="text-[10px] font-bold text-foreground mb-1.5">
                  {isLocal ? '⚡ SLA Estoque Local' : '🌐 SLA Dropshipping (Terceiros)'}
                </p>
                {isLocal ? (
                  <div className="space-y-1 text-[9px] text-muted-foreground">
                    <p className="flex items-center gap-1"><Truck className="w-3 h-3 text-green-600" /> Entrega: <strong className="text-green-600">Junto com o prestador</strong></p>
                    <p className="flex items-center gap-1"><Clock className="w-3 h-3 text-green-600" /> Prazo: <strong className="text-green-600">Mesmo dia do serviço</strong></p>
                    <p className="flex items-center gap-1"><Store className="w-3 h-3 text-green-600" /> Origem: <strong className="text-green-600">Estoque do prestador</strong></p>
                    <p className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-600" /> Instalação inclusa se contratado serviço</p>
                  </div>
                ) : (
                  <div className="space-y-1 text-[9px] text-muted-foreground">
                    <p className="flex items-center gap-1"><Globe className="w-3 h-3 text-accent-foreground" /> Entrega: <strong className="text-accent-foreground">Direto ao cliente</strong></p>
                    <p className="flex items-center gap-1"><Clock className="w-3 h-3 text-accent-foreground" /> Prazo: <strong className="text-accent-foreground">7-25 dias (conforme fornecedor)</strong></p>
                    <p className="flex items-center gap-1"><Store className="w-3 h-3 text-accent-foreground" /> Origem: <strong className="text-accent-foreground">Fornecedor terceiro</strong></p>
                    <p className="flex items-center gap-1"><AlertCircle className="w-3 h-3 text-accent-foreground" /> SLA independente do serviço contratado</p>
                  </div>
                )}
              </motion.div>
            </motion.div>

            {/* Comparison box */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              className="bg-muted/50 border border-border rounded-xl p-2.5">
              <p className="text-[10px] font-bold text-foreground mb-2">📊 Diferença de SLA na prática</p>
              <div className="grid grid-cols-2 gap-2">
                <div className={`rounded-lg p-2 text-center border ${isLocal ? 'border-green-500/30 bg-green-500/5' : 'border-border'}`}>
                  <p className="text-lg">📦</p>
                  <p className="text-[9px] font-bold">Estoque Local</p>
                  <p className="text-[8px] text-muted-foreground">Chega com o técnico</p>
                  <Badge className="text-[7px] mt-1 bg-green-500/10 text-green-600 border-0">Mesmo dia</Badge>
                </div>
                <div className={`rounded-lg p-2 text-center border ${!isLocal ? 'border-accent/30 bg-accent/5' : 'border-border'}`}>
                  <p className="text-lg">🌍</p>
                  <p className="text-[9px] font-bold">Dropshipping</p>
                  <p className="text-[8px] text-muted-foreground">SLA próprio do produto</p>
                  <Badge className="text-[7px] mt-1 bg-accent/10 text-accent-foreground border-0">7-25 dias</Badge>
                </div>
              </div>
            </motion.div>
          </div>
        );

      case 'confirm':
        return (
          <div className="p-3 space-y-3">
            <p className="text-xs font-bold text-foreground">✅ Confirmação do Pedido</p>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-xl p-3">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{isLocal ? '📦' : '🌍'}</span>
                <div>
                  <p className="text-[11px] font-semibold">{productName}</p>
                  <p className="text-[9px] text-muted-foreground">{provider}</p>
                </div>
              </div>
              <div className="space-y-1.5 text-[10px]">
                <div className="flex justify-between"><span className="text-muted-foreground">Produto</span><span className="font-medium">R$ {productPrice.toFixed(2)}</span></div>
                {isLocal && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Instalação (com serviço)</span><span className="font-medium text-green-600">Inclusa</span></div>
                )}
                <div className="flex justify-between text-green-600"><span>Desconto Plano Prata (-10%)</span><span>-R$ {(productPrice * 0.1).toFixed(2)}</span></div>
                <div className="h-px bg-border" />
                <div className="flex justify-between font-bold text-sm"><span>Total</span><span>R$ {(productPrice * 0.9).toFixed(2)}</span></div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              className={`border rounded-xl p-2.5 ${isLocal ? 'bg-green-500/5 border-green-500/20' : 'bg-accent/5 border-accent/20'}`}>
              <p className="text-[10px] font-bold">{isLocal ? '🚚 Entrega com o Prestador' : '✈️ Entrega Internacional'}</p>
              <p className="text-[9px] text-muted-foreground mt-1">
                {isLocal
                  ? 'O produto será separado pelo prestador e entregue junto com a execução do serviço. Sem frete adicional!'
                  : `O produto segue SLA próprio do fornecedor (${provider}). Prazo estimado: 7-25 dias. Rastreio em tempo real disponível.`}
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
              <Button size="sm" className="w-full text-xs gap-1" onClick={() => setCurrentStep(c => c + 1)}>
                <CreditCard className="w-3 h-3" /> Confirmar Compra
              </Button>
            </motion.div>
          </div>
        );

      case 'dispatch':
        return (
          <div className="p-3 space-y-3">
            <p className="text-xs font-bold text-foreground">🚚 Despacho pelo Prestador</p>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-green-500/5 border border-green-500/20 rounded-xl p-3 text-center">
              <span className="text-3xl">👨‍🔧</span>
              <p className="text-[11px] font-bold mt-2">Prestador separou seu produto</p>
              <p className="text-[9px] text-muted-foreground mt-1">{productName} foi adicionado ao kit do técnico</p>
            </motion.div>

            <div className="space-y-2">
              {[
                { icon: '✅', label: 'Pedido confirmado', time: '09:00', done: true },
                { icon: '📦', label: 'Produto separado no estoque', time: '09:05', done: true },
                { icon: '🧰', label: 'Adicionado ao kit do técnico', time: '09:10', done: true },
                { icon: '🚗', label: 'Técnico a caminho com o produto', time: '09:30', done: false },
              ].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.2 }}
                  className="flex items-center gap-2 text-[10px]">
                  <span className="text-base">{item.icon}</span>
                  <div className="flex-1">
                    <span className={item.done ? 'font-medium text-foreground' : 'text-muted-foreground'}>{item.label}</span>
                  </div>
                  <span className="text-[9px] text-muted-foreground">{item.time}</span>
                  {item.done && <CheckCircle2 className="w-3 h-3 text-green-600" />}
                </motion.div>
              ))}
            </div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
              className="bg-primary/5 border border-primary/20 rounded-xl p-2.5 text-[9px] text-center text-muted-foreground">
              💡 Produtos de <strong>estoque local</strong> seguem o SLA do serviço — o técnico leva tudo junto!
            </motion.div>
          </div>
        );

      case 'supplier':
        return (
          <div className="p-3 space-y-3">
            <p className="text-xs font-bold text-foreground">🏭 Ordem Enviada ao Fornecedor</p>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-accent/5 border border-accent/20 rounded-xl p-3 text-center">
              <span className="text-3xl">🌐</span>
              <p className="text-[11px] font-bold mt-2">Pedido enviado ao fornecedor</p>
              <p className="text-[9px] text-muted-foreground mt-1">{provider} — SLA independente do serviço</p>
            </motion.div>

            <div className="space-y-2">
              {[
                { icon: '✅', label: 'Pedido confirmado na plataforma', time: 'Dia 1', done: true },
                { icon: '📤', label: `Ordem enviada para ${provider}`, time: 'Dia 1', done: true },
                { icon: '🏭', label: 'Fornecedor processando', time: 'Dia 2-3', done: true },
                { icon: '📦', label: 'Produto embalado e despachado', time: 'Dia 3-5', done: false },
                { icon: '✈️', label: 'Em trânsito internacional', time: 'Dia 5-20', done: false },
              ].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.2 }}
                  className="flex items-center gap-2 text-[10px]">
                  <span className="text-base">{item.icon}</span>
                  <div className="flex-1">
                    <span className={item.done ? 'font-medium text-foreground' : 'text-muted-foreground'}>{item.label}</span>
                  </div>
                  <span className="text-[9px] text-muted-foreground">{item.time}</span>
                  {item.done && <CheckCircle2 className="w-3 h-3 text-green-600" />}
                </motion.div>
              ))}
            </div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
              className="bg-accent/5 border border-accent/20 rounded-xl p-2.5 text-[9px] text-center text-muted-foreground">
              ⚠️ Produtos <strong>dropshipping</strong> seguem SLA próprio do fornecedor — separado do serviço contratado.
            </motion.div>
          </div>
        );

      case 'transit':
        return (
          <div className="p-3 space-y-3">
            <p className="text-xs font-bold text-foreground">✈️ Rastreio Internacional</p>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🌍</span>
                <div className="flex-1">
                  <p className="text-[11px] font-semibold">{productName}</p>
                  <p className="text-[9px] text-muted-foreground">{provider}</p>
                </div>
              </div>
              <Progress value={deliveryProgress} className="h-1.5 mb-1" />
              <div className="flex justify-between text-[9px]">
                <span className={deliveryProgress >= 90 ? 'text-green-600 font-bold' : 'text-muted-foreground'}>
                  {deliveryProgress >= 90 ? 'Chegou!' : deliveryProgress >= 60 ? 'Em trânsito' : deliveryProgress >= 30 ? 'Despachado' : 'Processando'}
                </span>
                <span className="text-muted-foreground">{Math.round(deliveryProgress)}%</span>
              </div>
            </motion.div>

            <div className="space-y-1.5">
              {[
                { icon: '🏭', label: 'Saiu do fornecedor', loc: provider, active: deliveryProgress >= 10 },
                { icon: '✈️', label: 'Em trânsito aéreo', loc: 'Internacional', active: deliveryProgress >= 30 },
                { icon: '🛃', label: 'Alfândega', loc: 'Brasil', active: deliveryProgress >= 60 },
                { icon: '🚚', label: 'Transportadora local', loc: 'Sua cidade', active: deliveryProgress >= 80 },
                { icon: '📬', label: 'Saiu para entrega', loc: 'Seu endereço', active: deliveryProgress >= 95 },
              ].map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0.3 }} animate={{ opacity: s.active ? 1 : 0.4 }} transition={{ duration: 0.5 }}
                  className={`flex items-center gap-2 text-[10px] px-2 py-1.5 rounded-lg ${s.active ? 'bg-primary/5' : ''}`}>
                  <span className="text-base">{s.icon}</span>
                  <div className="flex-1"><span className={s.active ? 'font-medium text-foreground' : 'text-muted-foreground'}>{s.label}</span></div>
                  <span className="text-[9px] text-muted-foreground">{s.loc}</span>
                  {s.active && <CheckCircle2 className="w-3 h-3 text-green-600" />}
                </motion.div>
              ))}
            </div>
          </div>
        );

      case 'delivery':
        if (isLocal) {
          return (
            <div className="p-3 space-y-3">
              <p className="text-xs font-bold text-foreground">📍 Entrega com o Técnico</p>
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
                <span className="text-3xl">👨‍🔧📦</span>
                <p className="text-sm font-bold text-green-700 mt-2">Técnico chegou com seu produto!</p>
                <p className="text-[10px] text-green-600 mt-1">{productName}</p>
              </motion.div>

              <div className="space-y-2">
                {[
                  { icon: '🔔', label: 'Técnico a caminho', time: '09:30', done: true },
                  { icon: '📍', label: 'Chegou no local', time: '09:55', done: true },
                  { icon: '📦', label: 'Produto entregue ao cliente', time: '09:56', done: true },
                  { icon: '🔧', label: 'Instalação em andamento', time: '10:00', done: true },
                ].map((item, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.2 }}
                    className="flex items-center gap-2 text-[10px]">
                    <span>{item.icon}</span>
                    <span className="flex-1 font-medium text-foreground">{item.label}</span>
                    <span className="text-[9px] text-muted-foreground">{item.time}</span>
                    <CheckCircle2 className="w-3 h-3 text-green-600" />
                  </motion.div>
                ))}
              </div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
                className="bg-green-500/5 border border-green-500/20 rounded-xl p-2.5 text-[9px] text-center text-green-700">
                ✅ Produto de estoque local: <strong>entregue e instalado no mesmo dia!</strong>
              </motion.div>
            </div>
          );
        }
        return (
          <div className="p-3 space-y-3">
            <p className="text-xs font-bold text-foreground">📦 Produto Recebido</p>
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="bg-accent/10 border border-accent/30 rounded-xl p-4 text-center">
              <span className="text-3xl">📬🎉</span>
              <p className="text-sm font-bold text-foreground mt-2">Produto chegou!</p>
              <p className="text-[10px] text-muted-foreground mt-1">{productName} — de {provider}</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-primary/5 border border-primary/20 rounded-xl p-2.5">
              <p className="text-[10px] font-bold text-foreground">📅 Precisa de instalação?</p>
              <p className="text-[9px] text-muted-foreground mt-1">Agendamos um técnico EcoMEI para instalar seu produto. O serviço de instalação segue SLA próprio.</p>
              <Button size="sm" className="w-full text-[10px] mt-2 h-7" onClick={() => navigate('/jornada-cliente')}>
                Agendar Instalação
              </Button>
            </motion.div>
          </div>
        );

      case 'done':
        return (
          <div className="p-3 space-y-3">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="bg-gradient-to-br from-green-500/15 to-primary/10 border border-green-500/30 rounded-xl p-4 text-center">
              <span className="text-3xl">🎉</span>
              <p className="text-sm font-bold text-green-700 mt-2">Pedido Finalizado!</p>
              <p className="text-[10px] text-green-600">{productName}</p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="grid grid-cols-2 gap-2">
              {[
                { icon: '📦', label: 'Tipo', value: isLocal ? 'Estoque Local' : 'Dropshipping', sub: isLocal ? 'Entrega com técnico' : 'Fornecedor global' },
                { icon: '⏱️', label: 'Prazo', value: isLocal ? 'Mesmo dia' : '7-25 dias', sub: isLocal ? 'SLA do serviço' : 'SLA do produto' },
                { icon: '💰', label: 'Economizado', value: `R$ ${(productPrice * 0.1).toFixed(2)}`, sub: 'Plano Prata -10%' },
                { icon: isLocal ? '🔧' : '📬', label: isLocal ? 'Instalação' : 'Recebido', value: isLocal ? 'Inclusa' : 'Entregue', sub: isLocal ? 'Com o técnico' : 'No endereço' },
              ].map((b, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 + i * 0.15 }}
                  className="bg-card border border-border rounded-xl p-2.5 text-center">
                  <span className="text-xl">{b.icon}</span>
                  <p className="text-xs font-bold text-foreground mt-1">{b.value}</p>
                  <p className="text-[9px] text-muted-foreground">{b.sub}</p>
                </motion.div>
              ))}
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
              className={`border rounded-xl p-3 ${isLocal ? 'bg-green-500/5 border-green-500/20' : 'bg-accent/5 border-accent/20'}`}>
              <p className="text-[10px] font-bold text-foreground mb-1.5">
                {isLocal ? '📦 Resumo: Produto de Estoque Local' : '🌍 Resumo: Produto Dropshipping'}
              </p>
              <ul className="space-y-1">
                {(isLocal ? [
                  'Produto do estoque do prestador de serviço',
                  'Entregue junto com o técnico no dia do serviço',
                  'Instalação inclusa quando há serviço vinculado',
                  'SLA segue o prazo do serviço contratado',
                  'Sem frete adicional',
                ] : [
                  'Produto de fornecedor terceiro (global)',
                  'Entrega direto no endereço do cliente',
                  'SLA independente — prazo do fornecedor',
                  'Rastreio internacional em tempo real',
                  'Instalação pode ser agendada separadamente',
                ]).map((v, i) => (
                  <li key={i} className="text-[9px] text-muted-foreground flex items-start gap-1">
                    <CheckCircle2 className="w-3 h-3 text-green-600 shrink-0 mt-0.5" />{v}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        );

      default: return null;
    }
  };

  /* ─── GENERIC RENDER (catalog exploration) ─── */
  const renderGenericStep = () => {
    switch (step.id) {
      case 'browse':
        return (
          <div className="p-3 space-y-3">
            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input className="w-full pl-9 pr-3 py-2 rounded-xl bg-muted text-xs border-0 outline-none" placeholder="Buscar em todos os MEIs e fornecedores..." /></div>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {categories.map(c => (
                <button key={c.id} onClick={() => setSelectedCategory(c.id)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] whitespace-nowrap transition-all ${selectedCategory === c.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">{filteredProducts.length} produtos</span>
              <div className="flex gap-1">
                {(['discount', 'price', 'rating'] as const).map(s => (
                  <button key={s} onClick={() => setSortBy(s)} className={`text-[9px] px-1.5 py-0.5 rounded ${sortBy === s ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}>
                    {s === 'discount' ? '% Off' : s === 'price' ? 'Preço' : 'Nota'}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              {sortedProducts.slice(0, 4).map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  className="bg-card border border-border rounded-xl p-2.5 flex gap-2.5">
                  <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center text-2xl shrink-0">{p.image}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <p className="text-[11px] font-semibold text-foreground leading-tight line-clamp-2">{p.name}</p>
                      <button onClick={() => setFavorites(f => f.includes(p.id) ? f.filter(x => x !== p.id) : [...f, p.id])}>
                        <Heart className={`w-3.5 h-3.5 ${favorites.includes(p.id) ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`} />
                      </button>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[10px]">{p.supplierFlag}</span>
                      <span className="text-[9px] text-muted-foreground">{p.supplier}</span>
                      <Badge variant={p.stockType === 'fisico' ? 'default' : 'secondary'} className="text-[7px] h-3.5 ml-1">
                        {p.stockType === 'fisico' ? '📦 Local' : '🌍 Drop'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-xs font-bold text-foreground">R$ {p.price.toFixed(2)}</span>
                      <span className="text-[9px] line-through text-muted-foreground">R$ {p.originalPrice.toFixed(2)}</span>
                      <Badge className="text-[8px] h-4 bg-green-500/10 text-green-600 border-0">-{Math.round((1 - p.price / p.originalPrice) * 100)}%</Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-0.5"><Star className="w-2.5 h-2.5 text-accent fill-accent" /><span className="text-[9px]">{p.rating}</span></div>
                      <span className="text-[9px] text-muted-foreground">via {p.meiAvatar} {p.mei}</span>
                    </div>
                    {p.withService && <Badge variant="outline" className="text-[8px] h-4 mt-1 bg-primary/5 border-primary/20">+ Instalação R$ {p.servicePrice}</Badge>}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );

      case 'compare':
        return (
          <div className="p-3 space-y-3">
            <p className="text-xs font-bold text-foreground">⚖️ Comparativo de Preços</p>
            <p className="text-[10px] text-muted-foreground">Mesmo produto, diferentes fornecedores e SLAs</p>
            <div className="bg-muted/50 rounded-xl p-2.5 text-center mb-2"><span className="text-2xl">💡</span><p className="text-xs font-semibold mt-1">Kit LED Inteligente</p></div>
            {[
              { supplier: 'EletroParts BR', flag: '🇧🇷', price: 189.90, sla: '2-3 dias', mei: 'João Eletricista', type: 'fisico', best: true },
              { supplier: 'Shenzhen Direct', flag: '🇨🇳', price: 129.90, sla: '15-25 dias', mei: 'João Eletricista', type: 'drop', best: false },
              { supplier: 'Amazon US', flag: '🇺🇸', price: 210.50, sla: '8-12 dias', mei: 'TechFix Info', type: 'drop', best: false },
            ].map((opt, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.2 }}
                className={`border rounded-xl p-2.5 ${opt.best ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border'}`}>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-1">
                      <span>{opt.flag}</span>
                      <span className="text-[11px] font-semibold">{opt.supplier}</span>
                      {opt.best && <Badge className="text-[7px] h-3.5 bg-primary">Melhor</Badge>}
                      <Badge variant={opt.type === 'fisico' ? 'default' : 'secondary'} className="text-[7px] h-3.5">
                        {opt.type === 'fisico' ? '📦 Local' : '🌍 Drop'}
                      </Badge>
                    </div>
                    <p className="text-[9px] text-muted-foreground mt-0.5">
                      via {opt.mei} • {opt.sla}
                      {opt.type === 'fisico' ? ' • Chega com o técnico' : ' • Entrega separada'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">R$ {opt.price.toFixed(2)}</p>
                    <p className="text-[9px] text-muted-foreground">+ frete incluso</p>
                  </div>
                </div>
              </motion.div>
            ))}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="bg-accent/10 border border-accent/30 rounded-xl p-2.5">
              <p className="text-[10px] font-bold text-accent-foreground">💡 Dica EcoMEI</p>
              <p className="text-[9px] text-muted-foreground">Produto <strong>Local</strong> = entrega com o técnico (mesmo dia). <strong>Drop</strong> = mais barato mas prazo próprio do fornecedor.</p>
            </motion.div>
          </div>
        );

      case 'cart':
        return (
          <div className="p-3 space-y-3">
            <p className="text-xs font-bold text-foreground">🛒 Seu Carrinho</p>
            <Badge variant="outline" className="text-[9px]">3 produtos — 2 SLAs diferentes</Badge>
            {cartItems.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }}
                className="bg-card border border-border rounded-xl p-2.5">
                <div className="flex gap-2">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-lg">{p.image}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      <p className="text-[11px] font-semibold">{p.name}</p>
                      <Badge variant={p.stockType === 'fisico' ? 'default' : 'secondary'} className="text-[7px] h-3.5">
                        {p.stockType === 'fisico' ? '📦' : '🌍'}
                      </Badge>
                    </div>
                    <p className="text-[9px] text-muted-foreground">{p.supplierFlag} {p.supplier} • SLA: {p.sla}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs font-bold">R$ {p.price.toFixed(2)}</span>
                      {p.withService && <Badge className="text-[8px] h-4 bg-primary/10 text-primary border-0">+ Instalação R$ {p.servicePrice}</Badge>}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="bg-muted/50 rounded-xl p-2.5 space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">Produtos</span><span>R$ {cartTotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Serviços de instalação</span><span>R$ {servicesTotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-green-600"><span>Desconto Plano Prata (-10%)</span><span>-R$ {planDiscount.toFixed(2)}</span></div>
              <div className="h-px bg-border" />
              <div className="flex justify-between font-bold text-sm"><span>Total</span><span>R$ {(cartTotal + servicesTotal - planDiscount).toFixed(2)}</span></div>
            </motion.div>
          </div>
        );

      case 'checkout':
        return (
          <div className="p-3 space-y-3">
            <p className="text-xs font-bold text-foreground">💳 Pagamento</p>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-xl p-3">
              <p className="text-[10px] font-bold text-primary uppercase">Economia do Plano Prata 🥈</p>
              <div className="flex items-center justify-center gap-3 mt-2">
                <div className="text-center"><p className="text-lg font-bold text-destructive line-through">R$ {(cartTotal + servicesTotal).toFixed(2)}</p><p className="text-[9px] text-muted-foreground">Preço cheio</p></div>
                <ChevronRight className="w-4 h-4 text-primary" />
                <div className="text-center"><p className="text-lg font-bold text-green-600">R$ {(cartTotal + servicesTotal - planDiscount).toFixed(2)}</p><p className="text-[9px] text-muted-foreground">Com plano</p></div>
              </div>
              <div className="bg-green-500/10 rounded-lg p-2 mt-2 text-center"><p className="text-sm font-bold text-green-600">Você economizou R$ {planDiscount.toFixed(2)}</p></div>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="space-y-2">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Forma de pagamento</p>
              {['Créditos EcoMEI (95 disponíveis)', 'Cartão •••• 4532', 'PIX'].map((m, i) => (
                <div key={i} className={`border rounded-lg p-2.5 text-xs flex items-center gap-2 cursor-pointer ${i === 1 ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  {i === 1 && <CheckCircle2 className="w-3.5 h-3.5 text-primary" />}
                  <span>{m}</span>
                </div>
              ))}
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
              <Button size="sm" className="w-full text-xs gap-1" onClick={() => setCurrentStep(4)}><CreditCard className="w-3 h-3" />Confirmar Compra</Button>
            </motion.div>
          </div>
        );

      case 'tracking':
        return (
          <div className="p-3 space-y-3">
            <p className="text-xs font-bold text-foreground">📦 Rastreio dos Pedidos</p>
            <p className="text-[9px] text-muted-foreground mb-1">Cada produto segue seu próprio SLA de entrega</p>
            {cartItems.map((p, i) => {
              const progress = Math.min(100, deliveryProgress + (p.stockType === 'fisico' ? 30 : i === 1 ? 0 : -10));
              const statusLabel = progress >= 90 ? 'Entregue' : progress >= 60 ? 'Em trânsito' : progress >= 30 ? 'Despachado' : 'Processando';
              return (
                <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.2 }}
                  className="bg-card border border-border rounded-xl p-2.5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{p.image}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-1">
                        <p className="text-[11px] font-semibold">{p.name}</p>
                        <Badge variant={p.stockType === 'fisico' ? 'default' : 'secondary'} className="text-[7px] h-3.5">
                          {p.stockType === 'fisico' ? '📦' : '🌍'}
                        </Badge>
                      </div>
                      <p className="text-[9px] text-muted-foreground">{p.supplierFlag} {p.supplier} • SLA: {p.sla}</p>
                    </div>
                  </div>
                  <Progress value={Math.max(0, progress)} className="h-1.5 mb-1" />
                  <div className="flex justify-between text-[9px]">
                    <span className={progress >= 90 ? 'text-green-600 font-bold' : 'text-muted-foreground'}>{statusLabel}</span>
                    <span className="text-muted-foreground">{Math.max(0, Math.round(progress))}%</span>
                  </div>
                  {p.withService && progress >= 90 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-1.5 bg-primary/5 border border-primary/20 rounded-lg p-1.5 text-[9px] text-primary font-medium text-center">
                      📅 Instalação agendada automaticamente
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        );

      case 'benefits':
        return (
          <div className="p-3 space-y-3">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gradient-to-br from-green-500/15 to-primary/10 border border-green-500/30 rounded-xl p-4 text-center">
              <span className="text-3xl">🎉</span>
              <p className="text-sm font-bold text-green-700 mt-2">Compra Concluída!</p>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="grid grid-cols-2 gap-2">
              {[
                { icon: '💰', label: 'Economizado', value: `R$ ${planDiscount.toFixed(2)}`, sub: 'Desconto do plano' },
                { icon: '🌍', label: 'Fornecedores', value: '3 países', sub: 'Acesso global' },
                { icon: '⏱️', label: 'Tempo poupado', value: '4h 30min', sub: 'vs. compra tradicional' },
                { icon: '🔧', label: 'Instalação', value: 'Inclusa', sub: '2 serviços agendados' },
              ].map((b, i) => (
                <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 + i * 0.15 }}
                  className="bg-card border border-border rounded-xl p-2.5 text-center">
                  <span className="text-xl">{b.icon}</span>
                  <p className="text-xs font-bold text-foreground mt-1">{b.value}</p>
                  <p className="text-[9px] text-muted-foreground">{b.sub}</p>
                </motion.div>
              ))}
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="bg-accent/10 border border-accent/30 rounded-xl p-3">
              <p className="text-[10px] font-bold text-accent-foreground">🏆 SLA por tipo de produto</p>
              <ul className="space-y-1 mt-1.5">
                {[
                  '📦 Estoque Local → entrega com o técnico, no dia do serviço',
                  '🌍 Dropshipping → SLA do fornecedor, rastreio em tempo real',
                  'Produtos extras adicionados pelo cliente seguem o SLA de cada tipo',
                  'Instalação pode ser agendada junto ou separadamente',
                ].map((v, i) => (
                  <li key={i} className="text-[9px] text-muted-foreground flex items-start gap-1"><CheckCircle2 className="w-3 h-3 text-green-600 shrink-0 mt-0.5" />{v}</li>
                ))}
              </ul>
            </motion.div>
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="fixed top-0 w-full z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => navigate(-1)}><ArrowLeft className="w-4 h-4" />Voltar</Button>
          <span className="font-display text-sm font-bold text-foreground">
            {isContextual
              ? (isLocal ? '📦 Produto — Estoque Local' : '🌍 Produto — Dropshipping')
              : 'Dropshipping — Visão Cliente'}
          </span>
          <Button variant={autoPlay ? 'default' : 'outline'} size="sm" className="text-xs gap-1" onClick={() => { setAutoPlay(!autoPlay); if (!autoPlay && currentStep >= steps.length - 1) setCurrentStep(0); }}>
            <Play className="w-3 h-3" />{autoPlay ? 'Pausar' : 'Auto'}
          </Button>
        </div>
      </nav>

      <div className="pt-20 pb-10 px-4 container mx-auto">
        {/* Context banner */}
        {isContextual && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 max-w-lg mx-auto">
            <Card className={`${isLocal ? 'border-green-500/30 bg-gradient-to-r from-green-500/5 to-primary/5' : 'border-accent/30 bg-gradient-to-r from-accent/5 to-primary/5'}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${isLocal ? 'bg-green-500/10' : 'bg-accent/10'}`}>
                    {isLocal ? '📦' : '🌍'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground">{contextProduct}</p>
                    <p className="text-xs text-muted-foreground">{contextProvider} • R$ {contextPrice}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={isLocal ? 'default' : 'secondary'} className="text-[10px]">
                        {isLocal ? '📦 Estoque do Prestador' : '🌍 Fornecedor Terceiro'}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        SLA: {isLocal ? 'Mesmo dia (com serviço)' : '7-25 dias'}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-3 border-t border-border pt-2">
                  {isLocal
                    ? '✅ Este produto está no estoque do prestador. Será entregue junto com o técnico no dia do serviço. O SLA segue o prazo do serviço.'
                    : '🌐 Este produto vem de um fornecedor terceiro (dropshipping). O SLA é independente — o produto segue seu próprio prazo de entrega.'}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-1 mb-8 flex-wrap">
          {steps.map((s, i) => (
            <button key={s.id} onClick={() => setCurrentStep(i)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
                i === currentStep ? 'bg-primary text-primary-foreground scale-110' : i < currentStep ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
              }`}>
              <span>{s.emoji}</span><span className="hidden sm:inline">{s.label}</span>
            </button>
          ))}
        </div>

        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-foreground mb-1">{step.emoji} {step.label}</h2>
          <p className="text-sm text-muted-foreground">{step.desc}</p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={`${isContextual}-${currentStep}`} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
            <PhoneFrame>{isContextual ? renderContextualStep() : renderGenericStep()}</PhoneFrame>
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-center gap-3 mt-8">
          <Button variant="outline" size="sm" disabled={currentStep === 0} onClick={() => setCurrentStep(c => c - 1)} className="gap-1"><ChevronLeft className="w-4 h-4" />Anterior</Button>
          <Button size="sm" disabled={currentStep === steps.length - 1} onClick={() => setCurrentStep(c => c + 1)} className="gap-1">Próximo<ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>
    </div>
  );
};

export default DropshippingDemo;
