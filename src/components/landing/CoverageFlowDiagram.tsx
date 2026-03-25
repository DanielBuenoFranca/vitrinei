import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowDown, Percent, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

const tiers = [
  {
    name: 'Bronze', emoji: '🥉', discount: '5%',
    coverage: 'Sem cobertura de serviços',
    color: 'bg-amber-700/20 border-amber-700/40', textColor: 'text-amber-700',
  },
  {
    name: 'Prata', emoji: '🥈', discount: '10%',
    coverage: 'Cobertura parcial (até R$ 200/mês)',
    color: 'bg-muted border-muted-foreground/30', textColor: 'text-muted-foreground',
  },
  {
    name: 'Ouro', emoji: '🥇', discount: '20%',
    coverage: 'Cobertura total + prioridade',
    color: 'bg-primary/10 border-primary/40', textColor: 'text-primary',
  },
];

const CoverageFlowDiagram = () => (
  <div className="space-y-6">
    <motion.div className="text-center" initial={{ opacity: 0, y: -15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
      <Badge variant="secondary" className="mb-2">Fluxo de Cobertura</Badge>
      <h3 className="font-display text-2xl font-bold text-foreground">Matriz de Descontos & Cobertura</h3>
      <p className="text-muted-foreground text-sm mt-1">Como os planos escalonam benefícios para o cliente final</p>
    </motion.div>

    <div className="flex flex-col items-center gap-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="px-6 py-3 rounded-xl bg-accent/20 border border-border text-center"
      >
        <p className="font-semibold text-foreground text-sm">Cliente Assina um Plano</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, scaleY: 0 }} whileInView={{ opacity: 1, scaleY: 1 }} viewport={{ once: true }} transition={{ delay: 0.3, duration: 0.3 }}>
        <ArrowDown className="w-5 h-5 text-muted-foreground" />
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
        {tiers.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 40, scale: 0.85 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 + i * 0.25, duration: 0.6, type: 'spring', stiffness: 100 }}
          >
            <Card className={`border-2 ${t.color} transition-all hover:scale-105`}>
              <CardContent className="p-5 text-center space-y-3">
                <span className="text-3xl">{t.emoji}</span>
                <h4 className={`font-display font-bold text-lg ${t.textColor}`}>{t.name}</h4>
                <div className="flex items-center justify-center gap-1.5">
                  <Percent className={`w-4 h-4 ${t.textColor}`} />
                  <span className={`font-bold text-xl ${t.textColor}`}>{t.discount}</span>
                </div>
                <p className="text-xs text-muted-foreground">desconto em produtos</p>
                <div className="pt-2 border-t border-border">
                  <div className="flex items-center justify-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{t.coverage}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, scaleY: 0 }} whileInView={{ opacity: 1, scaleY: 1 }} viewport={{ once: true }} transition={{ delay: 1.3, duration: 0.3 }}>
        <ArrowDown className="w-5 h-5 text-muted-foreground" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 1.5, duration: 0.5 }}
        className="px-6 py-3 rounded-xl bg-primary/10 border border-primary/30 text-center"
      >
        <p className="font-semibold text-primary text-sm">Descontos aplicados em tempo real no catálogo</p>
      </motion.div>
    </div>
  </div>
);

export default CoverageFlowDiagram;
