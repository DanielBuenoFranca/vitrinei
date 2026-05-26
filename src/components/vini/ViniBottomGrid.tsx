/* ──────────────────────────────────────────────────────────
   ViniBottomGrid — Botões compactos empilhados a esquerda
   inferior, encostados, sem fundo fosco. Glass holográfico
   por botão (ultra-transparente, borda neon 0.5px).
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
  highlight?: string;
  iconClassName?: string;
};

interface ViniBottomGridProps {
  items: GridItem[];
}

export function ViniBottomGrid({ items }: ViniBottomGridProps) {
  return (
    <div className="absolute left-2 sm:left-3 bottom-2 sm:bottom-3 z-40 pointer-events-auto">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        // Sem fundo fosco no contêiner, somente um grid
        className="grid grid-cols-2 gap-1.5"
      >
        {items.map((it, i) => (
          <motion.button
            key={it.key}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.04 + i * 0.04 }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={it.onClick}
            aria-label={it.label}
            className={cn(
              'relative flex flex-col items-center justify-center gap-0.5',
              'w-[60px] h-[60px] sm:w-[58px] sm:h-[58px] rounded-xl',
              // ultra-transparente + blur
              'bg-white/[0.08] backdrop-blur-xl',
              'border-[0.5px] border-[hsl(var(--vini-glow)/0.45)]',
              'shadow-[0_0_14px_hsl(var(--vini-glow)/0.15),inset_0_0_10px_hsl(var(--primary)/0.05)]',
              'hover:bg-white/[0.14] hover:border-[hsl(var(--vini-glow)/0.8)]',
              'transition-all duration-200',
              it.active ? 'text-primary border-primary/70' : 'text-foreground/85',
            )}
          >
            <it.icon className={cn('w-[18px] h-[18px]', it.iconClassName)} strokeWidth={1.25} />
            <span className="text-[8.5px] font-medium leading-tight text-foreground/85 px-0.5 text-center">
              {it.label}
            </span>
            {it.highlight && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[7.5px] leading-none font-bold text-success-foreground bg-success/85 rounded-full px-1.5 py-[2px] whitespace-nowrap shadow">
                {it.highlight}
              </span>
            )}
            {typeof it.badge !== 'undefined' && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-destructive text-destructive-foreground text-[8.5px] font-bold flex items-center justify-center shadow">
                {it.badge}
              </span>
            )}
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}
