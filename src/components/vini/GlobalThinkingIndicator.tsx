import { motion, AnimatePresence } from 'framer-motion';
import { useAiSession } from '@/contexts/AiSessionContext';

export const GlobalThinkingIndicator = () => {
  const { isThinking } = useAiSession();

  return (
    <AnimatePresence>
      {isThinking && (
        <motion.div
          initial={{ opacity: 0, x: 20, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 10, scale: 0.9 }}
          className="fixed bottom-6 right-6 z-[9999] pointer-events-none"
        >
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    opacity: [0.3, 1, 0.3],
                    scale: [0.8, 1, 0.8]
                  }}
                  transition={{ 
                    duration: 1.2, 
                    repeat: Infinity, 
                    delay: i * 0.2,
                    ease: "easeInOut"
                  }}
                  className="w-1 h-1 rounded-full bg-primary"
                />
              ))}
            </div>
            <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/90">
              Processando
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
