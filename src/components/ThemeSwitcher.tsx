import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Palette } from 'lucide-react';
import { useTheme, themes, type ThemeId } from '@/contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const themePreviewColors: Record<ThemeId, { bg: string; accent: string; text: string }> = {
  standard: { bg: 'bg-[hsl(210,20%,98%)]', accent: 'bg-[hsl(200,80%,35%)]', text: 'text-[hsl(220,30%,12%)]' },
  'tech-dark': { bg: 'bg-[hsl(220,25%,8%)]', accent: 'bg-[hsl(160,100%,45%)]', text: 'text-[hsl(160,100%,45%)]' },
  fastfood: { bg: 'bg-[hsl(40,100%,97%)]', accent: 'bg-[hsl(0,85%,50%)]', text: 'text-[hsl(25,90%,30%)]' },
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
              className="absolute right-0 top-full mt-2 z-50 bg-card border border-border rounded-xl shadow-2xl p-3 min-w-[260px]"
            >
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                Escolha o Tema
              </p>
              <div className="space-y-1.5">
                {themes.map((t) => {
                  const colors = themePreviewColors[t.id];
                  const isActive = theme === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => { setTheme(t.id); setOpen(false); }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-left",
                        isActive
                          ? "bg-primary/10 ring-2 ring-primary"
                          : "hover:bg-muted"
                      )}
                    >
                      <div className="flex gap-1">
                        <div className={cn("w-5 h-5 rounded-full border border-border", colors.bg)} />
                        <div className={cn("w-5 h-5 rounded-full", colors.accent)} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{t.icon}</span>
                          <span className="text-sm font-semibold text-foreground">{t.label}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{t.description}</span>
                      </div>
                      {isActive && (
                        <span className="text-xs font-bold text-primary">✓</span>
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
