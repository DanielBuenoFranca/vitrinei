/* ──────────────────────────────────────────────────────────
   ViniSideButtons — Stack vertical à direita (Pesquisa,
   Conversar, Miniatura Vini). Glass ultra-transparente,
   bordas neon finas, ícones lineares minimalistas.
   ────────────────────────────────────────────────────────── */
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MessageCircle } from 'lucide-react';
import viniMini from '@/assets/vini-avatar.png';
import { cn } from '@/lib/utils';

interface ViniSideButtonsProps {
  open: boolean;
  onSearch: () => void;
  onConverse: () => void;
  onStory: () => void;
}

export function ViniSideButtons({ open, onSearch, onConverse, onStory }: ViniSideButtonsProps) {
  const items = [
    {
      key: 'search',
      content: <Search className="w-4 h-4" strokeWidth={1.25} />,
      label: 'Pesquisar',
      onClick: onSearch,
    },
    {
      key: 'chat',
      content: <MessageCircle className="w-4 h-4" strokeWidth={1.25} />,
      label: 'Conversar',
      onClick: onConverse,
    },
    {
      key: 'story',
      content: (
        // Apenas a CABEÇA do Vini — zoom forte com foco no topo
        <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center">
          <img
            src={viniMini}
            alt="Vini"
            className="w-[280%] h-[280%] object-cover drop-shadow-[0_0_4px_hsl(var(--vini-glow)/0.7)]"
            style={{ objectPosition: '50% 8%' }}
          />
        </div>
      ),
      label: 'Sobre o Vini',
      onClick: onStory,
    },
  ];

  return (
    <div className="absolute top-1/2 -translate-y-1/2 right-2 sm:right-3 z-40 pointer-events-none">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-2 pointer-events-auto"
          >
            {items.map((it, i) => (
              <motion.button
                key={it.key}
                initial={{ opacity: 0, x: 16, scale: 0.7 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 16, scale: 0.7 }}
                transition={{ delay: 0.04 + i * 0.06, duration: 0.28 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.92 }}
                onClick={it.onClick}
                aria-label={it.label}
                title={it.label}
                className={cn(
                  'w-11 h-11 rounded-full flex items-center justify-center',
                  // ultra-transparente (~10%)
                  'bg-white/[0.08] backdrop-blur-xl',
                  // borda neon fina (0.5px)
                  'border-[0.5px] border-[hsl(var(--vini-glow)/0.55)]',
                  'text-foreground/85 hover:text-primary',
                  // sombra holográfica cyan/magenta sutil
                  'shadow-[0_0_18px_hsl(var(--vini-glow)/0.18),inset_0_0_12px_hsl(var(--primary)/0.06)]',
                  'hover:bg-white/[0.14] hover:border-[hsl(var(--vini-glow)/0.85)]',
                  'transition-all duration-200',
                )}
              >
                {it.content}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
