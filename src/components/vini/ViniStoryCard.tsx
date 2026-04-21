/* ──────────────────────────────────────────────────────────
   ViniStoryCard — Card lúdico com texto rotativo sobre o Vini
   + CTA "Indique e Ganhe" que entra no fluxo de indicação.
   ────────────────────────────────────────────────────────── */
import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Shuffle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getRandomStory } from '@/lib/viniStories';
import { useState } from 'react';

interface ViniStoryCardProps {
  open: boolean;
  onClose: () => void;
  onReferralClick: () => void;
}

export function ViniStoryCard({ open, onClose, onReferralClick }: ViniStoryCardProps) {
  const [tick, setTick] = useState(0);
  const story = useMemo(() => getRandomStory(), [tick, open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 flex items-center justify-center px-4 bg-background/40 backdrop-blur-sm pointer-events-auto"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 30, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md glass-strong rounded-3xl border border-[hsl(var(--vini-glow)/0.5)] shadow-[0_0_60px_hsl(var(--vini-glow)/0.35)] overflow-hidden"
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/40 hover:bg-background/60 flex items-center justify-center text-foreground/70 hover:text-foreground transition-colors"
              aria-label="Fechar"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-6 sm:p-7">
              <motion.h2
                key={story.title}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="font-display text-xl sm:text-2xl font-bold text-foreground mb-3"
              >
                {story.title}
              </motion.h2>

              <motion.p
                key={story.body}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.05 }}
                className="text-sm sm:text-base text-foreground/85 leading-relaxed mb-5"
              >
                {story.body}
              </motion.p>

              <p className="text-xs sm:text-sm italic text-[hsl(var(--text-accent))] mb-5">
                "{story.ctaHint}"
              </p>

              <div className="flex items-center gap-2">
                <Button
                  onClick={onReferralClick}
                  className="flex-1 gap-2 bg-gradient-to-r from-primary to-accent hover:opacity-90"
                  size="lg"
                >
                  <Gift className="w-4 h-4" />
                  Indicar e Ganhar
                </Button>
                <Button
                  onClick={() => setTick((t) => t + 1)}
                  variant="outline"
                  size="lg"
                  className="gap-2"
                  title="Outra história"
                >
                  <Shuffle className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
