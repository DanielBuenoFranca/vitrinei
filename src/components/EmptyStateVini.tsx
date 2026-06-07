/**
 * EmptyStateVini — friendly empty state with the Vini mascot suggesting
 * what to do when there's no real data yet. Used by ClientApp & MeiPanel
 * during the production rollout to avoid showing simulated data.
 */
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import avatarImg from '@/assets/ai-avatar.png';
import { useNavigate } from 'react-router-dom';

interface Props {
  title: string;
  description: string;
  /** Primary CTA — usually leads to /admin. */
  primaryLabel?: string;
  primaryTo?: string;
  /** Optional Vini prompt — opens the Vini chat with this question pre-filled. */
  viniPrompt?: string;
  /** Optional secondary CTA. */
  secondaryLabel?: string;
  onSecondary?: () => void;
}

export function EmptyStateVini({
  title,
  description,
  primaryLabel = 'Cadastrar agora',
  primaryTo = '/admin',
  viniPrompt,
  secondaryLabel,
  onSecondary,
}: Props) {
  const navigate = useNavigate();

  const askVini = () => {
    if (!viniPrompt) return;
    window.dispatchEvent(new CustomEvent('vini:open', { detail: { prompt: viniPrompt } }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="px-3 py-6"
    >
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-background to-accent/5 overflow-hidden">
        <CardContent className="p-6 flex flex-col items-center text-center gap-4 relative">
          <div className="absolute top-2 right-2 opacity-10">
            <Sparkles className="w-16 h-16 text-primary" />
          </div>
          <div className="relative">
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/40 shadow-lg"
            >
              <img src={avatarImg} alt="Assistente Vini" className="w-full h-full object-cover" />
            </motion.div>
            <span className="absolute -bottom-1 -right-1 text-xs bg-card border border-primary/30 px-1.5 py-0.5 rounded-full font-bold text-primary">Vini</span>
          </div>

          <div className="space-y-1.5 max-w-md">
            <h3 className="font-display text-lg font-bold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full max-w-md pt-2">
            <Button className="flex-1 gap-1.5" onClick={() => navigate(primaryTo)}>
              {primaryLabel} <ArrowRight className="w-4 h-4" />
            </Button>
            {viniPrompt && (
              <Button variant="outline" className="flex-1 gap-1.5" onClick={askVini}>
                <Sparkles className="w-4 h-4 text-primary" /> Pedir ajuda ao Vini
              </Button>
            )}
            {secondaryLabel && onSecondary && (
              <Button variant="ghost" className="flex-1" onClick={onSecondary}>
                {secondaryLabel}
              </Button>
            )}
          </div>

          <p className="text-[10px] text-muted-foreground/70 mt-2">
            ✨ Sistema em produção · sem dados simulados
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
