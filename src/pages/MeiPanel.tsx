import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { meiDashboard } from '@/data/mockData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { ArrowLeft, TrendingUp, Package, DollarSign, ShoppingCart, AlertTriangle, CheckCircle, XCircle, Zap, LayoutDashboard, Box, Wallet, BarChart3 } from 'lucide-react';
import MeiFlowDiagram from '@/components/flows/MeiFlowDiagram';
import DropshippingFlowDiagram from '@/components/flows/DropshippingFlowDiagram';
import FinancialFlowDiagram from '@/components/flows/FinancialFlowDiagram';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'stock', label: 'Estoque Drop-shipping', icon: Box },
  { id: 'financial', label: 'Financeiro', icon: Wallet },
];

const MeiPanel = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
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
        <div className="flex gap-1 px-3 pb-2">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
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
            </h1>
            <p className="text-muted-foreground mt-1">Bem-vindo, João — MEI Tecnologia & Acessórios</p>
          </div>

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Flow Diagram */}
              <MeiFlowDiagram />
              {/* KPI Cards */}
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

              {/* Revenue Chart */}
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

              {/* Top Products */}
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
                  <AlertTriangle className="w-6 h-6 text-warning mx-auto mb-2" />
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
        </div>
      </main>
    </div>
  );
};

export default MeiPanel;
