import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft, Bell, Calendar, Clock, MapPin, Phone, Camera, CheckCircle2,
  Star, DollarSign, Wrench, User, Shield, ChevronRight, ChevronLeft,
  Play, Navigation, Package, Banknote, Eye, Lock, Unlock, Zap,
  TrendingUp, AlertCircle, FileText, Timer, BarChart3, Wallet
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const serviceOrder = {
  id: 'OS-2024-0847',
  service: 'Eletricista Residencial',
  icon: '⚡',
  client: { name: 'Maria Silva', plan: 'Prata 🥈', address: 'Rua das Flores, 234 — Apt 12B, São Paulo - SP', phone: '(11) 98765-4321', avatar: '👩', credits: 95 },
  schedule: { date: '28/03/2026', time: '14:00 — 16:00', dayOfWeek: 'Sábado' },
  technician: { name: 'Carlos Mendes', phone: '(11) 91234-5678', avatar: '👨‍🔧', rating: 4.9, jobs: 187, specialty: 'Eletricista Nível 2' },
  parts: [
    { name: 'Fio Elétrico 2.5mm (10m)', qty: 2, unitCost: 8.99, fromStock: true },
    { name: 'Fita Isolante Premium', qty: 1, unitCost: 12.90, fromStock: true },
    { name: 'Kit Tomadas e Interruptores', qty: 1, unitCost: 45.90, fromStock: true },
    { name: 'Disjuntor 20A', qty: 1, unitCost: 18.50, fromStock: false },
  ],
  pricing: { serviceCreditCost: 80, serviceMonetaryValue: 150.00, partsCost: 95.28, platformFee: 15.00, totalRevenue: 245.28, meiProfit: 135.00, estimatedTime: '1h30min' },
  verificationCode: '8472',
};

const steps = [
  { id: 'request', label: 'Nova Solicitação', icon: Bell, emoji: '🔔', desc: 'Recebendo pedido do cliente' },
  { id: 'review', label: 'Análise do Pedido', icon: Eye, emoji: '📋', desc: 'Revisando detalhes e custos' },
  { id: 'assign', label: 'Designar Técnico', icon: User, emoji: '👨‍🔧', desc: 'Escolhendo profissional' },
  { id: 'monitor', label: 'Monitoramento', icon: Navigation, emoji: '📍', desc: 'Acompanhando em tempo real' },
  { id: 'execution', label: 'Execução', icon: Wrench, emoji: '🔧', desc: 'Técnico realizando serviço' },
  { id: 'validation', label: 'Validação', icon: CheckCircle2, emoji: '✅', desc: 'Serviço finalizado pelo técnico' },
  { id: 'quality', label: 'Central de Qualidade', icon: Shield, emoji: '🏢', desc: 'Análise EcoMEI' },
  { id: 'profit', label: 'Lucro Liberado', icon: Wallet, emoji: '💰', desc: 'Crédito no caixa' },
];

const PhoneFrame = ({ children, title }: { children: React.ReactNode; title: string }) => (
  <div className="mx-auto max-w-sm">
    <div className="relative mx-auto w-full max-w-[360px] rounded-[2.5rem] border-[6px] border-foreground/20 bg-card shadow-2xl overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-foreground/20 rounded-b-2xl z-10" />
      <div className="pt-8 bg-primary/5 border-b border-border px-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-foreground">EcoMEI Gestor</span>
          </div>
          <Badge variant="outline" className="text-[9px] h-5">{title}</Badge>
        </div>
      </div>
      <div className="h-[520px] overflow-y-auto bg-background">{children}</div>
    </div>
  </div>
);

const MeiManagerDemo = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [techProgress, setTechProgress] = useState(0);
  const [qualityProgress, setQualityProgress] = useState(0);
  const [profitReleased, setProfitReleased] = useState(false);

  const step = steps[currentStep];

  useEffect(() => {
    if (!autoPlay) return;
    const t = setTimeout(() => {
      if (currentStep < steps.length - 1) setCurrentStep(c => c + 1);
      else setAutoPlay(false);
    }, 4000);
    return () => clearTimeout(t);
  }, [autoPlay, currentStep]);

  useEffect(() => {
    if (currentStep === 3) { setTechProgress(0); const i = setInterval(() => setTechProgress(p => p >= 100 ? (clearInterval(i), 100) : p + 2), 80); return () => clearInterval(i); }
    if (currentStep === 6) { setQualityProgress(0); const i = setInterval(() => setQualityProgress(p => p >= 100 ? (clearInterval(i), 100) : p + 3), 60); return () => clearInterval(i); }
    if (currentStep === 7) { setProfitReleased(false); setTimeout(() => setProfitReleased(true), 1500); }
  }, [currentStep]);

  const renderStep = () => {
    switch (step.id) {
      case 'request':
        return (
          <div className="p-4 space-y-3">
            <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-primary/10 border border-primary/30 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center"><Bell className="w-5 h-5 text-primary" /></div>
                <div><p className="text-sm font-bold text-foreground">Nova Solicitação!</p><p className="text-[10px] text-muted-foreground">Agora mesmo</p></div>
              </div>
              <div className="bg-card rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2"><span className="text-lg">{serviceOrder.icon}</span><span className="text-sm font-semibold">{serviceOrder.service}</span></div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><span className="text-base">{serviceOrder.client.avatar}</span>{serviceOrder.client.name} — {serviceOrder.client.plan}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground"><Calendar className="w-3 h-3" />{serviceOrder.schedule.date} • {serviceOrder.schedule.time}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="w-3 h-3" />{serviceOrder.client.address}</div>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="flex gap-2">
              <Button size="sm" className="flex-1 text-xs gap-1" onClick={() => setCurrentStep(1)}><Eye className="w-3 h-3" />Analisar</Button>
              <Button size="sm" variant="outline" className="flex-1 text-xs">Reagendar</Button>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="bg-muted/50 rounded-lg p-3 space-y-2">
              <p className="text-[10px] font-semibold text-muted-foreground">DASHBOARD RÁPIDO</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-card rounded-lg p-2"><p className="text-lg font-bold text-foreground">3</p><p className="text-[9px] text-muted-foreground">Hoje</p></div>
                <div className="bg-card rounded-lg p-2"><p className="text-lg font-bold text-foreground">12</p><p className="text-[9px] text-muted-foreground">Semana</p></div>
                <div className="bg-card rounded-lg p-2"><p className="text-lg font-bold text-primary">R$ 1.2k</p><p className="text-[9px] text-muted-foreground">Receita</p></div>
              </div>
            </motion.div>
          </div>
        );

      case 'review':
        return (
          <div className="p-4 space-y-3">
            <div className="text-center mb-2"><Badge className="text-[10px]">OS {serviceOrder.id}</Badge></div>
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-card border border-border rounded-xl p-3 space-y-3">
              <p className="text-[10px] font-bold text-primary uppercase">Detalhes do Serviço</p>
              <div className="flex items-center gap-2"><span className="text-lg">{serviceOrder.icon}</span><span className="text-sm font-semibold">{serviceOrder.service}</span></div>
              <div className="flex items-center gap-2"><Timer className="w-3 h-3 text-muted-foreground" /><span className="text-xs text-muted-foreground">Tempo estimado: {serviceOrder.pricing.estimatedTime}</span></div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="bg-card border border-border rounded-xl p-3 space-y-2">
              <p className="text-[10px] font-bold text-primary uppercase">Peças do Estoque</p>
              {serviceOrder.parts.map((p, i) => (
                <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 + i * 0.15 }} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-1.5">
                    <Package className="w-3 h-3 text-muted-foreground" />
                    <span>{p.name} x{p.qty}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">R$ {(p.unitCost * p.qty).toFixed(2)}</span>
                    {p.fromStock ? <Badge variant="outline" className="text-[8px] h-4 bg-green-500/10 text-green-600">estoque</Badge> : <Badge variant="outline" className="text-[8px] h-4 bg-orange-500/10 text-orange-600">comprar</Badge>}
                  </div>
                </motion.div>
              ))}
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className="bg-primary/5 border border-primary/20 rounded-xl p-3 space-y-2">
              <p className="text-[10px] font-bold text-primary uppercase">Resumo Financeiro</p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Valor do serviço</span><span>R$ {serviceOrder.pricing.serviceMonetaryValue.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Custo peças</span><span className="text-destructive">-R$ {serviceOrder.pricing.partsCost.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Taxa plataforma</span><span className="text-destructive">-R$ {serviceOrder.pricing.platformFee.toFixed(2)}</span></div>
                <div className="h-px bg-border my-1" />
                <div className="flex justify-between font-bold text-sm"><span>Seu Lucro</span><span className="text-green-600">R$ {serviceOrder.pricing.meiProfit.toFixed(2)}</span></div>
              </div>
            </motion.div>
          </div>
        );

      case 'assign':
        return (
          <div className="p-4 space-y-3">
            <p className="text-xs font-bold text-foreground">Técnicos Disponíveis</p>
            {[serviceOrder.technician, { name: 'Ana Oliveira', avatar: '👩‍🔧', rating: 4.7, jobs: 98, specialty: 'Eletricista Nível 1', phone: '(11) 99887-6543' }].map((tech, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.3 }}
                className={`border rounded-xl p-3 cursor-pointer transition-all ${i === 0 ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border bg-card hover:border-primary/30'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{tech.avatar}</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold">{tech.name}</p>
                    <p className="text-[10px] text-muted-foreground">{tech.specialty}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-0.5"><Star className="w-3 h-3 text-accent fill-accent" /><span className="text-[10px] font-bold">{tech.rating}</span></div>
                      <span className="text-[10px] text-muted-foreground">{tech.jobs} serviços</span>
                    </div>
                  </div>
                  {i === 0 && <CheckCircle2 className="w-5 h-5 text-primary" />}
                </div>
              </motion.div>
            ))}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
              <Button size="sm" className="w-full text-xs gap-1" onClick={() => setCurrentStep(3)}>
                <Play className="w-3 h-3" /> Despachar {serviceOrder.technician.name}
              </Button>
              <p className="text-[9px] text-center text-muted-foreground mt-2">O cliente será notificado automaticamente</p>
            </motion.div>
          </div>
        );

      case 'monitor':
        return (
          <div className="p-4 space-y-3">
            <div className="rounded-xl overflow-hidden h-44 bg-muted relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5">
                {[...Array(6)].map((_, i) => <div key={i} className="absolute bg-border/40 h-px w-full" style={{ top: `${15 + i * 15}%` }} />)}
                {[...Array(6)].map((_, i) => <div key={i} className="absolute bg-border/40 w-px h-full" style={{ left: `${15 + i * 15}%` }} />)}
                <motion.div animate={{ left: `${30 + techProgress * 0.35}%`, top: `${65 - techProgress * 0.3}%` }} className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm shadow-lg">🚗</div>
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-card text-[8px] px-1 rounded shadow whitespace-nowrap">Carlos</div>
                </motion.div>
                <div className="absolute top-[18%] right-[18%] text-lg">📍</div>
                <div className="absolute bottom-2 left-2 bg-card/90 rounded-lg px-2 py-1 text-[9px]">
                  <span className="font-bold text-primary">{Math.round(techProgress)}%</span> do trajeto
                </div>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold">Status em tempo real</span>
                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /><span className="text-[10px] text-green-600">Online</span></div>
              </div>
              <Progress value={techProgress} className="h-2" />
              <div className="grid grid-cols-3 gap-2 text-center">
                <div><p className="text-xs font-bold text-foreground">{serviceOrder.technician.name.split(' ')[0]}</p><p className="text-[9px] text-muted-foreground">Técnico</p></div>
                <div><p className="text-xs font-bold text-foreground">{techProgress < 100 ? 'A caminho' : 'Chegou'}</p><p className="text-[9px] text-muted-foreground">Status</p></div>
                <div><p className="text-xs font-bold text-foreground">{Math.max(0, Math.round((100 - techProgress) * 0.15))} min</p><p className="text-[9px] text-muted-foreground">ETA</p></div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1 text-[10px] gap-1"><Phone className="w-3 h-3" />Ligar Técnico</Button>
              <Button size="sm" variant="outline" className="flex-1 text-[10px] gap-1"><Phone className="w-3 h-3" />Ligar Cliente</Button>
            </div>
          </div>
        );

      case 'execution':
        return (
          <div className="p-4 space-y-3">
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-center">
              <p className="text-xs font-bold text-green-700">🔧 Serviço em Execução</p>
              <p className="text-[10px] text-green-600">Técnico chegou e iniciou os trabalhos</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-3 space-y-2">
              <p className="text-[10px] font-bold text-primary uppercase">Checklist em andamento</p>
              {['Inspeção da rede elétrica', 'Troca de fiação', 'Instalação de tomadas', 'Teste de segurança'].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0.3 }} animate={{ opacity: i < 3 ? 1 : 0.5 }} transition={{ delay: i * 0.5 }}
                  className="flex items-center gap-2 text-xs">
                  {i < 3 ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> : <div className="w-3.5 h-3.5 rounded-full border-2 border-muted-foreground/30" />}
                  <span className={i < 3 ? 'line-through text-muted-foreground' : ''}>{item}</span>
                </motion.div>
              ))}
            </div>
            <div className="bg-muted/50 rounded-xl p-3 space-y-2">
              <p className="text-[10px] font-bold uppercase text-muted-foreground">Tempo Decorrido</p>
              <div className="flex items-center justify-center gap-2">
                <Timer className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold text-foreground font-mono">01:12:34</span>
              </div>
              <p className="text-[9px] text-center text-muted-foreground">Previsto: {serviceOrder.pricing.estimatedTime}</p>
            </div>
          </div>
        );

      case 'validation':
        return (
          <div className="p-4 space-y-3">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
              <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-green-700">Serviço Concluído!</p>
              <p className="text-[10px] text-green-600">Técnico finalizou e registrou</p>
            </motion.div>
            <div className="bg-card border border-border rounded-xl p-3 space-y-2">
              <p className="text-[10px] font-bold text-primary uppercase">Registro do Técnico</p>
              <div className="grid grid-cols-3 gap-1">
                {['📸 Antes', '📸 Durante', '📸 Depois'].map((label, i) => (
                  <motion.div key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + i * 0.2 }}
                    className="bg-muted rounded-lg h-16 flex items-center justify-center text-[10px] text-muted-foreground">{label}</motion.div>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs mt-2">
                <span className="text-muted-foreground">Código de verificação</span>
                <Badge className="font-mono text-sm">{serviceOrder.verificationCode}</Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Cliente confirmou</span>
                <Badge variant="outline" className="bg-green-500/10 text-green-600 text-[10px]">✅ Validado</Badge>
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-3">
              <p className="text-[10px] font-bold text-primary uppercase mb-2">Valores do Chamado</p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Receita bruta</span><span>R$ {serviceOrder.pricing.totalRevenue.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Custo peças</span><span className="text-destructive">-R$ {serviceOrder.pricing.partsCost.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Taxa plataforma</span><span className="text-destructive">-R$ {serviceOrder.pricing.platformFee.toFixed(2)}</span></div>
                <div className="h-px bg-border my-1" />
                <div className="flex justify-between font-bold"><span>Lucro líquido</span><span className="text-green-600">R$ {serviceOrder.pricing.meiProfit.toFixed(2)}</span></div>
              </div>
            </div>
          </div>
        );

      case 'quality':
        return (
          <div className="p-4 space-y-3">
            <div className="text-center"><Badge variant="outline" className="text-[10px]">🏢 Central de Qualidade EcoMEI</Badge></div>
            <div className="bg-card border border-border rounded-xl p-3 space-y-3">
              <p className="text-[10px] font-bold text-primary uppercase">Análise Automática</p>
              {['Fotos analisadas por IA', 'Código de verificação validado', 'Avaliação do cliente: ⭐ 5.0', 'Checklist 100% concluído'].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: qualityProgress > i * 25 ? 1 : 0.3, x: 0 }} transition={{ delay: i * 0.3 }}
                  className="flex items-center gap-2 text-xs">
                  {qualityProgress > i * 25 ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> : <div className="w-3.5 h-3.5 rounded-full border-2 border-muted-foreground/30 animate-spin" />}
                  <span>{item}</span>
                </motion.div>
              ))}
              <Progress value={qualityProgress} className="h-2 mt-2" />
              <p className="text-[9px] text-center text-muted-foreground">{qualityProgress < 100 ? 'Analisando...' : '✅ Aprovado!'}</p>
            </div>
            {qualityProgress >= 100 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-center">
                <Shield className="w-8 h-8 text-green-600 mx-auto mb-1" />
                <p className="text-sm font-bold text-green-700">Qualidade Aprovada</p>
                <p className="text-[10px] text-green-600">Crédito autorizado para liberação</p>
              </motion.div>
            )}
          </div>
        );

      case 'profit':
        return (
          <div className="p-4 space-y-3">
            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.5 }}
              className="bg-gradient-to-br from-green-500/20 to-primary/10 border border-green-500/30 rounded-xl p-4 text-center">
              <motion.div animate={profitReleased ? { rotate: [0, -10, 10, 0], scale: [1, 1.2, 1] } : {}} transition={{ duration: 0.5 }}>
                <span className="text-4xl">💰</span>
              </motion.div>
              <p className="text-lg font-bold text-green-700 mt-2">R$ {serviceOrder.pricing.meiProfit.toFixed(2)}</p>
              <p className="text-xs text-green-600">{profitReleased ? 'Lucro creditado no seu caixa!' : 'Processando...'}</p>
            </motion.div>
            {profitReleased && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="space-y-3">
                <div className="bg-card border border-border rounded-xl p-3 space-y-2">
                  <p className="text-[10px] font-bold text-primary uppercase">Painel Financeiro Atualizado</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-muted/50 rounded-lg p-2 text-center"><p className="text-sm font-bold text-foreground">R$ 4.850</p><p className="text-[9px] text-muted-foreground">Saldo disponível</p></div>
                    <div className="bg-muted/50 rounded-lg p-2 text-center"><p className="text-sm font-bold text-green-600">+18%</p><p className="text-[9px] text-muted-foreground">vs. mês anterior</p></div>
                    <div className="bg-muted/50 rounded-lg p-2 text-center"><p className="text-sm font-bold text-foreground">42</p><p className="text-[9px] text-muted-foreground">Serviços/mês</p></div>
                    <div className="bg-muted/50 rounded-lg p-2 text-center"><p className="text-sm font-bold text-foreground">⭐ 4.9</p><p className="text-[9px] text-muted-foreground">Avaliação média</p></div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 text-[10px] gap-1"><Wallet className="w-3 h-3" />Sacar</Button>
                  <Button size="sm" variant="outline" className="flex-1 text-[10px] gap-1"><BarChart3 className="w-3 h-3" />Relatório</Button>
                </div>
              </motion.div>
            )}
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
          <span className="font-display text-sm font-bold text-foreground">Gestão MEI — Passo a Passo</span>
          <Button variant={autoPlay ? 'default' : 'outline'} size="sm" className="text-xs gap-1" onClick={() => setAutoPlay(!autoPlay)}>
            <Play className="w-3 h-3" />{autoPlay ? 'Pausar' : 'Auto'}
          </Button>
        </div>
      </nav>

      <div className="pt-20 pb-10 px-4 container mx-auto">
        {/* Step indicators */}
        <div className="flex items-center justify-center gap-1 mb-8 flex-wrap">
          {steps.map((s, i) => (
            <button key={s.id} onClick={() => setCurrentStep(i)}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium transition-all ${
                i === currentStep ? 'bg-primary text-primary-foreground scale-110' : i < currentStep ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
              }`}>
              <span>{s.emoji}</span><span className="hidden sm:inline">{s.label}</span>
            </button>
          ))}
        </div>

        {/* Description */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-foreground mb-1">{step.emoji} {step.label}</h2>
          <p className="text-sm text-muted-foreground">{step.desc}</p>
        </div>

        {/* Phone */}
        <AnimatePresence mode="wait">
          <motion.div key={currentStep} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
            <PhoneFrame title={step.label}>
              {renderStep()}
            </PhoneFrame>
          </motion.div>
        </AnimatePresence>

        {/* Nav */}
        <div className="flex justify-center gap-3 mt-8">
          <Button variant="outline" size="sm" disabled={currentStep === 0} onClick={() => setCurrentStep(c => c - 1)} className="gap-1"><ChevronLeft className="w-4 h-4" />Anterior</Button>
          <Button size="sm" disabled={currentStep === steps.length - 1} onClick={() => setCurrentStep(c => c + 1)} className="gap-1">Próximo<ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>
    </div>
  );
};

export default MeiManagerDemo;
