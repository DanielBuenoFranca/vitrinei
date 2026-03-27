import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft, Bell, Calendar, Clock, MapPin, Phone, Camera, CheckCircle2,
  Star, DollarSign, Wrench, Shield, ChevronRight, ChevronLeft,
  Play, Navigation, Package, Banknote, Lock, Unlock, Zap,
  ShoppingBag, CreditCard, TrendingDown, Timer, Sparkles, Gift,
  Coins, ThumbsUp, Receipt, Truck, Search, Heart, ArrowUpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── MOCK DATA ─── */
const mockClient = {
  name: 'Maria Silva',
  avatar: '👩',
  plan: 'Prata 🥈',
  planId: 'prata',
  credits: 95,
  monthlyCredits: 120,
  maxCredits: 300,
  discount: 10,
  monthsActive: 4,
  loyaltyBonus: 5,
};

/* ── Ícones por segmento ── */
const segmentEmojis: Record<string, string> = {
  manutencao: '🔧', saude_clinica: '🩺', bem_estar: '💆', beleza: '💇',
  casa: '🏠', auto: '🚗', digital: '💻', tech: '📱',
  educacao: '📚', pet: '🐾', eventos: '🎉', musica: '🎵', natureza: '🌿',
};

/* ── Produtos relacionados por segmento ── */
const productsBySegment: Record<string, { id: number; name: string; price: number; image: string; supplier: string }[]> = {
  manutencao: [
    { id: 101, name: 'Fio Elétrico 2.5mm (100m)', price: 89.90, image: '🔌', supplier: 'EletroParts' },
    { id: 102, name: 'Fita Isolante Premium', price: 12.90, image: '🛠️', supplier: 'EletroParts' },
    { id: 103, name: 'Kit Tomadas e Interruptores', price: 45.90, image: '💡', supplier: 'EletroParts' },
  ],
  saude_clinica: [
    { id: 201, name: 'Escova Dental Elétrica', price: 129.90, image: '🪥', supplier: 'OdontoShop' },
    { id: 202, name: 'Kit Higiene Oral Premium', price: 39.90, image: '🦷', supplier: 'OdontoShop' },
    { id: 203, name: 'Termômetro Digital', price: 24.90, image: '🌡️', supplier: 'FarmaExpress' },
  ],
  bem_estar: [
    { id: 301, name: 'Tapete de Yoga Premium', price: 79.90, image: '🧘', supplier: 'ZenStore' },
    { id: 302, name: 'Faixa Elástica Kit (5 peças)', price: 34.90, image: '💪', supplier: 'FitShop' },
    { id: 303, name: 'Óleo Essencial Lavanda', price: 29.90, image: '🌸', supplier: 'NaturaVida' },
  ],
  beleza: [
    { id: 401, name: 'Shampoo Profissional 500ml', price: 49.90, image: '🧴', supplier: 'BeautyPro' },
    { id: 402, name: 'Kit Esmaltes (12 cores)', price: 59.90, image: '💅', supplier: 'BeautyPro' },
    { id: 403, name: 'Secador de Cabelo 2200W', price: 189.90, image: '💇', supplier: 'BeautyPro' },
  ],
  casa: [
    { id: 501, name: 'Kit Limpeza Completo', price: 34.90, image: '🧹', supplier: 'CleanShop' },
    { id: 502, name: 'Desinfetante Concentrado 5L', price: 19.90, image: '🧴', supplier: 'CleanShop' },
    { id: 503, name: 'Pano Microfibra Kit (10)', price: 29.90, image: '🧽', supplier: 'CleanShop' },
  ],
  auto: [
    { id: 601, name: 'Óleo 5W30 Sintético', price: 42.90, image: '🛢️', supplier: 'AutoParts' },
    { id: 602, name: 'Filtro de Óleo', price: 19.90, image: '⚙️', supplier: 'AutoParts' },
    { id: 603, name: 'Cera Cristalizadora', price: 34.90, image: '✨', supplier: 'AutoParts' },
  ],
  digital: [
    { id: 701, name: 'Kit Identidade Visual', price: 149.90, image: '🎨', supplier: 'DesignStore' },
    { id: 702, name: 'Banco de Imagens (100 fotos)', price: 29.90, image: '📸', supplier: 'DesignStore' },
    { id: 703, name: 'Template Website Premium', price: 79.90, image: '💻', supplier: 'DesignStore' },
  ],
  tech: [
    { id: 801, name: 'Antivírus 1 Ano', price: 49.90, image: '🔒', supplier: 'TechShop' },
    { id: 802, name: 'Película de Vidro', price: 14.90, image: '📱', supplier: 'TechShop' },
    { id: 803, name: 'Cabo USB-C 2m', price: 19.90, image: '🔌', supplier: 'TechShop' },
  ],
  educacao: [
    { id: 901, name: 'Dicionário Inglês-Português', price: 39.90, image: '📖', supplier: 'EduBooks' },
    { id: 902, name: 'Apostila Preparatória', price: 29.90, image: '📝', supplier: 'EduBooks' },
    { id: 903, name: 'Fone Bluetooth (aulas online)', price: 79.90, image: '🎧', supplier: 'TechShop' },
  ],
  pet: [
    { id: 1001, name: 'Shampoo Pet Premium', price: 24.90, image: '🐕', supplier: 'PetStore' },
    { id: 1002, name: 'Guia Retrátil 5m', price: 34.90, image: '🦮', supplier: 'PetStore' },
    { id: 1003, name: 'Petiscos Training (500g)', price: 19.90, image: '🦴', supplier: 'PetStore' },
  ],
  eventos: [
    { id: 1101, name: 'Kit Doces Finos (100 un)', price: 89.90, image: '🧁', supplier: 'DoceFesta' },
    { id: 1102, name: 'Balões Metalizados Kit', price: 29.90, image: '🎈', supplier: 'DecorFesta' },
    { id: 1103, name: 'Toalha de Mesa Premium', price: 49.90, image: '🎀', supplier: 'DecorFesta' },
  ],
  musica: [
    { id: 1201, name: 'Encordoamento Nylon', price: 19.90, image: '🎸', supplier: 'SomShop' },
    { id: 1202, name: 'Metrônomo Digital', price: 29.90, image: '🎵', supplier: 'SomShop' },
    { id: 1203, name: 'Interface de Áudio USB', price: 249.90, image: '🎙️', supplier: 'SomShop' },
  ],
  natureza: [
    { id: 1301, name: 'Chá Fitoterápico Mix', price: 24.90, image: '🍵', supplier: 'FitoNatural' },
    { id: 1302, name: 'Sementes Orgânicas Kit', price: 19.90, image: '🌱', supplier: 'VerdeVida' },
    { id: 1303, name: 'Kit Óleos Essenciais', price: 59.90, image: '🌿', supplier: 'AromaVida' },
    { id: 1304, name: 'Vaso Autoirrigável', price: 34.90, image: '🪴', supplier: 'VerdeVida' },
    { id: 1305, name: 'Adubo Orgânico 5kg', price: 22.90, image: '🌻', supplier: 'VerdeVida' },
  ],
};

const defaultServices = [
  { id: 1, name: 'Eletricista Residencial', icon: '⚡', provider: 'João Eletricista', rating: 4.9, creditCost: 80, monetaryValue: 150, category: 'Casa', estimatedTime: '1h30min', relatedProducts: 3, segment: 'manutencao' },
  { id: 2, name: 'Encanador', icon: '🔧', provider: 'Pedro Encanador', rating: 4.7, creditCost: 65, monetaryValue: 120, category: 'Casa', estimatedTime: '1h', relatedProducts: 2, segment: 'manutencao' },
  { id: 5, name: 'Limpeza Residencial', icon: '🧹', provider: 'Maria Clean', rating: 4.6, creditCost: 55, monetaryValue: 100, category: 'Casa', estimatedTime: '2h', relatedProducts: 3, segment: 'casa' },
  { id: 4, name: 'Montagem de Móveis', icon: '🪑', provider: 'Carlos Marceneiro', rating: 4.5, creditCost: 45, monetaryValue: 80, category: 'Casa', estimatedTime: '1h30min', relatedProducts: 1, segment: 'casa' },
];

const availableDates = [
  { date: '27/03', day: 'Qui', slots: ['09:00', '11:00', '14:00'] },
  { date: '28/03', day: 'Sex', slots: ['10:00', '14:00', '16:00'] },
  { date: '29/03', day: 'Sáb', slots: ['09:00', '11:00'] },
  { date: '31/03', day: 'Seg', slots: ['09:00', '11:00', '14:00', '16:00'] },
];

/* ─── STEPS ─── */
const steps = [
  { id: 'browse', label: 'Escolher Serviço', icon: Search, emoji: '🔍' },
  { id: 'details', label: 'Detalhes & Produtos', icon: Package, emoji: '📦' },
  { id: 'schedule', label: 'Agendar', icon: Calendar, emoji: '📅' },
  { id: 'finance', label: 'Resumo Financeiro', icon: CreditCard, emoji: '💳' },
  { id: 'confirm', label: 'Confirmação', icon: CheckCircle2, emoji: '✅' },
  { id: 'tracking', label: 'Acompanhar', icon: Navigation, emoji: '📍' },
  { id: 'verify', label: 'Código & Validação', icon: Lock, emoji: '🔐' },
  { id: 'savings', label: 'Economia & Benefícios', icon: Gift, emoji: '🎁' },
];

/* ─── PHONE FRAME ─── */
const PhoneFrame = ({ children }: { children: React.ReactNode }) => (
  <div className="mx-auto max-w-sm">
    <div className="relative mx-auto w-full max-w-[360px] rounded-[2.5rem] border-[6px] border-foreground/20 bg-card shadow-2xl overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-foreground/20 rounded-b-2xl z-10" />
      {/* App header inside phone */}
      <div className="pt-8 bg-primary/5 border-b border-border px-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-foreground">EcoMEI</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Coins className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-bold text-foreground">{mockClient.credits} créditos</span>
          </div>
        </div>
      </div>
      <div className="min-h-[520px] max-h-[600px] overflow-y-auto">
        {children}
      </div>
      <div className="flex justify-center pb-2 pt-1 bg-card">
        <div className="w-28 h-1 bg-foreground/20 rounded-full" />
      </div>
    </div>
  </div>
);

/* ─── TRACKING MAP ─── */
const TrackingMap = ({ progress }: { progress: number }) => (
  <div className="relative w-full h-40 rounded-xl bg-muted overflow-hidden border border-border">
    <svg className="absolute inset-0 w-full h-full opacity-15">
      {[...Array(7)].map((_, i) => (
        <line key={`h${i}`} x1="0" y1={i * 24 + 8} x2="100%" y2={i * 24 + 8} stroke="hsl(var(--foreground))" strokeWidth="0.5" />
      ))}
      {[...Array(12)].map((_, i) => (
        <line key={`v${i}`} x1={i * 28 + 10} y1="0" x2={i * 28 + 10} y2="100%" stroke="hsl(var(--foreground))" strokeWidth="0.5" />
      ))}
    </svg>
    <svg className="absolute inset-0 w-full h-full">
      <path d="M 30 130 Q 80 100, 130 85 Q 180 70, 230 75 Q 270 78, 300 35" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeDasharray="6 4" opacity="0.4" />
      <path d="M 30 130 Q 80 100, 130 85 Q 180 70, 230 75 Q 270 78, 300 35" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeDashoffset={`${(1 - progress / 100) * 280}`} strokeDasharray="280" />
    </svg>
    <div className="absolute bottom-4 left-4 text-xl">📍</div>
    <div className="absolute bottom-0 left-3 text-[8px] font-medium text-muted-foreground bg-card/80 px-1 py-0.5 rounded">Técnico</div>
    <div className="absolute top-3 right-4 text-xl">🏠</div>
    <div className="absolute top-9 right-2 text-[8px] font-medium text-muted-foreground bg-card/80 px-1 py-0.5 rounded">Sua casa</div>
    <motion.div
      className="absolute w-5 h-5 bg-primary rounded-full shadow-lg flex items-center justify-center text-[10px] border-2 border-card"
      animate={{
        left: `${8 + (progress / 100) * 76}%`,
        top: `${78 - (progress / 100) * 58}%`,
      }}
      transition={{ duration: 1.5, ease: 'easeInOut' }}
    >🚗</motion.div>
    <div className="absolute bottom-2 right-2 bg-card shadow rounded-lg px-2 py-1 border border-border">
      <p className="text-[9px] text-muted-foreground">Chegada</p>
      <p className="text-xs font-bold text-foreground">{Math.max(1, Math.round((1 - progress / 100) * 15))} min</p>
    </div>
  </div>
);

/* ─── MAIN COMPONENT ─── */
const ClientJourneyDemo = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [selectedService, setSelectedService] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [addedProducts, setAddedProducts] = useState<number[]>([]);
  const [trackingProgress, setTrackingProgress] = useState(0);
  const [codeInput, setCodeInput] = useState('');
  const [codeVerified, setCodeVerified] = useState(false);

  // ── Dados vindos da Landing Page ──
  const fromLanding = searchParams.get('serviceName');
  const landingSegment = searchParams.get('serviceSegment') || 'manutencao';
  const landingProducts = (() => { try { return JSON.parse(searchParams.get('serviceProducts') || '[]') as string[]; } catch { return []; } })();

  const landingService = fromLanding ? {
    id: 99,
    name: searchParams.get('serviceName') || '',
    icon: segmentEmojis[landingSegment] || '⚡',
    provider: searchParams.get('serviceProvider') || '',
    rating: parseFloat(searchParams.get('serviceRating') || '4.8'),
    creditCost: Math.round(parseFloat(searchParams.get('servicePrice') || '100') * 0.53),
    monetaryValue: parseFloat(searchParams.get('servicePrice') || '100'),
    category: landingSegment,
    estimatedTime: searchParams.get('serviceTime') || '1h',
    relatedProducts: (productsBySegment[landingSegment] || []).length,
    segment: landingSegment,
  } : null;

  const availableServices = landingService
    ? [landingService, ...defaultServices.filter(s => s.id !== 99).slice(0, 3)]
    : defaultServices;

  const activeService = availableServices.find(s => s.id === selectedService) || availableServices[0];
  const relatedProducts = productsBySegment[landingService?.segment || activeService?.segment || 'manutencao'] || productsBySegment.manutencao;

  // Auto-select landed service
  useEffect(() => {
    if (landingService && !selectedService) {
      setSelectedService(landingService.id);
    }
  }, []);

  const step = steps[currentStep];
  const verificationCode = '8472';

  useEffect(() => {
    if (currentStep === 5 && trackingProgress < 90) {
      const timer = setInterval(() => setTrackingProgress(prev => Math.min(prev + 2, 90)), 180);
      return () => clearInterval(timer);
    }
  }, [currentStep, trackingProgress]);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setTimeout(() => {
      if (currentStep < steps.length - 1) goNext();
      else setIsAutoPlaying(false);
    }, 6000);
    return () => clearTimeout(timer);
  }, [isAutoPlaying, currentStep]);

  const goNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      if (currentStep + 1 === 5) setTrackingProgress(0);
      if (currentStep + 1 === 6) { setCodeInput(''); setCodeVerified(false); }
    }
  }, [currentStep]);

  const goPrev = () => { if (currentStep > 0) setCurrentStep(prev => prev - 1); };

  const selectedServiceData = activeService;

  const productTotal = addedProducts.reduce((sum, id) => {
    const p = relatedProducts.find(x => x.id === id);
    return sum + (p ? p.price * (1 - mockClient.discount / 100) : 0);
  }, 0);

  const savingsData = {
    serviceSaved: selectedServiceData.monetaryValue - 0,
    productDiscount: addedProducts.reduce((sum, id) => {
      const p = relatedProducts.find(x => x.id === id);
      return sum + (p ? p.price * mockClient.discount / 100 : 0);
    }, 0) || relatedProducts.reduce((s, p) => s + p.price * mockClient.discount / 100, 0),
    totalSaved: selectedServiceData.monetaryValue + relatedProducts.reduce((s, p) => s + p.price * mockClient.discount / 100, 0),
    timeWithout: '3-5 dias pesquisando',
    timeWith: '2 minutos no app',
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(fromLanding ? '/' : '/client')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-display font-bold text-foreground text-sm md:text-base">
                {fromLanding ? `Contratando: ${fromLanding}` : 'Jornada do Cliente — Demo Interativa'}
              </h1>
              <p className="text-[10px] md:text-xs text-muted-foreground">
                {fromLanding ? `${searchParams.get('serviceProvider')} • Simulação de contratação` : 'Da escolha do serviço até a economia final'}
              </p>
            </div>
          </div>
          <Button
            variant={isAutoPlaying ? 'secondary' : 'default'}
            size="sm"
            className="text-xs"
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
          >
            {isAutoPlaying ? '⏸ Pausar' : '▶ Auto-play'}
          </Button>
        </div>

        {/* Step indicator */}
        <div className="max-w-5xl mx-auto px-4 pb-3">
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {steps.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setCurrentStep(i)}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-all shrink-0 border ${
                  i === currentStep
                    ? 'bg-primary/10 text-primary border-primary/30 shadow-sm'
                    : i < currentStep
                    ? 'bg-primary/5 text-primary border-primary/20'
                    : 'bg-muted text-muted-foreground border-transparent'
                }`}
              >
                <span>{i < currentStep ? '✓' : s.emoji}</span>
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            ))}
          </div>
          <Progress value={((currentStep + 1) / steps.length) * 100} className="h-1 mt-2" />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
          >

            {/* ═══ STEP 1: BROWSE SERVICES ═══ */}
            {step.id === 'browse' && (
              <PhoneFrame>
                <div className="px-4 py-3 space-y-3">
                  {/* Search bar */}
                  <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2.5 border border-border">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Buscar serviço ou produto...</span>
                  </div>

                  {/* Categories */}
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {['🏠 Casa', '💻 Digital', '🎉 Eventos', '🚗 Auto'].map((cat, i) => (
                      <Badge key={i} variant={i === 0 ? 'default' : 'secondary'} className="text-[10px] shrink-0 cursor-pointer">
                        {cat}
                      </Badge>
                    ))}
                  </div>

                  {/* Service list */}
                  <div className="space-y-2">
                    {availableServices.map((svc, i) => {
                      const covered = mockClient.credits >= svc.creditCost;
                      return (
                        <motion.div
                          key={svc.id}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.15 + i * 0.1 }}
                          onClick={() => setSelectedService(svc.id)}
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                            selectedService === svc.id
                              ? 'border-primary bg-primary/5 shadow-sm ring-2 ring-primary/20'
                              : 'border-border bg-card hover:bg-muted/50'
                          }`}
                        >
                          <div className="w-11 h-11 bg-muted rounded-xl flex items-center justify-center text-2xl shrink-0">{svc.icon}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-foreground">{svc.name}</p>
                            <p className="text-[10px] text-muted-foreground">{svc.provider} • <Star className="w-2.5 h-2.5 inline text-accent fill-accent" /> {svc.rating}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-medium text-primary flex items-center gap-0.5">
                                <Coins className="w-3 h-3" /> {svc.creditCost}
                              </span>
                              {covered && <Badge variant="secondary" className="text-[8px] h-4 bg-green-100 text-green-700">100% coberto</Badge>}
                              {svc.relatedProducts > 0 && (
                                <span className="text-[9px] text-muted-foreground"><Package className="w-2.5 h-2.5 inline" /> {svc.relatedProducts}</span>
                              )}
                            </div>
                          </div>
                          {selectedService === svc.id && <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />}
                        </motion.div>
                      );
                    })}
                  </div>

                  {selectedService && (
                    <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                      <Button className="w-full" onClick={goNext}>
                        Ver detalhes <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </motion.div>
                  )}
                </div>
              </PhoneFrame>
            )}

            {/* ═══ STEP 2: DETAILS + RELATED PRODUCTS ═══ */}
            {step.id === 'details' && (
              <PhoneFrame>
                <div className="px-4 py-3 space-y-3">
                  {/* Service header */}
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center text-3xl">{selectedServiceData.icon}</div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{selectedServiceData.name}</p>
                      <p className="text-[10px] text-muted-foreground">{selectedServiceData.provider}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-0.5">
                          <Star className="w-3 h-3 text-accent fill-accent" />
                          <span className="text-[10px] font-semibold">{selectedServiceData.rating}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">• {selectedServiceData.estimatedTime}</span>
                      </div>
                    </div>
                  </div>

                  {/* Credit status */}
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-xs font-semibold text-green-700">Coberto pelo seu plano!</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="text-center p-1.5 bg-white/80 rounded-lg">
                        <p className="text-[9px] text-muted-foreground">Seus créditos</p>
                        <p className="text-sm font-bold text-foreground">{mockClient.credits}</p>
                      </div>
                      <div className="text-center p-1.5 bg-white/80 rounded-lg">
                        <p className="text-[9px] text-muted-foreground">Custo</p>
                        <p className="text-sm font-bold text-foreground">{selectedServiceData.creditCost}</p>
                      </div>
                    </div>
                    <p className="text-[9px] text-green-600 mt-2 text-center">
                      💰 Sem plano, custaria R$ {selectedServiceData.monetaryValue.toFixed(2).replace('.', ',')}
                    </p>
                  </div>

                  {/* Related products */}
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                      <Package className="w-3.5 h-3.5" /> PRODUTOS NECESSÁRIOS ({mockClient.discount}% off com seu plano)
                    </p>
                    {relatedProducts.map((prod, i) => {
                      const discounted = prod.price * (1 - mockClient.discount / 100);
                      const added = addedProducts.includes(prod.id);
                      return (
                        <motion.div
                          key={prod.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 + i * 0.1 }}
                          className={`flex items-center gap-2.5 p-2.5 rounded-xl mb-2 border transition-all ${
                            added ? 'border-primary bg-primary/5' : 'border-border bg-card'
                          }`}
                        >
                          <div className="w-9 h-9 bg-muted rounded-lg flex items-center justify-center text-lg shrink-0">{prod.image}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-semibold text-foreground line-clamp-1">{prod.name}</p>
                            <p className="text-[9px] text-muted-foreground">{prod.supplier}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[9px] text-muted-foreground line-through">R$ {prod.price.toFixed(2).replace('.', ',')}</span>
                              <span className="text-[10px] font-bold text-primary">R$ {discounted.toFixed(2).replace('.', ',')}</span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant={added ? 'default' : 'outline'}
                            className="text-[9px] h-7 px-2"
                            onClick={() => setAddedProducts(prev =>
                              added ? prev.filter(x => x !== prod.id) : [...prev, prod.id]
                            )}
                          >
                            {added ? '✓' : '+ Add'}
                          </Button>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </PhoneFrame>
            )}

            {/* ═══ STEP 3: SCHEDULE ═══ */}
            {step.id === 'schedule' && (
              <PhoneFrame>
                <div className="px-4 py-3 space-y-3">
                  <div className="text-center">
                    <p className="text-xs font-bold text-foreground">📅 Escolha data e horário</p>
                    <p className="text-[10px] text-muted-foreground">{selectedServiceData.icon} {selectedServiceData.name}</p>
                  </div>

                  {/* Date selection */}
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {availableDates.map((d, i) => (
                      <motion.button
                        key={d.date}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.08 }}
                        onClick={() => { setSelectedDate(d.date); setSelectedSlot(null); }}
                        className={`flex flex-col items-center p-3 rounded-xl border min-w-[70px] transition-all ${
                          selectedDate === d.date
                            ? 'border-primary bg-primary/10 shadow-sm'
                            : 'border-border bg-card'
                        }`}
                      >
                        <span className="text-[9px] text-muted-foreground">{d.day}</span>
                        <span className={`text-sm font-bold ${selectedDate === d.date ? 'text-primary' : 'text-foreground'}`}>{d.date.split('/')[0]}</span>
                        <span className="text-[9px] text-muted-foreground">Mar</span>
                        <Badge variant="secondary" className="text-[8px] mt-1">{d.slots.length} vagas</Badge>
                      </motion.button>
                    ))}
                  </div>

                  {/* Time slots */}
                  {selectedDate && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                      <p className="text-[10px] font-semibold text-muted-foreground">HORÁRIOS DISPONÍVEIS</p>
                      <div className="grid grid-cols-3 gap-2">
                        {availableDates.find(d => d.date === selectedDate)?.slots.map((slot, i) => (
                          <motion.button
                            key={slot}
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            onClick={() => setSelectedSlot(slot)}
                            className={`p-2.5 rounded-xl border text-center transition-all ${
                              selectedSlot === slot
                                ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                                : 'border-border bg-card text-foreground hover:bg-muted'
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5 mx-auto mb-0.5" />
                            <p className="text-xs font-bold">{slot}</p>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Address */}
                  <div className="bg-muted/50 rounded-xl p-3 border border-border">
                    <p className="text-[10px] font-semibold text-muted-foreground mb-1">📍 ENDEREÇO</p>
                    <p className="text-[11px] text-foreground">Rua das Flores, 234 — Apt 12B</p>
                    <p className="text-[10px] text-muted-foreground">São Paulo - SP</p>
                    <Button variant="link" size="sm" className="text-[10px] h-5 p-0 mt-1 text-primary">Alterar endereço</Button>
                  </div>

                  {selectedSlot && (
                    <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                      <div className="bg-primary/5 rounded-xl p-3 border border-primary/20 text-center mb-2">
                        <p className="text-[10px] text-muted-foreground">Agendamento</p>
                        <p className="text-sm font-bold text-foreground">{selectedDate} às {selectedSlot}</p>
                        <p className="text-[10px] text-muted-foreground">Duração estimada: {selectedServiceData.estimatedTime}</p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </PhoneFrame>
            )}

            {/* ═══ STEP 4: FINANCIAL SUMMARY ═══ */}
            {step.id === 'finance' && (
              <PhoneFrame>
                <div className="px-4 py-3 space-y-3">
                  <div className="text-center">
                    <Receipt className="w-6 h-6 text-primary mx-auto mb-1" />
                    <p className="text-xs font-bold text-foreground">Resumo do Pedido</p>
                  </div>

                  {/* Service */}
                  <div className="bg-card rounded-xl p-3 border border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{selectedServiceData.icon}</span>
                        <div>
                          <p className="text-[11px] font-semibold text-foreground">{selectedServiceData.name}</p>
                          <p className="text-[9px] text-muted-foreground">{selectedDate || '28/03'} às {selectedSlot || '14:00'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-muted-foreground line-through">R$ {selectedServiceData.monetaryValue.toFixed(2).replace('.', ',')}</p>
                        <Badge variant="secondary" className="text-[8px] bg-green-100 text-green-700">
                          <Coins className="w-2.5 h-2.5 mr-0.5" /> {selectedServiceData.creditCost} créditos
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Products */}
                  <div className="bg-card rounded-xl p-3 border border-border">
                    <p className="text-[10px] font-semibold text-muted-foreground mb-2">📦 Produtos ({relatedProducts.length})</p>
                    {relatedProducts.map((p, i) => {
                      const discounted = p.price * (1 - mockClient.discount / 100);
                      return (
                        <motion.div
                          key={p.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 + i * 0.1 }}
                          className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">{p.image}</span>
                            <p className="text-[10px] text-foreground">{p.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[8px] text-muted-foreground line-through">R$ {p.price.toFixed(2).replace('.', ',')}</p>
                            <p className="text-[10px] font-bold text-foreground">R$ {discounted.toFixed(2).replace('.', ',')}</p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Savings highlight */}
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="bg-green-50 rounded-xl p-3 border border-green-200"
                  >
                    <p className="text-[10px] font-semibold text-green-700 mb-2 flex items-center gap-1">
                      <TrendingDown className="w-3.5 h-3.5" /> SUA ECONOMIA
                    </p>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-[10px] text-green-600">Serviço coberto por créditos</span>
                      <span className="text-[10px] font-bold text-green-700">- R$ {selectedServiceData.monetaryValue.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-[10px] text-green-600">{mockClient.discount}% desconto produtos</span>
                      <span className="text-[10px] font-bold text-green-700">- R$ {savingsData.productDiscount.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 mt-1 border-t border-green-200">
                      <span className="text-xs font-bold text-green-800">Total economizado</span>
                      <span className="text-sm font-extrabold text-green-700">R$ {savingsData.totalSaved.toFixed(2).replace('.', ',')}</span>
                    </div>
                  </motion.div>

                  {/* What you'll pay */}
                  <div className="bg-primary/5 rounded-xl p-3 border border-primary/20">
                    <p className="text-[10px] font-semibold text-primary mb-2">💳 VOCÊ PAGARÁ</p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-muted-foreground">Créditos</p>
                        <p className="text-xs font-bold text-foreground">{selectedServiceData.creditCost} créditos</p>
                      </div>
                      <div className="text-[10px] text-muted-foreground">+</div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Produtos</p>
                        <p className="text-xs font-bold text-foreground">R$ {(relatedProducts.reduce((s, p) => s + p.price * (1 - mockClient.discount / 100), 0)).toFixed(2).replace('.', ',')}</p>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-primary/20 flex items-center justify-between">
                      <p className="text-[10px] text-muted-foreground">Saldo após</p>
                      <p className="text-xs font-bold text-foreground">{mockClient.credits - selectedServiceData.creditCost} créditos restantes</p>
                    </div>
                  </div>
                </div>
              </PhoneFrame>
            )}

            {/* ═══ STEP 5: CONFIRMATION ═══ */}
            {step.id === 'confirm' && (
              <PhoneFrame>
                <div className="px-4 py-3 space-y-3">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="text-center py-4"
                  >
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>
                    <p className="text-sm font-bold text-foreground">Solicitação Enviada!</p>
                    <p className="text-[10px] text-muted-foreground mt-1">OS-2024-0847</p>
                  </motion.div>

                  {/* Summary card */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="bg-card rounded-xl p-3 border border-border space-y-2"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-muted-foreground">Serviço</span>
                      <span className="text-foreground font-medium">{selectedServiceData.icon} {selectedServiceData.name}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-muted-foreground">Data</span>
                      <span className="text-foreground font-medium">{selectedDate || '28/03'} às {selectedSlot || '14:00'}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-muted-foreground">Duração</span>
                      <span className="text-foreground font-medium">{selectedServiceData.estimatedTime}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-muted-foreground">Produtos</span>
                      <span className="text-foreground font-medium">{relatedProducts.length} itens inclusos</span>
                    </div>
                  </motion.div>

                  {/* Notifications */}
                  <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="space-y-2">
                    <p className="text-[10px] font-semibold text-muted-foreground">📱 NOTIFICAÇÕES</p>
                    {[
                      { time: 'Agora', msg: 'Sua solicitação foi enviada ao prestador', icon: '📤' },
                      { time: 'Em breve', msg: 'Você receberá confirmação do técnico', icon: '👨‍🔧' },
                      { time: 'No dia', msg: 'Acompanhe em tempo real pelo mapa', icon: '🗺️' },
                    ].map((n, i) => (
                      <motion.div
                        key={i}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.7 + i * 0.15 }}
                        className="flex items-center gap-2.5 p-2.5 bg-muted/50 rounded-xl border border-border"
                      >
                        <span className="text-lg">{n.icon}</span>
                        <div>
                          <p className="text-[10px] font-medium text-foreground">{n.msg}</p>
                          <p className="text-[9px] text-muted-foreground">{n.time}</p>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* Push notification simulation */}
                  <motion.div
                    initial={{ y: -40, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1.5, type: 'spring' }}
                    className="bg-primary/10 border border-primary/30 rounded-2xl p-3 shadow-lg"
                  >
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
                        <Zap className="w-4 h-4 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-foreground">EcoMEI</p>
                        <p className="text-[10px] text-muted-foreground">
                          ✅ Chamado aceito! O técnico Carlos Mendes foi designado. Acompanhe ao vivo!
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </PhoneFrame>
            )}

            {/* ═══ STEP 6: TRACKING ═══ */}
            {step.id === 'tracking' && (
              <PhoneFrame>
                <div className="px-4 py-3 space-y-3">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }}>
                    <Badge className="bg-primary text-primary-foreground px-3 py-1 text-[10px] mx-auto block w-fit">
                      🔧 Técnico a caminho
                    </Badge>
                  </motion.div>

                  <TrackingMap progress={trackingProgress} />

                  {/* Technician */}
                  <div className="bg-card rounded-xl p-3 border border-border shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-muted rounded-xl flex items-center justify-center text-xl shrink-0">👨‍🔧</div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-foreground">Carlos Mendes</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Star className="w-3 h-3 text-accent fill-accent" />
                          <span className="text-[10px] text-muted-foreground">4.9 • Eletricista Nível 2</span>
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <Button variant="outline" size="icon" className="rounded-full w-8 h-8">
                          <Phone className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="outline" size="icon" className="rounded-full w-8 h-8">
                          💬
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Status timeline */}
                  <div className="bg-muted/30 rounded-xl p-3 border border-border">
                    {[
                      { done: true, label: 'Solicitação confirmada', time: '13:52' },
                      { done: true, label: 'Técnico designado', time: '13:55' },
                      { done: trackingProgress > 30, label: 'A caminho do local', time: trackingProgress > 30 ? '14:02' : '' },
                      { done: trackingProgress > 70, label: 'Chegou ao local', time: trackingProgress > 70 ? '14:15' : '' },
                      { done: false, label: 'Serviço em execução', time: '' },
                      { done: false, label: 'Conclusão e verificação', time: '' },
                    ].map((t, i) => (
                      <div key={i} className="flex items-start gap-2.5 pb-2.5">
                        <div className="flex flex-col items-center">
                          <div className={`w-2.5 h-2.5 rounded-full border-2 mt-0.5 ${t.done ? 'bg-primary border-primary' : 'border-muted-foreground/30 bg-card'}`} />
                          {i < 5 && <div className={`w-0.5 h-4 ${t.done ? 'bg-primary' : 'bg-border'}`} />}
                        </div>
                        <div className="flex-1 flex items-center justify-between">
                          <p className={`text-[10px] ${t.done ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{t.label}</p>
                          {t.time && <p className="text-[9px] text-muted-foreground">{t.time}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </PhoneFrame>
            )}

            {/* ═══ STEP 7: VERIFICATION CODE ═══ */}
            {step.id === 'verify' && (
              <PhoneFrame>
                <div className="px-4 py-3 space-y-3">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring' }}
                    className="text-center py-2"
                  >
                    <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Wrench className="w-7 h-7 text-primary" />
                    </div>
                    <p className="text-sm font-bold text-foreground">Serviço Finalizado!</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Insira o código do técnico para confirmar</p>
                  </motion.div>

                  {/* Photos taken */}
                  <div className="bg-muted/50 rounded-xl p-2.5 border border-border">
                    <p className="text-[9px] font-semibold text-muted-foreground mb-1.5">📸 FOTOS DO SERVIÇO</p>
                    <div className="flex gap-2">
                      {['Antes', 'Durante', 'Depois'].map((l, i) => (
                        <div key={i} className="flex-1 aspect-square bg-primary/10 rounded-lg flex flex-col items-center justify-center border border-primary/20">
                          <Camera className="w-4 h-4 text-primary mb-0.5" />
                          <span className="text-[8px] text-primary">{l}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Code input */}
                  <div className="flex justify-center gap-2.5">
                    {[0, 1, 2, 3].map(i => (
                      <motion.div
                        key={i}
                        initial={{ y: 15, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 + i * 0.08 }}
                        className={`w-13 h-14 rounded-xl border-2 flex items-center justify-center transition-all ${
                          codeInput[i]
                            ? codeVerified
                              ? 'border-primary bg-primary/10'
                              : 'border-foreground/40 bg-muted'
                            : 'border-muted-foreground/20 bg-card'
                        }`}
                      >
                        <span className="text-lg font-bold font-mono text-foreground">{codeInput[i] || ''}</span>
                      </motion.div>
                    ))}
                  </div>

                  {!codeVerified && (
                    <div className="grid grid-cols-3 gap-1.5 max-w-[220px] mx-auto">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, '⌫'].map((key, i) => (
                        <button
                          key={i}
                          disabled={key === null}
                          onClick={() => {
                            if (key === '⌫') setCodeInput(prev => prev.slice(0, -1));
                            else if (key !== null && codeInput.length < 4) {
                              const newCode = codeInput + key;
                              setCodeInput(newCode);
                              if (newCode.length === 4 && newCode === verificationCode) {
                                setTimeout(() => setCodeVerified(true), 400);
                              }
                            }
                          }}
                          className={`h-10 rounded-lg text-sm font-semibold transition-all ${
                            key === null ? 'invisible' : 'bg-muted hover:bg-muted/80 text-foreground active:scale-95'
                          }`}
                        >{key}</button>
                      ))}
                    </div>
                  )}

                  {codeVerified && (
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-3">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.2 }}
                        className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto"
                      >
                        <CheckCircle2 className="w-8 h-8 text-green-600" />
                      </motion.div>
                      <p className="text-sm font-bold text-green-700">Verificado com Sucesso!</p>
                      <p className="text-[10px] text-muted-foreground">
                        {selectedServiceData.creditCost} créditos debitados • Serviço em análise de qualidade
                      </p>

                      <div className="bg-muted/50 rounded-xl p-3 border border-border">
                        <p className="text-[10px] font-semibold text-muted-foreground mb-1.5">Avalie o serviço</p>
                        <div className="flex justify-center gap-1">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} className="w-6 h-6 text-accent fill-accent cursor-pointer hover:scale-110 transition-transform" />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </PhoneFrame>
            )}

            {/* ═══ STEP 8: SAVINGS & BENEFITS ═══ */}
            {step.id === 'savings' && (
              <PhoneFrame>
                <div className="px-4 py-3 space-y-3">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring' }}
                    className="text-center py-2"
                  >
                    <div className="w-14 h-14 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Sparkles className="w-7 h-7 text-accent" />
                    </div>
                    <p className="text-sm font-bold text-foreground">Você economizou! 🎉</p>
                  </motion.div>

                  {/* Big savings number */}
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, type: 'spring' }}
                    className="bg-green-50 rounded-2xl p-4 border border-green-200 text-center"
                  >
                    <p className="text-[10px] text-green-600 font-semibold mb-1">ECONOMIA TOTAL NESTE CHAMADO</p>
                    <p className="text-3xl font-extrabold text-green-700">R$ {savingsData.totalSaved.toFixed(2).replace('.', ',')}</p>
                    <p className="text-[9px] text-green-600 mt-1">comparado a contratar sem o plano EcoMEI</p>
                  </motion.div>

                  {/* Breakdown */}
                  <div className="space-y-2">
                    {[
                      { icon: '🔧', label: 'Serviço coberto por créditos', saved: `R$ ${selectedServiceData.monetaryValue.toFixed(2).replace('.', ',')}`, desc: `${selectedServiceData.creditCost} créditos em vez de pagar em dinheiro` },
                      { icon: '📦', label: 'Desconto em produtos', saved: `R$ ${savingsData.productDiscount.toFixed(2).replace('.', ',')}`, desc: `${mockClient.discount}% off pelo plano ${mockClient.plan}` },
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.5 + i * 0.15 }}
                        className="flex items-center gap-2.5 p-3 bg-card rounded-xl border border-border"
                      >
                        <span className="text-xl">{item.icon}</span>
                        <div className="flex-1">
                          <p className="text-[10px] font-semibold text-foreground">{item.label}</p>
                          <p className="text-[9px] text-muted-foreground">{item.desc}</p>
                        </div>
                        <p className="text-xs font-bold text-green-600">{item.saved}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Time savings */}
                  <motion.div
                    initial={{ y: 15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="bg-primary/5 rounded-xl p-3 border border-primary/20"
                  >
                    <p className="text-[10px] font-semibold text-primary mb-2 flex items-center gap-1">
                      <Timer className="w-3.5 h-3.5" /> TEMPO ECONOMIZADO
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-center p-2 bg-card rounded-lg border border-border">
                        <p className="text-[9px] text-muted-foreground">Sem EcoMEI</p>
                        <p className="text-xs font-bold text-destructive">3-5 dias</p>
                        <p className="text-[8px] text-muted-foreground">Pesquisar, orçar, agendar</p>
                      </div>
                      <div className="text-center p-2 bg-primary/10 rounded-lg border border-primary/20">
                        <p className="text-[9px] text-muted-foreground">Com EcoMEI</p>
                        <p className="text-xs font-bold text-primary">2 minutos</p>
                        <p className="text-[8px] text-muted-foreground">Tudo no app</p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Praticality highlights */}
                  <motion.div
                    initial={{ y: 15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="bg-card rounded-xl p-3 border border-border"
                  >
                    <p className="text-[10px] font-semibold text-muted-foreground mb-2">✨ PRATICIDADE</p>
                    <div className="space-y-1.5">
                      {[
                        { icon: '🔍', text: 'Profissional verificado e avaliado' },
                        { icon: '📦', text: 'Materiais incluídos com desconto' },
                        { icon: '📍', text: 'Acompanhamento em tempo real' },
                        { icon: '🔐', text: 'Pagamento seguro com código' },
                        { icon: '🛡️', text: 'Qualidade validada pela central' },
                        { icon: '⭐', text: 'Avaliação pós-serviço' },
                      ].map((item, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1.2 + i * 0.08 }}
                          className="flex items-center gap-2"
                        >
                          <span className="text-sm">{item.icon}</span>
                          <p className="text-[10px] text-foreground">{item.text}</p>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Accumulated savings */}
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="bg-accent/10 rounded-xl p-3 border border-accent/30 text-center"
                  >
                    <p className="text-[10px] font-semibold text-muted-foreground">ECONOMIA ACUMULADA (4 meses de plano)</p>
                    <p className="text-xl font-extrabold text-foreground mt-1">R$ 864,00</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">
                      Investimento: R$ {(59.90 * 4).toFixed(2).replace('.', ',')} → Retorno: 3.6x
                    </p>
                    <div className="mt-2">
                      <Progress value={78} className="h-1.5" />
                      <p className="text-[8px] text-muted-foreground mt-0.5">78% de utilização dos créditos</p>
                    </div>
                  </motion.div>
                </div>
              </PhoneFrame>
            )}

          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between max-w-sm mx-auto mt-6">
          <Button variant="outline" size="sm" onClick={goPrev} disabled={currentStep === 0}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
          </Button>
          <p className="text-xs text-muted-foreground">{currentStep + 1} / {steps.length}</p>
          <Button size="sm" onClick={goNext} disabled={currentStep === steps.length - 1}>
            Próximo <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ClientJourneyDemo;
