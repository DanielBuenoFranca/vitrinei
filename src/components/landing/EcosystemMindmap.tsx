import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3, ShoppingCart, Users, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';

const pillars = [
  { icon: CreditCard, title: 'Matriz de Descontos', items: ['Bronze 5%', 'Prata 10%', 'Ouro 20%', 'Aplicação automática'] },
  { icon: ShoppingCart, title: 'Estoque Multi-vendor', items: ['Catálogo unificado', 'Sync em tempo real', 'Fulfillment automático'] },
  { icon: Users, title: 'Gestão de Serviços', items: ['Marketplace local', 'Agendamento', 'Check-in & avaliações'] },
  { icon: BarChart3, title: 'ERP do MEI', items: ['Fluxo de caixa', 'Contas a pagar/receber', 'DRE simplificado'] },
];

const EcosystemMindmap = () => (
  <div className="space-y-6">
    <motion.div className="text-center" initial={{ opacity: 0, y: -15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
      <Badge variant="secondary" className="mb-2">Visão Geral</Badge>
      <h3 className="font-display text-2xl font-bold text-foreground">Mapa do Ecossistema</h3>
      <p className="text-muted-foreground text-sm mt-1">Os 4 pilares que sustentam a plataforma EcoMEI</p>
    </motion.div>

    <div className="flex flex-col items-center gap-6">
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 120 }}
        className="w-20 h-20 rounded-full bg-primary/15 border-2 border-primary flex items-center justify-center"
      >
        <span className="font-display font-extrabold text-primary text-sm">EcoMEI</span>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {pillars.map(({ icon: Icon, title, items }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 + i * 0.2, duration: 0.5, type: 'spring', stiffness: 100 }}
          >
            <Card className="border-border/50 hover:border-primary/30 transition-all h-full">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <motion.div
                    className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"
                    initial={{ rotate: -90 }}
                    whileInView={{ rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6 + i * 0.2, duration: 0.4 }}
                  >
                    <Icon className="w-4 h-4 text-primary" />
                  </motion.div>
                  <h4 className="font-display font-bold text-sm text-foreground">{title}</h4>
                </div>
                <ul className="space-y-1.5">
                  {items.map((item, j) => (
                    <motion.li
                      key={item}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.8 + i * 0.2 + j * 0.1, duration: 0.3 }}
                      className="text-xs text-muted-foreground flex items-center gap-1.5"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                      {item}
                    </motion.li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  </div>
);

export default EcosystemMindmap;
