import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useConversion } from '@/contexts/ConversionContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { toast } from 'sonner';
import { Zap, Mail, Lock, User, ArrowLeft, Gift, ShoppingCart, Wrench, Shuffle, Crown, Check, KeyRound, CheckCircle, IdCard, Loader2, X } from 'lucide-react';
import { maskCPFCNPJ, unmask } from '@/lib/masks';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';

// CPF/CNPJ digit-check validator (Brazilian standard)
function isValidCpfCnpj(raw: string): boolean {
  const d = raw.replace(/\D/g, '');
  if (d.length === 11) {
    if (/^(\d)\1+$/.test(d)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(d[i]) * (10 - i);
    let r = (sum * 10) % 11;
    if (r === 10) r = 0;
    if (r !== parseInt(d[9])) return false;
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(d[i]) * (11 - i);
    r = (sum * 10) % 11;
    if (r === 10) r = 0;
    return r === parseInt(d[10]);
  }
  if (d.length === 14) {
    if (/^(\d)\1+$/.test(d)) return false;
    const calc = (len: number) => {
      const w = len === 12 ? [5,4,3,2,9,8,7,6,5,4,3,2] : [6,5,4,3,2,9,8,7,6,5,4,3,2];
      let s = 0;
      for (let i = 0; i < len; i++) s += parseInt(d[i]) * w[i];
      const m = s % 11;
      return m < 2 ? 0 : 11 - m;
    };
    return calc(12) === parseInt(d[12]) && calc(13) === parseInt(d[13]);
  }
  return false;
}
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';

const profileOptions = [
  { id: 'client', label: 'Comprador / Consumidor', icon: ShoppingCart, desc: 'Compre produtos e contrate serviços' },
  { id: 'provider', label: 'Prestador / Vendedor', icon: Wrench, desc: 'Ofereça serviços e venda produtos' },
  { id: 'mixed', label: 'Misto', icon: Shuffle, desc: 'Compre e venda no mesmo perfil' },
];

// Plans loaded dynamically via useSubscriptionPlans hook (site_settings.subscription_plans)

// Activation code is now handled server-side and stored in the database.
// The user should receive it or have it provided by a Master user.

const AuthPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { refreshWallet } = useConversion();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [cpfCheckState, setCpfCheckState] = useState<'idle' | 'checking' | 'ok' | 'taken' | 'invalid'>('idle');
  const [providerHint, setProviderHint] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [refCode, setRefCode] = useState('');
  const [referrerName, setReferrerName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('login');
  const [selectedProfile, setSelectedProfile] = useState<string>('');
  const [selectedPlan, setSelectedPlan] = useState<string>('bronze');
  const { activePlans: plans } = useSubscriptionPlans();
  const [campaignRewards, setCampaignRewards] = useState<{ buyer: number; seller: number; mixed: number } | null>(null);

  useEffect(() => {
    supabase.from('referral_campaigns').select('reward_buyer,reward_seller,reward_mixed_total').eq('is_active', true).maybeSingle()
      .then(({ data }) => {
        if (data) setCampaignRewards({
          buyer: Number((data as any).reward_buyer) || 0,
          seller: Number((data as any).reward_seller) || 0,
          mixed: Number((data as any).reward_mixed_total) || 0,
        });
      });
  }, []);

  // Activation modals
  const [activationModal, setActivationModal] = useState<{ open: boolean; code: string; email: string }>({ open: false, code: '', email: '' });
  const [loginActivationModal, setLoginActivationModal] = useState<{ open: boolean; expectedCode: string; userId: string }>({ open: false, expectedCode: '', userId: '' });
  const [activationInput, setActivationInput] = useState('');

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'signup' || tabParam === 'register') {
      setActiveTab('signup');
    } else {
      setActiveTab('login');
    }

    const urlRef = searchParams.get('ref') || '';
    const storedRef = localStorage.getItem('ecomei_ref') || '';
    const code = urlRef || storedRef;
    if (code) {
      setRefCode(code);
      localStorage.setItem('ecomei_ref', code);
      
      // Fetch referrer name
      const fetchReferrer = async () => {
        const { data: refData } = await supabase
          .from('referrals')
          .select('referrer_id')
          .eq('referral_code', code)
          .limit(1)
          .maybeSingle();

        if (refData?.referrer_id) {
          const { data: rName } = await (supabase.rpc as any)('get_public_display_name', { _user_id: refData.referrer_id });
          if (rName) setReferrerName(rName as string);
        }
      };
      fetchReferrer();
    }
  }, [searchParams]);

  // Debounced uniqueness check via RPC
  useEffect(() => {
    const digits = unmask(cpfCnpj);
    setProviderHint(false);
    if (digits.length === 0) { setCpfCheckState('idle'); return; }
    if (digits.length !== 11 && digits.length !== 14) { setCpfCheckState('idle'); return; }
    if (!isValidCpfCnpj(digits)) { setCpfCheckState('invalid'); return; }
    setCpfCheckState('checking');
    const t = setTimeout(async () => {
      try {
        const { data, error } = await (supabase.rpc as any)('check_cpf_cnpj_available', { _doc: digits });
        if (error) { setCpfCheckState('idle'); return; }
        const r = data as { available: boolean; reason?: string; has_existing_provider?: boolean };
        if (r?.available) {
          setCpfCheckState('ok');
          setProviderHint(!!r.has_existing_provider);
        } else {
          setCpfCheckState(r?.reason === 'invalid_format' ? 'invalid' : 'taken');
        }
      } catch { setCpfCheckState('idle'); }
    }, 450);
    return () => clearTimeout(t);
  }, [cpfCnpj]);

  if (user) {
    navigate('/');
    return null;
  }

  const handleLogin = async () => {
    if (!email || !password) { toast.error('Preencha email e senha'); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      // Check if the error is due to unconfirmed email
      if (error.message?.includes('Email not confirmed') || error.message?.includes('email_not_confirmed')) {
        setLoginActivationModal({ open: true, expectedCode: 'SERVER_SIDE', userId: '' });
        setActivationInput('');
        setLoading(false);
        return;
      }
      toast.error(error.message);
      setLoading(false);
      return;
    }
    
    toast.success('Login realizado!');
    navigate('/');
    setLoading(false);
  };

  const handleActivateAndLogin = async () => {
    if (!activationInput || activationInput.length < 6) {
      toast.error('Código de ativação inválido');
      return;
    }
    
    setLoading(true);
    try {
      // Call self-activate edge function to confirm email
      const { data: activateData, error: activateError } = await supabase.functions.invoke('self-activate', {
        body: { email, code: activationInput },
      });

      if (activateError || activateData?.error) {
        toast.error(activateData?.error || 'Erro ao ativar conta. Tente novamente.');
        setLoading(false);
        return;
      }

      // Now sign in with the confirmed account
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      
      if (signInError) {
        toast.error('Conta ativada, mas houve erro no login: ' + signInError.message);
        setLoginActivationModal({ open: false, expectedCode: '', userId: '' });
        setLoading(false);
        return;
      }

      toast.success('Conta ativada com sucesso! Bem-vindo ao Vitrinei!');
      setLoginActivationModal({ open: false, expectedCode: '', userId: '' });
      await refreshWallet();
      navigate('/');
    } catch {
      toast.error('Erro ao ativar conta');
    }
    setLoading(false);
  };

  const processReferral = async (newUserId: string, userName: string, userEmail: string, userPhone: string) => {
    if (!refCode) return;
    try {
      const { data: refData } = await supabase.from('referrals')
        .select('*')
        .eq('referral_code', refCode)
        .is('referred_id', null)
        .limit(1)
        .maybeSingle();

      if (!refData || refData.referrer_id === newUserId) return;

      // Get active campaign for snapshot
      const { data: campData } = await supabase.from('referral_campaigns')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      const rewardSnapshot = campData ? {
        reward_buyer: Number(campData.reward_buyer),
        reward_seller: Number(campData.reward_seller),
        reward_mixed_total: Number(campData.reward_mixed_total),
      } : { reward_buyer: 5, reward_seller: 15, reward_mixed_total: 25 };

      const commission = selectedProfile === 'mixed' 
        ? rewardSnapshot.reward_mixed_total 
        : selectedProfile === 'provider' 
          ? rewardSnapshot.reward_seller 
          : rewardSnapshot.reward_buyer;

      const now = new Date();
      const formattedDate = now.toLocaleDateString('pt-BR');
      const formattedTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      await supabase.from('referrals').update({
        referred_id: newUserId,
        referred_name: userName || userEmail.split('@')[0],
        referred_email: userEmail,
        referred_phone: userPhone || null,
        referred_role: selectedProfile || 'client',
        joined_at: now.toISOString(),
        commission_amount: commission,
        reward_snapshot: rewardSnapshot as any,
        status: 'pending',
      }).eq('id', refData.id);

      const { data: referrerWallet } = await supabase.from('wallets')
        .select('id, pending_balance')
        .eq('user_id', refData.referrer_id)
        .maybeSingle();

      if (referrerWallet) {
        await supabase.from('wallets').update({
          pending_balance: (referrerWallet.pending_balance || 0) + commission,
        }).eq('id', referrerWallet.id);

        // Register bonus in referrer's ledger with full details
        await supabase.from('wallet_transactions').insert({
          user_id: refData.referrer_id,
          wallet_id: referrerWallet.id,
          amount: 0,
          type: 'cashback_pending',
          description: `[Bônus (+)] Indicação de ${userName || userEmail.split('@')[0]} — ${formattedDate} ${formattedTime} — Tel: ${userPhone || 'N/A'} — E-mail: ${userEmail} — Aguardando Efetivação do Lead`,
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
    if (!selectedProfile) { toast.error('Selecione um perfil de acesso'); return; }
    if (!selectedPlan) { toast.error('Selecione um plano de assinatura'); return; }
    const cpfDigits = unmask(cpfCnpj);
    if (!cpfDigits) { toast.error('CPF ou CNPJ é obrigatório'); return; }
    if (!isValidCpfCnpj(cpfDigits)) { toast.error('CPF/CNPJ inválido — confira os dígitos'); return; }
    if (cpfCheckState === 'taken') { toast.error('Este CPF/CNPJ já possui cadastro no sistema'); return; }

    setLoading(true);

    // Final server-side check (race-safe)
    try {
      const { data: chk } = await (supabase.rpc as any)('check_cpf_cnpj_available', { _doc: cpfDigits });
      if (chk && !chk.available) {
        toast.error(chk.reason === 'already_registered' ? 'Este CPF/CNPJ já está cadastrado' : 'CPF/CNPJ inválido');
        setLoading(false);
        return;
      }
    } catch { /* non-blocking */ }

    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: {
          full_name: name || email.split('@')[0],
          selected_profile: selectedProfile,
          selected_plan: selectedPlan,
          phone: phone || null,
          cpf_cnpj: cpfDigits,
        },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    if (data?.user?.id) {
      // Assign role
      await supabase.from('user_roles').insert({ user_id: data.user.id, role: selectedProfile as any });

      // Create subscription with dynamic plan price
      const plan = plans.find(p => p.id === selectedPlan)!;
      await supabase.from('subscriptions').insert({
        user_id: data.user.id,
        plan: plan.id,
        price: plan.price,
      });

      // Update profile — saving CPF/CNPJ triggers auto-link of orphan provider
      const isProvider = selectedProfile === 'provider' || selectedProfile === 'mixed';
      const isCustomer = selectedProfile === 'client' || selectedProfile === 'mixed';
      await supabase.from('profiles').update({
        is_provider: isProvider,
        is_customer: isCustomer,
        phone: phone || null,
        cpf_cnpj: cpfDigits,
      }).eq('user_id', data.user.id);

      // Only create a NEW provider record if profile didn't auto-link to an existing one
      if (isProvider) {
        const { data: linked } = await supabase
          .from('providers').select('id').eq('user_id', data.user.id).limit(1);
        if (!linked || linked.length === 0) {
          const providerName = name || email.split('@')[0];
          try {
            await supabase.from('providers').insert({
              name: providerName,
              segment: ['Geral'],
              type: 'mei',
              email: email,
              phone: phone || '',
              cpf_cnpj: cpfDigits,
              user_id: data.user.id,
              active: true,
              storefront_config: {},
            });
          } catch { /* provider may already exist — ignore */ }
        }
      }

      // Create initial debit in wallet
      const { data: walletData } = await supabase.from('wallets')
        .select('id')
        .eq('user_id', data.user.id)
        .maybeSingle();

      if (walletData) {
        await supabase.from('wallets').update({
          balance: -plan.price,
        }).eq('id', walletData.id);

        await supabase.from('wallet_transactions').insert({
          user_id: data.user.id,
          wallet_id: walletData.id,
          amount: -plan.price,
          type: 'subscription_debit',
          description: `[Assinatura] Débito inicial - Plano ${plan.name} (R$ ${plan.price.toFixed(2)})`,
        });
      }

      await processReferral(data.user.id, name, email, phone);

      // Show activation code modal
      setActivationModal({ open: true, code: 'SOLICITE AO MASTER', email });
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
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-3">
            <Zap className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Vitrinei</h1>
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
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(11) 99999-9999" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                CPF / CNPJ
                <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <IdCard className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  value={cpfCnpj}
                  onChange={(e) => setCpfCnpj(maskCPFCNPJ(e.target.value))}
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  className={`pl-10 pr-10 ${
                    cpfCheckState === 'taken' || cpfCheckState === 'invalid'
                      ? 'border-destructive focus-visible:ring-destructive'
                      : cpfCheckState === 'ok'
                        ? 'border-success focus-visible:ring-success'
                        : ''
                  }`}
                  inputMode="numeric"
                  maxLength={18}
                />
                <div className="absolute right-3 top-3">
                  {cpfCheckState === 'checking' && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                  {cpfCheckState === 'ok' && <Check className="w-4 h-4 text-success" />}
                  {(cpfCheckState === 'taken' || cpfCheckState === 'invalid') && <X className="w-4 h-4 text-destructive" />}
                </div>
              </div>
              {cpfCheckState === 'invalid' && (
                <p className="text-[10.5px] text-destructive">Documento inválido — confira os dígitos.</p>
              )}
              {cpfCheckState === 'taken' && (
                <p className="text-[10.5px] text-destructive">Este CPF/CNPJ já possui cadastro. Use a aba Entrar.</p>
              )}
              {cpfCheckState === 'ok' && providerHint && (
                <p className="text-[10.5px] text-success">
                  ✨ Encontramos um cadastro de Prestador com este documento — vamos vinculá-lo automaticamente à sua conta.
                </p>
              )}
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

            {/* Profile Selection */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Perfil de Acesso *</Label>
              <div className="grid grid-cols-3 gap-2">
                {profileOptions.map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedProfile(opt.id)}
                    className={`p-2 rounded-lg border text-center transition-all ${
                      selectedProfile === opt.id
                        ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <opt.icon className={`w-5 h-5 mx-auto mb-1 ${selectedProfile === opt.id ? 'text-primary' : 'text-muted-foreground'}`} />
                    <p className="text-[10px] font-medium leading-tight">{opt.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Plan Selection */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Plano de Assinatura *</Label>
              <div className="grid grid-cols-3 gap-2">
                {plans.map(plan => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`p-2 rounded-lg border text-center transition-all relative ${
                      selectedPlan === plan.id
                        ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    {plan.popular && (
                      <span className="absolute -top-1.5 right-1 text-[8px] bg-primary text-primary-foreground px-1 rounded">Popular</span>
                    )}
                    <span className="text-lg">{plan.badge}</span>
                    <p className="text-[10px] font-medium">{plan.name}</p>
                    <p className="text-xs font-bold text-primary">R$ {plan.price}</p>
                    <p className="text-[9px] text-muted-foreground">{plan.discount}% desc.</p>
                  </button>
                ))}
              </div>
            </div>

            {campaignRewards && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-2 text-[11px] flex items-center justify-between">
                <span className="flex items-center gap-1 font-semibold"><Gift className="w-3 h-3 text-primary" /> Bonificação ativa</span>
                <span className="text-muted-foreground">
                  Comprador R$ {campaignRewards.buyer.toFixed(2)} · Prestador R$ {campaignRewards.seller.toFixed(2)} · Misto R$ {campaignRewards.mixed.toFixed(2)}
                </span>
              </div>
            )}

            <Button className="w-full" onClick={handleSignup} disabled={loading}>
              {loading ? 'Cadastrando...' : 'Criar Conta'}
            </Button>
          </TabsContent>
        </Tabs>

        <Button variant="ghost" className="w-full gap-2 text-xs" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4" /> Voltar ao início
        </Button>
      </div>

      {/* Post-Signup Activation Modal */}
      <Dialog open={activationModal.open} onOpenChange={(v) => {
        if (!v) {
          setActivationModal({ open: false, code: '', email: '' });
          navigate('/');
        }
      }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Cadastro Realizado!
            </DialogTitle>
            <DialogDescription>
              Sua conta foi criada com sucesso. Use o código abaixo para ativar seu acesso caso o e-mail de confirmação não chegue.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted rounded-lg p-4 text-center">
              <p className="text-xs text-muted-foreground mb-2">Seu código de ativação</p>
              <p className="text-3xl font-mono font-bold tracking-[0.3em] text-primary">{activationModal.code}</p>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>📧 Enviado para: <strong>{activationModal.email}</strong></p>
              <p>⏳ Você tem 24 horas para ativar sua conta</p>
              <p>💡 Guarde este código — ele será solicitado no login</p>
            </div>
          </div>
          <DialogFooter>
            <Button className="w-full" onClick={() => {
              setActivationModal({ open: false, code: '', email: '' });
              navigate('/');
            }}>
              Entendi, vamos lá!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Login Activation Code Modal */}
      <Dialog open={loginActivationModal.open} onOpenChange={(v) => !v && setLoginActivationModal({ open: false, expectedCode: '', userId: '' })}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-amber-500" />
              Conta Pendente
            </DialogTitle>
            <DialogDescription>
              Seu e-mail ainda não foi confirmado. Digite o código de ativação recebido no cadastro ou solicite ativação pelo administrador.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Código de Ativação (6 dígitos)</Label>
              <Input 
                value={activationInput} 
                onChange={e => setActivationInput(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                placeholder="000000"
                className="text-center text-2xl tracking-[0.3em] font-mono"
                maxLength={6}
              />
            </div>
            <Button className="w-full" onClick={handleActivateAndLogin} disabled={activationInput.length !== 6 || loading}>
              {loading ? 'Ativando...' : 'Ativar Conta'}
            </Button>
            <div className="text-center space-y-2">
              <p className="text-xs text-muted-foreground">
                Não recebeu o código? Entre em contato com o administrador para ativação manual.
              </p>
              <p className="text-[9px] text-muted-foreground/50 font-mono select-all">
                Código: {loginActivationModal.expectedCode}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuthPage;
