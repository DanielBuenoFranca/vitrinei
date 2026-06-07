/**
 * useMeiDashboard — real-data version of the legacy `meiDashboard` mock.
 *
 * Loads the current user's provider, their stock (`dynamic_products`),
 * services (`dynamic_services`) and recent wallet movements, then exposes
 * an object with the SAME SHAPE as the mock so MeiPanel doesn't need a
 * full rewrite. When the DB is empty for this user, returns zeros/empty
 * arrays + `isEmpty=true` so the UI can show an empty-state CTA.
 */
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface StockRow {
  id: number; name: string; qty: number; price: number; supplier: string; status: 'available'|'low_stock'|'out_of_stock';
}
interface ServicePerformed {
  serviceId: number; name: string; completedJobs: number; revenue: number; productsUpsold: number; productRevenue: number; avgRating: number;
}
interface MeiDashboard {
  revenue: { total: number; thisMonth: number; growth: number };
  orders: { total: number; pending: number; completed: number; cancelled: number };
  topProducts: Array<{ name: string; sold: number; revenue: number }>;
  revenueChart: Array<{ month: string; value: number }>;
  stock: StockRow[];
  financials: {
    cashFlow: Array<{ date: string; income: number; expense: number }>;
    accountsReceivable: number;
    accountsPayable: number;
    balance: number;
  };
  servicesPerformed: ServicePerformed[];
  meiSuggestions: Array<{ type: string; message: string; icon: string }>;
}

const EMPTY: MeiDashboard = {
  revenue: { total: 0, thisMonth: 0, growth: 0 },
  orders: { total: 0, pending: 0, completed: 0, cancelled: 0 },
  topProducts: [],
  revenueChart: [],
  stock: [],
  financials: { cashFlow: [], accountsReceivable: 0, accountsPayable: 0, balance: 0 },
  servicesPerformed: [],
  meiSuggestions: [],
};

export function useMeiDashboard() {
  const { user: authUser, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<MeiDashboard>(EMPTY);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authUser) { setLoading(false); return; }
      setLoading(true);

      // 1) Find this user's provider record (if any).
      const { data: prov } = await supabase
        .from('providers')
        .select('id, name')
        .or(`owner_id.eq.${authUser.id},name.eq.${profile?.display_name || ''}`)
        .limit(1)
        .maybeSingle();
      const providerId = prov?.id ?? null;

      // 2) Stock from dynamic_products filtered by provider (when known).
      const stockQuery = supabase.from('dynamic_products').select('id,name,quantity,price,provider,provider_id');
      const { data: stockRaw } = providerId
        ? await stockQuery.eq('provider_id', providerId)
        : await stockQuery.limit(0);

      const stock: StockRow[] = (stockRaw || []).map((r: any) => {
        const qty = Number(r.quantity) || 0;
        const status: StockRow['status'] = qty === 0 ? 'out_of_stock' : qty <= 5 ? 'low_stock' : 'available';
        return { id: r.id, name: r.name, qty, price: Number(r.price) || 0, supplier: r.provider || '—', status };
      });

      // 3) Services performed — best-effort from dynamic_services + wallet aggregation.
      const { data: svcs } = providerId
        ? await supabase.from('dynamic_services').select('id,name,price,rating').eq('provider_id', providerId)
        : { data: [] as any[] };

      // 4) Wallet (balance + transactions for revenue/cashflow).
      const { data: wallet } = await supabase
        .from('wallets').select('id,balance,total_earned,total_spent,pending_balance')
        .eq('user_id', authUser.id).maybeSingle();

      const walletId = wallet?.id || '';
      const { data: tx } = walletId
        ? await supabase
            .from('wallet_transactions')
            .select('amount,type,created_at,description')
            .eq('wallet_id', walletId)
            .order('created_at', { ascending: false })
            .limit(180)
        : { data: [] as any[] };

      // Aggregate revenue chart (last 6 months) + cashflow (last 6 days).
      const now = new Date();
      const monthNames = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
      const revenueChart: Array<{ month: string; value: number }> = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
        const v = (tx || []).filter((t: any) => {
          const td = new Date(t.created_at);
          return td >= d && td < next && (t.type === 'credit' || t.type === 'income' || Number(t.amount) > 0);
        }).reduce((s, t: any) => s + Math.max(0, Number(t.amount) || 0), 0);
        revenueChart.push({ month: monthNames[d.getMonth()], value: Math.round(v) });
      }

      const cashFlow: Array<{ date: string; income: number; expense: number }> = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dayStr = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
        const sameDay = (t: any) => {
          const td = new Date(t.created_at);
          return td.toDateString() === d.toDateString();
        };
        const income = (tx || []).filter(sameDay).reduce((s, t: any) => s + Math.max(0, Number(t.amount) || 0), 0);
        const expense = (tx || []).filter(sameDay).reduce((s, t: any) => s + Math.abs(Math.min(0, Number(t.amount) || 0)), 0);
        cashFlow.push({ date: dayStr, income: Math.round(income), expense: Math.round(expense) });
      }

      const thisMonthRevenue = revenueChart[revenueChart.length - 1]?.value || 0;
      const lastMonthRevenue = revenueChart[revenueChart.length - 2]?.value || 0;
      const growth = lastMonthRevenue > 0 ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100) : 0;

      // top products = local stock sorted by qty desc (rough proxy until sales table exists)
      const topProducts = stock.slice(0, 5).map(s => ({ name: s.name, sold: s.qty, revenue: Math.round(s.qty * s.price) }));

      // services performed shell — counts unavailable yet, returns 0s so KPIs render but signal "no data"
      const servicesPerformed: ServicePerformed[] = (svcs || []).slice(0, 5).map((s: any) => ({
        serviceId: s.id, name: s.name, completedJobs: 0, revenue: 0,
        productsUpsold: 0, productRevenue: 0, avgRating: Number(s.rating) || 0,
      }));

      const final: MeiDashboard = {
        revenue: {
          total: Math.round(Number(wallet?.total_earned) || 0),
          thisMonth: thisMonthRevenue,
          growth,
        },
        orders: { total: 0, pending: 0, completed: 0, cancelled: 0 },
        topProducts,
        revenueChart,
        stock,
        financials: {
          cashFlow,
          accountsReceivable: Math.round(Number(wallet?.pending_balance) || 0),
          accountsPayable: 0,
          balance: Math.round(Number(wallet?.balance) || 0),
        },
        servicesPerformed,
        meiSuggestions: [],
      };

      if (!active) return;
      setData(final);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [authUser?.id, profile?.display_name]);

  const isEmpty = useMemo(() =>
    !loading && data.stock.length === 0 && data.servicesPerformed.length === 0 && data.financials.balance === 0,
    [loading, data],
  );

  return { loading, data, isEmpty };
}
