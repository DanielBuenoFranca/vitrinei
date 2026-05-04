import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Gift, Loader2, Save, Users, TrendingUp, DollarSign, Clock, Crown, Plus, Pencil, Trash2, CreditCard } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface Campaign {
  id: string;
  reward_buyer: number;
  reward_seller: number;
  reward_mixed_total: number;
  is_active: boolean;
  updated_at: string;
}

interface ReferralSummary {
  total: number;
  pending: number;
  partial: number;
  activated: number;
  totalPaid: number;
  totalPending: number;
}

interface ReferralRow {
  id: string;
  referrer_id: string;
  referred_name: string | null;
  referred_email: string | null;
  referred_role: string | null;
  status: string;
  total_paid: number;
  commission_amount: number;
  buyer_released: boolean;
  seller_released: boolean;
  bonus_released: boolean;
  created_at: string;
  activated_at: string | null;
  referrer_name?: string;
}

interface SubscriptionPlan {
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
  { id: 'ouro', name: 'Ouro', price: 200, badge: '🥇', discount: 20, features: ['Vitrine com IA Designer', 'Produtos/serviços ilimitados', 'Indicação VIP (bônus triplo)', 'Cashback triplo', 'Dashboards completos', 'Suporte 24h', 'Selo premium + destaque', 'Prioridade nos resultados', 'Automações avançadas'], limitations: [], active: true },
];

export function CampaignForm() {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rewardBuyer, setRewardBuyer] = useState('5.00');
  const [rewardSeller, setRewardSeller] = useState('15.00');
  const [rewardMixed, setRewardMixed] = useState('25.00');
  const [isActive, setIsActive] = useState(true);

  // Referrals data
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [summary, setSummary] = useState<ReferralSummary>({ total: 0, pending: 0, partial: 0, activated: 0, totalPaid: 0, totalPending: 0 });
  const [loadingReferrals, setLoadingReferrals] = useState(true);

  // Subscription plans
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [savingPlans, setSavingPlans] = useState(false);
  const [editPlan, setEditPlan] = useState<SubscriptionPlan | null>(null);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);

  // Plan form state
  const [planForm, setPlanForm] = useState({ name: '', price: '', badge: '', discount: '', features: '', limitations: '', active: true, popular: false });

  useEffect(() => {
    loadCampaign();
    loadReferrals();
    loadPlans();
  }, []);

  const loadCampaign = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('referral_campaigns')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setCampaign(data as Campaign);
      setRewardBuyer(Number(data.reward_buyer).toFixed(2));
      setRewardSeller(Number(data.reward_seller).toFixed(2));
      setRewardMixed(Number(data.reward_mixed_total).toFixed(2));
      setIsActive(data.is_active);
    }
    setLoading(false);
  };

  const loadReferrals = async () => {
    setLoadingReferrals(true);
    const { data: refs } = await supabase
      .from('referrals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (refs) {
      const referrerIds = [...new Set(refs.map(r => r.referrer_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', referrerIds);

      const nameMap: Record<string, string> = {};
      (profiles || []).forEach(p => { nameMap[p.user_id] = p.display_name || 'Sem nome'; });

      const rows: ReferralRow[] = refs.map(r => ({
        ...r,
        referrer_name: nameMap[r.referrer_id] || r.referrer_id.slice(0, 8),
      }));
      setReferrals(rows);

      const pending = refs.filter(r => r.status === 'pending').length;
      const partial = refs.filter(r => r.status === 'partial').length;
      const activated = refs.filter(r => r.status === 'activated').length;
      const totalPaid = refs.reduce((s, r) => s + Number(r.total_paid || 0), 0);
      const totalPending = refs.reduce((s, r) => s + Math.max(0, Number(r.commission_amount) - Number(r.total_paid || 0)), 0);
      setSummary({ total: refs.length, pending, partial, activated, totalPaid, totalPending });
    }
    setLoadingReferrals(false);
  };

  const loadPlans = async () => {
    setLoadingPlans(true);
    const { data } = await supabase
      .from('site_settings')
      .select('*')
      .eq('key', 'subscription_plans')
      .maybeSingle();

    if (data?.value) {
      const parsed = data.value as unknown;
      if (Array.isArray(parsed)) {
        setPlans(parsed as SubscriptionPlan[]);
      } else {
        setPlans(DEFAULT_PLANS);
      }
    } else {
      setPlans(DEFAULT_PLANS);
    }
    setLoadingPlans(false);
  };

  const savePlans = async (updatedPlans: SubscriptionPlan[]) => {
    setSavingPlans(true);
    try {
      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .eq('key', 'subscription_plans')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('site_settings')
          .update({ value: updatedPlans as any })
          .eq('key', 'subscription_plans');
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert({ key: 'subscription_plans', value: updatedPlans as any });
        if (error) throw error;
      }
      setPlans(updatedPlans);
      toast.success('Planos de assinatura atualizados');
    } catch (e: any) {
      toast.error('Erro ao salvar planos: ' + (e.message || 'desconhecido'));
    }
    setSavingPlans(false);
  };

  const openNewPlan = () => {
    setEditPlan(null);
    setPlanForm({ name: '', price: '', badge: '🏷️', discount: '0', features: '', limitations: '', active: true, popular: false });
    setPlanDialogOpen(true);
  };

  const openEditPlan = (plan: SubscriptionPlan) => {
    setEditPlan(plan);
    setPlanForm({
      name: plan.name,
      price: String(plan.price),
      badge: plan.badge,
      discount: String(plan.discount),
      features: plan.features.join('\n'),
      limitations: plan.limitations.join('\n'),
      active: plan.active,
      popular: plan.popular || false,
    });
    setPlanDialogOpen(true);
  };

  const handleSavePlan = async () => {
    if (!planForm.name.trim() || !planForm.price) {
      toast.error('Nome e preço são obrigatórios');
      return;
    }
    const newPlan: SubscriptionPlan = {
      id: editPlan?.id || planForm.name.toLowerCase().replace(/\s+/g, '_'),
      name: planForm.name.trim(),
      price: parseFloat(planForm.price),
      badge: planForm.badge || '🏷️',
      discount: parseFloat(planForm.discount || '0'),
      features: planForm.features.split('\n').map(f => f.trim()).filter(Boolean),
      limitations: planForm.limitations.split('\n').map(l => l.trim()).filter(Boolean),
      active: planForm.active,
      popular: planForm.popular,
    };

    let updated: SubscriptionPlan[];
    if (editPlan) {
      updated = plans.map(p => p.id === editPlan.id ? newPlan : p);
    } else {
      if (plans.find(p => p.id === newPlan.id)) {
        toast.error('Já existe um plano com esse identificador');
        return;
      }
      updated = [...plans, newPlan];
    }
    await savePlans(updated);
    setPlanDialogOpen(false);
  };

  const handleDeletePlan = async (planId: string) => {
    const updated = plans.filter(p => p.id !== planId);
    await savePlans(updated);
  };

  const saveCampaign = async () => {
    const buyer = parseFloat(rewardBuyer);
    const seller = parseFloat(rewardSeller);
    const mixed = parseFloat(rewardMixed);

    if (isNaN(buyer) || isNaN(seller) || isNaN(mixed)) {
      toast.error('Preencha todos os valores corretamente');
      return;
    }
    if (mixed < buyer + seller) {
      toast.error('O total Misto deve ser ≥ soma de Comprador + Prestador');
      return;
    }

    setSaving(true);
    try {
      if (campaign) {
        const { error } = await supabase
          .from('referral_campaigns')
          .update({
            reward_buyer: buyer,
            reward_seller: seller,
            reward_mixed_total: mixed,
            is_active: isActive,
          })
          .eq('id', campaign.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('referral_campaigns')
          .insert({
            reward_buyer: buyer,
            reward_seller: seller,
            reward_mixed_total: mixed,
            is_active: isActive,
          });
        if (error) throw error;
      }
      toast.success('Campanha atualizada — valores refletidos em todo o sistema');
      loadCampaign();
    } catch (e: any) {
      toast.error('Erro: ' + (e.message || 'desconhecido'));
    }
    setSaving(false);
  };

  const roleLabel = (role: string | null) => {
    switch (role) {
      case 'client': return 'Comprador';
      case 'provider': return 'Prestador';
      case 'mixed': return 'Bônus Extra';
      default: return role || '—';
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pendente</Badge>;
      case 'partial': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Parcial</Badge>;
      case 'activated': return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Ativado</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── SUBSCRIPTION PLANS ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Crown className="h-5 w-5 text-primary" />
                Planos de Assinatura
              </CardTitle>
              <CardDescription>Gerencie preços, benefícios e descontos dos planos — fonte única de verdade</CardDescription>
            </div>
            <Button size="sm" className="gap-1" onClick={openNewPlan}>
              <Plus className="h-4 w-4" /> Novo Plano
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingPlans ? (
            <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : plans.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhum plano cadastrado. Clique em "Novo Plano".</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {plans.map(plan => (
                <Card key={plan.id} className={`relative border ${plan.popular ? 'border-primary ring-1 ring-primary/20' : ''} ${!plan.active ? 'opacity-60' : ''}`}>
                  {plan.popular && (
                    <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px]">Popular</Badge>
                  )}
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{plan.badge}</span>
                        <div>
                          <p className="font-bold text-sm">{plan.name}</p>
                          <p className="text-xs text-muted-foreground">{plan.discount}% desconto</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">R$ {plan.price.toFixed(2)}</p>
                        <p className="text-[10px] text-muted-foreground">/mês</p>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {plan.features.slice(0, 4).map((f, i) => (
                        <p key={i} className="text-[10px] text-muted-foreground flex items-start gap-1">
                          <span className="text-green-500 mt-px">✓</span> {f}
                        </p>
                      ))}
                      {plan.features.length > 4 && (
                        <p className="text-[10px] text-muted-foreground">+{plan.features.length - 4} benefícios</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 pt-1">
                      <Badge variant={plan.active ? 'default' : 'secondary'} className="text-[9px]">
                        {plan.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <div className="flex-1" />
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditPlan(plan)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeletePlan(plan.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan Edit Dialog */}
      <Dialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              {editPlan ? `Editar ${editPlan.name}` : 'Novo Plano'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium block mb-1">Nome</label>
                <Input value={planForm.name} onChange={e => setPlanForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Diamante" />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Preço (R$)</label>
                <Input type="number" step="0.01" min="0" value={planForm.price} onChange={e => setPlanForm(f => ({ ...f, price: e.target.value }))} placeholder="150.00" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium block mb-1">Emoji/Badge</label>
                <Input value={planForm.badge} onChange={e => setPlanForm(f => ({ ...f, badge: e.target.value }))} placeholder="🥉" />
              </div>
              <div>
                <label className="text-xs font-medium block mb-1">Desconto (%)</label>
                <Input type="number" min="0" max="100" value={planForm.discount} onChange={e => setPlanForm(f => ({ ...f, discount: e.target.value }))} placeholder="5" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Benefícios (um por linha)</label>
              <textarea
                className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={planForm.features}
                onChange={e => setPlanForm(f => ({ ...f, features: e.target.value }))}
                placeholder="Vitrine digital básica&#10;Até 10 produtos"
              />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Limitações (um por linha)</label>
              <textarea
                className="w-full min-h-[50px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={planForm.limitations}
                onChange={e => setPlanForm(f => ({ ...f, limitations: e.target.value }))}
                placeholder="Sem relatórios avançados"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={planForm.active} onCheckedChange={v => setPlanForm(f => ({ ...f, active: v }))} />
                Ativo
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={planForm.popular} onCheckedChange={v => setPlanForm(f => ({ ...f, popular: v }))} />
                Popular
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSavePlan} disabled={savingPlans} className="gap-1">
              {savingPlans ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── REFERRAL CAMPAIGN ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Gift className="h-5 w-5 text-primary" />
                Regras de Indicação
              </CardTitle>
              <CardDescription>Valores de bonificação — fonte única de verdade para cálculos de cashback e saldo</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Ativa</span>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <Badge variant={isActive ? 'default' : 'secondary'}>
                {isActive ? 'Ativa' : 'Inativa'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">💰 Comprador (R$)</label>
              <Input type="number" step="0.01" min="0" value={rewardBuyer} onChange={e => setRewardBuyer(e.target.value)} placeholder="5.00" />
              <p className="text-[10px] text-muted-foreground mt-1">Liberado após 1ª compra</p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">🔧 Prestador (R$)</label>
              <Input type="number" step="0.01" min="0" value={rewardSeller} onChange={e => setRewardSeller(e.target.value)} placeholder="15.00" />
              <p className="text-[10px] text-muted-foreground mt-1">Liberado após 1ª venda</p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">🎁 Bônus Extra Total (R$)</label>
              <Input type="number" step="0.01" min="0" value={rewardMixed} onChange={e => setRewardMixed(e.target.value)} placeholder="25.00" />
              <p className="text-[10px] text-muted-foreground mt-1">Compra + Venda + Bônus Extra restante (perfil Prestador que também compra)</p>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
            <p><strong>Indicado Prestador (régua de mérito):</strong> 1) libera R$ {rewardBuyer} na 1ª compra → 2) libera R$ {rewardSeller} na 1ª venda → 3) libera Bônus Extra de R$ {(parseFloat(rewardMixed || '0') - parseFloat(rewardBuyer || '0') - parseFloat(rewardSeller || '0')).toFixed(2)} ao concluir ambas.</p>
            <p><strong>Indicado Comprador:</strong> 100% (R$ {rewardBuyer}) após a 1ª compra confirmada.</p>
            <p><strong>Telas de cadastro e informativos refletem esses valores em tempo real.</strong></p>
          </div>

          {campaign?.updated_at && (
            <p className="text-[10px] text-muted-foreground">
              Última atualização: {new Date(campaign.updated_at).toLocaleString('pt-BR')}
            </p>
          )}

          <Button onClick={saveCampaign} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar Regras de Indicação
          </Button>
        </CardContent>
      </Card>

      {/* Referral Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Users, label: 'Total Indicações', value: summary.total, color: 'bg-primary/10 text-primary' },
          { icon: Clock, label: 'Pendentes', value: summary.pending + summary.partial, color: 'bg-amber-500/10 text-amber-600' },
          { icon: TrendingUp, label: 'Ativados', value: summary.activated, color: 'bg-green-500/10 text-green-600' },
          { icon: DollarSign, label: 'Total Pago', value: `R$ ${summary.totalPaid.toFixed(2)}`, color: 'bg-blue-500/10 text-blue-600' },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-3 flex items-center gap-3">
              <div className={`h-9 w-9 rounded-full ${stat.color} flex items-center justify-center`}>
                <stat.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-lg font-bold">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Referrals Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Indicações Registradas
          </CardTitle>
          <CardDescription>Todas as indicações do sistema — status e valores sincronizados com a campanha ativa</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingReferrals ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : referrals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma indicação registrada ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Indicador</TableHead>
                    <TableHead>Indicado</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Fases</TableHead>
                    <TableHead>Pago</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {referrals.map(ref => (
                    <TableRow key={ref.id}>
                      <TableCell className="text-sm font-medium">{ref.referrer_name}</TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{ref.referred_name || '—'}</p>
                          <p className="text-[10px] text-muted-foreground">{ref.referred_email || ''}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">{roleLabel(ref.referred_role)}</Badge>
                      </TableCell>
                      <TableCell>{statusBadge(ref.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {ref.buyer_released && <Badge variant="outline" className="text-[9px] bg-green-50 text-green-700">Compra ✓</Badge>}
                          {ref.seller_released && <Badge variant="outline" className="text-[9px] bg-green-50 text-green-700">Venda ✓</Badge>}
                          {ref.bonus_released && <Badge variant="outline" className="text-[9px] bg-purple-50 text-purple-700">Bônus ✓</Badge>}
                          {!ref.buyer_released && !ref.seller_released && <span className="text-[10px] text-muted-foreground">Aguardando</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-green-600">R$ {Number(ref.total_paid).toFixed(2)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">R$ {Number(ref.commission_amount).toFixed(2)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(ref.created_at).toLocaleDateString('pt-BR')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
