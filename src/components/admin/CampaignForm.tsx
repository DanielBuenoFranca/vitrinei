import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Gift, Loader2, Save, Users, TrendingUp, DollarSign, Clock } from 'lucide-react';

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

  useEffect(() => {
    loadCampaign();
    loadReferrals();
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
      // Get referrer names from profiles
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
      case 'mixed': return 'Misto';
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
      {/* Campaign Config */}
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
              <label className="text-sm font-medium mb-1.5 block">
                💰 Comprador (R$)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={rewardBuyer}
                onChange={e => setRewardBuyer(e.target.value)}
                placeholder="5.00"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Liberado após 1ª compra</p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                🔧 Prestador (R$)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={rewardSeller}
                onChange={e => setRewardSeller(e.target.value)}
                placeholder="15.00"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Liberado após 1ª venda</p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                🔀 Misto Total (R$)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={rewardMixed}
                onChange={e => setRewardMixed(e.target.value)}
                placeholder="25.00"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Compra + Venda + Bônus restante</p>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
            <p><strong>Perfil Misto:</strong> Fase 1 (compra) = R$ {rewardBuyer} → Fase 2 (venda) = R$ {rewardSeller} → Bônus = R$ {(parseFloat(rewardMixed || '0') - parseFloat(rewardBuyer || '0') - parseFloat(rewardSeller || '0')).toFixed(2)}</p>
            <p><strong>Perfil Comprador:</strong> 100% (R$ {rewardBuyer}) após 1ª compra confirmada</p>
            <p><strong>Perfil Prestador:</strong> 100% (R$ {rewardSeller}) após 1ª venda confirmada</p>
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
