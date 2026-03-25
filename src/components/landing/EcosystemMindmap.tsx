import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3, ShoppingCart, Users, CreditCard } from 'lucide-react';

const pillars = [
  {
    icon: CreditCard,
    title: 'Matriz de Descontos',
    items: ['Bronze 5%', 'Prata 10%', 'Ouro 20%', 'Aplicação automática'],
  },
  {
    icon: ShoppingCart,
    title: 'Estoque Multi-vendor',
    items: ['Catálogo unificado', 'Sync em tempo real', 'Fulfillment automático'],
  },
  {
    icon: Users,
    title: 'Gestão de Serviços',
    items: ['Marketplace local', 'Agendamento', 'Check-in & avaliações'],
  },
  {
    icon: BarChart3,
    title: 'ERP do MEI',
    items: ['Fluxo de caixa', 'Contas a pagar/receber', 'DRE simplificado'],
  },
];

const EcosystemMindmap = () => (
  <div className="space-y-6">
    <div className="text-center">
      <Badge variant="secondary" className="mb-2">Visão Geral</Badge>
      <h3 className="font-display text-2xl font-bold text-foreground">Mapa do Ecossistema</h3>
      <p className="text-muted-foreground text-sm mt-1">Os 4 pilares que sustentam a plataforma EcoMEI</p>
    </div>

    {/* Center hub */}
    <div className="flex flex-col items-center gap-6">
      <div className="w-20 h-20 rounded-full bg-primary/15 border-2 border-primary flex items-center justify-center">
        <span className="font-display font-extrabold text-primary text-sm">EcoMEI</span>
      </div>

      {/* Branches */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {pillars.map(({ icon: Icon, title, items }) => (
          <Card key={title} className="border-border/50 hover:border-primary/30 transition-all">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <h4 className="font-display font-bold text-sm text-foreground">{title}</h4>
              </div>
              <ul className="space-y-1.5">
                {items.map((item) => (
                  <li key={item} className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  </div>
);

export default EcosystemMindmap;
