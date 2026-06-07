/**
 * useClientCatalog — single source of truth for the production /client view.
 *
 * Replaces the mock imports (clientServices, clientProducts, plans, mockUser,
 * meiProfessionals) with REAL data pulled from Supabase. Keeps the legacy
 * shape so the existing ClientApp page does not need a full rewrite.
 *
 * Empty arrays/zero credits when the DB is empty — the UI then shows a
 * Vini-driven empty-state guiding the user to the admin to create data.
 */
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { ServiceItem, ProductItem, MeiProfessional, PlanTier } from '@/data/mockData';

interface PlanShape {
  id: PlanTier;
  name: string;
  price: number;
  color?: string;
  badge?: string;
  discount: number;
  monthlyCredits: number;
  maxAccumulation: number;
  loyaltyBonusPercent?: number;
  services?: string;
  features: string[];
  limitations?: string[];
  popular?: boolean;
}

interface UserShape {
  name: string;
  plan: PlanTier;
  monthsActive: number;
  credits: number;
  totalCreditsEarned: number;
  isActive: boolean;
}

const SEGMENT_ICON: Record<string, string> = {
  'Manutenção & Reparos': '🔧',
  'Saúde': '🩺',
  'Bem-estar & Saúde': '💪',
  'Estética & Beleza': '✨',
  'Lar & Ambiente': '🏠',
  'Automotivo': '🚗',
  'Digital & Criativo': '🎨',
  'Tecnologia & Informática': '💻',
  'Educação & Cursos': '🎓',
  'Pet & Animais': '🐕',
  'Eventos & Festas': '🎉',
  'Música': '🎵',
  'Natureza & Vida Natural': '🌿',
};

const PLAN_DEFAULTS: Record<PlanTier, { monthlyCredits: number; maxAccumulation: number; loyaltyBonusPercent: number }> = {
  bronze: { monthlyCredits: 50, maxAccumulation: 100, loyaltyBonusPercent: 2 },
  prata: { monthlyCredits: 120, maxAccumulation: 300, loyaltyBonusPercent: 5 },
  ouro: { monthlyCredits: 250, maxAccumulation: 800, loyaltyBonusPercent: 10 },
};

function mapService(row: any): ServiceItem {
  const segment = row.segment || 'Geral';
  const price = Number(row.price) || 0;
  return {
    id: row.id,
    name: row.name,
    icon: SEGMENT_ICON[segment] || '✨',
    category: segment,
    provider: row.provider || 'Prestador',
    rating: Number(row.rating) || 4.5,
    creditCost: Math.max(10, Math.round(price * 0.5)),
    minMonths: 0,
    minPlan: 'bronze',
    allowComplement: true,
    monetaryValue: price,
    relatedProductIds: Array.isArray(row.linked_product_ids) ? row.linked_product_ids : [],
  };
}

function mapProduct(row: any): ProductItem {
  const segments: string[] = Array.isArray(row.segments) ? row.segments : [];
  return {
    id: row.id,
    name: row.name,
    price: Number(row.price) || 0,
    category: segments[0] || 'Geral',
    image: '📦',
    rating: Number(row.rating) || 4.4,
    supplier: row.provider || 'Fornecedor',
    relatedServiceIds: Array.isArray(row.related_service_ids) ? row.related_service_ids : [],
  };
}

function mapPlan(row: any): PlanShape {
  const id = (row.id || 'bronze') as PlanTier;
  const def = PLAN_DEFAULTS[id] || PLAN_DEFAULTS.bronze;
  return {
    id,
    name: row.name || id,
    price: Number(row.price) || 0,
    badge: row.badge,
    discount: Number(row.discount) || 0,
    monthlyCredits: def.monthlyCredits,
    maxAccumulation: def.maxAccumulation,
    loyaltyBonusPercent: def.loyaltyBonusPercent,
    features: Array.isArray(row.features) ? row.features : [],
    limitations: Array.isArray(row.limitations) ? row.limitations : [],
    popular: !!row.popular,
  };
}

export interface ClientCatalog {
  loading: boolean;
  services: ServiceItem[];
  products: ProductItem[];
  plans: PlanShape[];
  user: UserShape;
  meiProfessionals: MeiProfessional[];
  isEmpty: boolean;
}

export function useClientCatalog(): ClientCatalog {
  const { user: authUser, displayName } = useAuth();
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [plans, setPlans] = useState<PlanShape[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [wallet, setWallet] = useState<{ balance: number; total_earned: number } | null>(null);
  const [subscription, setSubscription] = useState<{ plan: string; status: string } | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const [svc, prd, prv, settings] = await Promise.all([
        supabase.from('dynamic_services').select('*').order('rating', { ascending: false }).limit(500),
        supabase.from('dynamic_products').select('*').order('rating', { ascending: false }).limit(500),
        supabase.from('providers').select('*').limit(200),
        supabase.from('site_settings').select('value').eq('key', 'subscription_plans').maybeSingle(),
      ]);

      if (!active) return;

      setServices((svc.data || []).map(mapService));
      setProducts((prd.data || []).map(mapProduct));
      setProviders(prv.data || []);

      const rawPlans = (settings.data?.value as any[]) || [];
      const mappedPlans = rawPlans.filter((p: any) => p.active !== false).map(mapPlan);
      setPlans(mappedPlans);

      if (authUser) {
        const [w, s] = await Promise.all([
          supabase.from('wallets').select('balance,total_earned').eq('user_id', authUser.id).maybeSingle(),
          supabase
            .from('subscriptions')
            .select('plan,status')
            .eq('user_id', authUser.id)
            .eq('status', 'active')
            .order('started_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);
        if (!active) return;
        setWallet(w.data ? { balance: Number(w.data.balance) || 0, total_earned: Number(w.data.total_earned) || 0 } : null);
        setSubscription(s.data ? { plan: s.data.plan, status: s.data.status } : null);
      }

      setLoading(false);
    })();
    return () => { active = false; };
  }, [authUser?.id]);

  // Derive MeiProfessionals from providers + their products (real data).
  const meiProfessionals = useMemo<MeiProfessional[]>(() => {
    return providers.map((p: any) => {
      const segs = Array.isArray(p.segment) ? p.segment : (p.segment ? [p.segment] : []);
      const segment = segs[0] || 'Geral';
      const own = products.filter((prod) => {
        const provIdMatch = (prod as any).providerId === p.id;
        return provIdMatch || prod.supplier === p.name;
      });
      return {
        id: p.id,
        name: p.name,
        segment,
        specialty: p.specialty || segs.join(' / ') || 'Multi-serviços',
        rating: Number(p.rating) || 4.5,
        completedJobs: Number(p.completed_jobs) || 0,
        city: p.city || 'Brasil',
        avatar: SEGMENT_ICON[segment] || '🏪',
        ownProducts: own,
        dropshippingProducts: [],
      };
    });
  }, [providers, products]);

  const user = useMemo<UserShape>(() => {
    const planId = (subscription?.plan?.toLowerCase() as PlanTier) || 'bronze';
    const monthsActive = authUser?.created_at
      ? Math.max(0, Math.floor((Date.now() - new Date(authUser.created_at).getTime()) / (1000 * 60 * 60 * 24 * 30)))
      : 0;
    return {
      name: displayName || 'Visitante',
      plan: ['bronze', 'prata', 'ouro'].includes(planId) ? planId : 'bronze',
      monthsActive,
      credits: Math.max(0, Math.round((wallet?.balance ?? 0))),
      totalCreditsEarned: Math.max(0, Math.round(wallet?.total_earned ?? 0)),
      isActive: subscription?.status === 'active',
    };
  }, [displayName, authUser, wallet, subscription]);

  const isEmpty = !loading && services.length === 0 && products.length === 0;

  return { loading, services, products, plans, user, meiProfessionals, isEmpty };
}
