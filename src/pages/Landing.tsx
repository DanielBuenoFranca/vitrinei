import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ArrowRight, Zap, Sparkles, Clock, MapPin, DollarSign,
  Headphones, ShoppingCart, BarChart3, Send, Star,
  Package, TrendingDown, Navigation, Users, Shield, MessageCircle,
  ChevronDown, ShoppingBag, Wrench as WrenchIcon, Store, Plus, CheckCircle2, X, Trash2, Settings, CreditCard, AlertTriangle, Minus
} from 'lucide-react';
import { AiAvatar } from '@/components/AiAvatarGlobal';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { segments as staticSegments, mockResults, semanticSearch, buildSupportSummary, generateContextualSuggestions, getAllServices, getAllProducts, loadDynamicEntries, reloadDynamicEntries, loadSegmentTagsCache, type ProductItem, type SearchResult, type ContextualSuggestion } from '@/data/searchData';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';


const aiSuggestions = [
  '💡 A inteligência encontra o que você precisa — sem esforço.',
  '🔍 Pesquise qualquer necessidade. Se não tivermos, a IA encontra para você.',
  '🚀 Mais de 2.450 profissionais prontos para atender agora mesmo.',
  '✨ Assine e tenha acesso a serviços exclusivos com até 30% de economia.',
  '🤝 É prestador? Cadastre-se e conquiste novos clientes todo dia.',
];


const Landing = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [executedQuery, setExecutedQuery] = useState('');
  const [searchExecuted, setSearchExecuted] = useState(false);
  const [searchVersion, setSearchVersion] = useState(0);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  const [activeSegments, setActiveSegments] = useState<string[]>([]);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [aiChat, setAiChat] = useState<{ role: 'user' | 'ai'; text: string; searchResult?: SearchResult; contextualSuggestion?: ContextualSuggestion }[]>([]);
  const [currentSuggestion, setCurrentSuggestion] = useState(0);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [expandedProducts, setExpandedProducts] = useState<number | null>(null);
  const [expandedServices, setExpandedServices] = useState<number | null>(null);
  const [showSearchProducts, setShowSearchProducts] = useState(false);
  const [pendingChatSuggestions, setPendingChatSuggestions] = useState<Map<number, Set<string>>>(new Map());
  const [expandedProviders, setExpandedProviders] = useState<Set<string>>(new Set());
  const [dbSegments, setDbSegments] = useState<{ id: string; label: string; name: string; tags: string[] }[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [mobileRevealedSeg, setMobileRevealedSeg] = useState<string | null>(null);
  const [showSimulated, setShowSimulated] = useState(false);
  const {
    productCart, productQuantities, serviceCart,
    showCartDetails, setShowCartDetails,
    toggleProductInCart, removeProductFromCart, updateProductQuantity, isInProductCart,
    toggleServiceInCart, isInServiceCart,
    totalCartItems, totalCartValue,
    clearCart, clientCredit,
    paymentMethod, setPaymentMethod, paymentStep, setPaymentStep,
    setIsMinimized,
  } = useCart();
  const searchRef = useRef<HTMLInputElement>(null);

  const toggleProviderExpanded = (providerName: string) => {
    setExpandedProviders(prev => {
      const next = new Set(prev);
      if (next.has(providerName)) next.delete(providerName);
      else next.add(providerName);
      return next;
    });
  };

  const executeSearch = () => {
    setExecutedQuery(searchQuery.trim());
    setSearchExecuted(true);
    setSearchVersion(v => v + 1);
    setSelectedSuggestions(new Set());
    setShowSearchProducts(false);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') executeSearch();
  };

  const toggleSuggestionSelection = (name: string) => {
    setSelectedSuggestions(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleSendSelectedSuggestions = (ctxSuggestion: ContextualSuggestion) => {
    if (selectedSuggestions.size === 0) return;
    const summary = buildSupportSummary(aiChat, Array.from(selectedSuggestions).join(', '));
    const params = new URLSearchParams({
      query: Array.from(selectedSuggestions).join(', '),
      context: `IA: ${ctxSuggestion.segmentLabel}`,
      summary,
      type: 'both',
      segment: ctxSuggestion.segment,
    });
    navigate(`/central-atendimento?${params.toString()}`);
  };

  const handleRefineSearch = () => {
    setSearchExecuted(false);
    setSelectedSuggestions(new Set());
    searchRef.current?.focus();
  };

  const navigateToCheckout = () => {
    if (totalCartItems === 0) return;
    const params = new URLSearchParams({
      services: JSON.stringify(serviceCart.map(s => ({
        name: s.name, provider: s.provider, price: s.price, rating: s.rating,
        distance: s.distance, time: s.time, segment: s.segment, products: s.products,
      }))),
      products: JSON.stringify(productCart.map(p => ({
        name: p.name, type: p.stockType, price: p.price, provider: p.provider,
        rating: p.rating, distance: p.distance, quantity: productQuantities.get(p.id) || 1,
      }))),
    });
    navigate(`/jornada-cliente?${params.toString()}`);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSuggestion((prev) => (prev + 1) % aiSuggestions.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const placeholders = [
    'Estou com dor de barriga...',
    'Preciso cortar a grama do jardim...',
    'Meu carro está fazendo barulho...',
    'Preciso de uma faxineira...',
    'Quero aprender violão...',
    'Meu cachorro precisa de vacina...',
  ];
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setPlaceholderIdx((p) => (p + 1) % placeholders.length), 3000);
    return () => clearInterval(interval);
  }, []);

  // Load data from database on mount
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([reloadDynamicEntries(), loadSegmentTagsCache()]);
      const { data: segs } = await supabase.from('segments').select('*').order('name');
      if (segs) {
        setDbSegments(segs.map((s: any) => ({ id: s.name, label: s.name, name: s.name, tags: s.suggested_tags || [] })));
      }
      setDataLoaded(true);
      setSearchExecuted(true);
      setExecutedQuery('');
      setSearchVersion(1);
    };
    loadData();
  }, []);

  const toggleSegment = (id: string) => {
    setActiveSegments((prev) => {
      const next = prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id];
      setTimeout(() => {
        setSearchExecuted(true);
        setExecutedQuery(searchQuery.trim());
        setSearchVersion(v => v + 1);
      }, 0);
      return next;
    });
  };

  // ── DB providers with logos ──
  const [dbProviders, setDbProviders] = useState<Map<string, { logo_url: string | null }>>(new Map());
  const [dbProviderNames, setDbProviderNames] = useState<Set<string>>(new Set());
  useEffect(() => {
    supabase.from('providers').select('name, logo_url').then(({ data }) => {
      if (data) {
        setDbProviderNames(new Set(data.map((p: any) => p.name)));
        const map = new Map<string, { logo_url: string | null }>();
        data.forEach((p: any) => map.set(p.name, { logo_url: p.logo_url }));
        setDbProviders(map);
      }
    });
  }, []);

  const isSimulatedProvider = (providerName: string, item?: any) => {
    if (item && item._fromDb) return false;
    return !dbProviderNames.has(providerName);
  };

  // ── Motor de busca semântica universal ──
  const searchResult = (() => {
    void searchVersion;
    if (!searchExecuted) return { products: [] as ProductItem[], services: [] as typeof mockResults, followUp: undefined, needLabel: undefined, suggestedServices: undefined };
    const query = executedQuery.toLowerCase().trim();
    let rawResult: SearchResult;
    if (!query && activeSegments.length === 0) {
      rawResult = { products: getAllProducts(), services: getAllServices() };
    } else if (!query && activeSegments.length > 0) {
      const allSvcs = getAllServices().filter((r: any) => activeSegments.includes(r.segment));
      const provNames = new Set(allSvcs.map((s: any) => s.provider));
      const allProds = getAllProducts().filter((p: any) => provNames.has(p.provider));
      rawResult = { products: allProds, services: allSvcs };
    } else {
      const result = semanticSearch(query);
      const filteredServices = activeSegments.length === 0
        ? result.services
        : result.services.filter(r => activeSegments.includes(r.segment));
      rawResult = { ...result, services: filteredServices };
    }

    // Filter simulated providers if checkbox is unchecked
    if (!showSimulated) {
      rawResult = {
        ...rawResult,
        services: rawResult.services.filter(s => !isSimulatedProvider(s.provider)),
        products: rawResult.products.filter(p => !isSimulatedProvider(p.provider)),
      };
    }
    return rawResult;
  })();

  const filteredResults = searchResult.services;
  const hasResults = searchExecuted && (filteredResults.length > 0 || searchResult.products.length > 0);
  const noResults = searchExecuted && executedQuery && filteredResults.length === 0 && searchResult.products.length === 0;

  const handleAiSend = () => {
    if (!aiMessage.trim()) return;
    const msg = aiMessage.trim();
    setAiChat((prev) => [...prev, { role: 'user', text: msg }]);
    setAiSpeaking(true);

    // Build conversation context from previous user messages
    const userMsgs = aiChat.filter(m => m.role === 'user').map(m => m.text);
    const searchResult = semanticSearch(msg, [...userMsgs, msg]);

    setTimeout(() => {
      const hasResults = searchResult.products.length > 0 || searchResult.services.length > 0;

      if (hasResults) {
        const contextMsg = searchResult.followUp || 'Entendi sua necessidade! 🧠';
        const parts: string[] = [contextMsg];

        if (searchResult.needLabel) {
          parts.push(`\n\n🔍 Necessidade identificada: ${searchResult.needLabel}`);
        }
        if (searchResult.products.length > 0) {
          const physCount = searchResult.products.filter(p => p.stockType === 'fisico').length;
          const dropCount = searchResult.products.filter(p => p.stockType === 'drop').length;
          parts.push(`\n\n📦 ${searchResult.products.length} produto(s) disponíveis (${physCount} estoque, ${dropCount} drop):`);
        }
        if (searchResult.services.length > 0) {
          parts.push(`\n\n🔧 ${searchResult.services.length} serviço(s) relevantes:`);
        }
        if (searchResult.suggestedServices && searchResult.suggestedServices.length > 0) {
          parts.push(`\n\n💡 Sugestão IA: ${searchResult.suggestedServices.length} serviço(s) relacionados:`);
        }

        setAiChat((prev) => [...prev, { role: 'ai', text: parts.join(''), searchResult }]);
        setSearchQuery(msg);
      } else {
        // ── CONTEXTUAL SUGGESTIONS ──
        const contextSuggestion = generateContextualSuggestions(msg);
        if (contextSuggestion) {
          const text = `🧠 Não encontrei "${msg}" diretamente no hub, mas analisei o contexto!\n\n${contextSuggestion.derivedContext}\n\n📂 **Segmento:** ${contextSuggestion.segmentLabel}\n\nSelecione abaixo os serviços e produtos que correspondem ao que você precisa, ou escreva com mais detalhes:`;
          setAiChat((prev) => [...prev, {
            role: 'ai',
            text,
            contextualSuggestion: contextSuggestion,
            searchResult: { products: [], services: [] } as SearchResult,
          }]);
        } else {
          const summary = buildSupportSummary([...aiChat, { role: 'user', text: msg }], msg);
          setAiChat((prev) => [...prev, {
            role: 'ai',
            text: `Não encontrei resultados para "${msg}" no hub atual. 😔\n\nAcione a Central abaixo para buscar profissionais (SLA: 24h).`,
            searchResult: { products: [], services: [], _noResults: true, _query: msg, _summary: summary } as any
          }]);
        }
      }
      setTimeout(() => setAiSpeaking(false), 2000);
    }, 1200);
    setAiMessage('');
  };

  const navigateToDemo = (result: typeof mockResults[0]) => {
    const params = new URLSearchParams({
      serviceName: result.name,
      serviceProvider: result.provider,
      servicePrice: String(result.price),
      serviceRating: String(result.rating),
      serviceDistance: result.distance,
      serviceTime: result.time,
      serviceSegment: result.segment,
      serviceProducts: JSON.stringify(result.products),
    });
    navigate(`/jornada-cliente?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">EcoMEI</span>
            <ThemeSwitcher />
          </div>
          <div className="flex items-center gap-2">
            <div className="relative group">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                Mais ▾
              </Button>
              <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 min-w-[200px] z-50">
                <div className="p-2 space-y-1">
                  <button onClick={() => navigate('/demos')} className="w-full text-left px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-md transition-colors flex items-center gap-2">📱 Demonstrações</button>
                  <div className="border-t border-border my-1" />
                  <button onClick={() => navigate('/processos')} className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">Fluxos de Processos</button>
                  <button onClick={() => navigate('/gestao')} className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">Gestão de Serviços</button>
                  <button onClick={() => navigate('/jornada-cliente')} className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">Jornada do Cliente</button>
                  <button onClick={() => navigate('/mei-acompanhamento')} className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">Gestor MEI</button>
                  <button onClick={() => navigate('/dropshipping')} className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">Drop-shipping Global</button>
                  <button onClick={() => navigate('/central-atendimento')} className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">Central de Atendimento</button>
                  <div className="border-t border-border my-1" />
                  <button onClick={() => navigate('/admin')} className="w-full text-left px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors flex items-center gap-2">
                    <Settings className="w-4 h-4" /> Administrador
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero - Commercial */}
      <section className="pt-16 pb-2 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="font-display text-2xl md:text-3xl font-extrabold text-foreground mb-1 leading-tight">
              Seu problema, <span className="text-primary">nossa solução.</span>
            </h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto mb-2 leading-relaxed"
            >
              Serviços, produtos, profissionais — <strong className="text-foreground">tudo em um só lugar.</strong>{' '}
              <span className="hidden sm:inline">Se não existir aqui, nossa IA vasculha o ecossistema inteiro e entrega a melhor opção.</span>
            </motion.p>
            <div className="flex justify-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1"><Users className="w-3 h-3 text-primary" /> <strong className="text-foreground">2.450+</strong> MEIs</span>
              <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-accent text-accent" /> <strong className="text-foreground">4.8</strong></span>
              <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-success" /> Seguro</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-success" /> <strong className="text-foreground">12.800+</strong> serviços</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Search Section */}
      <section className="px-4 pb-2">
        <div className="container mx-auto max-w-5xl">

          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5, duration: 0.5 }}>
            {/* Search bar */}
            <div className="relative mb-6">
              <div className="relative flex items-center bg-card border-2 border-primary/30 rounded-2xl shadow-lg hover:shadow-xl hover:border-primary/50 transition-all duration-300 overflow-hidden">
                <Search className="w-5 h-5 text-primary absolute left-4" />
                <Input
                  ref={searchRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder={placeholders[placeholderIdx]}
                  className="border-0 pl-12 pr-4 py-6 text-base md:text-lg bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <div className="flex items-center gap-2 pr-3">
                  <Button size="sm" variant="ghost" className="gap-1 text-muted-foreground hover:text-primary" onClick={() => setShowAiPanel(!showAiPanel)}>
                    <MessageCircle className="w-4 h-4" />
                    <span className="hidden sm:inline text-xs">Falar com IA</span>
                  </Button>
                  <Button size="sm" className="gap-1 rounded-xl" onClick={executeSearch}>
                    <Search className="w-4 h-4" /> Buscar
                  </Button>
                </div>
              </div>

              {/* AI Suggestion banner + Show simulated checkbox */}
              <div className="mt-2 flex items-center justify-between px-2">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSuggestion}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <Sparkles className="w-4 h-4 text-accent shrink-0" />
                    <span>{aiSuggestions[currentSuggestion]}</span>
                  </motion.div>
                </AnimatePresence>
                <label className="flex items-center gap-1.5 shrink-0 cursor-pointer select-none">
                  <Checkbox checked={showSimulated} onCheckedChange={(v) => setShowSimulated(!!v)} className="h-3.5 w-3.5" />
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">Incluir simulados</span>
                </label>
              </div>
            </div>

            {/* Layout: Sidebar filters + Results */}
            <div className="flex gap-3">
              {/* Segment sidebar */}
              <div className="hidden sm:flex flex-col gap-1 w-[140px] shrink-0 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 px-1">Segmentos</p>
                {dbSegments.map((seg) => {
                  const isActive = activeSegments.includes(seg.id);
                  const staticSeg = staticSegments.find(s => s.id === seg.id || s.label.toLowerCase() === seg.label.toLowerCase());
                  const Icon = staticSeg?.icon || Sparkles;
                  return (
                    <button
                      key={seg.id}
                      onClick={() => toggleSegment(seg.id)}
                      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all text-left ${
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                      }`}
                    >
                      <Icon className="w-3 h-3 shrink-0" />
                      <span className="truncate">{seg.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Mobile: icon-only vertical sidebar */}
              <div className="flex sm:hidden flex-col gap-1 shrink-0">
                <p className="text-[8px] font-semibold text-muted-foreground uppercase tracking-wider text-center mb-0.5">Seg.</p>
                {dbSegments.map((seg) => {
                  const isActive = activeSegments.includes(seg.id);
                  const staticSeg = staticSegments.find(s => s.id === seg.id || s.label.toLowerCase() === seg.label.toLowerCase());
                  const Icon = staticSeg?.icon || Sparkles;
                  const isRevealed = mobileRevealedSeg === seg.id;
                  return (
                    <div key={seg.id} className="relative">
                      <button
                        onClick={() => {
                          if (isRevealed) {
                            toggleSegment(seg.id);
                            setMobileRevealedSeg(null);
                          } else {
                            setMobileRevealedSeg(seg.id);
                          }
                        }}
                        className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all ${
                          isActive
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                        }`}
                        title={seg.label}
                      >
                        <Icon className="w-4 h-4" />
                      </button>
                      {isRevealed && !isActive && (
                        <div className="absolute left-10 top-0 z-30 bg-card border border-border rounded-md px-2 py-1 shadow-lg whitespace-nowrap">
                          <span className="text-[10px] font-medium text-foreground">{seg.label}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Results */}
              <div className="flex-1 min-w-0 max-h-[calc(100vh-220px)] overflow-y-auto rounded-xl pr-1">
            <AnimatePresence>
              {searchExecuted && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>

                  {/* ── FOUND IN DATABASE ── */}
                  {hasResults && (
                    <>
                      {/* Found badge */}
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-3 flex items-center gap-2">
                        <Badge className="bg-success/10 text-success border-success/20 text-xs px-3 py-1">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> {executedQuery ? 'Encontrado na base de dados' : 'Catálogo disponível'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {filteredResults.length > 0 && `${filteredResults.length} serviço(s)`}
                          {filteredResults.length > 0 && searchResult.products.length > 0 && ' · '}
                          {searchResult.products.length > 0 && `${searchResult.products.length} produto(s)`}
                        </span>
                      </motion.div>

                      {/* AI Interpretation Banner */}
                      {executedQuery && searchResult.needLabel && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
                          <div className="flex items-start gap-3">
                            <AiAvatar size={36} speaking={false} onClick={() => setShowAiPanel(true)} />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                                  <Sparkles className="w-3 h-3 mr-1" /> IA identificou
                                </Badge>
                                <span className="font-semibold text-sm text-foreground">{searchResult.needLabel}</span>
                              </div>
                              {searchResult.followUp && (
                                <p className="text-xs text-muted-foreground">{searchResult.followUp}</p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* ── Grouped by Provider ── */}
                      {(() => {
                        // Group products and services by provider
                        const providerMap = new Map<string, { products: typeof searchResult.products; services: typeof filteredResults }>();
                        searchResult.products.forEach(p => {
                          const key = p.provider;
                          if (!providerMap.has(key)) providerMap.set(key, { products: [], services: [] });
                          providerMap.get(key)!.products.push(p);
                        });
                        filteredResults.forEach(s => {
                          const key = s.provider;
                          if (!providerMap.has(key)) providerMap.set(key, { products: [], services: [] });
                          providerMap.get(key)!.services.push(s);
                        });
                        const providerEntries = Array.from(providerMap.entries());

                        return providerEntries.length > 0 && (
                          <div className="space-y-5">
                            {providerEntries.map(([providerName, data], provIdx) => (
                              <motion.div key={providerName} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: provIdx * 0.08 }}>
                                <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
                                  {/* Provider Header — clickable to expand/collapse */}
                                  <div
                                    className="px-3 sm:px-4 py-3 bg-muted/30 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors"
                                  >
                                    {/* Top row: logo + name + Loja button */}
                                    <div className="flex items-center justify-between gap-2" onClick={() => toggleProviderExpanded(providerName)}>
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                      {(() => {
                                        const prov = dbProviders.get(providerName);
                                        const logo = prov?.logo_url;
                                        return logo ? (
                                          <img src={logo} alt={providerName} className="w-8 h-8 rounded-full object-cover border border-border shrink-0" />
                                        ) : (
                                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <Store className="w-4 h-4 text-primary" />
                                          </div>
                                        );
                                      })()}
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <h3
                                            className="font-semibold text-sm text-foreground cursor-pointer hover:text-primary transition-colors truncate"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              const slug = providerName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                                              navigate(`/loja/${slug}`);
                                            }}
                                          >{providerName}</h3>
                                          {(() => {
                                            const seg = data.services[0]?.segment;
                                            return seg ? <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 shrink-0">{seg}</Badge> : null;
                                          })()}
                                        </div>
                                        <p className="text-[11px] text-muted-foreground">
                                          {data.services.length > 0 && `${data.services.length} serviço(s)`}
                                          {data.services.length > 0 && data.products.length > 0 && ' · '}
                                          {data.products.length > 0 && `${data.products.length} produto(s)`}
                                        </p>
                                      </div>
                                      </div>
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <Button variant="default" size="sm" className="text-[10px] h-7 px-2.5 gap-1 font-semibold"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const slug = providerName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                                            navigate(`/loja/${slug}`);
                                          }}>
                                          <Store className="w-3.5 h-3.5" /> Loja
                                        </Button>
                                        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${expandedProviders.has(providerName) ? 'rotate-180' : ''}`} />
                                      </div>
                                    </div>
                                    {/* Bottom row: distance + rating + tags */}
                                    <div className="flex items-center gap-2 mt-1.5 ml-10 flex-wrap">
                                      {(data.services.length > 0 || data.products.length > 0) && (
                                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                          {data.services[0] && (
                                            <>
                                              <MapPin className="w-3 h-3" /> {data.services[0].distance}
                                              <span className="mx-0.5">·</span>
                                              <Star className="w-3 h-3 fill-accent text-accent" /> {data.services[0].rating}
                                            </>
                                          )}
                                          {!data.services[0] && data.products[0] && (
                                            <>
                                              <MapPin className="w-3 h-3" /> {data.products[0].distance}
                                              <span className="mx-0.5">·</span>
                                              <Star className="w-3 h-3 fill-accent text-accent" /> {data.products[0].rating}
                                            </>
                                          )}
                                        </div>
                                      )}
                                      {(() => {
                                        const seg = data.services[0]?.segment;
                                        const segData = dbSegments.find(s => s.id === seg || s.name === seg);
                                        const tags = segData?.tags || [];
                                        return tags.length > 0 ? (
                                          <div className="flex flex-wrap gap-1">
                                            {tags.slice(0, 3).map(tag => (
                                              <span key={tag} className="text-[8px] text-muted-foreground/60 bg-muted/30 px-1 rounded">{tag}</span>
                                            ))}
                                            {tags.length > 3 && <span className="text-[8px] text-muted-foreground/40">+{tags.length - 3}</span>}
                                          </div>
                                        ) : null;
                                      })()}
                                    </div>
                                  </div>

                                  {/* Expandable content */}
                                  <AnimatePresence>
                                    {expandedProviders.has(providerName) && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.25 }}
                                        className="overflow-hidden"
                                      >
                                        <div className="p-4 space-y-3">
                                          {/* Services from this provider */}
                                          {data.services.length > 0 && (
                                            <div>
                                              <p className="text-[11px] font-semibold text-primary mb-2 flex items-center gap-1">
                                                <WrenchIcon className="w-3.5 h-3.5" /> Serviços
                                              </p>
                                              <div className="grid sm:grid-cols-2 gap-2">
                                                {data.services.map((result) => {
                                                  const seg = staticSegments.find((s) => s.id === result.segment);
                                                  const SegIcon = seg?.icon || Sparkles;
                                                  return (
                                                    <Card key={result.id}
                                                      className={`transition-all cursor-pointer group ${
                                                        isInServiceCart(result.id)
                                                          ? 'border-primary bg-primary/5 shadow-sm'
                                                          : 'border-border/50 hover:border-primary/30 hover:shadow-md'
                                                      }`}
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleServiceInCart(result);
                                                      }}>
                                                      <CardContent className="p-3">
                                                        <div className="flex items-center gap-2 mb-1">
                                                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isInServiceCart(result.id) ? 'bg-primary/20' : 'bg-primary/10'}`}>
                                                            {isInServiceCart(result.id) ? <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> : <SegIcon className="w-3.5 h-3.5 text-primary" />}
                                                          </div>
                                                          <div className="min-w-0">
                                                            <h4 className="font-semibold text-sm text-foreground truncate">{result.name}</h4>
                                                          </div>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                          <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> R$ {result.price}</span>
                                                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {result.time}</span>
                                                        </div>
                                                        {result.products.length > 0 && (
                                                          <div className="flex flex-wrap gap-1 mt-1.5">
                                                            {result.products.slice(0, 3).map((p) => (
                                                              <Badge key={p} variant="secondary" className="text-[10px] px-1.5 py-0">
                                                                <Package className="w-2.5 h-2.5 mr-0.5" />{p}
                                                              </Badge>
                                                            ))}
                                                          </div>
                                                        )}
                                                        <div className="mt-1.5 flex items-center gap-1 text-[10px] font-medium">
                                                          {isInServiceCart(result.id)
                                                            ? <span className="text-primary flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> No carrinho</span>
                                                            : <span className="text-primary opacity-0 group-hover:opacity-100 flex items-center gap-1"><Plus className="w-3 h-3" /> Adicionar</span>}
                                                        </div>
                                                      </CardContent>
                                                    </Card>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          )}

                                          {/* Products from this provider */}
                                          {data.products.length > 0 && (
                                            <div>
                                              <p className="text-[11px] font-semibold text-success mb-2 flex items-center gap-1">
                                                <ShoppingBag className="w-3.5 h-3.5" /> Estoque do prestador
                                              </p>
                                              <div className="grid sm:grid-cols-2 gap-2">
                                                {data.products.map((product) => (
                                                  <Card key={product.id}
                                                    className={`transition-all cursor-pointer group ${
                                                      isInProductCart(product.id)
                                                        ? 'border-success bg-success/5 shadow-sm'
                                                        : 'border-border/50 hover:border-success/40'
                                                    }`}
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      toggleProductInCart(product);
                                                    }}>
                                                    <CardContent className="p-3">
                                                      <div className="flex items-start justify-between mb-1">
                                                        <div className="flex items-center gap-2">
                                                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isInProductCart(product.id) ? 'bg-success/20' : 'bg-success/10'}`}>
                                                            {isInProductCart(product.id) ? <CheckCircle2 className="w-3.5 h-3.5 text-success" /> : <ShoppingBag className="w-3.5 h-3.5 text-success" />}
                                                          </div>
                                                          <h4 className="font-semibold text-xs text-foreground">{product.name}</h4>
                                                        </div>
                                                        <Badge variant={product.stockType === 'fisico' ? 'default' : 'secondary'} className="text-[10px] px-1.5 py-0 shrink-0">
                                                          <Store className="w-2.5 h-2.5 mr-0.5" />
                                                          {product.stockType === 'fisico' ? 'Estoque' : 'Drop'}
                                                        </Badge>
                                                      </div>
                                                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                        <span className="flex items-center gap-1 font-semibold text-foreground"><DollarSign className="w-3 h-3" /> R$ {product.price}</span>
                                                        <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-accent text-accent" /> {product.rating}</span>
                                                      </div>
                                                      <div className="mt-1 flex items-center gap-1 text-[10px] font-medium">
                                                        {isInProductCart(product.id)
                                                          ? <span className="text-success flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> No carrinho</span>
                                                          : <span className="text-success opacity-0 group-hover:opacity-100 flex items-center gap-1"><Plus className="w-3 h-3" /> Adicionar</span>}
                                                      </div>
                                                    </CardContent>
                                                  </Card>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        );
                      })()}
                    </>
                  )}

                  {/* ── AI SUGGESTIONS (shown after DB results OR when no results) ── */}
                  {hasResults && executedQuery && (() => {
                    const ctxSuggestion = generateContextualSuggestions(executedQuery);
                    if (!ctxSuggestion) return null;
                    // Filter out suggestions that already exist in the DB results
                    const existingServiceNames = new Set(filteredResults.map(s => s.name.toLowerCase()));
                    const existingProductNames = new Set(searchResult.products.map(p => p.name.toLowerCase()));
                    const newServices = ctxSuggestion.suggestedServices.filter(s => !existingServiceNames.has(s.name.toLowerCase()));
                    const newProducts = ctxSuggestion.suggestedProducts.filter(p => !existingProductNames.has(p.name.toLowerCase()));
                    if (newServices.length === 0 && newProducts.length === 0) return null;
                    return (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-2xl border border-accent/30 bg-accent/5 p-5">
                        <div className="flex items-center gap-3 mb-4">
                          <AiAvatar size={36} speaking={false} onClick={() => setShowAiPanel(true)} />
                          <div>
                            <h3 className="font-display font-bold text-foreground text-sm flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-accent" /> Sugestões adicionais da IA
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              Itens relacionados que ainda não estão cadastrados. Selecione para solicitar via Central.
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2">Selecione para acionar a Central de Atendimento:</p>
                          <div className="flex flex-wrap gap-2">
                            {newServices.map((svc) => {
                              const isSelected = selectedSuggestions.has(svc.name);
                              return (
                                <motion.button key={svc.name} whileTap={{ scale: 0.95 }}
                                  onClick={() => toggleSuggestionSelection(svc.name)}
                                  className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium transition-all duration-200 border ${
                                    isSelected ? 'bg-primary text-primary-foreground border-primary shadow-md' : 'bg-muted/50 text-foreground border-border hover:border-primary/40'
                                  }`}>
                                  <WrenchIcon className="w-3.5 h-3.5" /> {svc.name}
                                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                                </motion.button>
                              );
                            })}
                            {newProducts.map((prod) => {
                              const isSelected = selectedSuggestions.has(prod.name);
                              return (
                                <motion.button key={prod.name} whileTap={{ scale: 0.95 }}
                                  onClick={() => toggleSuggestionSelection(prod.name)}
                                  className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium transition-all duration-200 border ${
                                    isSelected ? 'bg-success text-primary-foreground border-success shadow-md' : 'bg-muted/50 text-foreground border-border hover:border-success/40'
                                  }`}>
                                  <ShoppingBag className="w-3.5 h-3.5" /> {prod.name}
                                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                                </motion.button>
                              );
                            })}
                          </div>
                        </div>
                        {selectedSuggestions.size > 0 && (
                          <div className="flex gap-2 pt-3">
                            <Button className="gap-2" onClick={() => handleSendSelectedSuggestions(ctxSuggestion)}>
                              <Headphones className="w-4 h-4" /> Enviar {selectedSuggestions.size} seleção(ões) para a Central
                            </Button>
                          </div>
                        )}
                      </motion.div>
                    );
                  })()}

                  {/* ── NOT FOUND IN DATABASE ── */}
                  {noResults && (() => {
                    const ctxSuggestion = generateContextualSuggestions(executedQuery);
                    return (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-6">
                        {/* Not found badge */}
                        <div className="flex items-center gap-2 mb-4">
                          <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-xs px-3 py-1">
                            <X className="w-3.5 h-3.5 mr-1.5" /> Não encontrado na base de dados
                          </Badge>
                          <span className="text-xs text-muted-foreground">Pesquisa: "{executedQuery}"</span>
                        </div>

                        {/* AI contextual panel */}
                        <div className="rounded-2xl border border-border bg-card p-5 mb-4">
                          <div className="flex items-center gap-3 mb-4">
                            <AiAvatar size={44} speaking={true} onClick={() => setShowAiPanel(true)} />
                            <div>
                              <h3 className="font-display font-bold text-foreground text-sm">🧠 Sugestões da IA</h3>
                              <p className="text-xs text-muted-foreground">
                                Não encontrei "{executedQuery}" na base, mas posso ajudar! Selecione o que mais se aproxima:
                              </p>
                            </div>
                          </div>

                          {ctxSuggestion ? (
                            <div className="space-y-4">
                              <p className="text-sm text-foreground">{ctxSuggestion.derivedContext}</p>
                              <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">📂 {ctxSuggestion.segmentLabel}</Badge>

                              {/* Selectable suggestions as chips */}
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground mb-2">Selecione uma ou mais opções:</p>
                                <div className="flex flex-wrap gap-2">
                                  {ctxSuggestion.suggestedServices.map((svc) => {
                                    const isSelected = selectedSuggestions.has(svc.name);
                                    return (
                                      <motion.button
                                        key={svc.name}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => toggleSuggestionSelection(svc.name)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium transition-all duration-200 border ${
                                          isSelected
                                            ? 'bg-primary text-primary-foreground border-primary shadow-md'
                                            : 'bg-muted/50 text-foreground border-border hover:border-primary/40'
                                        }`}
                                      >
                                        <WrenchIcon className="w-3.5 h-3.5" />
                                        {svc.name}
                                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                                      </motion.button>
                                    );
                                  })}
                                  {ctxSuggestion.suggestedProducts.map((prod) => {
                                    const isSelected = selectedSuggestions.has(prod.name);
                                    return (
                                      <motion.button
                                        key={prod.name}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => toggleSuggestionSelection(prod.name)}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium transition-all duration-200 border ${
                                          isSelected
                                            ? 'bg-success text-primary-foreground border-success shadow-md'
                                            : 'bg-muted/50 text-foreground border-border hover:border-success/40'
                                        }`}
                                      >
                                        <ShoppingBag className="w-3.5 h-3.5" />
                                        {prod.name}
                                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                                      </motion.button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Action buttons */}
                              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                                {selectedSuggestions.size > 0 && (
                                  <Button className="gap-2" onClick={() => handleSendSelectedSuggestions(ctxSuggestion)}>
                                    <Headphones className="w-4 h-4" /> Enviar {selectedSuggestions.size} seleção(ões) para a Central
                                  </Button>
                                )}
                                <Button variant="outline" className="gap-2" onClick={handleRefineSearch}>
                                  <Search className="w-4 h-4" /> Refinar pesquisa
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <p className="text-sm text-muted-foreground">
                                Não consegui identificar sugestões automáticas para "{executedQuery}".
                              </p>
                              <div className="flex flex-col sm:flex-row gap-2">
                                <Button className="gap-2" onClick={() => {
                                  const summary = buildSupportSummary(aiChat, executedQuery);
                                  const params = new URLSearchParams({ query: executedQuery, context: 'Busca sem resultado', summary, type: 'both', segment: '' });
                                  navigate(`/central-atendimento?${params.toString()}`);
                                }}>
                                  <Headphones className="w-4 h-4" /> Acionar Central (SLA 24h)
                                </Button>
                                <Button variant="outline" className="gap-2" onClick={handleRefineSearch}>
                                  <Search className="w-4 h-4" /> Refinar pesquisa
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })()}
                </motion.div>
              )}
            </AnimatePresence>
            </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* AI Chat Panel */}
      <AnimatePresence>
        {showAiPanel && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed right-0 top-14 bottom-0 w-full sm:w-96 bg-card border-l border-border shadow-2xl z-50 flex flex-col"
          >
            <div className="p-4 border-b border-border flex items-center justify-between bg-primary/5">
              <div className="flex items-center gap-3">
                <AiAvatar size={40} speaking={aiSpeaking} />
                <div>
                  <h3 className="font-display font-bold text-sm text-foreground">Assistente EcoMEI</h3>
                  <div className="flex items-center gap-1.5">
                    <motion.div
                      className="w-2 h-2 rounded-full bg-success"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <p className="text-xs text-muted-foreground">IA • Online agora</p>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowAiPanel(false)}>✕</Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {aiChat.length === 0 && (
                <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-2">👋 Me diga o que você precisa!</p>
                  <p className="mb-3">Eu encontro o melhor profissional perto de você:</p>
                  <ul className="space-y-1.5">
                    <li className="flex items-center gap-2"><DollarSign className="w-3.5 h-3.5 text-primary" /> Melhor preço garantido</li>
                    <li className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-primary" /> Atendimento mais rápido</li>
                    <li className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-primary" /> Profissionais na sua região</li>
                    <li className="flex items-center gap-2"><Star className="w-3.5 h-3.5 fill-accent text-accent" /> Avaliados por clientes reais</li>
                  </ul>
                  <p className="mt-3 text-xs">Se não encontrar, a <strong>Central de Atendimento</strong> resolve em até <strong>24h</strong>.</p>
                </div>
              )}

              {aiChat.map((msg, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start gap-2'}`}>
                    {msg.role === 'ai' && <AiAvatar size={28} speaking={false} />}
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted text-foreground rounded-bl-md'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                  {/* Grouped by provider — same layout as main search */}
                  {msg.searchResult && (msg.searchResult.products.length > 0 || msg.searchResult.services.length > 0) && (() => {
                    const providerMap = new Map<string, { services: typeof msg.searchResult.services; products: typeof msg.searchResult.products }>();
                    msg.searchResult.services.forEach(s => {
                      if (!providerMap.has(s.provider)) providerMap.set(s.provider, { services: [], products: [] });
                      providerMap.get(s.provider)!.services.push(s);
                    });
                    msg.searchResult.products.forEach(p => {
                      if (!providerMap.has(p.provider)) providerMap.set(p.provider, { services: [], products: [] });
                      providerMap.get(p.provider)!.products.push(p);
                    });
                    return (
                      <div className="w-full mt-2 pl-10 space-y-2">
                        {Array.from(providerMap.entries()).map(([providerName, data]) => (
                          <div key={providerName} className="rounded-xl border border-border/50 overflow-hidden bg-card">
                            <button onClick={() => toggleProviderExpanded(providerName)}
                              className="w-full flex items-center justify-between p-2.5 sm:p-3 hover:bg-muted/30 transition-colors text-left">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                {(() => {
                                  const prov = dbProviders.get(providerName);
                                  const logo = prov?.logo_url;
                                  return logo ? (
                                    <img src={logo} alt={providerName} className="w-7 h-7 rounded-full object-cover border border-border shrink-0" />
                                  ) : (
                                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm">
                                      <Store className="w-3.5 h-3.5 text-primary" />
                                    </div>
                                  );
                                })()}
                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold text-xs text-foreground truncate cursor-pointer hover:text-primary transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const slug = providerName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                                      navigate(`/loja/${slug}`);
                                    }}>{providerName}</p>
                                  <p className="text-[10px] text-muted-foreground">
                                    {data.services.length > 0 && `${data.services.length} serviço(s)`}
                                    {data.services.length > 0 && data.products.length > 0 && ' · '}
                                    {data.products.length > 0 && `${data.products.length} produto(s)`}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <Button variant="default" size="sm" className="text-[9px] h-6 px-2 gap-0.5 font-semibold"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const slug = providerName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                                    navigate(`/loja/${slug}`);
                                  }}>
                                  <Store className="w-3 h-3" /> Loja
                                </Button>
                                <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${expandedProviders.has(providerName) ? 'rotate-180' : ''}`} />
                              </div>
                            </button>
                            <AnimatePresence>
                              {expandedProviders.has(providerName) && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                  <div className="p-3 pt-0 space-y-2">
                                    {data.services.map(r => {
                                      const seg = staticSegments.find(s => s.id === r.segment);
                                      const SegIcon = seg?.icon || Sparkles;
                                      return (
                                        <Card key={r.id} className={`transition-all cursor-pointer group ${isInServiceCart(r.id) ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/30'}`}
                                          onClick={() => toggleServiceInCart(r)}>
                                          <CardContent className="p-2.5">
                                            <div className="flex items-center gap-2 mb-1">
                                              <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${isInServiceCart(r.id) ? 'bg-primary/20' : 'bg-primary/10'}`}>
                                                {isInServiceCart(r.id) ? <CheckCircle2 className="w-3 h-3 text-primary" /> : <SegIcon className="w-3 h-3 text-primary" />}
                                              </div>
                                              <h4 className="font-semibold text-xs text-foreground truncate">{r.name}</h4>
                                            </div>
                                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                              <span><DollarSign className="w-2.5 h-2.5 inline" /> R$ {r.price}</span>
                                              <span><Clock className="w-2.5 h-2.5 inline" /> {r.time}</span>
                                              <span><Star className="w-2.5 h-2.5 fill-accent text-accent inline" /> {r.rating}</span>
                                            </div>
                                          </CardContent>
                                        </Card>
                                      );
                                    })}
                                    {data.products.map(product => (
                                      <Card key={product.id} className={`transition-all cursor-pointer group ${isInProductCart(product.id) ? 'border-success bg-success/5' : 'border-border/50 hover:border-success/40'}`}
                                        onClick={() => toggleProductInCart(product)}>
                                        <CardContent className="p-2.5">
                                          <div className="flex items-start justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                              <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${isInProductCart(product.id) ? 'bg-success/20' : 'bg-success/10'}`}>
                                                {isInProductCart(product.id) ? <CheckCircle2 className="w-3 h-3 text-success" /> : <ShoppingBag className="w-3 h-3 text-success" />}
                                              </div>
                                              <h4 className="font-semibold text-xs text-foreground truncate">{product.name}</h4>
                                            </div>
                                            <Badge variant={product.stockType === 'fisico' ? 'default' : 'secondary'} className="text-[8px] px-1 py-0 shrink-0">
                                              {product.stockType === 'fisico' ? 'Local' : 'Drop'}
                                            </Badge>
                                          </div>
                                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                            <span className="font-semibold text-foreground">R$ {product.price}</span>
                                            <span><Star className="w-2.5 h-2.5 fill-accent text-accent inline" /> {product.rating}</span>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    ))}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  {/* AI-suggested services */}
                  {msg.searchResult?.suggestedServices && msg.searchResult.suggestedServices.length > 0 && (
                    <div className="w-full mt-2 pl-10">
                      <p className="text-[11px] font-semibold text-accent-foreground mb-1.5 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-accent" /> Serviços sugeridos pela IA
                      </p>
                      <div className="space-y-2">
                        {msg.searchResult.suggestedServices.slice(0, 2).map((r) => {
                          const seg = staticSegments.find((s) => s.id === r.segment);
                          const SegIcon = seg?.icon || Sparkles;
                          return (
                            <motion.div key={r.id} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                              <Card className="border-accent/30 hover:border-accent/50 cursor-pointer transition-all group"
                                onClick={() => navigateToDemo(r)}>
                                <CardContent className="p-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                                      <SegIcon className="w-3.5 h-3.5 text-accent-foreground" />
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-xs text-foreground">{r.name}</h4>
                                      <p className="text-[11px] text-muted-foreground">{r.provider} • R$ {r.price}</p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {/* Contextual suggestion cards in chat */}
                  {msg.contextualSuggestion && (
                    <div className="w-full mt-2 pl-10 space-y-2">
                      <p className="text-[11px] font-semibold text-primary flex items-center gap-1">
                        <WrenchIcon className="w-3.5 h-3.5" /> Serviços sugeridos ({msg.contextualSuggestion.segmentLabel})
                      </p>
                      {msg.contextualSuggestion.suggestedServices.map((svc) => {
                        const isSelected = pendingChatSuggestions.get(idx)?.has(svc.name);
                        return (
                          <Card key={svc.name}
                            className={`cursor-pointer transition-all ${isSelected ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-primary/40'}`}
                            onClick={() => {
                              setPendingChatSuggestions(prev => {
                                const next = new Map(prev);
                                const set = new Set(next.get(idx) || []);
                                if (set.has(svc.name)) set.delete(svc.name); else set.add(svc.name);
                                next.set(idx, set);
                                return next;
                              });
                            }}>
                            <CardContent className="p-3">
                              <div className="flex items-center gap-2">
                                <div className={`w-6 h-6 rounded-md flex items-center justify-center ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-primary/10'}`}>
                                  {isSelected ? <CheckCircle2 className="w-3.5 h-3.5" /> : <WrenchIcon className="w-3.5 h-3.5 text-primary" />}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-xs text-foreground">{svc.name}</h4>
                                  <p className="text-[10px] text-muted-foreground">{svc.description}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                      <p className="text-[11px] font-semibold text-success flex items-center gap-1 mt-1">
                        <ShoppingBag className="w-3.5 h-3.5" /> Produtos sugeridos
                      </p>
                      {msg.contextualSuggestion.suggestedProducts.map((prod) => {
                        const isSelected = pendingChatSuggestions.get(idx)?.has(prod.name);
                        return (
                          <Card key={prod.name}
                            className={`cursor-pointer transition-all ${isSelected ? 'border-success bg-success/5' : 'border-border/50 hover:border-success/40'}`}
                            onClick={() => {
                              setPendingChatSuggestions(prev => {
                                const next = new Map(prev);
                                const set = new Set(next.get(idx) || []);
                                if (set.has(prod.name)) set.delete(prod.name); else set.add(prod.name);
                                next.set(idx, set);
                                return next;
                              });
                            }}>
                            <CardContent className="p-3">
                              <div className="flex items-center gap-2">
                                <div className={`w-6 h-6 rounded-md flex items-center justify-center ${isSelected ? 'bg-success text-white' : 'bg-success/10'}`}>
                                  {isSelected ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ShoppingBag className="w-3.5 h-3.5 text-success" />}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-xs text-foreground">{prod.name}</h4>
                                  <p className="text-[10px] text-muted-foreground">{prod.description}</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                      {(pendingChatSuggestions.get(idx)?.size || 0) > 0 && (
                        <Button size="sm" className="w-full gap-2 text-xs mt-2" onClick={() => {
                          const selected = Array.from(pendingChatSuggestions.get(idx) || []);
                          const summary = buildSupportSummary(aiChat, selected.join(', '));
                          const params = new URLSearchParams({
                            query: selected.join(', '),
                            context: `IA: ${msg.contextualSuggestion!.segmentLabel}`,
                            summary,
                            type: 'both',
                            segment: msg.contextualSuggestion!.segment,
                            suggestions: JSON.stringify(selected),
                          });
                          navigate(`/central-atendimento?${params.toString()}`);
                        }}>
                          <Headphones className="w-3.5 h-3.5" /> Confirmar e acionar Central ({pendingChatSuggestions.get(idx)?.size} item(ns))
                        </Button>
                      )}
                      <p className="text-[10px] text-muted-foreground text-center">Ou escreva com mais detalhes para refinar</p>
                    </div>
                  )}
                  {/* Central action buttons when no results and no contextual suggestions */}
                  {msg.role === 'ai' && (msg.searchResult as any)?._noResults && !msg.contextualSuggestion && (
                    <div className="w-full mt-2 pl-10 space-y-2">
                      <Button size="sm" className="w-full gap-2 text-xs" onClick={() => {
                        const sr = msg.searchResult as any;
                        const params = new URLSearchParams({ query: sr._query, context: 'Chat IA', summary: sr._summary, type: 'both' });
                        navigate(`/central-atendimento?${params.toString()}`);
                      }}>
                        <Headphones className="w-3.5 h-3.5" /> Acionar Central de Atendimento
                      </Button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="p-3 border-t border-border">
              <div className="flex gap-2">
                <Input
                  value={aiMessage}
                  onChange={(e) => setAiMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAiSend()}
                  placeholder="Descreva o que você precisa..."
                  className="rounded-xl"
                />
                <Button size="icon" className="rounded-xl shrink-0" onClick={handleAiSend}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <button
                onClick={() => {
                  const lastQuery = aiChat.filter(m => m.role === 'user').pop()?.text || 'serviço especializado';
                  const summary = buildSupportSummary(aiChat, lastQuery);
                  const params = new URLSearchParams({ query: lastQuery, context: 'Chat IA - Central', summary, type: 'both' });
                  navigate(`/central-atendimento?${params.toString()}`);
                }}
                className="w-full mt-2 text-xs text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1 py-1.5"
              >
                <Headphones className="w-3 h-3" /> Central de Atendimento (SLA 24h)
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart is now rendered globally via CartBar */}

      {/* Footer */}
      <footer className="border-t border-border py-4 px-4 bg-card/50">
        <div className="container mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 rounded bg-primary flex items-center justify-center">
                <Zap className="w-3 h-3 text-primary-foreground" />
              </div>
              <span className="font-display text-sm font-bold text-foreground">EcoMEI</span>
              <span className="text-[10px] text-muted-foreground ml-1">© 2026</span>
            </div>
            <p className="text-xs text-muted-foreground text-center max-w-md">
              <Sparkles className="w-3 h-3 text-accent inline mr-1" />
              <strong className="text-foreground">É prestador de serviço?</strong> Cadastre-se e conquiste novos clientes todos os dias. Planos a partir de R$ 29,90/mês.
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="text-xs gap-1 h-8" onClick={() => navigate('/mei')}>
                <Users className="w-3 h-3" /> Sou Prestador
              </Button>
              <Button size="sm" className="text-xs gap-1 h-8" onClick={() => navigate('/client')}>
                <ShoppingCart className="w-3 h-3" /> Sou Cliente
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
