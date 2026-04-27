import { motion, AnimatePresence } from 'framer-motion';
import { Radar, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RadarPulseProps {
  active: boolean;
  city?: string | null;
  itemCount?: number;
}

/**
 * Lightweight radar overlay — concentric pulsing rings + sweep arc.
 * Pure CSS/SVG, mobile-friendly, renders only when `active`.
 * Used by ViniHome when "Urgência" mode is engaged.
 */
export function RadarPulse({ active, city, itemCount = 0 }: RadarPulseProps) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="radar-pulse"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
          aria-hidden="true"
        >
          {/* Pulsing rings */}
          <div className="relative w-[min(80vw,520px)] h-[min(80vw,520px)]">
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full border border-primary/40"
                initial={{ scale: 0.2, opacity: 0.8 }}
                animate={{ scale: 1, opacity: 0 }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.75,
                  ease: 'easeOut',
                }}
                style={{ boxShadow: '0 0 24px hsl(var(--primary) / 0.25) inset' }}
              />
            ))}

            {/* Sweep arc */}
            <motion.div
              className="absolute inset-0 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
              style={{
                background:
                  'conic-gradient(from 0deg, transparent 0deg, hsl(var(--primary) / 0.18) 60deg, transparent 90deg)',
                maskImage: 'radial-gradient(circle, transparent 30%, black 31%)',
                WebkitMaskImage: 'radial-gradient(circle, transparent 30%, black 31%)',
              }}
            />

            {/* Cross hairs */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-primary/15" />
            <div className="absolute top-1/2 left-0 right-0 h-px bg-primary/15" />

            {/* Floating "pins" representing nearby providers */}
            {[
              { top: '22%', left: '34%', delay: 0.8 },
              { top: '64%', left: '70%', delay: 1.4 },
              { top: '70%', left: '28%', delay: 2.0 },
            ].map((pin, i) => (
              <motion.div
                key={i}
                className="absolute"
                style={{ top: pin.top, left: pin.left }}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: pin.delay, type: 'spring', stiffness: 320, damping: 18 }}
              >
                <div className="relative">
                  <span className="absolute inset-0 rounded-full bg-accent/50 animate-ping" />
                  <MapPin
                    className="relative w-4 h-4 text-accent drop-shadow-[0_0_6px_hsl(var(--accent)/0.7)]"
                    fill="currentColor"
                  />
                </div>
              </motion.div>
            ))}

            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <div
                className={cn(
                  'rounded-2xl px-3 py-1.5',
                  'bg-background/40 backdrop-blur-md border border-primary/30',
                  'shadow-[0_0_20px_hsl(var(--primary)/0.3)]',
                )}
              >
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary">
                  <Radar className="w-3 h-3 animate-pulse" />
                  Radar ativo
                </div>
                {city && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">📍 {city}</p>
                )}
                {itemCount > 0 && (
                  <p className="text-[10px] text-foreground mt-0.5">
                    {itemCount} {itemCount === 1 ? 'item' : 'itens'} no carrinho
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
