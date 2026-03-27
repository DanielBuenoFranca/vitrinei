import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Palette } from 'lucide-react';
import { useTheme, themes, type ThemeId } from '@/contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const themePreviewColors: Record<ThemeId, { bg: string; accent: string; text: string; style: string }> = {
  standard: {
    bg: 'bg-[hsl(210,20%,98%)]',
    accent: 'bg-[hsl(200,80%,35%)]',
    text: 'text-[hsl(220,30%,12%)]',
    style: 'rounded-full',
  },
  'tech-dark': {
    bg: 'bg-[hsl(220,25%,6%)]',
    accent: 'bg-[hsl(160,100%,45%)]',
    text: 'text-[hsl(160,100%,45%)]',
    style: 'rounded-sm',
  },
  fastfood: {
    bg: 'bg-[hsl(40,60%,97%)]',
    accent: 'bg-[hsl(12,90%,55%)]',
    text: 'text-[hsl(25,60%,18%)]',
    style: 'rounded-xl',
  },
};

export const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        className="relative h-9 w-9"
        title="Escolher Tema"
      >
        <Palette className="w-4 h-4" />
      </Button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 z-50 bg-card border border-border rounded-xl shadow-2xl p-4 min-w-[300px]"
            >
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
                🎨 Escolha a Experiência
              </p>
              <div className="space-y-2">
                {themes.map((t) => {
                  const colors = themePreviewColors[t.id];
                  const isActive = theme === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => { setTheme(t.id); setOpen(false); }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all text-left group",
                        isActive
                          ? "bg-primary/10 ring-2 ring-primary"
                          : "hover:bg-muted"
                      )}
                    >
                      {/* Mini preview */}
                      <div className={cn("w-12 h-10 flex items-center justify-center border border-border overflow-hidden", colors.bg, colors.style)}>
                        <div className="flex gap-0.5">
                          <div className={cn("w-3 h-1.5", colors.accent, colors.style)} />
                          <div className={cn("w-2 h-1.5 opacity-50", colors.accent, colors.style)} />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{t.icon}</span>
                          <span className="text-sm font-bold text-foreground">{t.label}</span>
                        </div>
                        <span className="text-xs text-muted-foreground line-clamp-1">{t.description}</span>
                      </div>
                      {isActive && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full"
                        >
                          ✓
                        </motion.span>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
