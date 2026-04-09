import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useConversion } from '@/contexts/ConversionContext';
import { toast } from 'sonner';
import { ArrowLeft, Wallet, TrendingUp, TrendingDown, Gift, Copy, Share2, Clock, CheckCircle2, Lock, CreditCard, Timer, AlertTriangle, ShieldAlert, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';

interface Campaign {
  reward_buyer: number;
  reward_seller: number;
  reward_mixed_total: number;
  is_active: boolean;
}

const WalletPage = () => {
  const navigate = useNavigate();
  const { user, requireAuth } = useAuth();
  const { refreshWallet: refreshConversionWallet } = useConversion();
  const { activePlans } = useSubscriptionPlans();
  const planOptions = activePlans.map(p => ({ id: p.id, name: p.name, price: p.price, badge: p.badge }));
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [referralCode, setReferralCode] = useState('');
  const [referrals, setReferrals] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [paying, setPaying] = useState(false);
  const [countdown, setCountdown] = useState('');
  const [expired, setExpired] = useState(false);
  
  // Paywall / checkout state
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  // 24h countdown timer
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      const createdAt = new Date(user.created_at).getTime();
      const deadline = createdAt + 24 * 60 * 60 * 1000;
      const now = Date.now();
      const diff = deadline - now;

      if (diff <= 0) {
        setCountdown('00:00:00');
        setExpired(true);
      } else {
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setCountdown(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        setExpired(false);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    const [walletRes, txRes, refRes, subRes, campRes] = await Promise.all([
      supabase.from('wallets').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('wallet_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
      supabase.from('referrals').select('*').eq('referrer_id', user.id).order('created_at', { ascending: false }),
      supabase.from('subscriptions').select('*').eq('user_id', user.id).eq('status', 'active').maybeSingle(),
      supabase.from('referral_campaigns').select('*').eq('is_active', true).limit(1).maybeSingle(),
    ]);
    setWallet(walletRes.data);
    setTransactions(txRes.data || []);
    setReferrals(refRes.data || []);
    setSubscription(subRes.data);
    if (subRes.data) {
      setCheckoutPlan(subRes.data.plan);
    }
    if (campRes.data) {
      setCampaign({
        reward_buyer: Number(campRes.data.reward_buyer),
        reward_seller: Number(campRes.data.reward_seller),
        reward_mixed_total: Number(campRes.data.reward_mixed_total),
        is_active: campRes.data.is_active,
      });
    }

    // Check/create referral code
    const existingRef = (refRes.data || []).find((r: any) => !r.referred_id);
    if (existingRef) {
      setReferralCode(existingRef.referral_code);
    } else {
      const code = user.id.slice(0, 8).toUpperCase();
      const { data: newRef } = await supabase.from('referrals').insert({
        referrer_id: user.id,
        referral_code: code,
      }).select().single();
      if (newRef) setReferralCode(newRef.referral_code);
    }
    setLoading(false);
  };

  const handlePaySubscription = async () => {
    if (!wallet || !subscription) return;
    setPaying(true);
    try {
      const selectedPlan = planOptions.find(p => p.id === checkoutPlan);
      const planChanged = checkoutPlan && checkoutPlan !== subscription.plan && selectedPlan;
      
      // If plan changed, update subscription and adjust debt
      if (planChanged) {
        const oldPrice = Math.abs(wallet.balance);
        const newPrice = selectedPlan.price;
        const diff = newPrice - oldPrice;

        // Update subscription
        await supabase.from('subscriptions').update({
          plan: selectedPlan.id,
          price: selectedPlan.price,
        }).eq('id', subscription.id);

        // Adjust wallet balance if plan changed
        if (diff !== 0) {
          await supabase.from('wallets').update({
            balance: -newPrice,
          }).eq('id', wallet.id);

          await supabase.from('wallet_transactions').insert({
            user_id: user!.id,
            wallet_id: wallet.id,
            amount: -diff,
            type: 'plan_change',
            description: `[Assinatura] Mudança de plano: ${subscription.plan} → ${selectedPlan.name} (${diff > 0 ? '+' : ''}R$ ${diff.toFixed(2)})`,
          });
        }
      }

      const debitAmount = planChanged ? selectedPlan.price : Math.abs(wallet.balance);
      
      if (!planChanged && wallet.balance >= 0) {
        toast.info('Sua assinatura já está paga!');
        setPaying(false);
        setCheckoutOpen(false);
        return;
      }

      // Pay subscription - zero out debt
      await supabase.from('wallets').update({ balance: 0 }).eq('id', wallet.id);

      await supabase.from('wallet_transactions').insert({
        user_id: user!.id,
        wallet_id: wallet.id,
        amount: debitAmount,
        type: 'subscription_payment',
        description: `[Pagamento] ${paymentMethod === 'pix' ? 'Pix' : 'Cartão'} - Assinatura ${planChanged ? selectedPlan.name : subscription.plan} (R$ ${debitAmount.toFixed(2)})`,
      });

      // Apply cashback
      await supabase.from('wallets').update({
        balance: debitAmount,
        total_earned: (wallet.total_earned || 0) + debitAmount,
      }).eq('id', wallet.id);

      await supabase.from('wallet_transactions').insert({
        user_id: user!.id,
        wallet_id: wallet.id,
        amount: debitAmount,
        type: 'cashback_subscription',
        description: `[Cashback] Crédito de boas-vindas - Plano ${planChanged ? selectedPlan.name : subscription.plan} (R$ ${debitAmount.toFixed(2)})`,
      });

      toast.success(`Assinatura paga! Cashback de R$ ${debitAmount.toFixed(2)} creditado.`);
      setCheckoutOpen(false);
      loadData();
    } catch (e: any) {
      toast.error('Erro ao processar pagamento: ' + (e.message || 'desconhecido'));
    }
    setPaying(false);
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}/convite/${referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Link copiado!');
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      subscription_debit: '📉 Assinatura',
      subscription_payment: '💳 Pagamento',
      cashback_subscription: '🎁 Cashback',
      cashback_pending: '⏳ Cashback Pendente',
      cashback_released: '✅ Cashback Liberado',
      referral_cashback: '🎯 Indicação',
      referral_bonus: '🏆 Bônus Indicação',
      plan_change: '🔄 Mudança de Plano',
    };
    return labels[type] || type;
  };

  const getReferralProgress = (ref: any) => {
    if (!ref.reward_snapshot) return { percent: 0, label: 'Pendente' };
    const snapshot = typeof ref.reward_snapshot === 'string' ? JSON.parse(ref.reward_snapshot) : ref.reward_snapshot;
    const total = Number(snapshot.reward_mixed_total) || 0;
    if (total === 0) return { percent: 0, label: 'Pendente' };
    const paid = Number(ref.total_paid) || 0;
    const percent = Math.min(Math.round((paid / total) * 100), 100);

    if (ref.referred_role === 'mixed') {
      if (ref.buyer_released && ref.seller_released && ref.bonus_released) return { percent: 100, label: 'Completo' };
      if (ref.buyer_released && ref.seller_released) return { percent: 80, label: 'Fase 2/2 - Bônus pendente' };
      if (ref.buyer_released || ref.seller_released) return { percent: 50, label: 'Fase 1/2 concluída' };
      return { percent: 0, label: 'Aguardando 1ª transação' };
    }
    return { percent, label: paid > 0 ? 'Liberado' : 'Aguardando transação' };
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4">
        <Wallet className="w-12 h-12 text-muted-foreground" />
        <h1 className="text-xl font-bold">Carteira</h1>
        <p className="text-sm text-muted-foreground text-center">Faça login para acessar sua carteira e programa de indicação.</p>
        <Button onClick={() => navigate('/auth')}>Entrar</Button>
      </div>
    );
  }

  const pendingReferrals = referrals.filter((r: any) => r.referred_id && r.status !== 'activated');
  const activatedReferrals = referrals.filter((r: any) => r.status === 'activated');
  const hasDebt = wallet && wallet.balance < 0;

  const buyerReward = campaign?.reward_buyer ?? 5;
  const sellerReward = campaign?.reward_seller ?? 15;
  const mixedReward = campaign?.reward_mixed_total ?? 25;

  return (
    <div className="min-h-screen bg-background pb-20">
      <nav className="fixed top-0 w-full z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto flex items-center h-14 px-4 gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <span className="font-bold text-foreground">Minha Carteira</span>
          {hasDebt && (
            <Badge variant="destructive" className="ml-auto text-[10px] gap-1">
              <Eye className="w-3 h-3" /> Modo Leitura
            </Badge>
          )}
        </div>
      </nav>

      <div className="pt-20 px-4 container mx-auto max-w-lg space-y-4">
        {/* Paywall Banner for negative balance */}
        {hasDebt && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-destructive bg-destructive/5 overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="w-8 h-8 text-destructive shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0 space-y-2">
                    <div>
                      <p className="text-sm font-semibold text-destructive">Acesso em Modo Leitura</p>
                      <p className="text-xs text-muted-foreground">
                        Seu acesso está limitado até a liquidação da assinatura. 
                        Pague via Pix ou Cartão para desbloquear todos os recursos.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="text-xs">
                        Débito: R$ {Math.abs(wallet.balance).toFixed(2)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Plano: {subscription?.plan || '—'}
                      </Badge>
                    </div>
                    <Button 
                      size="sm" 
                      className="w-full gap-2"
                      onClick={() => setCheckoutOpen(true)}
                    >
                      <CreditCard className="w-4 h-4" />
                      Pagar Agora
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Balance Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className={`${hasDebt ? 'bg-gradient-to-br from-destructive/90 to-destructive/70' : 'bg-gradient-to-br from-primary to-primary/80'} text-primary-foreground`}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm opacity-80">{hasDebt ? 'Débito Pendente' : 'Saldo Disponível'}</p>
                  <p className="text-3xl font-bold mt-1">R$ {Math.abs(wallet?.balance || 0).toFixed(2)}</p>
                  {hasDebt && <p className="text-xs opacity-80 mt-1">Pague para liberar seu acesso completo</p>}
                </div>
                <div className="text-right">
                  <p className="text-sm opacity-80 flex items-center gap-1 justify-end"><Lock className="w-3 h-3" /> A Liberar</p>
                  <p className="text-xl font-semibold mt-1">R$ {(wallet?.pending_balance || 0).toFixed(2)}</p>
                </div>
              </div>
              <div className="flex gap-4 mt-4 text-xs opacity-80">
                <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Ganhos: R$ {(wallet?.total_earned || 0).toFixed(2)}</span>
                <span className="flex items-center gap-1"><TrendingDown className="w-3 h-3" /> Gastos: R$ {(wallet?.total_spent || 0).toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 24h Timer + Pay Subscription */}
        {subscription && (
          <Card className={expired ? 'border-destructive' : ''}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Timer className={`w-5 h-5 ${expired ? 'text-destructive' : 'text-amber-500'}`} />
                  <div>
                    <p className="text-sm font-medium">Prazo de Ativação</p>
                    <p className="text-xs text-muted-foreground">
                      Plano {subscription.plan} — R$ {Number(subscription.price).toFixed(2)}/mês
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-mono font-bold ${expired ? 'text-destructive' : 'text-foreground'}`}>
                    {countdown}
                  </p>
                  {expired && (
                    <Badge variant="destructive" className="text-[10px]">
                      <AlertTriangle className="w-3 h-3 mr-0.5" /> Expirado
                    </Badge>
                  )}
                </div>
              </div>

              {hasDebt && (
                <Button
                  className="w-full gap-2"
                  variant={expired ? 'destructive' : 'default'}
                  onClick={() => setCheckoutOpen(true)}
                >
                  <CreditCard className="w-4 h-4" />
                  {`Pagar Assinatura (R$ ${Math.abs(wallet.balance).toFixed(2)})`}
                </Button>
              )}

              {!hasDebt && wallet?.balance >= 0 && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Assinatura paga — saldo ativo!</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Dynamic Referral Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-sm">Indique e Ganhe</h3>
                {campaign?.is_active && (
                  <Badge variant="default" className="text-[10px] ml-auto">Campanha Ativa</Badge>
                )}
              </div>
            </div>
            <CardContent className="p-4 space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-muted/50 rounded-lg p-2">
                  <p className="text-lg font-bold text-primary">R$ {buyerReward.toFixed(0)}</p>
                  <p className="text-[10px] text-muted-foreground">Comprador</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-2">
                  <p className="text-lg font-bold text-primary">R$ {sellerReward.toFixed(0)}</p>
                  <p className="text-[10px] text-muted-foreground">Prestador</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-2">
                  <p className="text-lg font-bold text-primary">R$ {mixedReward.toFixed(0)}</p>
                  <p className="text-[10px] text-muted-foreground">Misto</p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                O cashback é liberado após a primeira transação do indicado. Perfis Mistos recebem em fases.
              </p>

              <div className="flex gap-2">
                <Input value={`${window.location.origin}/convite/${referralCode}`} readOnly className="text-xs" />
                <Button variant="outline" size="sm" className="gap-1 shrink-0" onClick={copyReferralLink}>
                  {copied ? '✓' : <Copy className="w-3 h-3" />}
                </Button>
              </div>

              <Button variant="outline" size="sm" className="w-full gap-1 text-xs"
                onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Conheça o Vitrinei! Cadastre-se pelo meu link:\n${window.location.origin}/convite/${referralCode}`)}`, '_blank')}>
                <Share2 className="w-3 h-3" /> Compartilhar no WhatsApp
              </Button>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> {activatedReferrals.length} liberadas</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-yellow-500" /> {pendingReferrals.length} pendentes</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Referral Progress - Pending */}
        {pendingReferrals.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-500" /> Indicações em Progresso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingReferrals.map((ref: any) => {
                  const progress = getReferralProgress(ref);
                  return (
                    <div key={ref.id} className="space-y-1.5 py-2 border-b border-border last:border-0">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-foreground">{ref.referred_name || 'Usuário'}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {ref.referred_role === 'mixed' ? '🔀 Misto' : ref.referred_role === 'provider' ? '🔧 Prestador' : '🛒 Comprador'}
                            {ref.joined_at && ` · ${new Date(ref.joined_at).toLocaleDateString('pt-BR')}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="text-[10px]">
                            {ref.status === 'partial' ? '⏳ Parcial' : '⏳ Pendente'}
                          </Badge>
                          <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                            R$ {Number(ref.total_paid || 0).toFixed(2)} / R$ {Number(ref.commission_amount).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Progress value={progress.percent} className="h-2" />
                        <p className="text-[10px] text-muted-foreground">{progress.percent}% — {progress.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Activated referrals */}
        {activatedReferrals.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" /> Indicações Concluídas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {activatedReferrals.map((ref: any) => (
                  <div key={ref.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-xs font-medium text-foreground">{ref.referred_name || 'Usuário'}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {ref.referred_email && <span>{ref.referred_email} · </span>}
                        Ativado em {ref.activated_at && new Date(ref.activated_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-[10px] text-green-600 border-green-300">
                        Liberado
                      </Badge>
                      <p className="text-xs font-semibold text-green-600 mt-0.5">+R$ {Number(ref.total_paid || ref.commission_amount).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transaction History */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Extrato de Movimentações</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Nenhuma transação ainda.</p>
            ) : (
              <div className="space-y-2">
                {transactions.map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground">{getTypeLabel(tx.type)}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{tx.description}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(tx.created_at).toLocaleString('pt-BR')}</p>
                    </div>
                    <span className={`text-sm font-semibold shrink-0 ml-2 ${tx.amount > 0 ? 'text-green-500' : tx.amount < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {tx.amount > 0 ? '+' : ''}R$ {Math.abs(tx.amount).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Checkout/Payment Modal */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Pagamento da Assinatura
            </DialogTitle>
            <DialogDescription>
              Escolha o método de pagamento e confirme. Você pode trocar o plano antes de pagar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Plan selection */}
            <div>
              <Label className="text-xs font-semibold mb-2 block">Plano de Assinatura</Label>
              <div className="grid grid-cols-3 gap-2">
                {planOptions.map(plan => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setCheckoutPlan(plan.id)}
                    className={`p-2 rounded-lg border text-center transition-all ${
                      checkoutPlan === plan.id
                        ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <span className="text-lg">{plan.badge}</span>
                    <p className="text-[10px] font-medium">{plan.name}</p>
                    <p className="text-xs font-bold text-primary">R$ {plan.price}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Payment method */}
            <div>
              <Label className="text-xs font-semibold mb-2 block">Forma de Pagamento</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('pix')}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    paymentMethod === 'pix'
                      ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  <p className="text-sm font-medium">💠 Pix</p>
                  <p className="text-[10px] text-muted-foreground">Instantâneo</p>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    paymentMethod === 'card'
                      ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  <p className="text-sm font-medium">💳 Cartão</p>
                  <p className="text-[10px] text-muted-foreground">Crédito/Débito</p>
                </button>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
              <div className="flex justify-between text-xs">
                <span>Plano {planOptions.find(p => p.id === checkoutPlan)?.name || '—'}</span>
                <span className="font-semibold">R$ {(planOptions.find(p => p.id === checkoutPlan)?.price || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-green-600">
                <span>Cashback de boas-vindas</span>
                <span className="font-semibold">+R$ {(planOptions.find(p => p.id === checkoutPlan)?.price || 0).toFixed(2)}</span>
              </div>
              <div className="border-t border-border pt-1 flex justify-between text-sm font-bold">
                <span>Total</span>
                <span className="text-primary">R$ {(planOptions.find(p => p.id === checkoutPlan)?.price || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button className="w-full gap-2" onClick={handlePaySubscription} disabled={paying}>
              {paying ? 'Processando...' : `Confirmar Pagamento`}
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setCheckoutOpen(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WalletPage;
