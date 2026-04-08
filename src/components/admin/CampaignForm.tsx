import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Gift, Loader2, Save } from 'lucide-react';

interface Campaign {
  id: string;
  reward_buyer: number;
  reward_seller: number;
  reward_mixed_total: number;
  is_active: boolean;
  updated_at: string;
}

export function CampaignForm() {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rewardBuyer, setRewardBuyer] = useState('5.00');
  const [rewardSeller, setRewardSeller] = useState('15.00');
  const [rewardMixed, setRewardMixed] = useState('25.00');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    loadCampaign();
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
      toast.success('Campanha atualizada com sucesso!');
      loadCampaign();
    } catch (e: any) {
      toast.error('Erro: ' + (e.message || 'desconhecido'));
    }
    setSaving(false);
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Campanha de Indicação
            </CardTitle>
            <CardDescription>Configure os valores de recompensa por perfil de indicado</CardDescription>
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
          Salvar Campanha
        </Button>
      </CardContent>
    </Card>
  );
}
