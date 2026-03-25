import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { plans } from '@/data/mockData';
import { BarChart3, ShoppingCart, Users, Shield, ArrowRight, Star, Zap, TrendingUp, CheckCircle2 } from 'lucide-react';
import CoverageFlowDiagram from '@/components/landing/CoverageFlowDiagram';
import TransactionSequenceDiagram from '@/components/landing/TransactionSequenceDiagram';
import EcosystemMindmap from '@/components/landing/EcosystemMindmap';

const Landing = () => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState('prata');

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">EcoMEI</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Funcionalidades</a>
            <a href="#plans" className="hover:text-foreground transition-colors">Planos</a>
            <a href="#ecosystem" className="hover:text-foreground transition-colors">Ecossistema</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/client')}>App Cliente</Button>
            <Button size="sm" onClick={() => navigate('/mei')}>Painel MEI</Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container mx-auto text-center relative">
          <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm font-medium">
            🚀 Ecossistema completo para MEIs
          </Badge>
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-extrabold text-foreground mb-6 leading-tight tracking-tight">
            Gestão inteligente.<br />
            <span className="text-primary">Crescimento real.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Mini ERP + Marketplace de Serviços + Dropchip + Benefícios por Assinatura. 
            Tudo em uma plataforma SaaS pensada para o microempreendedor brasileiro.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-base px-8 gap-2" onClick={() => navigate('/mei')}>
              Ver Painel do MEI <ArrowRight className="w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" className="text-base px-8 gap-2" onClick={() => navigate('/client')}>
              Ver App do Cliente <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 max-w-3xl mx-auto">
            {[
              { label: 'MEIs ativos', value: '2.450+' },
              { label: 'Transações/mês', value: 'R$ 1.2M' },
              { label: 'Serviços realizados', value: '8.900+' },
              { label: 'Clientes assinantes', value: '12.000+' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 bg-card">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">O ecossistema completo</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">Cada módulo foi pensado para resolver uma dor real do MEI brasileiro</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: BarChart3, title: 'Mini ERP', desc: 'Fluxo de caixa, DRE simplificado, contas a pagar/receber e relatórios automáticos.' },
              { icon: ShoppingCart, title: 'Dropchip', desc: 'Catálogo unificado de fornecedores com envio automático e sync de estoque em tempo real.' },
              { icon: Users, title: 'Marketplace', desc: 'Listagem de serviços profissionais, agendamento, check-in e avaliações.' },
              { icon: Shield, title: 'Assinaturas', desc: 'Planos Bronze, Prata e Ouro com descontos progressivos e cobertura de serviços.' },
            ].map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="border-border/50 hover:shadow-lg hover:border-primary/20 transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-foreground mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Ecosystem Flow */}
      <section id="ecosystem" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">Como funciona</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">Um ecossistema que conecta MEIs, fornecedores e clientes em um único lugar</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: '01', title: 'MEI cadastra e configura', desc: 'O MEI se cadastra, configura seu Mini ERP, lista produtos/serviços e conecta fornecedores dropchip.', icon: TrendingUp },
              { step: '02', title: 'Cliente assina um plano', desc: 'O cliente final escolhe um plano (Bronze, Prata ou Ouro) e acessa o App de Benefícios com descontos.', icon: Star },
              { step: '03', title: 'Vendas e serviços fluem', desc: 'Pedidos são gerados automaticamente, fornecedores executam e o MEI acompanha tudo pelo ERP.', icon: Zap },
            ].map(({ step, title, desc, icon: Icon }) => (
              <div key={step} className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-accent/20 flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-8 h-8 text-accent-foreground" />
                </div>
                <p className="text-sm font-bold text-primary mb-2">PASSO {step}</p>
                <h3 className="font-display font-bold text-xl text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Flow Diagrams */}
      <section className="py-20 px-4 bg-card">
        <div className="container mx-auto space-y-20">
          <CoverageFlowDiagram />
          <TransactionSequenceDiagram />
          <EcosystemMindmap />
        </div>
      </section>

      {/* Plans */}
      <section id="plans" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">Planos para o Cliente Final</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">Benefícios escalonados que geram receita recorrente para o ecossistema</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`relative border-2 transition-all duration-300 cursor-pointer ${
                  selectedPlan === plan.id ? 'border-primary shadow-xl scale-105' : 'border-border/50 hover:border-primary/30'
                }`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-3">Mais popular</Badge>
                  </div>
                )}
                <CardContent className="p-6 pt-8">
                  <div className="w-10 h-10 rounded-full mb-4 mx-auto" style={{ backgroundColor: plan.color + '33', border: `2px solid ${plan.color}` }}>
                    <div className="w-full h-full flex items-center justify-center text-lg">
                      {plan.id === 'bronze' ? '🥉' : plan.id === 'prata' ? '🥈' : '🥇'}
                    </div>
                  </div>
                  <h3 className="font-display font-bold text-xl text-foreground text-center">{plan.name}</h3>
                  <div className="text-center my-4">
                    <span className="text-3xl font-extrabold text-foreground">R$ {plan.price.toFixed(2).replace('.', ',')}</span>
                    <span className="text-muted-foreground text-sm">/mês</span>
                  </div>
                  <ul className="space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full mt-6" variant={selectedPlan === plan.id ? 'default' : 'outline'}>
                    Selecionar plano
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">Pronto para ver em ação?</h2>
          <p className="text-muted-foreground text-lg mb-8">Navegue entre o Painel do MEI e o App do Cliente para explorar todas as funcionalidades</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="px-8 gap-2" onClick={() => navigate('/mei')}>
              <BarChart3 className="w-5 h-5" /> Explorar Painel MEI
            </Button>
            <Button size="lg" variant="outline" className="px-8 gap-2" onClick={() => navigate('/client')}>
              <ShoppingCart className="w-5 h-5" /> Explorar App Cliente
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
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
