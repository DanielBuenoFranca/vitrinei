import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { toast } from 'sonner';
import { Zap, Mail, Lock, User, ArrowLeft, Gift } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';

const AuthPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [refCode, setRefCode] = useState('');

  useEffect(() => {
    // Capture referral code from URL or localStorage
    const urlRef = searchParams.get('ref') || '';
    const storedRef = localStorage.getItem('ecomei_ref') || '';
    const code = urlRef || storedRef;
    if (code) {
      setRefCode(code);
      localStorage.setItem('ecomei_ref', code);
    }
  }, [searchParams]);

  if (user) {
    navigate('/');
    return null;
  }

  const handleLogin = async () => {
    if (!email || !password) { toast.error('Preencha email e senha'); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast.error(error.message);
    else { toast.success('Login realizado!'); navigate('/'); }
    setLoading(false);
  };

  const processReferral = async (newUserId: string, userName: string, userEmail: string, userPhone: string) => {
    if (!refCode) return;
    try {
      // Find the referral code owner
      const { data: refData } = await supabase.from('referrals')
        .select('*')
        .eq('referral_code', refCode)
        .is('referred_id', null)
        .limit(1)
        .maybeSingle();

      if (!refData || refData.referrer_id === newUserId) return;

      // Determine commission: R$15 for providers, R$5 for clients
      const commission = 5; // Default client, can be updated later when role is assigned

      // Update referral with referred user details
      await supabase.from('referrals').update({
        referred_id: newUserId,
        referred_name: userName || userEmail.split('@')[0],
        referred_email: userEmail,
        referred_phone: userPhone || null,
        referred_role: 'client',
        joined_at: new Date().toISOString(),
        commission_amount: commission,
        status: 'pending',
      }).eq('id', refData.id);

      // Add pending balance to referrer's wallet
      const { data: referrerWallet } = await supabase.from('wallets')
        .select('id, pending_balance')
        .eq('user_id', refData.referrer_id)
        .maybeSingle();

      if (referrerWallet) {
        await supabase.from('wallets').update({
          pending_balance: (referrerWallet.pending_balance || 0) + commission,
        }).eq('id', referrerWallet.id);

        // Record pending transaction
        await supabase.from('wallet_transactions').insert({
          user_id: refData.referrer_id,
          wallet_id: referrerWallet.id,
          amount: 0, // Will be credited when activated
          type: 'cashback_pending',
          description: `Indicação pendente - ${userName || userEmail.split('@')[0]} (aguardando 1ª transação)`,
        });
      }

      localStorage.removeItem('ecomei_ref');
    } catch (err) {
      console.error('Referral processing error:', err);
    }
  };

  const handleSignup = async () => {
    if (!email || !password) { toast.error('Preencha email e senha'); return; }
    if (password.length < 6) { toast.error('Senha deve ter no mínimo 6 caracteres'); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { full_name: name || email.split('@')[0] },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Cadastro realizado! Verifique seu email para confirmar.');
      // Process referral if user was created
      if (data?.user?.id) {
        await processReferral(data.user.id, name, email, phone);
      }
      // After signup, redirect to subscription page
      if (data?.session) {
        navigate('/assinatura');
      }
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error('Erro ao entrar com Google');
      setLoading(false);
      return;
    }
    if (result.redirected) return;
    toast.success('Login realizado!');
    navigate('/');
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!email) { toast.error('Digite seu email'); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success('Email de recuperação enviado!');
    setLoading(false);
  };

  if (resetMode) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Recuperar Senha</CardTitle>
            <CardDescription>Digite seu email para receber o link de recuperação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" />
            </div>
            <Button className="w-full" onClick={handleResetPassword} disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setResetMode(false)}>Voltar ao login</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-3">
            <Zap className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">EcoMEI</h1>
          <p className="text-sm text-muted-foreground mt-1">Acesse sua conta ou cadastre-se</p>
        </div>

        {refCode && (
          <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-primary/10 border border-primary/20">
            <Gift className="w-4 h-4 text-primary" />
            <span className="text-xs text-foreground">Código de indicação: <strong>{refCode}</strong></span>
            <Badge variant="secondary" className="text-[10px]">Bônus ativo</Badge>
          </div>
        )}

        <Button variant="outline" className="w-full gap-2 h-11" onClick={handleGoogleLogin} disabled={loading}>
          <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Continuar com Google
        </Button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">ou</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <Tabs defaultValue="login">
          <TabsList className="w-full">
            <TabsTrigger value="login" className="flex-1">Entrar</TabsTrigger>
            <TabsTrigger value="signup" className="flex-1">Cadastrar</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-3 mt-3">
            <div className="space-y-2">
              <Label className="text-xs">Email</Label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className="pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Senha</Label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" className="pl-10"
                  onKeyDown={e => e.key === 'Enter' && handleLogin()} />
              </div>
            </div>
            <Button className="w-full" onClick={handleLogin} disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
            <Button variant="link" className="w-full text-xs" onClick={() => setResetMode(true)}>Esqueci minha senha</Button>
          </TabsContent>

          <TabsContent value="signup" className="space-y-3 mt-3">
            <div className="space-y-2">
              <Label className="text-xs">Nome</Label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" className="pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Telefone</Label>
              <div className="relative">
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(11) 99999-9999" className="pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Email</Label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className="pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Senha</Label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="pl-10" />
              </div>
            </div>
            <Button className="w-full" onClick={handleSignup} disabled={loading}>
              {loading ? 'Cadastrando...' : 'Criar Conta'}
            </Button>
          </TabsContent>
        </Tabs>

        <Button variant="ghost" className="w-full gap-2 text-xs" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4" /> Voltar ao início
        </Button>
      </div>
    </div>
  );
};

export default AuthPage;
