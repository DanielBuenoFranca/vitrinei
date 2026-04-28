import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Package, Wrench, Plus, X, Box, Loader2, Search, Boxes } from 'lucide-react';

interface KitBuilderProps {
  open: boolean;
  onClose: () => void;
  providerId: number;
  providerName: string;
  onCreated?: () => void;
}

type ItemKind = 'product' | 'service';
interface PoolItem {
  id: number;
  name: string;
  price: number;
  unit: string;
  provider_id: number;
  provider: string;
  kind: ItemKind;
  quantity: number;
}
interface KitComponent {
  source_kind: ItemKind;
  source_item_id: number;
  source_provider_id: number;
  quantity_per_kit: number;
  agreed_unit_cost: number;
  snapshot_name: string;
  is_third_party: boolean;
  available: number;
}

export function KitBuilder({ open, onClose, providerId, providerName, onCreated }: KitBuilderProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [laborCost, setLaborCost] = useState('');
  const [initialQty, setInitialQty] = useState('1');
  const [components, setComponents] = useState<KitComponent[]>([]);
  const [pool, setPool] = useState<PoolItem[]>([]);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'own' | 'third'>('own');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(''); setDescription(''); setPrice(''); setLaborCost('');
    setInitialQty('1'); setComponents([]); setSearch('');
    (async () => {
      setLoading(true);
      const [{ data: prods }, { data: servs }] = await Promise.all([
        supabase.from('dynamic_products').select('id,name,price,unit,provider_id,provider,quantity'),
        supabase.from('dynamic_services').select('id,name,price,unit,provider_id,provider,quantity'),
      ]);
      const items: PoolItem[] = [
        ...(prods || []).map((p: any) => ({ ...p, kind: 'product' as ItemKind, quantity: p.quantity ?? 0 })),
        ...(servs || []).map((s: any) => ({ ...s, kind: 'service' as ItemKind, quantity: s.quantity ?? 0 })),
      ];
      setPool(items);
      setLoading(false);
    })();
  }, [open]);

  const filtered = useMemo(() => {
    const isOwn = tab === 'own';
    return pool
      .filter(it => isOwn ? it.provider_id === providerId : it.provider_id !== providerId)
      .filter(it => !search || it.name.toLowerCase().includes(search.toLowerCase()) || (it.provider || '').toLowerCase().includes(search.toLowerCase()))
      .slice(0, 80);
  }, [pool, tab, search, providerId]);

  const addComponent = (it: PoolItem) => {
    if (components.find(c => c.source_kind === it.kind && c.source_item_id === it.id)) {
      toast.info('Item já adicionado ao Kit'); return;
    }
    setComponents(prev => [...prev, {
      source_kind: it.kind,
      source_item_id: it.id,
      source_provider_id: it.provider_id,
      quantity_per_kit: 1,
      agreed_unit_cost: it.price || 0,
      snapshot_name: it.name,
      is_third_party: it.provider_id !== providerId,
      available: it.quantity,
    }]);
  };

  const updateComp = (idx: number, patch: Partial<KitComponent>) => {
    setComponents(prev => prev.map((c, i) => i === idx ? { ...c, ...patch } : c));
  };
  const removeComp = (idx: number) => setComponents(prev => prev.filter((_, i) => i !== idx));

  const totalComponentsCost = components.reduce((sum, c) => sum + (c.agreed_unit_cost * c.quantity_per_kit), 0);
  const suggestedPrice = totalComponentsCost + (parseFloat(laborCost) || 0);

  const save = async () => {
    if (!name.trim()) { toast.error('Nome do Kit é obrigatório'); return; }
    if (components.length === 0) { toast.error('Adicione ao menos 1 componente'); return; }
    const finalPrice = parseFloat(price) || suggestedPrice;
    if (finalPrice <= 0) { toast.error('Preço final do Kit deve ser positivo'); return; }
    setSaving(true);
    try {
      const { data, error } = await (supabase as any).rpc('create_kit_acid', {
        _owner_provider_id: providerId,
        _name: name,
        _description: description,
        _price: finalPrice,
        _labor_cost: parseFloat(laborCost) || 0,
        _initial_quantity: parseInt(initialQty, 10) || 0,
        _items: components.map(c => ({
          source_kind: c.source_kind,
          source_item_id: c.source_item_id,
          source_provider_id: c.source_provider_id,
          quantity_per_kit: c.quantity_per_kit,
          agreed_unit_cost: c.agreed_unit_cost,
          snapshot_name: c.snapshot_name,
        })),
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        setSaving(false); return;
      }
      toast.success(`Kit "${name}" criado com sucesso!`);
      onCreated?.();
      onClose();
    } catch (e: any) {
      toast.error(`Erro ao criar Kit: ${e.message || e}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Boxes className="h-5 w-5 text-primary" />
            Montar Kit — {providerName}
          </DialogTitle>
          <DialogDescription>
            Combine produtos e serviços (próprios ou de outros prestadores) em um novo item de estoque.
            Componentes próprios são debitados ao gerar o Kit; componentes de terceiros são liquidados via cashback B2B no momento da venda.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: Kit metadata + components list */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Nome do Kit *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Kit Manutenção Básica" />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="O que esse kit oferece?" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Mão de obra (R$)</Label>
                <Input type="number" min={0} step={0.01} value={laborCost} onChange={e => setLaborCost(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Preço final (R$)</Label>
                <Input type="number" min={0} step={0.01} value={price} onChange={e => setPrice(e.target.value)} placeholder={suggestedPrice.toFixed(2)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Qtd inicial</Label>
                <Input type="number" min={0} value={initialQty} onChange={e => setInitialQty(e.target.value)} />
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Custo dos componentes: <span className="font-semibold text-foreground">R$ {totalComponentsCost.toFixed(2)}</span> · Sugerido: R$ {suggestedPrice.toFixed(2)}
            </div>

            <Card className="p-3 max-h-[320px] overflow-y-auto">
              <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Package className="h-4 w-4" /> Componentes do Kit ({components.length})
              </div>
              {components.length === 0 && (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  Nenhum item adicionado. Selecione na lista ao lado →
                </p>
              )}
              <div className="space-y-2">
                {components.map((c, i) => (
                  <div key={i} className={`p-2 rounded border ${c.is_third_party ? 'border-amber-300 bg-amber-50/40' : 'border-emerald-300 bg-emerald-50/40'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 text-xs">
                          {c.source_kind === 'service' ? <Wrench className="h-3 w-3" /> : <Package className="h-3 w-3" />}
                          <span className="font-medium truncate">{c.snapshot_name}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {c.is_third_party ? '🤝 Terceiro' : '🏠 Próprio'} · disp: {c.available}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeComp(i)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-1 mt-2">
                      <div>
                        <Label className="text-[10px]">Qtd / kit</Label>
                        <Input type="number" min={1} value={c.quantity_per_kit}
                          onChange={e => updateComp(i, { quantity_per_kit: Math.max(1, parseInt(e.target.value) || 1) })}
                          className="h-7 text-xs" />
                      </div>
                      <div>
                        <Label className="text-[10px]">Custo unit. (R$)</Label>
                        <Input type="number" min={0} step={0.01} value={c.agreed_unit_cost}
                          onChange={e => updateComp(i, { agreed_unit_cost: parseFloat(e.target.value) || 0 })}
                          className="h-7 text-xs" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right: Pool of available items */}
          <div className="space-y-2">
            <Tabs value={tab} onValueChange={(v) => setTab(v as 'own' | 'third')}>
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="own">🏠 Meu estoque</TabsTrigger>
                <TabsTrigger value="third">🤝 De terceiros</TabsTrigger>
              </TabsList>
              <div className="relative mt-2">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input placeholder="Buscar item ou prestador..." value={search} onChange={e => setSearch(e.target.value)} className="pl-7 h-8 text-xs" />
              </div>
              <TabsContent value={tab} className="mt-2">
                <ScrollArea className="h-[420px] border rounded p-1">
                  {loading && (
                    <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
                  )}
                  {!loading && filtered.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-8">
                      {tab === 'own' ? 'Sem itens próprios.' : 'Nenhum item de terceiros encontrado.'}
                    </p>
                  )}
                  <div className="space-y-1">
                    {filtered.map(it => (
                      <button key={`${it.kind}-${it.id}`}
                        onClick={() => addComponent(it)}
                        className="w-full text-left p-2 rounded border hover:bg-accent transition-colors flex items-center gap-2">
                        {it.kind === 'service' ? <Wrench className="h-3 w-3 text-blue-600" /> : <Package className="h-3 w-3 text-emerald-600" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{it.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {it.provider} · R$ {Number(it.price || 0).toFixed(2)} · est: {it.quantity}
                          </p>
                        </div>
                        <Plus className="h-3 w-3 text-primary" />
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
            <div className="flex flex-wrap gap-1 text-[10px]">
              <Badge variant="outline" className="border-emerald-300 text-emerald-700">Próprio: debita ao gerar Kit</Badge>
              <Badge variant="outline" className="border-amber-300 text-amber-700">Terceiro: liquida via cashback B2B na venda</Badge>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-3">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={save} disabled={saving || components.length === 0}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Box className="h-4 w-4 mr-2" />}
            Criar Kit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
