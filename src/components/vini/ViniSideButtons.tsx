/* ──────────────────────────────────────────────────────────
   ViniSideButtons — 3 círculos translúcidos na borda direita
   Aparecem ao clicar no avatar. Estilo glass profundo,
   inspirado no mockup enviado pelo cliente.
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
    { key: 'search', icon: <Search className="w-5 h-5" />, label: 'Pesquisar', onClick: onSearch },
    { key: 'chat', icon: <MessageCircle className="w-5 h-5" />, label: 'Conversar', onClick: onConverse },
    {
      key: 'story',
      icon: (
        <img
          src={viniMini}
          alt="Vini"
          className="w-9 h-9 object-contain drop-shadow-[0_0_6px_hsl(var(--vini-glow)/0.6)]"
        />
      ),
      label: 'Sobre o Vini',
      onClick: onStory,
    },
  ];

  return (
    <div className="absolute top-1/2 -translate-y-1/2 right-3 sm:right-5 z-40 pointer-events-none">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-3 pointer-events-auto"
          >
            {items.map((it, i) => (
              <motion.button
                key={it.key}
                initial={{ opacity: 0, x: 20, scale: 0.7 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.7 }}
                transition={{ delay: 0.05 + i * 0.07, duration: 0.3 }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={it.onClick}
                aria-label={it.label}
                title={it.label}
                className={cn(
                  'w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center',
                  'bg-[hsl(var(--background)/0.25)] backdrop-blur-md',
                  'border border-[hsl(var(--vini-glow)/0.45)]',
                  'text-[hsl(var(--text-accent))] hover:text-primary',
                  'shadow-[0_4px_20px_hsl(var(--vini-glow)/0.25)]',
                  'transition-colors',
                )}
              >
                {it.icon}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
