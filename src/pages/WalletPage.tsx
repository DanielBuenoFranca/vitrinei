import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ArrowLeft, Wallet, TrendingUp, TrendingDown, Gift, Copy, Share2, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';

const WalletPage = () => {
  const navigate = useNavigate();
  const { user, requireAuth } = useAuth();
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [referralCode, setReferralCode] = useState('');
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    const [walletRes, txRes, refRes] = await Promise.all([
      supabase.from('wallets').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('wallet_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
      supabase.from('referrals').select('*').eq('referrer_id', user.id).order('created_at', { ascending: false }),
    ]);
    setWallet(walletRes.data);
    setTransactions(txRes.data || []);
    setReferrals(refRes.data || []);

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

  const copyReferralLink = () => {
    const link = `${window.location.origin}?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Link copiado!');
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
          <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
            <CardContent className="p-6">
              <p className="text-sm opacity-80">Saldo disponível</p>
              <p className="text-3xl font-bold mt-1">R$ {(wallet?.balance || 0).toFixed(2)}</p>
              <div className="flex gap-4 mt-4 text-xs opacity-80">
                <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Ganhos: R$ {(wallet?.total_earned || 0).toFixed(2)}</span>
                <span className="flex items-center gap-1"><TrendingDown className="w-3 h-3" /> Gastos: R$ {(wallet?.total_spent || 0).toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Referral Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Gift className="w-4 h-4 text-primary" /> Programa de Indicação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Você ganhará recompensa quando o indicado realizar sua primeira transação (compra ou venda).
            </p>
            <div className="flex gap-2">
              <Input value={`${window.location.origin}?ref=${referralCode}`} readOnly className="text-xs" />
              <Button variant="outline" size="sm" className="gap-1 shrink-0" onClick={copyReferralLink}>
                {copied ? '✓' : <Copy className="w-3 h-3" />}
              </Button>
            </div>
            <Button variant="outline" size="sm" className="w-full gap-1 text-xs"
              onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Conheça o EcoMEI! Use meu código: ${referralCode}\n${window.location.origin}?ref=${referralCode}`)}`, '_blank')}>
              <Share2 className="w-3 h-3" /> Compartilhar no WhatsApp
            </Button>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="w-3 h-3" />
              <span>{referrals.filter((r: any) => r.status === 'activated').length} indicações ativas</span>
              <Badge variant="outline" className="text-[10px]">R$ {referrals[0]?.commission_amount || '5.00'} por indicação</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Transactions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Histórico</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Nenhuma transação ainda.</p>
            ) : (
              <div className="space-y-2">
                {transactions.map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-xs font-medium text-foreground">{tx.description || tx.type}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(tx.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <span className={`text-sm font-semibold ${tx.amount > 0 ? 'text-green-500' : 'text-destructive'}`}>
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
