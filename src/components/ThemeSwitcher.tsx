import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

export const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();
  const isEspacial = theme === 'espacial';

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isEspacial ? 'comercial' : 'espacial')}
      className="relative h-11 w-11 rounded-full overflow-hidden"
      title={isEspacial ? 'Mudar para tema Comercial' : 'Mudar para tema Espacial'}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isEspacial ? (
          <motion.div
            key="espacial"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute"
          >
            <Moon className="w-4 h-4" />
          </motion.div>
        ) : (
          <motion.div
            key="comercial"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute"
          >
            <Sun className="w-4 h-4" />
          </motion.div>
        )}
      </AnimatePresence>
    </Button>
  );
};
