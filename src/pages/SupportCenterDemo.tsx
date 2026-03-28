import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft, Bell, CheckCircle2, Star, DollarSign, MapPin, Clock,
  Headphones, Search, Sparkles, Package, Users, Shield,
  ShoppingBag, Store, ArrowRight, Play, Zap, Phone, FileText,
  UserPlus, BellRing, Truck, AlertTriangle, RefreshCw, Pause,
  MessageCircle, Bot, User, ChevronDown, Loader2, Monitor, Smartphone,
  Database, Globe, Server, Activity, Terminal, Wifi
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AiAvatar } from '@/components/AiAvatarGlobal';
import { addDynamicEntries, segments, type DynamicEntry } from '@/data/searchData';

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

  const userSelections: string[] = suggestionsParam ? (() => { try { return JSON.parse(suggestionsParam); } catch { return []; } })() : [];

  const contextName = query.split(',')[0]?.trim() || query;
  const contextTitle = contextName.charAt(0).toUpperCase() + contextName.slice(1);
  const segInfo = segments.find(s => s.id === segmentParam);
  const segmentLabel = segInfo?.label || contextTitle;

  const newProviders = [
    { name: `${contextTitle} - Ana Mendes`, rating: 4.9, distance: '1.8 km', price: 120, specialty: `Especialista em ${contextTitle}` },
    { name: `${contextTitle} - Carlos Lima`, rating: 4.7, distance: '3.2 km', price: 95, specialty: `Profissional ${segmentLabel}` },
  ];

  const newProducts = [
    { name: userSelections.find(s => s.toLowerCase().includes('produto') || s.toLowerCase().includes('kit')) || `Kit ${contextTitle} Profissional`, price: 89, provider: newProviders[0].name, stockType: 'fisico' as const },
    { name: `${contextTitle} - Produto Essencial`, price: 45, provider: newProviders[0].name, stockType: 'fisico' as const },
    { name: `Acessório ${contextTitle} Premium`, price: 65, provider: newProviders[1].name, stockType: 'drop' as const },
  ];

  const webResearchedServices = [
    { name: `${contextTitle} - Manutenção Preventiva`, description: 'Serviço mais buscado na web para esta área' },
    { name: `Instalação de ${contextTitle}`, description: 'Segundo serviço mais procurado online' },
    { name: `Consultoria ${segmentLabel}`, description: 'Avaliação e orçamento especializado' },
  ];

  const webResearchedProducts = [
    { name: `${contextTitle} - Kit Completo`, description: 'Produto mais vendido na categoria' },
    { name: `Ferramenta para ${contextTitle}`, description: 'Acessório profissional' },
    { name: `Proteção ${contextTitle}`, description: 'Equipamento de segurança' },
  ];

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

  // Auto-scroll
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [internalLogs, isSearching, waitingUser]);

  useEffect(() => {
    phoneEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [phoneMessages]);

  // Initialize
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    startProcess();
  }, []);

  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  const startProcess = async () => {
    // Step 0: Client sends message on phone
    addPhoneMsg({
      type: 'outgoing',
      content: `Olá, estou procurando "${contextTitle}" mas não encontrei no app. Podem me ajudar?`,
    });

    await sleep(1500);

    // System receives and opens protocol
    addPhoneMsg({
      type: 'incoming',
      content: `Olá! Recebemos sua solicitação. Protocolo #${protocolNumber}. Nossa equipe já está trabalhando para encontrar o que você precisa. Você será notificado assim que tivermos novidades! 😊`,
    });

    await sleep(1000);

    // Internal: protocol opened
    addLog({
      title: 'Protocolo aberto',
      description: `#${protocolNumber} • Cliente solicitou: "${contextTitle}"`,
      status: 'done',
      icon: <FileText className="w-4 h-4" />,
    });

    await sleep(800);

    // Internal: context analysis
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

  const handleNext = async () => {
    setWaitingUser(false);

    if (step === 1) {
      // Internal: start searching professionals
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
      // Internal: web research
      const logId = internalLogs.length;
      addLog({
        title: 'Pesquisa web em andamento',
        description: `Consultando fontes externas sobre "${contextTitle}"...`,
        status: 'running',
        icon: <Globe className="w-4 h-4" />,
      });

      await sleep(2500);

      updateLogStatus(logId, 'done');

      addLog({
        title: 'Serviços e produtos mapeados',
        description: `${webResearchedServices.length} serviços + ${webResearchedProducts.length} produtos identificados`,
        status: 'done',
        icon: <Database className="w-4 h-4" />,
        details: (
          <div className="mt-2 space-y-3">
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">🌐 Serviços (pesquisa web)</p>
              <div className="space-y-1.5">
                {webResearchedServices.map((svc, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10">
                    <Sparkles className="w-3 h-3 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-xs text-foreground truncate">{svc.name}</p>
                      <p className="text-[10px] text-muted-foreground">{svc.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">📦 Produtos (pesquisa web)</p>
              <div className="space-y-1.5">
                {webResearchedProducts.map((prod, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-success/5 border border-success/10">
                    <ShoppingBag className="w-3 h-3 text-success shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-xs text-foreground truncate">{prod.name}</p>
                      <p className="text-[10px] text-muted-foreground">{prod.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ),
      });

      setStep(4);
      setWaitingUser(true);
    } else if (step === 4) {
      // Internal: stock injection
      const logId = internalLogs.length;
      addLog({
        title: 'Atualizando catálogo e estoque',
        description: `Injetando ${newProducts.length} produtos nos profissionais cadastrados...`,
        status: 'running',
        icon: <Package className="w-4 h-4" />,
      });

      await sleep(2000);

      updateLogStatus(logId, 'done');

      addLog({
        title: 'Estoque atualizado',
        description: `${newProducts.length} produtos vinculados com substituição 1:1`,
        status: 'done',
        icon: <Store className="w-4 h-4" />,
        details: (
          <div className="mt-2 space-y-1.5">
            {newProducts.map((product, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border border-border/50">
                <div className="flex items-center gap-2 min-w-0">
                  <ShoppingBag className="w-3 h-3 text-success shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{product.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{product.provider}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge variant={product.stockType === 'fisico' ? 'default' : 'secondary'} className="text-[8px] px-1.5">
                    {product.stockType === 'fisico' ? 'Local' : 'Drop'}
                  </Badge>
                  <span className="text-xs font-semibold text-foreground">R${product.price}</span>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-1">
              <RefreshCw className="w-3 h-3 text-primary" />
              Substituição 1:1 aplicada para equilíbrio do catálogo
            </div>
          </div>
        ),
      });

      setStep(5);
      setWaitingUser(true);
    } else if (step === 5) {
      // Internal: sending push notification
      addLog({
        title: 'Enviando notificação push',
        description: `Notificando cliente sobre disponibilidade de "${contextTitle}"`,
        status: 'done',
        icon: <BellRing className="w-4 h-4" />,
      });

      // Inject items
      if (!injectedItems) {
        const entries: DynamicEntry[] = newProviders.map((p, i) => ({
          type: 'service' as const,
          service: {
            id: 9000 + Math.floor(Math.random() * 1000) + i,
            name: p.name,
            segment: segmentParam,
            provider: p.specialty,
            price: p.price,
            rating: p.rating,
            distance: p.distance,
            time: '45 min',
            products: newProducts.filter(np => np.provider === p.name).map(np => np.name),
          },
          products: newProducts.filter(np => np.provider === p.name).map((np, j) => ({
            id: 9500 + Math.floor(Math.random() * 1000) + j,
            name: np.name,
            price: np.price,
            provider: np.provider,
            stockType: np.stockType,
            rating: 4.7,
            distance: p.distance,
            relatedServiceIds: [9000 + i],
            tags: [query.toLowerCase(), contextTitle.toLowerCase(), segmentParam],
          })),
          maxPerSegment: 5,
        }));
        addDynamicEntries(entries).then(() => setInjectedItems(true));
      }

      await sleep(1000);

      // Show push on phone
      setShowPush(true);
      addPhoneMsg({
        type: 'incoming',
        content: `🎉 Boa notícia! O serviço "${contextTitle}" que você procurou já está disponível! 2 profissionais qualificados prontos para atender na sua região. Toque para agendar.`,
      });

      setTimeout(() => setShowPush(false), 4000);

      // Internal: final summary
      await sleep(1500);
      addLog({
        title: 'Processo concluído',
        description: `Protocolo #${protocolNumber} encerrado dentro do SLA`,
        status: 'done',
        icon: <CheckCircle2 className="w-4 h-4" />,
        details: (
          <div className="mt-2 grid grid-cols-3 gap-2">
            <div className="text-center p-2 rounded-lg bg-success/5 border border-success/20">
              <p className="text-lg font-bold text-success">2</p>
              <p className="text-[9px] text-muted-foreground">Profissionais</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-success/5 border border-success/20">
              <p className="text-lg font-bold text-success">{newProducts.length}</p>
              <p className="text-[9px] text-muted-foreground">Produtos</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-lg font-bold text-primary">1:1</p>
              <p className="text-[9px] text-muted-foreground">Substituição</p>
            </div>
          </div>
        ),
      });

      setStep(6);
      setWaitingUser(true);
    } else if (step === 6) {
      // Navigate back
      navigate('/');
    }
  };

  // Search progress animation
  useEffect(() => {
    if (!isSearching) return;
    setSearchProgress(0);
    const interval = setInterval(() => {
      setSearchProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setIsSearching(false);
          // Update the running log to done
          setInternalLogs(prev => prev.map(l => l.status === 'running' ? { ...l, status: 'done' as const } : l));
          // Show results
          setTimeout(() => {
            addLog({
              title: 'Profissionais encontrados',
              description: `2 profissionais qualificados localizados na região`,
              status: 'done',
              icon: <Users className="w-4 h-4" />,
              details: (
                <div className="mt-2 space-y-2">
                  {newProviders.map((provider, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-muted/50 border border-border/50">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-sm">
                            {['👩‍🔧', '👨‍🔧'][idx]}
                          </div>
                          <div>
                            <p className="font-semibold text-xs text-foreground">{provider.name}</p>
                            <p className="text-[10px] text-muted-foreground">{provider.specialty}</p>
                          </div>
                        </div>
                        <Badge className="bg-success/10 text-success border-success/20 text-[9px]">
                          <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" /> Verificado
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-0.5"><Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" /> {provider.rating}</span>
                        <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" /> {provider.distance}</span>
                        <span className="flex items-center gap-0.5"><DollarSign className="w-2.5 h-2.5" /> R$ {provider.price}</span>
                      </div>
                    </div>
                  ))}
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
    3: 'Pesquisar serviços e produtos na web',
    4: 'Atualizar catálogo e estoque',
    5: 'Notificar cliente e finalizar',
    6: 'Buscar no hub agora',
  };

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
                      "{contextTitle}" — 2 profissionais prontos para atender.
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
              {/* Phone notch */}
              <div className="w-20 h-5 bg-foreground/20 rounded-full mx-auto mb-1" />
              {/* Phone screen */}
              <div className="bg-background rounded-2xl overflow-hidden h-[420px] flex flex-col">
                {/* Phone header */}
                <div className="bg-primary px-3 py-2.5 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                    <Zap className="w-3 h-3 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-primary-foreground">EcoMEI</p>
                    <p className="text-[9px] text-primary-foreground/70">Central de Atendimento</p>
                  </div>
                </div>
                {/* Phone messages */}
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
              {/* Phone bottom bar */}
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
                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] text-success font-semibold flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" /> Profissionais encontrados!
                            </motion.p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              <div ref={logsEndRef} />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      {waitingUser && step <= 6 && (
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
              {step < 6 ? `Clique para avançar • Etapa ${step} de 5` : 'Processo finalizado — ver resultados no hub'}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default SupportCenterDemo;
