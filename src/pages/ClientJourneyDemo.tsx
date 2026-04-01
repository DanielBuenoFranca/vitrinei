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
  Coins, ThumbsUp, Receipt, Truck, Search, Heart, ArrowUpCircle,
  ShoppingCart, MessageCircle, Send, X, Store
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── MOCK CLIENT ─── */
const mockClient = {
  name: 'Maria Silva',
  avatar: '👩',
  plan: 'Prata 🥈',
  credits: 95,
  monthlyCredits: 120,
  discount: 10,
};

/* ── Segment Emojis ── */
const segmentEmojis: Record<string, string> = {
  manutencao: '🔧', saude_clinica: '🩺', bem_estar: '💆', beleza: '💇',
  casa: '🏠', auto: '🚗', digital: '💻', tech: '📱',
  educacao: '📚', pet: '🐾', eventos: '🎉', musica: '🎵', natureza: '🌿',
};

interface CartService {
  name: string; provider: string; price: number; rating: number;
  distance: string; time: string; segment: string; products: string[];
}
interface CartProduct {
  name: string; type: string; price: number; provider: string;
  rating: number; distance: string; quantity?: number;
}

/* ─── STEPS ─── */
const steps = [
  { id: 'cart-review', label: 'Carrinho', icon: ShoppingCart, emoji: '🛒' },
  { id: 'schedule', label: 'Agendar', icon: Calendar, emoji: '📅' },
  { id: 'finance', label: 'Resumo Financeiro', icon: CreditCard, emoji: '💳' },
  { id: 'confirm', label: 'Confirmação', icon: CheckCircle2, emoji: '✅' },
  { id: 'tracking', label: 'Acompanhar', icon: Navigation, emoji: '📍' },
  { id: 'service-done', label: 'Serviço Realizado', icon: Camera, emoji: '📸' },
  { id: 'verify', label: 'Validação Central', icon: Shield, emoji: '🛡️' },
  { id: 'savings', label: 'Economia', icon: Gift, emoji: '🎁' },
];

const availableDates = [
  { date: '27/03', day: 'Qui', slots: ['09:00', '11:00', '14:00'] },
  { date: '28/03', day: 'Sex', slots: ['10:00', '14:00', '16:00'] },
  { date: '29/03', day: 'Sáb', slots: ['09:00', '11:00'] },
  { date: '31/03', day: 'Seg', slots: ['09:00', '11:00', '14:00', '16:00'] },
];

/* ─── PUSH NOTIFICATION ─── */
const PushNotification = ({ title, message, delay = 0 }: { title: string; message: string; delay?: number }) => (
  <motion.div
    initial={{ y: -50, opacity: 0, scale: 0.9 }}
    animate={{ y: 0, opacity: 1, scale: 1 }}
    transition={{ delay, type: 'spring', damping: 15 }}
    className="bg-primary/10 border border-primary/30 rounded-2xl p-3 shadow-lg"
  >
    <div className="flex items-start gap-2">
      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
        <Zap className="w-4 h-4 text-primary-foreground" />
      </div>
      <div>
        <p className="text-[10px] font-bold text-foreground">{title}</p>
        <p className="text-[10px] text-muted-foreground">{message}</p>
      </div>
    </div>
  </motion.div>
);

/* ─── PHONE FRAME ─── */
const PhoneFrame = ({ children, credits }: { children: React.ReactNode; credits?: number }) => (
  <div className="mx-auto max-w-sm">
    <div className="relative mx-auto w-full max-w-[360px] rounded-[2.5rem] border-[6px] border-foreground/20 bg-card shadow-2xl overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-foreground/20 rounded-b-2xl z-10" />
      <div className="pt-8 bg-primary/5 border-b border-border px-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-foreground">EcoMEI</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Coins className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-bold text-foreground">{credits ?? mockClient.credits} créditos</span>
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
    <div className="absolute top-3 right-4 text-xl">🏠</div>
    <motion.div
      className="absolute w-5 h-5 bg-primary rounded-full shadow-lg flex items-center justify-center text-[10px] border-2 border-card"
      animate={{ left: `${8 + (progress / 100) * 76}%`, top: `${78 - (progress / 100) * 58}%` }}
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
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [trackingProgress, setTrackingProgress] = useState(0);
  const [codeInput, setCodeInput] = useState('');
  const [codeVerified, setCodeVerified] = useState(false);
  const [clientConfirmed, setClientConfirmed] = useState(false);
  const [centralValidated, setCentralValidated] = useState(false);
  const [clientRating, setClientRating] = useState(0);

  // Parse cart items from URL
  const cartServices: CartService[] = (() => {
    try { return JSON.parse(searchParams.get('services') || '[]'); } catch { return []; }
  })();
  const cartProducts: CartProduct[] = (() => {
    try { return JSON.parse(searchParams.get('products') || '[]'); } catch { return []; }
  })();

  // Legacy single-service support
  const legacyService = searchParams.get('serviceName');
  if (legacyService && cartServices.length === 0) {
    cartServices.push({
      name: legacyService,
      provider: searchParams.get('serviceProvider') || '',
      price: parseFloat(searchParams.get('servicePrice') || '0'),
      rating: parseFloat(searchParams.get('serviceRating') || '4.8'),
      distance: searchParams.get('serviceDistance') || '2 km',
      time: searchParams.get('serviceTime') || '1h',
      segment: searchParams.get('serviceSegment') || 'manutencao',
      products: (() => { try { return JSON.parse(searchParams.get('serviceProducts') || '[]'); } catch { return []; } })(),
    });
  }

  const totalServices = cartServices.length;
  const totalProductUnits = cartProducts.reduce((s, p) => s + (p.quantity || 1), 0);
  const totalProducts = cartProducts.length;
  const totalItems = totalServices + totalProductUnits;
  const totalServiceValue = cartServices.reduce((s, svc) => s + svc.price, 0);
  const totalProductValue = cartProducts.reduce((s, p) => s + p.price * (p.quantity || 1), 0);
  const totalValue = totalServiceValue + totalProductValue;
  const productDiscount = totalProductValue * mockClient.discount / 100;
  const serviceCreditCost = Math.round(totalServiceValue * 0.53);
  const creditsCovered = mockClient.credits >= serviceCreditCost;

  const step = steps[currentStep];
  const verificationCode = '8472';

  useEffect(() => {
    if (currentStep === 4 && trackingProgress < 90) {
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
      if (currentStep + 1 === 4) setTrackingProgress(0);
      if (currentStep + 1 === 5) { setClientConfirmed(false); }
      if (currentStep + 1 === 6) { setCentralValidated(false); setCodeInput(''); setCodeVerified(false); }
    }
  }, [currentStep]);

  const goPrev = () => { if (currentStep > 0) setCurrentStep(prev => prev - 1); };

  // If no items, show empty state
  if (totalItems === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center space-y-4">
            <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto" />
            <h2 className="font-display font-bold text-foreground text-lg">Carrinho vazio</h2>
            <p className="text-sm text-muted-foreground">Adicione serviços e produtos ao carrinho na página inicial para iniciar a jornada.</p>
            <Button onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para a busca
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-display font-bold text-foreground text-sm md:text-base">
                Jornada do Cliente — {totalItems} ite{totalItems > 1 ? 'ns' : 'm'} no carrinho
              </h1>
              <p className="text-[10px] md:text-xs text-muted-foreground">
                {totalServices > 0 && `${totalServices} serviço(s)`}
                {totalServices > 0 && totalProducts > 0 && ' · '}
                {totalProducts > 0 && `${totalProducts} produto(s)`}
                {' · '}R$ {totalValue.toFixed(2)}
              </p>
            </div>
          </div>
          <Button
            variant={isAutoPlaying ? 'secondary' : 'default'}
            size="sm" className="text-xs"
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

            {/* ═══ STEP 1: CART REVIEW ═══ */}
            {step.id === 'cart-review' && (
              <PhoneFrame>
                <div className="px-4 py-3 space-y-3">
                  <div className="text-center">
                    <ShoppingCart className="w-6 h-6 text-primary mx-auto mb-1" />
                    <p className="text-xs font-bold text-foreground">Seu Carrinho</p>
                    <p className="text-[10px] text-muted-foreground">{totalItems} ite{totalItems > 1 ? 'ns' : 'm'} selecionado{totalItems > 1 ? 's' : ''}</p>
                  </div>

                  {/* Services */}
                  {cartServices.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-primary mb-2 flex items-center gap-1">
                        <Wrench className="w-3.5 h-3.5" /> SERVIÇOS ({cartServices.length})
                      </p>
                      {cartServices.map((svc, i) => (
                        <motion.div
                          key={`svc-${i}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 + i * 0.08 }}
                          className="flex items-center gap-3 p-3 rounded-xl border border-primary/20 bg-primary/5 mb-2"
                        >
                          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-xl shrink-0">
                            {segmentEmojis[svc.segment] || '🔧'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-semibold text-foreground truncate">{svc.name}</p>
                            <p className="text-[9px] text-muted-foreground flex items-center gap-1">
                              <Store className="w-2.5 h-2.5" /> {svc.provider}
                              <span>•</span>
                              <Star className="w-2.5 h-2.5 text-accent fill-accent" /> {svc.rating}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-bold text-foreground">R$ {svc.price.toFixed(2)}</span>
                              <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" /> {svc.time}
                              </span>
                              <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                                <MapPin className="w-2.5 h-2.5" /> {svc.distance}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Products */}
                  {cartProducts.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-success mb-2 flex items-center gap-1">
                        <ShoppingBag className="w-3.5 h-3.5" /> PRODUTOS ({cartProducts.length})
                      </p>
                      {cartProducts.map((prod, i) => (
                        <motion.div
                          key={`prod-${i}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 + i * 0.08 }}
                          className="flex items-center gap-3 p-2.5 rounded-xl border border-border bg-card mb-2"
                        >
                          <div className="w-9 h-9 bg-success/10 rounded-lg flex items-center justify-center text-lg shrink-0">
                            {prod.type === 'fisico' ? '📦' : '🌍'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-semibold text-foreground truncate">{prod.name}{(prod.quantity || 1) > 1 ? ` (x${prod.quantity})` : ''}</p>
                            <p className="text-[9px] text-muted-foreground">{prod.provider}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-[10px] font-bold text-foreground">R$ {(prod.price * (prod.quantity || 1)).toFixed(2)}</p>
                            <Badge variant={prod.type === 'fisico' ? 'default' : 'secondary'} className="text-[8px] px-1.5 py-0">
                              {prod.type === 'fisico' ? 'Estoque' : 'Drop'}
                            </Badge>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Credit coverage */}
                  <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}
                    className={`rounded-xl p-3 border ${creditsCovered ? 'bg-green-50 border-green-200' : 'bg-accent/10 border-accent/30'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      {creditsCovered
                        ? <><CheckCircle2 className="w-4 h-4 text-green-600" /><span className="text-xs font-semibold text-green-700">Serviço(s) coberto(s) pelo plano!</span></>
                        : <><Coins className="w-4 h-4 text-accent" /><span className="text-xs font-semibold text-accent-foreground">Créditos parciais</span></>
                      }
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div className="text-center p-1.5 bg-card/80 rounded-lg">
                        <p className="text-[9px] text-muted-foreground">Seus créditos</p>
                        <p className="text-sm font-bold text-foreground">{mockClient.credits}</p>
                      </div>
                      <div className="text-center p-1.5 bg-card/80 rounded-lg">
                        <p className="text-[9px] text-muted-foreground">Custo serviços</p>
                        <p className="text-sm font-bold text-foreground">{serviceCreditCost}</p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Total */}
                  <div className="bg-muted/50 rounded-xl p-3 border border-border">
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="text-muted-foreground">Serviços ({totalServices})</span>
                      <span className="text-foreground font-medium">{serviceCreditCost} créditos</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="text-muted-foreground">Produtos ({totalProducts})</span>
                      <span className="text-foreground font-medium">R$ {(totalProductValue - productDiscount).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-green-600">
                      <span>Desconto {mockClient.discount}%</span>
                      <span>- R$ {productDiscount.toFixed(2)}</span>
                    </div>
                  </div>

                  <PushNotification
                    title="EcoMEI IA"
                    message={`Ótima escolha! ${totalItems} ite${totalItems > 1 ? 'ns' : 'm'} selecionado${totalItems > 1 ? 's' : ''}. Vamos agendar? 📅`}
                    delay={0.8}
                  />
                </div>
              </PhoneFrame>
            )}

            {/* ═══ STEP 2: SCHEDULE ═══ */}
            {step.id === 'schedule' && (
              <PhoneFrame>
                <div className="px-4 py-3 space-y-3">
                  <div className="text-center">
                    <p className="text-xs font-bold text-foreground">📅 Escolha data e horário</p>
                    <p className="text-[10px] text-muted-foreground">
                      {cartServices.length > 0 ? cartServices.map(s => s.name).join(', ') : 'Entrega dos produtos'}
                    </p>
                  </div>

                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {availableDates.map((d, i) => (
                      <motion.button
                        key={d.date}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.08 }}
                        onClick={() => { setSelectedDate(d.date); setSelectedSlot(null); }}
                        className={`flex flex-col items-center p-3 rounded-xl border min-w-[70px] transition-all ${
                          selectedDate === d.date ? 'border-primary bg-primary/10 shadow-sm' : 'border-border bg-card'
                        }`}
                      >
                        <span className="text-[9px] text-muted-foreground">{d.day}</span>
                        <span className={`text-sm font-bold ${selectedDate === d.date ? 'text-primary' : 'text-foreground'}`}>{d.date.split('/')[0]}</span>
                        <Badge variant="secondary" className="text-[8px] mt-1">{d.slots.length} vagas</Badge>
                      </motion.button>
                    ))}
                  </div>

                  {selectedDate && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                      <p className="text-[10px] font-semibold text-muted-foreground">HORÁRIOS DISPONÍVEIS</p>
                      <div className="grid grid-cols-3 gap-2">
                        {availableDates.find(d => d.date === selectedDate)?.slots.map((slot, i) => (
                          <motion.button key={slot} initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ delay: i * 0.05 }}
                            onClick={() => setSelectedSlot(slot)}
                            className={`p-2.5 rounded-xl border text-center transition-all ${
                              selectedSlot === slot ? 'border-primary bg-primary text-primary-foreground shadow-sm' : 'border-border bg-card text-foreground'
                            }`}>
                            <Clock className="w-3.5 h-3.5 mx-auto mb-0.5" />
                            <p className="text-xs font-bold">{slot}</p>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  <div className="bg-muted/50 rounded-xl p-3 border border-border">
                    <p className="text-[10px] font-semibold text-muted-foreground mb-1">📍 ENDEREÇO</p>
                    <p className="text-[11px] text-foreground">Rua das Flores, 234 — Apt 12B</p>
                    <p className="text-[10px] text-muted-foreground">São Paulo - SP</p>
                  </div>

                  {selectedSlot && (
                    <PushNotification
                      title="EcoMEI IA"
                      message={`Perfeito! Agendado para ${selectedDate} às ${selectedSlot}. Os prestadores serão notificados agora! 🔔`}
                      delay={0.3}
                    />
                  )}
                </div>
              </PhoneFrame>
            )}

            {/* ═══ STEP 3: FINANCIAL SUMMARY ═══ */}
            {step.id === 'finance' && (
              <PhoneFrame>
                <div className="px-4 py-3 space-y-3">
                  <div className="text-center">
                    <Receipt className="w-6 h-6 text-primary mx-auto mb-1" />
                    <p className="text-xs font-bold text-foreground">Resumo do Pedido</p>
                  </div>

                  {/* Services */}
                  {cartServices.length > 0 && (
                    <div className="bg-card rounded-xl p-3 border border-border">
                      <p className="text-[10px] font-semibold text-muted-foreground mb-2">🔧 Serviços</p>
                      {cartServices.map((svc, i) => (
                        <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">{segmentEmojis[svc.segment] || '🔧'}</span>
                            <div>
                              <p className="text-[10px] text-foreground">{svc.name}</p>
                              <p className="text-[8px] text-muted-foreground">{svc.provider}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] text-muted-foreground line-through">R$ {svc.price.toFixed(2)}</p>
                            <Badge variant="secondary" className="text-[8px] bg-green-100 text-green-700">
                              <Coins className="w-2.5 h-2.5 mr-0.5" /> créditos
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Products */}
                  {cartProducts.length > 0 && (
                    <div className="bg-card rounded-xl p-3 border border-border">
                      <p className="text-[10px] font-semibold text-muted-foreground mb-2">📦 Produtos</p>
                      {cartProducts.map((prod, i) => {
                        const qty = prod.quantity || 1;
                        const lineTotal = prod.price * qty;
                        const discounted = lineTotal * (1 - mockClient.discount / 100);
                        return (
                          <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm">{prod.type === 'fisico' ? '📦' : '🌍'}</span>
                              <div>
                                <p className="text-[10px] text-foreground">{prod.name}{qty > 1 ? ` (x${qty})` : ''}</p>
                                <p className="text-[8px] text-muted-foreground">{prod.provider}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[8px] text-muted-foreground line-through">R$ {lineTotal.toFixed(2)}</p>
                              <p className="text-[10px] font-bold text-foreground">R$ {discounted.toFixed(2)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Savings */}
                  <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.4 }}
                    className="bg-green-50 rounded-xl p-3 border border-green-200">
                    <p className="text-[10px] font-semibold text-green-700 mb-2 flex items-center gap-1">
                      <TrendingDown className="w-3.5 h-3.5" /> SUA ECONOMIA
                    </p>
                    {totalServices > 0 && (
                      <div className="flex items-center justify-between py-1">
                        <span className="text-[10px] text-green-600">Serviço(s) coberto(s) por créditos</span>
                        <span className="text-[10px] font-bold text-green-700">- R$ {totalServiceValue.toFixed(2)}</span>
                      </div>
                    )}
                    {totalProducts > 0 && (
                      <div className="flex items-center justify-between py-1">
                        <span className="text-[10px] text-green-600">{mockClient.discount}% desconto produtos</span>
                        <span className="text-[10px] font-bold text-green-700">- R$ {productDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2 mt-1 border-t border-green-200">
                      <span className="text-xs font-bold text-green-800">Total economizado</span>
                      <span className="text-sm font-extrabold text-green-700">R$ {(totalServiceValue + productDiscount).toFixed(2)}</span>
                    </div>
                  </motion.div>

                  {/* What you pay */}
                  <div className="bg-primary/5 rounded-xl p-3 border border-primary/20 text-center">
                    <p className="text-[10px] text-muted-foreground">Você paga apenas</p>
                    <p className="text-xl font-extrabold text-foreground">R$ {(totalProductValue - productDiscount).toFixed(2)}</p>
                    <p className="text-[9px] text-muted-foreground">+ {serviceCreditCost} créditos do plano</p>
                  </div>
                </div>
              </PhoneFrame>
            )}

            {/* ═══ STEP 4: CONFIRMATION ═══ */}
            {step.id === 'confirm' && (
              <PhoneFrame>
                <div className="px-4 py-3 space-y-3">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} className="text-center py-2">
                    <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="text-sm font-bold text-foreground">Pedido Confirmado! ✅</p>
                    <p className="text-[10px] text-muted-foreground mt-1">OS-2024-{Math.floor(Math.random() * 9000) + 1000}</p>
                  </motion.div>

                  {/* Cart summary */}
                  <div className="bg-card rounded-xl p-3 border border-border space-y-2">
                    {cartServices.map((svc, i) => (
                      <div key={`svc-${i}`} className="flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground flex items-center gap-1"><Wrench className="w-3 h-3" /> {svc.name}</span>
                        <span className="text-foreground font-medium">{svc.provider}</span>
                      </div>
                    ))}
                    {cartProducts.map((prod, i) => (
                      <div key={`prod-${i}`} className="flex items-center justify-between text-[10px]">
                        <span className="text-muted-foreground flex items-center gap-1"><Package className="w-3 h-3" /> {prod.name}</span>
                        <span className="text-foreground font-medium">{prod.provider}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between text-[10px] pt-1 border-t border-border">
                      <span className="text-muted-foreground">📅 Agendamento</span>
                      <span className="text-foreground font-medium">{selectedDate || '28/03'} às {selectedSlot || '14:00'}</span>
                    </div>
                  </div>

                  {/* Push notifications sequence */}
                  <PushNotification delay={0.5}
                    title="EcoMEI"
                    message="📤 Sua solicitação foi enviada aos prestadores selecionados."
                  />
                  <PushNotification delay={1.2}
                    title="EcoMEI"
                    message={`👨‍🔧 ${cartServices[0]?.provider || cartProducts[0]?.provider || 'Prestador'} aceitou o chamado! Acompanhe ao vivo.`}
                  />
                  {cartServices.length > 1 && (
                    <PushNotification delay={1.8}
                      title="EcoMEI"
                      message={`👨‍🔧 ${cartServices[1].provider} também confirmou presença!`}
                    />
                  )}
                </div>
              </PhoneFrame>
            )}

            {/* ═══ STEP 5: TRACKING ═══ */}
            {step.id === 'tracking' && (
              <PhoneFrame>
                <div className="px-4 py-3 space-y-3">
                  <Badge className="bg-primary text-primary-foreground px-3 py-1 text-[10px] mx-auto block w-fit">
                    🔧 Profissional a caminho
                  </Badge>

                  <TrackingMap progress={trackingProgress} />

                  {/* Technician(s) */}
                  {cartServices.map((svc, i) => (
                    <div key={i} className="bg-card rounded-xl p-3 border border-border shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center text-xl shrink-0">
                          {segmentEmojis[svc.segment] || '👨‍🔧'}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-foreground">{svc.provider}</p>
                          <p className="text-[10px] text-muted-foreground">{svc.name} • <Star className="w-2.5 h-2.5 inline text-accent fill-accent" /> {svc.rating}</p>
                        </div>
                        <div className="flex gap-1.5">
                          <Button variant="outline" size="icon" className="rounded-full w-8 h-8"><Phone className="w-3.5 h-3.5" /></Button>
                          <Button variant="outline" size="icon" className="rounded-full w-8 h-8"><MessageCircle className="w-3.5 h-3.5" /></Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Status timeline */}
                  <div className="bg-muted/30 rounded-xl p-3 border border-border">
                    {[
                      { done: true, label: 'Pedido confirmado', time: '13:52' },
                      { done: true, label: 'Prestador(es) designado(s)', time: '13:55' },
                      { done: trackingProgress > 30, label: 'A caminho do local', time: trackingProgress > 30 ? '14:02' : '' },
                      { done: trackingProgress > 70, label: 'Chegou ao local', time: trackingProgress > 70 ? '14:15' : '' },
                      { done: false, label: 'Serviço em execução', time: '' },
                      { done: false, label: 'Confirmação do cliente', time: '' },
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

            {/* ═══ STEP 6: SERVICE DONE — CLIENT CONFIRMATION ═══ */}
            {step.id === 'service-done' && (
              <PhoneFrame>
                <div className="px-4 py-3 space-y-3">
                  <PushNotification delay={0}
                    title="EcoMEI IA"
                    message="📸 O profissional finalizou o serviço! Confira as fotos e confirme a realização."
                  />

                  {/* Photos */}
                  <div className="bg-muted/50 rounded-xl p-2.5 border border-border">
                    <p className="text-[9px] font-semibold text-muted-foreground mb-1.5">📸 REGISTRO DO SERVIÇO</p>
                    <div className="flex gap-2">
                      {['Antes', 'Durante', 'Depois'].map((l, i) => (
                        <div key={i} className="flex-1 aspect-square bg-primary/10 rounded-lg flex flex-col items-center justify-center border border-primary/20">
                          <Camera className="w-4 h-4 text-primary mb-0.5" />
                          <span className="text-[8px] text-primary">{l}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Items completed checklist */}
                  <div className="bg-card rounded-xl p-3 border border-border">
                    <p className="text-[10px] font-semibold text-muted-foreground mb-2">Itens realizados:</p>
                    {cartServices.map((svc, i) => (
                      <div key={i} className="flex items-center gap-2 py-1.5 border-b border-border/50 last:border-0">
                        <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                        <p className="text-[10px] text-foreground">{svc.name} — {svc.provider}</p>
                      </div>
                    ))}
                    {cartProducts.map((prod, i) => (
                      <div key={i} className="flex items-center gap-2 py-1.5 border-b border-border/50 last:border-0">
                        <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                        <p className="text-[10px] text-foreground">{prod.name} — entregue</p>
                      </div>
                    ))}
                  </div>

                  {/* Client confirmation interaction */}
                  {!clientConfirmed ? (
                    <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}
                      className="space-y-2">
                      <p className="text-[10px] text-center text-muted-foreground">O serviço foi realizado conforme esperado?</p>
                      <div className="flex gap-2">
                        <Button className="flex-1 gap-1 text-xs" variant="default" onClick={() => setClientConfirmed(true)}>
                          <ThumbsUp className="w-3.5 h-3.5" /> Sim, confirmo!
                        </Button>
                        <Button className="flex-1 gap-1 text-xs" variant="outline">
                          <MessageCircle className="w-3.5 h-3.5" /> Reportar problema
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-3">
                      <PushNotification delay={0.2}
                        title="EcoMEI IA"
                        message="✅ Ótimo! Sua confirmação foi registrada. Agora a Central vai validar o serviço."
                      />

                      {/* Rating */}
                      <div className="bg-muted/50 rounded-xl p-3 border border-border text-center">
                        <p className="text-[10px] font-semibold text-muted-foreground mb-1.5">Avalie o serviço</p>
                        <div className="flex justify-center gap-1">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s}
                              className={`w-7 h-7 cursor-pointer hover:scale-110 transition-transform ${s <= clientRating ? 'text-accent fill-accent' : 'text-muted-foreground/30'}`}
                              onClick={() => setClientRating(s)}
                            />
                          ))}
                        </div>
                        {clientRating > 0 && (
                          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] text-green-600 mt-1">
                            Obrigado pela avaliação! ⭐
                          </motion.p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              </PhoneFrame>
            )}

            {/* ═══ STEP 7: CENTRAL VALIDATION ═══ */}
            {step.id === 'verify' && (
              <PhoneFrame>
                <div className="px-4 py-3 space-y-3">
                  <PushNotification delay={0}
                    title="Central de Qualidade"
                    message="🛡️ Validação em andamento. O técnico informará o código de verificação."
                  />

                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} className="text-center py-2">
                    <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Shield className="w-7 h-7 text-primary" />
                    </div>
                    <p className="text-sm font-bold text-foreground">Validação da Central</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Insira o código fornecido pelo técnico</p>
                  </motion.div>

                  {/* Code input */}
                  <div className="flex justify-center gap-2.5">
                    {[0, 1, 2, 3].map(i => (
                      <motion.div key={i}
                        initial={{ y: 15, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 + i * 0.08 }}
                        className={`w-13 h-14 rounded-xl border-2 flex items-center justify-center transition-all ${
                          codeInput[i]
                            ? codeVerified ? 'border-green-500 bg-green-50' : 'border-foreground/40 bg-muted'
                            : 'border-muted-foreground/20 bg-card'
                        }`}>
                        <span className="text-lg font-bold font-mono text-foreground">{codeInput[i] || ''}</span>
                      </motion.div>
                    ))}
                  </div>

                  {!codeVerified && (
                    <div className="grid grid-cols-3 gap-1.5 max-w-[220px] mx-auto">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, '⌫'].map((key, i) => (
                        <button key={i} disabled={key === null}
                          onClick={() => {
                            if (key === '⌫') setCodeInput(prev => prev.slice(0, -1));
                            else if (key !== null && codeInput.length < 4) {
                              const newCode = codeInput + key;
                              setCodeInput(newCode);
                              if (newCode.length === 4 && newCode === verificationCode) {
                                setTimeout(() => { setCodeVerified(true); setCentralValidated(true); }, 400);
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
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-3">
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
                        className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-8 h-8 text-green-600" />
                      </motion.div>
                      <p className="text-sm font-bold text-green-700 text-center">Validado pela Central! ✅</p>

                      <PushNotification delay={0.5}
                        title="Central de Qualidade"
                        message={`✅ Serviço validado! ${serviceCreditCost} créditos debitados. Qualidade confirmada pela equipe.`}
                      />

                      <PushNotification delay={1.2}
                        title="EcoMEI IA"
                        message="🎉 Tudo certo! Veja quanto você economizou nessa experiência!"
                      />
                    </motion.div>
                  )}

                  <div className="bg-muted/30 rounded-xl p-3 border border-border">
                    <p className="text-[9px] font-semibold text-muted-foreground mb-1">📋 Fluxo de Validação</p>
                    {[
                      { done: true, label: 'Cliente confirmou realização do serviço' },
                      { done: clientRating > 0, label: 'Avaliação do cliente registrada' },
                      { done: codeVerified, label: 'Código de verificação validado' },
                      { done: centralValidated, label: 'Central aprovou a qualidade' },
                      { done: centralValidated, label: 'Créditos debitados do plano' },
                    ].map((t, i) => (
                      <div key={i} className="flex items-center gap-2 py-1">
                        <div className={`w-2 h-2 rounded-full ${t.done ? 'bg-green-500' : 'bg-muted-foreground/20'}`} />
                        <p className={`text-[9px] ${t.done ? 'text-foreground' : 'text-muted-foreground'}`}>{t.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </PhoneFrame>
            )}

            {/* ═══ STEP 8: SAVINGS & BENEFITS ═══ */}
            {step.id === 'savings' && (
              <PhoneFrame>
                <div className="px-4 py-3 space-y-3">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} className="text-center py-2">
                    <div className="w-14 h-14 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Sparkles className="w-7 h-7 text-accent" />
                    </div>
                    <p className="text-sm font-bold text-foreground">Você economizou! 🎉</p>
                  </motion.div>

                  <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3, type: 'spring' }}
                    className="bg-green-50 rounded-2xl p-4 border border-green-200 text-center">
                    <p className="text-[10px] text-green-600 font-semibold mb-1">ECONOMIA TOTAL NESTE PEDIDO</p>
                    <p className="text-3xl font-extrabold text-green-700">R$ {(totalServiceValue + productDiscount).toFixed(2)}</p>
                    <p className="text-[9px] text-green-600 mt-1">comparado a contratar sem o plano EcoMEI</p>
                  </motion.div>

                  {/* Breakdown per item */}
                  <div className="space-y-2">
                    {cartServices.map((svc, i) => (
                      <motion.div key={`svc-${i}`} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 + i * 0.1 }}
                        className="flex items-center gap-2.5 p-3 bg-card rounded-xl border border-border">
                        <span className="text-xl">{segmentEmojis[svc.segment] || '🔧'}</span>
                        <div className="flex-1">
                          <p className="text-[10px] font-semibold text-foreground">{svc.name}</p>
                          <p className="text-[9px] text-muted-foreground">Coberto por créditos do plano</p>
                        </div>
                        <p className="text-xs font-bold text-green-600">- R$ {svc.price.toFixed(2)}</p>
                      </motion.div>
                    ))}
                    {totalProducts > 0 && (
                      <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 + cartServices.length * 0.1 }}
                        className="flex items-center gap-2.5 p-3 bg-card rounded-xl border border-border">
                        <span className="text-xl">📦</span>
                        <div className="flex-1">
                          <p className="text-[10px] font-semibold text-foreground">Desconto em {totalProducts} produto(s)</p>
                          <p className="text-[9px] text-muted-foreground">{mockClient.discount}% off pelo plano {mockClient.plan}</p>
                        </div>
                        <p className="text-xs font-bold text-green-600">- R$ {productDiscount.toFixed(2)}</p>
                      </motion.div>
                    )}
                  </div>

                  {/* Time savings */}
                  <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8 }}
                    className="bg-primary/5 rounded-xl p-3 border border-primary/20">
                    <p className="text-[10px] font-semibold text-primary mb-2 flex items-center gap-1">
                      <Timer className="w-3.5 h-3.5" /> TEMPO ECONOMIZADO
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-center p-2 bg-card rounded-lg border border-border">
                        <p className="text-[9px] text-muted-foreground">Sem EcoMEI</p>
                        <p className="text-xs font-bold text-destructive">3-5 dias</p>
                      </div>
                      <div className="text-center p-2 bg-primary/10 rounded-lg border border-primary/20">
                        <p className="text-[9px] text-muted-foreground">Com EcoMEI</p>
                        <p className="text-xs font-bold text-primary">2 minutos</p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Process summary */}
                  <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1 }}
                    className="bg-card rounded-xl p-3 border border-border">
                    <p className="text-[10px] font-semibold text-muted-foreground mb-2">✨ JORNADA COMPLETA</p>
                    <div className="space-y-1.5">
                      {[
                        { icon: '🛒', text: `${totalItems} ite${totalItems > 1 ? 'ns' : 'm'} no carrinho` },
                        { icon: '📅', text: 'Agendamento com profissional verificado' },
                        { icon: '📍', text: 'Acompanhamento em tempo real' },
                        { icon: '📸', text: 'Registro fotográfico do serviço' },
                        { icon: '✅', text: 'Confirmação pelo cliente' },
                        { icon: '🛡️', text: 'Validação pela Central de Qualidade' },
                        { icon: '⭐', text: 'Avaliação pós-serviço' },
                      ].map((item, i) => (
                        <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 + i * 0.08 }}
                          className="flex items-center gap-2">
                          <span className="text-sm">{item.icon}</span>
                          <p className="text-[10px] text-foreground">{item.text}</p>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  <PushNotification delay={1.5}
                    title="EcoMEI IA"
                    message="🌟 Parabéns pela experiência! Seu plano já economizou R$ 864 em 4 meses. Continue aproveitando!"
                  />
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
