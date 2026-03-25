import { Badge } from '@/components/ui/badge';
import { ArrowRight, ArrowDown } from 'lucide-react';

const actors = [
  { label: 'Cliente Final', icon: '👤' },
  { label: 'App Frontend', icon: '📱' },
  { label: 'Mini ERP', icon: '📊' },
  { label: 'Drop-shipping', icon: '📦' },
  { label: 'Fornecedor', icon: '🏭' },
];

const steps = [
  { from: 0, to: 1, label: 'Escolhe produto/serviço', color: 'bg-primary/10 text-primary' },
  { from: 1, to: 2, label: 'Gera pedido com desconto do plano', color: 'bg-accent/20 text-accent-foreground' },
  { from: 2, to: 3, label: 'Verifica estoque global', color: 'bg-muted text-muted-foreground' },
  { from: 3, to: 4, label: 'Envia ordem de fulfillment', color: 'bg-primary/10 text-primary' },
  { from: 4, to: 0, label: 'Entrega ao cliente final', color: 'bg-accent/20 text-accent-foreground' },
];

const TransactionSequenceDiagram = () => (
  <div className="space-y-6">
    <div className="text-center">
      <Badge variant="secondary" className="mb-2">Fluxo de Transação</Badge>
      <h3 className="font-display text-2xl font-bold text-foreground">Sequência de Pedido</h3>
      <p className="text-muted-foreground text-sm mt-1">Do clique do cliente até a entrega pelo fornecedor</p>
    </div>

    {/* Desktop horizontal */}
    <div className="hidden md:block">
      {/* Actor row */}
      <div className="grid grid-cols-5 gap-2 mb-6">
        {actors.map((a) => (
          <div key={a.label} className="text-center px-2 py-3 rounded-xl bg-card border border-border">
            <span className="text-2xl block mb-1">{a.icon}</span>
            <span className="text-xs font-semibold text-foreground">{a.label}</span>
          </div>
        ))}
      </div>
      {/* Steps */}
      <div className="space-y-3">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted-foreground w-6">{i + 1}.</span>
            <div className={`flex-1 flex items-center gap-2 px-4 py-2.5 rounded-lg ${s.color} text-sm font-medium`}>
              <span>{actors[s.from].icon}</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
              <span>{actors[s.to].icon}</span>
              <span className="ml-2">{s.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Mobile vertical */}
    <div className="md:hidden space-y-3">
      {steps.map((s, i) => (
        <div key={i} className="flex flex-col items-center">
          <div className={`w-full flex items-center gap-2 px-4 py-3 rounded-lg ${s.color} text-sm font-medium`}>
            <span className="font-bold">{i + 1}.</span>
            <span>{actors[s.from].icon} → {actors[s.to].icon}</span>
            <span className="ml-1">{s.label}</span>
          </div>
          {i < steps.length - 1 && <ArrowDown className="w-4 h-4 text-muted-foreground my-1" />}
        </div>
      ))}
    </div>
  </div>
);

export default TransactionSequenceDiagram;
