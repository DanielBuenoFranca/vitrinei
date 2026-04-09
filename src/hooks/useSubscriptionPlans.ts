import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  badge: string;
  discount: number;
  popular?: boolean;
  features: string[];
  limitations: string[];
  active: boolean;
}

const DEFAULT_PLANS: SubscriptionPlan[] = [
  { id: 'bronze', name: 'Bronze', price: 50, badge: '🥉', discount: 5, features: ['Vitrine digital básica', 'Até 10 produtos/serviços', 'Programa de indicação', 'Carteira digital com cashback', 'Suporte por email'], limitations: ['Sem relatórios avançados', 'Sem personalização de vitrine'], active: true },
  { id: 'prata', name: 'Prata', price: 100, badge: '🥈', discount: 10, popular: true, features: ['Vitrine personalizada com logo', 'Até 50 produtos/serviços', 'Indicação premium', 'Cashback dobrado', 'Relatórios de vendas', 'Suporte prioritário', 'Selo de verificação'], limitations: ['Sem IA para vitrine'], active: true },
  { id: 'ouro', name: 'Ouro', price: 200, badge: '🥇', discount: 20, features: ['Vitrine com IA Designer', 'Produtos/serviços ilimitados', 'Indicação VIP', 'Cashback triplo', 'Dashboards completos', 'Suporte 24h', 'Selo premium + destaque', 'Prioridade nos resultados', 'Automações avançadas'], limitations: [], active: true },
];

export function useSubscriptionPlans() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>(DEFAULT_PLANS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'subscription_plans')
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value && Array.isArray(data.value)) {
          setPlans(data.value as unknown as SubscriptionPlan[]);
        }
        setLoading(false);
      });
  }, []);

  const activePlans = plans.filter(p => p.active);

  return { plans, activePlans, loading };
}
