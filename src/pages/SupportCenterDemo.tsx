import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft, Bell, CheckCircle2, Star, DollarSign, MapPin, Clock,
  Headphones, Search, Sparkles, Package, Users, Shield,
  ShoppingBag, Store, ArrowRight, Play, Zap, Phone, FileText,
  UserPlus, BellRing, Truck, AlertTriangle, RefreshCw, Pause,
  MessageCircle, Bot, User, ChevronDown, Loader2, Monitor, Smartphone,
  Database, Globe, Server, Activity, Terminal, Wifi, Plus, Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AiAvatar } from '@/components/AiAvatarGlobal';
import { addDynamicEntries, segments, type DynamicEntry } from '@/data/searchData';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PhoneMessage = {
  id: number;
  content: string;
  detail?: string;
  timestamp: string;
  type: 'incoming' | 'outgoing';
};

type InternalLog = {
  id: number;
  title: string;
  description: string;
  status: 'running' | 'done' | 'pending';
  icon: React.ReactNode;
  details?: React.ReactNode;
  timestamp: string;
};

type ProviderFormData = {
  name: string;
  specialty: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  distance: string;
  segment: string;
};

type ServiceFormData = {
  name: string;
  price: string;
  time: string;
  description: string;
};

type ProductFormData = {
  name: string;
  price: string;
  stockType: 'fisico' | 'drop';
  description: string;
};

const SupportCenterDemo = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const context = searchParams.get('context') || 'Serviço não encontrado';
  const query = searchParams.get('query') || 'serviço especializado';
  const summary = searchParams.get('summary') || '';
  const type = searchParams.get('type') as 'service' | 'product' | 'both' || 'both';
  const segmentParam = searchParams.get('segment') || 'manutencao';
  const suggestionsParam = searchParams.get('suggestions');

  const [step, setStep] = useState(0);
  const [phoneMessages, setPhoneMessages] = useState<PhoneMessage[]>([]);
  const [internalLogs, setInternalLogs] = useState<InternalLog[]>([]);
  const [waitingUser, setWaitingUser] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [showPush, setShowPush] = useState(false);
  const [injectedItems, setInjectedItems] = useState(false);
  const [protocolNumber] = useState(() => Math.floor(Math.random() * 90000 + 10000));
  const logsEndRef = useRef<HTMLDivElement>(null);
  const phoneEndRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);

  // Registration form states
  const [showProviderForm, setShowProviderForm] = useState(false);
  const [showProviderChoice, setShowProviderChoice] = useState(false);
  const [providerFilter, setProviderFilter] = useState('');
  const [existingProviders, setExistingProviders] = useState<Array<{id: number; name: string; segment: string[]; distance: string; rating: number; phone: string | null; email: string | null; city: string | null; address: string | null; type: string}>>([]);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [registeredProviders, setRegisteredProviders] = useState<(ProviderFormData & { rating: number })[]>([]);
  const [registeredServices, setRegisteredServices] = useState<(ServiceFormData & { providerName: string })[]>([]);
  const [registeredProducts, setRegisteredProducts] = useState<(ProductFormData & { providerName: string })[]>([]);

  const [providerForm, setProviderForm] = useState<ProviderFormData>({
    name: '', specialty: '', phone: '', email: '', address: '', city: '', distance: '2.5 km', segment: segmentParam,
  });
  const [serviceForm, setServiceForm] = useState<ServiceFormData>({
    name: '', price: '', time: '45 min', description: '',
  });
  const [productForm, setProductForm] = useState<ProductFormData>({
    name: '', price: '', stockType: 'fisico', description: '',
  });

  // Fetch existing providers from DB
  useEffect(() => {
    const fetchProviders = async () => {
      const { data } = await supabase.from('providers').select('*').eq('active', true);
      if (data) setExistingProviders(data);
    };
    fetchProviders();
  }, []);

  const userSelections: string[] = suggestionsParam ? (() => { try { return JSON.parse(suggestionsParam); } catch { return []; } })() : [];
  const contextName = query.split(',')[0]?.trim() || query;
  const contextTitle = contextName.charAt(0).toUpperCase() + contextName.slice(1);
  const segInfo = segments.find(s => s.id === segmentParam);
  const segmentLabel = segInfo?.label || contextTitle;

  const now = () => {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const addPhoneMsg = useCallback((msg: Omit<PhoneMessage, 'id' | 'timestamp'>) => {
    setPhoneMessages(prev => [...prev, { ...msg, id: prev.length, timestamp: now() }]);
  }, []);

  const addLog = useCallback((log: Omit<InternalLog, 'id' | 'timestamp'>) => {
    setInternalLogs(prev => [...prev, { ...log, id: prev.length, timestamp: now() }]);
  }, []);

  const updateLogStatus = useCallback((id: number, status: 'done' | 'running') => {
    setInternalLogs(prev => prev.map(l => l.id === id ? { ...l, status } : l));
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [internalLogs, isSearching, waitingUser, showProviderForm, showProviderChoice, showServiceForm, showProductForm]);

  useEffect(() => {
    phoneEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [phoneMessages]);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    startProcess();
  }, []);

  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  const startProcess = async () => {
    addPhoneMsg({
      type: 'outgoing',
      content: `Olá, estou procurando "${contextTitle}" mas não encontrei no app. Podem me ajudar?`,
    });
    await sleep(1500);
    addPhoneMsg({
      type: 'incoming',
      content: `Olá! Recebemos sua solicitação. Protocolo #${protocolNumber}. Nossa equipe já está trabalhando para encontrar o que você precisa. Você será notificado assim que tivermos novidades! 😊`,
    });
    await sleep(1000);
    addLog({
      title: 'Protocolo aberto',
      description: `#${protocolNumber} • Cliente solicitou: "${contextTitle}"`,
      status: 'done',
      icon: <FileText className="w-4 h-4" />,
    });
    await sleep(800);
    addLog({
      title: 'Análise de contexto pela IA',
      description: `Processando solicitação do cliente...`,
      status: 'done',
      icon: <Bot className="w-4 h-4" />,
      details: (
        <div className="mt-2 space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <Badge className="bg-primary/10 text-primary text-[10px]"><Search className="w-2.5 h-2.5 mr-0.5" /> Busca</Badge>
            <span className="text-muted-foreground">"{query}"</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-accent/10 text-accent-foreground text-[10px]">📂 Segmento</Badge>
            <span className="text-muted-foreground">{segmentLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-secondary text-secondary-foreground text-[10px]">📋 Tipo</Badge>
            <span className="text-muted-foreground">{type === 'service' ? 'Serviço' : type === 'product' ? 'Produto' : 'Serviço + Produtos'}</span>
          </div>
          {userSelections.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {userSelections.map((sel, i) => (
                <Badge key={i} variant="outline" className="text-[9px]">{sel}</Badge>
              ))}
            </div>
          )}
          {summary && <p className="text-muted-foreground italic">"{summary}"</p>}
        </div>
      ),
    });
    setStep(1);
    setWaitingUser(true);
  };

  const handleRegisterProvider = () => {
    if (!providerForm.name || !providerForm.specialty) return;
    const provider = { ...providerForm, rating: 4.5 + Math.random() * 0.5 };
    setRegisteredProviders(prev => [...prev, provider]);
    addLog({
      title: `Prestador cadastrado: ${providerForm.name}`,
      description: `${providerForm.specialty} • ${providerForm.distance} • ${providerForm.city || 'Região local'}`,
      status: 'done',
      icon: <UserPlus className="w-4 h-4" />,
      details: (
        <div className="mt-2 p-2.5 rounded-lg bg-muted/50 border border-border/50">
          <div className="flex items-start gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-sm">👩‍🔧</div>
            <div>
              <p className="font-semibold text-xs text-foreground">{providerForm.name}</p>
              <p className="text-[10px] text-muted-foreground">{providerForm.specialty}</p>
              <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" /> {providerForm.distance}</span>
                {providerForm.phone && <span className="flex items-center gap-0.5"><Phone className="w-2.5 h-2.5" /> {providerForm.phone}</span>}
                {providerForm.email && <span className="flex items-center gap-0.5">✉️ {providerForm.email}</span>}
              </div>
            </div>
          </div>
        </div>
      ),
    });
    addPhoneMsg({
      type: 'incoming',
      content: `✅ Encontramos um profissional para você: ${providerForm.name} — ${providerForm.specialty}. Estamos verificando serviços e estoque disponíveis...`,
    });
    setProviderForm({ name: '', specialty: '', phone: '', email: '', address: '', city: '', distance: '2.5 km', segment: segmentParam });
    setShowProviderForm(false);
  };

  const handleRegisterService = () => {
    if (!serviceForm.name || !serviceForm.price || registeredProviders.length === 0) return;
    const providerName = registeredProviders[registeredProviders.length - 1].name;
    setRegisteredServices(prev => [...prev, { ...serviceForm, providerName }]);
    addLog({
      title: `Serviço cadastrado: ${serviceForm.name}`,
      description: `Vinculado a ${providerName} • R$ ${serviceForm.price} • ${serviceForm.time}`,
      status: 'done',
      icon: <Sparkles className="w-4 h-4" />,
      details: (
        <div className="mt-2 p-2 rounded-lg bg-primary/5 border border-primary/10">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-primary shrink-0" />
            <div>
              <p className="font-medium text-xs text-foreground">{serviceForm.name}</p>
              <p className="text-[10px] text-muted-foreground">{providerName} • R$ {serviceForm.price} • {serviceForm.time}</p>
            </div>
          </div>
        </div>
      ),
    });
    setServiceForm({ name: '', price: '', time: '45 min', description: '' });
    setShowServiceForm(false);
  };

  const handleRegisterProduct = () => {
    if (!productForm.name || !productForm.price || registeredProviders.length === 0) return;
    const providerName = registeredProviders[registeredProviders.length - 1].name;
    setRegisteredProducts(prev => [...prev, { ...productForm, providerName }]);
    addLog({
      title: `Produto cadastrado: ${productForm.name}`,
      description: `${providerName} • R$ ${productForm.price} • ${productForm.stockType === 'fisico' ? 'Estoque Local' : 'Drop-shipping'}`,
      status: 'done',
      icon: <Package className="w-4 h-4" />,
      details: (
        <div className="mt-2 p-2 rounded-lg bg-muted/50 border border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-3 h-3 text-success shrink-0" />
              <div>
                <p className="font-medium text-xs text-foreground">{productForm.name}</p>
                <p className="text-[10px] text-muted-foreground">{providerName}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant={productForm.stockType === 'fisico' ? 'default' : 'secondary'} className="text-[8px] px-1.5">
                {productForm.stockType === 'fisico' ? 'Local' : 'Drop'}
              </Badge>
              <span className="text-xs font-semibold text-foreground">R${productForm.price}</span>
            </div>
          </div>
        </div>
      ),
    });
    setProductForm({ name: '', price: '', stockType: 'fisico', description: '' });
    setShowProductForm(false);
  };

  const handleNext = async () => {
    setWaitingUser(false);

    if (step === 1) {
      addLog({
        title: 'Busca de profissionais iniciada',
        description: `Pesquisando base de dados de ${segmentLabel} na região...`,
        status: 'running',
        icon: <Search className="w-4 h-4" />,
      });
      setStep(2);
      setIsSearching(true);
      setSearchProgress(0);
    } else if (step === 3) {
      // Show provider choice: existing or new
      setShowProviderChoice(true);
      addLog({
        title: 'Seleção de prestador',
        description: 'Selecione um prestador existente na base ou cadastre um novo',
        status: 'running',
        icon: <Users className="w-4 h-4" />,
      });
    } else if (step === 4) {
      // Show service registration form
      setShowServiceForm(true);
      addLog({
        title: 'Cadastro de serviço',
        description: `Vincular novo serviço ao prestador ${registeredProviders[registeredProviders.length - 1]?.name}`,
        status: 'running',
        icon: <Sparkles className="w-4 h-4" />,
      });
    } else if (step === 5) {
      // Show product registration form
      setShowProductForm(true);
      addLog({
        title: 'Cadastro de produto/estoque',
        description: `Vincular produto ao prestador ${registeredProviders[registeredProviders.length - 1]?.name}`,
        status: 'running',
        icon: <Package className="w-4 h-4" />,
      });
    } else if (step === 6) {
      // Inject and notify
      const logId = internalLogs.length;
      addLog({
        title: 'Atualizando catálogo e estoque',
        description: `Injetando ${registeredProviders.length} prestador(es), ${registeredServices.length} serviço(s) e ${registeredProducts.length} produto(s)...`,
        status: 'running',
        icon: <Database className="w-4 h-4" />,
      });
      await sleep(2000);
      updateLogStatus(logId, 'done');

      // Inject items
      if (!injectedItems) {
        const entries: DynamicEntry[] = registeredProviders.map((p, i) => {
          const provServices = registeredServices.filter(s => s.providerName === p.name);
          const provProducts = registeredProducts.filter(pr => pr.providerName === p.name);
          return {
            type: 'service' as const,
            service: {
              id: 9000 + Math.floor(Math.random() * 1000) + i,
              name: provServices[0]?.name || `${contextTitle} - ${p.name}`,
              segment: p.segment || segmentParam,
              provider: p.name,
              price: provServices[0] ? parseFloat(provServices[0].price) : 120,
              rating: parseFloat(p.rating.toFixed(1)),
              distance: p.distance,
              time: provServices[0]?.time || '45 min',
              products: provProducts.map(pr => pr.name),
            },
            products: provProducts.map((pr, j) => ({
              id: 9500 + Math.floor(Math.random() * 1000) + j,
              name: pr.name,
              price: parseFloat(pr.price),
              provider: p.name,
              stockType: pr.stockType,
              rating: 4.7,
              distance: p.distance,
              relatedServiceIds: [9000 + i],
              tags: [query.toLowerCase(), contextTitle.toLowerCase(), segmentParam],
            })),
            maxPerSegment: 5,
          };
        });
        addDynamicEntries(entries).then(() => setInjectedItems(true));
      }

      addLog({
        title: 'Enviando notificação push',
        description: `Notificando cliente sobre disponibilidade de "${contextTitle}"`,
        status: 'done',
        icon: <BellRing className="w-4 h-4" />,
      });

      await sleep(1000);
      setShowPush(true);
      addPhoneMsg({
        type: 'incoming',
        content: `🎉 Boa notícia! O serviço "${contextTitle}" que você procurou já está disponível! ${registeredProviders.length} profissional(is) qualificado(s) pronto(s) para atender na sua região. Toque para agendar.`,
      });
      setTimeout(() => setShowPush(false), 4000);

      await sleep(1500);
      addLog({
        title: 'Processo concluído',
        description: `Protocolo #${protocolNumber} encerrado dentro do SLA`,
        status: 'done',
        icon: <CheckCircle2 className="w-4 h-4" />,
        details: (
          <div className="mt-2 grid grid-cols-3 gap-2">
            <div className="text-center p-2 rounded-lg bg-success/5 border border-success/20">
              <p className="text-lg font-bold text-success">{registeredProviders.length}</p>
              <p className="text-[9px] text-muted-foreground">Prestador(es)</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-success/5 border border-success/20">
              <p className="text-lg font-bold text-success">{registeredServices.length}</p>
              <p className="text-[9px] text-muted-foreground">Serviço(s)</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-lg font-bold text-primary">{registeredProducts.length}</p>
              <p className="text-[9px] text-muted-foreground">Produto(s)</p>
            </div>
          </div>
        ),
      });

      setStep(7);
      setWaitingUser(true);
    } else if (step === 7) {
      navigate('/');
    }
  };

  // After provider form submit, advance to step 4
  useEffect(() => {
    if (registeredProviders.length > 0 && step === 3 && !showProviderForm && !showProviderChoice) {
      setInternalLogs(prev => prev.map(l => (l.status === 'running' && (l.title === 'Cadastro de novo prestador' || l.title === 'Seleção de prestador')) ? { ...l, status: 'done' as const } : l));
      setStep(4);
      setWaitingUser(true);
    }
  }, [registeredProviders, step, showProviderForm, showProviderChoice]);

  // After service form submit, advance to step 5
  useEffect(() => {
    if (registeredServices.length > 0 && step === 4 && !showServiceForm) {
      setInternalLogs(prev => prev.map(l => l.status === 'running' && l.title === 'Cadastro de serviço' ? { ...l, status: 'done' as const } : l));
      setStep(5);
      setWaitingUser(true);
    }
  }, [registeredServices, step, showServiceForm]);

  // After product form submit, advance to step 6
  useEffect(() => {
    if (registeredProducts.length > 0 && step === 5 && !showProductForm) {
      setInternalLogs(prev => prev.map(l => l.status === 'running' && l.title === 'Cadastro de produto/estoque' ? { ...l, status: 'done' as const } : l));
      setStep(6);
      setWaitingUser(true);
    }
  }, [registeredProducts, step, showProductForm]);

  // Search progress animation
  useEffect(() => {
    if (!isSearching) return;
    setSearchProgress(0);
    const interval = setInterval(() => {
      setSearchProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setIsSearching(false);
          setInternalLogs(prev => prev.map(l => l.status === 'running' ? { ...l, status: 'done' as const } : l));
          setTimeout(() => {
            addLog({
              title: 'Nenhum prestador encontrado na base',
              description: `Nenhum profissional de "${contextTitle}" cadastrado na região. Necessário cadastro manual.`,
              status: 'done',
              icon: <AlertTriangle className="w-4 h-4" />,
              details: (
                <div className="mt-2 p-2 rounded-lg bg-destructive/5 border border-destructive/20 text-xs text-muted-foreground">
                  <p>A busca nas bases internas não retornou prestadores para esta especialidade.</p>
                  <p className="mt-1 font-semibold text-foreground">→ Ação necessária: Cadastrar novo prestador</p>
                </div>
              ),
            });
            setStep(3);
            setWaitingUser(true);
          }, 500);
          return 100;
        }
        return p + 2;
      });
    }, 60);
    return () => clearInterval(interval);
  }, [isSearching]);

  const stepLabels: Record<number, string> = {
    1: 'Iniciar busca de profissionais',
    3: 'Selecionar ou cadastrar prestador',
    4: 'Cadastrar serviço para este prestador',
    5: 'Cadastrar produto/estoque',
    6: 'Injetar no catálogo e notificar cliente',
    7: 'Buscar no hub agora',
  };

  const handleSelectExistingProvider = (provider: typeof existingProviders[0]) => {
    const segStr = Array.isArray(provider.segment) ? provider.segment.join(', ') : provider.segment;
    const providerData: ProviderFormData & { rating: number } = {
      name: provider.name,
      specialty: segStr,
      phone: provider.phone || '',
      email: provider.email || '',
      address: provider.address || '',
      city: provider.city || '',
      distance: provider.distance,
      segment: segStr,
      rating: provider.rating,
    };
    setRegisteredProviders(prev => [...prev, providerData]);
    addLog({
      title: `Prestador selecionado: ${provider.name}`,
      description: `${segStr} • ${provider.distance} • ${provider.city || 'Região local'}`,
      status: 'done',
      icon: <Users className="w-4 h-4" />,
      details: (
        <div className="mt-2 p-2.5 rounded-lg bg-muted/50 border border-border/50">
          <div className="flex items-start gap-2">
            <div className="w-7 h-7 rounded-full bg-success/10 flex items-center justify-center text-sm">✅</div>
            <div>
              <p className="font-semibold text-xs text-foreground">{provider.name}</p>
              <p className="text-[10px] text-muted-foreground">{provider.segment} • ⭐ {provider.rating.toFixed(1)}</p>
            </div>
          </div>
        </div>
      ),
    });
    addPhoneMsg({
      type: 'incoming',
      content: `✅ Encontramos o profissional ${provider.name} já cadastrado na nossa base! Estamos verificando serviços e estoque disponíveis...`,
    });
    setShowProviderChoice(false);
    // Update running log
    setInternalLogs(prev => prev.map(l => l.status === 'running' && l.title === 'Seleção de prestador' ? { ...l, status: 'done' as const } : l));
  };

  const handleShowNewProviderForm = () => {
    setShowProviderChoice(false);
    setShowProviderForm(true);
    // Update the log
    setInternalLogs(prev => prev.map(l => l.status === 'running' && l.title === 'Seleção de prestador' ? { ...l, status: 'done' as const, title: 'Cadastro de novo prestador', description: 'Preencha os dados do novo profissional' } : l));
    addLog({
      title: 'Cadastro de novo prestador',
      description: 'Preencha os dados do novo profissional para atender a demanda',
      status: 'running',
      icon: <UserPlus className="w-4 h-4" />,
    });
  };

  const isFormOpen = showProviderForm || showProviderChoice || showServiceForm || showProductForm;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-20">
        <div className="container mx-auto flex items-center gap-3 p-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Monitor className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="font-display font-bold text-sm text-foreground">Central de Atendimento — Painel Interno</h1>
              <p className="text-[11px] text-muted-foreground">Protocolo #{protocolNumber} • Simulação de processos internos</p>
            </div>
          </div>
          <Badge className="bg-success/10 text-success border-success/20 text-xs gap-1">
            <Activity className="w-3 h-3" /> Operando
          </Badge>
        </div>
      </div>

      {/* Push Notification Overlay */}
      <AnimatePresence>
        {showPush && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed top-16 left-4 right-4 z-50 max-w-md mx-auto"
          >
            <Card className="border-success shadow-2xl bg-card">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                    <BellRing className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Push enviada ao cliente • agora</p>
                    <p className="text-sm font-bold text-foreground">🎉 Notificação entregue!</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      "{contextTitle}" — {registeredProviders.length} profissional(is) pronto(s) para atender.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content: split layout */}
      <div className="flex-1 overflow-hidden">
        <div className="container mx-auto h-full flex flex-col lg:flex-row gap-4 p-4">

          {/* LEFT: Phone Mockup — Client View */}
          <div className="lg:w-80 shrink-0 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-3 self-start">
              <Smartphone className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Visão do Cliente</span>
            </div>
            <div className="w-72 bg-foreground/5 border-2 border-foreground/20 rounded-[2rem] p-2 shadow-xl">
              <div className="w-20 h-5 bg-foreground/20 rounded-full mx-auto mb-1" />
              <div className="bg-background rounded-2xl overflow-hidden h-[420px] flex flex-col">
                <div className="bg-primary px-3 py-2.5 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                    <Zap className="w-3 h-3 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-primary-foreground">EcoMEI</p>
                    <p className="text-[9px] text-primary-foreground/70">Central de Atendimento</p>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  <AnimatePresence>
                    {phoneMessages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className={`flex ${msg.type === 'outgoing' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-3 py-2 ${
                            msg.type === 'outgoing'
                              ? 'bg-primary text-primary-foreground rounded-br-sm'
                              : 'bg-muted text-foreground rounded-bl-sm'
                          }`}
                        >
                          <p className="text-[11px] leading-relaxed">{msg.content}</p>
                          <p className={`text-[8px] mt-1 ${msg.type === 'outgoing' ? 'text-primary-foreground/60 text-right' : 'text-muted-foreground'}`}>
                            {msg.timestamp}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {phoneMessages.length === 0 && (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-[10px] text-muted-foreground">Aguardando início...</p>
                    </div>
                  )}
                  <div ref={phoneEndRef} />
                </div>
              </div>
              <div className="w-16 h-1 bg-foreground/20 rounded-full mx-auto mt-1.5" />
            </div>
          </div>

          {/* RIGHT: Internal Operations Panel */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-3">
              <Terminal className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Processamento Interno — Central</span>
              <Badge variant="outline" className="text-[9px] ml-auto gap-1">
                <Server className="w-2.5 h-2.5" /> Backoffice
              </Badge>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pb-28 pr-1">
              <AnimatePresence>
                {internalLogs.map((log) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <Card className={`border-l-4 ${log.status === 'done' ? 'border-l-success' : log.status === 'running' ? 'border-l-primary animate-pulse' : 'border-l-muted'}`}>
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            log.status === 'done' ? 'bg-success/10 text-success' : log.status === 'running' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                          }`}>
                            {log.status === 'running' ? <Loader2 className="w-4 h-4 animate-spin" /> : log.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm text-foreground">{log.title}</p>
                              <Badge className={`text-[8px] px-1.5 ${
                                log.status === 'done' ? 'bg-success/10 text-success' : log.status === 'running' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                              }`}>
                                {log.status === 'done' ? '✓ Concluído' : log.status === 'running' ? '⏳ Em andamento' : 'Pendente'}
                              </Badge>
                              <span className="text-[9px] text-muted-foreground ml-auto shrink-0">{log.timestamp}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{log.description}</p>
                            {log.details}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Search progress inline */}
              {isSearching && (
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                  <Card className="border-l-4 border-l-primary">
                    <CardContent className="p-3">
                      <p className="text-sm font-semibold text-foreground mb-2">🔍 Pesquisando profissionais de {segmentLabel}...</p>
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                            <span>Progresso</span>
                            <span>{Math.round(searchProgress)}%</span>
                          </div>
                          <Progress value={searchProgress} className="h-1.5" />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { label: 'Bases consultadas', value: Math.floor(searchProgress / 10), icon: '🗂️' },
                            { label: 'Profissionais analisados', value: Math.floor(searchProgress / 5), icon: '👤' },
                            { label: 'Regiões cobertas', value: Math.floor(searchProgress / 15) + 1, icon: '📍' },
                          ].map((m) => (
                            <div key={m.label} className="text-center p-1.5 rounded-lg bg-muted/50">
                              <p className="text-xs">{m.icon}</p>
                              <p className="text-xs font-bold text-foreground">{m.value}</p>
                              <p className="text-[8px] text-muted-foreground">{m.label}</p>
                            </div>
                          ))}
                        </div>
                        <div className="space-y-1">
                          {searchProgress > 20 && (
                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5 text-success" /> Consultando base de {segmentLabel}...
                            </motion.p>
                          )}
                          {searchProgress > 45 && (
                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5 text-success" /> Verificando avaliações...
                            </motion.p>
                          )}
                          {searchProgress > 70 && (
                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5 text-success" /> Mapeando estoque de produtos...
                            </motion.p>
                          )}
                          {searchProgress > 90 && (
                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <AlertTriangle className="w-2.5 h-2.5 text-destructive" /> Nenhum profissional encontrado...
                            </motion.p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Provider Choice: Existing or New */}
              <AnimatePresence>
                {showProviderChoice && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <Card className="border-l-4 border-l-primary border-primary/30 shadow-lg">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Users className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-foreground">Selecionar Prestador</p>
                            <p className="text-[10px] text-muted-foreground">Escolha um existente na base ou cadastre um novo</p>
                          </div>
                        </div>

                        {existingProviders.length > 0 && (
                          <div className="space-y-2 mb-4">
                            <label className="text-[11px] font-medium text-muted-foreground block">Prestadores cadastrados na base ({existingProviders.length})</label>
                            <Input
                              value={providerFilter}
                              onChange={e => setProviderFilter(e.target.value)}
                              placeholder="Filtrar por nome..."
                              className="h-8 text-xs mb-1"
                            />
                            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                              {existingProviders.filter(p => p.name.toLowerCase().includes(providerFilter.toLowerCase())).map(p => (
                                <button
                                  key={p.id}
                                  onClick={() => handleSelectExistingProvider(p)}
                                  className="w-full text-left p-2.5 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-sm">👩‍🔧</div>
                                      <div>
                                        <p className="font-medium text-xs text-foreground">{p.name}</p>
                                        <p className="text-[10px] text-muted-foreground">{p.segment} • {p.distance}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                      {p.rating.toFixed(1)}
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {existingProviders.length === 0 && (
                          <div className="p-3 rounded-lg bg-muted/50 border border-border/50 mb-4">
                            <p className="text-xs text-muted-foreground text-center">Nenhum prestador cadastrado na base de dados</p>
                          </div>
                        )}

                        <div className="border-t border-border pt-3">
                          <Button className="w-full gap-2" variant="outline" onClick={handleShowNewProviderForm}>
                            <UserPlus className="w-4 h-4" /> Cadastrar Novo Prestador
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Provider Registration Form */}
              <AnimatePresence>
                {showProviderForm && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <Card className="border-l-4 border-l-primary border-primary/30 shadow-lg">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <UserPlus className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-foreground">Cadastrar Novo Prestador</p>
                            <p className="text-[10px] text-muted-foreground">Preencha os dados do profissional para atender "{contextTitle}"</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                            <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Nome completo *</label>
                            <Input value={providerForm.name} onChange={e => setProviderForm(f => ({ ...f, name: e.target.value }))}
                              placeholder="Ex: Ana Mendes" className="h-9 text-sm" />
                          </div>
                          <div className="col-span-2">
                            <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Especialidade *</label>
                            <Input value={providerForm.specialty} onChange={e => setProviderForm(f => ({ ...f, specialty: e.target.value }))}
                              placeholder={`Ex: Especialista em ${contextTitle}`} className="h-9 text-sm" />
                          </div>
                          <div>
                            <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Telefone</label>
                            <Input value={providerForm.phone} onChange={e => setProviderForm(f => ({ ...f, phone: e.target.value }))}
                              placeholder="(11) 99999-0000" className="h-9 text-sm" />
                          </div>
                          <div>
                            <label className="text-[11px] font-medium text-muted-foreground mb-1 block">E-mail</label>
                            <Input value={providerForm.email} onChange={e => setProviderForm(f => ({ ...f, email: e.target.value }))}
                              placeholder="email@exemplo.com" className="h-9 text-sm" />
                          </div>
                          <div>
                            <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Cidade</label>
                            <Input value={providerForm.city} onChange={e => setProviderForm(f => ({ ...f, city: e.target.value }))}
                              placeholder="São Paulo" className="h-9 text-sm" />
                          </div>
                          <div>
                            <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Distância aprox.</label>
                            <Input value={providerForm.distance} onChange={e => setProviderForm(f => ({ ...f, distance: e.target.value }))}
                              placeholder="2.5 km" className="h-9 text-sm" />
                          </div>
                          <div className="col-span-2">
                            <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Endereço</label>
                            <Input value={providerForm.address} onChange={e => setProviderForm(f => ({ ...f, address: e.target.value }))}
                              placeholder="Rua, número, bairro" className="h-9 text-sm" />
                          </div>
                          <div className="col-span-2">
                            <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Segmento</label>
                            <Select value={providerForm.segment} onValueChange={v => setProviderForm(f => ({ ...f, segment: v }))}>
                              <SelectTrigger className="h-9 text-sm">
                                <SelectValue placeholder="Selecione o segmento" />
                              </SelectTrigger>
                              <SelectContent>
                                {segments.map(seg => (
                                  <SelectItem key={seg.id} value={seg.id}>{seg.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button className="flex-1 gap-2" onClick={handleRegisterProvider}
                            disabled={!providerForm.name || !providerForm.specialty}>
                            <Save className="w-4 h-4" /> Cadastrar Prestador
                          </Button>
                          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setShowProviderForm(false)}>
                            Cancelar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Service Registration Form */}
              <AnimatePresence>
                {showServiceForm && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <Card className="border-l-4 border-l-primary border-primary/30 shadow-lg">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-foreground">Cadastrar Serviço</p>
                            <p className="text-[10px] text-muted-foreground">Vincular a: {registeredProviders[registeredProviders.length - 1]?.name}</p>
                          </div>
                        </div>

                        {/* AI Suggested items from context */}
                        {userSelections.length > 0 && (
                          <div className="mb-3 p-2.5 rounded-lg bg-accent/5 border border-accent/20">
                            <p className="text-[10px] font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-primary" /> Sugestões da IA (selecione para preencher):
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {userSelections.map((sel, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => setServiceForm(f => ({ ...f, name: sel }))}
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${
                                    serviceForm.name === sel
                                      ? 'bg-primary text-primary-foreground border-primary'
                                      : 'bg-muted/30 text-muted-foreground border-border hover:border-primary/40'
                                  }`}
                                >
                                  {sel}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                            <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Nome do serviço *</label>
                            <Input value={serviceForm.name} onChange={e => setServiceForm(f => ({ ...f, name: e.target.value }))}
                              placeholder={`Ex: ${contextTitle} - Completo`} className="h-9 text-sm" />
                          </div>
                          <div>
                            <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Preço (R$) *</label>
                            <Input value={serviceForm.price} onChange={e => setServiceForm(f => ({ ...f, price: e.target.value }))}
                              placeholder="120" type="number" className="h-9 text-sm" />
                          </div>
                          <div>
                            <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Tempo estimado</label>
                            <Input value={serviceForm.time} onChange={e => setServiceForm(f => ({ ...f, time: e.target.value }))}
                              placeholder="45 min" className="h-9 text-sm" />
                          </div>
                          <div className="col-span-2">
                            <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Descrição</label>
                            <Input value={serviceForm.description} onChange={e => setServiceForm(f => ({ ...f, description: e.target.value }))}
                              placeholder="Descrição breve do serviço" className="h-9 text-sm" />
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button className="flex-1 gap-2" onClick={handleRegisterService}
                            disabled={!serviceForm.name || !serviceForm.price}>
                            <Save className="w-4 h-4" /> Cadastrar Serviço
                          </Button>
                          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setShowServiceForm(false)}>
                            Cancelar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Product Registration Form */}
              <AnimatePresence>
                {showProductForm && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                    <Card className="border-l-4 border-l-primary border-primary/30 shadow-lg">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                            <Package className="w-4 h-4 text-success" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-foreground">Cadastrar Produto/Estoque</p>
                            <p className="text-[10px] text-muted-foreground">Vincular a: {registeredProviders[registeredProviders.length - 1]?.name}</p>
                          </div>
                        </div>

                        {/* AI Suggested products from context */}
                        {userSelections.length > 0 && (
                          <div className="mb-3 p-2.5 rounded-lg bg-accent/5 border border-accent/20">
                            <p className="text-[10px] font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-primary" /> Sugestões da IA (selecione para preencher):
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {userSelections.map((sel, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => setProductForm(f => ({ ...f, name: sel }))}
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors ${
                                    productForm.name === sel
                                      ? 'bg-primary text-primary-foreground border-primary'
                                      : 'bg-muted/30 text-muted-foreground border-border hover:border-primary/40'
                                  }`}
                                >
                                  {sel}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                            <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Nome do produto *</label>
                            <Input value={productForm.name} onChange={e => setProductForm(f => ({ ...f, name: e.target.value }))}
                              placeholder={`Ex: Kit ${contextTitle} Profissional`} className="h-9 text-sm" />
                          </div>
                          <div>
                            <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Preço (R$) *</label>
                            <Input value={productForm.price} onChange={e => setProductForm(f => ({ ...f, price: e.target.value }))}
                              placeholder="89" type="number" className="h-9 text-sm" />
                          </div>
                          <div>
                            <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Tipo de estoque</label>
                            <Select value={productForm.stockType} onValueChange={v => setProductForm(f => ({ ...f, stockType: v as 'fisico' | 'drop' }))}>
                              <SelectTrigger className="h-9 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="fisico">Estoque Local</SelectItem>
                                <SelectItem value="drop">Drop-shipping</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-2">
                            <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Descrição</label>
                            <Input value={productForm.description} onChange={e => setProductForm(f => ({ ...f, description: e.target.value }))}
                              placeholder="Descrição breve do produto" className="h-9 text-sm" />
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button className="flex-1 gap-2" onClick={handleRegisterProduct}
                            disabled={!productForm.name || !productForm.price}>
                            <Save className="w-4 h-4" /> Cadastrar Produto
                          </Button>
                          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setShowProductForm(false)}>
                            Cancelar
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={logsEndRef} />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      {waitingUser && !isFormOpen && step <= 7 && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 z-10"
        >
          <div className="container mx-auto max-w-2xl">
            <Button className="w-full gap-2 h-11 text-sm" onClick={handleNext}>
              <ArrowRight className="w-4 h-4" />
              {stepLabels[step] || 'Continuar'}
            </Button>
            <p className="text-[10px] text-muted-foreground text-center mt-1.5">
              {step < 7 ? `Clique para avançar • Etapa ${step} de 6` : 'Processo finalizado — ver resultados no hub'}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default SupportCenterDemo;
