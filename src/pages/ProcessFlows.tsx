import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import {
  ArrowLeft, ArrowDown, Zap, BarChart3, ShoppingCart, Users, CreditCard,
  Package, Truck, DollarSign, FileText, Calendar, Star, CheckCircle2, Settings,
  ShieldCheck, LayoutDashboard, Smartphone, Globe, Database, Repeat, Bell,
  TrendingUp, Receipt, PieChart, Wallet, ClipboardList, UserCheck, Clock, MapPin,
  ExternalLink
} from 'lucide-react';

/* ─── Module Definitions ─── */
const modules = [
  { id: 'erp', label: 'Mini ERP', icon: BarChart3, color: 'from-primary/20 to-primary/5', accent: 'text-primary', border: 'border-primary/30' },
  { id: 'dropshipping', label: 'Drop-shipping', icon: Package, color: 'from-accent/20 to-accent/5', accent: 'text-accent-foreground', border: 'border-accent-foreground/30' },
  { id: 'marketplace', label: 'Marketplace', icon: Users, color: 'from-secondary/40 to-secondary/10', accent: 'text-secondary-foreground', border: 'border-secondary-foreground/30' },
  { id: 'assinaturas', label: 'Assinaturas', icon: CreditCard, color: 'from-primary/20 to-accent/10', accent: 'text-primary', border: 'border-primary/30' },
];

/* ─── Flow Steps with Navigation Targets ─── */
const erpSteps = [
  { icon: LayoutDashboard, label: 'MEI acessa o Painel', desc: 'Login e visão geral dos KPIs em tempo real', emoji: '📊', navTo: '/mei?tab=dashboard' },
  { icon: Receipt, label: 'Registra Receitas', desc: 'Vendas de produtos e serviços são lançadas automaticamente', emoji: '💵', navTo: '/mei?tab=financial' },
  { icon: ClipboardList, label: 'Lança Despesas', desc: 'Custos operacionais, fornecedores e impostos', emoji: '📝', navTo: '/mei?tab=financial' },
  { icon: Wallet, label: 'Fluxo de Caixa', desc: 'Cálculo automático de entradas vs saídas por período', emoji: '💰', navTo: '/mei?tab=financial' },
  { icon: PieChart, label: 'DRE Simplificado', desc: 'Demonstrativo de resultado gerado automaticamente', emoji: '📈', navTo: '/mei?tab=financial' },
  { icon: Bell, label: 'Alertas Inteligentes', desc: 'Notificações de contas a pagar, estoque baixo e metas', emoji: '🔔', navTo: '/mei?tab=dashboard' },
];

const dropSteps = [
  { icon: Globe, label: 'Fornecedores Cadastrados', desc: 'Base multi-vendor com catálogos sincronizados', emoji: '🏭', navTo: '/mei?tab=stock' },
  { icon: Database, label: 'Catálogo Unificado', desc: 'Produtos de múltiplos fornecedores em um só lugar', emoji: '🔄', navTo: '/mei?tab=stock' },
  { icon: Smartphone, label: 'Cliente Navega e Compra', desc: 'App do cliente com descontos do plano aplicados', emoji: '🛒', navTo: '/client?tab=products' },
  { icon: Repeat, label: 'Ordem Automática', desc: 'Pedido gerado e enviado ao fornecedor em tempo real', emoji: '📤', navTo: '/mei?tab=stock' },
  { icon: Package, label: 'Estoque Verificado', desc: 'Sistema verifica disponibilidade global antes de confirmar', emoji: '📦', navTo: '/mei?tab=stock' },
  { icon: Truck, label: 'Entrega Direta', desc: 'Fulfillment direto do fornecedor ao cliente final', emoji: '🚚', navTo: '/mei?tab=stock' },
  { icon: DollarSign, label: 'Comissão Creditada', desc: 'Margem do MEI calculada e creditada no ERP', emoji: '💳', navTo: '/mei?tab=financial' },
];

const marketSteps = [
  { icon: Settings, label: 'MEI Lista Serviços', desc: 'Cadastra serviços profissionais com preços e disponibilidade', emoji: '⚙️', navTo: '/client?tab=services' },
  { icon: MapPin, label: 'Cliente Busca por Localização', desc: 'Pesquisa serviços próximos com filtros e avaliações', emoji: '📍', navTo: '/client?tab=services' },
  { icon: Calendar, label: 'Agendamento Online', desc: 'Reserva de horário com confirmação automática', emoji: '📅', navTo: '/client?tab=services' },
  { icon: UserCheck, label: 'Check-in Digital', desc: 'Confirmação de presença e início do atendimento', emoji: '✅', navTo: '/client?tab=services' },
  { icon: Star, label: 'Avaliação e Feedback', desc: 'Cliente avalia o serviço e melhora o ranking do MEI', emoji: '⭐', navTo: '/client?tab=services' },
  { icon: TrendingUp, label: 'Analytics de Performance', desc: 'Métricas de atendimento, satisfação e recorrência', emoji: '📊', navTo: '/mei?tab=dashboard' },
];

const subSteps = [
  { icon: Smartphone, label: 'Acessa o App de Benefícios', desc: 'Cliente final baixa o app e cria sua conta', emoji: '📱', navTo: '/client?tab=plans' },
  { icon: CreditCard, label: 'Escolhe um Plano', desc: 'Bronze (5%), Prata (10%) ou Ouro (20%) de desconto', emoji: '📋', navTo: '/client?tab=plans' },
  { icon: ShieldCheck, label: 'Pagamento Recorrente', desc: 'Cobrança mensal automática via gateway de pagamento', emoji: '🔐', navTo: '/client?tab=plans' },
  { icon: ShoppingCart, label: 'Compra com Desconto', desc: 'Descontos aplicados em tempo real em todo o catálogo', emoji: '🏷️', navTo: '/client?tab=products' },
  { icon: FileText, label: 'Cobertura de Serviços', desc: 'Planos Prata e Ouro incluem cobertura de serviços', emoji: '🛡️', navTo: '/client?tab=services' },
  { icon: CheckCircle2, label: 'Renovação e Upgrade', desc: 'Sistema sugere upgrades baseado no uso do cliente', emoji: '🔄', navTo: '/client?tab=plans' },
];

type FlowStepType = typeof erpSteps[0];

const flowData: Record<string, FlowStepType[]> = {
  erp: erpSteps,
  dropshipping: dropSteps,
  marketplace: marketSteps,
  assinaturas: subSteps,
};

/* ─── Animated Pulse Dot (simulates data flowing) ─── */
const PulseConnector = ({ delay }: { delay: number }) => (
  <motion.div
    className="flex flex-col items-center py-1 relative"
    initial={{ opacity: 0, scaleY: 0 }}
    whileInView={{ opacity: 1, scaleY: 1 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.3 }}
  >
    <div className="w-px h-6 bg-border relative overflow-hidden">
      <motion.div
        className="absolute w-2 h-2 rounded-full bg-primary -left-[3px]"
        animate={{ y: [0, 24] }}
        transition={{ duration: 0.8, repeat: Infinity, repeatDelay: 1.5, delay: delay + 0.3, ease: 'easeIn' }}
      />
    </div>
    <ArrowDown className="w-4 h-4 text-primary/60" />
  </motion.div>
);

/* ─── Animated Step Component (Clickable) ─── */
const FlowStep = ({ step, index, total, accentClass, onNavigate }: {
  step: FlowStepType; index: number; total: number; accentClass: string;
  onNavigate: (path: string) => void;
}) => {
  const Icon = step.icon;
  return (
    <motion.div className="flex flex-col items-center w-full">
      <motion.div
        initial={{ opacity: 0, x: index % 2 === 0 ? -60 : 60, scale: 0.8 }}
        whileInView={{ opacity: 1, x: 0, scale: 1 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{
          delay: index * 0.18,
          duration: 0.6,
          type: 'spring',
          stiffness: 80,
          damping: 15,
        }}
        className="w-full"
      >
        <Card
          className="border-border/60 hover:shadow-xl hover:border-primary/40 transition-all duration-300 group overflow-hidden cursor-pointer"
          onClick={() => onNavigate(step.navTo)}
        >
          <CardContent className="p-0">
            <div className="flex items-stretch">
              {/* Step number bar */}
              <motion.div
                className="w-14 shrink-0 bg-primary/10 flex flex-col items-center justify-center gap-1 border-r border-border/50"
                initial={{ scaleX: 0, originX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.18 + 0.1, duration: 0.4 }}
              >
                <span className="text-xl">{step.emoji}</span>
                <span className="text-[10px] font-bold text-muted-foreground">{String(index + 1).padStart(2, '0')}</span>
              </motion.div>

              {/* Content */}
              <div className="flex-1 p-4 flex items-center gap-4">
                <motion.div
                  className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors"
                  initial={{ rotate: -45, opacity: 0 }}
                  whileInView={{ rotate: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.18 + 0.2, duration: 0.5 }}
                >
                  <Icon className={`w-5 h-5 ${accentClass}`} />
                </motion.div>
                <div className="min-w-0 flex-1">
                  <motion.h4
                    className="font-display font-bold text-sm text-foreground"
                    initial={{ opacity: 0, y: 5 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.18 + 0.25, duration: 0.3 }}
                  >
                    {step.label}
                  </motion.h4>
                  <motion.p
                    className="text-xs text-muted-foreground mt-0.5 leading-relaxed"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.18 + 0.35, duration: 0.3 }}
                  >
                    {step.desc}
                  </motion.p>
                </div>
                {/* Navigate indicator */}
                <motion.div
                  className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  whileHover={{ scale: 1.2 }}
                >
                  <ExternalLink className="w-4 h-4 text-primary" />
                </motion.div>
              </div>

              {/* Animated progress bar */}
              <div className="w-2 shrink-0 relative overflow-hidden">
                <motion.div
                  className="absolute inset-0 bg-primary/30"
                  initial={{ scaleY: 0, originY: 0 }}
                  whileInView={{ scaleY: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.18 + 0.1, duration: 0.6 }}
                />
                {/* Flowing light effect */}
                <motion.div
                  className="absolute w-full h-3 bg-primary/60 rounded-full"
                  animate={{ y: ['0%', '100%'], opacity: [0, 1, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 2, delay: index * 0.3 }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Pulse Connector */}
      {index < total - 1 && (
        <PulseConnector delay={index * 0.18 + 0.4} />
      )}
    </motion.div>
  );
};

/* ─── Main Page ─── */
const ProcessFlows = () => {
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState('erp');

  const currentModule = modules.find(m => m.id === activeModule)!;
  const currentSteps = flowData[activeModule];
  const ModuleIcon = currentModule.icon;

  const handleStepNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-bold text-foreground">Vitrinei</span>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">Fluxo de Processos</Badge>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-12 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container mx-auto text-center relative">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Badge variant="secondary" className="mb-4 px-4 py-1.5 text-sm">
              🔄 Experiência Técnica — Clique em um passo para executá-lo
            </Badge>
            <h1 className="font-display text-3xl md:text-5xl font-extrabold text-foreground mb-4 leading-tight tracking-tight">
              Fluxo de Processos<br />
              <span className="text-primary">por Módulo</span>
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              Veja como cada módulo funciona internamente. <strong className="text-foreground">Clique em qualquer etapa</strong> para ir direto à área de execução no sistema.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Module Selector */}
      <section className="sticky top-16 z-40 bg-card/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex gap-2 admin-scroll-area shrink-0 pb-1">
            {modules.map(({ id, label, icon: Icon }) => (
              <motion.button
                key={id}
                onClick={() => setActiveModule(id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all shrink-0 border ${
                  activeModule === id
                    ? 'bg-primary text-primary-foreground border-primary shadow-md'
                    : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted hover:text-foreground'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="w-4 h-4" />
                {label}
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Flow Content */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35 }}
              className="space-y-0"
            >
              {/* Module Header */}
              <motion.div
                className="text-center mb-8"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.4 }}
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${currentModule.color} border ${currentModule.border} flex items-center justify-center mx-auto mb-4`}>
                  <ModuleIcon className={`w-8 h-8 ${currentModule.accent}`} />
                </div>
                <h2 className="font-display text-2xl font-bold text-foreground">{currentModule.label}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {activeModule === 'erp' && 'Gestão financeira completa do microempreendedor'}
                  {activeModule === 'dropshipping' && 'Cadeia de suprimentos do fornecedor ao cliente'}
                  {activeModule === 'marketplace' && 'Marketplace de serviços profissionais'}
                  {activeModule === 'assinaturas' && 'Sistema de assinaturas e benefícios'}
                </p>

                {/* Animated step dots */}
                <div className="flex items-center justify-center gap-2 mt-4">
                  {currentSteps.map((_, i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-primary/30"
                      initial={{ scale: 0 }}
                      animate={{ scale: [1, 1.4, 1] }}
                      transition={{ delay: i * 0.15, duration: 0.6, repeat: Infinity, repeatDelay: currentSteps.length * 0.15 + 2 }}
                    />
                  ))}
                </div>
              </motion.div>

              {/* Steps */}
              <div className="flex flex-col items-center gap-0">
                {currentSteps.map((step, i) => (
                  <FlowStep
                    key={`${activeModule}-${i}`}
                    step={step}
                    index={i}
                    total={currentSteps.length}
                    accentClass={currentModule.accent}
                    onNavigate={handleStepNavigate}
                  />
                ))}
              </div>

              {/* Result Card */}
              <motion.div
                className="mt-6"
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: currentSteps.length * 0.18 + 0.2, duration: 0.6, type: 'spring' }}
              >
                <Card className="border-2 border-primary/30 bg-primary/5">
                  <CardContent className="p-5 text-center">
                    <CheckCircle2 className="w-8 h-8 text-primary mx-auto mb-2" />
                    <h4 className="font-display font-bold text-foreground">
                      {activeModule === 'erp' && 'MEI tem controle financeiro total em tempo real'}
                      {activeModule === 'dropshipping' && 'Venda concluída sem estoque próprio com margem garantida'}
                      {activeModule === 'marketplace' && 'Serviço prestado, avaliado e otimizado automaticamente'}
                      {activeModule === 'assinaturas' && 'Receita recorrente gerada com retenção e upsell inteligente'}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">Resultado final do processo</p>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* Navigation CTAs */}
      <section className="py-12 px-4 border-t border-border">
        <div className="container mx-auto max-w-2xl flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" variant="outline" className="gap-2" onClick={() => navigate('/mei')}>
            <BarChart3 className="w-5 h-5" /> Ver Painel MEI
          </Button>
          <Button size="lg" variant="outline" className="gap-2" onClick={() => navigate('/client')}>
            <ShoppingCart className="w-5 h-5" /> Ver App Cliente
          </Button>
        </div>
      </section>
    </div>
  );
};

export default ProcessFlows;
