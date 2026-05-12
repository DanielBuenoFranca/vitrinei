import { useState, useEffect, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
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
  ChevronDown, ChevronRight, ChevronLeft, ShoppingBag, Wrench as WrenchIcon, Store, Plus, CheckCircle2, X, Trash2, Settings, CreditCard, AlertTriangle, Minus, Home, Layers, Loader2,
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

/* ============================================================
   Carrossel com setas de rolagem esquerda / direita
   ============================================================ */
function ScrollableRow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 'left' | 'right') => {
    if (!ref.current) return;
    const amount = dir === 'left' ? -220 : 220;
    ref.current.scrollBy({ left: amount, behavior: 'smooth' });
  };
  return (
    <div className="relative">
      <button
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-6 h-6 rounded-full bg-black/60 backdrop-blur text-white/90 hover:bg-black/80 hover:text-white transition-all"
        aria-label="Rolar para esquerda"
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>
      <div ref={ref} className={`flex gap-2.5 admin-scroll-area shrink-0 no-scrollbar snap-x pb-2 -mx-1 px-1 ${className}`}>
        {children}
      </div>
      <button
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-6 h-6 rounded-full bg-black/60 backdrop-blur text-white/90 hover:bg-black/80 hover:text-white transition-all"
        aria-label="Rolar para direita"
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

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
  const [servicesCarouselOpen, setServicesCarouselOpen] = useState(false);
  const [productsCarouselOpen, setProductsCarouselOpen] = useState(false);
  const [pendingChatSuggestions, setPendingChatSuggestions] = useState<Map<number, Set<string>>>(new Map());
  const [expandedProviders, setExpandedProviders] = useState<Set<string>>(new Set());
  const [dbSegments, setDbSegments] = useState<{ id: string; label: string; name: string; tags: string[]; image_url?: string | null }[]>([]);
  const [providerSegmentMap, setProviderSegmentMap] = useState<Map<string, string[]>>(new Map());
  const [dataLoaded, setDataLoaded] = useState(false);
  const [mobileRevealedSeg, setMobileRevealedSeg] = useState<string | null>(null);
  const [activeProvidersFilter, setActiveProvidersFilter] = useState<string[]>([]);
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
    
    // Clear existing filters when starting a new search
    setActiveSegments([]);
    setTypeFilter('all');

    if (nextQuery) setSearchQuery(nextQuery);
    setActiveProvidersFilter([]); // Clear provider filter on new AI route
    if (matchingSegments.length) setActiveSegments(Array.from(new Set(matchingSegments)));
    if (route.item_type === 'service') setTypeFilter('service');
    else if (route.item_type === 'product') setTypeFilter('product');
    else setTypeFilter('all');
    
    // Dispara a busca
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
    if (speech.listening && speech.transcript) {
      setSearchQuery(speech.transcript);
    }
  }, [speech.transcript, speech.listening]);

  useEffect(() => {
    if (!speech.listening && speech.transcript && searchQuery === speech.transcript) {
      // auto-execute on stop if the query matches the final transcript
      setTimeout(() => executeSearch(), 150);
    }
  }, [speech.listening]);
  // Pré-preenche e EXECUTA a busca via ?q= (vinda do Vini ou outras telas).
  // Também aplica ?type= (service/product/both) e ?segments=a,b,c quando presentes.
  useEffect(() => {
    const q = searchParams.get('q');
    const type = searchParams.get('type');
    const segs = searchParams.get('segments');
    const forceSupport = searchParams.get('force_support');
    
    if (!q) return;
    
    console.log('[Landing] Search params detected:', { q, type, segs, forceSupport });
    
    setSearchQuery(q);
    if (type === 'service' || type === 'product') setTypeFilter(type);
    else if (type === 'both' || type === 'all') setTypeFilter('all');
    
    if (segs) {
      const list = segs.split(',').map(s => s.trim()).filter(Boolean);
      if (list.length) {
        setTimeout(() => {
          setActiveSegments(prev => {
            const filtered = dbSegments
              .filter(seg => list.some(rs => normalizeText(seg.id).includes(normalizeText(rs)) || normalizeText(seg.name).includes(normalizeText(rs)) || normalizeText(seg.label).includes(normalizeText(rs))))
              .map(s => s.id);
            return filtered.length ? filtered : prev;
          });
        }, 300);
      }
    }
    
    // dispara a busca de fato
    setExecutedQuery(q);
    setSearchExecuted(true);
    setSearchVersion(v => v + 1);
    
    // Se forceSupport estiver presente, garantimos que o estado de "sucesso" anterior seja limpo
    if (forceSupport === '1') {
      setSupportSent(false);
      // Opcional: abrir o modal automaticamente se quiser
      // setShowSupportModal(true);
    }
  }, [searchParams, dbSegments]); // Adicionado searchParams e dbSegments como dependências para reagir a mudanças na URL

  const handleMic = () => {
    if (!speech.supported) {
      toast.error("O reconhecimento de voz não é suportado neste navegador.");
      return;
    }
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
    const q = searchQuery.trim();
    console.log('[Landing] executeSearch called for:', q);

    // Desmarca todos os filtros
    setActiveSegments([]);
    setActiveProvidersFilter([]);
    setTypeFilter('all');
    setAiRoute(null);

    if (!q) {
      setSearchExecuted(false);
      setExecutedQuery('');
      setSearchVersion(v => v + 1);
      return;
    }

    setExecutedQuery(q);
    setSupportSent(false); // Reseta o estado ao fazer nova busca
    setSearchExecuted(true);
    setSearchVersion(v => v + 1);
    setSelectedSuggestions(new Set());
    setShowSearchProducts(false);
  };

  const handleSmartSearch = () => {
    console.log('[Landing] handleSmartSearch called');
    executeSearch();
    const q = searchQuery.trim();
    if (!q) return;
    void refineWithVini(q, { openPanel: false, autoApply: false });
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
    setActiveProvidersFilter([]);
    searchRef.current?.focus();
  };

  const toggleProviderFilter = (name: string) => {
    setActiveProvidersFilter(prev => {
      const isAlreadyActive = prev.includes(name);
      const next = isAlreadyActive ? prev.filter(n => n !== name) : [...prev, name];
      
      // Se estamos ativando um filtro de prestador e ainda não houve busca, "forçamos" a visualização de resultados
      if (!isAlreadyActive && !searchExecuted) {
        setSearchExecuted(true);
        setExecutedQuery(''); // Mantém query vazia para mostrar tudo do prestador
      }
      
      return next;
    });
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

  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportExplanation, setSupportExplanation] = useState('');
  const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);
  const [supportSent, setSupportSent] = useState(false);
  const [isAiPanelExpanded, setIsAiPanelExpanded] = useState(false); // Adicionado se necessário, mas verificando se já existe logicamente


  const handleSendToCentral = async () => {
    if (isSubmittingSupport) return;
    setIsSubmittingSupport(true);
    
    try {
      const { error } = await supabase.from('support_requests').insert({
        user_id: user?.id || null,
        requested_item: executedQuery,
        query: executedQuery,
        context: 'Busca Sem Resultados',
        explanation: supportExplanation,
        details: supportExplanation,
        context_analysis: `Análise Vini: Busca por "${executedQuery}" não retornou itens em estoque no momento.`
      });

      if (error) throw error;

      setSupportSent(true);
      toast.success('Solicitação enviada para Central de Atendimento!');
      
      const summary = `Busca sem resultados para "${executedQuery}". Explicação: ${supportExplanation}`;
      const params = new URLSearchParams({ 
        query: executedQuery, 
        context: 'Busca Sem Resultados', 
        summary, 
        type: 'both' 
      });
      // Removido o redirecionamento para a demo de simulação
      // navigate(`/central-atendimento?${params.toString()}`);
    } catch (error: any) {
      console.error('Error sending support request:', error);
      toast.error('Erro ao enviar solicitação. Tente novamente.');
    } finally {
      setIsSubmittingSupport(false);
      setShowSupportModal(false);
    }
  };

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

      // Pré-aplicação direta vinda do Vini: filtra e executa busca sem abrir painel de IA
      try {
        const params = new URLSearchParams(window.location.search);
        const incomingQ = (params.get('q') || '').trim();
        const forceSupport = params.get('force_support') === '1';
        const incomingType = params.get('type') as 'service' | 'product' | 'both' | null;
        const incomingSegs = (params.get('segments') || '').split(',').map(s => s.trim()).filter(Boolean);
        
        if (incomingQ || forceSupport) {
          if (incomingQ) setSearchQuery(incomingQ);
          if (incomingType === 'service') setTypeFilter('service');
          else if (incomingType === 'product') setTypeFilter('product');
          else setTypeFilter('all');
          const incomingNorm = incomingSegs.map(normalizeText);
          if (incomingNorm.length && segs) {
            const matched = segs
              .filter((s: any) => {
                const segN = normalizeText(s.name);
                const tags = (s.suggested_tags || []).map((t: string) => normalizeText(t));
                return incomingNorm.some(n => segN === n || segN.includes(n) || n.includes(segN) || tags.some((t: string) => t.includes(n) || n.includes(t)));
              })
              .map((s: any) => s.name);
            if (matched.length) setActiveSegments(matched);
          }
          setInlineAiOpen(false);
          setExecutedQuery(incomingQ);
          setSearchExecuted(true);
          setSearchVersion(v => v + 1);
          if (forceSupport) setFallbackToAll(false);
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
    setActiveSegments((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  // Reatividade: qualquer mudança nos filtros (segmentos / tipo) re‑executa
  // a busca instantaneamente, mesmo sem clicar em "Buscar".
  useEffect(() => {
    if (!dataLoaded) return;
    const q = searchQuery.trim();
    if (q) {
      setExecutedQuery(q);
      setSearchExecuted(true);
      setSearchVersion((v) => v + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSegments, typeFilter, dataLoaded]);


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
      const matchProductSegment = (p: any): boolean => {
        const prodSegs: string[] = Array.isArray(p.segments) ? p.segments : [];
        if (prodSegs.length > 0) {
          // Fonte da verdade: segmentos vinculados ao próprio produto
          return prodSegs.some(s => activeNorm.includes(norm(s)));
        }
        // Fallback (legado): segmentos do prestador
        const provSegs = providerSegmentMap.get(p.provider) || [];
        return provSegs.some(s => activeNorm.includes(norm(s)));
      };
      const allSvcs = getAllServices().filter((r: any) => activeNorm.includes(norm(r.segment)));
      const allProds = getAllProducts().filter(matchProductSegment);
      rawResult = { products: allProds, services: allSvcs };
    } else {
      const result = semanticSearch(query);
      const norm = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
      const activeNorm = activeSegments.map(norm);
      const matchProductSegment = (p: any): boolean => {
        const prodSegs: string[] = Array.isArray(p.segments) ? p.segments : [];
        if (prodSegs.length > 0) return prodSegs.some(s => activeNorm.includes(norm(s)));
        const provSegs = providerSegmentMap.get(p.provider) || [];
        return provSegs.some(s => activeNorm.includes(norm(s)));
      };
      const filteredServices = activeSegments.length === 0
        ? result.services
        : result.services.filter(r => activeNorm.includes(norm(r.segment)));
      const filteredProducts = activeSegments.length === 0
        ? result.products
        : result.products.filter(matchProductSegment);
      rawResult = { ...result, services: filteredServices, products: filteredProducts };

      // Removido fallback automático para catálogo completo. 
      // Se não houver resultados, o estado 'noResults' será verdadeiro e mostrará o card da Central.
      // Entretanto, se houver filtro de prestador ativo, não devemos cair no fallback global aqui,
      // pois o filtro de prestador é aplicado depois.
      if ((rawResult.products?.length || 0) === 0 && (rawResult.services?.length || 0) === 0) {
        didFallback = false;
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

  const forceSupportParam = searchParams.get('force_support') === '1';

  const filteredResults = activeProvidersFilter.length > 0 
    ? searchResult.services.filter(s => activeProvidersFilter.includes(s.provider))
    : searchResult.services;
    
  const filteredProducts = activeProvidersFilter.length > 0
    ? searchResult.products.filter(p => activeProvidersFilter.includes(p.provider))
    : searchResult.products;

  const hasResults = searchExecuted && (filteredResults.length > 0 || filteredProducts.length > 0);
  
  // No results logic: only true if both filtered lists are empty AND we are not in fallback mode
  const noResults = searchExecuted && (executedQuery || activeSegments.length > 0 || activeProvidersFilter.length > 0) && !fallbackToAll && filteredResults.length === 0 && filteredProducts.length === 0;
  
  // Se force_support vier na URL (vinda do Vini), forçamos o estado noResults
  const isForceSupport = forceSupportParam || noResults;
  const providerEntries = (() => {
    const providerMap = new Map<string, { products: typeof filteredProducts; services: typeof filteredResults }>();
    filteredProducts.forEach(p => {
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
            setTypeFilter={(v) => setTypeFilter(v)}
            activeProviders={activeProvidersFilter}
            toggleProvider={toggleProviderFilter}
          >
            {(inlineAiOpen || searchExecuted) && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 pb-6">

                {/* Card "Sugestões da IA" removido a pedido. */}

                {/* Bloco "Prestadores próximos" removido — substituído pela seção "Prestadores / Fornecedores" no hero. */}

                {/* === MARKETPLACE: SERVIÇOS === */}
                {hasResults && !isForceSupport && filteredResults.length > 0 && (() => {
                  const useStack = filteredResults.length > 2 && !servicesCarouselOpen;
                  const renderCard = (result: any, idx: number, extraClass = '') => {
                    const seg = getSegmentVisual(result.segment);
                    const SIcon = getVisualIcon(result.name);
                    const inCart = isInServiceCart(result.id);
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
                        className={`rounded-2xl overflow-hidden text-left relative group w-full ${extraClass}`}
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
                          <div className="absolute top-1.5 left-1.5">
                            <FavoriteButton kind="service" id={result.id} name={result.name} image={seg?.image_url ?? null} provider={result.provider} />
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
                  };
                  return (
                    <div>
                      <div className="flex items-center justify-between mb-1.5 px-1">
                        <h3 className="text-[10px] font-semibold tracking-[0.14em] uppercase text-white/55 flex items-center gap-1.5">
                          <WrenchIcon className="w-3 h-3 text-violet-300/80" /> Serviços ({filteredResults.length})
                        </h3>
                        {filteredResults.length > 2 && (
                          <button
                            onClick={() => setServicesCarouselOpen(v => !v)}
                            className="flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] text-white/75 hover:bg-white/10"
                            title={servicesCarouselOpen ? 'Empilhar cards' : 'Abrir carrossel'}
                          >
                            {servicesCarouselOpen ? <Layers className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                            {servicesCarouselOpen ? 'Empilhar' : 'Abrir'}
                          </button>
                        )}
                      </div>
                      {useStack ? (
                        <button
                          onClick={() => setServicesCarouselOpen(true)}
                          className="relative block w-full h-[130px] mx-auto"
                          aria-label="Abrir carrossel de serviços"
                        >
                          {filteredResults.slice(0, 3).map((r, i) => (
                            <div
                              key={r.id}
                              className="absolute left-1/2 top-0 w-[120px] rounded-2xl shadow-2xl"
                              style={{
                                transform: `translateX(calc(-50% + ${(i - 1) * 12}px)) rotate(${(i - 1) * 3}deg) scale(${1 - i * 0.035})`,
                                zIndex: 10 - i,
                                opacity: 1 - i * 0.12,
                                filter: i > 0 ? `brightness(${1 - i * 0.08})` : undefined,
                              }}
                            >
                              {renderCard(r, i)}
                            </div>
                          ))}
                          <span className="absolute bottom-0 right-2 z-20 flex items-center gap-1 rounded-full bg-violet-600/90 px-2.5 py-1 text-[10px] font-bold text-white shadow-lg backdrop-blur-sm">
                            <ChevronRight className="w-3 h-3" /> {filteredResults.length} itens
                          </span>
                        </button>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          {filteredResults.map((r, i) => renderCard(r, i))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* === MARKETPLACE: PRODUTOS === */}
                {hasResults && !isForceSupport && filteredProducts.length > 0 && (() => {
                  const useStack = filteredProducts.length > 2 && !productsCarouselOpen;
                  const renderCard = (product: any, idx: number) => {
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
                        className="rounded-2xl overflow-hidden text-left relative group w-full"
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
                          <div className="absolute bottom-1.5 right-1.5">
                            <FavoriteButton kind="product" id={product.id} name={product.name} image={product.image_url ?? null} provider={(product as any).provider} />
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
                  };
                  return (
                    <div>
                      <div className="flex items-center justify-between mb-1.5 px-1">
                        <h3 className="text-[10px] font-semibold tracking-[0.14em] uppercase text-white/55 flex items-center gap-1.5">
                          <ShoppingBag className="w-3 h-3 text-emerald-300/80" /> Produtos ({filteredProducts.length})
                        </h3>
                        {filteredProducts.length > 2 && (
                          <button
                            onClick={() => setProductsCarouselOpen(v => !v)}
                            className="flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] text-white/75 hover:bg-white/10"
                            title={productsCarouselOpen ? 'Empilhar cards' : 'Abrir carrossel'}
                          >
                            {productsCarouselOpen ? <Layers className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                            {productsCarouselOpen ? 'Empilhar' : 'Abrir'}
                          </button>
                        )}
                      </div>
                      {useStack ? (
                        <button
                          onClick={() => setProductsCarouselOpen(true)}
                          className="relative block w-full h-[130px] mx-auto"
                          aria-label="Abrir carrossel de produtos"
                        >
                          {filteredProducts.slice(0, 3).map((p, i) => (
                            <div
                              key={p.id}
                              className="absolute left-1/2 top-0 w-[120px] rounded-2xl shadow-2xl"
                              style={{
                                transform: `translateX(calc(-50% + ${(i - 1) * 12}px)) rotate(${(i - 1) * 3}deg) scale(${1 - i * 0.035})`,
                                zIndex: 10 - i,
                                opacity: 1 - i * 0.12,
                                filter: i > 0 ? `brightness(${1 - i * 0.08})` : undefined,
                              }}
                            >
                              {renderCard(p, i)}
                            </div>
                          ))}
                          <span className="absolute bottom-0 right-2 z-20 flex items-center gap-1 rounded-full bg-emerald-600/90 px-2.5 py-1 text-[10px] font-bold text-white shadow-lg backdrop-blur-sm">
                            <ChevronRight className="w-3 h-3" /> {filteredProducts.length} itens
                          </span>
                        </button>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          {filteredProducts.map((p, i) => renderCard(p, i))}
                        </div>
                      )}
                    </div>
                  );
                })()}
                {isForceSupport && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                    <Card className="border-2 border-violet-500/30 bg-violet-950/20 backdrop-blur-xl shadow-2xl overflow-hidden rounded-3xl">
                      <CardContent className="p-6 text-center space-y-4">
                        <div className="w-16 h-16 bg-violet-500/20 rounded-full flex items-center justify-center mx-auto mb-2 border border-violet-500/30">
                          <Headphones className="w-8 h-8 text-violet-300" />
                        </div>
                        <h3 className="text-xl font-bold text-white tracking-tight">Acionar Central de Atendimento</h3>
                        <p className="text-sm text-white/70 max-w-xs mx-auto">
                          Não encontramos "{executedQuery}" no estoque atual. Mas não se preocupe! Nossa central buscará em todo o ecossistema para você em até 24h.
                        </p>
                        <Button 
                          onClick={() => !supportSent && setShowSupportModal(true)}
                          disabled={supportSent}
                          className={`w-full font-bold py-6 rounded-2xl shadow-[0_4px_15px_rgba(139,92,246,0.3)] transition-all ${
                            supportSent 
                            ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" 
                            : "bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white"
                          }`}
                        >
                          {supportSent ? (
                            <span className="text-[10px] sm:text-xs">Solicitação enviada !! - Em breve receberá um retorno, obrigado !!</span>
                          ) : (
                            <>
                              <Headphones className="w-5 h-5 mr-2" />
                              Enviar para Central
                            </>
                          )}
                        </Button>

                        <AnimatePresence>
                          {showSupportModal && (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
                              >
                                <div className="p-6 space-y-4">
                                  <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold text-white">Nova Solicitação</h3>
                                    <button onClick={() => setShowSupportModal(false)} className="text-white/40 hover:text-white">
                                      <X className="w-6 h-6" />
                                    </button>
                                  </div>
                                  
                                  <div className="space-y-3">
                                    <div className="space-y-1">
                                      <label className="text-xs font-medium text-white/50 uppercase tracking-wider">Contexto (Análise Vini)</label>
                                      <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white/80 italic">
                                        Busca por "{executedQuery}" não retornou itens em estoque no momento.
                                      </div>
                                    </div>
                                    
                                    <div className="space-y-1">
                                      <label className="text-xs font-medium text-white/50 uppercase tracking-wider">Complemento / Explicação</label>
                                      <Textarea 
                                        placeholder="Diga-nos mais detalhes do que você precisa..."
                                        value={supportExplanation}
                                        onChange={(e) => setSupportExplanation(e.target.value)}
                                        className="min-h-[100px] bg-white/5 border-white/10 text-white focus-visible:ring-violet-500"
                                      />
                                    </div>
                                  </div>
                                  
                                  <Button 
                                    onClick={handleSendToCentral}
                                    disabled={isSubmittingSupport}
                                    className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-6 rounded-2xl"
                                  >
                                    {isSubmittingSupport ? (
                                      <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                      <>Confirmar e Enviar</>
                                    )}
                                  </Button>
                                </div>
                              </motion.div>
                            </div>
                          )}
                        </AnimatePresence>
                        <button 
                          onClick={() => handleRefineSearch()}
                          className="text-xs text-white/50 hover:text-white underline underline-offset-4"
                        >
                          Tentar outra pesquisa
                        </button>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Card "Sugestões da IA" removido a pedido. */}
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
                        const providerMap = new Map<string, { products: typeof filteredProducts; services: typeof filteredResults }>();
                        filteredProducts.forEach(p => {
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
                  {false && hasResults && executedQuery && (() => {
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

                  {/* Card "Sugestões da IA" (no-results) removido a pedido. */}
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

            <div className="flex-1 admin-scroll-area p-4 space-y-3">
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
        <div className="container mx-auto max-w-2xl grid grid-cols-5 gap-1">
          {[
            { label: 'Home', icon: Home, onClick: () => navigate('/') },
            { label: 'Urgência', icon: Zap, onClick: () => navigate('/radar-urgencia') },
            { label: 'Favoritos', icon: Heart, onClick: () => setFavoritesOpen(true) },
            { label: 'Perfil', icon: Users, onClick: () => navigate(user ? '/carteira' : '/auth') },
            { label: 'Indicação', icon: Sparkles, onClick: () => navigate('/convite/INDIQUE') },
          ].map((btn) => (
            <button
              key={btn.label}
              type="button"
              onClick={btn.onClick}
              className="relative flex flex-col items-center justify-center gap-0.5 rounded-lg py-1 px-1 bg-white/[0.05] hover:bg-white/[0.12] border border-white/10 hover:border-primary/40 transition-all text-foreground/85 hover:text-primary"
              aria-label={btn.label}
            >
              <btn.icon
                className={`w-4 h-4 ${btn.label === 'Favoritos' && favoritesCount > 0 ? 'text-rose-400 fill-rose-400 drop-shadow-[0_0_6px_rgba(244,63,94,0.75)]' : ''}`}
                strokeWidth={1.6}
              />
              <span className="text-[9px] font-medium leading-none">{btn.label}</span>
              {(btn as any).badge ? (
                <span className="absolute -top-1 -right-1 min-w-[14px] h-[14px] px-1 rounded-full bg-rose-500 text-[8px] font-bold text-white flex items-center justify-center">
                  {(btn as any).badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </footer>
      <FavoritesModal open={favoritesOpen} onOpenChange={setFavoritesOpen} />
      </main>
    </div>
  );
};

export default Landing;
