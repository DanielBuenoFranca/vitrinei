import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Trash2, RefreshCw, Database, Package, Users, Plus, Pencil, Store, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import { ProviderForm } from '@/components/admin/ProviderForm';
import { ProductForm } from '@/components/admin/ProductForm';
import { ServiceForm } from '@/components/admin/ServiceForm';
import { SegmentForm } from '@/components/admin/SegmentForm';
import { ClearDataDialog } from '@/components/admin/ClearDataDialog';

interface Provider {
  id: number; name: string; type: string; segment: string;
  phone: string | null; email: string | null; address: string | null; city: string | null;
  distance: string; rating: number; active: boolean; created_at: string;
}

interface DynamicService {
  id: number; service_id: number; name: string; segment: string;
  provider: string; provider_id: number | null; price: number; rating: number;
  distance: string; time: string; products: string[]; created_at: string;
  labor_cost?: number; linked_product_ids?: number[];
}

interface DynamicProduct {
  id: number; product_id: number; name: string; price: number;
  provider: string; provider_id: number | null; stock_type: string;
  rating: number; distance: string; related_service_ids: number[];
  tags: string[]; created_at: string;
}

interface Segment {
  id: number; name: string; created_at: string;
}

const AdminPanel = () => {
  const navigate = useNavigate();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [services, setServices] = useState<DynamicService[]>([]);
  const [products, setProducts] = useState<DynamicProduct[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearDialog, setClearDialog] = useState(false);

  const [providerForm, setProviderForm] = useState<{ open: boolean; item: Provider | null }>({ open: false, item: null });
  const [productForm, setProductForm] = useState<{ open: boolean; item: DynamicProduct | null }>({ open: false, item: null });
  const [serviceForm, setServiceForm] = useState<{ open: boolean; item: DynamicService | null }>({ open: false, item: null });
  const [segmentForm, setSegmentForm] = useState<{ open: boolean; item: Segment | null }>({ open: false, item: null });

  const fetchData = async () => {
    setLoading(true);
    const [provRes, svcRes, prodRes, segRes] = await Promise.all([
      supabase.from('providers').select('*').order('created_at', { ascending: false }),
      supabase.from('dynamic_services').select('*').order('created_at', { ascending: false }),
      supabase.from('dynamic_products').select('*').order('created_at', { ascending: false }),
      supabase.from('segments').select('*').order('name'),
    ]);
    setProviders((provRes.data as Provider[]) || []);
    setServices((svcRes.data as DynamicService[]) || []);
    setProducts((prodRes.data as DynamicProduct[]) || []);
    setSegments((segRes.data as Segment[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const deleteProvider = async (id: number) => {
    await supabase.from('dynamic_services').delete().eq('provider_id', id);
    await supabase.from('dynamic_products').delete().eq('provider_id', id);
    await supabase.from('providers').delete().eq('id', id);
    fetchData();
  };
  const deleteService = async (id: number) => { await supabase.from('dynamic_services').delete().eq('id', id); fetchData(); };
  const deleteProduct = async (id: number) => { await supabase.from('dynamic_products').delete().eq('id', id); fetchData(); };
  const deleteSegment = async (id: number) => { await supabase.from('segments').delete().eq('id', id); fetchData(); };

  const providerList = providers.map(p => ({ id: p.id, name: p.name, segment: p.segment }));
  const segmentList = segments.map(s => ({ id: s.id, name: s.name }));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Database className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold">Painel Administrativo</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setClearDialog(true)}>
              <Trash2 className="h-4 w-4 mr-1" /> Limpar Dados
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { icon: Store, label: 'Prestadores', count: providers.length, color: 'bg-primary/10 text-primary' },
            { icon: Users, label: 'Serviços', count: services.length, color: 'bg-primary/10 text-primary' },
            { icon: Package, label: 'Produtos', count: products.length, color: 'bg-accent/20 text-accent-foreground' },
            { icon: Tag, label: 'Segmentos', count: segments.length, color: 'bg-secondary/50 text-secondary-foreground' },
            { icon: Database, label: 'Total', count: providers.length + services.length + products.length, color: 'bg-secondary/50 text-secondary-foreground' },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.count}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="providers">
          <TabsList>
            <TabsTrigger value="segments">Segmentos ({segments.length})</TabsTrigger>
            <TabsTrigger value="providers">Prestadores ({providers.length})</TabsTrigger>
            <TabsTrigger value="services">Serviços ({services.length})</TabsTrigger>
            <TabsTrigger value="products">Produtos ({products.length})</TabsTrigger>
          </TabsList>

          {/* ── SEGMENTS TAB ── */}
          <TabsContent value="segments">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Cadastro de Segmentos</CardTitle>
                  <CardDescription>Segmentos vinculados obrigatoriamente a prestadores, produtos e serviços</CardDescription>
                </div>
                <Button size="sm" onClick={() => setSegmentForm({ open: true, item: null })}>
                  <Plus className="h-4 w-4 mr-1" /> Novo Segmento
                </Button>
              </CardHeader>
              <CardContent>
                {segments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhum segmento cadastrado.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Prestadores</TableHead>
                          <TableHead>Serviços</TableHead>
                          <TableHead>Produtos</TableHead>
                          <TableHead>Criado em</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {segments.map(seg => {
                          const segProviders = providers.filter(p => p.segment === seg.name).length;
                          const segServices = services.filter(s => s.segment === seg.name).length;
                          // Products don't have segment directly but through provider
                          return (
                            <TableRow key={seg.id}>
                              <TableCell className="font-medium">
                                <Badge variant="outline">{seg.name}</Badge>
                              </TableCell>
                              <TableCell className="text-center">{segProviders}</TableCell>
                              <TableCell className="text-center">{segServices}</TableCell>
                              <TableCell className="text-center">—</TableCell>
                              <TableCell className="text-xs text-muted-foreground">
                                {new Date(seg.created_at).toLocaleDateString('pt-BR')}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSegmentForm({ open: true, item: seg })}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteSegment(seg.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── PROVIDERS TAB ── */}
          <TabsContent value="providers">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Cadastro de Prestadores (MEI / PF)</CardTitle>
                  <CardDescription>Profissionais vinculados à plataforma com seus serviços e estoque</CardDescription>
                </div>
                <Button size="sm" onClick={() => setProviderForm({ open: true, item: null })}>
                  <Plus className="h-4 w-4 mr-1" /> Novo Prestador
                </Button>
              </CardHeader>
              <CardContent>
                {providers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhum prestador cadastrado.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Segmento</TableHead>
                          <TableHead>Cidade</TableHead>
                          <TableHead>Distância</TableHead>
                          <TableHead>Avaliação</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Serviços</TableHead>
                          <TableHead>Produtos</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {providers.map((prov) => {
                          const provServices = services.filter(s => s.provider_id === prov.id || s.provider === prov.name);
                          const provProducts = products.filter(p => p.provider_id === prov.id || p.provider === prov.name);
                          return (
                            <TableRow key={prov.id}>
                              <TableCell className="font-medium">{prov.name}</TableCell>
                              <TableCell>
                                <Badge variant={prov.type === 'mei' ? 'default' : 'secondary'}>
                                  {prov.type === 'mei' ? 'MEI' : 'PF'}
                                </Badge>
                              </TableCell>
                              <TableCell><Badge variant="outline">{prov.segment}</Badge></TableCell>
                              <TableCell className="text-sm text-muted-foreground">{prov.city || '—'}</TableCell>
                              <TableCell>{prov.distance}</TableCell>
                              <TableCell>⭐ {prov.rating}</TableCell>
                              <TableCell>
                                <Badge variant={prov.active ? 'default' : 'secondary'} className={prov.active ? 'bg-green-500/10 text-green-600 border-green-500/20' : ''}>
                                  {prov.active ? 'Ativo' : 'Inativo'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">{provServices.length}</TableCell>
                              <TableCell className="text-center">{provProducts.length}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setProviderForm({ open: true, item: prov })}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteProvider(prov.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── SERVICES TAB ── */}
          <TabsContent value="services">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Serviços Dinâmicos</CardTitle>
                  <CardDescription>Serviços = Mão de Obra + Produtos vinculados</CardDescription>
                </div>
                <Button size="sm" onClick={() => setServiceForm({ open: true, item: null })}>
                  <Plus className="h-4 w-4 mr-1" /> Novo Serviço
                </Button>
              </CardHeader>
              <CardContent>
                {services.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhum serviço registrado.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Segmento</TableHead>
                          <TableHead>Prestador</TableHead>
                          <TableHead>Mão de Obra</TableHead>
                          <TableHead>Produtos</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Avaliação</TableHead>
                          <TableHead>Tempo</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {services.map((svc) => (
                          <TableRow key={svc.id}>
                            <TableCell className="font-medium">{svc.name}</TableCell>
                            <TableCell><Badge variant="secondary">{svc.segment}</Badge></TableCell>
                            <TableCell>
                              <span>{svc.provider}</span>
                              {svc.provider_id && <Badge variant="outline" className="ml-1 text-[10px]">ID:{svc.provider_id}</Badge>}
                            </TableCell>
                            <TableCell className="text-xs">R$ {(svc.labor_cost || 0).toFixed(2)}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1 max-w-[150px]">
                                {(svc.products || []).slice(0, 2).map((p, i) => (
                                  <Badge key={i} variant="secondary" className="text-[10px]">{p}</Badge>
                                ))}
                                {(svc.products || []).length > 2 && <Badge variant="secondary" className="text-[10px]">+{svc.products.length - 2}</Badge>}
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold text-primary">R$ {svc.price.toFixed(2)}</TableCell>
                            <TableCell>⭐ {svc.rating}</TableCell>
                            <TableCell>{svc.time}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setServiceForm({ open: true, item: svc })}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteService(svc.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── PRODUCTS TAB ── */}
          <TabsContent value="products">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Produtos de Estoque</CardTitle>
                  <CardDescription>Produtos vinculados ao estoque de cada prestador</CardDescription>
                </div>
                <Button size="sm" onClick={() => setProductForm({ open: true, item: null })}>
                  <Plus className="h-4 w-4 mr-1" /> Novo Produto
                </Button>
              </CardHeader>
              <CardContent>
                {products.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhum produto registrado.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Prestador</TableHead>
                          <TableHead>Preço</TableHead>
                          <TableHead>Tipo Estoque</TableHead>
                          <TableHead>Avaliação</TableHead>
                          <TableHead>Tags</TableHead>
                          <TableHead>Criado em</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.map((prod) => (
                          <TableRow key={prod.id}>
                            <TableCell className="font-medium">{prod.name}</TableCell>
                            <TableCell>
                              <span>{prod.provider}</span>
                              {prod.provider_id && <Badge variant="outline" className="ml-1 text-[10px]">ID:{prod.provider_id}</Badge>}
                            </TableCell>
                            <TableCell>R$ {prod.price}</TableCell>
                            <TableCell>
                              <Badge variant={prod.stock_type === 'drop' ? 'outline' : 'default'}>
                                {prod.stock_type === 'drop' ? 'Drop' : 'Físico'}
                              </Badge>
                            </TableCell>
                            <TableCell>⭐ {prod.rating}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1 max-w-[200px]">
                                {(prod.tags || []).slice(0, 3).map((tag, i) => (
                                  <Badge key={i} variant="secondary" className="text-[10px]">{tag}</Badge>
                                ))}
                                {(prod.tags || []).length > 3 && <Badge variant="secondary" className="text-[10px]">+{prod.tags.length - 3}</Badge>}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(prod.created_at).toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setProductForm({ open: true, item: prod })}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteProduct(prod.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Dialogs */}
      <ProviderForm open={providerForm.open} onClose={() => setProviderForm({ open: false, item: null })} onSaved={fetchData} provider={providerForm.item} segments={segmentList} />
      <ProductForm open={productForm.open} onClose={() => setProductForm({ open: false, item: null })} onSaved={fetchData} product={productForm.item} providers={providerList} segments={segmentList} />
      <ServiceForm open={serviceForm.open} onClose={() => setServiceForm({ open: false, item: null })} onSaved={fetchData} service={serviceForm.item} providers={providerList} segments={segmentList} />
      <SegmentForm open={segmentForm.open} onClose={() => setSegmentForm({ open: false, item: null })} onSaved={fetchData} segment={segmentForm.item} />
      <ClearDataDialog open={clearDialog} onClose={() => setClearDialog(false)} onCleared={fetchData} counts={{ providers: providers.length, services: services.length, products: products.length, segments: segments.length }} />
    </div>
  );
};

export default AdminPanel;
