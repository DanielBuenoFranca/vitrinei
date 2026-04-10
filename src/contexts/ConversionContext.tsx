import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface ConversionState {
  /** Wallet balance - negative means unpaid subscription */
  walletBalance: number | null;
  /** User's subscription plan name */
  subscriptionPlan: string | null;
  /** Subscription price */
  subscriptionPrice: number | null;
  /** Number of stores visited this session */
  storeVisitCount: number;
  /** Whether prices should be hidden (visitor or lead with debt) */
  shouldObscurePrices: boolean;
  /** Whether the attention footer should show */
  showAttentionBar: boolean;
  /** Campaign messages from site_settings */
  campaignMessages: CampaignMessages;
  /** Track a store visit */
  trackStoreVisit: (storeName: string) => void;
  /** Refresh wallet data (after payment) */
  refreshWallet: () => Promise<void>;
  /** Access level: visitor, lead (logged+debt), active (logged+paid) */
  accessLevel: 'loading' | 'visitor' | 'lead' | 'active';
}

interface CampaignMessages {
  conversionPrompt2Visits: string;
  conversionPrompt5Visits: string;
  attentionBarText: string;
  signupModalTitle: string;
  signupModalSubtitle: string;
  signupBenefits: string[];
}

const DEFAULT_MESSAGES: CampaignMessages = {
  conversionPrompt2Visits: 'Você está a um passo de fechar negócio. Ative sua conta para liberar os preços exclusivos!',
  conversionPrompt5Visits: 'Você já visitou {count} lojas! Não perca mais tempo — desbloqueie todos os preços agora.',
  attentionBarText: 'Seu acesso está limitado. Pague sua assinatura para desbloquear todos os recursos.',
  signupModalTitle: 'Desbloqueie todo o potencial do Vitrinei Connect',
  signupModalSubtitle: 'Crie sua conta gratuita e tenha acesso a milhares de profissionais e serviços.',
  signupBenefits: [
    'Veja preços exclusivos de todos os prestadores',
    'Contrate serviços com cashback garantido',
    'Acesse contatos e localizações de profissionais',
    'Programa de indicação com bônus em dinheiro',
    'Carteira digital com créditos e promoções',
  ],
};

const ConversionContext = createContext<ConversionState>({
  walletBalance: null,
  subscriptionPlan: null,
  subscriptionPrice: null,
  storeVisitCount: 0,
  shouldObscurePrices: true,
  showAttentionBar: false,
  campaignMessages: DEFAULT_MESSAGES,
  trackStoreVisit: () => {},
  refreshWallet: async () => {},
  accessLevel: 'loading',
});

export const useConversion = () => useContext(ConversionContext);

export const ConversionProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null);
  const [subscriptionPrice, setSubscriptionPrice] = useState<number | null>(null);
  const [storeVisitCount, setStoreVisitCount] = useState(0);
  const [visitedStores, setVisitedStores] = useState<Set<string>>(new Set());
  const [campaignMessages, setCampaignMessages] = useState<CampaignMessages>(DEFAULT_MESSAGES);
  const [walletLoaded, setWalletLoaded] = useState(false);

  // Load wallet & subscription for logged users
  const refreshWallet = useCallback(async () => {
    if (!user) {
      setWalletBalance(null);
      setSubscriptionPlan(null);
      setSubscriptionPrice(null);
      setWalletLoaded(true);
      return;
    }
    const [walletRes, subRes] = await Promise.all([
      supabase.from('wallets').select('balance').eq('user_id', user.id).maybeSingle(),
      supabase.from('subscriptions').select('plan, price').eq('user_id', user.id).eq('status', 'active').maybeSingle(),
    ]);
    setWalletBalance(walletRes.data?.balance ?? 0);
    setSubscriptionPlan(subRes.data?.plan ?? null);
    setSubscriptionPrice(subRes.data?.price ? Number(subRes.data.price) : null);
    setWalletLoaded(true);
  }, [user]);

  useEffect(() => {
    refreshWallet();
  }, [refreshWallet]);

  // Subscribe to wallet changes in realtime
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('wallet-conversion')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'wallets',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const newBalance = payload.new?.balance;
        if (newBalance !== undefined) {
          setWalletBalance(Number(newBalance));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Load campaign messages from site_settings
  useEffect(() => {
    supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'conversion_messages')
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value && typeof data.value === 'object') {
          setCampaignMessages(prev => ({ ...prev, ...(data.value as any) }));
        }
      });
  }, []);

  // Determine access level — restrictions only lift after confirmed payment (balance >= 0)
  const accessLevel = (() => {
    if (authLoading || (!walletLoaded && user)) return 'loading' as const;
    if (!user) return 'visitor' as const;
    // Lead = negative balance (subscription debt) — restrictions apply
    if (walletBalance !== null && walletBalance < 0) return 'lead' as const;
    // Active = balance >= 0 (payment confirmed and processed)
    return 'active' as const;
  })();

  const shouldObscurePrices = accessLevel === 'visitor' || accessLevel === 'lead';
  const showAttentionBar = accessLevel === 'lead';

  // Track store visits with conversion prompts
  const trackStoreVisit = useCallback((storeName: string) => {
    setVisitedStores(prev => {
      const next = new Set(prev);
      if (next.has(storeName)) return prev;
      next.add(storeName);
      const count = next.size;
      setStoreVisitCount(count);

      // Fire conversion prompts for leads
      if (accessLevel === 'lead') {
        if (count === 2) {
          setTimeout(() => {
            toast.info(campaignMessages.conversionPrompt2Visits, {
              duration: 8000,
              action: { label: 'Ativar agora', onClick: () => { window.location.href = '/carteira'; } },
              icon: '🔓',
            });
          }, 1500);
        } else if (count >= 5 && count % 3 === 0) {
          setTimeout(() => {
            toast.warning(
              campaignMessages.conversionPrompt5Visits.replace('{count}', String(count)),
              {
                duration: 10000,
                action: { label: 'Desbloquear preços', onClick: () => { window.location.href = '/carteira'; } },
                icon: '🏪',
              }
            );
          }, 2000);
        }
      }

      return next;
    });
  }, [accessLevel, campaignMessages]);

  return (
    <ConversionContext.Provider value={{
      walletBalance,
      subscriptionPlan,
      subscriptionPrice,
      storeVisitCount,
      shouldObscurePrices,
      showAttentionBar,
      campaignMessages,
      trackStoreVisit,
      refreshWallet,
      accessLevel,
    }}>
      {children}
    </ConversionContext.Provider>
  );
};
