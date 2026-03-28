import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ArrowRight, Zap, Sparkles, Clock, MapPin, DollarSign,
  Headphones, ShoppingCart, BarChart3, Send, Star,
  Package, TrendingDown, Navigation, Users, Shield, MessageCircle,
  ChevronDown, ShoppingBag, Wrench as WrenchIcon, Store, Plus, CheckCircle2, X, Trash2
} from 'lucide-react';
import { AiAvatar } from '@/components/AiAvatarGlobal';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { segments, mockResults, semanticSearch, buildSupportSummary, type ProductItem, type SearchResult } from '@/data/searchData';


const aiSuggestions = [
  '🔌 Baseado no seu perfil, recomendamos uma revisão elétrica completa — você não faz há 8 meses!',
  '💇 Agende seu corte mensal com 15% de desconto no seu plano Prata!',
  '🏠 Combo Casa Limpa: Faxina + Jardinagem com 20% OFF juntos',
  '🚗 Seu carro está próximo da revisão dos 30.000 km — agende agora!',
];


const Landing = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSegments, setActiveSegments] = useState<string[]>([]);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [aiChat, setAiChat] = useState<{ role: 'user' | 'ai'; text: string; searchResult?: SearchResult }[]>([]);
  const [currentSuggestion, setCurrentSuggestion] = useState(0);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [expandedProducts, setExpandedProducts] = useState<number | null>(null);
  const [expandedServices, setExpandedServices] = useState<number | null>(null);
  const [showSearchProducts, setShowSearchProducts] = useState(false);
  const [productCart, setProductCart] = useState<ProductItem[]>([]);
  const [showProductCart, setShowProductCart] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const toggleProductInCart = (product: ProductItem) => {
    setProductCart(prev => 
      prev.some(p => p.id === product.id)
        ? prev.filter(p => p.id !== product.id)
        : [...prev, product]
    );
  };

  const isInProductCart = (productId: number) => productCart.some(p => p.id === productId);

  const navigateToProductDemo = () => {
    if (productCart.length === 0) return;
    const params = new URLSearchParams({
      products: JSON.stringify(productCart.map(p => ({
        name: p.name,
        type: p.stockType,
        price: p.price,
        provider: p.provider,
        rating: p.rating,
        distance: p.distance,
      }))),
    });
    navigate(`/dropshipping?${params.toString()}`);
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

  const toggleSegment = (id: string) => {
    setActiveSegments((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  };

  // ── Motor de busca semântica universal ──
  const searchResult = (() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query && activeSegments.length === 0) return { products: [], services: mockResults, followUp: undefined, needLabel: undefined, suggestedServices: undefined };
    if (!query && activeSegments.length > 0) return { products: [], services: mockResults.filter(r => activeSegments.includes(r.segment)), followUp: undefined, needLabel: undefined, suggestedServices: undefined };

    const result = semanticSearch(query);

    // Apply segment filter on top
    const filteredServices = activeSegments.length === 0
      ? result.services
      : result.services.filter(r => activeSegments.includes(r.segment));

    // Fallback to segment-filtered defaults
    if (filteredServices.length === 0 && activeSegments.length > 0) {
      return { ...result, services: mockResults.filter(r => activeSegments.includes(r.segment)) };
    }

    return { ...result, services: filteredServices.length > 0 ? filteredServices : (query ? [] : mockResults) };
  })();

  const filteredResults = searchResult.services;

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
        setAiChat((prev) => [...prev, {
          role: 'ai',
          text: 'Não encontrei resultados exatos, mas estou encaminhando para a Central de Atendimento. SLA: 24h para encontrar a melhor solução! 📩'
        }]);
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
            <Button variant="ghost" size="sm" onClick={() => navigate('/client')}>
              <ShoppingCart className="w-4 h-4 mr-1" /> App Cliente
            </Button>
            <Button size="sm" onClick={() => navigate('/mei')}>
              <BarChart3 className="w-4 h-4 mr-1" /> Painel MEI
            </Button>
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-24 pb-4 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="container mx-auto text-center relative max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
             <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-extrabold text-foreground mb-3 leading-tight tracking-tight">
               Mais clientes para seu negócio, <span className="text-primary">todos os dias.</span><br />
               <span className="text-muted-foreground text-2xl md:text-3xl lg:text-4xl font-bold">A inteligência que conecta quem precisa a quem resolve.</span>
             </h1>
             <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-4">
               Serviços, produtos, profissionais — tudo em um só lugar. Se não existir aqui, nossa IA vasculha o ecossistema inteiro e entrega a melhor opção.
             </p>
             {/* Social proof bar */}
             <div className="flex flex-wrap justify-center gap-4 text-xs sm:text-sm text-muted-foreground mb-6">
               <span className="flex items-center gap-1.5 font-medium"><Users className="w-4 h-4 text-primary" /> <strong className="text-foreground">2.450+</strong> MEIs ativos</span>
               <span className="flex items-center gap-1.5 font-medium"><Star className="w-4 h-4 fill-accent text-accent" /> <strong className="text-foreground">4.8</strong> avaliação média</span>
               <span className="flex items-center gap-1.5 font-medium"><Shield className="w-4 h-4 text-success" /> Pagamento <strong className="text-foreground">100% seguro</strong></span>
               <span className="flex items-center gap-1.5 font-medium"><CheckCircle2 className="w-4 h-4 text-success" /> <strong className="text-foreground">12.800+</strong> serviços realizados</span>
             </div>
          </motion.div>

          {/* CTA buttons */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }} className="flex gap-3 justify-center mb-6">
            <Button size="lg" className="gap-2 px-6" onClick={() => navigate('/mei')}>
              <BarChart3 className="w-4 h-4" /> Painel MEI
            </Button>
            <Button size="lg" variant="outline" className="gap-2 px-6" onClick={() => navigate('/client')}>
              <ShoppingCart className="w-4 h-4" /> App Cliente
            </Button>
          </motion.div>
        </div>
      </section>

      {/* AI Avatar + Search Section */}
      <section className="px-4 pb-8">
        <div className="container mx-auto max-w-5xl">
          {/* Avatar + greeting */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.6, type: 'spring' }}
            className="flex flex-col items-center mb-6"
          >
            <AiAvatar size={80} speaking={aiSpeaking} onClick={() => setShowAiPanel(true)} />
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mt-4 bg-card border border-border rounded-2xl rounded-tl-md px-5 py-3 shadow-md max-w-md relative"
            >
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-card border-l border-t border-border rotate-45" />
               <p className="text-sm text-foreground font-medium relative z-10">
                 Me diga o que você precisa 👋<br />
                 <span className="text-muted-foreground font-normal">Eu encontro o melhor profissional perto de você.</span>
               </p>
            </motion.div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5, duration: 0.5 }}>
            {/* Search bar */}
            <div className="relative mb-6">
              <div className="relative flex items-center bg-card border-2 border-primary/30 rounded-2xl shadow-lg hover:shadow-xl hover:border-primary/50 transition-all duration-300 overflow-hidden">
                <Search className="w-5 h-5 text-primary absolute left-4" />
                <Input
                  ref={searchRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={placeholders[placeholderIdx]}
                  className="border-0 pl-12 pr-4 py-6 text-base md:text-lg bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <div className="flex items-center gap-2 pr-3">
                  <Button size="sm" variant="ghost" className="gap-1 text-muted-foreground hover:text-primary" onClick={() => setShowAiPanel(!showAiPanel)}>
                    <MessageCircle className="w-4 h-4" />
                    <span className="hidden sm:inline text-xs">Falar com IA</span>
                  </Button>
                  <Button size="sm" className="gap-1 rounded-xl">
                    <Search className="w-4 h-4" /> Buscar
                  </Button>
                </div>
              </div>

              {/* AI Suggestion banner */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSuggestion}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={{ duration: 0.3 }}
                  className="mt-2 flex items-center gap-2 text-sm text-muted-foreground px-2"
                >
                  <Sparkles className="w-4 h-4 text-accent shrink-0" />
                  <span>{aiSuggestions[currentSuggestion]}</span>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Segment chips */}
            <div className="flex flex-wrap gap-2 mb-6 justify-center">
              {segments.map((seg) => {
                const Icon = seg.icon;
                const isActive = activeSegments.includes(seg.id);
                return (
                  <motion.button
                    key={seg.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => toggleSegment(seg.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${
                      isActive
                        ? 'bg-primary text-primary-foreground border-primary shadow-md'
                        : 'bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {seg.label}
                  </motion.button>
                );
              })}
            </div>

            {/* Results grid */}
            <AnimatePresence>
              {(searchQuery || activeSegments.length > 0) && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
                  {/* AI Interpretation Banner */}
                  {searchQuery && searchResult.needLabel && (
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
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            {searchResult.services.length > 0 && (
                              <span className="flex items-center gap-1"><WrenchIcon className="w-3 h-3 text-primary" /> {searchResult.services.length} serviço(s)</span>
                            )}
                            {searchResult.products.length > 0 && (
                              <span className="flex items-center gap-1"><ShoppingBag className="w-3 h-3 text-success" /> {searchResult.products.length} produto(s)</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Products Section */}
                  {searchQuery && searchResult.products.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                          <ShoppingBag className="w-4 h-4 text-success" /> Produtos disponíveis
                        </h3>
                        {searchResult.products.length > 6 && (
                          <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground hover:text-primary gap-1"
                            onClick={() => setShowSearchProducts(!showSearchProducts)}>
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showSearchProducts ? 'rotate-180' : ''}`} />
                            {showSearchProducts ? 'Mostrar menos' : `Ver todos (${searchResult.products.length})`}
                          </Button>
                        )}
                      </div>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {(showSearchProducts ? searchResult.products : searchResult.products.slice(0, 6)).map((product, idx) => (
                          <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}>
                            <Card
                              className={`hover:shadow-md transition-all duration-200 cursor-pointer group ${
                                isInProductCart(product.id) 
                                  ? 'border-success bg-success/5 shadow-sm' 
                                  : 'border-border/50 hover:border-success/40'
                              }`}
                              onClick={() => toggleProductInCart(product)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isInProductCart(product.id) ? 'bg-success/20' : 'bg-success/10'}`}>
                                      {isInProductCart(product.id) ? <CheckCircle2 className="w-4 h-4 text-success" /> : <ShoppingBag className="w-4 h-4 text-success" />}
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-sm text-foreground">{product.name}</h4>
                                      <p className="text-xs text-muted-foreground">{product.provider}</p>
                                    </div>
                                  </div>
                                  <Badge variant={product.stockType === 'fisico' ? 'default' : 'secondary'} className="text-[10px] px-2 py-0 shrink-0">
                                    <Store className="w-2.5 h-2.5 mr-0.5" />
                                    {product.stockType === 'fisico' ? 'Estoque' : 'Drop'}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1 font-semibold text-foreground"><DollarSign className="w-3 h-3" /> R$ {product.price}</span>
                                  <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-accent text-accent" /> {product.rating}</span>
                                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {product.distance}</span>
                                </div>
                                <div className="mt-2 flex items-center gap-1 text-[10px] font-medium transition-opacity">
                                  {isInProductCart(product.id) ? (
                                    <span className="text-success flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Adicionado ao carrinho</span>
                                  ) : (
                                    <span className="text-success opacity-0 group-hover:opacity-100 flex items-center gap-1"><Plus className="w-3 h-3" /> Adicionar ao carrinho</span>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Services Section */}
                  {filteredResults.length > 0 && (
                    <>
                      {searchQuery && searchResult.products.length > 0 && (
                        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                          <WrenchIcon className="w-4 h-4 text-primary" /> Serviços profissionais
                        </h3>
                      )}
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                        {filteredResults.map((result, idx) => {
                          const seg = segments.find((s) => s.id === result.segment);
                          const SegIcon = seg?.icon || Sparkles;
                          return (
                            <motion.div key={result.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                              <Card
                                className="border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-pointer group"
                                onClick={() => {
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
                                }}
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <SegIcon className="w-4 h-4 text-primary" />
                                      </div>
                                      <div>
                                        <h4 className="font-semibold text-sm text-foreground">{result.name}</h4>
                                        <p className="text-xs text-muted-foreground">{result.provider}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-accent-foreground">
                                      <Star className="w-3 h-3 fill-accent text-accent" />
                                      {result.rating}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                                    <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> R$ {result.price}</span>
                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {result.time}</span>
                                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {result.distance}</span>
                                  </div>
                                  {result.products.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {result.products.map((p) => (
                                        <Badge key={p} variant="secondary" className="text-[10px] px-2 py-0">
                                          <Package className="w-2.5 h-2.5 mr-1" />{p}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                  <div className="mt-2 flex items-center gap-1 text-[10px] text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ArrowRight className="w-3 h-3" /> Simular contratação
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {filteredResults.length === 0 && searchResult.products.length === 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-8">
                      {/* Structured analysis */}
                      <Card className="border-primary/20 bg-primary/5 mb-4">
                        <CardContent className="p-5">
                          <div className="flex items-center gap-3 mb-3">
                            <AiAvatar size={48} speaking={true} onClick={() => setShowAiPanel(true)} />
                            <div>
                              <h3 className="font-display font-bold text-foreground">Análise Inteligente</h3>
                              <p className="text-xs text-muted-foreground">Nenhum resultado encontrado para "{searchQuery}"</p>
                            </div>
                          </div>
                          <div className="bg-card rounded-lg p-4 space-y-2 text-sm">
                            <p className="font-semibold text-foreground">📋 Resumo da solicitação:</p>
                            <ul className="text-xs text-muted-foreground space-y-1">
                              <li>• <strong>Busca:</strong> "{searchQuery}"</li>
                              <li>• <strong>Tipo:</strong> Serviço + Produtos relacionados</li>
                              <li>• <strong>Status:</strong> Não disponível no hub atual</li>
                              <li>• <strong>Ação:</strong> Encaminhar para Central de Atendimento</li>
                            </ul>
                          </div>
                        </CardContent>
                      </Card>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button className="gap-2" onClick={() => {
                          const summary = buildSupportSummary(aiChat, searchQuery);
                          const params = new URLSearchParams({ query: searchQuery, context: 'Busca sem resultados', summary, type: 'both' });
                          navigate(`/central-atendimento?${params.toString()}`);
                        }}>
                          <Headphones className="w-4 h-4" /> Acionar Central (SLA 24h)
                        </Button>
                        <Button variant="outline" className="gap-2" onClick={() => {
                          const summary = buildSupportSummary(aiChat, searchQuery);
                          const params = new URLSearchParams({ query: searchQuery, context: 'Incluir novo item', summary, type: 'both' });
                          navigate(`/central-atendimento?${params.toString()}`);
                        }}>
                          <Plus className="w-4 h-4" /> Incluir serviço/produto
                        </Button>
                        <Button variant="ghost" className="gap-2" onClick={() => setShowAiPanel(true)}>
                          <Sparkles className="w-4 h-4" /> Falar com a IA
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Idle state */}
            {!searchQuery && activeSegments.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="text-center py-6">
                <div className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto mb-8">
                  {[
                    { icon: TrendingDown, title: 'Melhor Preço', desc: 'IA compara todos os fornecedores e acha o menor preço do ecossistema', color: 'text-primary' },
                    { icon: Navigation, title: 'Mais Próximo', desc: 'Prioriza prestadores na sua região para atendimento rápido', color: 'text-success' },
                    { icon: Clock, title: 'Menor Tempo', desc: 'Agenda automática com o profissional disponível mais cedo', color: 'text-accent-foreground' },
                  ].map((feat, idx) => (
                    <motion.div
                      key={feat.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 + idx * 0.15 }}
                    >
                      <Card className="border-border/50 hover:border-primary/20 transition-all duration-300 h-full">
                        <CardContent className="p-5 text-center">
                          <motion.div
                            animate={{ y: [0, -4, 0] }}
                            transition={{ duration: 2, repeat: Infinity, delay: idx * 0.3 }}
                            className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3"
                          >
                            <feat.icon className={`w-6 h-6 ${feat.color}`} />
                          </motion.div>
                          <h3 className="font-display font-bold text-foreground mb-1">{feat.title}</h3>
                          <p className="text-xs text-muted-foreground">{feat.desc}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {/* Trust bar */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-primary" /> 2.450+ MEIs ativos</span>
                  <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-success" /> Pagamento seguro</span>
                  <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-accent" /> 4.8 avaliação média</span>
                  <span className="flex items-center gap-1.5"><Headphones className="w-4 h-4 text-primary" /> Suporte 24h</span>
                </motion.div>

                {/* Not found CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.4 }}
                  className="mt-8 mx-auto max-w-2xl"
                >
                  <Card className="border-primary/20 bg-primary/5 overflow-hidden relative">
                    <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-4">
                      <AiAvatar size={56} speaking={false} onClick={() => setShowAiPanel(true)} />
                      <div className="text-left">
                        <h3 className="font-display font-bold text-foreground mb-1">Não achou o que precisa?</h3>
                        <p className="text-sm text-muted-foreground">
                          Fale comigo! Eu cruzo <strong>todos os fornecedores</strong>, estoques e catálogos drop-shipping do ecossistema.
                          Se eu não encontrar, a <strong>Central de Atendimento</strong> resolve em até <strong>24 horas</strong>.
                        </p>
                      </div>
                      <Button variant="outline" className="shrink-0 gap-1" onClick={() => setShowAiPanel(true)}>
                        <Sparkles className="w-4 h-4" /> Conversar
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            )}
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
                  <p className="font-medium text-foreground mb-2">👋 Olá! Sou a IA do EcoMEI.</p>
                  <p className="mb-3">Me conta o que você precisa — eu busco a melhor opção por:</p>
                  <ul className="space-y-1.5">
                    <li className="flex items-center gap-2"><DollarSign className="w-3.5 h-3.5 text-primary" /> Melhor preço</li>
                    <li className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-primary" /> Menor tempo de atendimento</li>
                    <li className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-primary" /> Proximidade da sua região</li>
                  </ul>
                  <p className="mt-3 text-xs">Se não encontrar, encaminho para a <strong>Central de Atendimento</strong> (SLA 24h).</p>
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
                  {/* Product cards */}
                  {msg.searchResult && msg.searchResult.products.length > 0 && (
                    <div className="w-full mt-2 pl-10">
                      <p className="text-[11px] font-semibold text-success mb-1.5 flex items-center gap-1">
                        <ShoppingBag className="w-3.5 h-3.5" /> Produtos disponíveis
                      </p>
                      <div className="space-y-2">
                        {(expandedProducts === idx ? msg.searchResult.products : msg.searchResult.products.slice(0, 3)).map((product) => (
                          <motion.div key={product.id} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                            <Card className={`cursor-pointer transition-all group ${isInProductCart(product.id) ? 'border-success bg-success/5' : 'border-border/50 hover:border-success/40'}`}
                              onClick={() => toggleProductInCart(product)}>
                              <CardContent className="p-3">
                                <div className="flex items-start justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isInProductCart(product.id) ? 'bg-success/20' : 'bg-success/10'}`}>
                                      {isInProductCart(product.id) ? <CheckCircle2 className="w-3.5 h-3.5 text-success" /> : <ShoppingBag className="w-3.5 h-3.5 text-success" />}
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-xs text-foreground">{product.name}</h4>
                                      <p className="text-[11px] text-muted-foreground">{product.provider}</p>
                                    </div>
                                  </div>
                                  <Badge variant={product.stockType === 'fisico' ? 'default' : 'secondary'} className="text-[9px] px-1.5 py-0 shrink-0">
                                    <Store className="w-2.5 h-2.5 mr-0.5" />
                                    {product.stockType === 'fisico' ? 'Estoque' : 'Drop'}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-1">
                                  <span className="flex items-center gap-0.5 font-semibold text-foreground"><DollarSign className="w-3 h-3" /> R$ {product.price}</span>
                                  <span className="flex items-center gap-0.5"><Star className="w-3 h-3 fill-accent text-accent" /> {product.rating}</span>
                                  <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {product.distance}</span>
                                </div>
                                <div className="mt-1 flex items-center gap-1 text-[10px] font-medium">
                                  {isInProductCart(product.id)
                                    ? <span className="text-success flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> No carrinho</span>
                                    : <span className="text-success opacity-0 group-hover:opacity-100 flex items-center gap-1"><Plus className="w-3 h-3" /> Adicionar</span>}
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                        {msg.searchResult.products.length > 3 && expandedProducts !== idx && (
                          <Button variant="ghost" size="sm" className="w-full text-xs h-8 text-muted-foreground hover:text-primary gap-1"
                            onClick={() => setExpandedProducts(idx)}>
                            <ChevronDown className="w-3.5 h-3.5" />
                            Ver todos os {msg.searchResult.products.length} produtos
                          </Button>
                        )}
                        {expandedProducts === idx && msg.searchResult.products.length > 3 && (
                          <Button variant="ghost" size="sm" className="w-full text-xs h-8 text-muted-foreground hover:text-primary"
                            onClick={() => setExpandedProducts(null)}>Mostrar menos</Button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Service cards */}
                  {msg.searchResult && msg.searchResult.services.length > 0 && (
                    <div className="w-full mt-2 pl-10">
                      <p className="text-[11px] font-semibold text-primary mb-1.5 flex items-center gap-1">
                        <WrenchIcon className="w-3.5 h-3.5" /> Serviços profissionais
                      </p>
                      <div className="space-y-2">
                        {(expandedServices === idx ? msg.searchResult.services : msg.searchResult.services.slice(0, 3)).map((r) => {
                          const seg = segments.find((s) => s.id === r.segment);
                          const SegIcon = seg?.icon || Sparkles;
                          return (
                            <motion.div key={r.id} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                              <Card className="border-border/50 hover:border-primary/40 cursor-pointer transition-all group"
                                onClick={() => navigateToDemo(r)}>
                                <CardContent className="p-3">
                                  <div className="flex items-start justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                        <SegIcon className="w-3.5 h-3.5 text-primary" />
                                      </div>
                                      <div>
                                        <h4 className="font-semibold text-xs text-foreground">{r.name}</h4>
                                        <p className="text-[11px] text-muted-foreground">{r.provider}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-0.5 text-xs text-accent-foreground shrink-0">
                                      <Star className="w-3 h-3 fill-accent text-accent" />
                                      {r.rating}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-2">
                                    <span className="flex items-center gap-0.5"><DollarSign className="w-3 h-3" /> R$ {r.price}</span>
                                    <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> {r.time}</span>
                                    <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" /> {r.distance}</span>
                                  </div>
                                  {r.products.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {r.products.slice(0, 3).map((p) => (
                                        <Badge key={p} variant="secondary" className="text-[9px] px-1.5 py-0">
                                          <Package className="w-2.5 h-2.5 mr-0.5" />{p}
                                        </Badge>
                                      ))}
                                      {r.products.length > 3 && (
                                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0">+{r.products.length - 3}</Badge>
                                      )}
                                    </div>
                                  )}
                                  <div className="mt-1.5 flex items-center gap-1 text-[10px] text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ArrowRight className="w-3 h-3" /> Contratar agora
                                  </div>
                                </CardContent>
                              </Card>
                            </motion.div>
                          );
                        })}
                        {msg.searchResult.services.length > 3 && expandedServices !== idx && (
                          <Button variant="ghost" size="sm" className="w-full text-xs h-8 text-muted-foreground hover:text-primary gap-1"
                            onClick={() => setExpandedServices(idx)}>
                            <ChevronDown className="w-3.5 h-3.5" />
                            Ver todos os {msg.searchResult.services.length} serviços
                          </Button>
                        )}
                        {expandedServices === idx && msg.searchResult.services.length > 3 && (
                          <Button variant="ghost" size="sm" className="w-full text-xs h-8 text-muted-foreground hover:text-primary"
                            onClick={() => setExpandedServices(null)}>Mostrar menos</Button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* AI-suggested services */}
                  {msg.searchResult?.suggestedServices && msg.searchResult.suggestedServices.length > 0 && (
                    <div className="w-full mt-2 pl-10">
                      <p className="text-[11px] font-semibold text-accent-foreground mb-1.5 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-accent" /> Serviços sugeridos pela IA
                      </p>
                      <div className="space-y-2">
                        {msg.searchResult.suggestedServices.slice(0, 2).map((r) => {
                          const seg = segments.find((s) => s.id === r.segment);
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
                  setAiSpeaking(true);
                  setAiChat((prev) => [...prev,
                    { role: 'user', text: 'Não encontrei o que preciso, podem me ajudar?' },
                    { role: 'ai', text: 'Claro! Encaminhando para a Central de Atendimento EcoMEI. Nosso SLA é de no máximo 24 horas. Você receberá uma notificação com a melhor solução! 📩✅' },
                  ]);
                  setTimeout(() => setAiSpeaking(false), 2000);
                }}
                className="w-full mt-2 text-xs text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1 py-1.5"
              >
                <Headphones className="w-3 h-3" /> Encaminhar para Central de Atendimento (SLA 24h)
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Product Cart Bar */}
      <AnimatePresence>
        {productCart.length > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl"
          >
            <Card className="border-success shadow-2xl bg-card/95 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                      <ShoppingCart className="w-5 h-5 text-success" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground">
                        {productCart.length} produto{productCart.length > 1 ? 's' : ''} selecionado{productCart.length > 1 ? 's' : ''}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>R$ {productCart.reduce((s, p) => s + p.price, 0).toFixed(2)}</span>
                        <span>•</span>
                        <span>{productCart.filter(p => p.stockType === 'fisico').length} estoque</span>
                        <span>{productCart.filter(p => p.stockType === 'drop').length} drop</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-8 px-2" onClick={() => setShowProductCart(!showProductCart)}>
                      {showProductCart ? 'Fechar' : 'Ver itens'}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setProductCart([])}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" className="gap-1 text-xs" onClick={navigateToProductDemo}>
                      <ArrowRight className="w-3 h-3" /> Ver Demo
                    </Button>
                  </div>
                </div>

                {/* Expanded cart items */}
                <AnimatePresence>
                  {showProductCart && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="mt-3 pt-3 border-t border-border space-y-2 overflow-hidden">
                      {productCart.map(product => (
                        <div key={product.id} className="flex items-center justify-between text-xs bg-muted/50 rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Badge variant={product.stockType === 'fisico' ? 'default' : 'secondary'} className="text-[8px] px-1.5 py-0 shrink-0">
                              {product.stockType === 'fisico' ? '📦' : '🌍'}
                            </Badge>
                            <span className="font-medium text-foreground truncate">{product.name}</span>
                            <span className="text-muted-foreground shrink-0">R$ {product.price}</span>
                          </div>
                          <button onClick={() => toggleProductInCart(product)} className="text-muted-foreground hover:text-destructive ml-2 shrink-0">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-border py-6 px-4">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-foreground">EcoMEI</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 EcoMEI — Demo para apresentação a investidores</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
