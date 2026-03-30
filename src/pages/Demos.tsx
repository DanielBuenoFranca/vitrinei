import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, Play, Monitor, GitBranch } from 'lucide-react';
import { motion } from 'framer-motion';

const demos = [
  {
    id: 'gestao',
    title: 'Gestão de Chamados',
    description: 'Ciclo completo: notificação, despacho de técnico, rastreio em tempo real, validação por código e liberação de pagamento.',
    perspective: 'MEI + Cliente + Técnico + Plataforma',
    steps: 8,
    emoji: '🔧',
    route: '/gestao',
    badge: 'Multi-visão',
    category: 'fluxo',
  },
  {
    id: 'jornada',
    title: 'Jornada do Cliente',
    description: 'Desde a escolha do serviço até a validação final: agendamento, acompanhamento do técnico e painel de economia.',
    perspective: 'Visão Cliente',
    steps: 8,
    emoji: '👤',
    route: '/jornada-cliente',
    badge: 'Serviços',
    category: 'fluxo',
  },
  {
    id: 'mei-manager',
    title: 'Gestor MEI — Acompanhamento',
    description: 'O MEI acompanha a solicitação do cliente, a execução pelo técnico, análise de qualidade e lucro liberado no caixa.',
    perspective: 'Visão MEI Gestor',
    steps: 8,
    emoji: '💼',
    route: '/mei-acompanhamento',
    badge: 'Gestão',
    category: 'fluxo',
  },
  {
    id: 'dropshipping',
    title: 'Dropshipping Global',
    description: 'Cliente explora produtos de fornecedores do mundo inteiro via MEIs locais, compara preços, compra e rastreia entregas.',
    perspective: 'Visão Cliente',
    steps: 6,
    emoji: '🌍',
    route: '/dropshipping',
    badge: 'Produtos',
    category: 'fluxo',
  },
  {
    id: 'processos',
    title: 'Fluxos de Processos',
    description: 'Diagramas interativos mostrando o fluxo de dados entre MEI, fornecedores, clientes e a plataforma.',
    perspective: 'Visão Técnica',
    steps: 4,
    emoji: '📊',
    route: '/processos',
    badge: 'Técnico',
    category: 'diagrama',
  },
  {
    id: 'client-app',
    title: 'App do Cliente',
    description: 'Interface completa do aplicativo do cliente: busca de serviços, agendamento, chat com profissionais e histórico.',
    perspective: 'Visão Cliente',
    steps: 5,
    emoji: '📱',
    route: '/client',
    badge: 'App',
    category: 'fluxo',
  },
  {
    id: 'mei-panel',
    title: 'Painel MEI',
    description: 'Dashboard completo do MEI: gestão financeira, agenda, clientes, produtos e métricas de desempenho.',
    perspective: 'Visão MEI',
    steps: 6,
    emoji: '📈',
    route: '/mei',
    badge: 'Dashboard',
    category: 'fluxo',
  },
  {
    id: 'central-atendimento',
    title: 'Central de Atendimento',
    description: 'Simulação do fluxo operacional da central: análise por IA, busca de profissionais, cadastro e despacho de chamados.',
    perspective: 'Visão Operacional',
    steps: 6,
    emoji: '🎧',
    route: '/central-atendimento',
    badge: 'Operacional',
    category: 'fluxo',
  },
];

const categoryLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  fluxo: { label: 'Demonstrações Interativas', icon: <Monitor className="w-5 h-5" /> },
  diagrama: { label: 'Diagramas & Fluxos Técnicos', icon: <GitBranch className="w-5 h-5" /> },
};

const Demos = () => {
  const navigate = useNavigate();

  const grouped = demos.reduce((acc, demo) => {
    if (!acc[demo.category]) acc[demo.category] = [];
    acc[demo.category].push(demo);
    return acc;
  }, {} as Record<string, typeof demos>);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Button>
          <h1 className="font-display font-bold text-lg text-foreground">Demonstrações</h1>
          <div className="w-20" />
        </div>
      </nav>

      <div className="container mx-auto px-4 py-10 max-w-5xl">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 px-4 py-1.5 text-sm font-medium">📱 Centro de Demonstrações</Badge>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            Veja a plataforma em ação
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Todas as demonstrações interativas, vídeos e diagramas de funcionamento reunidos em um só lugar.
          </p>
        </motion.div>

        {/* Grouped demos */}
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                {categoryLabels[category]?.icon}
              </div>
              <h3 className="font-display font-bold text-xl text-foreground">
                {categoryLabels[category]?.label || category}
              </h3>
              <Badge variant="outline" className="ml-2 text-xs">{items.length}</Badge>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {items.map((demo, i) => (
                <motion.div
                  key={demo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Card
                    className="border-2 border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300 cursor-pointer group h-full"
                    onClick={() => navigate(demo.route)}
                  >
                    <CardContent className="p-5 flex flex-col h-full">
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-3xl">{demo.emoji}</span>
                        <Badge variant="outline" className="text-[10px]">{demo.badge}</Badge>
                      </div>
                      <h4 className="font-display font-bold text-lg text-foreground mb-2">{demo.title}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed flex-1">{demo.description}</p>
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-[9px]">{demo.steps} etapas</Badge>
                          <span className="text-[10px] text-muted-foreground">{demo.perspective}</span>
                        </div>
                        <div className="flex items-center gap-1 text-primary text-xs font-medium group-hover:gap-2 transition-all">
                          <Play className="w-3 h-3" /> Ver
                          <ArrowRight className="w-3 h-3" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Demos;
