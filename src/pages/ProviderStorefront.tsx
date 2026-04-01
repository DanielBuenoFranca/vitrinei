import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Zap, Sparkles, Clock, MapPin, DollarSign,
  ShoppingCart, Star, Package, Store, Plus, CheckCircle2, X, Trash2,
  CreditCard, AlertTriangle, Minus, Share2, ArrowLeft, ShoppingBag,
  Wrench as WrenchIcon, Phone, Mail, MapPinned, Copy, ExternalLink
} from 'lucide-react';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { segments as staticSegments, getAllServices, getAllProducts, reloadDynamicEntries, loadSegmentTagsCache, type ProductItem } from '@/data/searchData';
import { supabase } from '@/integrations/supabase/client';
import { useCart, type ServiceCartItem } from '@/contexts/CartContext';
import { ProductForm } from '@/components/admin/ProductForm';
import { ServiceForm } from '@/components/admin/ServiceForm';

interface ProviderData {
  id: number;
  name: string;
  segment: string[];
  type: string;
  rating: number;
  distance: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  active: boolean;
  logo_url?: string | null;
}

const slugify = (str: string) =>
  str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const ProviderStorefront = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [provider, setProvider] = useState<ProviderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);

  // Cart from global context
  const {
    productCart, productQuantities, serviceCart,
    showCartDetails, setShowCartDetails,
    clientCredit, paymentMethod, setPaymentMethod,
    paymentStep, setPaymentStep,
    toggleProductInCart, removeProductFromCart, updateProductQuantity, isInProductCart,
    toggleServiceInCart, isInServiceCart,
    totalCartItems, totalCartValue, needsTopUp, topUpAmount, creditUsed, remainingCredit,
    clearCart,
  } = useCart();

  // Provider inventory
  const [providerServices, setProviderServices] = useState<any[]>([]);
  const [providerProducts, setProviderProducts] = useState<ProductItem[]>([]);
  const [segmentTags, setSegmentTags] = useState<string[]>([]);
  const [dbSegments, setDbSegments] = useState<{ id: number; name: string }[]>([]);

  // Forms for adding products/services
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [serviceFormOpen, setServiceFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [editService, setEditService] = useState<any>(null);

  const loadProviderData = async (providerData?: ProviderData) => {
    const prov = providerData || provider;
    if (!prov) return;
    await reloadDynamicEntries();
    const allServices = getAllServices();
    const allProducts = getAllProducts();
    setProviderServices(allServices.filter((s: any) => s.provider === prov.name));
    setProviderProducts(allProducts.filter((p: any) => p.provider === prov.name));
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([reloadDynamicEntries(), loadSegmentTagsCache()]);

      // Fetch segments for forms
      const { data: segsData } = await supabase.from('segments').select('id, name').order('name');
      setDbSegments((segsData || []) as { id: number; name: string }[]);

      // Find provider by slug
      const { data: providers } = await supabase.from('providers').select('*').eq('active', true);
      if (providers) {
        const found = providers.find((p: any) => slugify(p.name) === slug);
        if (found) {
          setProvider(found as ProviderData);

          // Load segment tags
          const firstSeg = Array.isArray(found.segment) ? found.segment[0] : found.segment;
          const { data: segs } = await supabase.from('segments').select('*').eq('name', firstSeg);
          if (segs && segs[0]) setSegmentTags(segs[0].suggested_tags || []);

          // Filter inventory to this provider
          const allServices = getAllServices();
          const allProducts = getAllProducts();
          setProviderServices(allServices.filter((s: any) => s.provider === found.name));
          setProviderProducts(allProducts.filter((p: any) => p.provider === found.name));
        }
      }
      setLoading(false);
    };
    load();
  }, [slug]);

  // Search within provider inventory
  const filteredServices = searchQuery.trim()
    ? providerServices.filter((s: any) => {
        const q = searchQuery.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.segment.toLowerCase().includes(q) ||
          (s.products || []).some((p: string) => p.toLowerCase().includes(q));
      })
    : providerServices;

  const filteredProducts = searchQuery.trim()
    ? providerProducts.filter((p: any) => {
        const q = searchQuery.toLowerCase();
        return p.name.toLowerCase().includes(q) || (p.tags || []).some((t: string) => t.toLowerCase().includes(q));
      })
    : providerProducts;

  // Cart logic now comes from global CartContext

  const navigateToCheckout = () => {
    if (totalCartItems === 0) return;
    const params = new URLSearchParams({
      services: JSON.stringify(serviceCart.map(s => ({ name: s.name, provider: s.provider, price: s.price, rating: s.rating, distance: s.distance, time: s.time, segment: s.segment, products: s.products }))),
      products: JSON.stringify(productCart.map(p => ({ name: p.name, type: p.stockType, price: p.price, provider: p.provider, rating: p.rating, distance: p.distance, quantity: productQuantities.get(p.id) || 1 }))),
    });
    navigate(`/jornada-cliente?${params.toString()}`);
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`Confira a loja de ${provider?.name}: ${shareUrl}`)}`, '_blank');
  };

  const segIcon = (() => {
    if (!provider) return Sparkles;
    const segArr = Array.isArray(provider.segment) ? provider.segment : [provider.segment];
    const firstSeg = segArr[0] || '';
    const s = staticSegments.find(seg => seg.id === firstSeg || seg.label.toLowerCase().includes(firstSeg.toLowerCase()));
    return s?.icon || Store;
  })();
  const SegIcon = segIcon;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
          <Zap className="w-8 h-8 text-primary" />
        </motion.div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Store className="w-12 h-12 text-muted-foreground" />
        <h1 className="text-xl font-bold text-foreground">Prestador não encontrado</h1>
        <p className="text-sm text-muted-foreground">O link pode estar incorreto ou o prestador não está mais ativo.</p>
        <Button onClick={() => navigate('/')} className="gap-2"><ArrowLeft className="w-4 h-4" /> Voltar ao início</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Top bar */}
      <nav className="fixed top-0 w-full z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display text-sm font-bold text-foreground">EcoMEI</span>
            <ThemeSwitcher />
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={() => setShowShare(!showShare)}>
            <Share2 className="w-3.5 h-3.5" /> Compartilhar
          </Button>
        </div>
      </nav>

      {/* Share dropdown */}
      <AnimatePresence>
        {showShare && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="fixed top-14 right-4 z-50 bg-card border border-border rounded-xl shadow-xl p-3 w-64">
            <p className="text-xs font-semibold text-foreground mb-2">Compartilhar loja</p>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs" onClick={copyLink}>
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Link copiado!' : 'Copiar link'}
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs" onClick={shareWhatsApp}>
                <ExternalLink className="w-3.5 h-3.5" /> WhatsApp
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Provider Profile Header */}
      <section className="pt-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border bg-card overflow-hidden">
            {/* Banner gradient */}
            <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-accent/10 relative">
              <div className="absolute -bottom-8 left-6">
                {provider.logo_url ? (
                  <div className="w-16 h-16 rounded-2xl border-4 border-card shadow-lg overflow-hidden">
                    <img src={provider.logo_url} alt={provider.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-card border-4 border-card shadow-lg flex items-center justify-center">
                    <SegIcon className="w-8 h-8 text-primary" />
                  </div>
                )}
              </div>
            </div>

            <div className="pt-12 pb-5 px-6">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <h1 className="font-display text-xl font-bold text-foreground">{provider.name}</h1>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {(Array.isArray(provider.segment) ? provider.segment : [provider.segment]).map(seg => (
                      <Badge key={seg} className="bg-primary/10 text-primary border-primary/20 text-xs">{seg}</Badge>
                    ))}
                    <Badge variant="outline" className="text-[10px]">{provider.type === 'mei' ? 'MEI' : 'Pessoa Física'}</Badge>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="w-3 h-3 fill-accent text-accent" /> {provider.rating}
                    </span>
                    {provider.distance && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" /> {provider.distance}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact info */}
              <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                {provider.phone && (
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {provider.phone}</span>
                )}
                {provider.email && (
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {provider.email}</span>
                )}
                {provider.city && (
                  <span className="flex items-center gap-1"><MapPinned className="w-3 h-3" /> {provider.city}</span>
                )}
              </div>

              {/* Segment tags */}
              {segmentTags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {segmentTags.map(tag => (
                    <span key={tag} className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>
              )}

              {/* Stats + Management */}
              <div className="flex gap-4 mt-4 pt-3 border-t border-border items-center">
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">{providerServices.length}</p>
                  <p className="text-[10px] text-muted-foreground">Serviços</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">{providerProducts.length}</p>
                  <p className="text-[10px] text-muted-foreground">Produtos</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">{provider.rating}</p>
                  <p className="text-[10px] text-muted-foreground">Avaliação</p>
                </div>
                <div className="ml-auto flex gap-1.5">
                  <Button variant="outline" size="sm" className="gap-1 text-xs h-7" onClick={() => { setEditService(null); setServiceFormOpen(true); }}>
                    <Plus className="w-3 h-3" /> Serviço
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1 text-xs h-7" onClick={() => { setEditProduct(null); setProductFormOpen(true); }}>
                    <Plus className="w-3 h-3" /> Produto
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Search within store */}
      <section className="px-4 mt-4">
        <div className="container mx-auto max-w-3xl">
          <div className="relative flex items-center bg-card border border-border rounded-xl overflow-hidden">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Buscar em ${provider.name}...`}
              className="border-0 pl-9 pr-4 py-5 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
            />
          </div>
        </div>
      </section>

      {/* Catalog */}
      <section className="px-4 mt-4">
        <div className="container mx-auto max-w-3xl space-y-6">
          {/* Services */}
          {filteredServices.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-3">
                <WrenchIcon className="w-4 h-4 text-primary" /> Serviços ({filteredServices.length})
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {filteredServices.map((svc: any) => {
                  const seg = staticSegments.find(s => s.id === svc.segment);
                  const SIcon = seg?.icon || Sparkles;
                  return (
                    <Card key={svc.id}
                      className={`transition-all cursor-pointer group ${
                        isInServiceCart(svc.id)
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border/50 hover:border-primary/30 hover:shadow-md'
                      }`}
                      onClick={() => toggleServiceInCart(svc)}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isInServiceCart(svc.id) ? 'bg-primary/20' : 'bg-primary/10'}`}>
                            {isInServiceCart(svc.id) ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <SIcon className="w-4 h-4 text-primary" />}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-semibold text-sm text-foreground">{svc.name}</h4>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> R$ {svc.price}/hr</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {svc.time}</span>
                        </div>
                        {svc.products && svc.products.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {svc.products.slice(0, 3).map((p: string) => (
                              <Badge key={p} variant="secondary" className="text-[10px] px-1.5 py-0">
                                <Package className="w-2.5 h-2.5 mr-0.5" />{p}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <div className="mt-2 text-[10px] font-medium">
                          {isInServiceCart(svc.id)
                            ? <span className="text-primary flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> No carrinho</span>
                            : <span className="text-primary opacity-0 group-hover:opacity-100 flex items-center gap-1"><Plus className="w-3 h-3" /> Adicionar</span>}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Products */}
          {filteredProducts.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-3">
                <ShoppingBag className="w-4 h-4 text-success" /> Produtos ({filteredProducts.length})
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {filteredProducts.map((product: any) => (
                  <Card key={product.id}
                    className={`transition-all cursor-pointer group ${
                      isInProductCart(product.id)
                        ? 'border-success bg-success/5 shadow-sm'
                        : 'border-border/50 hover:border-success/40 hover:shadow-md'
                    }`}
                    onClick={() => toggleProductInCart(product)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isInProductCart(product.id) ? 'bg-success/20' : 'bg-success/10'}`}>
                            {isInProductCart(product.id) ? <CheckCircle2 className="w-4 h-4 text-success" /> : <Package className="w-4 h-4 text-success" />}
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm text-foreground">{product.name}</h4>
                            <Badge variant={product.stockType === 'fisico' ? 'default' : 'secondary'} className="text-[9px] px-1.5 py-0 mt-0.5">
                              {product.stockType === 'fisico' ? '📦 Estoque' : '🌍 Drop'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">R$ {product.price}</span>
                        <span>/{product.unit || 'un'}</span>
                        <span className="flex items-center gap-0.5"><Star className="w-2.5 h-2.5 fill-accent text-accent" /> {product.rating}</span>
                      </div>
                      {product.tags && product.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {product.tags.slice(0, 3).map((t: string) => (
                            <span key={t} className="text-[9px] text-muted-foreground bg-muted/40 px-1.5 rounded">{t}</span>
                          ))}
                        </div>
                      )}
                      <div className="mt-2 text-[10px] font-medium">
                        {isInProductCart(product.id)
                          ? <span className="text-success flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> No carrinho</span>
                          : <span className="text-success opacity-0 group-hover:opacity-100 flex items-center gap-1"><Plus className="w-3 h-3" /> Adicionar</span>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {filteredServices.length === 0 && filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Store className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {searchQuery ? `Nenhum resultado para "${searchQuery}" nesta loja.` : 'Este prestador ainda não possui itens cadastrados.'}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Cart is now rendered globally via CartBar */}
    </div>
  );
};

export default ProviderStorefront;
