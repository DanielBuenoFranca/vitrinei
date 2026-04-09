import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Sparkles, Gift, Shield, Star, Zap, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useConversion } from '@/contexts/ConversionContext';

interface SignupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: string; // what triggered the modal
}

export function SignupModal({ open, onOpenChange, trigger }: SignupModalProps) {
  const navigate = useNavigate();
  const { campaignMessages } = useConversion();

  const handleSignup = () => {
    onOpenChange(false);
    navigate('/auth');
  };

  const benefits = campaignMessages.signupBenefits.length > 0
    ? campaignMessages.signupBenefits
    : [
      'Veja preços exclusivos de todos os prestadores',
      'Contrate serviços com cashback garantido',
      'Acesse contatos e localizações de profissionais',
      'Programa de indicação com bônus em dinheiro',
      'Carteira digital com créditos e promoções',
    ];

  const icons = [Star, Gift, Shield, Sparkles, Zap];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        {/* Hero gradient header */}
        <div className="bg-gradient-to-br from-primary via-primary/90 to-accent/80 px-6 pt-8 pb-6 text-primary-foreground text-center">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }}>
            <div className="w-16 h-16 rounded-2xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-3">
              <Zap className="w-8 h-8" />
            </div>
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-xl font-bold text-primary-foreground">
                {campaignMessages.signupModalTitle}
              </DialogTitle>
              <DialogDescription className="text-primary-foreground/80 text-sm">
                {campaignMessages.signupModalSubtitle}
              </DialogDescription>
            </DialogHeader>
          </motion.div>
        </div>

        {/* Benefits list */}
        <div className="px-6 py-5 space-y-3">
          {trigger && (
            <Badge variant="secondary" className="text-xs mb-2">
              Para {trigger}
            </Badge>
          )}

          <ul className="space-y-2.5">
            {benefits.map((benefit, i) => {
              const Icon = icons[i % icons.length];
              return (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * i }}
                  className="flex items-start gap-2.5"
                >
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-sm text-foreground">{benefit}</span>
                </motion.li>
              );
            })}
          </ul>

          <div className="pt-3 space-y-2">
            <Button className="w-full gap-2 text-base py-5" onClick={handleSignup}>
              Criar conta grátis <ArrowRight className="w-4 h-4" />
            </Button>
            <p className="text-center text-[11px] text-muted-foreground">
              Já tem conta? <button onClick={handleSignup} className="text-primary font-medium hover:underline">Faça login</button>
            </p>
          </div>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-3 pt-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> 12.800+ serviços</span>
            <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-amber-400 text-amber-400" /> 4.8 avaliação</span>
            <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-blue-500" /> 100% seguro</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
