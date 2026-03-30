import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play } from 'lucide-react';
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
    color: 'bg-primary/10 border-primary/20',
    badge: 'Multi-visão',
  },
  {
    id: 'jornada',
    title: 'Jornada do Cliente',
    description: 'Desde a escolha do serviço até a validação final: agendamento, acompanhamento do técnico e painel de economia.',
    perspective: 'Visão Cliente',
    steps: 8,
    emoji: '👤',
    route: '/jornada-cliente',
    color: 'bg-accent/10 border-accent/20',
    badge: 'Serviços',
  },
  {
    id: 'mei-manager',
    title: 'Gestor MEI — Acompanhamento',
    description: 'O MEI acompanha a solicitação do cliente, a execução pelo técnico, análise de qualidade e lucro liberado no caixa.',
    perspective: 'Visão MEI Gestor',
    steps: 8,
    emoji: '💼',
    route: '/mei-acompanhamento',
    color: 'bg-green-500/10 border-green-500/20',
    badge: 'Gestão',
  },
  {
    id: 'dropshipping',
    title: 'Dropshipping Global',
    description: 'Cliente explora produtos de fornecedores do mundo inteiro via MEIs locais, compara preços, compra e rastreia entregas.',
    perspective: 'Visão Cliente',
    steps: 6,
    emoji: '🌍',
    route: '/dropshipping',
    color: 'bg-purple-500/10 border-purple-500/20',
    badge: 'Produtos',
  },
  {
    id: 'processos',
    title: 'Fluxos de Processos',
    description: 'Diagramas interativos mostrando o fluxo de dados entre MEI, fornecedores, clientes e a plataforma.',
    perspective: 'Visão Técnica',
    steps: 4,
    emoji: '📊',
    route: '/processos',
    color: 'bg-orange-500/10 border-orange-500/20',
    badge: 'Técnico',
  },
  {
    id: 'central-atendimento',
    title: 'Central de Atendimento',
    description: 'Simulação do fluxo operacional da central: análise por IA, busca de profissionais, cadastro e despacho de chamados.',
    perspective: 'Visão Operacional',
    steps: 6,
    emoji: '🎧',
    route: '/central-atendimento',
    color: 'bg-accent/10 border-accent/20',
    badge: 'Operacional',
  },
];

const DemoPortfolio = () => {
  const navigate = useNavigate();

  return (
    <section id="demos" className="py-20 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4 px-4 py-1.5 text-sm font-medium">📱 Demonstrações Interativas</Badge>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">Veja a plataforma em ação</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Navegue por cada demonstração para entender como o ecossistema funciona na prática — do ponto de vista do Cliente, do MEI e da Plataforma.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {demos.map((demo, i) => (
            <motion.div key={demo.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}>
              <Card className={`border-2 ${demo.color} hover:shadow-lg transition-all duration-300 cursor-pointer group h-full`}
                onClick={() => navigate(demo.route)}>
                <CardContent className="p-5 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-3xl">{demo.emoji}</span>
                    <Badge variant="outline" className="text-[10px]">{demo.badge}</Badge>
                  </div>
                  <h3 className="font-display font-bold text-lg text-foreground mb-2">{demo.title}</h3>
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
    </section>
  );
};

export default DemoPortfolio;
