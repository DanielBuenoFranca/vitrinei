import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
}

interface Provider {
  id: number;
  name: string;
  segment: string;
}

interface ServiceFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  service?: DynamicService | null;
  providers: Provider[];
}

const SEGMENTS = [
  'manutencao', 'saude_clinica', 'bem_estar', 'beleza', 'casa', 'auto',
  'digital', 'tech', 'educacao', 'pet', 'eventos', 'musica', 'natureza',
];

export function ServiceForm({ open, onClose, onSaved, service, providers }: ServiceFormProps) {
  const isEdit = !!service;
  const [form, setForm] = useState({
    name: '', segment: 'manutencao', provider: '', provider_id: null as number | null,
    price: 0, rating: 4.5, distance: '2 km', time: '45 min', products: '',
    service_id: Math.floor(Math.random() * 9000) + 1000,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (service) {
      setForm({
        name: service.name, segment: service.segment, provider: service.provider,
        provider_id: service.provider_id, price: service.price, rating: service.rating,
        distance: service.distance, time: service.time,
        products: (service.products || []).join(', '), service_id: service.service_id,
      });
    } else {
      setForm({ name: '', segment: 'manutencao', provider: '', provider_id: null, price: 0, rating: 4.5, distance: '2 km', time: '45 min', products: '', service_id: Math.floor(Math.random() * 9000) + 1000 });
    }
  }, [service, open]);

  const handleProviderSelect = (providerId: string) => {
    const prov = providers.find(p => p.id === Number(providerId));
    if (prov) {
      setForm(f => ({ ...f, provider: prov.name, provider_id: prov.id, segment: prov.segment }));
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Nome é obrigatório'); return; }
    if (!form.provider.trim()) { toast.error('Prestador é obrigatório'); return; }
    setSaving(true);
    const productsArray = form.products.split(',').map(t => t.trim()).filter(Boolean);
    const data = {
      name: form.name, segment: form.segment, provider: form.provider,
      provider_id: form.provider_id, price: form.price, rating: form.rating,
      distance: form.distance, time: form.time, products: productsArray,
      service_id: form.service_id,
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
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Serviço' : 'Novo Serviço'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Nome *</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome do serviço" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Segmento</Label>
              <Select value={form.segment} onValueChange={v => setForm(f => ({ ...f, segment: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SEGMENTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Preço (R$)</Label>
              <Input type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Prestador *</Label>
            {providers.length > 0 ? (
              <Select value={form.provider_id ? String(form.provider_id) : ''} onValueChange={handleProviderSelect}>
                <SelectTrigger><SelectValue placeholder="Selecione um prestador" /></SelectTrigger>
                <SelectContent>
                  {providers.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name} ({p.segment})</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <Input value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))} placeholder="Nome do prestador" />
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
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
          <div className="grid gap-2">
            <Label>Produtos (separados por vírgula)</Label>
            <Input value={form.products} onChange={e => setForm(f => ({ ...f, products: e.target.value }))} placeholder="Produto A, Produto B" />
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
