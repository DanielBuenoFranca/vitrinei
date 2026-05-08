import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Zap, Sparkles, Clock, MapPin, DollarSign,
  Headphones, ShoppingCart, BarChart3, Send, Star,
  Package, TrendingDown, Navigation, Users, Shield, MessageCircle,
  ChevronDown, ShoppingBag, Wrench as WrenchIcon, Store, Plus, CheckCircle2, X, Trash2, Settings, CreditCard, AlertTriangle, Minus, Home,
  Scissors, Droplets, Sprout, Truck, Hammer, Stethoscope, GraduationCap, Car, Brush, Cpu, Heart, PawPrint, PartyPopper, Leaf, Monitor, Gem, Shirt, Music
} from 'lucide-react';
import { AiAvatar } from '@/components/AiAvatarGlobal';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import HeaderMarquee from '@/components/HeaderMarquee';
import { AccessBanner, MaskedPrice, ActionGate, useAccessLevel } from '@/components/AccessGate';
import { Search3DHero } from '@/components/landing/Search3DHero';
import { TopProviderBadge } from '@/components/TopProviderBadge';
import { useAiSession } from '@/contexts/AiSessionContext';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { segments as staticSegments, mockResults, semanticSearch, buildSupportSummary, generateContextualSuggestions, getAllServices, getAllProducts, loadDynamicEntries, reloadDynamicEntries, loadSegmentTagsCache, type ProductItem, type SearchResult, type ContextualSuggestion } from '@/data/searchData';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';
import { FavoriteButton } from '@/components/FavoriteButton';
import { FavoritesModal } from '@/components/FavoritesModal';
import { useFavorites } from '@/hooks/useFavorites';


const aiSuggestions = [
  '💡 A inteligência encontra o que você precisa — sem esforço.',
  '🔍 Pesquise qualquer necessidade. Se não tivermos, a IA encontra para você.',
  '🚀 Mais de 2.450 profissionais prontos para atender agora mesmo.',
  '✨ Assine e tenha acesso a serviços exclusivos com até 30% de economia.',
  '🤝 É prestador? Cadastre-se e conquiste novos clientes todo dia.',
];

const normalizeText = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
const slugify = (value: string) => normalizeText(value).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

type AiRoute = {
  intent?: 'chat' | 'search' | 'support' | 'cart' | 'story';
  tags?: string[];
  segments?: string[];
  query?: string;
  item_type?: 'service' | 'product' | 'both';
  transition_message?: string;
  confidence?: number;
  needs_more_info?: boolean;
  follow_up_question?: string;
  suggestions?: string[];
};

const visualIcons = [Scissors, Droplets, Sprout, Truck, Hammer, Stethoscope, GraduationCap, Car, Brush, Cpu, Heart, PawPrint, PartyPopper, Leaf, Monitor, Gem, Shirt, Music, WrenchIcon, ShoppingBag];
const pickVisualIcon = (seed: string) => visualIcons[Math.abs([...normalizeText(seed)].reduce((acc, c) => acc + c.charCodeAt(0), 0)) % visualIcons.length];


const Landing = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signOut, displayName } = useAuth();
  const { profileLabel } = usePermissions();
  const { session, update: updateAiSession } = useAiSession();
  const accessLevel = useAccessLevel();
  const [searchQuery, setSearchQuery] = useState('');
  const [executedQuery, setExecutedQuery] = useState('');
  const [searchExecuted, setSearchExecuted] = useState(false);
  const [searchVersion, setSearchVersion] = useState(0);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  const [activeSegments, setActiveSegments] = useState<string[]>([]);
  const [typeFilter, setTypeFilter] = useState<'all' | 'service' | 'product'>('all');
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [aiChat, setAiChat] = useState<{ role: 'user' | 'ai'; text: string; searchResult?: SearchResult; contextualSuggestion?: ContextualSuggestion }[]>([]);
  const [inlineAiOpen, setInlineAiOpen] = useState(false);
  const [aiRefining, setAiRefining] = useState(false);
  const [aiRoute, setAiRoute] = useState<AiRoute | null>(null);
  const [currentSuggestion, setCurrentSuggestion] = useState(0);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [expandedProducts, setExpandedProducts] = useState<number | null>(null);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const { count: favoritesCount } = useFavorites();
  const [expandedServices, setExpandedServices] = useState<number | null>(null);
  const [showSearchProducts, setShowSearchProducts] = useState(false);
  const [pendingChatSuggestions, setPendingChatSuggestions] = useState<Map<number, Set<string>>>(new Map());
  const [expandedProviders, setExpandedProviders] = useState<Set<string>>(new Set());
  const [dbSegments, setDbSegments] = useState<{ id: string; label: string; name: string; tags: string[]; image_url?: string | null }[]>([]);
  const [providerSegmentMap, setProviderSegmentMap] = useState<Map<string, string[]>>(new Map());
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
  const speech = useSpeechRecognition();

  const applyRouteToSearch = (route: AiRoute, fallbackQuery: string) => {
    const nextQuery = (route.query || fallbackQuery).trim();
    const routeSegments = (route.segments || []).map(s => normalizeText(s));
    const matchingSegments = dbSegments
      .filter(seg => routeSegments.some(rs => normalizeText(seg.id).includes(rs) || normalizeText(seg.name).includes(rs) || normalizeText(seg.label).includes(rs)))
      .map(seg => seg.id);
    if (nextQuery) setSearchQuery(nextQuery);
    if (matchingSegments.length) setActiveSegments(Array.from(new Set(matchingSegments)));
    if (route.item_type === 'service') setTypeFilter('service');
    else if (route.item_type === 'product') setTypeFilter('product');
    else setTypeFilter('all');
    setExecutedQuery(nextQuery);
    setSearchExecuted(true);
    setSearchVersion(v => v + 1);
    setInlineAiOpen(false);
    setAiRoute(route);
    updateAiSession({
      tags: route.tags || [],
      segments: route.segments || [],
      lastIntent: route.intent,
      lastQuery: nextQuery,
    });
  };

  const refineWithVini = async (raw: string, options: { openPanel?: boolean; autoApply?: boolean } = {}) => {
    const text = raw.trim();
    if (!text) return null;
    if (options.openPanel) setInlineAiOpen(true);
    setAiRefining(true);
    setAiChat(prev => [...prev, { role: 'user', text }]);
    try {
      const { data } = await supabase.functions.invoke('ai-router', { body: { message: text, session } });
      const routed = (data || {}) as AiRoute;
      setAiRoute(routed);
      if (routed.needs_more_info || routed.intent !== 'search') {
        const ask = routed.follow_up_question || 'Me diga mais um detalhe para eu filtrar melhor.';
        setAiChat(prev => [...prev, { role: 'ai', text: ask }]);
        return routed;
      }
      const query = (routed.query || text).trim();
      const preview = semanticSearch(query, aiChat.filter(m => m.role === 'user').map(m => m.text).concat(text));
      const label = routed.transition_message || preview.followUp || `Entendi: ${query}. Vou mostrar os resultados filtrados.`;
      setAiChat(prev => [...prev, { role: 'ai', text: label, searchResult: preview }]);
      if (options.autoApply !== false) applyRouteToSearch(routed, query);
      return routed;
    } catch {
      const local = semanticSearch(text, aiChat.filter(m => m.role === 'user').map(m => m.text).concat(text));
      if ((local.products.length + local.services.length) > 0) {
        const fallback: AiRoute = { intent: 'search', query: text, item_type: local.products.length && !local.services.length ? 'product' : local.services.length && !local.products.length ? 'service' : 'both' };
        setAiChat(prev => [...prev, { role: 'ai', text: local.followUp || 'Encontrei opções para sua busca.', searchResult: local }]);
        if (options.autoApply !== false) applyRouteToSearch(fallback, text);
        return fallback;
      }
      setAiChat(prev => [...prev, { role: 'ai', text: 'Ainda preciso de mais detalhes para buscar melhor.' }]);
      return null;
    } finally {
      setAiRefining(false);
    }
  };
  useEffect(() => {
    if (speech.transcript) setSearchQuery(speech.transcript);
  }, [speech.transcript]);
  useEffect(() => {
    if (!speech.listening && speech.transcript) {
      // auto-execute on stop
      setTimeout(() => executeSearch(), 150);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speech.listening]);
  // Pré-preenche busca via ?q= (vinda do Vini ou outras telas); execução ocorre após carregar segmentos.
  useEffect(() => {
    const q = searchParams.get('q');
    if (q && !searchQuery) setSearchQuery(q);
  }, []);

  const handleMic = () => {
    if (!speech.supported) return;
    if (speech.listening) speech.stop();
    else speech.start();
  };

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

  const handleSmartSearch = () => {
    const q = searchQuery.trim();
    if (!q) return executeSearch();
    refineWithVini(q, { openPanel: true, autoApply: true });
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
      const [{ data: segs }, { data: provs }] = await Promise.all([
        supabase.from('segments').select('*').order('name'),
        supabase.from('providers').select('name, segment').eq('active', true),
      ]);
      if (segs) {
        setDbSegments(segs.map((s: any) => ({ id: s.name, label: s.name, name: s.name, tags: s.suggested_tags || [], image_url: s.image_url })));
      }
      if (provs) {
        const map = new Map<string, string[]>();
        provs.forEach((p: any) => map.set(p.name, p.segment || []));
        setProviderSegmentMap(map);
      }
      setDataLoaded(true);

      // Pre-fill smart search from URL ?q= passed by Vini Home
      try {
        const params = new URLSearchParams(window.location.search);
        const incomingQ = (params.get('q') || '').trim();
        const incomingType = params.get('type') as 'service' | 'product' | 'both' | null;
        const incomingSegs = (params.get('segments') || '').split(',').map(s => s.trim()).filter(Boolean);
        if (incomingQ) {
          setSearchQuery(incomingQ);
          if (incomingType === 'service') setTypeFilter('service');
          else if (incomingType === 'product') setTypeFilter('product');
          const incomingNorm = incomingSegs.map(normalizeText);
          if (incomingNorm.length) {
            setActiveSegments(segs
              .filter((s: any) => incomingNorm.some(n => normalizeText(s.name).includes(n)))
              .map((s: any) => s.name));
          }
          refineWithVini(incomingQ, { openPanel: false, autoApply: true });
          return;
        }
      } catch {}

      // Don't auto-show results — wait for user to search
      setSearchExecuted(false);
      setExecutedQuery('');
      setSearchVersion(0);
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
  const [dbProviders, setDbProviders] = useState<Map<string, { logo_url: string | null; is_top_provider?: boolean }>>(new Map());
  const [dbProviderNames, setDbProviderNames] = useState<Set<string>>(new Set());
  useEffect(() => {
    supabase.from('providers').select('name, logo_url, is_top_provider').then(({ data }) => {
      if (data) {
        setDbProviderNames(new Set(data.map((p: any) => p.name)));
        const map = new Map<string, { logo_url: string | null; is_top_provider?: boolean }>();
        data.forEach((p: any) => map.set(p.name, { logo_url: p.logo_url, is_top_provider: p.is_top_provider }));
        setDbProviders(map);
      }
    });
  }, []);

  const isSimulatedProvider = (providerName: string, item?: any) => {
    if (item && item._fromDb) return false;
    return !dbProviderNames.has(providerName);
  };

  // ── Motor de busca semântica universal ──
  const [fallbackToAll, setFallbackToAll] = useState(false);
  const searchResult = (() => {
    void searchVersion;
    if (!searchExecuted) return { products: [] as ProductItem[], services: [] as typeof mockResults, followUp: undefined, needLabel: undefined, suggestedServices: undefined };
    const query = executedQuery.toLowerCase().trim();
    let rawResult: SearchResult;
    let didFallback = false;
    if (!query && activeSegments.length === 0) {
      rawResult = { products: getAllProducts(), services: getAllServices() };
    } else if (!query && activeSegments.length > 0) {
      const norm = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
      const activeNorm = activeSegments.map(norm);
      const allSvcs = getAllServices().filter((r: any) => activeNorm.includes(norm(r.segment)));
      const provNamesFromSvcs = new Set(allSvcs.map((s: any) => s.provider));
      // Also include providers that belong to the segment (even without services)
      const provNamesFromMap = new Set<string>();
      providerSegmentMap.forEach((segs, provName) => {
        if (segs.some(s => activeNorm.includes(norm(s)))) provNamesFromMap.add(provName);
      });
      const allProvNames = new Set([...provNamesFromSvcs, ...provNamesFromMap]);
      const allProds = getAllProducts().filter((p: any) => allProvNames.has(p.provider));
      rawResult = { products: allProds, services: allSvcs };
    } else {
      const result = semanticSearch(query);
      const norm = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
      const activeNorm = activeSegments.map(norm);
      const filteredServices = activeSegments.length === 0
        ? result.services
        : result.services.filter(r => activeNorm.includes(norm(r.segment)));
      rawResult = { ...result, services: filteredServices };

      // Fallback: nothing matched → show full inventory so user can keep browsing
      if ((rawResult.products?.length || 0) === 0 && (rawResult.services?.length || 0) === 0) {
        rawResult = {
          products: getAllProducts(),
          services: activeSegments.length === 0
            ? getAllServices()
            : getAllServices().filter((r: any) => activeNorm.includes(norm(r.segment))),
          followUp: rawResult.followUp,
          needLabel: rawResult.needLabel,
          suggestedServices: rawResult.suggestedServices,
        };
        didFallback = true;
      }
    }

    // Filter simulated providers if checkbox is unchecked
    if (!showSimulated) {
      rawResult = {
        ...rawResult,
        services: rawResult.services.filter((s: any) => !isSimulatedProvider(s.provider, s)),
        products: rawResult.products.filter((p: any) => !isSimulatedProvider(p.provider, p)),
      };
    }
    // Filter by type (service / product)
    if (typeFilter === 'service') {
      rawResult = { ...rawResult, products: [] };
    } else if (typeFilter === 'product') {
      rawResult = { ...rawResult, services: [] };
    }
    if (didFallback !== fallbackToAll) {
      // Defer state update to avoid render loop warning
      queueMicrotask(() => setFallbackToAll(didFallback));
    }
    return rawResult;
  })();

  const filteredResults = searchResult.services;
  const hasResults = searchExecuted && (filteredResults.length > 0 || searchResult.products.length > 0);
  const noResults = searchExecuted && executedQuery && !fallbackToAll && filteredResults.length === 0 && searchResult.products.length === 0;
  const providerEntries = (() => {
    const providerMap = new Map<string, { products: typeof searchResult.products; services: typeof filteredResults }>();
    searchResult.products.forEach(p => {
      if (!providerMap.has(p.provider)) providerMap.set(p.provider, { products: [], services: [] });
      providerMap.get(p.provider)!.products.push(p);
    });
    filteredResults.forEach(s => {
      if (!providerMap.has(s.provider)) providerMap.set(s.provider, { products: [], services: [] });
      providerMap.get(s.provider)!.services.push(s);
    });
    return Array.from(providerMap.entries());
  })();

  const getSegmentVisual = (segment?: string) => segment
    ? dbSegments.find(s => normalizeText(s.id) === normalizeText(segment) || normalizeText(s.name) === normalizeText(segment))
    : undefined;
  const getVisualIcon = (label: string) => pickVisualIcon(label);

  const handleAiSend = () => {
    if (!aiMessage.trim()) return;
    const msg = aiMessage.trim();
    setAiSpeaking(true);
    refineWithVini(msg, { openPanel: true, autoApply: true }).finally(() => {
      setAiSpeaking(false);
      setAiMessage('');
    });
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
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Cabeçalho oculto na tela de busca — sem ícones (carteira, sair, +) */}

      {/* Main content area - fills remaining space */}
      <main className="flex-1 flex flex-col overflow-hidden">
      {/* Access Banner for visitors/leads */}
      <AccessBanner />

      {/* Tela unificada 3D: busca e resultados no mesmo canvas */}
      {(
        <section className="flex-1 overflow-hidden">
          <Search3DHero
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onSearch={handleSmartSearch}
            onMic={handleMic}
            micListening={speech.listening}
            micSupported={speech.supported}
            segments={dbSegments}
            activeSegments={activeSegments}
            toggleSegment={toggleSegment}
            typeFilter={typeFilter}
            setTypeFilter={(v) => { setTypeFilter(v); setTimeout(() => { setSearchExecuted(true); setSearchVersion(x => x + 1); }, 0); }}
          >
            {(inlineAiOpen || searchExecuted) && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 pb-6">

                {inlineAiOpen && (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-3 backdrop-blur-xl shadow-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <AiAvatar size={32} speaking={aiRefining} />
                      <div className="min-w-0">
                        <h3 className="text-[12px] font-bold text-white">Sugestões da IA</h3>
                        <p className="text-[10px] text-white/55">Vou refinar antes de mostrar os resultados.</p>
                      </div>
                    </div>
                    <div className="max-h-40 overflow-y-auto no-scrollbar space-y-1.5 mb-2">
                      {aiChat.slice(-4).map((m, i) => (
                        <div key={`${m.role}-${i}-${m.text}`} className={`text-[11px] leading-snug rounded-xl px-2.5 py-1.5 ${m.role === 'user' ? 'ml-8 bg-primary/80 text-primary-foreground' : 'mr-8 bg-black/25 text-white/85 border border-white/10'}`}>
                          {m.text}
                        </div>
                      ))}
                      {aiRefining && <div className="mr-8 bg-black/25 text-white/70 border border-white/10 text-[11px] rounded-xl px-2.5 py-1.5">Analisando contexto…</div>}
                    </div>
                    {(aiRoute?.suggestions || []).length > 0 && (
                      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                        {aiRoute!.suggestions!.map((s) => (
                          <button key={s} onClick={() => { setAiMessage(''); refineWithVini(`${searchQuery} ${s}`, { openPanel: true, autoApply: true }); }} className="shrink-0 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[10px] font-medium text-white/85">
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="mt-2 flex gap-2">
                      <Input value={aiMessage} onChange={(e) => setAiMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAiSend()} placeholder="Responder ao Vini…" className="h-8 bg-black/25 border-white/10 text-white placeholder:text-white/35 text-xs" />
                      <Button size="sm" onClick={handleAiSend} disabled={aiRefining || !aiMessage.trim()} className="h-8 px-3"><Send className="w-3 h-3" /></Button>
                    </div>
                  </div>
                )}

                {/* === FAIXA ROLANTE: PRESTADORES === */}
                {hasResults && providerEntries.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5 px-1">
                      <h3 className="text-[10px] font-semibold tracking-[0.14em] uppercase text-white/55">Prestadores próximos</h3>
                      <label className="flex items-center gap-1.5 cursor-pointer select-none rounded-full border border-white/15 bg-white/5 px-2 py-0.5">
                        <Checkbox checked={showSimulated} onCheckedChange={(v) => setShowSimulated(!!v)} className="h-3 w-3" />
                        <span className="text-[10px] text-white/70 whitespace-nowrap">Incluir simulados</span>
                      </label>
                    </div>
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1 snap-x">
                      {providerEntries
                        .slice()
                        .sort(([an, ad], [bn, bd]) => {
                          const aTop = dbProviders.get(an)?.is_top_provider ? 1 : 0;
                          const bTop = dbProviders.get(bn)?.is_top_provider ? 1 : 0;
                          if (bTop !== aTop) return bTop - aTop;
                          const aR = ad.services[0]?.rating ?? ad.products[0]?.rating ?? 0;
                          const bR = bd.services[0]?.rating ?? bd.products[0]?.rating ?? 0;
                          return bR - aR;
                        })
                        .map(([providerName, data], idx) => {
                        const prov = dbProviders.get(providerName);
                        const segName = data.services[0]?.segment || data.products[0]?.tags?.[0] || providerName;
                        const segVisual = getSegmentVisual(segName);
                        const Icon = getVisualIcon(`${providerName}-${segName}`);
                        const slug = slugify(providerName);
                        return (
                          <motion.div
                            key={providerName}
                            initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.04 }}
                            className="snap-start shrink-0 w-[160px] rounded-2xl overflow-hidden relative"
                            style={{
                              background: 'linear-gradient(160deg, hsl(225 40% 18%), hsl(225 55% 8%))',
                              border: '1px solid hsl(265 50% 50% / 0.35)',
                              boxShadow: '0 14px 32px -16px hsl(265 80% 40% / 0.6), inset 0 1px 0 rgba(255,255,255,.08)',
                            }}
                          >
                            <button onClick={() => toggleProviderExpanded(providerName)} className="block w-full text-left">
                              <div className="relative aspect-[3/4] overflow-hidden">
                                {prov?.logo_url ? (
                                  <img src={prov.logo_url} alt={providerName} className="w-full h-full object-cover" />
                                ) : segVisual?.image_url ? (
                                  <img src={segVisual.image_url} alt={segName} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-900/60 to-slate-900">
                                    <Icon className="w-14 h-14 text-violet-200/70 drop-shadow-[0_4px_10px_rgba(0,0,0,.6)]" />
                                  </div>
                                )}
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-2">
                                  <div className="flex items-center gap-1">
                                    <h4 className="text-[12px] font-bold text-white truncate flex-1 drop-shadow">{providerName}</h4>
                                    <TopProviderBadge active={prov?.is_top_provider} size="xs" />
                                  </div>
                                  <div className="flex items-center gap-1 text-[10px] text-amber-300 mt-0.5">
                                    <Star className="w-2.5 h-2.5 fill-amber-300" />
                                    <span>{(data.services[0]?.rating ?? data.products[0]?.rating ?? 4.8)}</span>
                                    <span className="text-white/50">·</span>
                                    <MapPin className="w-2.5 h-2.5 text-white/50" />
                                    <span className="text-white/60 truncate">{data.services[0]?.distance || '2km'}</span>
                                  </div>
                                </div>
                              </div>
                            </button>
                            {dbProviderNames.has(providerName) && (
                              <button
                                onClick={() => navigate(`/loja/${slug}`)}
                                className="w-full py-1.5 text-[10px] font-bold text-white bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 flex items-center justify-center gap-1 transition-all"
                              >
                                <Store className="w-3 h-3" /> Visitar Loja
                              </button>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* === MARKETPLACE: SERVIÇOS === */}
                {hasResults && filteredResults.length > 0 && (
                  <div>
                    <h3 className="text-[10px] font-semibold tracking-[0.14em] uppercase text-white/55 mb-1.5 px-1 flex items-center gap-1.5">
                      <WrenchIcon className="w-3 h-3 text-violet-300/80" /> Serviços ({filteredResults.length})
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {filteredResults.map((result, idx) => {
                        const seg = getSegmentVisual(result.segment);
                        const SIcon = getVisualIcon(result.name);
                        const inCart = isInServiceCart(result.id);
                        const prov = dbProviders.get(result.provider);
                        return (
                          <motion.button
                            key={result.id}
                            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            whileHover={{ y: -2 }}
                            onClick={() => {
                              if (accessLevel === 'visitor') { toast.info('Crie sua conta para adicionar serviços ao carrinho', { action: { label: 'Cadastrar', onClick: () => navigate('/auth') }, duration: 5000 }); return; }
                              if (accessLevel === 'lead') { toast.warning('Confirme seu e-mail para contratar serviços', { duration: 6000 }); return; }
                              toggleServiceInCart(result);
                            }}
                            className="rounded-2xl overflow-hidden text-left relative group"
                            style={{
                              background: 'linear-gradient(160deg, hsl(225 35% 16%), hsl(225 50% 7%))',
                              border: inCart ? '1px solid hsl(265 80% 60%)' : '1px solid hsl(225 30% 30% / 0.5)',
                              boxShadow: inCart
                                ? '0 12px 30px -10px hsl(265 80% 50% / 0.8), inset 0 1px 0 rgba(255,255,255,.1)'
                                : '0 10px 24px -12px hsl(225 60% 0% / 0.7), inset 0 1px 0 rgba(255,255,255,.06)',
                            }}
                          >
                            <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-violet-900/40 to-slate-900 relative">
                              {seg?.image_url ? (
                                <img src={seg.image_url} alt={result.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center"><SIcon className="w-10 h-10 text-violet-300/60" /></div>
                              )}
                              <div className="absolute top-1.5 right-1.5 rounded-full bg-black/70 backdrop-blur px-1.5 py-0.5 flex items-center gap-0.5">
                                {inCart ? <CheckCircle2 className="w-3 h-3 text-violet-300" /> : <Plus className="w-3 h-3 text-white" />}
                              </div>
                            </div>
                            <div className="p-2">
                              <h4 className="text-[11px] font-bold text-white truncate">{result.name}</h4>
                              <p className="text-[9px] text-white/50 truncate">{result.provider}</p>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-[11px] font-bold text-violet-200"><MaskedPrice value={result.price} /></span>
                                <span className="flex items-center gap-0.5 text-[9px] text-amber-300">
                                  <Star className="w-2 h-2 fill-amber-300" /> {result.rating ?? 4.8}
                                </span>
                              </div>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* === MARKETPLACE: PRODUTOS === */}
                {hasResults && searchResult.products.length > 0 && (
                  <div>
                    <h3 className="text-[10px] font-semibold tracking-[0.14em] uppercase text-white/55 mb-1.5 px-1 flex items-center gap-1.5">
                      <ShoppingBag className="w-3 h-3 text-emerald-300/80" /> Produtos ({searchResult.products.length})
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {searchResult.products.map((product, idx) => {
                        const PIcon = getVisualIcon(product.name);
                        const inCart = isInProductCart(product.id);
                        return (
                          <motion.button
                            key={product.id}
                            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            whileHover={{ y: -2 }}
                            onClick={() => {
                              if (accessLevel === 'visitor') { toast.info('Crie sua conta para adicionar produtos ao carrinho', { action: { label: 'Cadastrar', onClick: () => navigate('/auth') }, duration: 5000 }); return; }
                              if (accessLevel === 'lead') { toast.warning('Confirme seu e-mail para comprar produtos', { duration: 6000 }); return; }
                              toggleProductInCart(product);
                            }}
                            className="rounded-2xl overflow-hidden text-left relative group"
                            style={{
                              background: 'linear-gradient(160deg, hsl(160 35% 14%), hsl(160 50% 6%))',
                              border: inCart ? '1px solid hsl(160 70% 50%)' : '1px solid hsl(160 25% 28% / 0.5)',
                              boxShadow: inCart
                                ? '0 12px 30px -10px hsl(160 80% 40% / 0.7), inset 0 1px 0 rgba(255,255,255,.1)'
                                : '0 10px 24px -12px hsl(160 60% 0% / 0.7), inset 0 1px 0 rgba(255,255,255,.06)',
                            }}
                          >
                            <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-emerald-900/40 to-slate-900 relative">
                              {product.image_url ? (
                                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center"><PIcon className="w-10 h-10 text-emerald-300/60" /></div>
                              )}
                              <div className="absolute top-1.5 right-1.5 rounded-full bg-black/70 backdrop-blur px-1.5 py-0.5 flex items-center gap-0.5">
                                {inCart ? <CheckCircle2 className="w-3 h-3 text-emerald-300" /> : <Plus className="w-3 h-3 text-white" />}
                              </div>
                              <div className="absolute top-1.5 left-1.5 rounded-full bg-emerald-500/80 backdrop-blur px-1.5 py-0.5">
                                <span className="text-[8px] font-bold text-white">{product.stockType === 'fisico' ? 'Estoque' : 'Drop'}</span>
                              </div>
                            </div>
                            <div className="p-2">
                              <h4 className="text-[11px] font-bold text-white truncate">{product.name}</h4>
                              <p className="text-[9px] text-white/50 truncate">{product.provider}</p>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-[11px] font-bold text-emerald-200"><MaskedPrice value={product.price} /></span>
                                <span className="flex items-center gap-0.5 text-[9px] text-amber-300">
                                  <Star className="w-2 h-2 fill-amber-300" /> {product.rating ?? 4.8}
                                </span>
                              </div>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {noResults && (() => {
                  const ctxSuggestion = generateContextualSuggestions(executedQuery);
                  return (
                    <div className="rounded-[24px] border border-accent/30 bg-card/95 p-4 shadow-xl">
                      <div className="flex items-center gap-3 mb-3">
                        <AiAvatar size={40} speaking={true} onClick={() => setShowAiPanel(true)} />
                        <div>
                          <h3 className="font-display font-bold text-foreground text-sm">Sugestões da IA</h3>
                          <p className="text-xs text-muted-foreground">Não encontrei “{executedQuery}” diretamente. Selecione alternativas ou refine a busca.</p>
                        </div>
                      </div>
                      {ctxSuggestion && (
                        <div className="flex flex-wrap gap-2">
                          {[...ctxSuggestion.suggestedServices.map(s => s.name), ...ctxSuggestion.suggestedProducts.map(p => p.name)].map((name) => {
                            const selected = selectedSuggestions.has(name);
                            return <button key={name} onClick={() => toggleSuggestionSelection(name)} className={`rounded-full border px-3 py-2 text-xs font-medium ${selected ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-foreground border-border'}`}>{name}</button>;
                          })}
                        </div>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {ctxSuggestion && selectedSuggestions.size > 0 && <Button className="gap-2" onClick={() => handleSendSelectedSuggestions(ctxSuggestion)}><Headphones className="w-4 h-4" /> Enviar para Central</Button>}
                        <Button variant="outline" className="gap-2" onClick={handleRefineSearch}><Search className="w-4 h-4" /> Refinar</Button>
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            )}
          </Search3DHero>
        </section>
      )}

      {/* Search bar compacta — quando já houve busca */}
      {false && searchExecuted && (
      <section className="shrink-0 px-4 py-2">
        <div className="container mx-auto max-w-5xl">
            <div className="relative">
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
                  <Button size="sm" variant="ghost" className="gap-1 rounded-xl" onClick={handleMic} title="Falar">
                    <span className={`text-base ${speech.listening ? 'text-red-500 animate-pulse' : ''}`}>🎤</span>
                  </Button>
                  <Button size="sm" className="gap-1 rounded-xl" onClick={executeSearch}>
                    <Search className="w-4 h-4" /> Buscar
                  </Button>
                </div>
              </div>

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
        </div>
      </section>
      )}
            {/* Layout: Only show sidebar + results after search */}
            {false && searchExecuted && (
            <div className="flex-1 overflow-hidden px-4">
            <div className="container mx-auto max-w-5xl h-full flex gap-3">
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
              <div className="flex-1 min-w-0 overflow-y-auto rounded-xl pr-1">
            <AnimatePresence>
              {searchExecuted && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>

                  {/* ── FOUND IN DATABASE ── */}
                  {hasResults && (
                    <>
                      {/* Found badge / fallback notice */}
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-3 flex items-center gap-2 flex-wrap">
                        {fallbackToAll ? (
                          <Badge className="bg-accent/10 text-accent border-accent/20 text-xs px-3 py-1">
                            <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Sem correspondência exata para "{executedQuery}" — mostrando catálogo completo
                          </Badge>
                        ) : (
                          <Badge className="bg-success/10 text-success border-success/20 text-xs px-3 py-1">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> {executedQuery ? 'Encontrado na base de dados' : 'Catálogo disponível'}
                          </Badge>
                        )}
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
                                            className={`font-semibold text-sm text-foreground truncate ${dbProviderNames.has(providerName) ? 'cursor-pointer hover:text-primary transition-colors' : ''}`}
                                            onClick={(e) => {
                                              if (!dbProviderNames.has(providerName)) return;
                                              e.stopPropagation();
                                              const slug = providerName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                                              navigate(`/loja/${slug}`);
                                            }}
                                          >{providerName}</h3>
                                          <TopProviderBadge active={dbProviders.get(providerName)?.is_top_provider} size="xs" />
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
                                        {dbProviderNames.has(providerName) && (
                                        <Button variant="default" size="sm" className="text-[10px] h-7 px-2.5 gap-1 font-semibold"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const slug = providerName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                                            navigate(`/loja/${slug}`);
                                          }}>
                                          <Store className="w-3.5 h-3.5" /> Loja
                                        </Button>
                                        )}
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
                                                        if (accessLevel === 'visitor') {
                                                          toast.info('Crie sua conta para adicionar serviços ao carrinho', {
                                                            action: { label: 'Cadastrar', onClick: () => navigate('/auth') }, duration: 5000,
                                                          }); return;
                                                        }
                                                        if (accessLevel === 'lead') {
                                                          toast.warning('Confirme seu e-mail para contratar serviços', {
                                                            description: 'Verifique sua caixa de entrada e clique no link de confirmação.',
                                                            action: { label: 'Ver status', onClick: () => navigate('/carteira') }, duration: 6000,
                                                          }); return;
                                                        }
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
                                                          <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> <MaskedPrice value={result.price} /></span>
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
                                                      if (accessLevel === 'visitor') {
                                                        toast.info('Crie sua conta para adicionar produtos ao carrinho', {
                                                          action: { label: 'Cadastrar', onClick: () => navigate('/auth') }, duration: 5000,
                                                        }); return;
                                                      }
                                                      if (accessLevel === 'lead') {
                                                        toast.warning('Confirme seu e-mail para comprar produtos', {
                                                          description: 'Verifique sua caixa de entrada e clique no link de confirmação.',
                                                          action: { label: 'Ver status', onClick: () => navigate('/carteira') }, duration: 6000,
                                                        }); return;
                                                      }
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
                                                        <span className="flex items-center gap-1 font-semibold text-foreground"><DollarSign className="w-3 h-3" /> <MaskedPrice value={product.price} /></span>
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
            </div>
            )}

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
                  <h3 className="font-display font-bold text-sm text-foreground">Assistente Vitrinei</h3>
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

      {/* Footer - Quick actions (Home, Urgência, Perfil, Indicação) */}
      <footer className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/80 backdrop-blur-md px-2 py-1 pb-[calc(0.25rem+env(safe-area-inset-bottom))]">
        <div className="container mx-auto max-w-2xl grid grid-cols-4 gap-1.5">
          {[
            { label: 'Home', icon: Home, onClick: () => navigate('/') },
            { label: 'Urgência', icon: Zap, onClick: () => navigate('/radar-urgencia') },
            { label: 'Perfil', icon: Users, onClick: () => navigate(user ? '/carteira' : '/auth') },
            { label: 'Indicação', icon: Sparkles, onClick: () => navigate('/convite/INDIQUE') },
          ].map((btn) => (
            <button
              key={btn.label}
              type="button"
              onClick={btn.onClick}
              className="flex flex-col items-center justify-center gap-0.5 rounded-lg py-1 px-1 bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 hover:border-primary/40 transition-all text-foreground/85 hover:text-primary"
              aria-label={btn.label}
            >
              <btn.icon className="w-4 h-4" strokeWidth={1.6} />
              <span className="text-[9px] font-medium leading-none">{btn.label}</span>
            </button>
          ))}
        </div>
      </footer>
      </main>
    </div>
  );
};

export default Landing;
