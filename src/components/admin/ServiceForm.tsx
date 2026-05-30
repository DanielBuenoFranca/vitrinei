import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { useNameSuggestion } from '@/hooks/useNameSuggestion';
import { NameSuggestions } from '@/components/admin/NameSuggestions';
import { ItemImagePicker } from '@/components/admin/ItemImagePicker';

interface DynamicService {
  id: number;
  service_id: number;
  name: string;
  segment: string;
  provider: string;
  provider_id: number | null;
  price: number;
  rating: number;
  distance: string;
  time: string;
  products: string[];
  labor_cost?: number;
  linked_product_ids?: number[];
}

interface Provider {
  id: number;
  name: string;
  segment: string[];
}

interface AvailableProduct {
  id: number;
  name: string;
  price: number;
  provider: string;
  provider_id: number | null;
  stock_type: string;
}

interface Segment {
  id: number;
  name: string;
}

interface ServiceFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  service?: DynamicService | null;
  providers: Provider[];
  segments: Segment[];
  highlightField?: string;
}

export function ServiceForm({ open, onClose, onSaved, service, providers, segments, highlightField }: ServiceFormProps) {
  const isEdit = !!service;
  const [form, setForm] = useState({
    name: '', segment: '', provider: '', provider_id: null as number | null,
    labor_cost: 0, rating: 4.5, distance: '2 km', time: '45 min',
    service_id: Math.floor(Math.random() * 9000) + 1000,
    unit: 'hr', quantity: 0,
  });
  const [linkedProductIds, setLinkedProductIds] = useState<number[]>([]);
  const [availableProducts, setAvailableProducts] = useState<AvailableProduct[]>([]);
  const [saving, setSaving] = useState(false);
  const [localIsEdit, setLocalIsEdit] = useState(false);
  const [allServiceNames, setAllServiceNames] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const lastSetImageUrl = useRef<string | null>(null);
  const hasLoadedRef = useRef<number | null>(null);

  useEffect(() => {
    if (open) {
      setLocalIsEdit(!!service && !!service.id);
    }
  }, [open, service]);
  const [imageBusy, setImageBusy] = useState(false);
  
  const handleImageUrlChange = (url: string | null) => {
    setImageUrl(url);
    lastSetImageUrl.current = url;
  };
  const { suggestions, loading: sugLoading, suggest, clear: clearSuggestions } = useNameSuggestion();

  useEffect(() => {
    if (open) {
      supabase.from('dynamic_services').select('name').then(({ data }) => {
        setAllServiceNames((data || []).map((d: any) => d.name));
      });
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      supabase.from('dynamic_products').select('id, name, price, provider, provider_id, stock_type')
        .then(({ data }) => setAvailableProducts((data as AvailableProduct[]) || []));
    }
  }, [open]);

  useEffect(() => {
    if (service) {
      setForm({
        name: service.name, segment: service.segment, provider: service.provider,
        provider_id: service.provider_id, labor_cost: service.labor_cost || 0,
        rating: service.rating, distance: service.distance, time: service.time,
        service_id: service.service_id,
        unit: (service as any).unit || 'hr',
        quantity: (service as any).quantity ?? 0,
      });
      setLinkedProductIds(service.linked_product_ids || []);
      if (!imageBusy) {
        const currentUrl = (service as any).image_url || null;
        const isNewItem = hasLoadedRef.current !== service.id;
        
        if (isNewItem) {
          setImageUrl(currentUrl);
          lastSetImageUrl.current = currentUrl;
          hasLoadedRef.current = service.id;
        } else if (!imageBusy && currentUrl !== lastSetImageUrl.current) {
          console.log('[ServiceForm] External image change detected, updating state:', currentUrl);
          setImageUrl(currentUrl);
          lastSetImageUrl.current = currentUrl;
        }
      }
    } else {
      setForm({ name: '', segment: segments[0]?.name || '', provider: '', provider_id: null, labor_cost: 0, rating: 4.5, distance: '2 km', time: '45 min', service_id: Math.floor(Math.random() * 9000) + 1000, unit: 'hr', quantity: 0 });
      setLinkedProductIds([]);
      setImageUrl(null);
    }
  }, [service, open, segments]);

  const handleProviderSelect = (providerId: string) => {
    const prov = providers.find(p => p.id === Number(providerId));
    if (prov) {
      const firstSeg = Array.isArray(prov.segment) ? prov.segment[0] || '' : prov.segment;
      setForm(f => ({ ...f, provider: prov.name, provider_id: prov.id, segment: firstSeg }));
    }
  };

  const toggleProduct = (productId: number) => {
    setLinkedProductIds(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const linkedProducts = availableProducts.filter(p => linkedProductIds.includes(p.id));
  const productsCost = linkedProducts.reduce((sum, p) => sum + p.price, 0);
  const totalPrice = form.labor_cost + productsCost;

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Nome é obrigatório'); return; }
    if (!form.provider.trim()) { toast.error('Prestador é obrigatório'); return; }
    if (!form.segment) { toast.error('Segmento é obrigatório'); return; }
    
    if (imageBusy) {
      toast.warning('Aguarde a conclusão da imagem antes de salvar');
      return;
    }

    setSaving(true);
    if (form.provider_id) {
      try {
        const { data: dup } = await (supabase as any).rpc('check_item_duplicate', {
          _provider_id: form.provider_id, _kind: 'service',
          _name: form.name, _unit: form.unit, _exclude_id: isEdit ? service!.id : null,
        });
        if (dup?.duplicate) {
          toast.error(`Serviço duplicado neste prestador: já existe "${dup.name}". Renomeie para diferenciar.`);
          setSaving(false); return;
        }
      } catch {}
    }
    const productsNames = linkedProducts.map(p => p.name);
    const data = {
      name: form.name, segment: form.segment, segments: [form.segment], provider: form.provider,
      provider_id: form.provider_id, price: totalPrice, rating: form.rating,
      distance: form.distance, time: form.time, products: productsNames,
      service_id: form.service_id, labor_cost: form.labor_cost,
      linked_product_ids: linkedProductIds,
      unit: form.unit, quantity: form.quantity,
      image_url: imageUrl,
    };
    if (isEdit) {
      const { error } = await supabase.from('dynamic_services').update(data).eq('id', service!.id);
      if (error) { toast.error('Erro ao atualizar'); setSaving(false); return; }
      toast.success('Serviço atualizado');
    } else {
      const { error } = await supabase.from('dynamic_services').insert(data);
      if (error) { toast.error('Erro ao criar'); setSaving(false); return; }
      toast.success('Serviço criado');
    }
    // Garante que o prestador esteja vinculado ao segmento do serviço
    if (form.provider_id && form.segment) {
      try {
        const prov = providers.find(p => p.id === form.provider_id);
        const current = Array.isArray(prov?.segment) ? (prov!.segment as string[]) : [];
        if (!current.includes(form.segment)) {
          const merged = Array.from(new Set([...current, form.segment]));
          await supabase.from('providers').update({ segment: merged }).eq('id', form.provider_id);
          const { data: provRow } = await supabase.from('providers').select('user_id').eq('id', form.provider_id).maybeSingle();
          if (provRow?.user_id) {
            await supabase.from('profiles').update({ provider_segments: merged, is_provider: true }).eq('user_id', provRow.user_id);
          }
        }
      } catch {}
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  useEffect(() => {
    if (open && highlightField) {
      setTimeout(() => {
        const el = document.getElementsByName(highlightField)[0] || 
                   document.getElementById(highlightField) ||
                   document.querySelector(`[data-fieldname="${highlightField}"]`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
            el.focus();
          }
          el.classList.add('ring-2', 'ring-destructive', 'ring-offset-2');
          setTimeout(() => el.classList.remove('ring-2', 'ring-destructive', 'ring-offset-2'), 3000);
        }
      }, 300);
    }
  }, [open, highlightField]);

  // Group products: provider's own stock, dropship, other providers
  const providerProducts = availableProducts.filter(p => p.provider_id === form.provider_id && p.stock_type !== 'drop');
  const dropProducts = availableProducts.filter(p => p.stock_type === 'drop');
  const otherProducts = availableProducts.filter(p => p.provider_id !== form.provider_id && p.stock_type !== 'drop');

  const renderProductGroup = (title: string, prods: AvailableProduct[]) => {
    if (prods.length === 0) return null;
    return (
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        {prods.map(p => (
          <label key={p.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/50 cursor-pointer text-sm">
            <Checkbox checked={linkedProductIds.includes(p.id)} onCheckedChange={() => toggleProduct(p.id)} />
            <span className="flex-1">{p.name}</span>
            <span className="text-muted-foreground text-xs">R$ {p.price.toFixed(2)}</span>
            {p.stock_type === 'drop' && <Badge variant="outline" className="text-[9px] py-0">Drop</Badge>}
          </label>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg p-0 flex flex-col max-h-[90vh] overflow-hidden">
        <div className="p-6 pb-2 shrink-0">
          <DialogHeader>
            <DialogTitle>{localIsEdit ? 'Editar Serviço' : 'Novo Serviço'}</DialogTitle>
          </DialogHeader>
        </div>
        <ScrollArea className="flex-1 px-6 admin-scroll-area">
          <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Nome *</Label>
            <Input value={form.name} onChange={e => { setForm(f => ({ ...f, name: e.target.value })); suggest(e.target.value, 'service', allServiceNames); }} placeholder="Nome do serviço" />
            <NameSuggestions suggestions={suggestions} loading={sugLoading} onSelect={(n) => { setForm(f => ({ ...f, name: n })); clearSuggestions(); }} />
          </div>
          <ItemImagePicker
            kind="service"
            id={service?.id}
            name={form.name}
            segment={form.segment}
            providerName={form.provider}
            unit={form.unit}
            price={form.labor_cost}
            linkedNames={availableProducts.filter(p => linkedProductIds.includes(p.id)).map(p => p.name)}
            imageUrl={imageUrl}
            onChange={handleImageUrlChange}
            onBusy={setImageBusy}
          />
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2" data-fieldname="segment">
              <Label>Segmento *</Label>
              <Select value={form.segment} onValueChange={v => setForm(f => ({ ...f, segment: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {segments.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2" data-fieldname="provider">
              <Label>Prestador *</Label>
              {providers.length > 0 ? (
                <Select value={form.provider_id ? String(form.provider_id) : ''} onValueChange={handleProviderSelect}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {providers.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Input value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))} placeholder="Nome do prestador" />
              )}
            </div>
          </div>

          {/* Products linking */}
          <div className="grid gap-2">
            <Label>Produtos Vinculados</Label>
            {linkedProducts.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-1">
                {linkedProducts.map(p => (
                  <Badge key={p.id} variant="secondary" className="gap-1 text-xs">
                    {p.name} (R$ {p.price.toFixed(2)})
                    <X className="h-3 w-3 cursor-pointer" onClick={() => toggleProduct(p.id)} />
                  </Badge>
                ))}
              </div>
            )}
            <div className="border rounded-md p-2 max-h-40 overflow-y-auto space-y-2">
              {availableProducts.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2">Nenhum produto cadastrado</p>
              ) : (
                <>
                  {renderProductGroup('📦 Estoque do Prestador', providerProducts)}
                  {renderProductGroup('🚚 Dropshipping', dropProducts)}
                  {renderProductGroup('🏪 Outros Prestadores', otherProducts)}
                </>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-2">
              <Label>Mão de Obra (R$)</Label>
              <Input name="labor_cost" type="number" step="0.01" value={form.labor_cost} onChange={e => setForm(f => ({ ...f, labor_cost: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div className="grid gap-2">
              <Label>Produtos (R$)</Label>
              <Input type="number" value={productsCost.toFixed(2)} disabled className="bg-muted" />
            </div>
            <div className="grid gap-2">
              <Label className="font-bold text-primary">Total (R$)</Label>
              <Input type="number" value={totalPrice.toFixed(2)} disabled className="bg-primary/10 font-bold" />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div className="grid gap-2">
              <Label>Qtd (capacidade)</Label>
              <Input type="number" min="0" step="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: parseInt(e.target.value, 10) || 0 }))} />
            </div>
            <div className="grid gap-2">
              <Label>Avaliação</Label>
              <Input type="number" step="0.1" min="0" max="5" value={form.rating} onChange={e => setForm(f => ({ ...f, rating: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div className="grid gap-2">
              <Label>Distância</Label>
              <Input value={form.distance} onChange={e => setForm(f => ({ ...f, distance: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Tempo</Label>
              <Input value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} placeholder="45 min" />
            </div>
          </div>
        </div>
        </ScrollArea>
        <DialogFooter className="p-6 pt-2 shrink-0 border-t">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : localIsEdit ? 'Salvar' : 'Criar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
