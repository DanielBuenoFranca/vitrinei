import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowDown, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const steps = [
  { label: 'Fornecedores cadastrados', emoji: '🏭', color: 'bg-primary/10 border-primary/30 text-primary' },
  { label: 'Catálogo sincronizado', emoji: '🔄', color: 'bg-accent/20 border-accent-foreground/20 text-accent-foreground' },
  { label: 'Cliente compra produto', emoji: '🛒', color: 'bg-muted border-border text-muted-foreground' },
  { label: 'Ordem enviada ao fornecedor', emoji: '📤', color: 'bg-primary/10 border-primary/30 text-primary' },
  { label: 'Entrega direta ao cliente', emoji: '📦', color: 'bg-accent/20 border-accent-foreground/20 text-accent-foreground' },
];

const DropshippingFlowDiagram = () => (
  <Card>
    <CardContent className="p-5 space-y-4">
      <motion.div className="flex items-center gap-2" initial={{ opacity: 0, y: -10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
        <Badge variant="secondary" className="text-xs">Fluxo Drop-shipping</Badge>
        <span className="text-xs text-muted-foreground">Do fornecedor ao cliente final</span>
      </motion.div>

      {/* Desktop */}
      <div className="hidden md:flex items-center gap-2 overflow-x-auto py-2">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2 shrink-0">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * 0.25, duration: 0.5, ease: 'easeOut' }}
              viewport={{ once: true }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium ${s.color}`}
            >
              <span className="text-base">{s.emoji}</span>
              <span>{s.label}</span>
            </motion.div>
            {i < steps.length - 1 && (
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.25 + 0.15, duration: 0.3 }}
                viewport={{ once: true }}
              >
                <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </motion.div>
            )}
          </div>
        ))}
      </div>

      {/* Mobile */}
      <div className="md:hidden flex flex-col items-center gap-1">
        {steps.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.2, duration: 0.4 }}
            viewport={{ once: true }}
            className="flex flex-col items-center w-full"
          >
            <div className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium ${s.color}`}>
              <span className="text-base">{s.emoji}</span>
              <span>{s.label}</span>
            </div>
            {i < steps.length - 1 && <ArrowDown className="w-3.5 h-3.5 text-muted-foreground my-0.5" />}
          </motion.div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export default DropshippingFlowDiagram;
