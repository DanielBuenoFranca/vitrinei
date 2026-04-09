import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ArrowLeft, Crown, Check, Zap, Star, Shield, BarChart3, Users, Store, Package, Headphones, CreditCard, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';

const PLAN_COLORS: Record<string, string> = {
  bronze: 'from-amber-700 to-amber-500',
  prata: 'from-slate-500 to-slate-300',
  ouro: 'from-yellow-500 to-amber-300',
};

const SubscriptionPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activePlans, loading: loadingPlans } = useSubscriptionPlans();
  const [currentSub, setCurrentSub] = useState<any>(null);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from('subscriptions').select('*').eq('user_id', user.id).eq('status', 'active').maybeSingle()
      .then(({ data }) => setCurrentSub(data));
  }, [user]);

  const handleSubscribe = async (plan: typeof activePlans[0]) => {
    if (!user) { navigate('/auth'); return; }
    setLoading(plan.id);
    try {
      // Deactivate existing
      if (currentSub) {
        await supabase.from('subscriptions').update({ status: 'cancelled' }).eq('id', currentSub.id);
      }
      const { data, error } = await supabase.from('subscriptions').insert({
        user_id: user.id,
        plan: plan.id,
        price: plan.price,
      }).select().single();
      if (error) throw error;
      setCurrentSub(data);
      toast.success(`Plano ${plan.name} ativado com sucesso!`);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao assinar');
    }
    setLoading(null);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <nav className="fixed top-0 w-full z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto flex items-center h-14 px-4 gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Crown className="w-5 h-5 text-primary" />
          <span className="font-bold text-foreground">Planos de Assinatura</span>
        </div>
      </nav>

      <div className="pt-20 px-4 container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">Escolha seu plano</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Desbloqueie ferramentas exclusivas e cresça seu negócio no ecossistema Vitrinei
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan, i) => {
            const isActive = currentSub?.plan === plan.id;
            return (
              <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className={`relative overflow-hidden h-full flex flex-col ${plan.popular ? 'ring-2 ring-primary shadow-lg' : ''}`}>
                  {plan.popular && (
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                      MAIS POPULAR
                    </div>
                  )}
                  <CardHeader className={`bg-gradient-to-br ${plan.color} text-white pb-4`}>
                    <div className="text-2xl">{plan.badge}</div>
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">R$ {plan.price}</span>
                      <span className="text-sm opacity-80">/mês</span>
                    </div>
                    <Badge className="bg-white/20 text-white border-0 text-[10px] w-fit">
                      {plan.discount}% desconto no catálogo
                    </Badge>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col pt-4 space-y-3">
                    <div className="flex-1 space-y-2">
                      {plan.features.map((f, j) => (
                        <div key={j} className="flex items-start gap-2 text-xs">
                          <Check className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                          <span className="text-foreground">{f.text}</span>
                        </div>
                      ))}
                      {plan.limitations.map((l, j) => (
                        <div key={j} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <span className="w-3.5 text-center shrink-0">—</span>
                          <span>{l}</span>
                        </div>
                      ))}
                    </div>
                    <Button
                      className="w-full mt-4"
                      variant={isActive ? 'outline' : 'default'}
                      disabled={isActive || loading === plan.id}
                      onClick={() => handleSubscribe(plan)}
                    >
                      {loading === plan.id ? 'Processando...' : isActive ? '✓ Plano Atual' : `Assinar ${plan.name}`}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <p className="text-center text-[10px] text-muted-foreground mt-6">
          Todos os planos incluem acesso à carteira digital, programa de indicação e suporte básico.
          Cancele a qualquer momento sem multa.
        </p>
      </div>
    </div>
  );
};

export default SubscriptionPage;
