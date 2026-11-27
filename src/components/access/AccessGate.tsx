import { type ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Lock, UserPlus, Mail, AlertTriangle, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { useConversion } from '@/contexts/ConversionContext';
import { SignupModal } from '@/components/access/SignupModal';

/**
 * Re-export access level from ConversionContext for backward compatibility.
 */
export function useAccessLevel() {
  const { accessLevel } = useConversion();
  return accessLevel;
}

/**
 * MaskedPrice: Shows blurred/masked price for visitors AND leads (negative balance).
 * Only active users see real prices.
 */
export function MaskedPrice({ value, className = '' }: { value: number | string; className?: string }) {
  const { accessLevel } = useConversion();
  const [signupOpen, setSignupOpen] = useState(false);
  const navigate = useNavigate();

  if (accessLevel === 'loading') return <span className={`inline-block w-12 h-4 bg-muted animate-pulse rounded ${className}`} />;

  if (accessLevel === 'visitor') {
    return (
      <>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSignupOpen(true);
          }}
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/80 backdrop-blur-sm cursor-pointer hover:bg-muted transition-colors ${className}`}
          title="Cadastre-se para ver os valores"
        >
          <Lock className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground font-medium blur-[4px] select-none">R$ {typeof value === 'number' ? value.toFixed(2) : value}</span>
        </button>
        <SignupModal open={signupOpen} onOpenChange={setSignupOpen} trigger="ver preços" />
      </>
    );
  }

  if (accessLevel === 'lead') {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          toast.warning('Ative sua conta para ver os preços exclusivos!', {
            description: 'Pague sua assinatura para desbloquear todos os valores.',
            action: { label: 'Ativar conta', onClick: () => navigate('/carteira') },
            duration: 6000,
            icon: '🔓',
          });
        }}
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 cursor-pointer hover:bg-amber-500/20 transition-colors ${className}`}
        title="Ative sua conta para ver os valores"
      >
        <Eye className="w-3 h-3 text-amber-600" />
        <span className="text-xs text-amber-700 font-medium blur-[5px] select-none">R$ {typeof value === 'number' ? value.toFixed(2) : value}</span>
      </button>
    );
  }

  // Active: show the real price
  return <span className={className}>R$ {typeof value === 'number' ? value.toFixed(2) : value}</span>;
}

/**
 * ActionGate: Wraps interactive buttons/elements.
 * - Visitor: opens signup modal on click
 * - Lead: shows activation prompt on click
 * - Active: renders children normally
 */
export function ActionGate({ children, action, triggerLabel }: { children: ReactNode; action?: string; triggerLabel?: string }) {
  const { accessLevel } = useConversion();
  const navigate = useNavigate();
  const [signupOpen, setSignupOpen] = useState(false);

  if (accessLevel === 'active' || accessLevel === 'loading') return <>{children}</>;

  const handleBlock = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (accessLevel === 'visitor') {
      setSignupOpen(true);
    } else {
      // lead
      toast.warning('Ative sua conta para usar esta funcionalidade', {
        description: 'Pague sua assinatura para desbloquear todos os recursos do seu perfil.',
        action: { label: 'Ir para Carteira', onClick: () => navigate('/carteira') },
        duration: 8000,
        icon: '🔒',
      });
    }
  };

  return (
    <>
      <div className="relative cursor-not-allowed" onClick={handleBlock}>
        <div className="pointer-events-none opacity-60">
          {children}
        </div>
      </div>
      <SignupModal open={signupOpen} onOpenChange={setSignupOpen} trigger={triggerLabel || action} />
    </>
  );
}

/**
 * AccessBanner: Persistent banner shown to leads (negative balance) or visitors.
 */
export function AccessBanner() {
  return null;
}
