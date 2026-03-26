import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { plans, clientProducts, clientServices } from '@/data/mockData';
import { ArrowLeft, Star, ShoppingBag, Wrench, CreditCard, Zap, CheckCircle2 } from 'lucide-react';
import ClientFlowDiagram from '@/components/flows/ClientFlowDiagram';

const tabs = [
  { id: 'plans', label: 'Planos', icon: CreditCard },
  { id: 'products', label: 'Produtos', icon: ShoppingBag },
  { id: 'services', label: 'Serviços', icon: Wrench },
];

const ClientApp = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('plans');
  const [selectedPlan, setSelectedPlan] = useState<string | null>('prata');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['plans', 'products', 'services'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const currentPlan = plans.find(p => p.id === selectedPlan);
  const discount = currentPlan?.discount || 0;

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

        {/* Tabs */}
        <div className="flex border-t border-border">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors border-b-2 ${
                activeTab === id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground'
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-8 space-y-4">
        {/* Plans Tab */}
        {activeTab === 'plans' && (
          <>
            <ClientFlowDiagram />
            <div className="text-center py-4">
              <h2 className="font-display text-xl font-bold text-foreground">Escolha seu plano</h2>
              <p className="text-sm text-muted-foreground mt-1">Benefícios exclusivos para assinantes</p>
            </div>
            {plans.map((plan) => (
              <Card
                key={plan.id}
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
                        <p className="text-xs text-muted-foreground">{plan.services}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-extrabold text-foreground">R$ {plan.price.toFixed(2).replace('.', ',')}</p>
                      <p className="text-xs text-muted-foreground">/mês</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {plan.features.slice(0, 3).map(f => (
                      <span key={f} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-primary" /> {f}
                      </span>
                    ))}
                  </div>
                  {selectedPlan === plan.id && (
                    <Button className="w-full mt-3" size="sm">Plano ativo ✓</Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <>
            {discount > 0 && (
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 text-center">
                <p className="text-sm font-medium text-primary">🎉 Seu plano {currentPlan?.name} dá <strong>{discount}% de desconto</strong> em todos os produtos!</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              {clientProducts.map((product) => {
                const discountedPrice = product.price * (1 - discount / 100);
                return (
                  <Card key={product.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="h-24 bg-muted flex items-center justify-center text-4xl">{product.image}</div>
                      <div className="p-3">
                        <p className="text-xs text-muted-foreground">{product.category}</p>
                        <h3 className="text-sm font-semibold text-foreground line-clamp-2 mt-0.5">{product.name}</h3>
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
                );
              })}
            </div>
          </>
        )}

        {/* Services Tab */}
        {activeTab === 'services' && (
          <>
            {currentPlan && (
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 text-center">
                <p className="text-sm font-medium text-primary">🔧 {currentPlan.services}</p>
              </div>
            )}
            {clientServices.map((service) => (
              <Card key={service.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center text-2xl shrink-0">
                      {service.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-foreground">{service.name}</h3>
                        <p className="text-sm font-bold text-foreground">R$ {service.price.toFixed(2).replace('.', ',')}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{service.provider}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-accent fill-accent" />
                          <span className="text-xs text-muted-foreground">{service.rating}</span>
                        </div>
                        <Button size="sm" className="text-xs h-7">Agendar</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default ClientApp;
