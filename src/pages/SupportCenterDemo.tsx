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
  MessageCircle, Bot, User, ChevronDown, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AiAvatar } from '@/components/AiAvatarGlobal';
import { addDynamicEntries, segments, type DynamicEntry } from '@/data/searchData';

type ChatMessage = {
  id: number;
  sender: 'user' | 'central' | 'system';
  content: string;
  details?: React.ReactNode;
  typing?: boolean;
  timestamp?: string;
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

  const [chatStep, setChatStep] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showTyping, setShowTyping] = useState(false);
  const [waitingUser, setWaitingUser] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [showPush, setShowPush] = useState(false);
  const [injectedItems, setInjectedItems] = useState(false);
  const [protocolNumber] = useState(() => Math.floor(Math.random() * 90000 + 10000));
  const chatEndRef = useRef<HTMLDivElement>(null);
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

  const addMessage = useCallback((msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    setMessages(prev => [...prev, { ...msg, id: prev.length, timestamp: now() }]);
  }, []);

  const simulateTyping = useCallback((delay: number): Promise<void> => {
    return new Promise(resolve => {
      setShowTyping(true);
      setTimeout(() => {
        setShowTyping(false);
        resolve();
      }, delay);
    });
  }, []);

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showTyping, waitingUser]);

  // Initialize first step
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    startConversation();
  }, []);

  const startConversation = async () => {
    // System message
    addMessage({
      sender: 'system',
      content: `Protocolo #${protocolNumber} aberto • SLA: 24 horas`,
    });

    await simulateTyping(1500);

    // Central greeting
    addMessage({
      sender: 'central',
      content: `Olá! Sou a Central de Atendimento EcoMEI. Recebi sua solicitação e vou cuidar de tudo para você. Deixa eu analisar o que você precisa...`,
    });

    await simulateTyping(2000);

    // Central shows analysis
    addMessage({
      sender: 'central',
      content: `📋 Entendi sua necessidade. Aqui está o que identifiquei:`,
      details: (
        <div className="mt-3 bg-muted/50 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Badge className="bg-primary/10 text-primary text-xs"><Search className="w-3 h-3 mr-1" /> Busca</Badge>
            <span className="text-sm font-medium text-foreground">"{query}"</span>
          </div>
          {userSelections.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Opções que você selecionou:</p>
              <div className="flex flex-wrap gap-1">
                {userSelections.map((sel, i) => (
                  <Badge key={i} className="bg-success/10 text-success border-success/20 text-[10px]">
                    <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" /> {sel}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Badge className="bg-accent/10 text-accent-foreground text-xs">📂 Segmento</Badge>
            <span className="text-sm font-medium text-foreground">{segmentLabel}</span>
          </div>
          {summary && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Contexto da conversa:</p>
              <p className="text-sm text-foreground">{summary}</p>
            </div>
          )}
          <div className="border-t border-border pt-3">
            <p className="text-xs font-semibold text-foreground mb-2">📋 Resumo:</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Necessidade: <strong className="text-foreground">{contextTitle}</strong></li>
              <li>• Segmento: <strong className="text-foreground">{segmentLabel}</strong></li>
              <li>• Tipo: <strong className="text-foreground">{type === 'service' ? 'Serviço profissional' : type === 'product' ? 'Produto' : 'Serviço + Produtos'}</strong></li>
              <li>• Região: São Paulo - SP</li>
              <li>• Prioridade: Normal (SLA 24h)</li>
            </ul>
          </div>
        </div>
      ),
    });

    setChatStep(1);
    setWaitingUser(true);
  };

  const handleUserResponse = async () => {
    setWaitingUser(false);

    if (chatStep === 1) {
      // User confirms
      addMessage({ sender: 'user', content: 'Tudo certo, podem prosseguir com a busca!' });
      await simulateTyping(1200);
      addMessage({ sender: 'central', content: `Perfeito! Vou iniciar a pesquisa de profissionais de ${segmentLabel} na sua região. Acompanhe em tempo real:` });
      setChatStep(2);
      setIsSearching(true);
      // Start search progress
      setSearchProgress(0);
    } else if (chatStep === 3) {
      // User acknowledges professionals
      addMessage({ sender: 'user', content: 'Ótimo! Esses profissionais parecem qualificados. E quanto a serviços e produtos?' });
      await simulateTyping(2000);
      addMessage({
        sender: 'central',
        content: `Boa pergunta! Fiz uma pesquisa na web para identificar os serviços e produtos mais relevantes para "${contextTitle}". Veja o que encontrei:`,
        details: (
          <div className="mt-3 space-y-4">
            <div>
              <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1">
                <Search className="w-3.5 h-3.5 text-primary" /> 🌐 Serviços mais comuns (pesquisa web)
              </p>
              <div className="space-y-2">
                {webResearchedServices.map((svc, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2.5 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground">{svc.name}</p>
                      <p className="text-[11px] text-muted-foreground">{svc.description}</p>
                    </div>
                    <Badge className="bg-accent/10 text-accent-foreground text-[9px] shrink-0">🌐 Web</Badge>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1">
                <ShoppingBag className="w-3.5 h-3.5 text-success" /> 🌐 Produtos mais comuns (pesquisa web)
              </p>
              <div className="space-y-2">
                {webResearchedProducts.map((prod, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2.5 rounded-lg bg-success/5 border border-success/10">
                    <div className="w-7 h-7 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                      <ShoppingBag className="w-3.5 h-3.5 text-success" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground">{prod.name}</p>
                      <p className="text-[11px] text-muted-foreground">{prod.description}</p>
                    </div>
                    <Badge className="bg-accent/10 text-accent-foreground text-[9px] shrink-0">🌐 Web</Badge>
                  </div>
                ))}
              </div>
            </div>
            {userSelections.length > 0 && (
              <div className="bg-success/5 border border-success/20 rounded-lg p-3">
                <p className="text-xs font-semibold text-foreground mb-1">✅ Combinando com suas seleções:</p>
                <div className="flex flex-wrap gap-1">
                  {userSelections.map((sel, i) => (
                    <Badge key={i} className="bg-success/10 text-success text-[10px]">{sel}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        ),
      });
      setChatStep(4);
      setWaitingUser(true);
    } else if (chatStep === 4) {
      // User acknowledges web research
      addMessage({ sender: 'user', content: 'Muito bom! Podem adicionar esses produtos ao estoque.' });
      await simulateTyping(1500);
      addMessage({
        sender: 'central',
        content: `Pronto! Adicionei ${newProducts.length} produtos ao estoque dos profissionais. Veja a distribuição:`,
        details: (
          <div className="mt-3 space-y-2">
            {newProducts.map((product, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4 text-success" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{product.name}</p>
                    <p className="text-[11px] text-muted-foreground">{product.provider}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={product.stockType === 'fisico' ? 'default' : 'secondary'} className="text-[9px]">
                    <Store className="w-2.5 h-2.5 mr-0.5" />
                    {product.stockType === 'fisico' ? 'Estoque Local' : 'Dropshipping'}
                  </Badge>
                  <span className="text-sm font-semibold text-foreground">R$ {product.price}</span>
                </div>
              </div>
            ))}
            <div className="p-2.5 bg-muted/30 rounded-lg flex items-center gap-2 text-xs text-muted-foreground">
              <RefreshCw className="w-3.5 h-3.5 text-primary" />
              <span>Produtos similares existentes foram substituídos 1:1 para manter o catálogo equilibrado</span>
            </div>
          </div>
        ),
      });
      setChatStep(5);
      setWaitingUser(true);
    } else if (chatStep === 5) {
      // User confirms — send push
      addMessage({ sender: 'user', content: 'Perfeito! Podem enviar a notificação.' });
      await simulateTyping(1500);

      addMessage({
        sender: 'central',
        content: '📲 Notificação push enviada! Veja o que o cliente receberá:',
        details: (
          <div className="mt-3 max-w-sm mx-auto">
            <Card className="border-success/30 shadow-lg">
              <CardContent className="p-4 text-left">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <Zap className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">EcoMEI</p>
                    <p className="text-[10px] text-muted-foreground">agora</p>
                  </div>
                </div>
                <p className="text-sm text-foreground">🎉 O serviço que você procurou está disponível!</p>
                <p className="text-xs text-muted-foreground mt-1">"{contextTitle}" — 2 profissionais prontos. Toque para agendar.</p>
              </CardContent>
            </Card>
          </div>
        ),
      });

      setShowPush(true);
      setTimeout(() => setShowPush(false), 4000);

      setChatStep(6);
      setWaitingUser(true);
    } else if (chatStep === 6) {
      // Final — inject and finish
      addMessage({ sender: 'user', content: 'Excelente trabalho! Quero ver no hub agora.' });
      await simulateTyping(1500);

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

      addMessage({
        sender: 'central',
        content: `✅ Processo concluído com sucesso! Tudo integrado ao ecossistema EcoMEI.`,
        details: (
          <div className="mt-3 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <Card className="border-success/30">
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold text-success">2</p>
                  <p className="text-xs text-muted-foreground">Profissionais</p>
                </CardContent>
              </Card>
              <Card className="border-success/30">
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold text-success">{newProducts.length}</p>
                  <p className="text-xs text-muted-foreground">Produtos</p>
                </CardContent>
              </Card>
              <Card className="border-success/30">
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold text-primary">1:1</p>
                  <p className="text-xs text-muted-foreground">Substituição</p>
                </CardContent>
              </Card>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button className="gap-2" onClick={() => navigate('/')}>
                <Search className="w-4 h-4" /> Buscar "{contextTitle}" agora
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => navigate('/client')}>
                <ShoppingBag className="w-4 h-4" /> Ir ao App Cliente
              </Button>
            </div>
          </div>
        ),
      });

      addMessage({
        sender: 'system',
        content: `Protocolo #${protocolNumber} encerrado • Tempo total: dentro do SLA ✅`,
      });

      setChatStep(7);
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
          // Show results after search completes
          setTimeout(async () => {
            await simulateTyping(1200);
            addMessage({
              sender: 'central',
              content: `🎉 Encontrei 2 profissionais qualificados na sua região! Confira:`,
              details: (
                <div className="mt-3 space-y-3">
                  {newProviders.map((provider, idx) => (
                    <Card key={idx} className="border-success/30">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                              {['👩‍🔧', '👨‍🔧'][idx]}
                            </div>
                            <div>
                              <h3 className="font-semibold text-sm text-foreground">{provider.name}</h3>
                              <p className="text-xs text-muted-foreground">{provider.specialty}</p>
                            </div>
                          </div>
                          <Badge className="bg-success/10 text-success border-success/20 text-xs">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Verificado
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> {provider.rating}</span>
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {provider.distance}</span>
                          <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> R$ {provider.price}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {newProducts.filter(p => p.provider === provider.name).map((product, pidx) => (
                            <Badge key={pidx} variant="secondary" className="text-[9px] px-1.5 py-0">
                              <Package className="w-2 h-2 mr-0.5" /> {product.name.slice(0, 30)}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ),
            });
            setChatStep(3);
            setWaitingUser(true);
          }, 300);
          return 100;
        }
        return p + 2;
      });
    }, 60);
    return () => clearInterval(interval);
  }, [isSearching]);

  const userButtonLabels: Record<number, string> = {
    1: 'Confirmar e iniciar busca',
    3: 'Ver serviços e produtos relacionados',
    4: 'Adicionar produtos ao estoque',
    5: 'Enviar notificação ao cliente',
    6: 'Finalizar e ver no hub',
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Headphones className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h1 className="font-display font-bold text-sm text-foreground">Central de Atendimento</h1>
              <p className="text-[11px] text-muted-foreground">Protocolo #{protocolNumber} • SLA 24h</p>
            </div>
          </div>
          <Badge className="bg-success/10 text-success border-success/20 text-xs gap-1">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" /> Online
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
            className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto"
          >
            <Card className="border-success shadow-2xl bg-card">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                    <BellRing className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">EcoMEI • agora</p>
                    <p className="text-sm font-bold text-foreground">🎉 Boa notícia!</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      O serviço "{contextTitle}" que você solicitou já está disponível! 2 profissionais prontos para atender.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-2xl p-4 space-y-4 pb-32">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3 }}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'central' && (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                    <Headphones className="w-4 h-4 text-primary" />
                  </div>
                )}
                {msg.sender === 'system' ? (
                  <div className="w-full flex justify-center">
                    <Badge variant="secondary" className="text-[10px] px-3 py-1 font-normal">
                      {msg.content}
                    </Badge>
                  </div>
                ) : (
                  <div className={`max-w-[85%] ${msg.sender === 'user' ? 'order-first' : ''}`}>
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        msg.sender === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-card border border-border rounded-bl-md shadow-sm'
                      }`}
                    >
                      <p className={`text-sm leading-relaxed ${msg.sender === 'user' ? '' : 'text-foreground'}`}>
                        {msg.content}
                      </p>
                      {msg.details && (
                        <div className={msg.sender === 'user' ? 'text-primary-foreground' : ''}>
                          {msg.details}
                        </div>
                      )}
                    </div>
                    <p className={`text-[10px] text-muted-foreground mt-1 ${msg.sender === 'user' ? 'text-right' : ''}`}>
                      {msg.timestamp}
                    </p>
                  </div>
                )}
                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-1">
                    <User className="w-4 h-4 text-secondary-foreground" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Search progress inline */}
          {isSearching && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-2.5"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                <Headphones className="w-4 h-4 text-primary" />
              </div>
              <div className="max-w-[85%]">
                <div className="rounded-2xl rounded-bl-md px-4 py-3 bg-card border border-border shadow-sm">
                  <p className="text-sm text-foreground mb-3">🔍 Pesquisando profissionais de {segmentLabel}...</p>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Progresso</span>
                        <span>{Math.round(searchProgress)}%</span>
                      </div>
                      <Progress value={searchProgress} className="h-2" />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Bases', value: Math.floor(searchProgress / 10), icon: '🗂️' },
                        { label: 'Profissionais', value: Math.floor(searchProgress / 5), icon: '👤' },
                        { label: 'Regiões', value: Math.floor(searchProgress / 15) + 1, icon: '📍' },
                      ].map((m) => (
                        <div key={m.label} className="text-center p-2 rounded-lg bg-muted/50">
                          <p className="text-sm">{m.icon}</p>
                          <p className="text-sm font-bold text-foreground">{m.value}</p>
                          <p className="text-[9px] text-muted-foreground">{m.label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1.5">
                      {searchProgress > 20 && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-success" /> Consultando base de {segmentLabel}...
                        </motion.p>
                      )}
                      {searchProgress > 45 && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-success" /> Verificando avaliações...
                        </motion.p>
                      )}
                      {searchProgress > 70 && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-success" /> Mapeando estoque de produtos...
                        </motion.p>
                      )}
                      {searchProgress > 90 && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-success font-semibold flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3" /> Profissionais encontrados!
                        </motion.p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Typing indicator */}
          {showTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex gap-2.5"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                <Headphones className="w-4 h-4 text-primary" />
              </div>
              <div className="rounded-2xl rounded-bl-md px-4 py-3 bg-card border border-border shadow-sm">
                <div className="flex items-center gap-1.5">
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0 }} className="w-2 h-2 rounded-full bg-muted-foreground" />
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} className="w-2 h-2 rounded-full bg-muted-foreground" />
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} className="w-2 h-2 rounded-full bg-muted-foreground" />
                </div>
              </div>
            </motion.div>
          )}

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Bottom Action Bar */}
      {waitingUser && chatStep < 7 && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 z-10"
        >
          <div className="container mx-auto max-w-2xl">
            <Button
              className="w-full gap-2 h-12 text-base"
              onClick={handleUserResponse}
            >
              <ArrowRight className="w-4 h-4" />
              {userButtonLabels[chatStep] || 'Continuar'}
            </Button>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              Clique para avançar na simulação • Etapa {chatStep} de 6
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default SupportCenterDemo;
