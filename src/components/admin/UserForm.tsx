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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, X, ImageIcon, Loader2, ShoppingCart, Wrench, Shuffle, Shield, Crown } from 'lucide-react';
import { maskPhone, maskCPFCNPJ, unmask, maskCEP, lookupCep, geocodeAddress } from '@/lib/masks';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';

type AppRole = 'master' | 'admin' | 'provider' | 'client' | 'mixed';
type ProfileType = 'client' | 'provider' | 'mixed';
type AdminLevel = 'none' | 'admin' | 'master';

interface Segment { id: number; name: string; }

interface UserFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  /** Profile + role atual quando edição. Null = novo. */
  profile?: any | null;
  /** Lista completa de papéis do usuário (para derivar perfil + papel admin). */
  currentRoles?: AppRole[] | null;
  /** @deprecated mantido para compat; preferir currentRoles. */
  currentRole?: AppRole | null;
  currentEmail?: string | null;
  segments: Segment[];
  highlightField?: string;
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

const PROFILE_OPTIONS: { id: ProfileType; label: string; icon: any; desc: string }[] = [
  { id: 'client',   label: 'Consumidor', icon: ShoppingCart, desc: 'Compra serviços e produtos' },
  { id: 'provider', label: 'Prestador',  icon: Wrench,       desc: 'Vende serviços/produtos com vitrine' },
  { id: 'mixed',    label: 'Misto',      icon: Shuffle,      desc: 'Prestador + Consumidor' },
];

const ADMIN_OPTIONS: { id: AdminLevel; label: string; icon: any; desc: string }[] = [
  { id: 'none',   label: 'Comum',  icon: ShoppingCart, desc: 'Sem privilégios administrativos' },
  { id: 'admin',  label: 'Admin',  icon: Shield,       desc: 'Gerencia operação e dados do sistema' },
  { id: 'master', label: 'Master', icon: Crown,        desc: 'Controle total do ecossistema' },
];

export function UserForm({ open, onClose, onSaved, profile, currentRoles, currentRole, currentEmail, segments, highlightField }: UserFormProps) {
  const isEdit = !!profile;

  // ── Estado: campos básicos ────────────────────────────────────
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [profileType, setProfileType] = useState<ProfileType>('client');
  const [adminLevel, setAdminLevel] = useState<AdminLevel>('none');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [cep, setCep] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [stateUf, setStateUf] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [cepLoading, setCepLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
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
  const [marginPct, setMarginPct] = useState<number>(30);
  const [profitPct, setProfitPct] = useState<number>(20);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [localIsEdit, setLocalIsEdit] = useState(false);

  useEffect(() => {
    if (open) {
      setLocalIsEdit(!!profile && !profile.__isLead);
    }
  }, [open, profile]);

  // ── Subscription plan ───────────────────────────────────────
  const { activePlans } = useSubscriptionPlans();
  const defaultPlanId = (() => {
    if (!activePlans.length) return 'prata';
    const sorted = [...activePlans].sort((a, b) => Number(a.price) - Number(b.price));
    return sorted[Math.floor(sorted.length / 2)]?.id || sorted[0].id;
  })();
  const [selectedPlanId, setSelectedPlanId] = useState<string>(defaultPlanId);
  useEffect(() => { if (!isEdit) setSelectedPlanId(defaultPlanId); }, [defaultPlanId, isEdit]);

  // ── Hidrata estado ao abrir ──────────────────────────────────
  useEffect(() => {
    if (!open) return;
    if (profile) {
      setName(profile.display_name || '');
      setEmail(currentEmail || '');
      setPassword('');
      setPhone(profile.phone || '');
      // Deriva perfil + papel admin a partir das roles atuais
      const isLead = !!profile.__isLead;
      const allRoles = isLead
        ? [] // Lead importado nunca tem roles em user_roles — ignora fallback de currentRole
        : ((currentRoles && currentRoles.length > 0)
            ? currentRoles
            : (currentRole ? [currentRole] : []));
      const derivedProfile: ProfileType = isLead
        // Lead importado: regra do importador → sempre Misto
        ? 'mixed'
        : allRoles.includes('mixed') ? 'mixed' :
          allRoles.includes('provider') && allRoles.includes('client') ? 'mixed' :
          allRoles.includes('provider') ? 'provider' :
          'client';
      const derivedAdmin: AdminLevel = isLead
        ? 'none'
        : allRoles.includes('master') ? 'master' :
          allRoles.includes('admin') ? 'admin' : 'none';
      setProfileType(derivedProfile);
      setAdminLevel(derivedAdmin);
      setAvatarUrl(profile.avatar_url || '');
      setCity(profile.city || '');
      setAddress(profile.address || '');
      setCpfCnpj(profile.cpf_cnpj || '');
      setSkipDocValidation((profile.cpf_cnpj || '').toString().toUpperCase() === 'ISENTO');
      setCep((profile as any).cep || '');
      setNeighborhood((profile as any).neighborhood || '');
      setStateUf((profile as any).state || '');
      setLatitude(profile.latitude != null ? Number(profile.latitude) : null);
      setLongitude(profile.longitude != null ? Number(profile.longitude) : null);
      setProviderType((profile.provider_type as any) || 'mei');
      setSelectedSegments(profile.provider_segments || []);
      setDistance(profile.distance || '2 km');
      setRating(profile.rating ?? 4.5);
      setProviderActive(profile.provider_active ?? true);
      setAuthSplit5x(profile.auth_split_5x ?? false);
      setLogoUrl(profile.logo_url || null);
      setMarginPct(Number(profile.margin_pct ?? 30));
      setProfitPct(Number(profile.profit_pct ?? 20));
      // Load current subscription
      if (profile.user_id && !String(profile.user_id).startsWith('lead-')) {
        supabase.from('subscriptions').select('plan').eq('user_id', profile.user_id).maybeSingle()
          .then(({ data }) => { if (data?.plan) setSelectedPlanId(data.plan); });
      }
    } else {
      setName(''); setEmail(''); setPassword(''); setPhone('');
      setProfileType('client'); setAdminLevel('none');
      setAvatarUrl(''); setCity(''); setAddress('');
      setCep(''); setNeighborhood(''); setStateUf('');
      setLatitude(null); setLongitude(null);
      setCpfCnpj(''); setSkipDocValidation(false); setProviderType('mei');
      setSelectedSegments(segments[0] ? [segments[0].name] : []);
      setDistance('2 km'); setRating(4.5); setProviderActive(true);
      setAuthSplit5x(false); setLogoUrl(null);
      setMarginPct(30); setProfitPct(20);
      setSelectedPlanId(defaultPlanId);
    }
  }, [open, profile, currentRole, currentRoles, currentEmail, segments, defaultPlanId]);

  // ── Destaque de campo (inconsistências) ─────────────────────────
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

  // Force business profile to 'client' for privileged accounts (Master/Admin)
  useEffect(() => {
    if (adminLevel !== 'none' && (profileType === 'provider' || profileType === 'mixed')) {
      setProfileType('client');
      // Only toast if it was a manual change or initial load of a provider promoted to admin
      if (open) {
        toast.info('Admins/Master não possuem loja pessoal; perfil ajustado para Consumidor.');
      }
    }
  }, [adminLevel, profileType, open]);

  const isProviderRole = (profileType === 'provider' || profileType === 'mixed') && adminLevel === 'none';
  const docValidation = validateDoc(cpfCnpj);
  const rawDoc = cpfCnpj.replace(/\D/g, '');

  const toggleSegment = (n: string) => {
    setSelectedSegments(p => p.includes(n) ? p.filter(x => x !== n) : [...p, n]);
  };

  // ── CEP auto-preenchimento + Geo ────────────────────────────
  const handleCepChange = async (raw: string) => {
    const masked = maskCEP(raw);
    setCep(masked);
    const d = raw.replace(/\D/g, '');
    if (d.length === 8) {
      setCepLoading(true);
      const info = await lookupCep(d);
      setCepLoading(false);
      if (info) {
        if (!address.trim()) setAddress(info.logradouro || '');
        setNeighborhood(info.bairro || '');
        if (!city.trim()) setCity(info.localidade || '');
        setStateUf(info.uf || '');
        // Geo em background
        setGeoLoading(true);
        const q = `${info.logradouro || ''}, ${info.bairro || ''}, ${info.localidade || ''}, ${info.uf || ''}, Brasil`;
        const geo = await geocodeAddress(q);
        if (geo) { setLatitude(geo.lat); setLongitude(geo.lon); }
        setGeoLoading(false);
        toast.success('Endereço preenchido pelo CEP');
      } else {
        toast.error('CEP não encontrado');
      }
    }
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
      toast.info('🎨 Gerando arte (modo economia)...');
      const { data, error } = await supabase.functions.invoke('sanitize-images', {
        body: { kind: 'provider', id: profile?.id || 0, name: n, segment: seg, currentImageUrl: logoUrl },
      });
      const url = (data as any)?.imageUrl || (data as any)?.logoUrl;
      if (error || !url) return null;
      toast.success((data as any)?.source === 'ai' ? 'Arte gerada (IA)' : 'Imagem aplicada (grátis)');
      return url;
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

    // Unicidade global de CPF/CNPJ no profiles (ISENTO sempre permitido)
    if (!skipDocValidation && rawDoc.length >= 11) {
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
      const isLead = !!profile?.__isLead || (typeof userId === 'string' && userId.startsWith('lead-'));
      const leadProviderId: number | null = profile?.__providerId ?? null;

      // ── LEAD importado (sem auth): atualiza diretamente a tabela providers ──
      if (isEdit && isLead) {
        if (!leadProviderId) { toast.error('Lead sem providerId — recarregue a lista'); setSaving(false); return; }
        // Logo: usa apenas o que foi enviado manualmente (geração automática removida).
        const finalLogo = logoUrl;
        const provUpdate: any = {
          name: name.trim(),
          phone: phone.trim() || null,
          email: email.trim() || null,
          cpf_cnpj: skipDocValidation ? 'ISENTO' : (rawDoc || null),
          city: city.trim() || null,
          address: address.trim() || null,
          logo_url: finalLogo,
          type: providerType,
          segment: selectedSegments,
          active: providerActive,
        };
        const { error: pErr } = await supabase.from('providers').update(provUpdate).eq('id', leadProviderId);
        if (pErr) { toast.error('Erro ao salvar lead: ' + pErr.message); setSaving(false); return; }
        toast.success('Lead atualizado. Use "Ativar" para criar a conta de acesso.');
        onSaved(); onClose(); setSaving(false); return;
      }

      // 1) Criação de usuário (modo "novo")
      if (!isEdit) {
        const { data, error } = await supabase.functions.invoke('create-user', {
          body: {
            email: email.trim(),
            password,
            name: name.trim(),
            phone: phone.trim() || undefined,
            role: profileType,
          },
        });
        if (error || data?.error) {
          toast.error('Erro ao criar usuário: ' + (data?.error || error?.message));
          setSaving(false); return;
        }
        userId = data.user_id;

        // Marcamos como não ativado para exigir ativação no primeiro login
        await supabase.from('profiles').update({ is_activated: false }).eq('user_id', userId);

        // Aplica papel administrativo se solicitado na criação
        if (adminLevel !== 'none' && userId) {
          await supabase.from('user_roles').insert({ user_id: userId, role: adminLevel });
        }
      } else {
        // Edição: sincroniza Perfil + Papel administrativo independentemente
        const { data: existingRoles } = await supabase.from('user_roles').select('id, role').eq('user_id', userId);

        // (a) Perfil de negócio: client / provider / mixed
        const businessRoles = ['client', 'provider', 'mixed'];
        const currentBusiness = existingRoles?.find(r => businessRoles.includes(r.role));
        if (!currentBusiness || currentBusiness.role !== profileType) {
          const toRemove = existingRoles?.filter(r => businessRoles.includes(r.role)) || [];
          for (const r of toRemove) await supabase.from('user_roles').delete().eq('id', r.id);
          await supabase.from('user_roles').insert({ user_id: userId, role: profileType });
        }

        // (b) Papel administrativo: none / admin / master
        const adminRoles = ['admin', 'master'];
        const currentAdmin = existingRoles?.find(r => adminRoles.includes(r.role))?.role as AdminLevel | undefined;
        const desired: AdminLevel = adminLevel;
        if ((currentAdmin || 'none') !== desired) {
          // Bloqueia remoção do último Master
          if (currentAdmin === 'master' && desired !== 'master') {
            const { count } = await supabase.from('user_roles').select('id', { count: 'exact', head: true }).eq('role', 'master');
            if ((count || 0) <= 1) {
              toast.error('Não é possível remover o último Master do sistema.');
              setSaving(false); return;
            }
          }
          // Remove o atual
          const toRemoveAdmin = existingRoles?.filter(r => adminRoles.includes(r.role)) || [];
          for (const r of toRemoveAdmin) await supabase.from('user_roles').delete().eq('id', r.id);
          // Adiciona o novo (se não for 'none')
          if (desired !== 'none') {
            await supabase.from('user_roles').insert({ user_id: userId, role: desired });
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

      // 2) Logo: usa apenas o que foi enviado manualmente (geração automática removida).
      const finalLogo = logoUrl;

      // 3) Atualiza profile (trigger sincroniza providers)
      const profileData: any = {
        display_name: name.trim(),
        phone: phone.trim() || null,
        avatar_url: avatarUrl.trim() || null,
        city: city.trim() || null,
        address: address.trim() || null,
        cep: cep.replace(/\D/g, '') || null,
        neighborhood: neighborhood.trim() || null,
        state: stateUf.trim() || null,
        cpf_cnpj: skipDocValidation ? 'ISENTO' : (rawDoc || null),
        latitude: latitude,
        longitude: longitude,
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
        profileData.margin_pct = Math.max(0, Math.min(500, Number(marginPct) || 0));
        profileData.profit_pct = Math.max(0, Math.min(500, Number(profitPct) || 0));
      } else {
        // Master/Admin users never have provider status or segments linked
        profileData.is_provider = false;
        profileData.provider_segments = null;
        profileData.provider_active = false;
      }

      const { data: updRows, error: profErr } = await supabase
        .from('profiles').update(profileData).eq('user_id', userId).select('user_id, provider_segments');
      if (profErr) {
        if (profErr.message?.includes('idx_profiles_cpf_cnpj_norm') || profErr.code === '23505') {
          toast.error('CPF/CNPJ já cadastrado em outro usuário');
        } else {
          toast.error('Erro ao salvar perfil: ' + profErr.message);
        }
        setSaving(false); return;
      }
      // Se o profile ainda não existir (caso raro: trigger handle_new_user falhou), faz upsert
      if (!updRows || updRows.length === 0) {
        const { error: upErr } = await supabase.from('profiles').upsert({ user_id: userId, ...profileData }, { onConflict: 'user_id' });
        if (upErr) { toast.error('Erro ao criar perfil: ' + upErr.message); setSaving(false); return; }
      }
      // Garantia extra: força gravação do array de segmentos (alguns triggers podem coalescer arrays vazios)
      if (isProviderRole && selectedSegments.length > 0) {
        await supabase.from('profiles').update({ provider_segments: selectedSegments, is_provider: true }).eq('user_id', userId);
        // Sincroniza também na tabela providers diretamente, caso o trigger não tenha atualizado
        await supabase.from('providers').update({ segment: selectedSegments }).eq('user_id', userId);
      }

      // 4) Persistir/atualizar assinatura (jornada Lead → Ativo)
      try {
        const planObj = activePlans.find(p => p.id === selectedPlanId);
        if (planObj && userId && !String(userId).startsWith('lead-')) {
          const { data: existingSub } = await supabase
            .from('subscriptions').select('id, plan').eq('user_id', userId).maybeSingle();
          if (!existingSub) {
            await supabase.from('subscriptions').insert({
              user_id: userId, plan: planObj.id, price: planObj.price, status: 'active',
            });
          } else if (existingSub.plan !== planObj.id) {
            await supabase.from('subscriptions').update({
              plan: planObj.id, price: planObj.price, status: 'active',
            }).eq('id', existingSub.id);
          }
        }
      } catch (e) { console.warn('subscription persist:', e); }

      toast.success(isEdit ? 'Usuário atualizado' : 'Usuário criado — jornada de Lead iniciada');
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error('Erro inesperado: ' + (e.message || 'desconhecido'));
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl p-0 flex flex-col max-h-[90vh] overflow-hidden">
        <div className="p-6 pb-2 shrink-0">
          <DialogHeader>
            <DialogTitle>{localIsEdit ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
            <DialogDescription>
              Cadastro unificado: ao escolher perfil <strong>Prestador</strong> ou <strong>Misto</strong>, a vitrine é provisionada automaticamente.
            </DialogDescription>
          </DialogHeader>
        </div>

        <ScrollArea className="flex-1 px-6 admin-scroll-area">
          <div className="grid gap-5 py-4">
          {/* ── Identidade do Usuário (CPF) ── */}
          <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-3">
            <p className="text-[11px] text-muted-foreground leading-snug">
              <strong className="text-foreground">Usuário</strong> = identidade única no ecossistema (CPF/CNPJ).
              Cada usuário tem <strong>um Perfil</strong> (o que faz no sistema) e, opcionalmente, um <strong>Papel administrativo</strong> (poderes de gestão).
            </p>
          </div>

          {/* ── Perfil (negócio) ── */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">Perfil *</Label>
            <p className="text-[11px] text-muted-foreground mb-2">Define o que o usuário faz no ecossistema.</p>
            <div className="grid grid-cols-3 gap-2">
              {PROFILE_OPTIONS.map(opt => {
                const disabled = adminLevel !== 'none' && (opt.id === 'provider' || opt.id === 'mixed');
                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => setProfileType(opt.id)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      profileType === opt.id
                        ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                        : 'border-border hover:border-primary/40'
                    } ${disabled ? 'opacity-40 cursor-not-allowed bg-muted' : ''}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <opt.icon className={`w-4 h-4 ${profileType === opt.id ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className="text-xs font-bold">{opt.label}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-tight">{opt.desc}</p>
                    {disabled && <p className="text-[8px] text-destructive font-bold mt-1">Bloqueado para Admin/Master</p>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Papel administrativo ── */}
          <div data-fieldname="adminLevel">
            <Label className="text-sm font-semibold mb-2 block">Papel Administrativo</Label>
            <p className="text-[11px] text-muted-foreground mb-2">Permissões de gestão — independente do Perfil. Padrão: Comum.</p>
            <div className="grid grid-cols-3 gap-2">
              {ADMIN_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setAdminLevel(opt.id)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    adminLevel === opt.id
                      ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-500/30'
                      : 'border-border hover:border-amber-500/40'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <opt.icon className={`w-4 h-4 ${adminLevel === opt.id ? 'text-amber-600' : 'text-muted-foreground'}`} />
                    <span className="text-xs font-bold">{opt.label}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* ── Plano de Assinatura ── */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">
              Plano de Assinatura * <span className="text-xs font-normal text-muted-foreground">(padrão = valor médio)</span>
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {activePlans.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPlanId(p.id)}
                  className={`p-2 rounded-lg border text-center transition-all ${
                    selectedPlanId === p.id
                      ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  <div className="text-base">{p.badge}</div>
                  <div className="text-xs font-bold">{p.name}</div>
                  <div className="text-xs text-primary font-bold">R$ {Number(p.price).toFixed(0)}</div>
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
              <Input name="phone" value={phone} onChange={e => setPhone(maskPhone(e.target.value))} placeholder="(00) 00000-0000" />
            </div>
            <div>
              <Label>CEP</Label>
              <div className="relative">
                <Input
                  value={cep}
                  onChange={e => handleCepChange(e.target.value)}
                  placeholder="00000-000"
                  maxLength={9}
                />
                {(cepLoading || geoLoading) && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                )}
              </div>
              {(latitude != null && longitude != null) && (
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  📍 {latitude.toFixed(4)}, {longitude.toFixed(4)}
                </p>
              )}
            </div>
            <div>
              <Label>Cidade</Label>
              <Input value={city} onChange={e => setCity(e.target.value)} placeholder="Cidade" />
            </div>
            <div className="sm:col-span-2">
              <Label>Endereço {neighborhood && <span className="text-xs text-muted-foreground">— {neighborhood}{stateUf && `/${stateUf}`}</span>}</Label>
              <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Rua, número, complemento" />
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
                <Checkbox id="skip-doc" checked={skipDocValidation} onCheckedChange={v => {
                  setSkipDocValidation(!!v);
                  if (v) setCpfCnpj('');
                }} />
                <Label htmlFor="skip-doc" className="text-xs text-muted-foreground cursor-pointer">Isento / pular validação</Label>
              </div>
            </div>
            <Input
              name="cpfCnpj"
              value={skipDocValidation ? 'ISENTO' : maskCPFCNPJ(cpfCnpj)}
              onChange={e => setCpfCnpj(unmask(e.target.value).slice(0, 14))}
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
              maxLength={18}
              disabled={skipDocValidation}
              className={skipDocValidation ? 'font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/20' : ''}
            />
            {!skipDocValidation && rawDoc.length > 0 && (
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
                <div data-fieldname="segments">
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

              {/* Margem & Lucro — usados no preço sugerido do CARDEX */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                <div>
                  <Label className="text-xs">% Margem (custo→venda)</Label>
                  <div className="relative">
                    <Input type="number" min="0" max="500" step="1" value={marginPct} onChange={e => setMarginPct(parseFloat(e.target.value) || 0)} className="pr-7" />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">Markup aplicado sobre o custo de entrada.</p>
                </div>
                <div>
                  <Label className="text-xs">% Lucro alvo</Label>
                  <div className="relative">
                    <Input type="number" min="0" max="500" step="1" value={profitPct} onChange={e => setProfitPct(parseFloat(e.target.value) || 0)} className="pr-7" />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">Lucro líquido alvo após custos. Usado no preço sugerido.</p>
                </div>
              </div>
            </div>
          )}
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 pt-2 shrink-0 border-t">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
            {localIsEdit ? 'Salvar' : 'Criar Usuário'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
