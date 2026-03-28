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
  UserPlus, BellRing, Truck, AlertTriangle, RefreshCw, Pause
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AiAvatar } from '@/components/AiAvatarGlobal';
import { addDynamicEntries, segments, type DynamicEntry } from '@/data/searchData';

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
  const [progress, setProgress] = useState(0);
  const [showPush, setShowPush] = useState(false);
  const [paused, setPaused] = useState(false);
  const [injectedItems, setInjectedItems] = useState(false);

  // Parse user-selected suggestions
  const userSelections: string[] = suggestionsParam ? (() => { try { return JSON.parse(suggestionsParam); } catch { return []; } })() : [];

  // Derive context name from query
  const contextName = query.split(',')[0]?.trim() || query;
  const contextTitle = contextName.charAt(0).toUpperCase() + contextName.slice(1);

  // Find segment info
  const segInfo = segments.find(s => s.id === segmentParam);
  const segmentLabel = segInfo?.label || contextTitle;

  // Generate contextual professionals and products based on the query
  const newProviders = [
    { name: `${contextTitle} - Ana Mendes`, rating: 4.9, distance: '1.8 km', price: 120, specialty: `Especialista em ${contextTitle}` },
    { name: `${contextTitle} - Carlos Lima`, rating: 4.7, distance: '3.2 km', price: 95, specialty: `Profissional ${segmentLabel}` },
  ];

  const newProducts = [
    { name: userSelections.find(s => s.toLowerCase().includes('produto') || s.toLowerCase().includes('kit')) || `Kit ${contextTitle} Profissional`, price: 89, provider: newProviders[0].name, stockType: 'fisico' as const },
    { name: `${contextTitle} - Produto Essencial`, price: 45, provider: newProviders[0].name, stockType: 'fisico' as const },
    { name: `Acessório ${contextTitle} Premium`, price: 65, provider: newProviders[1].name, stockType: 'drop' as const },
  ];

  // Web-researched related services (simulated)
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

  const steps = [
    { title: 'Análise da Solicitação', icon: FileText, desc: 'IA analisando contexto' },
    { title: 'Pesquisa na Região', icon: Search, desc: 'Buscando profissionais' },
    { title: 'Profissionais Encontrados', icon: UserPlus, desc: '2 profissionais localizados' },
    { title: 'Pesquisa Web de Serviços', icon: Sparkles, desc: 'Pesquisando serviços relacionados' },
    { title: 'Produtos Adicionados', icon: Package, desc: 'Estoque atualizado' },
    { title: 'Push Enviado', icon: BellRing, desc: 'Notificação ao cliente' },
    { title: 'Disponível no Hub', icon: CheckCircle2, desc: 'Integrado ao ecossistema' },
  ];

  // Step-by-step with pause at each conclusion
  const advanceStep = useCallback(() => {
    if (paused) return;
    setStep(s => {
      const next = s + 1;
      if (next < steps.length) {
        // Auto-pause at steps 2, 3, 4 (showing results)
        if (next === 2 || next === 3 || next === 4) {
          setPaused(true);
        }
        return next;
      }
      return s;
    });
  }, [paused, steps.length]);

  useEffect(() => {
    if (paused) return;
    const timings = [2500, 4000, 0, 3000, 0, 2000, 0];
    if (step < steps.length - 1 && timings[step] > 0) {
      const timer = setTimeout(advanceStep, timings[step]);
      return () => clearTimeout(timer);
    }
  }, [step, paused, advanceStep]);

  // Progress bar for step 1
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

  // Show push notification at step 5
  useEffect(() => {
    if (step === 5) {
      setTimeout(() => setShowPush(true), 500);
      setTimeout(() => setShowPush(false), 4000);
    }
  }, [step]);

  // Inject items at final step
  useEffect(() => {
    if (step === 6 && !injectedItems) {
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
      addDynamicEntries(entries);
      setInjectedItems(true);
    }
  }, [step, injectedItems]);

  const continueSimulation = () => {
    setPaused(false);
    setStep(s => s + 1);
  };

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
                      O serviço "{contextTitle}" que você solicitou já está disponível! 2 profissionais prontos para atender.
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
        <div className="flex items-center justify-between gap-1 overflow-x-auto pb-2">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isDone = i < step;
            return (
              <motion.div
                key={i}
                className={`flex flex-col items-center flex-1 min-w-[40px] ${i < steps.length - 1 ? 'relative' : ''}`}
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
                <p className="text-[8px] text-center mt-1 text-muted-foreground hidden sm:block">{s.title}</p>
                {i < steps.length - 1 && (
                  <div className={`absolute top-4 left-[calc(50%+16px)] right-[calc(-50%+16px)] h-0.5 ${isDone ? 'bg-success' : 'bg-border'}`} />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Pause indicator */}
        {paused && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center gap-2">
            <Badge className="bg-warning/10 text-warning border-warning/20 text-xs gap-1">
              <Pause className="w-3 h-3" /> Simulação pausada — análise concluída
            </Badge>
            <Button size="sm" className="gap-1 text-xs" onClick={continueSimulation}>
              <Play className="w-3 h-3" /> Continuar
            </Button>
          </motion.div>
        )}

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
                    {userSelections.length > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Opções selecionadas pelo cliente:</p>
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
                      <p className="text-xs font-semibold text-foreground mb-2">📋 Resumo para a Central:</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        <li>• Necessidade: {contextTitle}</li>
                        <li>• Segmento: {segmentLabel}</li>
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
                      <h2 className="font-display font-bold text-foreground">Pesquisando na Região</h2>
                      <p className="text-xs text-muted-foreground">Buscando profissionais de {segmentLabel}...</p>
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
                          <CheckCircle2 className="w-3 h-3 text-success" /> Consultando base de profissionais de {segmentLabel}...
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
                      <h2 className="font-display font-bold text-foreground">2 Profissionais Encontrados!</h2>
                      <p className="text-xs text-muted-foreground">Profissionais de {segmentLabel} verificados e prontos</p>
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
                              <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-accent text-accent" /> {provider.rating}</span>
                              <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {provider.distance}</span>
                              <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> R$ {provider.price}</span>
                            </div>
                            <div className="mt-2 flex gap-1">
                              {newProducts.filter(p => p.provider === provider.name).map((product, pidx) => (
                                <Badge key={pidx} variant="secondary" className="text-[9px] px-1.5 py-0">
                                  <Package className="w-2 h-2 mr-0.5" /> {product.name.slice(0, 25)}
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
                    <span>Substituindo profissional existente para manter o equilíbrio do hub (máx. 5 por área)</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Pesquisa web de serviços */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-accent-foreground" />
                    </div>
                    <div>
                      <h2 className="font-display font-bold text-foreground">Pesquisa Web — Serviços Relacionados</h2>
                      <p className="text-xs text-muted-foreground">IA pesquisou na web os 3 serviços mais comuns + 3 produtos populares</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1">
                        <Search className="w-3.5 h-3.5 text-primary" /> Serviços mais comuns encontrados
                      </p>
                      <div className="space-y-2">
                        {webResearchedServices.map((svc, idx) => (
                          <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.2 }}>
                            <Card className="border-primary/20">
                              <CardContent className="p-3 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                  <Sparkles className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-sm text-foreground">{svc.name}</h4>
                                  <p className="text-[11px] text-muted-foreground">{svc.description}</p>
                                </div>
                                <Badge className="bg-accent/10 text-accent-foreground text-[9px] shrink-0">🌐 Web</Badge>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1">
                        <ShoppingBag className="w-3.5 h-3.5 text-success" /> Produtos mais comuns encontrados
                      </p>
                      <div className="space-y-2">
                        {webResearchedProducts.map((prod, idx) => (
                          <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + idx * 0.2 }}>
                            <Card className="border-success/20">
                              <CardContent className="p-3 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                                  <ShoppingBag className="w-4 h-4 text-success" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-sm text-foreground">{prod.name}</h4>
                                  <p className="text-[11px] text-muted-foreground">{prod.description}</p>
                                </div>
                                <Badge className="bg-accent/10 text-accent-foreground text-[9px] shrink-0">🌐 Web</Badge>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {userSelections.length > 0 && (
                      <div className="bg-success/5 border border-success/20 rounded-lg p-3">
                        <p className="text-xs font-semibold text-foreground mb-1">✅ Somando ao que o cliente selecionou:</p>
                        <div className="flex flex-wrap gap-1">
                          {userSelections.map((sel, i) => (
                            <Badge key={i} className="bg-success/10 text-success text-[10px]">{sel}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 4: Produtos adicionados */}
          {step === 4 && (
            <motion.div key="s4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                      <Package className="w-6 h-6 text-success" />
                    </div>
                    <div>
                      <h2 className="font-display font-bold text-foreground">Produtos Adicionados ao Estoque</h2>
                      <p className="text-xs text-muted-foreground">{newProducts.length} produtos distribuídos (1 estoque próprio + 1 drop-shipping)</p>
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

          {/* Step 5: Push notification */}
          {step === 5 && (
            <motion.div key="s5" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
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
                    O cliente foi notificado de que "{contextTitle}" já está disponível para contratação no ecossistema EcoMEI.
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
                      <p className="text-xs text-muted-foreground mt-1">"{contextTitle}" — 2 profissionais prontos. Toque para agendar.</p>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Step 6: Disponível no Hub */}
          {step === 6 && (
            <motion.div key="s6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
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
                    Os novos serviços e produtos de <strong>{segmentLabel}</strong> foram integrados ao hub.<br />
                    Agora qualquer cliente pode encontrá-los nas buscas.
                  </p>
                  <div className="grid sm:grid-cols-3 gap-3 mb-6">
                    <Card className="border-success/30">
                      <CardContent className="p-3 text-center">
                        <p className="text-2xl font-bold text-success">2</p>
                        <p className="text-xs text-muted-foreground">Profissionais adicionados</p>
                      </CardContent>
                    </Card>
                    <Card className="border-success/30">
                      <CardContent className="p-3 text-center">
                        <p className="text-2xl font-bold text-success">{newProducts.length}</p>
                        <p className="text-xs text-muted-foreground">Produtos no estoque</p>
                      </CardContent>
                    </Card>
                    <Card className="border-success/30">
                      <CardContent className="p-3 text-center">
                        <p className="text-2xl font-bold text-primary">1:1</p>
                        <p className="text-xs text-muted-foreground">Substituição aplicada</p>
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
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Manual navigation */}
        {step < steps.length - 1 && !paused && (
          <div className="flex justify-between">
            <Button variant="ghost" size="sm" disabled={step === 0} onClick={() => setStep(s => s - 1)}>
              ← Anterior
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setPaused(false); setStep(s => s + 1); }}>
              Próximo →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportCenterDemo;
