import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowDown, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const steps = [
  { label: 'Receitas registradas', emoji: '💵', color: 'bg-primary/10 border-primary/30 text-primary' },
  { label: 'Despesas lançadas', emoji: '📝', color: 'bg-destructive/10 border-destructive/30 text-destructive' },
  { label: 'Fluxo de caixa calculado', emoji: '📊', color: 'bg-accent/20 border-accent-foreground/20 text-accent-foreground' },
  { label: 'DRE simplificado gerado', emoji: '📈', color: 'bg-primary/10 border-primary/30 text-primary' },
];

const FinancialFlowDiagram = () => (
  <Card>
    <CardContent className="p-5 space-y-4">
      <motion.div className="flex items-center gap-2" initial={{ opacity: 0, y: -10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <Badge variant="secondary" className="text-xs">Fluxo Financeiro</Badge>
        <span className="text-xs text-muted-foreground">Ciclo de gestão financeira do MEI</span>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {steps.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30, scale: 0.85 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: i * 0.3, duration: 0.5, type: 'spring', stiffness: 120 }}
            viewport={{ once: true }}
            className="flex flex-col items-center gap-1"
          >
            <div className={`w-full flex flex-col items-center gap-1 px-3 py-3 rounded-lg border text-xs font-medium text-center ${s.color}`}>
              <span className="text-xl">{s.emoji}</span>
              <span>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: i * 0.3 + 0.2 }}
                viewport={{ once: true }}
              >
                <ArrowDown className="w-3.5 h-3.5 text-muted-foreground md:hidden" />
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground hidden md:block" />
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export default FinancialFlowDiagram;
