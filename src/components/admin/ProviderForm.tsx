import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, X, ImageIcon } from 'lucide-react';

interface Provider {
  id: number; name: string; type: string; segment: string;
  phone: string | null; email: string | null; address: string | null; city: string | null;
  distance: string; rating: number; active: boolean; logo_url?: string | null;
}

interface Segment { id: number; name: string; }

interface ProviderFormProps {
  open: boolean; onClose: () => void; onSaved: () => void;
  provider?: Provider | null; segments: Segment[];
}

export function ProviderForm({ open, onClose, onSaved, provider, segments }: ProviderFormProps) {
  const isEdit = !!provider;
  const [form, setForm] = useState({
    name: '', type: 'mei', segment: '', phone: '', email: '',
    address: '', city: '', distance: '2 km', rating: 4.5, active: true,
  });
  const [saving, setSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (provider) {
      setForm({
        name: provider.name, type: provider.type, segment: provider.segment,
        phone: provider.phone || '', email: provider.email || '',
        address: provider.address || '', city: provider.city || '',
        distance: provider.distance, rating: provider.rating, active: provider.active,
      });
      setLogoUrl((provider as any).logo_url || null);
    } else {
      setForm({ name: '', type: 'mei', segment: segments[0]?.name || '', phone: '', email: '', address: '', city: '', distance: '2 km', rating: 4.5, active: true });
      setLogoUrl(null);
    }
  }, [provider, open, segments]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Selecione uma imagem'); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error('Imagem deve ter no máximo 2MB'); return; }

    setUploading(true);
    const ext = file.name.split('.').pop() || 'png';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage.from('provider-logos').upload(fileName, file, { upsert: true });
    if (error) { toast.error('Erro no upload: ' + error.message); setUploading(false); return; }

    const { data: urlData } = supabase.storage.from('provider-logos').getPublicUrl(fileName);
    setLogoUrl(urlData.publicUrl);
    setUploading(false);
    toast.success('Logo enviado!');
  };

  const removeLogo = () => setLogoUrl(null);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Nome é obrigatório'); return; }
    if (!form.segment) { toast.error('Segmento é obrigatório'); return; }
    setSaving(true);
    const data: any = { ...form, phone: form.phone || null, email: form.email || null, address: form.address || null, city: form.city || null, logo_url: logoUrl };
    if (isEdit) {
      const { error } = await supabase.from('providers').update(data).eq('id', provider!.id);
      if (error) { toast.error('Erro ao atualizar'); setSaving(false); return; }
      toast.success('Prestador atualizado');
    } else {
      const { error } = await supabase.from('providers').insert(data);
      if (error) { toast.error('Erro ao criar'); setSaving(false); return; }
      toast.success('Prestador criado');
    }
    setSaving(false); onSaved(); onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Prestador' : 'Novo Prestador'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          {/* Logo upload */}
          <div className="grid gap-2">
            <Label>Logo / Foto</Label>
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-border">
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  <button onClick={removeLogo} className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted/30">
                  <ImageIcon className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
              <div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  <Upload className="w-3.5 h-3.5" /> {uploading ? 'Enviando...' : 'Enviar imagem'}
                </Button>
                <p className="text-[10px] text-muted-foreground mt-1">JPG, PNG até 2MB</p>
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Nome *</Label>
            <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nome do prestador" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mei">MEI</SelectItem>
                  <SelectItem value="pf">Pessoa Física</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Segmento *</Label>
              <Select value={form.segment} onValueChange={v => setForm(f => ({ ...f, segment: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {segments.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Telefone</Label>
              <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="(11) 99999-0000" />
            </div>
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.com" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Endereço</Label>
              <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Cidade</Label>
              <Input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-2">
              <Label>Distância</Label>
              <Input value={form.distance} onChange={e => setForm(f => ({ ...f, distance: e.target.value }))} placeholder="2 km" />
            </div>
            <div className="grid gap-2">
              <Label>Avaliação</Label>
              <Input type="number" step="0.1" min="0" max="5" value={form.rating} onChange={e => setForm(f => ({ ...f, rating: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div className="grid gap-2">
              <Label>Ativo</Label>
              <div className="pt-2">
                <Switch checked={form.active} onCheckedChange={v => setForm(f => ({ ...f, active: v }))} />
              </div>
            </div>
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