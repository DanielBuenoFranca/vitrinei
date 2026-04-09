import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, AlertTriangle, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConversion } from '@/contexts/ConversionContext';

export function AttentionFooterBar() {
  const navigate = useNavigate();
  const { showAttentionBar, walletBalance, subscriptionPlan, subscriptionPrice, campaignMessages } = useConversion();

  if (!showAttentionBar) return null;

  const debt = Math.abs(walletBalance ?? 0);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white shadow-[0_-4px_20px_rgba(245,158,11,0.4)]"
      >
        <div className="container mx-auto max-w-5xl px-4 py-2.5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* Left: Warning icon + text */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <AlertTriangle className="w-5 h-5 shrink-0 animate-pulse" />
              <div className="min-w-0">
                <p className="text-xs font-semibold leading-tight truncate">
                  {campaignMessages.attentionBarText}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {subscriptionPlan && (
                    <Badge className="bg-white/20 text-white border-white/30 text-[10px] px-1.5 py-0">
                      Plano {subscriptionPlan}
                    </Badge>
                  )}
                  <span className="text-[10px] opacity-90">
                    Débito: R$ {debt.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: CTA */}
            <Button
              size="sm"
              className="bg-white text-orange-600 hover:bg-white/90 font-bold gap-1.5 shrink-0 shadow-lg"
              onClick={() => navigate('/carteira')}
            >
              <CreditCard className="w-4 h-4" />
              Pagar e Liberar Acesso
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
