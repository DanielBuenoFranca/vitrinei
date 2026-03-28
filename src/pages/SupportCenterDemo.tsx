import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft, Bell, CheckCircle2, Star, DollarSign, MapPin, Clock,
  Headphones, Search, Sparkles, Package, Users, Shield,
  ShoppingBag, Store, ArrowRight, Play, Zap, Phone, FileText,
  UserPlus, BellRing, Truck, AlertTriangle, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AiAvatar } from '@/components/AiAvatarGlobal';
import { addDynamicEntries, type DynamicEntry } from '@/data/searchData';

const SupportCenterDemo = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const context = searchParams.get('context') || 'Serviço não encontrado';
  const query = searchParams.get('query') || 'serviço especializado';
  const summary = searchParams.get('summary') || '';
  const type = searchParams.get('type') as 'service' | 'product' | 'both' || 'both';

  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showPush, setShowPush] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [injectedItems, setInjectedItems] = useState(false);

  // Generate contextual mock data for the demo
  const contextName = query.charAt(0).toUpperCase() + query.slice(1);
  
  const newProviders = [
    { name: `${contextName} - Dr. Ana Mendes`, rating: 4.9, distance: '1.8 km', price: 120, specialty: `Especialista em ${contextName}` },
    { name: `${contextName} - Carlos Lima`, rating: 4.7, distance: '3.2 km', price: 95, specialty: `Profissional ${contextName}` },
    { name: `${contextName} - Studio Maria`, rating: 4.8, distance: '2.5 km', price: 110, specialty: `${contextName} Premium` },
  ];

  const newProducts = [
    { name: `Kit ${contextName} Profissional`, price: 89, provider: newProviders[0].name, stockType: 'fisico' as const },
    { name: `${contextName} - Produto Essencial`, price: 45, provider: newProviders[1].name, stockType: 'fisico' as const },
    { name: `Acessório ${contextName} Premium`, price: 65, provider: newProviders[2].name, stockType: 'drop' as const },
    { name: `${contextName} - Kit Completo`, price: 120, provider: newProviders[0].name, stockType: 'drop' as const },
    { name: `${contextName} - Básico Starter`, price: 29, provider: newProviders[1].name, stockType: 'fisico' as const },
  ];

  const steps = [
    { title: 'Análise da Solicitação', icon: FileText, desc: 'IA analisando contexto da conversa' },
    { title: 'Central Processando', icon: Headphones, desc: 'Buscando profissionais na região' },
    { title: 'Profissionais Encontrados', icon: UserPlus, desc: '3 profissionais localizados' },
    { title: 'Produtos Adicionados', icon: Package, desc: 'Estoque atualizado com novos itens' },
    { title: 'Notificação Enviada', icon: BellRing, desc: 'Push para o cliente' },
    { title: 'Disponível no Hub', icon: CheckCircle2, desc: 'Itens integrados ao ecossistema' },
  ];

  // Auto-advance steps
  useEffect(() => {
    if (!autoAdvance) return;
    const timings = [2500, 4000, 3000, 2500, 2000, 0];
    if (step < steps.length - 1) {
      const timer = setTimeout(() => setStep(s => s + 1), timings[step]);
      return () => clearTimeout(timer);
    }
  }, [step, autoAdvance]);

  // Progress bar for step 1 (SLA simulation)
  useEffect(() => {
    if (step === 1) {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress(p => {
          if (p >= 100) { clearInterval(interval); return 100; }
          return p + 3;
        });
      }, 80);
      return () => clearInterval(interval);
    }
  }, [step]);

  // Show push notification at step 4
  useEffect(() => {
    if (step === 4) {
      setTimeout(() => setShowPush(true), 500);
      setTimeout(() => setShowPush(false), 3500);
    }
  }, [step]);

  // Inject items at step 5
  useEffect(() => {
    if (step === 5 && !injectedItems) {
      const entries: DynamicEntry[] = newProviders.map((p, i) => ({
        type: 'service' as const,
        service: {
          id: 9000 + Math.floor(Math.random() * 1000) + i,
          name: p.name,
          segment: 'manutencao',
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
          tags: [query.toLowerCase(), contextName.toLowerCase()],
        })),
        maxPerSegment: 5,
      }));
      addDynamicEntries(entries);
      setInjectedItems(true);
    }
  }, [step, injectedItems]);

  return (
    <div className="min-h-screen bg-background">
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
              <p className="text-[11px] text-muted-foreground">SLA: 24 horas • Protocolo #{Math.floor(Math.random() * 90000 + 10000)}</p>
            </div>
          </div>
          <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
            <Clock className="w-3 h-3 mr-1" /> SLA 24h
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
                      O serviço "{contextName}" que você solicitou já está disponível! 3 profissionais prontos para atender.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto max-w-3xl p-4 space-y-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-between gap-1">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isDone = i < step;
            return (
              <motion.div
                key={i}
                className={`flex flex-col items-center flex-1 ${i < steps.length - 1 ? 'relative' : ''}`}
                animate={{ opacity: isDone || isActive ? 1 : 0.4 }}
              >
                <motion.div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    isDone ? 'bg-success text-success-foreground' : isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                  animate={isActive ? { scale: [1, 1.15, 1] } : {}}
                  transition={{ duration: 1, repeat: isActive ? Infinity : 0 }}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
                </motion.div>
                <p className="text-[9px] text-center mt-1 text-muted-foreground hidden sm:block">{s.title}</p>
                {i < steps.length - 1 && (
                  <div className={`absolute top-4 left-[calc(50%+16px)] right-[calc(-50%+16px)] h-0.5 ${isDone ? 'bg-success' : 'bg-border'}`} />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {/* Step 0: Análise */}
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <Card className="border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <AiAvatar size={48} thinking={true} />
                    <div>
                      <h2 className="font-display font-bold text-foreground">Análise da Solicitação</h2>
                      <p className="text-xs text-muted-foreground">IA processando contexto da conversa...</p>
                    </div>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-primary/10 text-primary text-xs"><Search className="w-3 h-3 mr-1" /> Busca</Badge>
                      <span className="text-sm font-medium text-foreground">"{query}"</span>
                    </div>
                    {summary && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Contexto da conversa:</p>
                        <p className="text-sm text-foreground">{summary}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                      <span>Nenhum resultado encontrado no hub atual</span>
                    </div>
                    <div className="border-t border-border pt-3">
                      <p className="text-xs font-semibold text-foreground mb-2">📋 Resumo para a Central:</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Necessidade: {contextName}</li>
                        <li>• Tipo: {type === 'service' ? 'Serviço profissional' : type === 'product' ? 'Produto' : 'Serviço + Produtos'}</li>
                        <li>• Região: São Paulo - SP</li>
                        <li>• Prioridade: Normal (SLA 24h)</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 1: Central processando */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <motion.div
                      className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    >
                      <Search className="w-6 h-6 text-primary" />
                    </motion.div>
                    <div>
                      <h2 className="font-display font-bold text-foreground">Central Processando</h2>
                      <p className="text-xs text-muted-foreground">Buscando profissionais na sua região...</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Progresso da busca</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: 'Bases consultadas', value: Math.floor(progress / 10), icon: '🗂️' },
                        { label: 'Profissionais analisados', value: Math.floor(progress / 5), icon: '👤' },
                        { label: 'Regiões varridas', value: Math.floor(progress / 15) + 1, icon: '📍' },
                      ].map((m) => (
                        <Card key={m.label} className="border-border/50">
                          <CardContent className="p-3 text-center">
                            <p className="text-lg">{m.icon}</p>
                            <p className="text-lg font-bold text-foreground">{m.value}</p>
                            <p className="text-[10px] text-muted-foreground">{m.label}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                      {progress > 20 && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-muted-foreground flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3 text-success" /> Consultando base de profissionais...
                        </motion.p>
                      )}
                      {progress > 45 && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-muted-foreground flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3 text-success" /> Verificando avaliações e qualificações...
                        </motion.p>
                      )}
                      {progress > 70 && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-muted-foreground flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3 text-success" /> Mapeando estoque de produtos...
                        </motion.p>
                      )}
                      {progress > 90 && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-success font-semibold flex items-center gap-2">
                          <Sparkles className="w-3 h-3" /> Profissionais encontrados!
                        </motion.p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 2: Profissionais encontrados */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                      <UserPlus className="w-6 h-6 text-success" />
                    </div>
                    <div>
                      <h2 className="font-display font-bold text-foreground">3 Profissionais Encontrados!</h2>
                      <p className="text-xs text-muted-foreground">Profissionais verificados e prontos para atender</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {newProviders.map((provider, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.3 }}
                      >
                        <Card className="border-success/30 hover:border-success/50 transition-all">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                                  {['👩‍⚕️', '👨‍🔧', '👩‍💼'][idx]}
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
                              <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-accent text-accent" /> {provider.rating}</span>
                              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {provider.distance}</span>
                              <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> R$ {provider.price}</span>
                            </div>
                            <div className="mt-2 flex gap-1">
                              {newProducts.filter(p => p.provider === provider.name).map((product, pidx) => (
                                <Badge key={pidx} variant="secondary" className="text-[9px] px-1.5 py-0">
                                  <Package className="w-2 h-2 mr-0.5" /> {product.name.slice(0, 20)}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg flex items-center gap-2 text-xs text-muted-foreground">
                    <RefreshCw className="w-3.5 h-3.5 text-primary" />
                    <span>Substituindo 1 profissional existente para manter o equilíbrio do hub (máx. 5 por área)</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Produtos adicionados */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                      <Package className="w-6 h-6 text-success" />
                    </div>
                    <div>
                      <h2 className="font-display font-bold text-foreground">Produtos Adicionados ao Estoque</h2>
                      <p className="text-xs text-muted-foreground">5 produtos distribuídos entre os 3 profissionais</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {newProducts.map((product, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.15 }}
                      >
                        <Card className="border-border/50">
                          <CardContent className="p-3 flex items-center justify-between">
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
                                {product.stockType === 'fisico' ? 'Estoque' : 'Drop'}
                              </Badge>
                              <span className="text-sm font-semibold text-foreground">R$ {product.price}</span>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg flex items-center gap-2 text-xs text-muted-foreground">
                    <RefreshCw className="w-3.5 h-3.5 text-primary" />
                    <span>Produtos similares existentes foram substituídos 1:1 para manter o catálogo equilibrado</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 4: Push notification */}
          {step === 4 && (
            <motion.div key="s4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <Card>
                <CardContent className="p-6 text-center">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: 3 }}
                    className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4"
                  >
                    <BellRing className="w-8 h-8 text-success" />
                  </motion.div>
                  <h2 className="font-display font-bold text-lg text-foreground mb-2">Push Enviado ao Cliente!</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    O cliente foi notificado de que o serviço "{contextName}" já está disponível para contratação no ecossistema EcoMEI.
                  </p>
                  <Card className="border-success/30 max-w-sm mx-auto">
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
                      <p className="text-xs text-muted-foreground mt-1">"{contextName}" — 3 profissionais prontos. Toque para agendar.</p>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 5: Disponível no Hub */}
          {step === 5 && (
            <motion.div key="s5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <Card className="border-success">
                <CardContent className="p-6 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4"
                  >
                    <CheckCircle2 className="w-10 h-10 text-success" />
                  </motion.div>
                  <h2 className="font-display font-bold text-xl text-foreground mb-2">
                    Tudo Pronto! ✅
                  </h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    Os novos serviços e produtos foram integrados ao hub do EcoMEI.<br />
                    Agora qualquer cliente pode encontrá-los nas buscas.
                  </p>
                  <div className="grid sm:grid-cols-3 gap-3 mb-6">
                    <Card className="border-success/30">
                      <CardContent className="p-3 text-center">
                        <p className="text-2xl font-bold text-success">3</p>
                        <p className="text-xs text-muted-foreground">Profissionais adicionados</p>
                      </CardContent>
                    </Card>
                    <Card className="border-success/30">
                      <CardContent className="p-3 text-center">
                        <p className="text-2xl font-bold text-success">5</p>
                        <p className="text-xs text-muted-foreground">Produtos no estoque</p>
                      </CardContent>
                    </Card>
                    <Card className="border-success/30">
                      <CardContent className="p-3 text-center">
                        <p className="text-2xl font-bold text-primary">1</p>
                        <p className="text-xs text-muted-foreground">Substituição 1:1</p>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button className="gap-2" onClick={() => navigate('/')}>
                      <Search className="w-4 h-4" /> Buscar "{contextName}" agora
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={() => navigate('/client')}>
                      <ShoppingBag className="w-4 h-4" /> Ir ao App Cliente
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Manual navigation */}
        {step < steps.length - 1 && (
          <div className="flex justify-between">
            <Button variant="ghost" size="sm" disabled={step === 0} onClick={() => { setAutoAdvance(false); setStep(s => s - 1); }}>
              ← Anterior
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setAutoAdvance(false); setStep(s => s + 1); }}>
              Próximo →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportCenterDemo;
