import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { meiDashboard } from '@/data/mockData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { ArrowLeft, TrendingUp, Package, DollarSign, ShoppingCart, AlertTriangle, CheckCircle, XCircle, Zap, LayoutDashboard, Box, Wallet, Wrench, Users, Lightbulb, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import MeiFlowDiagram from '@/components/flows/MeiFlowDiagram';
import DropshippingFlowDiagram from '@/components/flows/DropshippingFlowDiagram';
import FinancialFlowDiagram from '@/components/flows/FinancialFlowDiagram';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'stock', label: 'Estoque', icon: Box },
  { id: 'financial', label: 'Financeiro', icon: Wallet },
  { id: 'services', label: 'Serviços', icon: Wrench },
  { id: 'insights', label: 'Insights', icon: Lightbulb },
];

const MeiPanel = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tabs.some(t => t.id === tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);
  const d = meiDashboard;

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
      available: { label: 'Disponível', variant: 'default' },
      low_stock: { label: 'Estoque baixo', variant: 'secondary' },
      out_of_stock: { label: 'Esgotado', variant: 'destructive' },
    };
    const s = map[status] || map.available;
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  const totalServiceRevenue = d.servicesPerformed.reduce((sum, s) => sum + s.revenue, 0);
  const totalProductUpsell = d.servicesPerformed.reduce((sum, s) => sum + s.productRevenue, 0);
  const totalJobs = d.servicesPerformed.reduce((sum, s) => sum + s.completedJobs, 0);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border hidden md:flex flex-col">
        <div className="p-4 flex items-center gap-2 border-b border-sidebar-border">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <Zap className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <span className="font-display text-lg font-bold text-sidebar-foreground">EcoMEI</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === id
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <Button variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground/60" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao site
          </Button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 w-full z-50 bg-card border-b border-border">
        <div className="flex items-center justify-between p-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}><ArrowLeft className="w-4 h-4" /></Button>
          <span className="font-display font-bold text-foreground">Painel MEI</span>
          <div className="w-8" />
        </div>
        <div className="flex gap-1 px-3 pb-2 overflow-x-auto">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors shrink-0 ${
                activeTab === id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 mt-24 md:mt-0 overflow-auto">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
              {activeTab === 'dashboard' && 'Dashboard'}
              {activeTab === 'stock' && 'Estoque Drop-shipping'}
              {activeTab === 'financial' && 'Gestão Financeira'}
              {activeTab === 'services' && 'Serviços Prestados'}
              {activeTab === 'insights' && 'Insights & Sugestões'}
            </h1>
            <p className="text-muted-foreground mt-1">Bem-vindo, João — MEI Tecnologia & Acessórios</p>
          </div>

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <MeiFlowDiagram />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Receita Total', value: `R$ ${d.revenue.total.toLocaleString('pt-BR')}`, icon: DollarSign, change: `+${d.revenue.growth}%` },
                  { label: 'Pedidos', value: d.orders.total.toString(), icon: ShoppingCart, change: `${d.orders.pending} pendentes` },
                  { label: 'Concluídos', value: d.orders.completed.toString(), icon: CheckCircle, change: '91% taxa' },
                  { label: 'Este mês', value: `R$ ${d.revenue.thisMonth.toLocaleString('pt-BR')}`, icon: TrendingUp, change: '+12% vs anterior' },
                ].map(({ label, value, icon: Icon, change }) => (
                  <Card key={label}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium text-muted-foreground">{label}</p>
                        <Icon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <p className="text-xl font-bold text-foreground">{value}</p>
                      <p className="text-xs text-primary mt-1">{change}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Receita Mensal</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={d.revenueChart}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip />
                        <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Top Produtos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {d.topProducts.map((p, i) => (
                      <div key={p.name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-muted-foreground w-6">{i + 1}.</span>
                          <div>
                            <p className="text-sm font-medium text-foreground">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.sold} vendidos</p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-foreground">R$ {p.revenue.toLocaleString('pt-BR')}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Stock Tab */}
          {activeTab === 'stock' && (
            <div className="space-y-6">
              <DropshippingFlowDiagram />
              <div className="grid grid-cols-3 gap-4">
                <Card><CardContent className="p-4 text-center">
                  <Package className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">{d.stock.length}</p>
                  <p className="text-xs text-muted-foreground">Produtos</p>
                </CardContent></Card>
                <Card><CardContent className="p-4 text-center">
                  <AlertTriangle className="w-6 h-6 text-accent mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">{d.stock.filter(s => s.status === 'low_stock').length}</p>
                  <p className="text-xs text-muted-foreground">Estoque baixo</p>
                </CardContent></Card>
                <Card><CardContent className="p-4 text-center">
                  <XCircle className="w-6 h-6 text-destructive mx-auto mb-2" />
                  <p className="text-2xl font-bold text-foreground">{d.stock.filter(s => s.status === 'out_of_stock').length}</p>
                  <p className="text-xs text-muted-foreground">Esgotados</p>
                </CardContent></Card>
              </div>

              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-4 font-medium text-muted-foreground">Produto</th>
                          <th className="text-left p-4 font-medium text-muted-foreground">Fornecedor</th>
                          <th className="text-center p-4 font-medium text-muted-foreground">Qtd</th>
                          <th className="text-right p-4 font-medium text-muted-foreground">Preço</th>
                          <th className="text-center p-4 font-medium text-muted-foreground">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {d.stock.map((item) => (
                          <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                            <td className="p-4 font-medium text-foreground">{item.name}</td>
                            <td className="p-4 text-muted-foreground">{item.supplier}</td>
                            <td className="p-4 text-center text-foreground">{item.qty}</td>
                            <td className="p-4 text-right text-foreground">R$ {item.price.toFixed(2).replace('.', ',')}</td>
                            <td className="p-4 text-center">{statusBadge(item.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Financial Tab */}
          {activeTab === 'financial' && (
            <div className="space-y-6">
              <FinancialFlowDiagram />
              <div className="grid grid-cols-3 gap-4">
                <Card><CardContent className="p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Saldo Atual</p>
                  <p className="text-2xl font-bold text-foreground">R$ {d.financials.balance.toLocaleString('pt-BR')}</p>
                </CardContent></Card>
                <Card><CardContent className="p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-1">A Receber</p>
                  <p className="text-2xl font-bold text-primary">R$ {d.financials.accountsReceivable.toLocaleString('pt-BR')}</p>
                </CardContent></Card>
                <Card><CardContent className="p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-1">A Pagar</p>
                  <p className="text-2xl font-bold text-destructive">R$ {d.financials.accountsPayable.toLocaleString('pt-BR')}</p>
                </CardContent></Card>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Fluxo de Caixa — Últimos 6 dias</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={d.financials.cashFlow}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                        <Tooltip />
                        <Bar dataKey="income" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Receita" />
                        <Bar dataKey="expense" fill="hsl(var(--destructive) / 0.6)" radius={[4, 4, 0, 0]} name="Despesa" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ═══ SERVICES TAB ═══ */}
          {activeTab === 'services' && (
            <div className="space-y-6">
              {/* KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card><CardContent className="p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Jobs Concluídos</p>
                  <p className="text-2xl font-bold text-foreground">{totalJobs}</p>
                  <p className="text-xs text-primary mt-1">Este período</p>
                </CardContent></Card>
                <Card><CardContent className="p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Receita Serviços</p>
                  <p className="text-2xl font-bold text-foreground">R$ {totalServiceRevenue.toLocaleString('pt-BR')}</p>
                </CardContent></Card>
                <Card><CardContent className="p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Produtos Vendidos</p>
                  <p className="text-2xl font-bold text-foreground">{d.servicesPerformed.reduce((s, x) => s + x.productsUpsold, 0)}</p>
                  <p className="text-xs text-primary mt-1">via upsell</p>
                </CardContent></Card>
                <Card><CardContent className="p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Ganho Agregado</p>
                  <p className="text-2xl font-bold text-primary">R$ {totalProductUpsell.toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-muted-foreground mt-1">produtos + serviços</p>
                </CardContent></Card>
              </div>

              {/* Services Performance */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">Performance por Serviço</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {d.servicesPerformed.map((svc, i) => (
                      <motion.div
                        key={svc.serviceId}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-4 rounded-xl bg-muted/50 border border-border"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-sm text-foreground">{svc.name}</h4>
                            <p className="text-xs text-muted-foreground">{svc.completedJobs} jobs concluídos</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 text-accent fill-accent" />
                            <span className="text-sm font-medium text-foreground">{svc.avgRating}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div className="text-center p-2 bg-background rounded-lg">
                            <p className="text-xs text-muted-foreground">Serviço</p>
                            <p className="text-sm font-bold text-foreground">R$ {svc.revenue.toLocaleString('pt-BR')}</p>
                          </div>
                          <div className="text-center p-2 bg-background rounded-lg">
                            <p className="text-xs text-muted-foreground">Produtos</p>
                            <p className="text-sm font-bold text-primary">R$ {svc.productRevenue.toLocaleString('pt-BR')}</p>
                          </div>
                          <div className="text-center p-2 bg-background rounded-lg">
                            <p className="text-xs text-muted-foreground">Total</p>
                            <p className="text-sm font-bold text-foreground">R$ {(svc.revenue + svc.productRevenue).toLocaleString('pt-BR')}</p>
                          </div>
                        </div>

                        <div className="mt-3">
                          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                            <span>Receita de produtos vs serviço</span>
                            <span>{Math.round((svc.productRevenue / (svc.revenue + svc.productRevenue)) * 100)}%</span>
                          </div>
                          <Progress value={(svc.productRevenue / (svc.revenue + svc.productRevenue)) * 100} className="h-1.5" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Aggregated earnings */}
              <Card className="border-primary/30 bg-primary/5">
                <CardContent className="p-5 text-center">
                  <Users className="w-8 h-8 text-primary mx-auto mb-2" />
                  <h3 className="font-display font-bold text-foreground">Ganhos Agregados</h3>
                  <p className="text-3xl font-extrabold text-primary mt-2">R$ {(totalServiceRevenue + totalProductUpsell).toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Serviços (R$ {totalServiceRevenue.toLocaleString('pt-BR')}) + Produtos upsell (R$ {totalProductUpsell.toLocaleString('pt-BR')})
                  </p>
                  <p className="text-xs text-primary mt-1">
                    💡 Produtos correlacionados representam {Math.round((totalProductUpsell / (totalServiceRevenue + totalProductUpsell)) * 100)}% do faturamento total
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ═══ INSIGHTS TAB ═══ */}
          {activeTab === 'insights' && (
            <div className="space-y-6">
              <div className="text-center py-4">
                <Lightbulb className="w-10 h-10 text-accent mx-auto mb-3" />
                <h2 className="font-display text-xl font-bold text-foreground">Sugestões Inteligentes</h2>
                <p className="text-sm text-muted-foreground mt-1">Baseadas na performance do seu negócio</p>
              </div>

              <div className="space-y-3">
                {d.meiSuggestions.map((suggestion, i) => {
                  const typeConfig: Record<string, { border: string; bg: string }> = {
                    upsell: { border: 'border-primary/30', bg: 'bg-primary/5' },
                    expansion: { border: 'border-accent/30', bg: 'bg-accent/5' },
                    retention: { border: 'border-secondary', bg: 'bg-secondary/30' },
                    pricing: { border: 'border-muted', bg: 'bg-muted/50' },
                  };
                  const tc = typeConfig[suggestion.type] || typeConfig.upsell;

                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.12 }}
                    >
                      <Card className={`${tc.border} ${tc.bg}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl">{suggestion.icon}</span>
                            <div>
                              <Badge variant="secondary" className="text-[10px] mb-2">
                                {suggestion.type === 'upsell' ? 'Venda cruzada' :
                                 suggestion.type === 'expansion' ? 'Expansão' :
                                 suggestion.type === 'retention' ? 'Retenção' : 'Precificação'}
                              </Badge>
                              <p className="text-sm text-foreground leading-relaxed">{suggestion.message}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>

              {/* Coverage suggestion for client */}
              <Card className="border-dashed border-2 border-primary/30">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-sm text-foreground mb-3">🎯 Como o sistema de créditos beneficia seu negócio</h3>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <p>• <strong className="text-foreground">Serviço + Produtos:</strong> Quando um cliente contrata seu serviço de Eletricista, o app sugere automaticamente fio, fita isolante e interruptores — você ganha comissão em ambos</p>
                    <p>• <strong className="text-foreground">Fidelização:</strong> Clientes com plano ativo tendem a usar serviços recorrentes — sua base de receita se torna previsível</p>
                    <p>• <strong className="text-foreground">Cobertura progressiva:</strong> Quanto mais tempo o cliente permanece, mais serviços premium ele acessa — incluindo os seus</p>
                    <p>• <strong className="text-foreground">Complemento:</strong> Mesmo com créditos insuficientes, o cliente pode complementar com pagamento — você nunca perde a venda</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MeiPanel;
