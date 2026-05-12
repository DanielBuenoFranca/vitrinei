import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Gift, Zap, ShieldCheck, Timer, ArrowRight, Share2, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ReferralRulesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerateLink: () => void;
  rewardBuyer: number;
  rewardSeller: number;
  rewardMixed: number;
}

export function ReferralRulesModal({
  open,
  onOpenChange,
  onGenerateLink,
  rewardBuyer,
  rewardSeller,
  rewardMixed
}: ReferralRulesModalProps) {
  const navigate = useNavigate();

  const rules = [
    {
      icon: Gift,
      title: "Indique amigos",
      desc: `Ganhe R$ ${rewardBuyer.toFixed(2)} por cada novo comprador e R$ ${rewardSeller.toFixed(2)} por cada novo prestador.`,
      color: "text-blue-500",
      bg: "bg-blue-50"
    },
    {
      icon: Zap,
      title: "Bônus Misto",
      desc: `Se o seu indicado for comprador E prestador, você ganha R$ ${rewardMixed.toFixed(2)} no total!`,
      color: "text-amber-500",
      bg: "bg-amber-50"
    },
    {
      icon: Timer,
      title: "Link de 24 Horas",
      desc: "Gere um link especial que dura 24h. O bônus é liberado assim que o indicado fizer a primeira transação.",
      color: "text-green-500",
      bg: "bg-green-50"
    },
    {
      icon: ShieldCheck,
      title: "Processo Seguro",
      desc: "Todo o processo é auditado. Acompanhe o tempo restante e os ganhos na sua carteira.",
      color: "text-purple-500",
      bg: "bg-purple-50"
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-white border-2 border-primary/20 shadow-xl overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary" />
        
        <DialogHeader className="pt-4">
          <DialogTitle className="text-2xl font-bold text-center flex items-center justify-center gap-2">
            <Gift className="w-7 h-7 text-primary animate-bounce" />
            Programa de Indicação
          </DialogTitle>
          <DialogDescription className="text-center text-base mt-2">
            Ganhe dinheiro real ajudando o ecossistema a crescer!
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 py-6">
          {rules.map((rule, idx) => (
            <div key={idx} className="flex items-start gap-4 p-3 rounded-xl border border-border/50 hover:border-primary/30 transition-colors bg-muted/5">
              <div className={`${rule.bg} p-2 rounded-lg shrink-0`}>
                <rule.icon className={`w-5 h-5 ${rule.color}`} />
              </div>
              <div>
                <h4 className="font-bold text-sm text-foreground">{rule.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{rule.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-3">
          <Button 
            onClick={() => {
              onGenerateLink();
              onOpenChange(false);
            }}
            className="w-full h-12 text-base font-bold gap-2 bg-primary hover:bg-primary/90 shadow-lg"
          >
            <Share2 className="w-5 h-5" />
            Gerar Link 24hr e Iniciar
          </Button>
          
          <div className="flex items-center gap-2 w-full">
            <Button 
              variant="outline" 
              onClick={() => navigate('/carteira')}
              className="flex-1 h-10 text-xs gap-1.5"
            >
              <Wallet className="w-4 h-4" />
              Ver Minha Carteira
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => onOpenChange(false)}
              className="flex-1 h-10 text-xs"
            >
              Depois
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
