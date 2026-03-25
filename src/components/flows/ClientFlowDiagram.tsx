import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowDown } from 'lucide-react';
import { motion } from 'framer-motion';

const steps = [
  { label: 'Escolha de Plano', desc: 'Bronze, Prata ou Ouro', emoji: '📋', color: 'bg-primary/10 border-primary/30 text-primary' },
  { label: 'Desconto Ativado', desc: 'Aplicado automaticamente', emoji: '🏷️', color: 'bg-accent/20 border-accent-foreground/20 text-accent-foreground' },
  { label: 'Navega Catálogo', desc: 'Produtos e serviços com desconto', emoji: '🛒', color: 'bg-muted border-border text-muted-foreground' },
  { label: 'Pedido ou Agendamento', desc: 'Compra ou reserva de serviço', emoji: '✅', color: 'bg-primary/10 border-primary/30 text-primary' },
];

const ClientFlowDiagram = () => (
  <Card className="border-border/50">
    <CardContent className="p-4 space-y-3">
      <motion.div className="flex items-center gap-2" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
        <Badge variant="secondary" className="text-xs">Jornada do Cliente</Badge>
      </motion.div>

      <div className="flex flex-col items-center gap-1">
        {steps.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20, scale: 0.95 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ delay: i * 0.3, duration: 0.5, ease: 'easeOut' }}
            viewport={{ once: true }}
            className="flex flex-col items-center w-full"
          >
            <div className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-xs font-medium ${s.color}`}>
              <span className="text-lg">{s.emoji}</span>
              <div>
                <span className="block font-semibold">{s.label}</span>
                <span className="block font-normal opacity-70">{s.desc}</span>
              </div>
            </div>
            {i < steps.length - 1 && (
              <motion.div
                initial={{ opacity: 0, scaleY: 0 }}
                whileInView={{ opacity: 1, scaleY: 1 }}
                transition={{ delay: i * 0.3 + 0.2, duration: 0.3 }}
                viewport={{ once: true }}
              >
                <ArrowDown className="w-3.5 h-3.5 text-muted-foreground my-0.5" />
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export default ClientFlowDiagram;
