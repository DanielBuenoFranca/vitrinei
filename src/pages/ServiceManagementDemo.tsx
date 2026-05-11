import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft, Bell, Calendar, Clock, MapPin, Phone, Camera, CheckCircle2,
  Star, DollarSign, Wrench, User, Shield, ChevronRight, ChevronLeft,
  Play, Navigation, CircleDot, Package, Banknote, Eye, Lock, Unlock, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── MOCK DATA FOR THE DEMO ─── */
const serviceOrder = {
  id: 'OS-2024-0847',
  service: 'Eletricista Residencial',
  icon: '⚡',
  client: {
    name: 'Maria Silva',
    plan: 'Prata 🥈',
    address: 'Rua das Flores, 234 — Apt 12B, São Paulo - SP',
    phone: '(11) 98765-4321',
    avatar: '👩',
    credits: 95,
    monthsActive: 4,
  },
  schedule: {
    date: '28/03/2026',
    time: '14:00 — 16:00',
    dayOfWeek: 'Sábado',
  },
  technician: {
    name: 'Carlos Mendes',
    phone: '(11) 91234-5678',
    avatar: '👨‍🔧',
    rating: 4.9,
    jobs: 187,
    specialty: 'Eletricista Nível 2',
  },
  parts: [
    { name: 'Fio Elétrico 2.5mm (10m)', qty: 2, unitCost: 8.99, fromStock: true },
    { name: 'Fita Isolante Premium', qty: 1, unitCost: 12.90, fromStock: true },
    { name: 'Kit Tomadas e Interruptores', qty: 1, unitCost: 45.90, fromStock: true },
    { name: 'Disjuntor 20A', qty: 1, unitCost: 18.50, fromStock: false },
  ],
  pricing: {
    serviceCreditCost: 80,
    serviceMonetaryValue: 150.00,
    partsCost: 95.28,
    platformFee: 15.00,
    totalRevenue: 245.28,
    meiProfit: 135.00,
    estimatedTime: '1h30min',
  },
  verificationCode: '8472',
};

/* ─── STEP DEFINITIONS ─── */
const steps = [
  { id: 'notification', label: 'Notificação', perspective: 'mei', icon: Bell, emoji: '🔔' },
  { id: 'agenda', label: 'Agenda', perspective: 'mei', icon: Calendar, emoji: '📅' },
  { id: 'details', label: 'Detalhes do Chamado', perspective: 'mei', icon: Eye, emoji: '📋' },
  { id: 'dispatch', label: 'Despacho', perspective: 'mei', icon: Play, emoji: '🚀' },
  { id: 'tracking', label: 'Acompanhamento', perspective: 'client', icon: Navigation, emoji: '📍' },
  { id: 'execution', label: 'Execução', perspective: 'technician', icon: Wrench, emoji: '🔧' },
  { id: 'verification', label: 'Verificação', perspective: 'client', icon: Lock, emoji: '🔐' },
  { id: 'quality', label: 'Qualidade & Pagamento', perspective: 'platform', icon: Shield, emoji: '✅' },
];

const perspectiveColors: Record<string, { bg: string; text: string; label: string; icon: string }> = {
  mei: { bg: 'bg-primary/10 border-primary/30', text: 'text-primary', label: 'Visão MEI Gestor', icon: '💼' },
  client: { bg: 'bg-accent/10 border-accent/30', text: 'text-accent-foreground', label: 'Visão Cliente', icon: '👤' },
  technician: { bg: 'bg-success/10 border-success/30', text: 'text-foreground', label: 'Visão Técnico', icon: '👨‍🔧' },
  platform: { bg: 'bg-secondary border-border', text: 'text-foreground', label: 'Central Vitrinei', icon: '🏢' },
};

/* ─── PHONE MOCKUP WRAPPER ─── */
const PhoneFrame = ({ children, perspective }: { children: React.ReactNode; perspective: string }) => {
  const p = perspectiveColors[perspective];
  return (
    <div className="mx-auto max-w-sm">
      <div className={`text-center mb-3`}>
        <Badge variant="outline" className={`${p.bg} ${p.text} text-xs font-semibold px-3 py-1`}>
          {p.icon} {p.label}
        </Badge>
      </div>
      <div className="relative mx-auto w-full max-w-[360px] rounded-[2.5rem] border-[6px] border-foreground/20 bg-card shadow-2xl overflow-hidden">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-foreground/20 rounded-b-2xl z-10" />
        {/* Screen */}
        <div className="pt-8 pb-4 min-h-[560px] max-h-[640px] overflow-y-auto">
          {children}
        </div>
        {/* Home indicator */}
        <div className="flex justify-center pb-2">
          <div className="w-28 h-1 bg-foreground/20 rounded-full" />
        </div>
      </div>
    </div>
  );
};

/* ─── ANIMATED MAP PLACEHOLDER ─── */
const TrackingMap = ({ progress }: { progress: number }) => (
  <div className="relative w-full h-48 rounded-xl bg-muted overflow-hidden border border-border">
    {/* Grid lines */}
    <svg className="absolute inset-0 w-full h-full opacity-20">
      {[...Array(8)].map((_, i) => (
        <line key={`h${i}`} x1="0" y1={i * 24 + 12} x2="100%" y2={i * 24 + 12} stroke="hsl(var(--foreground))" strokeWidth="0.5" />
      ))}
      {[...Array(12)].map((_, i) => (
        <line key={`v${i}`} x1={i * 30 + 15} y1="0" x2={i * 30 + 15} y2="100%" stroke="hsl(var(--foreground))" strokeWidth="0.5" />
      ))}
    </svg>
    {/* Route path */}
    <svg className="absolute inset-0 w-full h-full">
      <path d="M 40 160 Q 80 120, 120 100 Q 160 80, 200 90 Q 240 100, 280 60 Q 300 45, 310 40" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeDasharray="6 4" opacity="0.5" />
      <path d="M 40 160 Q 80 120, 120 100 Q 160 80, 200 90 Q 240 100, 280 60 Q 300 45, 310 40" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeDashoffset={`${(1 - progress / 100) * 300}`} strokeDasharray="300" />
    </svg>
    {/* Origin pin */}
    <div className="absolute bottom-6 left-6 text-2xl">📍</div>
    <div className="absolute bottom-1 left-4 text-[9px] font-medium text-muted-foreground bg-card/80 px-1.5 py-0.5 rounded">Técnico</div>
    {/* Destination pin */}
    <div className="absolute top-4 right-6 text-2xl">🏠</div>
    <div className="absolute top-12 right-3 text-[9px] font-medium text-muted-foreground bg-card/80 px-1.5 py-0.5 rounded">Seu endereço</div>
    {/* Moving dot */}
    <motion.div
      className="absolute w-6 h-6 bg-primary rounded-full shadow-lg flex items-center justify-center text-primary-foreground text-xs border-2 border-card"
      animate={{
        left: `${12 + (progress / 100) * 75}%`,
        top: `${75 - (progress / 100) * 60}%`,
      }}
      transition={{ duration: 1.5, ease: 'easeInOut' }}
    >
      🚗
    </motion.div>
    {/* ETA badge */}
    <div className="absolute bottom-3 right-3 bg-card shadow-md rounded-lg px-2.5 py-1.5 border border-border">
      <p className="text-[10px] text-muted-foreground">Chegada estimada</p>
      <p className="text-sm font-bold text-foreground">{Math.max(1, Math.round((1 - progress / 100) * 18))} min</p>
    </div>
  </div>
);

/* ─── MAIN COMPONENT ─── */
const ServiceManagementDemo = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [trackingProgress, setTrackingProgress] = useState(0);
  const [codeInput, setCodeInput] = useState('');
  const [codeVerified, setCodeVerified] = useState(false);
  const [photosUploaded, setPhotosUploaded] = useState(0);
  const [qualityApproved, setQualityApproved] = useState(false);
  const [creditReleased, setCreditReleased] = useState(false);

  const step = steps[currentStep];
  const o = serviceOrder;

  // Auto-advance tracking progress
  useEffect(() => {
    if (currentStep === 4 && trackingProgress < 85) {
      const timer = setInterval(() => {
        setTrackingProgress(prev => Math.min(prev + 2, 85));
      }, 200);
      return () => clearInterval(timer);
    }
  }, [currentStep, trackingProgress]);

  // Auto-play
  useEffect(() => {
    if (!isAutoPlaying) return;
    const timer = setTimeout(() => {
      if (currentStep < steps.length - 1) {
        goNext();
      } else {
        setIsAutoPlaying(false);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [isAutoPlaying, currentStep]);

  const goNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      // Reset step-specific states
      if (currentStep + 1 === 4) setTrackingProgress(0);
      if (currentStep + 1 === 6) { setCodeInput(''); setCodeVerified(false); }
      if (currentStep + 1 === 5) setPhotosUploaded(0);
      if (currentStep + 1 === 7) { setQualityApproved(false); setCreditReleased(false); }
    }
  }, [currentStep]);

  const goPrev = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  const totalParts = o.parts.reduce((s, p) => s + p.qty * p.unitCost, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/mei')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-display font-bold text-foreground text-sm md:text-base">Gestão de Chamados — Demo Interativa</h1>
              <p className="text-[10px] md:text-xs text-muted-foreground">Simulação do fluxo completo de atendimento</p>
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
          <div className="flex items-center gap-1 admin-scroll-area shrink-0 pb-1">
            {steps.map((s, i) => {
              const p = perspectiveColors[s.perspective];
              return (
                <button
                  key={s.id}
                  onClick={() => setCurrentStep(i)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-all shrink-0 border ${
                    i === currentStep
                      ? `${p.bg} ${p.text} border-current shadow-sm`
                      : i < currentStep
                      ? 'bg-primary/5 text-primary border-primary/20'
                      : 'bg-muted text-muted-foreground border-transparent'
                  }`}
                >
                  <span>{i < currentStep ? '✓' : s.emoji}</span>
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
              );
            })}
          </div>
          <Progress value={((currentStep + 1) / steps.length) * 100} className="h-1 mt-2" />
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
          >
            {/* ═══ STEP 1: NOTIFICATION (MEI) ═══ */}
            {step.id === 'notification' && (
              <PhoneFrame perspective="mei">
                <div className="px-4 space-y-3">
                  {/* Push notification banner */}
                  <motion.div
                    initial={{ y: -60, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                    className="bg-primary/10 border border-primary/30 rounded-2xl p-4 shadow-lg"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shrink-0">
                        <Zap className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-foreground">Vitrinei — Nova Solicitação!</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {o.client.avatar} {o.client.name} solicitou <strong>{o.service}</strong>
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          📅 {o.schedule.date} às {o.schedule.time.split(' — ')[0]}
                        </p>
                        <p className="text-[10px] text-primary mt-1 font-medium">Toque para ver detalhes →</p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Recent notifications list */}
                  <div className="pt-2">
                    <p className="text-xs font-semibold text-foreground px-1 mb-2">Notificações recentes</p>
                    {[
                      { time: 'Agora', msg: 'Nova solicitação de serviço', highlight: true },
                      { time: '2h atrás', msg: 'Pagamento OS-0846 confirmado', highlight: false },
                      { time: 'Ontem', msg: 'Avaliação 5⭐ recebida', highlight: false },
                      { time: 'Ontem', msg: 'Estoque baixo: Fita Isolante', highlight: false },
                    ].map((n, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        className={`flex items-center gap-3 p-3 rounded-xl mb-2 ${n.highlight ? 'bg-primary/5 border border-primary/20' : 'bg-muted/50'}`}
                      >
                        <div className={`w-2 h-2 rounded-full shrink-0 ${n.highlight ? 'bg-primary animate-pulse' : 'bg-muted-foreground/30'}`} />
                        <div className="flex-1">
                          <p className={`text-[11px] ${n.highlight ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>{n.msg}</p>
                          <p className="text-[9px] text-muted-foreground">{n.time}</p>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </PhoneFrame>
            )}

            {/* ═══ STEP 2: AGENDA (MEI) ═══ */}
            {step.id === 'agenda' && (
              <PhoneFrame perspective="mei">
                <div className="px-4 space-y-3">
                  <div className="text-center py-2">
                    <p className="text-xs font-bold text-foreground">📅 Agenda — {o.schedule.dayOfWeek}, {o.schedule.date}</p>
                  </div>

                  {/* Time slots */}
                  {[
                    { time: '08:00', status: 'done', label: 'Manutenção Elétrica — Apt 5C', client: 'Pedro R.' },
                    { time: '10:00', status: 'done', label: 'Instalação Tomadas — Casa 12', client: 'Ana L.' },
                    { time: '12:00', status: 'break', label: 'Almoço', client: '' },
                    { time: '14:00', status: 'new', label: o.service, client: o.client.name },
                    { time: '17:00', status: 'free', label: 'Disponível', client: '' },
                  ].map((slot, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      className={`flex items-center gap-3 p-3 rounded-xl border ${
                        slot.status === 'new'
                          ? 'bg-primary/10 border-primary/30 shadow-sm ring-2 ring-primary/20'
                          : slot.status === 'done'
                          ? 'bg-muted/30 border-border'
                          : slot.status === 'break'
                          ? 'bg-accent/5 border-accent/20'
                          : 'bg-card border-border border-dashed'
                      }`}
                    >
                      <div className="text-center w-12 shrink-0">
                        <p className={`text-sm font-bold ${slot.status === 'new' ? 'text-primary' : 'text-muted-foreground'}`}>{slot.time}</p>
                      </div>
                      <div className="w-0.5 h-10 rounded-full bg-border" />
                      <div className="flex-1">
                        <p className={`text-[11px] font-medium ${
                          slot.status === 'new' ? 'text-foreground' :
                          slot.status === 'done' ? 'text-muted-foreground line-through' :
                          'text-muted-foreground'
                        }`}>{slot.label}</p>
                        {slot.client && (
                          <p className="text-[10px] text-muted-foreground">{slot.status === 'new' ? '🆕 ' : ''}{slot.client}</p>
                        )}
                      </div>
                      {slot.status === 'done' && <CheckCircle2 className="w-4 h-4 text-primary/50" />}
                      {slot.status === 'new' && (
                        <Badge className="bg-primary text-primary-foreground text-[9px] animate-pulse">NOVO</Badge>
                      )}
                    </motion.div>
                  ))}
                </div>
              </PhoneFrame>
            )}

            {/* ═══ STEP 3: SERVICE DETAILS (MEI) ═══ */}
            {step.id === 'details' && (
              <PhoneFrame perspective="mei">
                <div className="px-4 space-y-3">
                  <div className="text-center pb-1">
                    <p className="text-lg">{o.icon}</p>
                    <p className="text-xs font-bold text-foreground">{o.id}</p>
                    <p className="text-[10px] text-muted-foreground">{o.service}</p>
                  </div>

                  {/* Client info */}
                  <div className="bg-muted/50 rounded-xl p-3 border border-border">
                    <p className="text-[10px] font-semibold text-muted-foreground mb-2">CLIENTE</p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{o.client.avatar}</span>
                      <div>
                        <p className="text-xs font-semibold text-foreground">{o.client.name}</p>
                        <p className="text-[10px] text-muted-foreground">{o.client.plan} • {o.client.monthsActive} meses ativo</p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
                      <MapPin className="w-3 h-3" /> {o.client.address}
                    </div>
                  </div>

                  {/* Parts from stock */}
                  <div className="bg-muted/50 rounded-xl p-3 border border-border">
                    <p className="text-[10px] font-semibold text-muted-foreground mb-2">📦 PEÇAS DO ESTOQUE</p>
                    {o.parts.map((p, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px]">{p.fromStock ? '✅' : '🛒'}</span>
                          <div>
                            <p className="text-[10px] text-foreground">{p.name}</p>
                            <p className="text-[9px] text-muted-foreground">Qtd: {p.qty} • {p.fromStock ? 'Em estoque' : 'Comprar'}</p>
                          </div>
                        </div>
                        <p className="text-[10px] font-semibold text-foreground">R$ {(p.qty * p.unitCost).toFixed(2).replace('.', ',')}</p>
                      </motion.div>
                    ))}
                    <div className="flex justify-between mt-2 pt-2 border-t border-border">
                      <p className="text-[10px] font-semibold text-muted-foreground">Total Peças</p>
                      <p className="text-[10px] font-bold text-foreground">R$ {totalParts.toFixed(2).replace('.', ',')}</p>
                    </div>
                  </div>

                  {/* Financial breakdown */}
                  <div className="bg-primary/5 rounded-xl p-3 border border-primary/20">
                    <p className="text-[10px] font-semibold text-primary mb-2">💰 RESUMO FINANCEIRO</p>
                    {[
                      { label: 'Valor do serviço', value: o.pricing.serviceMonetaryValue },
                      { label: 'Peças', value: totalParts },
                      { label: 'Taxa plataforma', value: -o.pricing.platformFee },
                    ].map((row, i) => (
                      <div key={i} className="flex justify-between py-1">
                        <p className="text-[10px] text-muted-foreground">{row.label}</p>
                        <p className={`text-[10px] font-medium ${row.value < 0 ? 'text-destructive' : 'text-foreground'}`}>
                          {row.value < 0 ? '-' : ''} R$ {Math.abs(row.value).toFixed(2).replace('.', ',')}
                        </p>
                      </div>
                    ))}
                    <div className="flex justify-between mt-2 pt-2 border-t border-primary/20">
                      <p className="text-xs font-bold text-foreground">💵 Lucro Líquido</p>
                      <p className="text-sm font-extrabold text-primary">R$ {o.pricing.meiProfit.toFixed(2).replace('.', ',')}</p>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <p className="text-[10px] text-muted-foreground">Tempo previsto: <strong className="text-foreground">{o.pricing.estimatedTime}</strong></p>
                    </div>
                  </div>
                </div>
              </PhoneFrame>
            )}

            {/* ═══ STEP 4: DISPATCH (MEI) ═══ */}
            {step.id === 'dispatch' && (
              <PhoneFrame perspective="mei">
                <div className="px-4 space-y-3">
                  <div className="text-center py-2">
                    <p className="text-xs font-bold text-foreground">🚀 Despachar Chamado</p>
                    <p className="text-[10px] text-muted-foreground">{o.id} — {o.service}</p>
                  </div>

                  {/* Technician selection */}
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-card rounded-xl p-4 border-2 border-primary shadow-md"
                  >
                    <p className="text-[10px] font-semibold text-muted-foreground mb-3">TÉCNICO SELECIONADO</p>
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center text-3xl">{o.technician.avatar}</div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-foreground">{o.technician.name}</p>
                        <p className="text-[10px] text-muted-foreground">{o.technician.specialty}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-0.5">
                            <Star className="w-3 h-3 text-accent fill-accent" />
                            <span className="text-[10px] font-semibold">{o.technician.rating}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">{o.technician.jobs} jobs</span>
                        </div>
                      </div>
                      <CheckCircle2 className="w-6 h-6 text-primary" />
                    </div>
                  </motion.div>

                  {/* Phone assignment */}
                  <div className="bg-muted/50 rounded-xl p-3 border border-border">
                    <p className="text-[10px] font-semibold text-muted-foreground mb-2">📱 CELULAR DO TÉCNICO</p>
                    <div className="flex items-center gap-2 bg-card rounded-lg p-2.5 border border-border">
                      <Phone className="w-4 h-4 text-primary" />
                      <p className="text-xs font-mono font-semibold text-foreground">{o.technician.phone}</p>
                      <Badge variant="secondary" className="text-[9px] ml-auto">Ativo</Badge>
                    </div>
                  </div>

                  {/* Client notification preview */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="bg-accent/10 rounded-xl p-3 border border-accent/30"
                  >
                    <p className="text-[10px] font-semibold text-muted-foreground mb-1">📲 O CLIENTE RECEBERÁ:</p>
                    <div className="bg-card rounded-lg p-2.5 border border-border">
                      <p className="text-[10px] text-foreground italic">
                        "Olá {o.client.name.split(' ')[0]}! Seu serviço de {o.service} foi confirmado. 
                        O técnico {o.technician.name} está a caminho. Acompanhe em tempo real! 🗺️"
                      </p>
                    </div>
                  </motion.div>

                  {/* Start button */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    <Button className="w-full h-12 text-sm font-bold" onClick={goNext}>
                      <Play className="w-4 h-4 mr-2" /> Iniciar Chamado
                    </Button>
                    <p className="text-[9px] text-center text-muted-foreground mt-1.5">O cronômetro iniciará e o cliente será notificado</p>
                  </motion.div>
                </div>
              </PhoneFrame>
            )}

            {/* ═══ STEP 5: TRACKING (CLIENT) ═══ */}
            {step.id === 'tracking' && (
              <PhoneFrame perspective="client">
                <div className="px-4 space-y-3">
                  <div className="text-center py-1">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <Badge className="bg-primary text-primary-foreground px-3 py-1 text-xs">
                        🔧 Técnico a caminho
                      </Badge>
                    </motion.div>
                  </div>

                  {/* Map */}
                  <TrackingMap progress={trackingProgress} />

                  {/* Technician card */}
                  <div className="bg-card rounded-xl p-3 border border-border shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center text-2xl">{o.technician.avatar}</div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-foreground">{o.technician.name}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Star className="w-3 h-3 text-accent fill-accent" />
                          <span className="text-[10px] text-muted-foreground">{o.technician.rating} • {o.technician.specialty}</span>
                        </div>
                      </div>
                      <Button variant="outline" size="icon" className="rounded-full w-9 h-9">
                        <Phone className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Service info */}
                  <div className="bg-muted/50 rounded-xl p-3 border border-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-muted-foreground">Serviço</p>
                        <p className="text-xs font-semibold text-foreground">{o.icon} {o.service}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground">Custo</p>
                        <p className="text-xs font-semibold text-primary">{o.pricing.serviceCreditCost} créditos</p>
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="space-y-0">
                    {[
                      { done: true, label: 'Solicitação enviada', time: '13:45' },
                      { done: true, label: 'Chamado aceito pelo gestor', time: '13:52' },
                      { done: true, label: 'Técnico designado', time: '13:55' },
                      { done: trackingProgress > 50, label: 'Técnico a caminho', time: trackingProgress > 50 ? '14:02' : '...' },
                      { done: false, label: 'Chegou ao local', time: '' },
                      { done: false, label: 'Serviço em execução', time: '' },
                    ].map((t, i) => (
                      <div key={i} className="flex items-start gap-2.5 pb-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full border-2 ${t.done ? 'bg-primary border-primary' : 'border-muted-foreground/30 bg-card'}`} />
                          {i < 5 && <div className={`w-0.5 h-5 ${t.done ? 'bg-primary' : 'bg-border'}`} />}
                        </div>
                        <div>
                          <p className={`text-[10px] ${t.done ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{t.label}</p>
                          {t.time && <p className="text-[9px] text-muted-foreground">{t.time}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </PhoneFrame>
            )}

            {/* ═══ STEP 6: EXECUTION (TECHNICIAN) ═══ */}
            {step.id === 'execution' && (
              <PhoneFrame perspective="technician">
                <div className="px-4 space-y-3">
                  <div className="text-center py-1">
                    <Badge className="bg-foreground/90 text-background text-[10px] px-3 py-1">
                      ⏱ Tempo: 01:22:45
                    </Badge>
                  </div>

                  {/* Job info */}
                  <div className="bg-muted/50 rounded-xl p-3 border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-foreground">{o.icon} {o.service}</p>
                      <Badge variant="secondary" className="text-[9px]">{o.id}</Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{o.client.avatar} {o.client.name}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3" /> {o.client.address}
                    </p>
                  </div>

                  {/* Checklist */}
                  <div className="bg-card rounded-xl p-3 border border-border">
                    <p className="text-[10px] font-semibold text-muted-foreground mb-2">✅ CHECKLIST DO SERVIÇO</p>
                    {[
                      { label: 'Desligar disjuntor geral', done: true },
                      { label: 'Verificar fiação existente', done: true },
                      { label: 'Instalar novos pontos elétricos', done: true },
                      { label: 'Testar tomadas e interruptores', done: true },
                      { label: 'Religar disjuntor e teste final', done: false },
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + i * 0.1 }}
                        className="flex items-center gap-2 py-1.5"
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${item.done ? 'bg-primary border-primary' : 'border-muted-foreground/30'}`}>
                          {item.done && <CheckCircle2 className="w-3 h-3 text-primary-foreground" />}
                        </div>
                        <p className={`text-[11px] ${item.done ? 'text-foreground line-through opacity-60' : 'text-foreground font-medium'}`}>{item.label}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Photo capture */}
                  <div className="bg-card rounded-xl p-3 border border-border">
                    <p className="text-[10px] font-semibold text-muted-foreground mb-2">📸 FOTOS OBRIGATÓRIAS ({photosUploaded}/3)</p>
                    <div className="grid grid-cols-3 gap-2">
                      {['Antes', 'Durante', 'Depois'].map((label, i) => (
                        <motion.button
                          key={i}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setPhotosUploaded(prev => Math.min(prev + 1, 3))}
                          className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all ${
                            i < photosUploaded
                              ? 'bg-primary/10 border-primary'
                              : 'bg-muted/50 border-muted-foreground/20'
                          }`}
                        >
                          {i < photosUploaded ? (
                            <CheckCircle2 className="w-5 h-5 text-primary" />
                          ) : (
                            <Camera className="w-5 h-5 text-muted-foreground" />
                          )}
                          <span className="text-[9px] text-muted-foreground">{label}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Verification code */}
                  <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="bg-accent/10 rounded-xl p-4 border border-accent/30 text-center"
                  >
                    <p className="text-[10px] font-semibold text-muted-foreground mb-1">CÓDIGO DE VERIFICAÇÃO</p>
                    <p className="text-[9px] text-muted-foreground mb-2">Informe ao cliente para confirmar o serviço</p>
                    <div className="flex justify-center gap-2">
                      {o.verificationCode.split('').map((digit, i) => (
                        <motion.div
                          key={i}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.8 + i * 0.1, type: 'spring' }}
                          className="w-10 h-12 bg-card border-2 border-foreground/20 rounded-lg flex items-center justify-center"
                        >
                          <span className="text-lg font-bold font-mono text-foreground">{digit}</span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </PhoneFrame>
            )}

            {/* ═══ STEP 7: VERIFICATION (CLIENT) ═══ */}
            {step.id === 'verification' && (
              <PhoneFrame perspective="client">
                <div className="px-4 space-y-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring' }}
                    className="text-center py-3"
                  >
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Wrench className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-sm font-bold text-foreground">Serviço Concluído!</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Insira o código fornecido pelo técnico</p>
                  </motion.div>

                  {/* Code input */}
                  <div className="flex justify-center gap-3">
                    {[0, 1, 2, 3].map(i => (
                      <motion.div
                        key={i}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                        className={`w-14 h-16 rounded-xl border-2 flex items-center justify-center transition-all ${
                          codeInput[i]
                            ? codeVerified
                              ? 'border-primary bg-primary/10'
                              : 'border-foreground/40 bg-muted'
                            : 'border-muted-foreground/20 bg-card'
                        }`}
                      >
                        <span className="text-xl font-bold font-mono text-foreground">{codeInput[i] || ''}</span>
                      </motion.div>
                    ))}
                  </div>

                  {/* Numpad */}
                  {!codeVerified && (
                    <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, '⌫'].map((key, i) => (
                        <button
                          key={i}
                          disabled={key === null}
                          onClick={() => {
                            if (key === '⌫') {
                              setCodeInput(prev => prev.slice(0, -1));
                            } else if (key !== null && codeInput.length < 4) {
                              const newCode = codeInput + key;
                              setCodeInput(newCode);
                              if (newCode.length === 4 && newCode === o.verificationCode) {
                                setTimeout(() => setCodeVerified(true), 500);
                              }
                            }
                          }}
                          className={`h-12 rounded-xl text-sm font-semibold transition-all ${
                            key === null
                              ? 'invisible'
                              : 'bg-muted hover:bg-muted/80 text-foreground active:scale-95'
                          }`}
                        >
                          {key}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Success state */}
                  {codeVerified && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-center space-y-3 py-3"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.2 }}
                        className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto"
                      >
                        <CheckCircle2 className="w-10 h-10 text-primary" />
                      </motion.div>
                      <p className="text-sm font-bold text-primary">Código Verificado ✓</p>
                      <p className="text-[10px] text-muted-foreground">
                        {o.pricing.serviceCreditCost} créditos serão debitados da sua conta
                      </p>

                      {/* Rating */}
                      <div className="bg-muted/50 rounded-xl p-3 border border-border">
                        <p className="text-[10px] font-semibold text-muted-foreground mb-2">Avalie o serviço</p>
                        <div className="flex justify-center gap-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star key={star} className="w-7 h-7 text-accent fill-accent cursor-pointer hover:scale-110 transition-transform" />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </PhoneFrame>
            )}

            {/* ═══ STEP 8: QUALITY & PAYMENT (PLATFORM) ═══ */}
            {step.id === 'quality' && (
              <PhoneFrame perspective="platform">
                <div className="px-4 space-y-3">
                  <div className="text-center py-2">
                    <Shield className="w-8 h-8 text-primary mx-auto mb-1" />
                    <p className="text-xs font-bold text-foreground">Central de Qualidade Vitrinei</p>
                    <p className="text-[10px] text-muted-foreground">{o.id}</p>
                  </div>

                  {/* Quality checks */}
                  <div className="bg-card rounded-xl p-3 border border-border space-y-2">
                    <p className="text-[10px] font-semibold text-muted-foreground mb-1">🔍 ANÁLISE DE QUALIDADE</p>
                    {[
                      { label: 'Fotos do serviço recebidas (3/3)', status: 'ok' },
                      { label: 'Código de verificação confirmado', status: 'ok' },
                      { label: 'Avaliação do cliente: 5 ⭐', status: 'ok' },
                      { label: 'Tempo dentro do estimado', status: 'ok' },
                      { label: 'Peças do estoque baixadas', status: 'ok' },
                    ].map((check, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.15 }}
                        className="flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                        <p className="text-[10px] text-foreground">{check.label}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Approve button */}
                  {!qualityApproved && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.2 }}
                    >
                      <Button className="w-full" onClick={() => {
                        setQualityApproved(true);
                        setTimeout(() => setCreditReleased(true), 1500);
                      }}>
                        <Shield className="w-4 h-4 mr-2" /> Aprovar e Liberar Crédito
                      </Button>
                    </motion.div>
                  )}

                  {/* Credit released */}
                  {qualityApproved && (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="space-y-3"
                    >
                      <div className="bg-primary/10 rounded-xl p-4 border border-primary/30 text-center">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', delay: 0.3 }}
                        >
                          <Unlock className="w-10 h-10 text-primary mx-auto mb-2" />
                        </motion.div>
                        <p className="text-xs font-bold text-primary">Qualidade Aprovada ✓</p>
                        <p className="text-[10px] text-muted-foreground mt-1">Créditos liberados para o MEI</p>
                      </div>

                      {creditReleased && (
                        <motion.div
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          className="bg-card rounded-xl p-4 border-2 border-primary shadow-lg"
                        >
                          <p className="text-[10px] font-semibold text-muted-foreground mb-3">💰 CRÉDITO NO CAIXA DO MEI</p>
                          <div className="text-center">
                            <motion.p
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', delay: 0.4 }}
                              className="text-2xl font-extrabold text-primary"
                            >
                              + R$ {o.pricing.meiProfit.toFixed(2).replace('.', ',')}
                            </motion.p>
                            <p className="text-[10px] text-muted-foreground mt-2">Disponível para saque ou reinvestimento</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-3">
                            <Button variant="outline" size="sm" className="text-[10px] h-8">
                              <Banknote className="w-3 h-3 mr-1" /> Sacar
                            </Button>
                            <Button variant="outline" size="sm" className="text-[10px] h-8">
                              <Package className="w-3 h-3 mr-1" /> Reabastecer Estoque
                            </Button>
                          </div>
                        </motion.div>
                      )}

                      {/* Flow summary */}
                      {creditReleased && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.8 }}
                          className="bg-muted/50 rounded-xl p-3 border border-border"
                        >
                          <p className="text-[10px] font-semibold text-muted-foreground mb-2">📊 RESUMO DO CHAMADO</p>
                          <div className="space-y-1.5 text-[10px]">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Cliente</span>
                              <span className="text-foreground font-medium">{o.client.name} ({o.client.plan})</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Técnico</span>
                              <span className="text-foreground font-medium">{o.technician.name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Créditos debitados</span>
                              <span className="text-foreground font-medium">{o.pricing.serviceCreditCost} créditos</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Avaliação</span>
                              <span className="text-accent">⭐⭐⭐⭐⭐</span>
                            </div>
                            <div className="flex justify-between pt-1 border-t border-border">
                              <span className="text-muted-foreground font-semibold">Lucro MEI</span>
                              <span className="text-primary font-bold">R$ {o.pricing.meiProfit.toFixed(2).replace('.', ',')}</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
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

export default ServiceManagementDemo;
