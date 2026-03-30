import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNameSuggestion } from '@/hooks/useNameSuggestion';
import { NameSuggestions } from '@/components/admin/NameSuggestions';

interface DynamicProduct {
  id: number;
  product_id: number;
  name: string;
  price: number;
  provider: string;
  provider_id: number | null;
  stock_type: string;
  rating: number;
  distance: string;
  tags: string[];
}

interface Provider {
  id: number;
  name: string;
  segment: string;
}

interface ProductFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  product?: DynamicProduct | null;
  providers: Provider[];
}

export function ProductForm({ open, onClose, onSaved, product, providers }: ProductFormProps) {
  const isEdit = !!product;
  const [form, setForm] = useState({
    name: '', price: 0, provider: '', provider_id: null as number | null,
    stock_type: 'fisico', rating: 4.5, distance: '2 km', tags: '',
    product_id: Math.floor(Math.random() * 9000) + 1000,
  });
  const [saving, setSaving] = useState(false);
  const [allProductNames, setAllProductNames] = useState<string[]>([]);
  const { suggestions, loading: sugLoading, suggest, clear: clearSuggestions } = useNameSuggestion();

  useEffect(() => {
    if (open) {
      supabase.from('dynamic_products').select('name').then(({ data }) => {
        setAllProductNames((data || []).map((d: any) => d.name));
      });
    }
  }, [open]);

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name, price: product.price, provider: product.provider,
        provider_id: product.provider_id, stock_type: product.stock_type,
        rating: product.rating, distance: product.distance,
        tags: (product.tags || []).join(', '), product_id: product.product_id,
      });
    } else {
      setForm({ name: '', price: 0, provider: '', provider_id: null, stock_type: 'fisico', rating: 4.5, distance: '2 km', tags: '', product_id: Math.floor(Math.random() * 9000) + 1000 });
    }
  }, [product, open]);

  const handleProviderSelect = (providerId: string) => {
    const prov = providers.find(p => p.id === Number(providerId));
    if (prov) {
      setForm(f => ({ ...f, provider: prov.name, provider_id: prov.id }));
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Nome é obrigatório'); return; }
    if (!form.provider.trim()) { toast.error('Fornecedor é obrigatório'); return; }
    setSaving(true);
    const tagsArray = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    const data = {
      name: form.name, price: form.price, provider: form.provider,
      provider_id: form.provider_id, stock_type: form.stock_type,
      rating: form.rating, distance: form.distance, tags: tagsArray,
      product_id: form.product_id, related_service_ids: [] as number[],
    };
    if (isEdit) {
      const { error } = await supabase.from('dynamic_products').update(data).eq('id', product!.id);
      if (error) { toast.error('Erro ao atualizar'); setSaving(false); return; }
      toast.success('Produto atualizado');
    } else {
      const { error } = await supabase.from('dynamic_products').insert(data);
      if (error) { toast.error('Erro ao criar'); setSaving(false); return; }
      toast.success('Produto criado');
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Nome *</Label>
            <Input value={form.name} onChange={e => { setForm(f => ({ ...f, name: e.target.value })); suggest(e.target.value, 'product', allProductNames); }} placeholder="Nome do produto" />
            <NameSuggestions suggestions={suggestions} loading={sugLoading} onSelect={(n) => { setForm(f => ({ ...f, name: n })); clearSuggestions(); }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Preço (R$)</Label>
              <Input type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div className="grid gap-2">
              <Label>Tipo de Estoque</Label>
              <Select value={form.stock_type} onValueChange={v => setForm(f => ({ ...f, stock_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fisico">Físico</SelectItem>
                  <SelectItem value="drop">Dropshipping</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Prestador / Fornecedor *</Label>
            {providers.length > 0 ? (
              <Select value={form.provider_id ? String(form.provider_id) : ''} onValueChange={handleProviderSelect}>
                <SelectTrigger><SelectValue placeholder="Selecione um prestador" /></SelectTrigger>
                <SelectContent>
                  {providers.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name} ({p.segment})</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <Input value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))} placeholder="Nome do fornecedor" />
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Avaliação</Label>
              <Input type="number" step="0.1" min="0" max="5" value={form.rating} onChange={e => setForm(f => ({ ...f, rating: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div className="grid gap-2">
              <Label>Distância</Label>
              <Input value={form.distance} onChange={e => setForm(f => ({ ...f, distance: e.target.value }))} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Tags (separadas por vírgula)</Label>
            <Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="torneira, inox, cozinha" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
