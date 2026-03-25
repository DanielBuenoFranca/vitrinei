import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowDown } from 'lucide-react';

const steps = [
  { label: 'Receitas registradas', emoji: '💵', color: 'bg-primary/10 border-primary/30 text-primary' },
  { label: 'Despesas lançadas', emoji: '📝', color: 'bg-destructive/10 border-destructive/30 text-destructive' },
  { label: 'Fluxo de caixa calculado', emoji: '📊', color: 'bg-accent/20 border-accent-foreground/20 text-accent-foreground' },
  { label: 'DRE simplificado gerado', emoji: '📈', color: 'bg-primary/10 border-primary/30 text-primary' },
];

const FinancialFlowDiagram = () => (
  <Card>
    <CardContent className="p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-xs">Fluxo Financeiro</Badge>
        <span className="text-xs text-muted-foreground">Ciclo de gestão financeira do MEI</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {steps.map((s, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className={`w-full flex flex-col items-center gap-1 px-3 py-3 rounded-lg border text-xs font-medium text-center ${s.color}`}>
              <span className="text-xl">{s.emoji}</span>
              <span>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <ArrowDown className="w-3.5 h-3.5 text-muted-foreground md:hidden" />
            )}
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export default FinancialFlowDiagram;
