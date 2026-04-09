import { useState, useEffect, useRef } from 'react';
import { maskPhone } from '@/lib/masks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, X, ImageIcon } from 'lucide-react';

interface Provider {
  id: number; name: string; type: string; segment: string[];
  phone: string | null; email: string | null; address: string | null; city: string | null;
  distance: string; rating: number; active: boolean; logo_url?: string | null;
  cpf_cnpj?: string | null;
}

interface Segment { id: number; name: string; }

interface ProviderFormProps {
  open: boolean; onClose: () => void; onSaved: () => void;
  provider?: Provider | null; segments: Segment[];
}

// CPF/CNPJ formatting
const formatCpfCnpj = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 11) {
    return digits.replace(/(\d{3})(\d{3})?(\d{3})?(\d{2})?/, (_, a, b, c, d) =>
      [a, b, c].filter(Boolean).join('.') + (d ? '-' + d : '')
    );
  }
  return digits.replace(/(\d{2})(\d{3})?(\d{3})?(\d{4})?(\d{2})?/, (_, a, b, c, d, e) =>
    a + (b ? '.' + b : '') + (c ? '.' + c : '') + (d ? '/' + d : '') + (e ? '-' + e : '')
  );
};

// CPF validation
const validateCpf = (cpf: string): boolean => {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
  let check = 11 - (sum % 11);
  if (check >= 10) check = 0;
  if (parseInt(digits[9]) !== check) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
  check = 11 - (sum % 11);
  if (check >= 10) check = 0;
  return parseInt(digits[10]) === check;
};

// CNPJ validation
const validateCnpj = (cnpj: string): boolean => {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length !== 14 || /^(\d)\1+$/.test(digits)) return false;
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(digits[i]) * weights1[i];
  let check = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (parseInt(digits[12]) !== check) return false;
  sum = 0;
  for (let i = 0; i < 13; i++) sum += parseInt(digits[i]) * weights2[i];
  check = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return parseInt(digits[13]) === check;
};

const validateCpfCnpj = (value: string): { valid: boolean; message: string } => {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) return { valid: true, message: '' };
  if (digits.length <= 11) {
    if (digits.length < 11) return { valid: false, message: 'CPF incompleto' };
    return validateCpf(digits) ? { valid: true, message: 'CPF válido ✓' } : { valid: false, message: 'CPF inválido' };
  }
  if (digits.length < 14) return { valid: false, message: 'CNPJ incompleto' };
  return validateCnpj(digits) ? { valid: true, message: 'CNPJ válido ✓' } : { valid: false, message: 'CNPJ inválido' };
};

export function ProviderForm({ open, onClose, onSaved, provider, segments }: ProviderFormProps) {
  const isEdit = !!provider;
  const [form, setForm] = useState({
    name: '', type: 'mei', phone: '', email: '',
    address: '', city: '', distance: '2 km', rating: 4.5, active: true,
  });
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [validateDoc, setValidateDoc] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (provider) {
      setForm({
        name: provider.name, type: provider.type,
        phone: provider.phone || '', email: provider.email || '',
        address: provider.address || '', city: provider.city || '',
        distance: provider.distance, rating: provider.rating, active: provider.active,
      });
      setSelectedSegments(Array.isArray(provider.segment) ? provider.segment : [provider.segment].filter(Boolean));
      setCpfCnpj(provider.cpf_cnpj || '');
      setLogoUrl((provider as any).logo_url || null);
    } else {
      setForm({ name: '', type: 'mei', phone: '', email: '', address: '', city: '', distance: '2 km', rating: 4.5, active: true });
      setSelectedSegments(segments[0] ? [segments[0].name] : []);
      setCpfCnpj('');
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

  const toggleSegment = (segName: string) => {
    setSelectedSegments(prev =>
      prev.includes(segName) ? prev.filter(s => s !== segName) : [...prev, segName]
    );
  };

  const generateAiLogo = async (name: string, segment: string): Promise<string | null> => {
    try {
      toast.info('🎨 Gerando arte com IA...');
      const { data, error } = await supabase.functions.invoke('generate-provider-logo', {
        body: { providerName: name, segment },
      });
      if (error || !data?.logoUrl) {
        console.error('AI logo error:', error || data);
        toast.warning('Não foi possível gerar arte automática');
        return null;
      }
      toast.success('🎨 Arte gerada pela IA!');
      return data.logoUrl;
    } catch (e) {
      console.error('AI logo error:', e);
      return null;
    }
  };

  const docValidation = validateCpfCnpj(cpfCnpj);
  const rawDigits = cpfCnpj.replace(/\D/g, '');

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Nome é obrigatório'); return; }
    if (selectedSegments.length === 0) { toast.error('Selecione ao menos um segmento'); return; }

    // CPF/CNPJ validation
    if (validateDoc && rawDigits.length > 0 && !docValidation.valid) {
      toast.error(docValidation.message);
      return;
    }

    // Uniqueness check by CPF/CNPJ
    if (rawDigits.length >= 11) {
      const { data: existing } = await supabase
        .from('providers')
        .select('id, name')
        .eq('cpf_cnpj', rawDigits)
        .neq('id', provider?.id || 0)
        .limit(1);
      if (existing && existing.length > 0) {
        toast.error(`CPF/CNPJ já cadastrado para: ${existing[0].name}`);
        return;
      }
    }

    setSaving(true);

    // Auto-generate logo if none provided
    let finalLogoUrl = logoUrl;
    if (!finalLogoUrl && form.name.trim()) {
      finalLogoUrl = await generateAiLogo(form.name.trim(), selectedSegments[0] || '');
      if (finalLogoUrl) setLogoUrl(finalLogoUrl);
    }

    const data: any = {
      ...form,
      segment: selectedSegments,
      cpf_cnpj: rawDigits || null,
      phone: form.phone || null,
      email: form.email || null,
      address: form.address || null,
      city: form.city || null,
      logo_url: finalLogoUrl,
    };

    if (isEdit) {
      const { error } = await supabase.from('providers').update(data).eq('id', provider!.id);
      if (error) { toast.error('Erro ao atualizar: ' + error.message); setSaving(false); return; }
      toast.success('Prestador atualizado');
    } else {
      const { error } = await supabase.from('providers').insert(data);
      if (error) {
        if (error.message?.includes('unique') || error.code === '23505') {
          toast.error('CPF/CNPJ já cadastrado na plataforma');
        } else {
          toast.error('Erro ao criar: ' + error.message);
        }
        setSaving(false);
        return;
      }
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

          {/* CPF/CNPJ */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>CPF / CNPJ</Label>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="validate-doc"
                  checked={validateDoc}
                  onCheckedChange={(v) => setValidateDoc(!!v)}
                />
                <Label htmlFor="validate-doc" className="text-xs text-muted-foreground cursor-pointer">
                  Validar documento
                </Label>
              </div>
            </div>
            <Input
              value={formatCpfCnpj(cpfCnpj)}
              onChange={e => setCpfCnpj(e.target.value.replace(/\D/g, '').slice(0, 14))}
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
              maxLength={18}
            />
            {rawDigits.length > 0 && (
              <p className={`text-xs ${docValidation.valid ? 'text-green-600' : 'text-destructive'}`}>
                {docValidation.message}
              </p>
            )}
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
              <Label>Segmentos * <span className="text-xs text-muted-foreground font-normal">(múltiplos)</span></Label>
              <div className="flex flex-wrap gap-1.5 p-2 border rounded-md min-h-[40px] bg-background">
                {segments.map(s => (
                  <Badge
                    key={s.id}
                    variant={selectedSegments.includes(s.name) ? 'default' : 'outline'}
                    className="cursor-pointer text-xs transition-all"
                    onClick={() => toggleSegment(s.name)}
                  >
                    {s.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Telefone</Label>
              <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: maskPhone(e.target.value) }))} placeholder="(11) 99999-0000" />
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
