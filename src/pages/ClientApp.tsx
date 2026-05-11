import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { plans, clientProducts, clientServices, mockUser, checkEligibility, meiProfessionals, getContextualProducts, type ServiceItem, type ProductItem } from '@/data/mockData';
import {
  ArrowLeft, Star, ShoppingBag, Wrench, CreditCard, Zap, CheckCircle2, Lock,
  Clock, ArrowUpCircle, Coins, ShieldCheck, Package, ChevronRight, X, Search,
  Sparkles, Calendar, MapPin, ShoppingCart, TrendingDown, Heart, Plus, Minus, Brain, LifeBuoy, Megaphone, Mic, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

/* ─── SEGMENT DEFINITIONS ─── */
const segments = [
  { id: 'manutencao', label: 'Manutenção & Reparos', emoji: '🔧', category: 'Manutenção & Reparos', color: 'bg-primary/10 border-primary/20', desc: 'Eletricista, encanador, pintor, montagem' },
  { id: 'saude', label: 'Saúde', emoji: '🩺', category: 'Saúde', color: 'bg-red-500/10 border-red-500/20', desc: 'Dentista, médico, laboratório, medicina do trabalho' },
  { id: 'bem_estar', label: 'Bem-estar & Saúde', emoji: '💪', category: 'Bem-estar & Saúde', color: 'bg-green-500/10 border-green-500/20', desc: 'Personal, nutricionista, yoga, massagem' },
  { id: 'beleza', label: 'Estética & Beleza', emoji: '✨', category: 'Estética & Beleza', color: 'bg-pink-500/10 border-pink-500/20', desc: 'Cabelo, unhas, estética facial, depilação' },
  { id: 'lar', label: 'Lar & Ambiente', emoji: '🏠', category: 'Lar & Ambiente', color: 'bg-emerald-500/10 border-emerald-500/20', desc: 'Limpeza, jardinagem, organização, piscina' },
  { id: 'auto', label: 'Automotivo', emoji: '🚗', category: 'Automotivo', color: 'bg-blue-500/10 border-blue-500/20', desc: 'Lavagem, mecânica, funilaria, polimento' },
  { id: 'digital', label: 'Digital & Criativo', emoji: '🎨', category: 'Digital & Criativo', color: 'bg-purple-500/10 border-purple-500/20', desc: 'Design, fotografia, marketing, vídeo' },
  { id: 'tech', label: 'Tecnologia & Informática', emoji: '💻', category: 'Tecnologia & Informática', color: 'bg-cyan-500/10 border-cyan-500/20', desc: 'Computador, celular, CFTV, redes' },
  { id: 'educacao', label: 'Educação & Cursos', emoji: '🎓', category: 'Educação & Cursos', color: 'bg-orange-500/10 border-orange-500/20', desc: 'Idiomas, música, ENEM, programação' },
  { id: 'pet', label: 'Pet & Animais', emoji: '🐕', category: 'Pet & Animais', color: 'bg-lime-500/10 border-lime-500/20', desc: 'Banho, tosa, veterinário, adestramento' },
  { id: 'eventos', label: 'Eventos & Festas', emoji: '🎉', category: 'Eventos & Festas', color: 'bg-fuchsia-500/10 border-fuchsia-500/20', desc: 'Buffet, DJ, decoração, fotografia' },
  { id: 'musica', label: 'Música', emoji: '🎵', category: 'Música', color: 'bg-rose-500/10 border-rose-500/20', desc: 'Violão, guitarra, piano, canto, produção' },
  { id: 'natureza', label: 'Natureza & Vida Natural', emoji: '🌿', category: 'Natureza & Vida Natural', color: 'bg-green-700/10 border-green-700/20', desc: 'Jardinagem, fitoterapia, comida natural, horta' },
];

/* ─── AI SUGGESTIONS ENGINE (simulated) ─── */
function getAiSuggestions(cart: CartItem[], userCredits: number, plan: string): string[] {
  const suggestions: string[] = [];
  const hasElectric = cart.some(c => c.service?.category === 'Manutenção & Reparos');
  const hasBeauty = cart.some(c => c.service?.category === 'Estética & Beleza');

  if (hasElectric && !cart.some(c => c.products.some(p => p.id === 5))) {
    suggestions.push('🔒 Clientes que contrataram eletricista também instalaram câmeras de segurança — 20% mais baratas com seu plano!');
  }
  if (hasBeauty) {
    suggestions.push('💆 Combo Beleza: agende manicure + estética facial e ganhe 15 créditos de bônus!');
  }
  if (cart.length >= 2) {
    suggestions.push('🎯 Multi-serviço detectado! Agende todos no mesmo dia para economizar taxa de deslocamento.');
  }
  if (userCredits > 150) {
    suggestions.push('💰 Você tem créditos de sobra — aproveite para agendar uma limpeza residencial com desconto!');
  }
  if (plan === 'bronze') {
    suggestions.push('⬆️ Com o plano Prata você teria 10% de desconto em todos os produtos e mais créditos mensais!');
  }
  if (cart.length === 0) {
    suggestions.push('🤖 Baseado no seu perfil, clientes como você mais utilizam: Eletricista, Limpeza e Personal Trainer.');
  }
  return suggestions.slice(0, 3);
}

interface CartItem {
  service: ServiceItem | null;
  products: ProductItem[];
  contextualProducts: ProductItem[];
  allProviderProducts: ProductItem[];
  showAllProducts: boolean;
  scheduledDate?: string;
  scheduledTime?: string;
}

const ClientApp = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const isFora = searchParams.get('fora') === '1';
  const isUrgencia = searchParams.get('urgencia') === '1';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<number[]>([1, 20, 25]);
  const [showCart, setShowCart] = useState(false);
  const [expandedSegment, setExpandedSegment] = useState<string | null>(null);
  
  const { supported, listening, transcript, start, stop } = useSpeechRecognition();

  // Handle voice transcript auto-submit
  useEffect(() => {
    if (listening) {
      // Clear search query and segments when starting a new transcription
      setSearchQuery('');
      setSelectedSegments([]);
      setAiInsight(null);
    }
  }, [listening]);

  useEffect(() => {
    if (transcript && transcript.trim()) {
      setSearchQuery(transcript);
    }
  }, [transcript]);

  // Handle when voice recognition stops
  useEffect(() => {
    if (!listening && transcript && transcript.trim()) {
      const q = transcript.toLowerCase().trim();
      console.log('[Search] Voice search finished:', q);
      setSearchQuery(q);
      
      // Aciona a lógica de inteligência também para voz
      import('@/data/searchData').then(({ naturalLanguageMap, segments: segmentData }) => {
        const match = naturalLanguageMap.find(m => 
          m.triggers.some(t => q.includes(t.toLowerCase()))
        );

        if (match) {
          setAiInsight(match.aiFollowUp || null);
          const matchedSegmentIds = match.segments.map(sName => {
            const seg = segmentData.find(sd => sd.id === sName || sd.label.toLowerCase() === sName.toLowerCase());
            return seg?.id;
          }).filter(Boolean) as string[];

          if (matchedSegmentIds.length > 0) {
            // Ao iniciar nova busca por voz, usamos apenas os segmentos identificados pela IA
            setSelectedSegments(matchedSegmentIds);
          }
        } else {
          setAiInsight(null);
          setSelectedSegments([]); // Se não há match na IA, limpa filtros para focar no texto
        }
      });

      setTriggerSearch(prev => prev + 1);
    }
  }, [listening, transcript]);

  const selectedPlan = mockUser.plan;
  const currentPlan = plans.find(p => p.id === selectedPlan);
  const discount = currentPlan?.discount || 0;
  const user = mockUser;

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'services') setExpandedSegment('manutencao');
  }, [searchParams]);

  // Sync URL ?q= when it changes
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null && q !== searchQuery) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  // Filter services by search & segments. If search/segment yields 0 results,
  // fall back to the full inventory so the user can still browse.
  const [noResultsFallback, setNoResultsFallback] = useState(false);
  const [triggerSearch, setTriggerSearch] = useState(0);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  const filteredServices = useMemo(() => {
    if (searchParams.get('force_support') === '1') {
      setNoResultsFallback(true);
      return [];
    }

    const q = searchQuery.toLowerCase().trim();
    console.log('[Search] Filtering services with query:', q, 'and segments:', selectedSegments);
    
    
    // Filtros por segmentos (se houver algum selecionado)
    const selectedCats = selectedSegments.map(id => segments.find(s => s.id === id)?.category).filter(Boolean);
    console.log('[Search] Selected Categories:', selectedCats);
    

    // Se não houver busca nem segmentos, retorna tudo
    if (!q && selectedSegments.length === 0) {
      setNoResultsFallback(false);
      return clientServices;
    }

    // Aplica o filtro de texto
    let svcs = clientServices;
    if (q) {
      svcs = svcs.filter(s => {
        const nameMatch = s.name.toLowerCase().includes(q);
        const catMatch = s.category.toLowerCase().includes(q);
        const provMatch = s.provider.toLowerCase().includes(q);
        
        // Busca aprimorada: verificar se o termo de busca está em algum lugar dos metadados
        // Se nameMatch, catMatch ou provMatch forem verdadeiros, já retorna true
        if (nameMatch || catMatch || provMatch) return true;
        
        // Caso contrário, verificamos tags ou descrição (se existissem)
        // Aqui simulamos uma busca mais "inteligente" verificando palavras parciais
        const words = q.split(' ');
        if (words.length > 1) {
          return words.every(word => 
            s.name.toLowerCase().includes(word) || 
            s.category.toLowerCase().includes(word)
          );
        }
        
        return false;
      });
    }

    // Aplica o filtro de segmentos sobre o resultado da busca
    if (selectedSegments.length > 0) {
      svcs = svcs.filter(s => {
        const segment = segments.find(seg => seg.category === s.category);
        return segment && selectedSegments.includes(segment.id);
      });
    }

    // Se após os filtros não sobrar nada
    if (svcs.length === 0) {
      // Verifica se o termo de busca (se houver) está em produtos
      const productMatch = q ? clientProducts.some(p => 
        p.name.toLowerCase().includes(q) || 
        p.category.toLowerCase().includes(q)
      ) : false;

      if (!productMatch) {
        setNoResultsFallback(true);
        return [];
      }
    }

    setNoResultsFallback(false);
    return svcs;
  }, [searchQuery, selectedSegments, searchParams, triggerSearch]);

  // Group by segment
  const groupedServices = useMemo(() => {
    const groups: Record<string, ServiceItem[]> = {};
    segments.forEach(seg => { groups[seg.id] = []; });
    filteredServices.forEach(svc => {
      const seg = segments.find(s => s.category === svc.category);
      if (seg) groups[seg.id].push(svc);
    });
    return groups;
  }, [filteredServices]);

  // Active segments (with results)
  const activeSegments = useMemo(() =>
    segments.filter(s => groupedServices[s.id]?.length > 0)
  , [groupedServices]);

  // Cart calculations
  const cartTotals = useMemo(() => {
    let totalCredits = 0;
    let totalProducts = 0;
    let totalDiscount = 0;
    cart.forEach(item => {
      if (item.service) totalCredits += item.service.creditCost;
      item.products.forEach(p => {
        totalProducts += p.price;
        totalDiscount += p.price * (discount / 100);
      });
    });
    return { totalCredits, totalProducts, totalDiscount, grandTotal: totalProducts - totalDiscount, serviceCount: cart.filter(c => c.service).length };
  }, [cart, discount]);

  const aiSuggestions = useMemo(() => getAiSuggestions(cart, user.credits, user.plan), [cart, user.credits, user.plan]);

  const addServiceToCart = (service: ServiceItem) => {
    if (cart.some(c => c.service?.id === service.id)) return;
    
    // Find relevant MEI providers for this service
    const relevantMeis = meiProfessionals.filter(mei => mei.segment === service.category);
    const allProducts = relevantMeis.flatMap(mei => [...mei.ownProducts, ...mei.dropshippingProducts]);
    
    // Filter products contextually by service theme
    const contextual = getContextualProducts(service, allProducts);
    
    // Also get relatedProductIds from original data as fallback
    const relatedProds = clientProducts.filter(p => service.relatedProductIds.includes(p.id));
    
    setCart(prev => [...prev, { 
      service, 
      products: relatedProds,
      contextualProducts: contextual,
      allProviderProducts: allProducts,
      showAllProducts: false,
    }]);
  };

  const removeFromCart = (index: number) => setCart(prev => prev.filter((_, i) => i !== index));

  const toggleShowAllProducts = (index: number) => {
    setCart(prev => prev.map((item, i) => 
      i === index ? { ...item, showAllProducts: !item.showAllProducts } : item
    ));
  };

  const updateSchedule = (index: number, date: string, time: string) => {
    setCart(prev => prev.map((item, i) =>
      i === index ? { ...item, scheduledDate: date, scheduledTime: time } : item
    ));
  };

  const addProductToCart = (product: ProductItem) => {
    setCart(prev => {
      if (prev.length > 0) {
        const updated = [...prev];
        const last = { ...updated[updated.length - 1] };
        if (!last.products.some(p => p.id === product.id)) {
          last.products = [...last.products, product];
          updated[updated.length - 1] = last;
        }
        return updated;
      }
      return [{ service: null, products: [product], contextualProducts: [], allProviderProducts: [], showAllProducts: false }];
    });
  };

  const addProductToCartItem = (cartIndex: number, product: ProductItem) => {
    setCart(prev => prev.map((item, i) => {
      if (i !== cartIndex) return item;
      if (item.products.some(p => p.id === product.id)) return item;
      return { ...item, products: [...item.products, product] };
    }));
  };

  const removeProductFromCartItem = (cartIndex: number, productId: number) => {
    setCart(prev => prev.map((item, i) => {
      if (i !== cartIndex) return item;
      return { ...item, products: item.products.filter(p => p.id !== productId) };
    }));
  };

  const toggleSegment = useCallback((id: string) => {
    setSelectedSegments(prev => {
      const isSelected = prev.includes(id);
      const newSegments = isSelected ? prev.filter(s => s !== id) : [...prev, id];
      
      // Quando seleciona um segmento manualmente, limpamos o insight da IA para não confundir
      if (!isSelected) setAiInsight(null);
      
      return newSegments;
    });
  }, []);

  const toggleFavorite = (id: number) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const isInCart = (serviceId: number) => cart.some(c => c.service?.id === serviceId);

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto relative pb-32">
      <div>
      <div className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="flex items-center justify-between p-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}><ArrowLeft className="w-5 h-5" /></Button>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <span className="font-display font-bold text-foreground">Vitrinei</span>
          </div>
          <div className="flex items-center gap-2">
            {currentPlan && <Badge variant="secondary" className="text-[10px]">{currentPlan.id === 'bronze' ? '🥉' : currentPlan.id === 'prata' ? '🥈' : '🥇'} {currentPlan.name}</Badge>}
            <button className="relative" onClick={() => setShowCart(!showCart)}>
              <ShoppingCart className="w-5 h-5 text-foreground" />
              {cart.length > 0 && <div className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full text-[9px] text-white flex items-center justify-center font-bold">{cart.length}</div>}
            </button>
          </div>
        </div>

        {/* Credits */}
        <div className="px-3 pb-2">
          <div className="flex items-center justify-between text-[10px] mb-0.5">
            <span className="text-muted-foreground flex items-center gap-1"><Coins className="w-3 h-3" /> Créditos</span>
            <span className="font-semibold text-foreground">{user.credits} / {currentPlan?.monthlyCredits || 0}</span>
          </div>
          <Progress value={(user.credits / (currentPlan?.maxAccumulation || 100)) * 100} className="h-1.5" />
        </div>

        {/* Search */}
        <div className="px-3 pb-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setTriggerSearch(prev => prev + 1); // Força re-render imediato da busca
                }}
                placeholder="Buscar serviços, produtos, categorias..."
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-muted text-xs border-0 outline-none text-foreground placeholder:text-muted-foreground"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
            
            <div className="flex gap-1">
              <button
                type="button"
                className={cn(
                  "flex items-center justify-center rounded-xl w-9 h-9 shrink-0 transition-all border",
                  listening 
                    ? "bg-destructive text-white border-destructive animate-pulse" 
                    : "bg-secondary text-secondary-foreground border-transparent"
                )}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (listening) {
                    console.log("[Search] Manual voice stop");
                    stop();
                  } else {
                    console.log("[Search] Manual voice start");
                    start();
                  }
                }}
              >
                {listening ? <X className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              
              <button
                type="button"
                className="flex items-center justify-center rounded-xl w-9 h-9 shrink-0 bg-primary text-primary-foreground transition-all border border-transparent active:scale-95 shadow-sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const q = searchQuery.trim().toLowerCase();
                  console.log("[Search] Manual search trigger:", q);
                  
                  if (q) {
                    toast.success(`Buscando por: ${searchQuery}`);
                    
                    // Lógica de Inteligência do Vini
                    import('@/data/searchData').then(({ naturalLanguageMap, segments: segmentData }) => {
                      const match = naturalLanguageMap.find(m => 
                        m.triggers.some(t => q.includes(t.toLowerCase()))
                      );

                      if (match) {
                        setAiInsight(match.aiFollowUp || null);
                        // Filtra os segmentos baseados na inteligência
                        const matchedSegmentIds = match.segments.map(sName => {
                          const seg = segmentData.find(sd => sd.id === sName || sd.label.toLowerCase() === sName.toLowerCase());
                          return seg?.id;
                        }).filter(Boolean) as string[];

                        if (matchedSegmentIds.length > 0) {
                          // Manter os filtros atuais do usuário e ADICIONAR os novos da inteligência (ou vice-versa)
                          // Conforme solicitado, a barra de pesquisa deve complementar os filtros.
                          setSelectedSegments(matchedSegmentIds);
                        }
                        } else {
                          // Se não houver match direto, limpamos os filtros para priorizar o termo de texto
                          setSelectedSegments([]);
                          setAiInsight(null);
                        }
                    });

                    setTriggerSearch(prev => prev + 1);
                    const firstResult = document.querySelector('[data-search-results]');
                    if (firstResult) {
                      firstResult.scrollIntoView({ behavior: 'smooth' });
                    }
                  } else {
                    toast.info("Digite algo para buscar");
                    // Não limpa filtros se buscar vazio, apenas remove o termo de busca
                    setAiInsight(null);
                    setTriggerSearch(prev => prev + 1);
                  }
                }}
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Segment Pills */}
        <div className="px-3 pb-2 flex gap-1.5 overflow-x-auto">
          {segments.map(seg => (
            <button key={seg.id} onClick={() => toggleSegment(seg.id)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium whitespace-nowrap transition-all border ${
                selectedSegments.includes(seg.id) ? 'bg-primary text-primary-foreground border-primary' : `${seg.color} text-foreground`
              }`}>
              <span>{seg.emoji}</span>{seg.label}
              {groupedServices[seg.id]?.length > 0 && <span className="text-[8px] opacity-70">({groupedServices[seg.id].length})</span>}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Quick Access Cards (Urgência / Home / Agenda) ─── */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } } }}
        className={cn("px-3 pt-3 grid grid-cols-3 gap-2 sm:gap-3", noResultsFallback && "hidden")}
      >
        {[
          { key: 'urgencia', icon: '⚡', label: 'Urgência', desc: isUrgencia ? 'Radar acionado' : 'Atendimento imediato', tone: isUrgencia ? 'from-destructive/40 to-orange-500/30 border-destructive ring-2 ring-destructive/40 animate-pulse' : 'from-destructive/15 to-orange-500/10 border-destructive/30', onClick: () => navigate(isUrgencia ? '/client' : '/jornada-cliente?urgencia=1'), badge: isUrgencia ? '● ATIVO' : null },
          { key: 'home', icon: '🏠', label: 'Home', desc: 'Voltar ao início', tone: 'from-primary/15 to-accent/10 border-primary/30', onClick: () => navigate('/'), badge: null },
          { key: 'agenda', icon: '📅', label: 'Agenda', desc: 'Ver agendamentos', tone: 'from-emerald-500/15 to-cyan-500/10 border-emerald-500/30', onClick: () => navigate('/jornada-cliente?tab=agenda'), badge: cart.filter(c => c.scheduledDate).length > 0 ? String(cart.filter(c => c.scheduledDate).length) : null },
        ].map((card) => (
          <motion.button
            key={card.key}
            type="button"
            onClick={card.onClick}
            variants={{ hidden: { opacity: 0, y: 14, scale: 0.94 }, visible: { opacity: 1, y: 0, scale: 1 } }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 320, damping: 22 }}
            className={`relative rounded-2xl p-2.5 text-left bg-gradient-to-br ${card.tone} backdrop-blur-xl border shadow-sm hover:shadow-md transition-shadow`}
          >
            <div className="flex items-start justify-between">
              <span className="text-lg">{card.icon}</span>
              {card.badge && (
                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-foreground/80 text-background">
                  {card.badge}
                </span>
              )}
            </div>
            <p className="mt-1 text-[11px] font-bold text-foreground">{card.label}</p>
            <p className="text-[9px] text-muted-foreground leading-tight">{card.desc}</p>
          </motion.button>
        ))}
      </motion.div>

      {/* Fallback notice when search yielded 0 results - Central de Atendimento Card */}
      {noResultsFallback && (
        <div className="px-3 pt-4 space-y-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-[2rem] border border-primary/30 bg-primary/5 p-6 text-center shadow-xl backdrop-blur-md relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Sparkles className="w-12 h-12 text-primary" />
            </div>
            
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/20">
              <LifeBuoy className="w-8 h-8 text-primary" />
            </div>
            
            <h3 className="text-lg font-bold text-foreground mb-2">Item não encontrado</h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Não conseguimos localizar <span className="text-primary font-semibold">"{searchQuery || "o item solicitado"}"</span> em nosso estoque local agora.
              Deseja que nossa Central de Atendimento procure para você?
            </p>

            <div className="space-y-3">
              <Button 
                className="w-full rounded-full py-6 font-bold text-sm shadow-lg shadow-primary/20 group"
                onClick={async () => {
                  const { error } = await supabase.from('support_requests').insert({
                    requested_item: searchQuery,
                    details: 'Solicitação automática via Busca (Item não encontrado)',
                    status: 'pending',
                    user_id: null,
                    context_analyzed: { 
                      source: 'ClientApp_Search',
                      query: searchQuery,
                      timestamp: new Date().toISOString()
                    }
                  });

                  if (error) {
                    toast.error('Erro ao enviar para central');
                  } else {
                    toast.success('Solicitação enviada para Central de Atendimento!');
                    setNoResultsFallback(false);
                    setSearchQuery('');
                  }
                }}
              >
                <Megaphone className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
                ENVIAR PARA CENTRAL
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full text-xs text-muted-foreground hover:text-primary transition-colors"
                onClick={() => {
                  setSearchQuery('');
                  setNoResultsFallback(false);
                }}
              >
                Tentar nova pesquisa
              </Button>
            </div>
            
            <p className="mt-6 text-[10px] text-muted-foreground/60 uppercase tracking-widest font-bold">
              ADMIN DRM / CRM INTEGRADO
            </p>
          </motion.div>
        </div>
      )}
      <AnimatePresence>
        {showCart && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/40" onClick={() => setShowCart(false)}>
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25 }}
              className="absolute right-0 top-0 h-full w-[85%] max-w-sm bg-card shadow-2xl overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-bold text-foreground flex items-center gap-2"><ShoppingCart className="w-4 h-4 text-primary" /> Meu Carrinho</h3>
                <button onClick={() => setShowCart(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>
              <div className="p-4 space-y-3">
                {cart.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Carrinho vazio — selecione serviços e produtos</p>}
                {cart.map((item, idx) => {
                  const displayProducts = item.showAllProducts ? item.allProviderProducts : item.contextualProducts;
                  return (
                    <div key={idx} className="bg-muted/50 rounded-xl p-3 space-y-2">
                      {item.service && (
                        <>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{item.service.icon}</span>
                              <div>
                                <p className="text-xs font-semibold text-foreground">{item.service.name}</p>
                                <p className="text-[10px] text-primary">{item.service.creditCost} créditos • {item.service.provider}</p>
                              </div>
                            </div>
                            <button onClick={() => removeFromCart(idx)}><X className="w-4 h-4 text-muted-foreground" /></button>
                          </div>

                          {/* Per-service scheduling */}
                          <div className="ml-6 p-2 bg-card rounded-lg border border-border space-y-1.5">
                            <p className="text-[9px] font-bold text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> Agendar este serviço</p>
                            <div className="flex gap-1.5">
                              <input type="date" value={item.scheduledDate || ''} onChange={e => updateSchedule(idx, e.target.value, item.scheduledTime || '')}
                                className="flex-1 text-[10px] px-2 py-1 rounded-md bg-muted border border-border text-foreground" />
                              <input type="time" value={item.scheduledTime || ''} onChange={e => updateSchedule(idx, item.scheduledDate || '', e.target.value)}
                                className="w-20 text-[10px] px-2 py-1 rounded-md bg-muted border border-border text-foreground" />
                            </div>
                            {item.scheduledDate && item.scheduledTime && (
                              <p className="text-[9px] text-primary">✅ Agendado</p>
                            )}
                          </div>
                        </>
                      )}

                      {/* Products already in cart */}
                      {item.products.length > 0 && (
                        <div className="space-y-1 ml-6">
                          <p className="text-[9px] font-bold text-muted-foreground">📦 Produtos selecionados:</p>
                          {item.products.map(p => (
                            <div key={p.id} className="flex items-center justify-between text-[10px] bg-card/80 rounded-lg px-2 py-1">
                              <span className="text-muted-foreground">{p.image} {p.name}</span>
                              <div className="flex items-center gap-1">
                                <span className="font-medium">R$ {(p.price * (1 - discount / 100)).toFixed(2)}</span>
                                <button onClick={() => removeProductFromCartItem(idx, p.id)}><X className="w-3 h-3 text-muted-foreground hover:text-destructive" /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Contextual products suggestion */}
                      {item.service && displayProducts.length > 0 && (
                        <div className="ml-6 space-y-1">
                          <p className="text-[9px] font-bold text-muted-foreground">
                            {item.showAllProducts ? '🛒 Todos os produtos do profissional:' : '🎯 Produtos relacionados ao serviço:'}
                          </p>
                          <div className="max-h-32 overflow-y-auto space-y-1">
                            {displayProducts.filter(p => !item.products.some(cp => cp.id === p.id)).slice(0, item.showAllProducts ? 20 : 6).map(p => (
                              <div key={p.id} className="flex items-center justify-between text-[10px] bg-accent/10 rounded-lg px-2 py-1">
                                <span className="text-muted-foreground truncate flex-1">{p.image} {p.name}</span>
                                <div className="flex items-center gap-1 shrink-0">
                                  <Badge variant="outline" className="text-[7px] h-3.5 px-1">{p.supplier?.includes('Drop') ? '🌍 Drop' : '📦 Local'}</Badge>
                                  <span className="font-medium text-foreground">R$ {p.price.toFixed(2)}</span>
                                  <button onClick={() => addProductToCartItem(idx, p)} className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20">
                                    <Plus className="w-2.5 h-2.5 text-primary" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                          <button onClick={() => toggleShowAllProducts(idx)} className="text-[9px] text-primary font-medium hover:underline">
                            {item.showAllProducts ? '← Voltar aos relacionados' : `Ver mais produtos (${item.allProviderProducts.length} disponíveis) →`}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {cart.length > 0 && (
                  <>
                    {/* Multi-service scheduling summary */}
                    {cart.filter(c => c.service).length > 1 && (
                      <div className="bg-primary/5 rounded-xl p-2.5 border border-primary/20">
                        <p className="text-[10px] font-bold text-foreground flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-primary" /> Resumo de agendamentos</p>
                        <div className="space-y-1 mt-1">
                          {cart.filter(c => c.service).map((item, i) => (
                            <div key={i} className="flex items-center justify-between text-[9px]">
                              <span className="text-muted-foreground">{item.service!.icon} {item.service!.name}</span>
                              <span className={item.scheduledDate ? 'text-primary' : 'text-destructive'}>
                                {item.scheduledDate ? `${item.scheduledDate} ${item.scheduledTime || ''}` : '⚠️ Não agendado'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="border-t border-border pt-3 space-y-1.5 text-xs">
                      <div className="flex justify-between"><span className="text-muted-foreground">Créditos utilizados</span><span className="font-medium text-primary">{cartTotals.totalCredits} cr</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Produtos</span><span>R$ {cartTotals.totalProducts.toFixed(2)}</span></div>
                      {cartTotals.totalDiscount > 0 && <div className="flex justify-between text-accent"><span>Desconto {discount}%</span><span>-R$ {cartTotals.totalDiscount.toFixed(2)}</span></div>}
                      <div className="h-px bg-border" />
                      <div className="flex justify-between font-bold text-sm"><span>Total produtos</span><span>R$ {cartTotals.grandTotal.toFixed(2)}</span></div>
                      {user.credits >= cartTotals.totalCredits ? (
                        <p className="text-[10px] text-primary">✅ Créditos suficientes ({user.credits - cartTotals.totalCredits} restantes)</p>
                      ) : (
                        <p className="text-[10px] text-accent">⚠️ Faltam {cartTotals.totalCredits - user.credits} créditos</p>
                      )}
                    </div>
                    <Button className="w-full text-xs gap-1" onClick={() => navigate('/jornada-cliente')}
                      disabled={cart.filter(c => c.service).some(c => !c.scheduledDate || !c.scheduledTime)}>
                      <Calendar className="w-3 h-3" /> {cart.filter(c => c.service).length > 1 ? 'Confirmar Agendamentos' : 'Agendar e Finalizar'}
                    </Button>
                    {cart.filter(c => c.service).some(c => !c.scheduledDate || !c.scheduledTime) && (
                      <p className="text-[9px] text-muted-foreground text-center">⚠️ Agende todos os serviços para prosseguir</p>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className={cn("p-3 pb-8 space-y-3", noResultsFallback && "hidden")}>

        {/* AI Suggestions */}
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
          <CardContent className="p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Brain className="w-4 h-4 text-primary" />
              <span className="text-[11px] font-bold text-foreground">IA Vitrinei — Sugestões personalizadas</span>
            </div>
            <div className="space-y-1.5">
              {aiSuggestions.map((s, i) => (
                <motion.p key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.2 }}
                  className="text-[10px] text-muted-foreground bg-card/80 rounded-lg px-2.5 py-1.5">{s}</motion.p>
              ))}
              {aiInsight && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 mt-2"
                >
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-primary mt-0.5" />
                    <p className="text-[10px] text-foreground leading-relaxed italic">
                      {aiInsight.replace(/\*\*(.*?)\*\*/g, '$1')}
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Demo CTAs */}
        <div className="flex gap-2">
          <Card className="flex-1 border-primary/20 bg-primary/5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/jornada-cliente')}>
            <CardContent className="p-2 flex items-center gap-2">
              <span className="text-lg">🎬</span>
              <div><p className="text-[10px] font-bold text-foreground">Jornada Completa</p><p className="text-[9px] text-muted-foreground">Demo interativa</p></div>
            </CardContent>
          </Card>
          <Card className="flex-1 border-accent/20 bg-accent/5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/dropshipping')}>
            <CardContent className="p-2 flex items-center gap-2">
              <span className="text-lg">🌍</span>
              <div><p className="text-[10px] font-bold text-foreground">Dropshipping</p><p className="text-[9px] text-muted-foreground">Produtos globais</p></div>
            </CardContent>
          </Card>
          <Card className="flex-1 border-border cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/gestao')}>
            <CardContent className="p-2 flex items-center gap-2">
              <span className="text-lg">🔧</span>
              <div><p className="text-[10px] font-bold text-foreground">Gestão</p><p className="text-[9px] text-muted-foreground">Chamados</p></div>
            </CardContent>
          </Card>
        </div>

        {/* Segmented Service Sections */}
        <div data-search-results>
          {activeSegments.map((seg, segIdx) => {
            const services = groupedServices[seg.id];
          const isExpanded = expandedSegment === seg.id || searchQuery.trim().length >= 1 || selectedSegments.length > 0;

          return (
            <motion.div key={seg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: segIdx * 0.05 }}>
              <Card className={`border ${seg.color} overflow-hidden`}>
                <button className="w-full px-3 py-2.5 flex items-center justify-between" onClick={() => setExpandedSegment(expandedSegment === seg.id ? null : seg.id)}>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{seg.emoji}</span>
                    <div className="text-left">
                      <p className="text-sm font-bold text-foreground">{seg.label}</p>
                      <p className="text-[10px] text-muted-foreground">{seg.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[9px]">{services.length}</Badge>
                    <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
                      <div className="px-3 pb-3 space-y-2 border-t border-border/50 pt-2">
                        {services.map((svc, i) => {
                          const elig = checkEligibility(svc, user.credits, user.monthsActive, user.plan);
                          const inCart = isInCart(svc.id);
                          const cartIdx = cart.findIndex(c => c.service?.id === svc.id);
                          const cartItem = cartIdx >= 0 ? cart[cartIdx] : null;
                          
                          // Get contextual product count for preview
                          const relevantMeis = meiProfessionals.filter(mei => mei.segment === svc.category);
                          const allMeiProducts = relevantMeis.flatMap(mei => [...mei.ownProducts, ...mei.dropshippingProducts]);
                          const contextualCount = getContextualProducts(svc, allMeiProducts).length;

                          return (
                            <motion.div key={svc.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                              className={`rounded-xl p-2.5 border transition-all ${inCart ? 'bg-primary/5 border-primary/30' : 'bg-card border-border/50 hover:border-primary/20'}`}>
                              <div className="flex items-start gap-2.5">
                                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl shrink-0">{svc.icon}</div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-semibold text-foreground">{svc.name}</h4>
                                    <div className="flex items-center gap-1">
                                      <button onClick={() => toggleFavorite(svc.id)}>
                                        <Heart className={`w-3.5 h-3.5 ${favorites.includes(svc.id) ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`} />
                                      </button>
                                    </div>
                                  </div>
                                  <p className="text-[10px] text-muted-foreground">{svc.provider} • <Star className="w-2.5 h-2.5 text-accent fill-accent inline" /> {svc.rating}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-medium text-primary flex items-center gap-0.5"><Coins className="w-2.5 h-2.5" />{svc.creditCost} cr</span>
                                    {elig.status === 'disponivel_total' && <Badge className="text-[8px] h-3.5 bg-primary/10 text-primary border-0">Coberto</Badge>}
                                    {elig.status === 'disponivel_parcial' && <Badge className="text-[8px] h-3.5 bg-accent/10 text-accent border-0">+R$ {elig.extraValue.toFixed(0)}</Badge>}
                                    {elig.status === 'bloqueado' && <Badge className="text-[8px] h-3.5 bg-destructive/10 text-destructive border-0"><Lock className="w-2 h-2 mr-0.5" />Bloqueado</Badge>}
                                    {contextualCount > 0 && <span className="text-[9px] text-muted-foreground"><Package className="w-2.5 h-2.5 inline" /> {contextualCount} produtos</span>}
                                  </div>
                                </div>
                                <Button size="sm" variant={inCart ? 'default' : 'outline'} className="text-[9px] h-7 px-2 shrink-0"
                                  onClick={() => inCart ? removeFromCart(cartIdx) : addServiceToCart(svc)}
                                  disabled={elig.status === 'bloqueado'}>
                                  {inCart ? <><CheckCircle2 className="w-3 h-3 mr-0.5" />Adicionado</> : <><Plus className="w-3 h-3 mr-0.5" />Adicionar</>}
                                </Button>
                              </div>

                              {/* Contextual products inline (show when in cart) */}
                              {inCart && cartItem && cartItem.contextualProducts.length > 0 && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2 ml-12 space-y-1">
                                  <p className="text-[9px] font-bold text-muted-foreground">🎯 Produtos relacionados ao serviço:</p>
                                  {cartItem.contextualProducts.slice(0, 4).map(p => (
                                    <div key={p.id} className="flex items-center justify-between text-[10px] bg-muted/50 rounded-lg px-2 py-1">
                                      <span className="truncate flex-1">{p.image} {p.name}</span>
                                      <div className="flex items-center gap-1 shrink-0">
                                        <Badge variant="outline" className="text-[7px] h-3 px-1">{p.supplier?.includes('Drop') ? '🌍' : '📦'}</Badge>
                                        <span className="font-medium text-foreground">R$ {(p.price * (1 - discount / 100)).toFixed(2)}</span>
                                        {!cartItem.products.some(cp => cp.id === p.id) ? (
                                          <button onClick={() => addProductToCartItem(cartIdx, p)} className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20">
                                            <Plus className="w-2.5 h-2.5 text-primary" />
                                          </button>
                                        ) : (
                                          <CheckCircle2 className="w-3 h-3 text-primary" />
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                  {cartItem.contextualProducts.length > 4 && (
                                    <button onClick={() => { setShowCart(true); }} className="text-[9px] text-primary font-medium hover:underline">
                                      Ver mais {cartItem.contextualProducts.length - 4} produtos no carrinho →
                                    </button>
                                  )}
                                </motion.div>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          );
        })}

        {/* Products Section */}
        {(searchQuery.trim().length >= 1 || selectedSegments.length > 0) && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5"><ShoppingBag className="w-4 h-4 text-primary" /> Resultados de Produtos</h3>
              {discount > 0 && <Badge className="text-[9px] bg-green-500/10 text-green-600 border-0">-{discount}% plano {currentPlan?.name}</Badge>}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {clientProducts.filter(p => {
                const q = searchQuery.toLowerCase().trim();
                const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
                
                const selectedCats = selectedSegments.map(id => segments.find(s => s.id === id)?.category).filter(Boolean);
                const matchesSegments = selectedSegments.length === 0 || selectedCats.includes(p.category);
                
                return matchesSearch && matchesSegments;
              }).slice(0, 6).map(product => {
                const discountedPrice = product.price * (1 - discount / 100);
                return (
                  <Card key={product.id} className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      const params = new URLSearchParams({
                        productName: product.name,
                        productType: (product as any).stockType || 'fisico',
                        productPrice: String(product.price),
                        productProvider: product.supplier,
                      });
                      navigate(`/dropshipping?${params.toString()}`);
                    }}>
                    <CardContent className="p-0">
                      <div className="h-16 bg-muted flex items-center justify-center text-2xl">{product.image}</div>
                      <div className="p-2">
                        <p className="text-[9px] text-muted-foreground">{product.supplier}</p>
                        <h4 className="text-[10px] font-semibold text-foreground line-clamp-2">{product.name}</h4>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Star className="w-2.5 h-2.5 text-accent fill-accent" /><span className="text-[9px]">{product.rating}</span>
                        </div>
                        <div className="mt-1">
                          {discount > 0 && <p className="text-[9px] text-muted-foreground line-through">R$ {product.price.toFixed(2)}</p>}
                          <p className="text-xs font-bold text-foreground">R$ {discountedPrice.toFixed(2)}</p>
                        </div>
                        <div className="flex gap-1 mt-1.5">
                          <Button size="sm" variant="outline" className="flex-1 text-[8px] h-6 gap-0.5" onClick={(e) => { e.stopPropagation(); addProductToCart(product); }}>
                            <Plus className="w-2.5 h-2.5" /> Carrinho
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>

      {/* Floating Cart Summary */}
      {cart.length > 0 && !showCart && (
        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[calc(28rem-2rem)] z-40">
          <Card className="border-primary shadow-xl bg-card/95 backdrop-blur-sm cursor-pointer" onClick={() => setShowCart(true)}>
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center"><ShoppingCart className="w-4 h-4 text-primary-foreground" /></div>
                <div>
                  <p className="text-xs font-bold text-foreground">{cartTotals.serviceCount} serviço(s) + {cart.reduce((s, c) => s + c.products.length, 0)} produto(s)</p>
                  <p className="text-[10px] text-muted-foreground">{cartTotals.totalCredits} créditos + R$ {cartTotals.grandTotal.toFixed(2)}</p>
                </div>
              </div>
              <Button size="sm" className="text-[10px] gap-1"><Calendar className="w-3 h-3" />Ver Carrinho</Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Floating Support Icon - Right Side */}
      <AnimatePresence>
        <motion.button
          initial={{ scale: 0, opacity: 0, x: 20 }}
          animate={{ scale: 1, opacity: 1, x: 0 }}
          exit={{ scale: 0, opacity: 0, x: 20 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            setNoResultsFallback(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-2xl flex items-center justify-center border-2 border-background ring-4 ring-primary/20"
          title="Central de Atendimento"
        >
          <LifeBuoy className="w-7 h-7" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-primary border-2 border-background"></span>
          </span>
        </motion.button>
      </AnimatePresence>
    </div>
  );
};

export default ClientApp;
