import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { plans, clientProducts, clientServices, mockUser, checkEligibility, type ServiceItem, type EligibilityStatus } from '@/data/mockData';
import { ArrowLeft, Star, ShoppingBag, Wrench, CreditCard, Zap, CheckCircle2, Lock, Clock, ArrowUpCircle, Coins, ShieldCheck, Package, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ClientFlowDiagram from '@/components/flows/ClientFlowDiagram';

const tabs = [
  { id: 'plans', label: 'Planos', icon: CreditCard },
  { id: 'services', label: 'Serviços', icon: Wrench },
  { id: 'products', label: 'Produtos', icon: ShoppingBag },
  { id: 'coverage', label: 'Cobertura', icon: ShieldCheck },
];

const statusConfig: Record<EligibilityStatus, { label: string; color: string; icon: typeof CheckCircle2; badgeClass: string }> = {
  disponivel_total: { label: 'Disponível agora', color: 'text-green-600', icon: CheckCircle2, badgeClass: 'bg-green-100 text-green-700 border-green-200' },
  disponivel_parcial: { label: 'Complemento necessário', color: 'text-amber-600', icon: Coins, badgeClass: 'bg-amber-100 text-amber-700 border-amber-200' },
  bloqueado: { label: 'Não disponível', color: 'text-red-500', icon: Lock, badgeClass: 'bg-red-100 text-red-700 border-red-200' },
};

const ClientApp = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('plans');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(mockUser.plan);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [productFilter, setProductFilter] = useState<'all' | 'service'>('all');
  const [linkedServiceId, setLinkedServiceId] = useState<number | null>(null);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tabs.some(t => t.id === tab)) {
      setActiveTab(tab);
    }
    const svcId = searchParams.get('serviceId');
    if (svcId) {
      const svc = clientServices.find(s => s.id === parseInt(svcId));
      if (svc) setSelectedService(svc);
    }
  }, [searchParams]);

  const currentPlan = plans.find(p => p.id === selectedPlan);
  const discount = currentPlan?.discount || 0;
  const user = { ...mockUser, plan: (selectedPlan || 'prata') as typeof mockUser.plan };

  const getRelatedProducts = (service: ServiceItem) => {
    return clientProducts.filter(p => service.relatedProductIds.includes(p.id));
  };

  const handleServiceClick = (service: ServiceItem) => {
    setSelectedService(service);
  };

  const handleUseService = (service: ServiceItem) => {
    // Show related products
    setLinkedServiceId(service.id);
    setProductFilter('service');
    setActiveTab('products');
    setSelectedService(null);
  };

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto relative">
      {/* Mobile App Header */}
      <div className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <span className="font-display font-bold text-foreground">EcoMEI</span>
          </div>
          {currentPlan && (
            <Badge variant="secondary" className="text-xs">
              {currentPlan.id === 'bronze' ? '🥉' : currentPlan.id === 'prata' ? '🥈' : '🥇'} {currentPlan.name}
            </Badge>
          )}
        </div>

        {/* Credit Bar */}
        <div className="px-4 pb-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground flex items-center gap-1"><Coins className="w-3 h-3" /> Créditos</span>
            <span className="font-semibold text-foreground">{user.credits} / {currentPlan?.monthlyCredits || 0}</span>
          </div>
          <Progress value={(user.credits / (currentPlan?.maxAccumulation || 100)) * 100} className="h-2" />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>{user.monthsActive} meses ativo</span>
            <span>+{currentPlan?.loyaltyBonusPercent || 0}% bônus fidelidade</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-border">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => { setActiveTab(id); setSelectedService(null); }}
              className={`flex-1 flex items-center justify-center gap-1 py-3 text-[11px] font-medium transition-colors border-b-2 ${
                activeTab === id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-8 space-y-4">
        {/* CTA Demo */}
        <Card className="border-primary/30 bg-primary/5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/jornada-cliente')}>
          <CardContent className="p-3 flex items-center gap-3">
            <span className="text-2xl">🎬</span>
            <div className="flex-1">
              <p className="text-xs font-bold text-foreground">Ver Demo Interativa</p>
              <p className="text-[10px] text-muted-foreground">Jornada completa: escolha → agendamento → economia</p>
            </div>
            <ChevronRight className="w-4 h-4 text-primary" />
          </CardContent>
        </Card>

        {/* ═══ PLANS TAB ═══ */}
        {activeTab === 'plans' && (
          <>
            <ClientFlowDiagram />
            <div className="text-center py-4">
              <h2 className="font-display text-xl font-bold text-foreground">Escolha seu plano</h2>
              <p className="text-sm text-muted-foreground mt-1">Créditos mensais para consumir serviços e produtos</p>
            </div>
            {plans.map((plan) => (
              <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: plans.indexOf(plan) * 0.1 }}>
                <Card
                  className={`border-2 transition-all cursor-pointer ${
                    selectedPlan === plan.id ? 'border-primary shadow-lg' : 'border-border/50'
                  }`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{plan.id === 'bronze' ? '🥉' : plan.id === 'prata' ? '🥈' : '🥇'}</span>
                        <div>
                          <h3 className="font-bold text-foreground">{plan.name}</h3>
                          <p className="text-xs text-muted-foreground">{plan.monthlyCredits} créditos/mês</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-extrabold text-foreground">R$ {plan.price.toFixed(2).replace('.', ',')}</p>
                        <p className="text-xs text-muted-foreground">/mês</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {plan.features.slice(0, 4).map(f => (
                        <span key={f} className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5 text-primary" /> {f}
                        </span>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">+{plan.loyaltyBonusPercent}%/mês fidelidade • Máx {plan.maxAccumulation} créditos</span>
                      {selectedPlan === plan.id && (
                        <Button size="sm" className="text-xs h-7">Ativo ✓</Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </>
        )}

        {/* ═══ SERVICES TAB ═══ */}
        {activeTab === 'services' && !selectedService && (
          <>
            {currentPlan && (
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 text-center">
                <p className="text-sm font-medium text-primary">🔧 {currentPlan.services} • {user.credits} créditos disponíveis</p>
              </div>
            )}
            <div className="space-y-3">
              {clientServices.map((service) => {
                const elig = checkEligibility(service, user.credits, user.monthsActive, user.plan);
                const cfg = statusConfig[elig.status];
                const StatusIcon = cfg.icon;
                return (
                  <motion.div key={service.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: clientServices.indexOf(service) * 0.08 }}>
                    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleServiceClick(service)}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center text-2xl shrink-0">
                            {service.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-semibold text-foreground">{service.name}</h3>
                              <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg.badgeClass} flex items-center gap-1`}>
                                <StatusIcon className="w-3 h-3" /> {cfg.label}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{service.provider}</p>
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  <Star className="w-3 h-3 text-accent fill-accent" />
                                  <span className="text-xs text-muted-foreground">{service.rating}</span>
                                </div>
                                <span className="text-xs font-medium text-primary flex items-center gap-0.5">
                                  <Coins className="w-3 h-3" /> {service.creditCost} créditos
                                </span>
                              </div>
                              {service.relatedProductIds.length > 0 && (
                                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                  <Package className="w-3 h-3" /> {service.relatedProductIds.length} produtos
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}

        {/* ═══ SERVICE DETAIL (overlay) ═══ */}
        {activeTab === 'services' && selectedService && (
          <AnimatePresence>
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}>
              <Button variant="ghost" size="sm" className="mb-3 text-xs" onClick={() => setSelectedService(null)}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Voltar aos serviços
              </Button>

              {(() => {
                const elig = checkEligibility(selectedService, user.credits, user.monthsActive, user.plan);
                const cfg = statusConfig[elig.status];
                const StatusIcon = cfg.icon;
                const relatedProducts = getRelatedProducts(selectedService);

                return (
                  <div className="space-y-4">
                    {/* Service header */}
                    <Card>
                      <CardContent className="p-5">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center text-4xl">{selectedService.icon}</div>
                          <div>
                            <h2 className="font-display font-bold text-lg text-foreground">{selectedService.name}</h2>
                            <p className="text-sm text-muted-foreground">{selectedService.provider}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <Star className="w-3.5 h-3.5 text-accent fill-accent" />
                              <span className="text-sm font-medium">{selectedService.rating}</span>
                            </div>
                          </div>
                        </div>

                        {/* Status Banner */}
                        <div className={`rounded-xl p-4 border ${
                          elig.status === 'disponivel_total' ? 'bg-green-50 border-green-200' :
                          elig.status === 'disponivel_parcial' ? 'bg-amber-50 border-amber-200' :
                          'bg-red-50 border-red-200'
                        }`}>
                          <div className="flex items-center gap-2 mb-2">
                            <StatusIcon className={`w-5 h-5 ${cfg.color}`} />
                            <span className={`font-semibold text-sm ${cfg.color}`}>{cfg.label}</span>
                          </div>

                          {/* Credit breakdown */}
                          <div className="grid grid-cols-2 gap-3 mt-3">
                            <div className="text-center p-2 bg-background/80 rounded-lg">
                              <p className="text-[10px] text-muted-foreground">Seus créditos</p>
                              <p className="text-lg font-bold text-foreground">{user.credits}</p>
                            </div>
                            <div className="text-center p-2 bg-background/80 rounded-lg">
                              <p className="text-[10px] text-muted-foreground">Necessários</p>
                              <p className="text-lg font-bold text-foreground">{selectedService.creditCost}</p>
                            </div>
                          </div>

                          {elig.status === 'disponivel_parcial' && (
                            <div className="mt-3 p-2 bg-background/80 rounded-lg text-center">
                              <p className="text-xs text-muted-foreground">Diferença</p>
                              <p className="text-sm font-bold text-foreground">{selectedService.creditCost - user.credits} créditos = <span className="text-amber-600">R$ {elig.extraValue.toFixed(2).replace('.', ',')}</span></p>
                            </div>
                          )}

                          {elig.status === 'bloqueado' && (
                            <div className="mt-3 space-y-2">
                              {elig.monthsRemaining > 0 && (
                                <div className="flex items-center gap-2 text-xs text-red-600">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>Disponível em {elig.monthsRemaining} {elig.monthsRemaining === 1 ? 'mês' : 'meses'}</span>
                                </div>
                              )}
                              {elig.needsUpgrade && elig.suggestedPlan && (
                                <div className="flex items-center gap-2 text-xs text-red-600">
                                  <ArrowUpCircle className="w-3.5 h-3.5" />
                                  <span>Requer plano {plans.find(p => p.id === elig.suggestedPlan)?.name || elig.suggestedPlan}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-4 space-y-2">
                          {elig.status === 'disponivel_total' && (
                            <Button className="w-full" onClick={() => handleUseService(selectedService)}>
                              <CheckCircle2 className="w-4 h-4 mr-2" /> Usar agora ({elig.creditsUsed} créditos)
                            </Button>
                          )}
                          {elig.status === 'disponivel_parcial' && (
                            <Button className="w-full" onClick={() => handleUseService(selectedService)}>
                              <Coins className="w-4 h-4 mr-2" /> Usar ({elig.creditsUsed} créditos + R$ {elig.extraValue.toFixed(2).replace('.', ',')})
                            </Button>
                          )}
                          {elig.status === 'bloqueado' && (
                            <>
                              {elig.needsUpgrade && (
                                <Button className="w-full" onClick={() => { setActiveTab('plans'); setSelectedService(null); }}>
                                  <ArrowUpCircle className="w-4 h-4 mr-2" /> Fazer upgrade
                                </Button>
                              )}
                              <Button variant="outline" className="w-full" onClick={() => handleUseService(selectedService)}>
                                Pagar valor total (R$ {selectedService.monetaryValue.toFixed(2).replace('.', ',')})
                              </Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Related Products */}
                    {relatedProducts.length > 0 && (
                      <div>
                        <h3 className="font-display font-bold text-sm text-foreground mb-3 flex items-center gap-2">
                          <Package className="w-4 h-4 text-primary" /> Produtos para este serviço
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          {relatedProducts.map(product => {
                            const discountedPrice = product.price * (1 - discount / 100);
                            return (
                              <Card key={product.id} className="overflow-hidden">
                                <CardContent className="p-0">
                                  <div className="h-16 bg-muted flex items-center justify-center text-3xl">{product.image}</div>
                                  <div className="p-2.5">
                                    <p className="text-[10px] text-muted-foreground">{product.supplier}</p>
                                    <h4 className="text-xs font-semibold text-foreground line-clamp-2 mt-0.5">{product.name}</h4>
                                    <div className="mt-1.5">
                                      {discount > 0 && (
                                        <p className="text-[10px] text-muted-foreground line-through">R$ {product.price.toFixed(2).replace('.', ',')}</p>
                                      )}
                                      <p className="text-xs font-bold text-foreground">R$ {discountedPrice.toFixed(2).replace('.', ',')}</p>
                                    </div>
                                    <Button size="sm" className="w-full mt-1.5 text-[10px] h-6">Adicionar</Button>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Value reference */}
                    <Card className="border-dashed">
                      <CardContent className="p-3 text-center">
                        <p className="text-xs text-muted-foreground">Valor de referência sem plano</p>
                        <p className="text-lg font-bold text-muted-foreground line-through">R$ {selectedService.monetaryValue.toFixed(2).replace('.', ',')}</p>
                        {elig.status === 'disponivel_total' && (
                          <p className="text-xs text-green-600 font-medium mt-1">✨ Coberto 100% pelo seu plano!</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                );
              })()}
            </motion.div>
          </AnimatePresence>
        )}

        {/* ═══ PRODUCTS TAB ═══ */}
        {activeTab === 'products' && (
          <>
            {discount > 0 && (
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 text-center">
                <p className="text-sm font-medium text-primary">🎉 Seu plano {currentPlan?.name} dá <strong>{discount}% de desconto</strong> em todos os produtos!</p>
              </div>
            )}

            {/* Filter bar */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={productFilter === 'all' ? 'default' : 'outline'}
                className="text-xs h-7"
                onClick={() => { setProductFilter('all'); setLinkedServiceId(null); }}
              >
                Todos os produtos
              </Button>
              {linkedServiceId && (
                <Button
                  size="sm"
                  variant={productFilter === 'service' ? 'default' : 'outline'}
                  className="text-xs h-7"
                  onClick={() => setProductFilter('service')}
                >
                  <Package className="w-3 h-3 mr-1" />
                  Do serviço
                  <X className="w-3 h-3 ml-1 cursor-pointer" onClick={(e) => { e.stopPropagation(); setProductFilter('all'); setLinkedServiceId(null); }} />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {(productFilter === 'service' && linkedServiceId
                ? clientProducts.filter(p => p.relatedServiceIds.includes(linkedServiceId))
                : clientProducts
              ).map((product) => {
                const discountedPrice = product.price * (1 - discount / 100);
                return (
                  <motion.div key={product.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                    <Card className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="h-24 bg-muted flex items-center justify-center text-4xl">{product.image}</div>
                        <div className="p-3">
                          <p className="text-xs text-muted-foreground">{product.category}</p>
                          <h3 className="text-sm font-semibold text-foreground line-clamp-2 mt-0.5">{product.name}</h3>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{product.supplier}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-3 h-3 text-accent fill-accent" />
                            <span className="text-xs text-muted-foreground">{product.rating}</span>
                          </div>
                          <div className="mt-2">
                            {discount > 0 && (
                              <p className="text-xs text-muted-foreground line-through">R$ {product.price.toFixed(2).replace('.', ',')}</p>
                            )}
                            <p className="text-sm font-bold text-foreground">R$ {discountedPrice.toFixed(2).replace('.', ',')}</p>
                          </div>
                          <Button size="sm" className="w-full mt-2 text-xs h-8">Comprar</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}

        {/* ═══ COVERAGE TAB ═══ */}
        {activeTab === 'coverage' && (
          <>
            <div className="text-center py-2">
              <h2 className="font-display text-lg font-bold text-foreground">Sua Cobertura</h2>
              <p className="text-xs text-muted-foreground mt-1">Veja o que você pode usar com seu plano {currentPlan?.name}</p>
            </div>

            {/* Progression info */}
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" /> Progressão por Fidelidade
                </h3>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-background rounded-lg">
                    <p className="text-lg font-bold text-primary">{user.monthsActive}</p>
                    <p className="text-[10px] text-muted-foreground">Meses ativos</p>
                  </div>
                  <div className="p-2 bg-background rounded-lg">
                    <p className="text-lg font-bold text-foreground">{user.credits}</p>
                    <p className="text-[10px] text-muted-foreground">Créditos atuais</p>
                  </div>
                  <div className="p-2 bg-background rounded-lg">
                    <p className="text-lg font-bold text-accent-foreground">+{(currentPlan?.loyaltyBonusPercent || 0) * user.monthsActive}%</p>
                    <p className="text-[10px] text-muted-foreground">Bônus acumulado</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Services coverage */}
            <div className="space-y-3">
              {clientServices.map((service) => {
                const elig = checkEligibility(service, user.credits, user.monthsActive, user.plan);
                const cfg = statusConfig[elig.status];
                const StatusIcon = cfg.icon;
                const relatedProducts = getRelatedProducts(service);
                const coveragePercent = elig.status === 'disponivel_total' ? 100 :
                  elig.status === 'disponivel_parcial' ? Math.round((user.credits / service.creditCost) * 100) : 0;

                return (
                  <motion.div key={service.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: clientServices.indexOf(service) * 0.05 }}>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{service.icon}</span>
                            <div>
                              <h4 className="text-sm font-semibold text-foreground">{service.name}</h4>
                              <p className="text-[10px] text-muted-foreground">{service.creditCost} créditos • Mín. {service.minMonths} meses</p>
                            </div>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border ${cfg.badgeClass} flex items-center gap-0.5`}>
                            <StatusIcon className="w-2.5 h-2.5" />
                            {elig.status === 'disponivel_total' ? '100%' :
                             elig.status === 'disponivel_parcial' ? `${coveragePercent}%` : '0%'}
                          </span>
                        </div>
                        <Progress value={coveragePercent} className="h-1.5 mb-2" />
                        <div className="flex items-center justify-between">
                          <div className="text-[10px] text-muted-foreground">
                            {elig.status === 'disponivel_total' && '✅ Cobertura total pelo plano'}
                            {elig.status === 'disponivel_parcial' && `💳 Complemento: R$ ${elig.extraValue.toFixed(2).replace('.', ',')}`}
                            {elig.status === 'bloqueado' && elig.monthsRemaining > 0 && `⏳ Faltam ${elig.monthsRemaining} meses`}
                            {elig.status === 'bloqueado' && elig.needsUpgrade && `⬆️ Requer plano ${plans.find(p => p.id === elig.suggestedPlan)?.name}`}
                          </div>
                          {relatedProducts.length > 0 && (
                            <span className="text-[10px] text-primary">{relatedProducts.length} produtos inclusos</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* Usage Suggestions */}
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm text-foreground mb-3">💡 Sugestões de uso</h3>
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground p-2 bg-background rounded-lg">
                    🎯 <strong>Dica:</strong> Contrate um Eletricista e ganhe desconto nos materiais elétricos — fio, fita isolante e interruptores já vêm sugeridos!
                  </div>
                  <div className="text-xs text-muted-foreground p-2 bg-background rounded-lg">
                    📈 <strong>Progressão:</strong> Com mais {6 - user.monthsActive} meses você desbloqueia o serviço de Fotógrafo de Eventos
                  </div>
                  <div className="text-xs text-muted-foreground p-2 bg-background rounded-lg">
                    💰 <strong>Economia:</strong> Seu plano já economizou R$ {(user.totalCreditsEarned * 1.8).toFixed(2).replace('.', ',')} em serviços no período
                  </div>
                  {selectedPlan !== 'ouro' && (
                    <div className="text-xs text-muted-foreground p-2 bg-primary/5 rounded-lg border border-primary/20">
                      ⬆️ <strong>Upgrade:</strong> Com o plano Ouro você teria {plans[2].monthlyCredits} créditos/mês e acesso a todos os serviços!
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default ClientApp;
