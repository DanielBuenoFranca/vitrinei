import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Trash2, RefreshCw, Database, Package, Users, Plus, Pencil, Store, Tag, AlertTriangle, FileSpreadsheet, UserCog, Shield, Ruler, Sparkles, Loader2, Crown, ShoppingCart, Wrench, Shuffle, Megaphone, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { ProviderForm } from '@/components/admin/ProviderForm';
import { ProductForm } from '@/components/admin/ProductForm';
import { ServiceForm } from '@/components/admin/ServiceForm';
import { SegmentForm } from '@/components/admin/SegmentForm';
import { ClearDataDialog } from '@/components/admin/ClearDataDialog';
import { InconsistencyPanel } from '@/components/admin/InconsistencyPanel';
import { UnitForm } from '@/components/admin/UnitForm';
import { PermissionGate } from '@/components/PermissionGate';
import { usePermissions } from '@/hooks/usePermissions';
import { reloadDynamicEntries } from '@/data/searchData';
import { Textarea } from '@/components/ui/textarea';
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
  const [providers, setProviders] = useState<Provider[]>([]);
  const [services, setServices] = useState<DynamicService[]>([]);
  const [products, setProducts] = useState<DynamicProduct[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearDialog, setClearDialog] = useState(false);

  const [providerForm, setProviderForm] = useState<{ open: boolean; item: Provider | null }>({ open: false, item: null });
  const [productForm, setProductForm] = useState<{ open: boolean; item: DynamicProduct | null }>({ open: false, item: null });
  const [serviceForm, setServiceForm] = useState<{ open: boolean; item: DynamicService | null }>({ open: false, item: null });
  const [segmentForm, setSegmentForm] = useState<{ open: boolean; item: Segment | null }>({ open: false, item: null });
  const [unitForm, setUnitForm] = useState<{ open: boolean; item: Unit | null }>({ open: false, item: null });
  const [units, setUnits] = useState<Unit[]>([]);
  const [generatingUnits, setGeneratingUnits] = useState(false);

  // Users management
  const [authUsers, setAuthUsers] = useState<any[]>([]);
  const [userProfiles, setUserProfiles] = useState<any[]>([]);
  const [userRoles, setUserRoles] = useState<any[]>([]);

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
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('user_roles').select('*'),
    ]);
    setUserProfiles(profilesRes.data || []);
    setUserRoles(rolesRes.data || []);

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
        setAuthUserEmails(emailMap);
        setAuthUserConfirmed(confirmedMap);
      }
    } catch { /* non-master users won't have access */ }
  };

  const toggleUserRole = async (userId: string, role: string) => {
    const existing = userRoles.find((r: any) => r.user_id === userId && r.role === role);
    if (existing) {
      await supabase.from('user_roles').delete().eq('id', existing.id);
      toast.success('Papel removido');
    } else {
      await supabase.from('user_roles').insert({ user_id: userId, role: role as any });
      toast.success('Papel atribuído');
    }
    fetchUsers();
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

    const { error } = await supabase.from('profiles').update({
      display_name: editUserName.trim() || null,
      phone: editUserPhone.trim() || null,
      avatar_url: editUserAvatar.trim() || null,
    }).eq('user_id', userId);

    if (error) {
      toast.error('Erro ao salvar perfil');
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

    toast.success('Perfil atualizado');
    setEditUserDialog({ open: false, profile: null });
    fetchUsers();
    setSavingUser(false);
  };

  const deleteUserProfile = async (userId: string) => {
    await supabase.from('user_roles').delete().eq('user_id', userId);
    await supabase.from('profiles').delete().eq('user_id', userId);
    toast.success('Perfil removido');
    fetchUsers();
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
    await reloadDynamicEntries();
    fetchData();
  };

  const confirmDeleteProvider = (prov: Provider) => {
    setDeleteConfirm({ open: true, provider: prov });
  };

  const deleteService = async (id: number) => {
    await supabase.from('dynamic_services').delete().eq('id', id);
    toast.success('Serviço excluído');
    await reloadDynamicEntries();
    fetchData();
  };

  const deleteProduct = async (id: number) => {
    await supabase.from('dynamic_products').delete().eq('id', id);
    toast.success('Produto excluído');
    await reloadDynamicEntries();
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
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
          {[
            { icon: Store, label: 'Prestadores', count: providers.length, color: 'bg-primary/10 text-primary' },
            { icon: Users, label: 'Serviços', count: services.length, color: 'bg-primary/10 text-primary' },
            { icon: Package, label: 'Produtos', count: products.length, color: 'bg-accent/20 text-accent-foreground' },
            { icon: Tag, label: 'Segmentos', count: segments.length, color: 'bg-secondary/50 text-secondary-foreground' },
            { icon: Ruler, label: 'Unidades', count: units.length, color: 'bg-secondary/50 text-secondary-foreground' },
            { icon: Database, label: 'Total', count: providers.length + services.length + products.length, color: 'bg-secondary/50 text-secondary-foreground' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.count}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="providers">
          <TabsList>
            <TabsTrigger value="segments">Segmentos ({segments.length})</TabsTrigger>
            <TabsTrigger value="providers">Prestadores ({providers.length})</TabsTrigger>
            <TabsTrigger value="services">Serviços ({services.length})</TabsTrigger>
            <TabsTrigger value="products">Produtos ({products.length})</TabsTrigger>
            <TabsTrigger value="units" className="gap-1.5">
              <Ruler className="h-3.5 w-3.5" />
              Unidades ({units.length})
            </TabsTrigger>
            <TabsTrigger value="issues" className="gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              Inconsistências
              {issueCount > 0 && (
                <Badge variant="destructive" className="ml-1 text-[10px] px-1.5 py-0 min-w-5 h-5">{issueCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-1.5">
              <UserCog className="h-3.5 w-3.5" />
              Usuários ({userProfiles.length})
            </TabsTrigger>
            <TabsTrigger value="marquee" className="gap-1.5">
              <Megaphone className="h-3.5 w-3.5" />
              Avisos
            </TabsTrigger>
          </TabsList>

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
              <CardContent>
                {segments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhum segmento cadastrado.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
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
                          const segProviders = providers.filter(p => p.segment?.includes(seg.name)).length;
                          const segServices = services.filter(s => s.segment === seg.name).length;
                          return (
                            <TableRow key={seg.id}>
                              <TableCell className="font-medium">
                                <Badge variant="outline">{seg.name}</Badge>
                              </TableCell>
                              <TableCell className="text-center">{segProviders}</TableCell>
                              <TableCell className="text-center">{segServices}</TableCell>
                              <TableCell className="text-center">—</TableCell>
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
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── PROVIDERS TAB ── */}
          <TabsContent value="providers">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Cadastro de Prestadores (MEI / PF)</CardTitle>
                  <CardDescription>Profissionais vinculados à plataforma com seus serviços e estoque</CardDescription>
                </div>
                <Button size="sm" onClick={() => setProviderForm({ open: true, item: null })}>
                  <Plus className="h-4 w-4 mr-1" /> Novo Prestador
                </Button>
              </CardHeader>
              <CardContent>
                {providers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhum prestador cadastrado.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>CPF/CNPJ</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Segmento</TableHead>
                          <TableHead>Cidade</TableHead>
                          <TableHead>Distância</TableHead>
                          <TableHead>Avaliação</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Serviços</TableHead>
                          <TableHead>Produtos</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {providers.map((prov) => {
                          const provServices = services.filter(s => s.provider_id === prov.id || s.provider === prov.name);
                          const provProducts = products.filter(p => p.provider_id === prov.id || p.provider === prov.name);
                          return (
                            <TableRow key={prov.id}>
                              <TableCell className="font-medium">{prov.name}</TableCell>
                              <TableCell className="text-xs text-muted-foreground font-mono">{prov.cpf_cnpj || '—'}</TableCell>
                              <TableCell>
                                <Badge variant={prov.type === 'mei' ? 'default' : 'secondary'}>
                                  {prov.type === 'mei' ? 'MEI' : 'PF'}
                                </Badge>
                              </TableCell>
                              <TableCell><div className="flex flex-wrap gap-1">{(prov.segment || []).map(s => <Badge key={s} variant="outline">{s}</Badge>)}</div></TableCell>
                              <TableCell className="text-sm text-muted-foreground">{prov.city || '—'}</TableCell>
                              <TableCell>{prov.distance}</TableCell>
                              <TableCell>⭐ {prov.rating}</TableCell>
                              <TableCell>
                                <Badge variant={prov.active ? 'default' : 'secondary'} className={prov.active ? 'bg-green-500/10 text-green-600 border-green-500/20' : ''}>
                                  {prov.active ? 'Ativo' : 'Inativo'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">{provServices.length}</TableCell>
                              <TableCell className="text-center">{provProducts.length}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setProviderForm({ open: true, item: prov })}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => confirmDeleteProvider(prov)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

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
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Segmento</TableHead>
                          <TableHead>Prestador</TableHead>
                          <TableHead>Mão de Obra</TableHead>
                          <TableHead>Produtos</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Avaliação</TableHead>
                          <TableHead>Tempo</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {services.map((svc) => (
                          <TableRow key={svc.id}>
                            <TableCell className="font-medium">{svc.name}</TableCell>
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
                  </div>
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
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Prestador</TableHead>
                          <TableHead>Preço</TableHead>
                          <TableHead>Tipo Estoque</TableHead>
                          <TableHead>Avaliação</TableHead>
                          <TableHead>Tags</TableHead>
                          <TableHead>Criado em</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.map((prod) => (
                          <TableRow key={prod.id}>
                            <TableCell className="font-medium">{prod.name}</TableCell>
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
                  </div>
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
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
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
                  </div>
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
              onEditProvider={(p) => setProviderForm({ open: true, item: p })}
              onEditService={(s) => setServiceForm({ open: true, item: s })}
              onEditProduct={(p) => setProductForm({ open: true, item: p })}
              onDeleteService={deleteService}
              onDeleteProduct={deleteProduct}
            />
          </TabsContent>

          <TabsContent value="users">
            <PermissionGate permission="admin.users" featureName="Gestão de Usuários" readOnly>
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><UserCog className="w-4 h-4" /> Gestão de Usuários</CardTitle>
                <CardDescription>Usuários cadastrados no sistema — dados completos e edição de perfil</CardDescription>
              </CardHeader>
              <CardContent>
                {userProfiles.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhum usuário cadastrado ainda.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Avatar</TableHead>
                          <TableHead>Nome</TableHead>
                          <TableHead>E-mail</TableHead>
                          <TableHead>Status E-mail</TableHead>
                          <TableHead>Telefone</TableHead>
                          <TableHead>User ID</TableHead>
                          <TableHead>Papéis</TableHead>
                          <TableHead>Criado em</TableHead>
                          <TableHead>Atualizado em</TableHead>
                          <TableHead>Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {userProfiles.map((profile: any) => {
                          const roles = userRoles.filter((r: any) => r.user_id === profile.user_id);
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
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">{authUserEmails[profile.user_id] || '—'}</TableCell>
                              <TableCell className="text-xs">
                                {authUserConfirmed[profile.user_id]
                                  ? <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Verificado</Badge>
                                  : <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pendente</Badge>
                                }
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">{profile.phone || '—'}</TableCell>
                              <TableCell>
                                <code className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded font-mono">
                                  {profile.user_id?.slice(0, 8)}…
                                </code>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1 flex-wrap">
                                  {([
                                    { role: 'master', icon: Crown, color: 'bg-yellow-500/20 text-yellow-700 border-yellow-300' },
                                    { role: 'admin', icon: Shield, color: '' },
                                    { role: 'moderator', icon: Shield, color: '' },
                                    { role: 'provider', icon: Wrench, color: 'bg-blue-500/20 text-blue-700 border-blue-300' },
                                    { role: 'client', icon: ShoppingCart, color: 'bg-green-500/20 text-green-700 border-green-300' },
                                    { role: 'mixed', icon: Shuffle, color: 'bg-purple-500/20 text-purple-700 border-purple-300' },
                                  ] as const).map(({ role, icon: Icon, color }) => {
                                    const hasRole = roles.some((r: any) => r.role === role);
                                    return (
                                      <Badge
                                        key={role}
                                        variant={hasRole ? 'default' : 'outline'}
                                        className={`text-[10px] cursor-pointer ${hasRole && color ? color : ''}`}
                                        onClick={() => toggleUserRole(profile.user_id, role)}
                                      >
                                        <Icon className="w-2.5 h-2.5 mr-0.5" />
                                        {role}
                                      </Badge>
                                    );
                                  })}
                                </div>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {new Date(profile.created_at).toLocaleDateString('pt-BR')}
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {new Date(profile.updated_at).toLocaleDateString('pt-BR')}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditUser(profile)}>
                                    <Pencil className="h-4 w-4" />
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
                  </div>
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
        </Tabs>
      </main>

      {/* Dialogs */}
      <ProviderForm open={providerForm.open} onClose={() => setProviderForm({ open: false, item: null })} onSaved={() => { reloadDynamicEntries(); fetchData(); }} provider={providerForm.item} segments={segmentList} />
      <ProductForm open={productForm.open} onClose={() => setProductForm({ open: false, item: null })} onSaved={() => { reloadDynamicEntries(); fetchData(); }} product={productForm.item} providers={providerList} segments={segmentList} />
      <ServiceForm open={serviceForm.open} onClose={() => setServiceForm({ open: false, item: null })} onSaved={() => { reloadDynamicEntries(); fetchData(); }} service={serviceForm.item} providers={providerList} segments={segmentList} />
      <SegmentForm open={segmentForm.open} onClose={() => setSegmentForm({ open: false, item: null })} onSaved={fetchData} segment={segmentForm.item} />
      <UnitForm open={unitForm.open} onClose={() => setUnitForm({ open: false, item: null })} onSaved={fetchData} unit={unitForm.item} />
      <ClearDataDialog open={clearDialog} onClose={() => setClearDialog(false)} onCleared={() => { reloadDynamicEntries(); fetchData(); }} counts={{ providers: providers.length, services: services.length, products: products.length, segments: segments.length }} />

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
              <Input value={editUserPhone} onChange={e => setEditUserPhone(e.target.value)} placeholder="(00) 00000-0000" />
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
    </div>
  );
};

export default AdminPanel;
