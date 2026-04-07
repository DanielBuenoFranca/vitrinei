import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ArrowLeft, Wallet, TrendingUp, TrendingDown, Gift, Copy, Share2, Clock, CheckCircle2, Lock, CreditCard, Timer, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';

const WalletPage = () => {
  const navigate = useNavigate();
  const { user, requireAuth } = useAuth();
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [referralCode, setReferralCode] = useState('');
  const [referrals, setReferrals] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [paying, setPaying] = useState(false);
  const [countdown, setCountdown] = useState('');
  const [expired, setExpired] = useState(false);

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
    const [walletRes, txRes, refRes, subRes] = await Promise.all([
      supabase.from('wallets').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('wallet_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
      supabase.from('referrals').select('*').eq('referrer_id', user.id).order('created_at', { ascending: false }),
      supabase.from('subscriptions').select('*').eq('user_id', user.id).eq('status', 'active').maybeSingle(),
    ]);
    setWallet(walletRes.data);
    setTransactions(txRes.data || []);
    setReferrals(refRes.data || []);
    setSubscription(subRes.data);

    // Check/create referral code
    const existingRef = refRes.data?.find((r: any) => !r.referred_id);
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
      const debitAmount = Math.abs(wallet.balance);
      if (wallet.balance >= 0) {
        toast.info('Sua assinatura já está paga!');
        setPaying(false);
        return;
      }

      // Zero the debt
      await supabase.from('wallets').update({
        balance: 0,
      }).eq('id', wallet.id);

      // Record payment transaction
      await supabase.from('wallet_transactions').insert({
        user_id: user!.id,
        wallet_id: wallet.id,
        amount: debitAmount,
        type: 'subscription_payment',
        description: `Pagamento - Assinatura ${subscription.plan} (R$ ${debitAmount.toFixed(2)})`,
      });

      // Apply cashback (same value as subscription)
      await supabase.from('wallets').update({
        balance: debitAmount,
        total_earned: (wallet.total_earned || 0) + debitAmount,
      }).eq('id', wallet.id);

      await supabase.from('wallet_transactions').insert({
        user_id: user!.id,
        wallet_id: wallet.id,
        amount: debitAmount,
        type: 'cashback_subscription',
        description: `Cashback - Assinatura ${subscription.plan} (R$ ${debitAmount.toFixed(2)})`,
      });

      toast.success(`Assinatura paga! Cashback de R$ ${debitAmount.toFixed(2)} creditado.`);
      loadData();
    } catch (e: any) {
      toast.error('Erro ao processar pagamento: ' + (e.message || 'desconhecido'));
    }
    setPaying(false);
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Link copiado!');
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      subscription_debit: '📉 Débito Assinatura',
      subscription_payment: '💳 Pagamento',
      cashback_subscription: '🎁 Cashback',
      cashback_pending: '⏳ Cashback Pendente',
      cashback_released: '✅ Cashback Liberado',
    };
    return labels[type] || type;
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

  const pendingReferrals = referrals.filter((r: any) => r.status === 'pending' && r.referred_id);
  const activatedReferrals = referrals.filter((r: any) => r.status === 'activated');
  const hasDebt = wallet && wallet.balance < 0;

  return (
    <div className="min-h-screen bg-background pb-20">
      <nav className="fixed top-0 w-full z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto flex items-center h-14 px-4 gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <span className="font-bold text-foreground">Minha Carteira</span>
        </div>
      </nav>

      <div className="pt-20 px-4 container mx-auto max-w-lg space-y-4">
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
                  onClick={handlePaySubscription}
                  disabled={paying}
                >
                  <CreditCard className="w-4 h-4" />
                  {paying ? 'Processando...' : `Pagar Assinatura (R$ ${Math.abs(wallet.balance).toFixed(2)})`}
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

        {/* Referral Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Gift className="w-4 h-4 text-primary" /> Programa de Indicação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Indique clientes (R$ 5,00) ou fornecedores (R$ 15,00). O cashback fica pendente até a primeira transação do indicado.
            </p>
            <div className="flex gap-2">
              <Input value={`${window.location.origin}?ref=${referralCode}`} readOnly className="text-xs" />
              <Button variant="outline" size="sm" className="gap-1 shrink-0" onClick={copyReferralLink}>
                {copied ? '✓' : <Copy className="w-3 h-3" />}
              </Button>
            </div>
            <Button variant="outline" size="sm" className="w-full gap-1 text-xs"
              onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Conheça o Vitrinei! Use meu código: ${referralCode}\n${window.location.origin}?ref=${referralCode}`)}`, '_blank')}>
              <Share2 className="w-3 h-3" /> Compartilhar no WhatsApp
            </Button>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> {activatedReferrals.length} liberadas</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-yellow-500" /> {pendingReferrals.length} pendentes</span>
            </div>
          </CardContent>
        </Card>

        {/* Pending referrals details */}
        {pendingReferrals.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-500" /> Indicações Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {pendingReferrals.map((ref: any) => (
                  <div key={ref.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-xs font-medium text-foreground">{ref.referred_name || 'Usuário'}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {ref.referred_email && <span>{ref.referred_email} · </span>}
                        {ref.referred_phone && <span>{ref.referred_phone} · </span>}
                        {ref.joined_at && new Date(ref.joined_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-[10px] text-yellow-600 border-yellow-300">
                        Pendente
                      </Badge>
                      <p className="text-xs font-semibold text-muted-foreground mt-0.5">R$ {Number(ref.commission_amount).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Activated referrals */}
        {activatedReferrals.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" /> Indicações Ativas
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
                      <p className="text-xs font-semibold text-green-600 mt-0.5">+R$ {Number(ref.commission_amount).toFixed(2)}</p>
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
                    <div>
                      <p className="text-xs font-medium text-foreground">{getTypeLabel(tx.type)}</p>
                      <p className="text-[10px] text-muted-foreground">{tx.description}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(tx.created_at).toLocaleString('pt-BR')}</p>
                    </div>
                    <span className={`text-sm font-semibold ${tx.amount > 0 ? 'text-green-500' : tx.amount < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {tx.amount > 0 ? '+' : ''}R$ {Math.abs(tx.amount).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WalletPage;
