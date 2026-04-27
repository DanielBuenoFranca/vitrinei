/**
 * UserForm — Cadastro/edição UNIFICADA de usuário.
 * Substitui ProviderForm: quando o papel é 'provider' ou 'mixed',
 * exibe automaticamente o bloco de campos de prestador (validados,
 * sincronizados com a tabela providers via trigger no banco).
 */
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, X, ImageIcon, Loader2, ShoppingCart, Wrench, Shuffle, Shield, Crown } from 'lucide-react';
import { maskPhone, maskCPFCNPJ, unmask } from '@/lib/masks';

type AppRole = 'master' | 'admin' | 'provider' | 'client' | 'mixed';

interface Segment { id: number; name: string; }

interface UserFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  /** Profile + role atual quando edição. Null = novo. */
  profile?: any | null;
  currentRole?: AppRole | null;
  currentEmail?: string | null;
  segments: Segment[];
}

// ── Validações CPF/CNPJ (algoritmo oficial) ─────────────────────
const validateCpf = (cpf: string): boolean => {
  const d = cpf.replace(/\D/g, '');
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  let s = 0;
  for (let i = 0; i < 9; i++) s += +d[i] * (10 - i);
  let c = 11 - (s % 11); if (c >= 10) c = 0;
  if (+d[9] !== c) return false;
  s = 0;
  for (let i = 0; i < 10; i++) s += +d[i] * (11 - i);
  c = 11 - (s % 11); if (c >= 10) c = 0;
  return +d[10] === c;
};
const validateCnpj = (cnpj: string): boolean => {
  const d = cnpj.replace(/\D/g, '');
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
  const w1 = [5,4,3,2,9,8,7,6,5,4,3,2];
  const w2 = [6,5,4,3,2,9,8,7,6,5,4,3,2];
  let s = 0;
  for (let i = 0; i < 12; i++) s += +d[i] * w1[i];
  let c = s % 11 < 2 ? 0 : 11 - (s % 11);
  if (+d[12] !== c) return false;
  s = 0;
  for (let i = 0; i < 13; i++) s += +d[i] * w2[i];
  c = s % 11 < 2 ? 0 : 11 - (s % 11);
  return +d[13] === c;
};
const validateDoc = (raw: string): { valid: boolean; message: string } => {
  const d = raw.replace(/\D/g, '');
  if (d.length === 0) return { valid: true, message: '' };
  if (d.length <= 11) {
    if (d.length < 11) return { valid: false, message: 'CPF incompleto' };
    return validateCpf(d) ? { valid: true, message: 'CPF válido ✓' } : { valid: false, message: 'CPF inválido' };
  }
  if (d.length < 14) return { valid: false, message: 'CNPJ incompleto' };
  return validateCnpj(d) ? { valid: true, message: 'CNPJ válido ✓' } : { valid: false, message: 'CNPJ inválido' };
};

const ROLE_OPTIONS: { id: AppRole; label: string; icon: any; desc: string }[] = [
  { id: 'client',   label: 'Comprador',  icon: ShoppingCart, desc: 'Compra serviços e produtos' },
  { id: 'provider', label: 'Prestador',  icon: Wrench,       desc: 'Vende serviços/produtos com vitrine' },
  { id: 'mixed',    label: 'Misto',      icon: Shuffle,      desc: 'Compra e vende' },
  { id: 'admin',    label: 'Admin',      icon: Shield,       desc: 'Gerencia o sistema' },
  { id: 'master',   label: 'Master',     icon: Crown,        desc: 'Acesso total' },
];

export function UserForm({ open, onClose, onSaved, profile, currentRole, currentEmail, segments }: UserFormProps) {
  const isEdit = !!profile;

  // ── Estado: campos básicos ────────────────────────────────────
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<AppRole>('client');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [skipDocValidation, setSkipDocValidation] = useState(false);

  // ── Estado: bloco prestador (visível se role=provider/mixed) ─
  const [providerType, setProviderType] = useState<'mei' | 'pf'>('mei');
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [distance, setDistance] = useState('2 km');
  const [rating, setRating] = useState(4.5);
  const [providerActive, setProviderActive] = useState(true);
  const [authSplit5x, setAuthSplit5x] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);

  // ── Hidrata estado ao abrir ──────────────────────────────────
  useEffect(() => {
    if (!open) return;
    if (profile) {
      setName(profile.display_name || '');
      setEmail(currentEmail || '');
      setPassword('');
      setPhone(profile.phone || '');
      setRole(currentRole || 'client');
      setAvatarUrl(profile.avatar_url || '');
      setCity(profile.city || '');
      setAddress(profile.address || '');
      setCpfCnpj(profile.cpf_cnpj || '');
      setProviderType((profile.provider_type as any) || 'mei');
      setSelectedSegments(profile.provider_segments || []);
      setDistance(profile.distance || '2 km');
      setRating(profile.rating ?? 4.5);
      setProviderActive(profile.provider_active ?? true);
      setAuthSplit5x(profile.auth_split_5x ?? false);
      setLogoUrl(profile.logo_url || null);
    } else {
      setName(''); setEmail(''); setPassword(''); setPhone('');
      setRole('client'); setAvatarUrl(''); setCity(''); setAddress('');
      setCpfCnpj(''); setProviderType('mei');
      setSelectedSegments(segments[0] ? [segments[0].name] : []);
      setDistance('2 km'); setRating(4.5); setProviderActive(true);
      setAuthSplit5x(false); setLogoUrl(null);
    }
  }, [open, profile, currentRole, currentEmail, segments]);

  const isProviderRole = role === 'provider' || role === 'mixed';
  const docValidation = validateDoc(cpfCnpj);
  const rawDoc = cpfCnpj.replace(/\D/g, '');

  const toggleSegment = (n: string) => {
    setSelectedSegments(p => p.includes(n) ? p.filter(x => x !== n) : [...p, n]);
  };

  // ── Upload de logo ───────────────────────────────────────────
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Selecione uma imagem'); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error('Máximo 2MB'); return; }
    setUploading(true);
    const ext = file.name.split('.').pop() || 'png';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('provider-logos').upload(fileName, file, { upsert: true });
    if (error) { toast.error('Erro upload: ' + error.message); setUploading(false); return; }
    const { data } = supabase.storage.from('provider-logos').getPublicUrl(fileName);
    setLogoUrl(data.publicUrl);
    setUploading(false);
    toast.success('Logo enviado');
  };

  const generateAiLogo = async (n: string, seg: string): Promise<string | null> => {
    try {
      toast.info('🎨 Gerando arte com IA...');
      const { data, error } = await supabase.functions.invoke('generate-provider-logo', {
        body: { providerName: n, segment: seg },
      });
      if (error || !data?.logoUrl) return null;
      toast.success('Arte gerada');
      return data.logoUrl;
    } catch { return null; }
  };

  // ── Validação global antes de salvar ────────────────────────
  const validateBeforeSave = async (): Promise<string | null> => {
    if (!name.trim()) return 'Nome é obrigatório';
    if (!isEdit && !email.trim()) return 'E-mail é obrigatório';
    if (!isEdit && password.length < 6) return 'Senha deve ter no mínimo 6 caracteres';

    if (isProviderRole) {
      if (selectedSegments.length === 0) return 'Selecione ao menos um segmento';
      if (!skipDocValidation && rawDoc.length > 0 && !docValidation.valid) return docValidation.message;
      if (!skipDocValidation && rawDoc.length === 0) return 'CPF/CNPJ é obrigatório para Prestador (ou marque "Isento")';
    }

    // Unicidade global de CPF/CNPJ no profiles
    if (rawDoc.length >= 11) {
      const q = supabase.from('profiles').select('user_id, display_name').eq('cpf_cnpj_normalized', rawDoc).limit(1);
      const { data } = profile ? await q.neq('user_id', profile.user_id) : await q;
      if (data && data.length > 0) {
        return `CPF/CNPJ já cadastrado para "${data[0].display_name || 'outro usuário'}"`;
      }
    }
    return null;
  };

  // ── Save ─────────────────────────────────────────────────────
  const handleSave = async () => {
    const err = await validateBeforeSave();
    if (err) { toast.error(err); return; }

    setSaving(true);
    try {
      let userId = profile?.user_id;

      // 1) Criação de usuário (modo "novo")
      if (!isEdit) {
        const { data, error } = await supabase.functions.invoke('create-user', {
          body: {
            email: email.trim(),
            password,
            name: name.trim(),
            phone: phone.trim() || undefined,
            role,
          },
        });
        if (error || data?.error) {
          toast.error('Erro ao criar usuário: ' + (data?.error || error?.message));
          setSaving(false); return;
        }
        userId = data.user_id;
      } else {
        // Edição: atualizar role se mudou
        if (currentRole !== role) {
          // Remove papéis antigos não-master/admin do tipo cliente/prestador/misto
          const { data: existingRoles } = await supabase.from('user_roles').select('id, role').eq('user_id', userId);
          const businessRoles = ['client', 'provider', 'mixed'];
          const toRemove = existingRoles?.filter(r => businessRoles.includes(r.role)) || [];
          for (const r of toRemove) await supabase.from('user_roles').delete().eq('id', r.id);

          // Adiciona novo (admin/master mantidos via toggle separado)
          if (businessRoles.includes(role)) {
            await supabase.from('user_roles').insert({ user_id: userId, role });
          } else if (role === 'admin' || role === 'master') {
            const has = existingRoles?.some(r => r.role === role);
            if (!has) await supabase.from('user_roles').insert({ user_id: userId, role });
          }
        }

        // Email mudou?
        if (email.trim() && email.trim() !== (currentEmail || '')) {
          const { error: emErr } = await supabase.functions.invoke('update-user-email', {
            body: { user_id: userId, new_email: email.trim() },
          });
          if (emErr) { toast.error('Erro alterar e-mail'); setSaving(false); return; }
        }
      }

      // 2) Auto-gerar logo se prestador sem logo
      let finalLogo = logoUrl;
      if (isProviderRole && !finalLogo && name.trim()) {
        finalLogo = await generateAiLogo(name.trim(), selectedSegments[0] || 'Geral');
      }

      // 3) Atualiza profile (trigger sincroniza providers)
      const profileData: any = {
        display_name: name.trim(),
        phone: phone.trim() || null,
        avatar_url: avatarUrl.trim() || null,
        city: city.trim() || null,
        address: address.trim() || null,
        cpf_cnpj: rawDoc || null,
      };
      if (isProviderRole) {
        profileData.provider_type = providerType;
        profileData.provider_segments = selectedSegments;
        profileData.distance = distance;
        profileData.rating = rating;
        profileData.provider_active = providerActive;
        profileData.auth_split_5x = authSplit5x;
        profileData.logo_url = finalLogo;
        profileData.is_provider = true;
      }

      const { error: profErr } = await supabase.from('profiles').update(profileData).eq('user_id', userId);
      if (profErr) {
        if (profErr.message?.includes('idx_profiles_cpf_cnpj_norm') || profErr.code === '23505') {
          toast.error('CPF/CNPJ já cadastrado em outro usuário');
        } else {
          toast.error('Erro ao salvar perfil: ' + profErr.message);
        }
        setSaving(false); return;
      }

      toast.success(isEdit ? 'Usuário atualizado' : 'Usuário criado e ativado');
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error('Erro inesperado: ' + (e.message || 'desconhecido'));
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
          <DialogDescription>
            Cadastro unificado: ao escolher perfil <strong>Prestador</strong> ou <strong>Misto</strong>, a vitrine é provisionada automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-2">
          {/* ── Perfil de acesso ── */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">Perfil de Acesso *</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ROLE_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setRole(opt.id)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    role === opt.id
                      ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <opt.icon className={`w-4 h-4 ${role === opt.id ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-xs font-bold">{opt.label}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* ── Dados pessoais ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Nome Completo *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="Nome do usuário" />
            </div>
            <div>
              <Label>E-mail {!isEdit && '*'}</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@exemplo.com" disabled={isEdit && !!currentEmail && false} />
            </div>
            {!isEdit && (
              <div>
                <Label>Senha *</Label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
              </div>
            )}
            <div>
              <Label>Telefone</Label>
              <Input value={phone} onChange={e => setPhone(maskPhone(e.target.value))} placeholder="(00) 00000-0000" />
            </div>
            <div>
              <Label>Cidade</Label>
              <Input value={city} onChange={e => setCity(e.target.value)} placeholder="Cidade" />
            </div>
            <div>
              <Label>Endereço</Label>
              <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Rua, número" />
            </div>
            <div className="sm:col-span-2">
              <Label>URL do Avatar</Label>
              <Input value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} placeholder="https://..." />
            </div>
          </div>

          {/* ── CPF/CNPJ (sempre visível, OBRIGATÓRIO p/ prestador) ── */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label>CPF / CNPJ {isProviderRole && '*'}</Label>
              <div className="flex items-center gap-2">
                <Checkbox id="skip-doc" checked={skipDocValidation} onCheckedChange={v => setSkipDocValidation(!!v)} />
                <Label htmlFor="skip-doc" className="text-xs text-muted-foreground cursor-pointer">Isento / pular validação</Label>
              </div>
            </div>
            <Input
              value={maskCPFCNPJ(cpfCnpj)}
              onChange={e => setCpfCnpj(unmask(e.target.value).slice(0, 14))}
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
              maxLength={18}
            />
            {rawDoc.length > 0 && (
              <p className={`text-xs mt-1 ${docValidation.valid ? 'text-green-600' : 'text-destructive'}`}>
                {docValidation.message}
              </p>
            )}
          </div>

          {/* ── BLOCO PRESTADOR ── */}
          {isProviderRole && (
            <div className="space-y-4 p-4 rounded-lg border-2 border-primary/30 bg-primary/5">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold">Dados do Prestador</h3>
                <Badge variant="outline" className="text-[10px]">vitrine auto-criada</Badge>
              </div>

              {/* Logo */}
              <div>
                <Label>Logo / Foto da Vitrine</Label>
                <div className="flex items-center gap-3 mt-1.5">
                  {logoUrl ? (
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border">
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                      <button onClick={() => setLogoUrl(null)} type="button" className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted/30">
                      <ImageIcon className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    <Button variant="outline" size="sm" type="button" onClick={() => fileRef.current?.click()} disabled={uploading}>
                      <Upload className="w-3.5 h-3.5 mr-1.5" /> {uploading ? 'Enviando...' : 'Enviar imagem'}
                    </Button>
                    <p className="text-[10px] text-muted-foreground mt-1">Sem imagem? IA gera automaticamente.</p>
                  </div>
                </div>
              </div>

              {/* Tipo + Segmentos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Tipo</Label>
                  <Select value={providerType} onValueChange={v => setProviderType(v as 'mei' | 'pf')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mei">MEI</SelectItem>
                      <SelectItem value="pf">Pessoa Física</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Segmentos * <span className="text-xs text-muted-foreground">(múltiplos)</span></Label>
                  <div className="flex flex-wrap gap-1.5 p-2 border rounded-md min-h-[40px] bg-background">
                    {segments.length === 0 && <span className="text-xs text-muted-foreground">Cadastre segmentos primeiro</span>}
                    {segments.map(s => (
                      <Badge
                        key={s.id}
                        variant={selectedSegments.includes(s.name) ? 'default' : 'outline'}
                        className="cursor-pointer text-xs"
                        onClick={() => toggleSegment(s.name)}
                      >
                        {s.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Distância, avaliação, ativo, parcelamento */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <Label>Distância</Label>
                  <Input value={distance} onChange={e => setDistance(e.target.value)} placeholder="2 km" />
                </div>
                <div>
                  <Label>Avaliação</Label>
                  <Input type="number" step="0.1" min="0" max="5" value={rating} onChange={e => setRating(parseFloat(e.target.value) || 0)} />
                </div>
                <div>
                  <Label className="text-xs">Vitrine ativa</Label>
                  <div className="pt-2"><Switch checked={providerActive} onCheckedChange={setProviderActive} /></div>
                </div>
                <div>
                  <Label className="text-xs">Parcelamento 5x</Label>
                  <div className="pt-2"><Switch checked={authSplit5x} onCheckedChange={setAuthSplit5x} /></div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
            {isEdit ? 'Salvar' : 'Criar Usuário'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
