import { type ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Lock, UserPlus, Mail, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

/**
 * Determines user access level:
 * - 'visitor': not logged in
 * - 'lead': logged in but email not confirmed
 * - 'active': logged in and confirmed
 */
export function useAccessLevel() {
  const { user, loading } = useAuth();

  if (loading) return 'loading' as const;
  if (!user) return 'visitor' as const;

  // Check if email is confirmed
  const confirmed = !!user.email_confirmed_at;
  return confirmed ? ('active' as const) : ('lead' as const);
}

/**
 * MaskedPrice: Shows blurred/masked price for visitors, normal for logged users.
 * Leads see the price but in read-only context.
 */
export function MaskedPrice({ value, className = '' }: { value: number | string; className?: string }) {
  const level = useAccessLevel();
  const navigate = useNavigate();

  if (level === 'loading') return <span className={`inline-block w-12 h-4 bg-muted animate-pulse rounded ${className}`} />;

  if (level === 'visitor') {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          toast.info('Crie sua conta para ver os preços e aproveitar ofertas exclusivas!', {
            action: { label: 'Cadastrar', onClick: () => navigate('/auth') },
            duration: 5000,
          });
        }}
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/80 backdrop-blur-sm cursor-pointer hover:bg-muted transition-colors ${className}`}
        title="Faça cadastro para ver os valores"
      >
        <Lock className="w-3 h-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground font-medium blur-[4px] select-none">R$ {typeof value === 'number' ? value.toFixed(2) : value}</span>
      </button>
    );
  }

  // Lead or active: show the real price
  return <span className={className}>R$ {typeof value === 'number' ? value.toFixed(2) : value}</span>;
}

/**
 * ActionGate: Wraps interactive buttons/elements.
 * - Visitor: shows login prompt on click
 * - Lead: shows activation prompt on click
 * - Active: renders children normally
 */
export function ActionGate({ children, action }: { children: ReactNode; action?: string }) {
  const level = useAccessLevel();
  const navigate = useNavigate();

  if (level === 'active' || level === 'loading') return <>{children}</>;

  const handleBlock = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (level === 'visitor') {
      toast.info(action || 'Crie sua conta para usar esta funcionalidade', {
        description: 'Cadastre-se gratuitamente e tenha acesso completo ao Vitrinei Connect.',
        action: { label: 'Criar conta', onClick: () => navigate('/auth') },
        duration: 6000,
      });
    } else {
      // lead
      toast.warning('Confirme seu e-mail para desbloquear esta função', {
        description: 'Verifique sua caixa de entrada e clique no link de confirmação. Após confirmar, todas as funcionalidades serão liberadas.',
        action: { label: 'Ir para Carteira', onClick: () => navigate('/carteira') },
        duration: 8000,
      });
    }
  };

  return (
    <div className="relative cursor-not-allowed" onClick={handleBlock}>
      <div className="pointer-events-none opacity-60">
        {children}
      </div>
    </div>
  );
}

/**
 * LeadBanner: A persistent banner shown to leads (unconfirmed email) or visitors.
 * Guides them to the correct next step.
 */
export function AccessBanner() {
  const level = useAccessLevel();
  const navigate = useNavigate();

  if (level === 'active' || level === 'loading') return null;

  if (level === 'visitor') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-primary/10 border-b border-primary/20 px-4 py-2.5"
      >
        <div className="container mx-auto max-w-5xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <UserPlus className="w-4 h-4 text-primary shrink-0" />
            <p className="text-xs text-foreground">
              <strong>Bem-vindo!</strong> Cadastre-se para ver preços, contratar serviços e aproveitar cashback.
            </p>
          </div>
          <Button size="sm" className="text-xs shrink-0 gap-1" onClick={() => navigate('/auth')}>
            <UserPlus className="w-3.5 h-3.5" /> Criar conta
          </Button>
        </div>
      </motion.div>
    );
  }

  // Lead
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5"
    >
      <div className="container mx-auto max-w-5xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Mail className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-xs text-foreground">
            <strong>Quase lá!</strong> Confirme seu e-mail para desbloquear todas as funcionalidades. Modo leitura ativo.
          </p>
        </div>
        <Button size="sm" variant="outline" className="text-xs shrink-0 gap-1 border-amber-500/30 text-amber-700 hover:bg-amber-500/10" onClick={() => navigate('/carteira')}>
          <AlertTriangle className="w-3.5 h-3.5" /> Ver status
        </Button>
      </div>
    </motion.div>
  );
}
