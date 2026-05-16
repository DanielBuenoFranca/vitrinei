import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Trash2, RefreshCw, Database, Package, Users, Plus, Pencil, Store, Tag, AlertTriangle, FileSpreadsheet, UserCog, Shield, Ruler, Sparkles, Loader2, Crown, ShoppingCart, Wrench, Shuffle, Megaphone, Mail, Gift, CheckCircle, KeyRound, BarChart3, ImageOff, TrendingUp as TrendingUpIcon, LifeBuoy, Copy } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { UserForm } from '@/components/admin/UserForm';
import { ProductForm } from '@/components/admin/ProductForm';
import { ServiceForm } from '@/components/admin/ServiceForm';
import { SegmentForm } from '@/components/admin/SegmentForm';
import { ClearDataDialog } from '@/components/admin/ClearDataDialog';
import { InconsistencyPanel } from '@/components/admin/InconsistencyPanel';
import { ImageSanitizationPanel } from '@/components/admin/ImageSanitizationPanel';
import { CrmPanel } from '@/components/admin/CrmPanel';
import { AiGovernancePanel } from '@/components/admin/AiGovernancePanel';
import { CardexPanel } from '@/components/admin/CardexPanel';
import { LeadsJourneyPanel } from '@/components/admin/LeadsJourneyPanel';
import { UnitForm } from '@/components/admin/UnitForm';
import { PermissionGate } from '@/components/PermissionGate';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { reloadDynamicEntries } from '@/data/searchData';
import { Textarea } from '@/components/ui/textarea';
import { maskPhone, maskCPFCNPJ } from '@/lib/masks';
import { CampaignForm } from '@/components/admin/CampaignForm';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';

interface Provider {
  id: number; name: string; type: string; segment: string[];
  phone: string | null; email: string | null; address: string | null; city: string | null;
  distance: string; rating: number; active: boolean; created_at: string;
  cpf_cnpj: string | null;
}

interface DynamicService {
  id: number; service_id: number; name: string; segment: string;
  provider: string; provider_id: number | null; price: number; rating: number;
  distance: string; time: string; products: string[]; created_at: string;
  labor_cost?: number; linked_product_ids?: number[];
}

interface DynamicProduct {
  id: number; product_id: number; name: string; price: number;
  provider: string; provider_id: number | null; stock_type: string;
  rating: number; distance: string; related_service_ids: number[];
  tags: string[]; created_at: string;
}

interface Segment {
  id: number; name: string; created_at: string;
}

interface Unit {
  id: number; name: string; label: string; created_at: string;
}

const AdminPanel = () => {
  const navigate = useNavigate();
  const { can, requirePermission } = usePermissions();
  const { user } = useAuth();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [services, setServices] = useState<DynamicService[]>([]);
  const [products, setProducts] = useState<DynamicProduct[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearDialog, setClearDialog] = useState(false);

  const [userForm, setUserForm] = useState<{ open: boolean; profile: any | null; role: any; allRoles?: string[]; email: string | null }>({ open: false, profile: null, role: null, allRoles: [], email: null });
  
  const [productForm, setProductForm] = useState<{ open: boolean; item: DynamicProduct | null }>({ open: false, item: null });
  const [serviceForm, setServiceForm] = useState<{ open: boolean; item: DynamicService | null }>({ open: false, item: null });
  const [segmentForm, setSegmentForm] = useState<{ open: boolean; item: Segment | null }>({ open: false, item: null });
  const [unitForm, setUnitForm] = useState<{ open: boolean; item: Unit | null }>({ open: false, item: null });
  const [units, setUnits] = useState<Unit[]>([]);
  const [generatingUnits, setGeneratingUnits] = useState(false);
  const [userWallets, setUserWallets] = useState<any[]>([]);
  const [debtMessage, setDebtMessage] = useState('Olá, verifiquei sua carteira e temos valores em débitos em aberto... faça contato com a central de atendimento para resolvermos juntos qualquer problema.');
  const [deactivationDays, setDeactivationDays] = useState(1);

  // Users management
  const [authUsers, setAuthUsers] = useState<any[]>([]);
  const [userProfiles, setUserProfiles] = useState<any[]>([]);
  const [userRoles, setUserRoles] = useState<any[]>([]);
  const [userSubscriptions, setUserSubscriptions] = useState<any[]>([]);
  const [userActivations, setUserActivations] = useState<any[]>([]);

  // Confirmation dialog for provider delete
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; provider: Provider | null }>({ open: false, provider: null });

  // Edit user dialog
  const [editUserDialog, setEditUserDialog] = useState<{ open: boolean; profile: any | null }>({ open: false, profile: null });
  const [editUserName, setEditUserName] = useState('');
  const [editUserPhone, setEditUserPhone] = useState('');
  const [editUserAvatar, setEditUserAvatar] = useState('');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [savingUser, setSavingUser] = useState(false);

  // Auth user emails and confirmation status (fetched from backend function)
  const [authUserEmails, setAuthUserEmails] = useState<Record<string, string>>({});
  const [authUserConfirmed, setAuthUserConfirmed] = useState<Record<string, string | null>>({});
  const [resendingConfirmation, setResendingConfirmation] = useState(false);
  const [activatingUser, setActivatingUser] = useState<string | null>(null);
  const [activationResult, setActivationResult] = useState<{ open: boolean; summary: string[]; plan?: any; userName?: string }>({ open: false, summary: [] });

  // Marquee / Header announcements
  const [marqueeMessages, setMarqueeMessages] = useState<string[]>([]);
  const [newMarqueeMsg, setNewMarqueeMsg] = useState('');
  const [savingMarquee, setSavingMarquee] = useState(false);

  // New user form
  const [newUserDialog, setNewUserDialog] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserRole, setNewUserRole] = useState<string>('client');
  const [creatingUser, setCreatingUser] = useState(false);

  // Reset password dialog
  const [resetPwdDialog, setResetPwdDialog] = useState<{ open: boolean; userId: string; userName: string }>({ open: false, userId: '', userName: '' });
  const [resetPwdValue, setResetPwdValue] = useState('');
  const [resettingPwd, setResettingPwd] = useState(false);

  const fetchMarquee = async () => {
    const { data } = await supabase.from('site_settings').select('value').eq('key', 'header_marquee').maybeSingle();
    if (data?.value && typeof data.value === 'object' && 'messages' in (data.value as any)) {
      setMarqueeMessages((data.value as any).messages || []);
    }
  };

  const saveMarquee = async (msgs: string[]) => {
    setSavingMarquee(true);
    const { error } = await supabase.from('site_settings').update({ value: { messages: msgs } as any }).eq('key', 'header_marquee');
    if (error) {
      toast.error('Erro ao salvar avisos');
    } else {
      setMarqueeMessages(msgs);
      toast.success('Avisos atualizados em tempo real');
    }
    setSavingMarquee(false);
  };

  const addMarqueeMsg = () => {
    const msg = newMarqueeMsg.trim();
    if (!msg) return;
    if (msg.length > 500) { toast.error('Máximo de 500 caracteres por aviso'); return; }
    saveMarquee([...marqueeMessages, msg]);
    setNewMarqueeMsg('');
  };

  const removeMarqueeMsg = (idx: number) => {
    saveMarquee(marqueeMessages.filter((_, i) => i !== idx));
  };

  const fetchData = async () => {
    setLoading(true);
    const [provRes, svcRes, prodRes, segRes, unitRes] = await Promise.all([
      supabase.from('providers').select('*').order('created_at', { ascending: false }),
      supabase.from('dynamic_services').select('*').order('created_at', { ascending: false }),
      supabase.from('dynamic_products').select('*').order('created_at', { ascending: false }),
      supabase.from('segments').select('*').order('name'),
      supabase.from('units').select('*').order('name'),
    ]);
    setProviders((provRes.data as Provider[]) || []);
    setServices((svcRes.data as DynamicService[]) || []);
    setProducts((prodRes.data as DynamicProduct[]) || []);
    setSegments((segRes.data as Segment[]) || []);
    setUnits((unitRes.data as Unit[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); fetchUsers(); fetchMarquee(); }, []);

  const fetchUsers = async () => {
    const [profilesRes, rolesRes, subsRes, walletsRes, provLeadsRes, activationsRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('user_roles').select('*'),
      supabase.from('subscriptions').select('*'),
      supabase.from('wallets').select('*'),
      supabase.from('providers').select('id, name, phone, email, cpf_cnpj, city, address, logo_url, created_at, user_id, segment, type').is('user_id', null),
      supabase.from('user_activations').select('*').eq('is_used', false),
    ]);
    const profiles = profilesRes.data || [];
    setUserActivations(activationsRes.data || []);
    const profileDocs = new Set(
      profiles.map((p: any) => (p.cpf_cnpj || '').replace(/\D/g, '')).filter(Boolean)
    );
    // Surface imported providers (leads without auth account) as virtual profiles
    const leadProfiles = (provLeadsRes.data || [])
      .filter((p: any) => {
        const doc = (p.cpf_cnpj || '').replace(/\D/g, '');
        return !doc || !profileDocs.has(doc);
      })
      .map((p: any) => ({
        id: `lead-${p.id}`,
        user_id: `lead-${p.id}`,
        display_name: p.name,
        phone: p.phone || null,
        avatar_url: p.logo_url || null,
        cpf_cnpj: p.cpf_cnpj || null,
        city: p.city || null,
        address: p.address || null,
        created_at: p.created_at,
        is_provider: true,
        is_customer: true,
        provider_type: p.type || 'mei',
        provider_segments: Array.isArray(p.segment) ? p.segment : (p.segment ? [p.segment] : []),
        logo_url: p.logo_url || null,
        __isLead: true,
        __providerId: p.id,
        __leadEmail: p.email || null,
      }));
    setUserProfiles([...profiles, ...leadProfiles]);
    setUserRoles(rolesRes.data || []);
    setUserSubscriptions(subsRes.data || []);
    setUserWallets(walletsRes.data || []);

    // Fetch auth emails via edge function (master only)
    try {
      const { data: authData, error: authErr } = await supabase.functions.invoke('list-auth-users');
      if (!authErr && Array.isArray(authData)) {
        const emailMap: Record<string, string> = {};
        const confirmedMap: Record<string, string | null> = {};
        authData.forEach((u: any) => {
          if (u.id && u.email) emailMap[u.id] = u.email;
          confirmedMap[u.id] = u.email_confirmed_at || null;
        });
        // Inject lead emails (from imported providers) so e-mail column shows them
        leadProfiles.forEach((lp: any) => {
          if (lp.__leadEmail) emailMap[lp.user_id] = lp.__leadEmail;
        });
        setAuthUserEmails(emailMap);
        setAuthUserConfirmed(confirmedMap);
      } else {
        // Even when not master, still show lead emails
        const emailMap: Record<string, string> = {};
        leadProfiles.forEach((lp: any) => {
          if (lp.__leadEmail) emailMap[lp.user_id] = lp.__leadEmail;
        });
        setAuthUserEmails(emailMap);
      }
    } catch {
      const emailMap: Record<string, string> = {};
      leadProfiles.forEach((lp: any) => {
        if (lp.__leadEmail) emailMap[lp.user_id] = lp.__leadEmail;
      });
      setAuthUserEmails(emailMap);
    }
  };

  const toggleUserRole = async (userId: string, role: string) => {
    const existing = userRoles.find((r: any) => r.user_id === userId && r.role === role);
    if (existing) {
      // Prevent removing last master
      if (role === 'master') {
        const masterCount = userRoles.filter((r: any) => r.role === 'master').length;
        if (masterCount <= 1) {
          toast.error('Não é possível remover o último usuário Master do sistema');
          return;
        }
      }
      try {
        const { error } = await supabase.from('user_roles').delete().eq('id', existing.id);
        if (error) throw error;
        toast.success('Papel removido');
      } catch (e: any) {
        toast.error('Erro: ' + (e.message || 'desconhecido'));
        return;
      }
    } else {
      try {
        const { error } = await supabase.from('user_roles').insert({ user_id: userId, role: role as any });
        if (error) throw error;
        toast.success('Papel atribuído');
      } catch (e: any) {
        toast.error('Erro: ' + (e.message || 'desconhecido'));
        return;
      }
    }
    fetchUsers();
  };

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPassword || !newUserRole) {
      toast.error('Preencha email, senha e perfil');
      return;
    }
    if (newUserPassword.length < 6) {
      toast.error('Senha deve ter no mínimo 6 caracteres');
      return;
    }
    setCreatingUser(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: newUserEmail.trim(),
          password: newUserPassword,
          name: newUserName.trim() || undefined,
          phone: newUserPhone.trim() || undefined,
          role: newUserRole,
        },
      });
      if (error || data?.error) {
        toast.error('Erro: ' + (data?.error || error?.message || 'desconhecido'));
      } else {
        toast.success('Usuário criado e ativado com sucesso!');
        setNewUserDialog(false);
        setNewUserEmail(''); setNewUserPassword(''); setNewUserName(''); setNewUserPhone(''); setNewUserRole('client');
        setNewUserPassword('');
        setNewUserName('');
        setNewUserPhone('');
        setNewUserRole('client');
        fetchUsers();
      }
    } catch (e: any) {
      toast.error('Erro ao criar usuário');
    }
    setCreatingUser(false);
  };

  const openEditUser = (profile: any) => {
    setEditUserName(profile.display_name || '');
    setEditUserPhone(profile.phone || '');
    setEditUserAvatar(profile.avatar_url || '');
    setEditUserEmail(authUserEmails[profile.user_id] || '');
    setEditUserDialog({ open: true, profile });
  };

  const saveUserProfile = async () => {
    if (!editUserDialog.profile) return;
    setSavingUser(true);
    const userId = editUserDialog.profile.user_id;

    try {
      const { data: updated, error } = await supabase.from('profiles').update({
        display_name: editUserName.trim() || null,
        phone: editUserPhone.trim() || null,
        avatar_url: editUserAvatar.trim() || null,
      }).eq('user_id', userId).select();

      if (error) {
        toast.error('Erro ao salvar perfil: ' + error.message);
        setSavingUser(false);
        return;
      }

      if (!updated || updated.length === 0) {
        toast.error('Perfil não foi atualizado — verifique as permissões.');
        setSavingUser(false);
        return;
      }

      // Update email if changed
      const originalEmail = authUserEmails[userId] || '';
      const newEmail = editUserEmail.trim();
      if (newEmail && newEmail !== originalEmail) {
        const { data: emailRes, error: emailErr } = await supabase.functions.invoke('update-user-email', {
          body: { user_id: userId, new_email: newEmail },
        });
        if (emailErr || emailRes?.error) {
          toast.error('Erro ao alterar e-mail: ' + (emailRes?.error || emailErr?.message || 'desconhecido'));
          setSavingUser(false);
          return;
        }
      }

      toast.success('Perfil atualizado com sucesso');
      setEditUserDialog({ open: false, profile: null });
      await fetchUsers();
    } catch (e: any) {
      toast.error('Erro inesperado: ' + (e.message || 'desconhecido'));
    }
    setSavingUser(false);
  };

  const activateUser = async (userId: string, enableSelling = false, userName?: string) => {
    // Lead importado (sem auth) — tenta criar a conta automaticamente com defaults
    // (sem abrir UserForm). Se faltar e-mail, então abre o form para coletar o mínimo.
    if (userId.startsWith('lead-')) {
      const lead = userProfiles.find((p: any) => p.user_id === userId);
      if (!lead) return;
      const refEmail = (lead.__leadEmail || '').toLowerCase().trim();

      if (!refEmail) {
        toast.warning('Lead sem e-mail — preencha o cadastro para ativar.');
        // Lead importado → padrão Perfil=Misto, Papel=Comum
        setUserForm({ open: true, profile: lead, role: 'mixed', allRoles: ['mixed'], email: null });
        return;
      }

      setActivatingUser(userId);
      try {
        // 1) Cria a conta auth com senha temporária + defaults (Perfil=Misto p/ leads importados)
        const tmpPwd = `Tmp${Math.random().toString(36).slice(2, 10)}!`;
        const { data: createRes, error: createErr } = await supabase.functions.invoke('create-user', {
          body: {
            email: refEmail,
            password: tmpPwd,
            name: lead.display_name || refEmail.split('@')[0],
            phone: lead.phone || undefined,
            role: 'mixed',
          },
        });
        if (createErr || createRes?.error) {
          toast.error('Erro ao criar conta do lead: ' + (createRes?.error || createErr?.message || ''));
          setActivatingUser(null); return;
        }
        const newUserId = createRes.user_id;

        // 2) Vincula provider importado ao novo user_id (preserva loja/produtos)
        if (lead.__providerId) {
          await supabase.from('providers').update({ user_id: newUserId, active: true }).eq('id', lead.__providerId);
        }

        // 3) Aciona ativação (jornada de Lead, sem liberar venda — aguarda pagamento)
        const { data, error } = await supabase.functions.invoke('activate-user', {
          body: { user_id: newUserId, enable_selling: false },
        });
        if (error || data?.error) {
          toast.error('Erro ao ativar lead: ' + (data?.error || error?.message || ''));
        } else {
          toast.success('Lead acionado — aguardando pagamento da assinatura para ficar ATIVO.');
          await fetchUsers();
        }
      } catch (e: any) {
        toast.error('Erro inesperado: ' + (e?.message || 'desconhecido'));
      }
      setActivatingUser(null);
      return;
    }
    setActivatingUser(userId);
    try {
      const { data, error } = await supabase.functions.invoke('activate-user', {
        body: { user_id: userId, enable_selling: enableSelling },
      });
      if (error || data?.error) {
        toast.error('Erro ao ativar: ' + (data?.error || error?.message || 'desconhecido'));
      } else {
        toast.success(enableSelling
          ? 'Prestador ativado e liberado para vender!'
          : 'Botão acionado — aguardando pagamento da assinatura para ativar o usuário.');
        await fetchUsers();
      }
    } catch (e: any) {
      toast.error('Erro ao ativar usuário: ' + (e?.message || 'desconhecido'));
    }
    setActivatingUser(null);
  };

  const deleteUserProfile = async (userId: string) => {
    if (userId === user?.id) {
      toast.error('Não é possível excluir a si mesmo');
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { user_id: userId },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      toast.success('Usuário excluído permanentemente');
      fetchUsers();
    } catch (e: any) {
      toast.error('Erro ao excluir: ' + (e.message || 'desconhecido'));
    }
  };

  const handleResetPassword = async () => {
    if (resetPwdValue.length < 6) { toast.error('Senha deve ter no mínimo 6 caracteres'); return; }
    setResettingPwd(true);
    try {
      const { data, error } = await supabase.functions.invoke('reset-user-password', {
        body: { user_id: resetPwdDialog.userId, new_password: resetPwdValue },
      });

      // Se data?.handled_as_warning é true, a função retornou 200 mesmo com erro interno da Supabase Auth
      if (data?.handled_as_warning || error || data?.error) {
        const errorMsg = data?.error || error?.message || 'desconhecido';
        const isWeak = errorMsg.toLowerCase().includes('senha é conhecida por ser fraca') || 
                      errorMsg.toLowerCase().includes('password is too weak') ||
                      errorMsg.toLowerCase().includes('escolha uma diferente');

        if (isWeak || data?.is_weak) {
          toast.warning('Aviso de Segurança: A senha é fraca ou fácil de adivinhar. O fluxo prosseguiu por ser Master, mas recomende uma senha forte.', {
            duration: 8000,
          });
          toast.success(`Senha alterada! ${resetPwdDialog.userName} usará esta para o próximo acesso.`);
          setResetPwdDialog({ open: false, userId: '', userName: '' });
          setResetPwdValue('');
        } else if (data?.handled_as_warning) {
          // Erro técnico mas devolvido com 200 pela função
          const ptErrorMsg = errorMsg.toLowerCase().includes('weak and easy to guess') 
            ? 'A senha é fraca e fácil de adivinhar, escolha uma diferente' 
            : errorMsg;
          toast.warning(`Aviso técnico: ${ptErrorMsg}. Tentamos prosseguir com a finalização.`);
          toast.success(`Rotina finalizada para ${resetPwdDialog.userName}.`);
          setResetPwdDialog({ open: false, userId: '', userName: '' });
          setResetPwdValue('');
        } else {
          toast.error('Erro: ' + errorMsg);
        }
      } else {
        toast.success(`Senha redefinida! O usuário deve usar o código "${resetPwdValue}" para logar.`);
        setResetPwdDialog({ open: false, userId: '', userName: '' });
        setResetPwdValue('');
      }
    } catch (e: any) {
      toast.error('Erro ao redefinir senha');
    }
    setResettingPwd(false);
  };

  const deleteProvider = async (id: number) => {
    const prov = providers.find(p => p.id === id);
    const relSvc = services.filter(s => s.provider_id === id || s.provider === prov?.name);
    const relProd = products.filter(p => p.provider_id === id || p.provider === prov?.name);

    await supabase.from('dynamic_services').delete().eq('provider_id', id);
    await supabase.from('dynamic_products').delete().eq('provider_id', id);
    // Also delete by name in case provider_id is null
    if (prov) {
      await supabase.from('dynamic_services').delete().eq('provider', prov.name);
      await supabase.from('dynamic_products').delete().eq('provider', prov.name);
    }
    await supabase.from('providers').delete().eq('id', id);

    toast.success(`"${prov?.name}" excluído com ${relSvc.length} serviço(s) e ${relProd.length} produto(s)`);
    await reloadDynamicEntries(); fetchData();
    fetchData();
  };

  const confirmDeleteProvider = (prov: Provider) => {
    setDeleteConfirm({ open: true, provider: prov });
  };

  const deleteService = async (id: number) => {
    await supabase.from('dynamic_services').delete().eq('id', id);
    toast.success('Serviço excluído');
    await reloadDynamicEntries(); fetchData();
    fetchData();
  };

  const deleteProduct = async (id: number) => {
    await supabase.from('dynamic_products').delete().eq('id', id);
    toast.success('Produto excluído');
    await reloadDynamicEntries(); fetchData();
    fetchData();
  };

  const deleteSegment = async (id: number) => {
    await supabase.from('segments').delete().eq('id', id);
    toast.success('Segmento excluído');
    fetchData();
  };

  const deleteUnit = async (id: number) => {
    await supabase.from('units').delete().eq('id', id);
    toast.success('Unidade excluída');
    fetchData();
  };

  const generateUnitsAI = async () => {
    setGeneratingUnits(true);
    try {
      const existingNames = new Set(units.map(u => u.name));
      const { data, error } = await supabase.functions.invoke('suggest-name', {
        body: {
          prompt: `Sugira 10 unidades de medida comuns para prestadores de serviço e comércio que NÃO estejam nesta lista: ${[...existingNames].join(', ')}. Retorne APENAS um JSON array com objetos {"name": "sigla", "label": "descrição"}. Exemplo: [{"name":"dz","label":"Dúzia"}]`,
        },
      });
      if (error) throw error;
      const text = typeof data === 'string' ? data : data?.suggestion || data?.name || JSON.stringify(data);
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        const suggestions: { name: string; label: string }[] = JSON.parse(match[0]);
        const newUnits = suggestions.filter(s => s.name && s.label && !existingNames.has(s.name.toLowerCase()));
        if (newUnits.length === 0) {
          toast.info('IA não encontrou novas unidades para sugerir');
        } else {
          for (const u of newUnits) {
            await supabase.from('units').insert({ name: u.name.toLowerCase(), label: u.label });
          }
          toast.success(`${newUnits.length} unidade(s) criada(s) pela IA`);
          fetchData();
        }
      } else {
        toast.error('Não foi possível interpretar a resposta da IA');
      }
    } catch (e: any) {
      toast.error('Erro ao gerar: ' + (e.message || 'desconhecido'));
    }
    setGeneratingUnits(false);
  };

  const providerList = providers.map(p => ({ id: p.id, name: p.name, segment: p.segment }));
  const segmentList = segments.map(s => ({ id: s.id, name: s.name }));

  // Count inconsistencies for tab badge
  const countIssues = () => {
    let count = 0;
    const segmentNames = new Set(segments.map(s => s.name));
    const providerIds = new Set(providers.map(p => p.id));
    const providerNames = new Set(providers.map(p => p.name));
    providers.forEach(p => {
      if (!p.segment || p.segment.length === 0) count++;
      if (!p.cpf_cnpj) count++;
    });
    services.forEach(s => {
      if (s.provider_id && !providerIds.has(s.provider_id)) count++;
      if (!s.segment || !segmentNames.has(s.segment)) count++;
    });
    products.forEach(p => {
      if (p.provider_id && !providerIds.has(p.provider_id)) count++;
      if (!p.tags || p.tags.length === 0) count++;
    });
    return count;
  };

  const issueCount = countIssues();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Database className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold">Painel Administrativo</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/importar')} className="gap-1">
              <FileSpreadsheet className="h-4 w-4" /> Importar
            </Button>
            <Button variant="outline" size="sm" onClick={() => { fetchData(); fetchUsers(); }} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            {can('admin.clear_data') && (
              <Button variant="destructive" size="sm" onClick={() => setClearDialog(true)}>
                <Trash2 className="h-4 w-4 mr-1" /> Limpar Dados
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Tabs (cards de contagem do topo removidos — números agora ficam no menu lateral/trigger) */}
        <Tabs defaultValue="crm">
          <TabsList className="flex flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="crm" className="text-xs gap-1 px-2 py-1.5 bg-primary/10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <LifeBuoy className="h-3 w-3" /> CRM (Suporte)
            </TabsTrigger>
            <TabsTrigger value="segments" className="text-xs gap-1 px-2 py-1.5">
              <Tag className="h-3 w-3" /> Segmentos
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-[9px]">{segments.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="services" className="text-xs gap-1 px-2 py-1.5">
              <Wrench className="h-3 w-3" /> Serviços
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-[9px]">{services.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="products" className="text-xs gap-1 px-2 py-1.5">
              <Package className="h-3 w-3" /> Produtos
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-[9px]">{products.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="units" className="text-xs gap-1 px-2 py-1.5">
              <Ruler className="h-3 w-3" /> Unidades
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-[9px]">{units.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="issues" className="text-xs gap-1 px-2 py-1.5">
              <AlertTriangle className="h-3 w-3" /> Problemas
              {issueCount > 0 && (
                <Badge variant="destructive" className="ml-0.5 text-[9px] px-1 py-0 min-w-4 h-4">{issueCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="users" className="text-xs gap-1 px-2 py-1.5">
              <UserCog className="h-3 w-3" /> Usuários
              <Badge variant="secondary" className="ml-1 h-4 px-1 text-[9px]">{userProfiles.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="leads" className="text-xs gap-1 px-2 py-1.5">
              <TrendingUpIcon className="h-3 w-3" /> Leads
            </TabsTrigger>
            <TabsTrigger value="marquee" className="text-xs gap-1 px-2 py-1.5">
              <Megaphone className="h-3 w-3" /> Avisos
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="text-xs gap-1 px-2 py-1.5">
              <Gift className="h-3 w-3" /> Campanhas
            </TabsTrigger>
            <TabsTrigger value="debt" className="text-xs gap-1 px-2 py-1.5">
              <AlertTriangle className="h-3 w-3" /> Cobranças
            </TabsTrigger>
            <TabsTrigger value="bi" className="text-xs gap-1 px-2 py-1.5">
              <BarChart3 className="h-3 w-3" /> Dashboard BI
            </TabsTrigger>
            <TabsTrigger value="images" className="text-xs gap-1 px-2 py-1.5">
              <ImageOff className="h-3 w-3" /> Saneamento Imagens
            </TabsTrigger>
            <TabsTrigger value="ai-governance" className="text-xs gap-1 px-2 py-1.5">
              <Sparkles className="h-3 w-3" /> Governança IA
            </TabsTrigger>
            <TabsTrigger value="cardex" className="text-xs gap-1 px-2 py-1.5">
              <Database className="h-3 w-3" /> CARDEX
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leads">
            <LeadsJourneyPanel />
          </TabsContent>

          <TabsContent value="images">
            <ImageSanitizationPanel />
          </TabsContent>
          <TabsContent value="ai-governance">
            <AiGovernancePanel />
          </TabsContent>
          <TabsContent value="cardex">
            <CardexPanel />
          </TabsContent>
          <TabsContent value="crm">
            <CrmPanel />
          </TabsContent>

          {/* ── SEGMENTS TAB ── */}
          <TabsContent value="segments">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Cadastro de Segmentos</CardTitle>
                  <CardDescription>Segmentos vinculados obrigatoriamente a prestadores, produtos e serviços</CardDescription>
                </div>
                <Button size="sm" onClick={() => setSegmentForm({ open: true, item: null })}>
                  <Plus className="h-4 w-4 mr-1" /> Novo Segmento
                </Button>
              </CardHeader>
              <CardContent className="p-0 overflow-hidden">
                {segments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhum segmento cadastrado.</p>
                ) : (
                  <Table wrapperClassName="admin-scroll-area max-h-[60vh] border-t">
                    <TableHeader className="sticky top-0 z-10 bg-background shadow-sm">
                      <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Prestadores</TableHead>
                          <TableHead>Serviços</TableHead>
                          <TableHead>Produtos</TableHead>
                          <TableHead>Criado em</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {segments.map(seg => {
                          const norm = (v: string) => (v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
                          const segNameN = norm(seg.name);
                          const segTagsN = ((seg as any).suggested_tags || []).map((t: string) => norm(t));
                          const segProviders = providers.filter(p => (p.segment || []).some(s => norm(s) === segNameN)).length;
                          const segServices = services.filter(s => norm(s.segment) === segNameN).length;
                          // Produto pertence ao segmento se: tem segments próprios incluindo este, OU (legado) prestador tem o segmento OU tag bate com tags do segmento
                          const provIdsInSeg = new Set(providers.filter(p => (p.segment || []).some(s => norm(s) === segNameN)).map(p => p.id));
                          const segProducts = products.filter((p: any) => {
                            const prodSegs: string[] = Array.isArray(p.segments) ? p.segments : [];
                            if (prodSegs.length > 0) return prodSegs.some(s => norm(s) === segNameN);
                            if (p.provider_id && provIdsInSeg.has(p.provider_id)) return true;
                            const tagsN = (p.tags || []).map(norm);
                            return tagsN.some(t => segTagsN.includes(t) || t === segNameN);
                          }).length;
                          return (
                            <TableRow key={seg.id}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  {(seg as any).image_url ? (
                                    <img src={(seg as any).image_url} alt={seg.name} className="h-9 w-9 rounded-md object-cover border" />
                                  ) : (
                                    <div className="h-9 w-9 rounded-md bg-muted border flex items-center justify-center text-[9px] text-muted-foreground">s/img</div>
                                  )}
                                  <Badge variant="outline">{seg.name}</Badge>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">{segProviders}</TableCell>
                              <TableCell className="text-center">{segServices}</TableCell>
                              <TableCell className="text-center">{segProducts}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {new Date(seg.created_at).toLocaleDateString('pt-BR')}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSegmentForm({ open: true, item: seg })}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteSegment(seg.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── PROVIDERS TAB ── */}
          {/* TabsContent "providers" removida — gestão unificada em "Usuários" */}

          {/* ── SERVICES TAB ── */}
          <TabsContent value="services">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Serviços Dinâmicos</CardTitle>
                  <CardDescription>Serviços = Mão de Obra + Produtos vinculados</CardDescription>
                </div>
                <Button size="sm" onClick={() => setServiceForm({ open: true, item: null })}>
                  <Plus className="h-4 w-4 mr-1" /> Novo Serviço
                </Button>
              </CardHeader>
              <CardContent>
                {services.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhum serviço registrado.</p>
                ) : (
                  <Table wrapperClassName="admin-scroll-area max-h-[60vh] border-t">
                    <TableHeader className="sticky top-0 z-10 bg-background shadow-sm">
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Segmento</TableHead>
                        <TableHead>Prestador</TableHead>
                        <TableHead>Mão de Obra</TableHead>
                        <TableHead>Produtos</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Qtd</TableHead>
                        <TableHead>Avaliação</TableHead>
                        <TableHead>Tempo</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                        {services.map((svc) => (
                          <TableRow key={svc.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {(svc as any).image_url ? (
                                  <img src={(svc as any).image_url} alt={svc.name} className="h-9 w-9 rounded-md object-cover border" />
                                ) : (
                                  <div className="h-9 w-9 rounded-md bg-muted border flex items-center justify-center text-[9px] text-muted-foreground">s/img</div>
                                )}
                                <span>{svc.name}</span>
                              </div>
                            </TableCell>
                            <TableCell><Badge variant="secondary">{svc.segment}</Badge></TableCell>
                            <TableCell>
                              <span>{svc.provider}</span>
                              {svc.provider_id && <Badge variant="outline" className="ml-1 text-[10px]">ID:{svc.provider_id}</Badge>}
                            </TableCell>
                            <TableCell className="text-xs">R$ {(svc.labor_cost || 0).toFixed(2)}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1 max-w-[150px]">
                                {(svc.products || []).slice(0, 2).map((p, i) => (
                                  <Badge key={i} variant="secondary" className="text-[10px]">{p}</Badge>
                                ))}
                                {(svc.products || []).length > 2 && <Badge variant="secondary" className="text-[10px]">+{svc.products.length - 2}</Badge>}
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold text-primary">R$ {svc.price.toFixed(2)}</TableCell>
                            <TableCell>
                              <Input
                                type="number" min={0} step={1}
                                value={(svc as any).quantity ?? 0}
                                onChange={async (e) => {
                                  const q = parseInt(e.target.value, 10) || 0;
                                  await supabase.from('dynamic_services').update({ quantity: q }).eq('id', svc.id);
                                  await reloadDynamicEntries(); fetchData();
                                }}
                                className="h-7 w-16 text-xs"
                              />
                            </TableCell>
                            <TableCell>⭐ {svc.rating}</TableCell>
                            <TableCell>{svc.time}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setServiceForm({ open: true, item: svc })}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteService(svc.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── PRODUCTS TAB ── */}
          <TabsContent value="products">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Produtos de Estoque</CardTitle>
                  <CardDescription>Produtos vinculados ao estoque de cada prestador</CardDescription>
                </div>
                <Button size="sm" onClick={() => setProductForm({ open: true, item: null })}>
                  <Plus className="h-4 w-4 mr-1" /> Novo Produto
                </Button>
              </CardHeader>
              <CardContent>
                {products.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhum produto registrado.</p>
                ) : (
                  <Table wrapperClassName="admin-scroll-area max-h-[60vh] border-t">
                    <TableHeader className="sticky top-0 z-10 bg-background shadow-sm">
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Prestador</TableHead>
                        <TableHead>Preço</TableHead>
                        <TableHead>Tipo Estoque</TableHead>
                        <TableHead>Qtd</TableHead>
                        <TableHead>Avaliação</TableHead>
                        <TableHead>Tags</TableHead>
                        <TableHead>Criado em</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.map((prod) => (
                          <TableRow key={prod.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {(prod as any).image_url ? (
                                  <img src={(prod as any).image_url} alt={prod.name} className="h-9 w-9 rounded-md object-cover border" />
                                ) : (
                                  <div className="h-9 w-9 rounded-md bg-muted border flex items-center justify-center text-[9px] text-muted-foreground">s/img</div>
                                )}
                                <span>{prod.name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span>{prod.provider}</span>
                              {prod.provider_id && <Badge variant="outline" className="ml-1 text-[10px]">ID:{prod.provider_id}</Badge>}
                            </TableCell>
                            <TableCell>R$ {prod.price}</TableCell>
                            <TableCell>
                              <Badge variant={prod.stock_type === 'drop' ? 'outline' : 'default'}>
                                {prod.stock_type === 'drop' ? 'Drop' : 'Físico'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number" min={0} step={1}
                                value={(prod as any).quantity ?? 0}
                                onChange={async (e) => {
                                  const q = parseInt(e.target.value, 10) || 0;
                                  await supabase.from('dynamic_products').update({ quantity: q }).eq('id', prod.id);
                                  await reloadDynamicEntries(); fetchData();
                                }}
                                className="h-7 w-16 text-xs"
                              />
                            </TableCell>
                            <TableCell>⭐ {prod.rating}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1 max-w-[200px]">
                                {(prod.tags || []).slice(0, 3).map((tag, i) => (
                                  <Badge key={i} variant="secondary" className="text-[10px]">{tag}</Badge>
                                ))}
                                {(prod.tags || []).length > 3 && <Badge variant="secondary" className="text-[10px]">+{prod.tags.length - 3}</Badge>}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(prod.created_at).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setProductForm({ open: true, item: prod })}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteProduct(prod.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── UNITS TAB ── */}
          <TabsContent value="units">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2"><Ruler className="w-4 h-4" /> Unidades de Medida</CardTitle>
                  <CardDescription>Unidades utilizadas em serviços e produtos (ex: un, kg, hr, m²)</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={generateUnitsAI} disabled={generatingUnits} className="gap-1.5">
                    {generatingUnits ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {generatingUnits ? 'Gerando...' : 'Gerar com IA'}
                  </Button>
                  <Button size="sm" onClick={() => setUnitForm({ open: true, item: null })}>
                    <Plus className="h-4 w-4 mr-1" /> Nova Unidade
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {units.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhuma unidade cadastrada.</p>
                ) : (
                  <Table wrapperClassName="admin-scroll-area max-h-[60vh] border-t">
                    <TableHeader className="sticky top-0 z-10 bg-background shadow-sm">
                      <TableRow>
                        <TableHead>Sigla</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Criado em</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                        {units.map(u => (
                          <TableRow key={u.id}>
                            <TableCell className="font-mono font-semibold">{u.name}</TableCell>
                            <TableCell>{u.label}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(u.created_at).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setUnitForm({ open: true, item: u })}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteUnit(u.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── INCONSISTENCIES TAB ── */}
          <TabsContent value="issues">
            <InconsistencyPanel
              providers={providers}
              services={services}
              products={products}
              segments={segments}
              onEditProvider={(p) => {
                // Abre o MESMO formulário da aba Usuários — fonte única da verdade
                const normDoc = (s: any) => String(s || '').replace(/\D/g, '');
                const pDoc = normDoc(p.cpf_cnpj);
                const prof = userProfiles.find((u: any) =>
                  (pDoc && (normDoc(u.cpf_cnpj) === pDoc || u.cpf_cnpj_normalized === pDoc)) ||
                  ((p as any).user_id && u.user_id === (p as any).user_id) ||
                  (!pDoc && u.display_name === p.name)
                );
                if (prof) {
                  const allRoles = userRoles.filter((x: any) => x.user_id === prof.user_id).map((x: any) => x.role);
                  const r = allRoles.find((x: string) => ['provider','mixed','client','admin','master'].includes(x));
                  setUserForm({ open: true, profile: prof, role: r || 'mixed', allRoles, email: authUserEmails[prof.user_id] || null });
                } else {
                  toast.info('Prestador legado sem usuário vinculado. Cadastre/ajuste o usuário com o mesmo CPF/CNPJ — a vinculação é automática.');
                }
              }}
              onEditService={(s) => setServiceForm({ open: true, item: s })}
              onEditProduct={(p) => setProductForm({ open: true, item: p })}
              onDeleteService={deleteService}
              onDeleteProduct={deleteProduct}
            />
          </TabsContent>

          <TabsContent value="users">
            <PermissionGate permission="admin.users" featureName="Gestão de Usuários" readOnly>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2"><UserCog className="w-4 h-4" /> Gestão de Usuários</CardTitle>
                  <CardDescription>Usuários cadastrados no sistema — dados completos e edição de perfil</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => setUserForm({ open: true, profile: null, role: null, email: null })}>
                    <Plus className="h-4 w-4 mr-1" /> Novo Usuário
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden">
                {userProfiles.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhum usuário cadastrado ainda.</p>
                ) : (
                  <Table wrapperClassName="admin-scroll-area max-h-[70vh] border-t">
                    <TableHeader className="sticky top-0 z-10 bg-background shadow-sm">
                      <TableRow>
                        <TableHead>Avatar</TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>E-mail</TableHead>
                        <TableHead title="CPF/CNPJ — identidade única no ecossistema">CPF/CNPJ</TableHead>
                        <TableHead title="O que o usuário faz: Consumidor, Prestador ou Misto">Perfil</TableHead>
                        <TableHead title="Permissões de gestão: Master, Admin ou Comum">Papel</TableHead>
                        <TableHead>Plano</TableHead>
                        <TableHead>Status E-mail</TableHead>
                        <TableHead title="PIN de ativação para Lead">PIN</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Criado em</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                      <TableBody>
                        {userProfiles.map((profile: any) => {
                          const roles = userRoles.filter((r: any) => r.user_id === profile.user_id);
                          const userSub = userSubscriptions.find((s: any) => s.user_id === profile.user_id && s.status === 'active');
                          const userSubPending = userSubscriptions.find((s: any) => s.user_id === profile.user_id && s.status === 'pending');
                          // Perfil de negócio (o que o usuário FAZ)
                          const hasProvider = roles.some((r: any) => r.role === 'provider');
                          const hasClient = roles.some((r: any) => r.role === 'client');
                          const hasMixed = roles.some((r: any) => r.role === 'mixed');
                          // Lead importado: padrão Misto + Comum (regra de cadastro do importador)
                          const perfil = profile.__isLead
                            ? 'Misto'
                            : hasMixed ? 'Misto' : hasProvider && hasClient ? 'Misto' : hasProvider ? 'Prestador' : hasClient ? 'Consumidor' : '—';
                          // Papel administrativo (o que o usuário PODE fazer no sistema)
                          const isMasterRow = roles.some((r: any) => r.role === 'master');
                          const isAdminRow = roles.some((r: any) => r.role === 'admin');
                          const papel: 'Master' | 'Admin' | 'Comum' = profile.__isLead
                            ? 'Comum'
                            : (isMasterRow ? 'Master' : isAdminRow ? 'Admin' : 'Comum');
                          const planLabel = userSub ? userSub.plan.charAt(0).toUpperCase() + userSub.plan.slice(1) : '—';
                          const planColor = userSub ? (userSub.plan === 'ouro' ? 'bg-yellow-500/20 text-yellow-700 border-yellow-300' : userSub.plan === 'prata' ? 'bg-gray-400/20 text-gray-600 border-gray-300' : 'bg-orange-500/20 text-orange-700 border-orange-300') : '';
                          return (
                            <TableRow key={profile.id}>
                              <TableCell>
                                {profile.avatar_url ? (
                                  <img src={profile.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover border" />
                                ) : (
                                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs font-bold">
                                    {(profile.display_name || '?')[0]?.toUpperCase()}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <span className="font-medium text-sm">{profile.display_name || 'Sem nome'}</span>
                                {profile.__isLead && (
                                  <Badge variant="outline" className="ml-2 text-[9px] bg-amber-500/20 text-amber-700 border-amber-300">LEAD (importado)</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">{authUserEmails[profile.user_id] || profile.__leadEmail || '—'}</TableCell>
                              <TableCell className="text-xs font-mono text-muted-foreground">
                                {profile.cpf_cnpj
                                  ? (String(profile.cpf_cnpj).toUpperCase() === 'ISENTO'
                                      ? <Badge variant="outline" className="text-[9px] bg-amber-50 text-amber-700 border-amber-200">ISENTO</Badge>
                                      : profile.cpf_cnpj)
                                  : <span className="text-destructive/70">—</span>}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-[10px]">
                                  {perfil === 'Prestador' && <Wrench className="w-2.5 h-2.5 mr-0.5 inline" />}
                                  {perfil === 'Consumidor' && <ShoppingCart className="w-2.5 h-2.5 mr-0.5 inline" />}
                                  {perfil === 'Misto' && <Shuffle className="w-2.5 h-2.5 mr-0.5 inline" />}
                                  {perfil}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] ${
                                    papel === 'Master' ? 'bg-yellow-500/20 text-yellow-700 border-yellow-300' :
                                    papel === 'Admin' ? 'bg-blue-500/20 text-blue-700 border-blue-300' :
                                    'bg-muted text-muted-foreground'
                                  }`}
                                >
                                  {papel === 'Master' && <Crown className="w-2.5 h-2.5 mr-0.5 inline" />}
                                  {papel === 'Admin' && <Shield className="w-2.5 h-2.5 mr-0.5 inline" />}
                                  {papel}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {userSub ? (
                                  <Badge variant="outline" className={`text-[10px] ${planColor}`}>{planLabel}</Badge>
                                ) : (
                                  <span className="text-xs text-muted-foreground">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-xs">
                                {authUserConfirmed[profile.user_id]
                                  ? <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Verificado</Badge>
                                  : <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pendente</Badge>
                                }
                               </TableCell>
                               <TableCell className="text-xs">
                                 {(() => {
                                   const activation = userActivations.find((a: any) => a.email === (authUserEmails[profile.user_id] || profile.__leadEmail));
                                   if (!activation) return <span className="text-muted-foreground">—</span>;
                                   return (
                                     <div className="flex items-center gap-1 group">
                                       <code className="bg-muted px-1 py-0.5 rounded font-mono text-[10px] font-bold text-primary">
                                         {activation.code}
                                       </code>
                                       <Button 
                                         variant="ghost" 
                                         size="icon" 
                                         className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity"
                                         onClick={() => {
                                           navigator.clipboard.writeText(activation.code);
                                           toast.success('PIN copiado!');
                                         }}
                                       >
                                         <Plus className="h-3 w-3" />
                                       </Button>
                                     </div>
                                   );
                                 })()}
                               </TableCell>
                               <TableCell className="text-xs text-muted-foreground">{profile.phone || '—'}</TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {new Date(profile.created_at).toLocaleDateString('pt-BR')}
                              </TableCell>
                               <TableCell>
                                <div className="flex gap-1 flex-wrap">
                                  {(() => {
                                    const isActive = !!userSub && userSub.status === 'active';
                                    const isTriggered = !isActive && !!userSubPending;
                                    const isLeadRow = String(profile.user_id).startsWith('lead-');
                                    // "Conta criada" = tem auth mas nenhuma assinatura (active OU pending) ainda
                                    const hasAccountNoSub = !isLeadRow && !isActive && !isTriggered;

                                    if (isActive) {
                                      return (
                                        <Button
                                          variant="outline" size="sm"
                                          className="h-8 text-xs gap-1 cursor-not-allowed bg-green-100 border-green-400 text-green-800 hover:bg-green-100"
                                          disabled
                                          title="ATIVADO — assinatura paga e ativa. Para reativar, cancele a assinatura primeiro."
                                        >
                                          <CheckCircle className="h-3 w-3 text-green-700" />
                                          Ativado
                                        </Button>
                                      );
                                    }
                                    if (isTriggered) {
                                      return (
                                        <Button
                                          variant="outline" size="sm"
                                          className="h-8 text-xs gap-1 cursor-not-allowed bg-amber-100 border-amber-400 text-amber-800 hover:bg-amber-100"
                                          disabled
                                          title="Aguardando pagamento da assinatura para tornar-se ATIVADO."
                                        >
                                          <Loader2 className="h-3 w-3" />
                                          Aguardando pagamento
                                        </Button>
                                      );
                                    }
                                    if (hasAccountNoSub) {
                                      return (
                                        <Button
                                          variant="outline" size="sm"
                                          className="h-8 text-xs gap-1 cursor-not-allowed bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-100"
                                          disabled
                                          title="Conta de acesso criada. Aguardando geração da assinatura para liberar pagamento."
                                        >
                                          <CheckCircle className="h-3 w-3 text-slate-500" />
                                          Conta criada
                                        </Button>
                                      );
                                    }
                                    // Etapa 1 — única clicável
                                    return (
                                      <Button
                                        variant="outline" size="sm"
                                        className="h-8 text-xs gap-1 bg-slate-50 border-slate-400 text-slate-700 hover:bg-slate-200"
                                        disabled={activatingUser === profile.user_id}
                                        onClick={() => activateUser(profile.user_id, false, profile.display_name)}
                                        title={isLeadRow
                                          ? 'Etapa 1 — Acionar ativação do Lead (cria conta + jornada)'
                                          : 'Etapa 1 — Acionar ativação (Lead). Aguarda pagamento para ficar ATIVADO.'}
                                      >
                                        {activatingUser === profile.user_id
                                          ? <Loader2 className="h-3 w-3 animate-spin" />
                                          : <CheckCircle className="h-3 w-3" />
                                        }
                                        Ativar
                                      </Button>
                                    );
                                  })()}

                                  {/* Enable selling: activates + applies subscription debit + creates provider */}
                                  {(hasProvider || hasMixed) && authUserConfirmed[profile.user_id] && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8 text-xs gap-1 border-green-300 text-green-700 hover:bg-green-50"
                                      disabled={activatingUser === profile.user_id}
                                      onClick={() => activateUser(profile.user_id, true, profile.display_name)}
                                      title="Liberar prestador para vender e aplicar débito de assinatura"
                                    >
                                      {activatingUser === profile.user_id
                                        ? <Loader2 className="h-3 w-3 animate-spin" />
                                        : <Store className="h-3 w-3" />
                                      }
                                      Liberar Venda
                                    </Button>
                                  )}
                                  {!authUserConfirmed[profile.user_id] && (hasProvider || hasMixed) && (
                                    <Button
                                      variant="default"
                                      size="sm"
                                      className="h-8 text-xs gap-1"
                                      disabled={activatingUser === profile.user_id}
                                      onClick={() => activateUser(profile.user_id, true, profile.display_name)}
                                      title="Ativar conta + liberar venda + aplicar débito"
                                    >
                                      {activatingUser === profile.user_id
                                        ? <Loader2 className="h-3 w-3 animate-spin" />
                                        : <><CheckCircle className="h-3 w-3" /><Store className="h-3 w-3" /></>
                                      }
                                      Ativar + Venda
                                    </Button>
                                  )}
                                  {(hasProvider || hasMixed) && (() => {
                                    const prov = providers.find((p: any) => p.user_id === profile.user_id) || providers.find((p: any) => p.name === profile.display_name);
                                    if (!prov) return null;
                                    const slug = (prov.name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
                                    return (
                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary" title="Abrir Loja do prestador"
                                        onClick={() => navigate(`/loja/${slug}`)}>
                                        <Store className="h-4 w-4" />
                                      </Button>
                                    );
                                  })()}
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                                    if (profile.__isLead) {
                                      // Lead importado: força Perfil = Misto + Papel = Comum (sem roles em user_roles)
                                      setUserForm({ open: true, profile, role: 'mixed', allRoles: [], email: profile.__leadEmail || null });
                                      return;
                                    }
                                    const allRoles = userRoles.filter((x: any) => x.user_id === profile.user_id).map((x: any) => x.role);
                                    const r = allRoles.find((x: string) => ['provider','mixed','client','admin','master'].includes(x));
                                    setUserForm({ open: true, profile, role: r || 'client', allRoles, email: authUserEmails[profile.user_id] || null });
                                  }}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600 hover:text-amber-700" title="Redefinir senha"
                                    onClick={() => { 
                                      const randomCode = Math.random().toString(36).slice(-8).toUpperCase();
                                      setResetPwdDialog({ open: true, userId: profile.user_id, userName: profile.display_name || 'Usuário' }); 
                                      setResetPwdValue(randomCode); 
                                    }}>
                                    <KeyRound className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteUserProfile(profile.user_id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                )}
              </CardContent>
            </Card>
            </PermissionGate>
          </TabsContent>

          {/* ── MARQUEE / AVISOS TAB ── */}
          <TabsContent value="marquee">
            <PermissionGate permission="admin.panel" featureName="Gestão de Avisos">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Megaphone className="h-5 w-5 text-primary" />
                    Gestão de Avisos do Cabeçalho
                  </CardTitle>
                  <CardDescription>
                    Os avisos aparecem como letreiro rolante no cabeçalho para todos os usuários. Atualizações são exibidas em tempo real.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Current messages */}
                  {marqueeMessages.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum aviso cadastrado.</p>
                  ) : (
                    <div className="space-y-2">
                      {marqueeMessages.map((msg, idx) => (
                        <div key={idx} className="flex items-start gap-2 p-3 border rounded-lg bg-muted/30">
                          <Badge variant="outline" className="mt-0.5 shrink-0">{idx + 1}</Badge>
                          <p className="text-sm flex-1 break-words">{msg}</p>
                          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-destructive hover:text-destructive" onClick={() => removeMarqueeMsg(idx)} disabled={savingMarquee}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add new */}
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Digite o texto do aviso (máx. 500 caracteres)..."
                      value={newMarqueeMsg}
                      onChange={e => setNewMarqueeMsg(e.target.value.slice(0, 500))}
                      className="min-h-[60px]"
                      maxLength={500}
                    />
                    <Button onClick={addMarqueeMsg} disabled={!newMarqueeMsg.trim() || savingMarquee} className="shrink-0 self-end">
                      <Plus className="h-4 w-4 mr-1" /> Adicionar
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">{newMarqueeMsg.length}/500 caracteres</p>
                </CardContent>
              </Card>
            </PermissionGate>
          </TabsContent>

          {/* ── CAMPAIGNS TAB ── */}
          <TabsContent value="campaigns">
            <PermissionGate permission="admin.panel" featureName="Gestão de Campanhas">
              <CampaignForm />
            </PermissionGate>
          </TabsContent>

          {/* ── DEBT COLLECTION TAB ── */}
          <TabsContent value="debt">
            <PermissionGate permission="admin.panel" featureName="Carteira de Cobrança">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Carteira de Cobrança — Saldos Negativos
                  </CardTitle>
                  <CardDescription>Usuários com débitos pendentes. Envie notificações de cobrança em massa.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Deactivation days config */}
                  <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                    <div className="flex-1">
                      <Label className="text-xs font-semibold">Prazo de desativação (dias)</Label>
                      <p className="text-[10px] text-muted-foreground">Vitrine desativada após X dias de inadimplência</p>
                    </div>
                    <Input type="number" min={1} max={90} className="w-20 h-8 text-center" value={deactivationDays} onChange={e => setDeactivationDays(Number(e.target.value) || 1)} />
                  </div>

                  {/* Debt message */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold">Mensagem de cobrança (Push em massa)</Label>
                    <Textarea value={debtMessage} onChange={e => setDebtMessage(e.target.value)} className="min-h-[80px] text-xs" maxLength={500} />
                    <p className="text-[10px] text-muted-foreground">{debtMessage.length}/500 caracteres</p>
                  </div>

                  {/* Debtors list */}
                  {(() => {
                    const debtors = userWallets
                      .filter(w => w.balance < 0)
                      .map(w => {
                        const profile = userProfiles.find((p: any) => p.user_id === w.user_id);
                        const sub = userSubscriptions.find((s: any) => s.user_id === w.user_id);
                        return { ...w, profile, sub, email: authUserEmails[w.user_id] || '—' };
                      });

                    if (debtors.length === 0) {
                      return <p className="text-sm text-muted-foreground text-center py-6">🎉 Nenhum usuário inadimplente!</p>;
                    }

                    return (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="destructive">{debtors.length} inadimplente(s)</Badge>
                          <Button size="sm" variant="destructive" className="gap-1" onClick={() => {
                            toast.success(`Push enviado para ${debtors.length} usuário(s) inadimplentes`);
                          }}>
                            <Megaphone className="h-3 w-3" /> Enviar Push em Massa
                          </Button>
                        </div>
                        <Table wrapperClassName="admin-scroll-area max-h-[50vh] border rounded-md">
                          <TableHeader className="sticky top-0 z-10 bg-background shadow-sm">
                            <TableRow>
                              <TableHead>Nome</TableHead>
                              <TableHead>E-mail</TableHead>
                              <TableHead>Plano</TableHead>
                              <TableHead>Débito</TableHead>
                              <TableHead>Criado em</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {debtors.map(d => (
                              <TableRow key={d.id}>
                                <TableCell className="text-sm font-medium">{d.profile?.display_name || '—'}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">{d.email}</TableCell>
                                <TableCell><Badge variant="outline" className="text-[10px]">{d.sub?.plan || '—'}</Badge></TableCell>
                                <TableCell className="text-sm font-semibold text-destructive">R$ {Math.abs(d.balance).toFixed(2)}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">{d.profile ? new Date(d.profile.created_at).toLocaleDateString('pt-BR') : '—'}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        <div className="text-xs text-muted-foreground bg-muted/30 rounded p-2">
                          💡 Total em débitos: <strong className="text-destructive">R$ {debtors.reduce((sum, d) => sum + Math.abs(d.balance), 0).toFixed(2)}</strong>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </PermissionGate>
          </TabsContent>
          {/* ── BI DASHBOARD TAB ── */}
          <TabsContent value="bi">
            <PermissionGate permission="admin.panel" featureName="Dashboard BI">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Saúde Financeira do Ecossistema
                  </CardTitle>
                  <CardDescription>Visão consolidada de saldos, taxas e conversão</CardDescription>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const totalFloat = userWallets.filter(w => w.balance > 0).reduce((s, w) => s + w.balance, 0);
                    const totalDebt = userWallets.filter(w => w.balance < 0).reduce((s, w) => s + Math.abs(w.balance), 0);
                    const totalLocked = userWallets.reduce((s, w) => s + (w.locked_cashback || 0), 0);
                    const totalPending = userWallets.reduce((s, w) => s + (w.pending_balance || 0), 0);
                    const totalCreditUsed = userWallets.reduce((s, w) => s + (w.credit_used || 0), 0);
                    const debtorsCount = userWallets.filter(w => w.balance < 0).length;
                    const healthyCount = userWallets.filter(w => w.balance >= 0).length;
                    const totalProviders = userProfiles.filter((p: any) => p.is_provider).length;
                    const totalCustomers = userProfiles.filter((p: any) => p.is_customer).length;

                    const metrics = [
                      { label: 'Float Total', value: `R$ ${totalFloat.toFixed(2)}`, color: 'text-green-600' },
                      { label: 'Dívida Total', value: `R$ ${totalDebt.toFixed(2)}`, color: 'text-destructive' },
                      { label: 'Cashback Retido', value: `R$ ${totalLocked.toFixed(2)}`, color: 'text-amber-600' },
                      { label: 'Pendente Liberação', value: `R$ ${totalPending.toFixed(2)}`, color: 'text-blue-600' },
                      { label: 'Crédito Utilizado', value: `R$ ${totalCreditUsed.toFixed(2)}`, color: 'text-purple-600' },
                      { label: 'Adimplentes', value: healthyCount.toString(), color: 'text-green-600' },
                      { label: 'Inadimplentes', value: debtorsCount.toString(), color: 'text-destructive' },
                      { label: 'Prestadores', value: totalProviders.toString(), color: 'text-primary' },
                      { label: 'Compradores', value: totalCustomers.toString(), color: 'text-primary' },
                      { label: 'Total Usuários', value: userProfiles.length.toString(), color: 'text-foreground' },
                    ];

                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {metrics.map(m => (
                          <div key={m.label} className="bg-muted/30 rounded-lg p-3 text-center">
                            <p className={`text-lg font-bold ${m.color}`}>{m.value}</p>
                            <p className="text-[10px] text-muted-foreground">{m.label}</p>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </PermissionGate>
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialogs */}
      <UserForm
        open={userForm.open}
        onClose={() => setUserForm({ open: false, profile: null, role: null, email: null })}
        onSaved={() => { fetchUsers(); fetchData(); reloadDynamicEntries(); }}
        profile={userForm.profile}
        currentRole={userForm.role}
        currentRoles={(userForm.allRoles || []) as any}
        currentEmail={userForm.email}
        segments={segmentList}
      />
      <ProductForm open={productForm.open} onClose={() => setProductForm({ open: false, item: null })} onSaved={() => { reloadDynamicEntries(); fetchData(); }} product={productForm.item} providers={providerList} segments={segmentList} />
      <ServiceForm open={serviceForm.open} onClose={() => setServiceForm({ open: false, item: null })} onSaved={() => { reloadDynamicEntries(); fetchData(); }} service={serviceForm.item} providers={providerList} segments={segmentList} />
      <SegmentForm open={segmentForm.open} onClose={() => setSegmentForm({ open: false, item: null })} onSaved={fetchData} segment={segmentForm.item} />
      <UnitForm open={unitForm.open} onClose={() => setUnitForm({ open: false, item: null })} onSaved={fetchData} unit={unitForm.item} />
      <ClearDataDialog open={clearDialog} onClose={() => setClearDialog(false)} onCleared={async () => { await reloadDynamicEntries(); await fetchData(); await fetchUsers(); }} counts={{ providers: providers.length, services: services.length, products: products.length, segments: segments.length }} />

      {/* Activation Result Summary */}
      <Dialog open={activationResult.open} onOpenChange={(v) => !v && setActivationResult({ open: false, summary: [] })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Ativação concluída
            </DialogTitle>
            <DialogDescription>
              {activationResult.userName ? <>Resumo das ações realizadas para <strong>{activationResult.userName}</strong>:</> : 'Resumo das ações realizadas:'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 text-sm py-2 max-h-[50vh] overflow-y-auto">
            {activationResult.summary.map((line, i) => (
              <div key={i} className={`px-2 py-1.5 rounded ${line.startsWith('✓') ? 'bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-200' : 'bg-muted text-muted-foreground'}`}>
                {line}
              </div>
            ))}
            {activationResult.plan && (
              <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                Plano vigente: <strong>{activationResult.plan.name}</strong> — R$ {Number(activationResult.plan.price).toFixed(2)}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setActivationResult({ open: false, summary: [] })}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Provider Confirmation */}
      <Dialog open={deleteConfirm.open} onOpenChange={(v) => !v && setDeleteConfirm({ open: false, provider: null })}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Excluir Prestador
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir <strong>{deleteConfirm.provider?.name}</strong>?
            </DialogDescription>
          </DialogHeader>
          {deleteConfirm.provider && (() => {
            const relSvc = services.filter(s => s.provider_id === deleteConfirm.provider!.id || s.provider === deleteConfirm.provider!.name);
            const relProd = products.filter(p => p.provider_id === deleteConfirm.provider!.id || p.provider === deleteConfirm.provider!.name);
            return (
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Esta ação também excluirá:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>{relSvc.length}</strong> serviço(s) vinculado(s)</li>
                  <li><strong>{relProd.length}</strong> produto(s) vinculado(s)</li>
                </ul>
                <p className="text-destructive text-xs font-medium">Esta ação não pode ser desfeita.</p>
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm({ open: false, provider: null })}>Cancelar</Button>
            <Button variant="destructive" onClick={() => {
              if (deleteConfirm.provider) {
                deleteProvider(deleteConfirm.provider.id);
                setDeleteConfirm({ open: false, provider: null });
              }
            }}>
              Excluir Tudo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editUserDialog.open} onOpenChange={(v) => !v && setEditUserDialog({ open: false, profile: null })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-primary" />
              Editar Usuário
            </DialogTitle>
            <DialogDescription>
              Altere os dados do perfil de <strong>{editUserDialog.profile?.display_name || 'usuário'}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Nome de exibição</label>
              <Input value={editUserName} onChange={e => setEditUserName(e.target.value)} placeholder="Nome do usuário" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">E-mail (autenticação)</label>
              <Input type="email" value={editUserEmail} onChange={e => setEditUserEmail(e.target.value)} placeholder="email@exemplo.com" />
              {editUserDialog.profile && (
                <div className="mt-2 flex items-center gap-2">
                  {authUserConfirmed[editUserDialog.profile.user_id]
                    ? <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">✓ E-mail verificado</Badge>
                    : (
                      <>
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">⏳ Pendente de verificação</Badge>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={resendingConfirmation}
                          onClick={async () => {
                            setResendingConfirmation(true);
                            try {
                              const email = authUserEmails[editUserDialog.profile.user_id] || editUserEmail.trim();
                              if (!email) {
                                toast.error('E-mail não encontrado para este usuário');
                                setResendingConfirmation(false);
                                return;
                              }
                              const { data, error } = await supabase.functions.invoke('resend-confirmation', {
                                body: { user_id: editUserDialog.profile.user_id, email },
                              });
                              if (error || data?.error) {
                                toast.error('Erro ao reenviar: ' + (data?.error || error?.message || 'desconhecido'));
                              } else {
                                toast.success('Link de confirmação reenviado!');
                              }
                            } catch {
                              toast.error('Erro ao reenviar confirmação');
                            }
                            setResendingConfirmation(false);
                          }}
                        >
                          {resendingConfirmation ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Mail className="h-3 w-3 mr-1" />}
                          Reenviar confirmação
                        </Button>
                      </>
                    )
                  }
                </div>
              )}
              {editUserEmail !== (authUserEmails[editUserDialog.profile?.user_id] || '') && editUserEmail.trim() && (
                <p className="text-xs text-amber-600 mt-1">⚠ O e-mail de login do usuário será alterado. Uma confirmação será enviada.</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Telefone</label>
              <Input value={editUserPhone} onChange={e => setEditUserPhone(maskPhone(e.target.value))} placeholder="(00) 00000-0000" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">URL do Avatar</label>
              <Input value={editUserAvatar} onChange={e => setEditUserAvatar(e.target.value)} placeholder="https://..." />
              {editUserAvatar && (
                <img src={editUserAvatar} alt="preview" className="mt-2 w-16 h-16 rounded-full object-cover border" />
              )}
            </div>
            {editUserDialog.profile && (
              <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                <p><strong>User ID:</strong> <code className="bg-muted px-1 py-0.5 rounded font-mono">{editUserDialog.profile.user_id}</code></p>
                <p><strong>Criado em:</strong> {new Date(editUserDialog.profile.created_at).toLocaleString('pt-BR')}</p>
                <p><strong>Atualizado em:</strong> {new Date(editUserDialog.profile.updated_at).toLocaleString('pt-BR')}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUserDialog({ open: false, profile: null })}>Cancelar</Button>
            <Button onClick={saveUserProfile} disabled={savingUser}>
              {savingUser && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={newUserDialog} onOpenChange={setNewUserDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Novo Usuário
            </DialogTitle>
            <DialogDescription>
              Cadastre manualmente um novo usuário e atribua um perfil de acesso.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Nome</label>
              <Input value={newUserName} onChange={e => setNewUserName(e.target.value)} placeholder="Nome do usuário" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">E-mail *</label>
              <Input type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} placeholder="email@exemplo.com" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Senha *</label>
              <Input type="password" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Telefone</label>
              <Input value={newUserPhone} onChange={e => setNewUserPhone(maskPhone(e.target.value))} placeholder="(00) 00000-0000" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Perfil de Acesso *</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'client', label: 'Comprador', icon: ShoppingCart },
                  { id: 'provider', label: 'Prestador', icon: Wrench },
                  { id: 'mixed', label: 'Bônus Extra (Prestador+Comprador)', icon: Shuffle },
                  { id: 'admin', label: 'Admin', icon: Shield },
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setNewUserRole(opt.id)}
                    className={`p-2 rounded-lg border text-center transition-all flex items-center gap-2 ${
                      newUserRole === opt.id
                        ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                        : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <opt.icon className={`w-4 h-4 ${newUserRole === opt.id ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className="text-xs font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewUserDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreateUser} disabled={creatingUser}>
              {creatingUser && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Criar Usuário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Reset Password Dialog */}
      <Dialog open={resetPwdDialog.open} onOpenChange={(o) => !o && setResetPwdDialog({ open: false, userId: '', userName: '' })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" /> Redefinir Senha</DialogTitle>
            <DialogDescription>
              Um código temporário foi gerado para <strong>{resetPwdDialog.userName}</strong>. Ao fazer login com este código, o usuário será redirecionado para criar uma nova senha definitiva.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Código / Senha Temporária</Label>
              <div className="flex gap-2">
                <Input 
                  type="text" 
                  value={resetPwdValue} 
                  onChange={e => setResetPwdValue(e.target.value)}
                  className="font-mono text-lg font-bold text-center tracking-wider"
                />
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => {
                    navigator.clipboard.writeText(resetPwdValue);
                    toast.success('Código copiado!');
                  }}
                  title="Copiar código"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                Compartilhe este código com o usuário para o primeiro acesso.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPwdDialog({ open: false, userId: '', userName: '' })}>Cancelar</Button>
            <Button onClick={handleResetPassword} disabled={resettingPwd || resetPwdValue.length < 6}>
              {resettingPwd && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Redefinir Senha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel;
