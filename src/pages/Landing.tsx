import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ArrowRight, Zap, Sparkles, Clock, MapPin, DollarSign,
  Wrench, Heart, Scissors, Home, Car, Monitor, Headphones,
  ShoppingCart, BarChart3, ChevronRight, Bot, Send, Star,
  Package, TrendingDown, Navigation, FileText, Users, Shield
} from 'lucide-react';

const segments = [
  { id: 'manutencao', label: 'Manutenção & Reparos', icon: Wrench, color: 'hsl(var(--primary))', keywords: ['eletricista', 'encanador', 'pintor', 'marido de aluguel', 'reparo', 'instalação', 'manutenção'] },
  { id: 'saude', label: 'Bem-estar & Saúde', icon: Heart, color: 'hsl(var(--success))', keywords: ['médico', 'fisioterapia', 'nutricionista', 'saúde', 'exame', 'consulta'] },
  { id: 'beleza', label: 'Estética & Beleza', icon: Scissors, color: 'hsl(var(--accent))', keywords: ['cabelo', 'manicure', 'estética', 'beleza', 'maquiagem', 'depilação'] },
  { id: 'casa', label: 'Lar & Ambiente', icon: Home, color: 'hsl(var(--teal))', keywords: ['limpeza', 'faxina', 'jardinagem', 'decoração', 'mudança', 'casa'] },
  { id: 'auto', label: 'Automotivo', icon: Car, color: 'hsl(var(--warning))', keywords: ['mecânico', 'funilaria', 'lavagem', 'carro', 'auto', 'pneu'] },
  { id: 'digital', label: 'Tecnologia & Digital', icon: Monitor, color: 'hsl(var(--primary))', keywords: ['computador', 'celular', 'rede', 'software', 'informatica', 'tecnologia'] },
];

const mockResults = [
  { id: 1, name: 'Eletricista Residencial', segment: 'manutencao', provider: 'Carlos MEI', price: 120, rating: 4.9, distance: '2.3 km', time: '30 min', products: ['Disjuntor 20A', 'Fio 2.5mm'] },
  { id: 2, name: 'Instalação de Câmeras', segment: 'manutencao', provider: 'TechSeg MEI', price: 350, rating: 4.8, distance: '4.1 km', time: '1h', products: ['Câmera IP WiFi', 'Cabo de rede Cat6'] },
  { id: 3, name: 'Consulta Nutricional', segment: 'saude', provider: 'Dra. Ana MEI', price: 180, rating: 5.0, distance: '1.5 km', time: '45 min', products: [] },
  { id: 4, name: 'Corte + Escova', segment: 'beleza', provider: 'Studio Bella', price: 89, rating: 4.7, distance: '800 m', time: '1h', products: ['Shampoo profissional', 'Condicionador'] },
  { id: 5, name: 'Limpeza Residencial', segment: 'casa', provider: 'LimpaJá MEI', price: 150, rating: 4.6, distance: '3.2 km', time: '3h', products: ['Kit limpeza completo'] },
  { id: 6, name: 'Troca de Óleo', segment: 'auto', provider: 'AutoRápido MEI', price: 99, rating: 4.8, distance: '5 km', time: '40 min', products: ['Óleo 5W30 sintético', 'Filtro de óleo'] },
  { id: 7, name: 'Formatação de PC', segment: 'digital', provider: 'InfoTech MEI', price: 80, rating: 4.5, distance: '1.8 km', time: '2h', products: ['Antivírus 1 ano', 'Pendrive 32GB'] },
  { id: 8, name: 'Massagem Relaxante', segment: 'saude', provider: 'Zen Spa MEI', price: 130, rating: 4.9, distance: '2 km', time: '1h', products: ['Óleo essencial lavanda'] },
];

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
  const [aiChat, setAiChat] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [typingText, setTypingText] = useState('');
  const [currentSuggestion, setCurrentSuggestion] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);

  // Rotate AI suggestions
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSuggestion((prev) => (prev + 1) % aiSuggestions.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Typing animation for search placeholder
  const placeholders = ['Eletricista na minha região...', 'Preciso de uma faxineira...', 'Manutenção do meu carro...', 'Consulta com nutricionista...'];
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setPlaceholderIdx((p) => (p + 1) % placeholders.length), 3000);
    return () => clearInterval(interval);
  }, []);

  const toggleSegment = (id: string) => {
    setActiveSegments((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  };

  const filteredResults = mockResults.filter((r) => {
    const matchesSearch = !searchQuery || r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.provider.toLowerCase().includes(searchQuery.toLowerCase()) || segments.find((s) => s.id === r.segment)?.keywords.some((k) => k.includes(searchQuery.toLowerCase()));
    const matchesSegment = activeSegments.length === 0 || activeSegments.includes(r.segment);
    return matchesSearch && matchesSegment;
  });

  const handleAiSend = () => {
    if (!aiMessage.trim()) return;
    setAiChat((prev) => [...prev, { role: 'user', text: aiMessage }]);
    const responses = [
      'Encontrei 3 opções na sua região! O mais próximo é o Carlos MEI, a 2.3 km, com avaliação 4.9⭐. Posso agendar para você?',
      'Analisando fornecedores cadastrados e estoque disponível via drop-shipping... Encontrei a melhor opção: preço 15% menor que a média, com entrega em 24h!',
      'Encaminhando sua solicitação para a Central de Atendimento. SLA de resposta: máximo 24 horas. Você receberá uma notificação assim que tivermos a solução!',
    ];
    setTimeout(() => {
      setAiChat((prev) => [...prev, { role: 'ai', text: responses[Math.floor(Math.random() * responses.length)] }]);
    }, 1200);
    setAiMessage('');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar — minimal */}
      <nav className="fixed top-0 w-full z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">EcoMEI</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/client')}>
              <ShoppingCart className="w-4 h-4 mr-1" /> App Cliente
            </Button>
            <Button size="sm" onClick={() => navigate('/mei')}>
              <BarChart3 className="w-4 h-4 mr-1" /> Painel MEI
            </Button>
            {/* More menu for hidden pages */}
            <div className="relative group">
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                Mais ▾
              </Button>
              <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 min-w-[200px] z-50">
                <div className="p-2 space-y-1">
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

      {/* Hero — Clean, focused */}
      <section className="pt-24 pb-6 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />

        <div className="container mx-auto text-center relative max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-extrabold text-foreground mb-3 leading-tight tracking-tight">
              Encontre <span className="text-primary">qualquer serviço.</span><br />
              A IA resolve o resto.
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-6">
              Busque, compare e contrate. Se não encontrar, nossa IA busca no ecossistema inteiro de MEIs e fornecedores por você.
            </p>
          </motion.div>

          {/* CTA buttons */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }} className="flex gap-3 justify-center mb-8">
            <Button size="lg" className="gap-2 px-6" onClick={() => navigate('/mei')}>
              <BarChart3 className="w-4 h-4" /> Painel MEI
            </Button>
            <Button size="lg" variant="outline" className="gap-2 px-6" onClick={() => navigate('/client')}>
              <ShoppingCart className="w-4 h-4" /> App Cliente
            </Button>
          </motion.div>
        </div>
      </section>

      {/* SUPER SEARCH TOOL */}
      <section className="px-4 pb-8">
        <div className="container mx-auto max-w-5xl">
          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4, duration: 0.5 }}>
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
                    <Bot className="w-4 h-4" />
                    <span className="hidden sm:inline text-xs">Assistente IA</span>
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
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                    {filteredResults.map((result, idx) => {
                      const seg = segments.find((s) => s.id === result.segment);
                      const SegIcon = seg?.icon || Wrench;
                      return (
                        <motion.div key={result.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                          <Card className="border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-pointer group">
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
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>

                  {filteredResults.length === 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Bot className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="font-display font-bold text-lg text-foreground mb-2">Não encontrou? A IA resolve!</h3>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
                        Nossa inteligência artificial está buscando em todos os fornecedores cadastrados,
                        estoques próprios e produtos via drop-shipping para encontrar a melhor opção por <strong>preço, tempo e proximidade</strong>.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button className="gap-2" onClick={() => setShowAiPanel(true)}>
                          <Sparkles className="w-4 h-4" /> Pedir para a IA buscar
                        </Button>
                        <Button variant="outline" className="gap-2" onClick={() => {
                          setShowAiPanel(true);
                          setAiChat((prev) => [...prev,
                            { role: 'user', text: `Preciso de: ${searchQuery}` },
                            { role: 'ai', text: 'Encaminhando sua solicitação para a Central de Atendimento EcoMEI. Prazo de resposta: até 24 horas. Você será notificado assim que encontrarmos a solução ideal! 📩' },
                          ]);
                        }}>
                          <Headphones className="w-4 h-4" /> Central de Atendimento (SLA 24h)
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Idle state — animated showcase */}
            {!searchQuery && activeSegments.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="text-center py-8">
                {/* Animated feature highlights */}
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

                {/* Não encontrou banner */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.4 }}
                  className="mt-8 mx-auto max-w-2xl"
                >
                  <Card className="border-primary/20 bg-primary/5 overflow-hidden relative">
                    <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-4">
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0"
                      >
                        <Bot className="w-7 h-7 text-primary" />
                      </motion.div>
                      <div className="text-left">
                        <h3 className="font-display font-bold text-foreground mb-1">Não encontrou o que procura?</h3>
                        <p className="text-sm text-muted-foreground">
                          Nossa IA cruza <strong>todos os fornecedores</strong>, estoques próprios e catálogos drop-shipping do ecossistema para encontrar exatamente o que você precisa. 
                          Caso não encontre, encaminhamos para a <strong>Central de Atendimento</strong> com resposta em até <strong>24 horas</strong>.
                        </p>
                      </div>
                      <Button variant="outline" className="shrink-0 gap-1" onClick={() => setShowAiPanel(true)}>
                        <Sparkles className="w-4 h-4" /> Testar
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
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-foreground">Assistente EcoMEI</h3>
                  <p className="text-xs text-muted-foreground">IA • Online agora</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowAiPanel(false)}>✕</Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Welcome message */}
              {aiChat.length === 0 && (
                <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-2">👋 Olá! Sou a IA do EcoMEI.</p>
                  <p className="mb-3">Posso ajudar você a encontrar qualquer serviço ou produto. Descreva o que precisa e eu busco a melhor opção por:</p>
                  <ul className="space-y-1.5">
                    <li className="flex items-center gap-2"><DollarSign className="w-3.5 h-3.5 text-primary" /> Melhor preço</li>
                    <li className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-primary" /> Menor tempo de atendimento</li>
                    <li className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-primary" /> Proximidade da sua região</li>
                  </ul>
                  <p className="mt-3 text-xs">Se não encontrarmos, encaminhamos para a <strong>Central de Atendimento</strong> (SLA 24h).</p>
                </div>
              )}

              {aiChat.map((msg, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-muted text-foreground rounded-bl-md'
                  }`}>
                    {msg.text}
                  </div>
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
                  setAiChat((prev) => [...prev,
                    { role: 'user', text: 'Não encontrei o que preciso, podem me ajudar?' },
                    { role: 'ai', text: 'Claro! Encaminhando para a Central de Atendimento EcoMEI. Nosso SLA é de no máximo 24 horas. Você receberá uma notificação com a melhor solução encontrada! 📩✅' },
                  ]);
                }}
                className="w-full mt-2 text-xs text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1 py-1.5"
              >
                <Headphones className="w-3 h-3" /> Encaminhar para Central de Atendimento (SLA 24h)
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimal Footer */}
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
