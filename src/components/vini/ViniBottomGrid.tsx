/* ──────────────────────────────────────────────────────────
   ViniBottomGrid — Grid 2 colunas no canto inferior esquerdo.
   Empilha conforme a regra: itens mais usados embaixo,
   ordem definida via prop.
   ────────────────────────────────────────────────────────── */
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type GridItem = {
  key: string;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  badge?: string | number;
  active?: boolean;
  highlight?: string; // texto pequeno destacado embaixo (ex: "Ganhe R$ 5,00")
};

interface ViniBottomGridProps {
  items: GridItem[]; // ordem visual: index 0 fica em cima-esquerda, depois preenche
}

export function ViniBottomGrid({ items }: ViniBottomGridProps) {
  return (
    <div className="absolute left-3 sm:left-5 bottom-3 sm:bottom-4 z-40 pointer-events-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          'grid grid-cols-2 gap-2 p-2 rounded-2xl',
          'bg-[hsl(var(--background)/0.35)] backdrop-blur-md',
          'border border-[hsl(var(--vini-glow)/0.25)]',
          'shadow-[0_8px_30px_hsl(var(--background)/0.4)]',
        )}
      >
        {items.map((it, i) => (
          <motion.button
            key={it.key}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 + i * 0.04 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            onClick={it.onClick}
            aria-label={it.label}
            className={cn(
              'relative flex flex-col items-center justify-center gap-0.5',
              'w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-xl',
              'bg-[hsl(var(--background)/0.25)] hover:bg-primary/10',
              'border border-[hsl(var(--vini-glow)/0.2)]',
              'transition-colors',
              it.active ? 'text-primary border-primary/60' : 'text-[hsl(var(--text-accent))]',
            )}
          >
            <it.icon className="w-5 h-5" />
            <span className="text-[9px] font-medium leading-tight text-foreground/80">{it.label}</span>
            {it.highlight && (
              <span className="text-[8px] leading-none font-bold text-success-foreground bg-success/80 rounded-full px-1.5 py-0.5 mt-0.5">
                {it.highlight}
              </span>
            )}
            {typeof it.badge !== 'undefined' && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center shadow">
                {it.badge}
              </span>
            )}
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}
