import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Zap, Sparkles, Clock, MapPin, DollarSign,
  ShoppingCart, Star, Package, Store, Plus, CheckCircle2, X, Trash2,
  CreditCard, AlertTriangle, Minus, Share2, ArrowLeft, ShoppingBag,
  Wrench as WrenchIcon, Phone, Mail, MapPinned, Copy, ExternalLink,
  Pencil, Palette, Settings, Eye, Facebook, Twitter, Instagram, Link2,
  Image as ImageIcon
} from 'lucide-react';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { segments as staticSegments, getAllServices, getAllProducts, reloadDynamicEntries, loadSegmentTagsCache, type ProductItem } from '@/data/searchData';
import { supabase } from '@/integrations/supabase/client';
import { useCart, type ServiceCartItem } from '@/contexts/CartContext';
import { ProductForm } from '@/components/admin/ProductForm';
import { ServiceForm } from '@/components/admin/ServiceForm';
import { ProviderForm } from '@/components/admin/ProviderForm';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';

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
  cpf_cnpj?: string | null;
  storefront_config?: StorefrontConfig;
}

interface StorefrontConfig {
  bannerColor1?: string;
  bannerColor2?: string;
  accentColor?: string;
  bannerText?: string;
  showPhone?: boolean;
  showEmail?: boolean;
  showAddress?: boolean;
}

const defaultConfig: StorefrontConfig = {
  bannerColor1: 'hsl(var(--primary))',
  bannerColor2: 'hsl(var(--accent))',
  accentColor: '',
  bannerText: '',
  showPhone: true,
  showEmail: true,
  showAddress: true,
};

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
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('catalog');

  // Customization
  const [config, setConfig] = useState<StorefrontConfig>(defaultConfig);
  const [savingConfig, setSavingConfig] = useState(false);

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

  const [providerServices, setProviderServices] = useState<any[]>([]);
  const [providerProducts, setProviderProducts] = useState<ProductItem[]>([]);
  const [segmentTags, setSegmentTags] = useState<string[]>([]);
  const [dbSegments, setDbSegments] = useState<{ id: number; name: string }[]>([]);
  const [allProviders, setAllProviders] = useState<{ id: number; name: string; segment: string[] }[]>([]);

  // Forms
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [serviceFormOpen, setServiceFormOpen] = useState(false);
  const [providerFormOpen, setProviderFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [editService, setEditService] = useState<any>(null);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; type: 'service' | 'product'; id: number; name: string }>({ open: false, type: 'service', id: 0, name: '' });

  const loadProviderData = async (providerData?: ProviderData) => {
    const prov = providerData || provider;
    if (!prov) return;
    await reloadDynamicEntries();
    const allServices = getAllServices();
    const allProducts = getAllProducts();
    setProviderServices(allServices.filter((s: any) => s.provider === prov.name || s.provider_id === prov.id));
    setProviderProducts(allProducts.filter((p: any) => p.provider === prov.name || p.provider_id === prov.id));
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([reloadDynamicEntries(), loadSegmentTagsCache()]);

      const [{ data: segsData }, { data: providers }, { data: allProvs }] = await Promise.all([
        supabase.from('segments').select('id, name').order('name'),
        supabase.from('providers').select('*').eq('active', true),
        supabase.from('providers').select('id, name, segment').eq('active', true),
      ]);
      setDbSegments((segsData || []) as { id: number; name: string }[]);
      setAllProviders((allProvs || []).map((p: any) => ({ id: p.id, name: p.name, segment: p.segment || [] })));

      if (providers) {
        const found = providers.find((p: any) => slugify(p.name) === slug);
        if (found) {
          const provData = found as ProviderData;
          setProvider(provData);
          setConfig({ ...defaultConfig, ...(provData.storefront_config || {}) });

          const firstSeg = Array.isArray(found.segment) ? found.segment[0] : found.segment;
          const { data: segs } = await supabase.from('segments').select('*').eq('name', firstSeg);
          if (segs && segs[0]) setSegmentTags(segs[0].suggested_tags || []);

          const allServices = getAllServices();
          const allProducts = getAllProducts();
          setProviderServices(allServices.filter((s: any) => s.provider === found.name || s.provider_id === found.id));
          setProviderProducts(allProducts.filter((p: any) => p.provider === found.name || p.provider_id === found.id));
        }
      }
      setLoading(false);
    };
    load();
  }, [slug]);

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

  const deleteService = async (id: number) => {
    await supabase.from('dynamic_services').delete().eq('id', id);
    toast.success('Serviço excluído');
    await loadProviderData();
  };

  const deleteProduct = async (id: number) => {
    await supabase.from('dynamic_products').delete().eq('id', id);
    toast.success('Produto excluído');
    await loadProviderData();
  };

  const saveConfig = async () => {
    if (!provider) return;
    setSavingConfig(true);
    const { error } = await supabase.from('providers').update({ storefront_config: config as any }).eq('id', provider.id);
    if (error) { toast.error('Erro ao salvar: ' + error.message); }
    else { toast.success('Visual da loja salvo!'); }
    setSavingConfig(false);
  };

  const navigateToCheckout = () => {
    if (totalCartItems === 0) return;
    const params = new URLSearchParams({
      services: JSON.stringify(serviceCart.map(s => ({ name: s.name, provider: s.provider, price: s.price, rating: s.rating, distance: s.distance, time: s.time, segment: s.segment, products: s.products }))),
      products: JSON.stringify(productCart.map(p => ({ name: p.name, type: p.stockType, price: p.price, provider: p.provider, rating: p.rating, distance: p.distance, quantity: productQuantities.get(p.id) || 1 }))),
    });
    navigate(`/jornada-cliente?${params.toString()}`);
  };

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/loja/${slug}` : '';
  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const shareWhatsApp = () => window.open(`https://wa.me/?text=${encodeURIComponent(`Confira a loja de ${provider?.name}: ${shareUrl}`)}`, '_blank');
  const shareFacebook = () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
  const shareTwitter = () => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`Confira a loja de ${provider?.name}!`)}`, '_blank');

  const segIcon = (() => {
    if (!provider) return Sparkles;
    const segArr = Array.isArray(provider.segment) ? provider.segment : [provider.segment];
    const firstSeg = segArr[0] || '';
    const s = staticSegments.find(seg => seg.id === firstSeg || seg.label.toLowerCase().includes(firstSeg.toLowerCase()));
    return s?.icon || Store;
  })();
  const SegIcon = segIcon;

  const bannerGradient = `linear-gradient(135deg, ${config.bannerColor1 || 'hsl(var(--primary))'} 0%, ${config.bannerColor2 || 'hsl(var(--accent))'} 100%)`;

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
          <div className="flex items-center gap-1.5">
            <Button
              variant={editMode ? 'default' : 'outline'}
              size="sm"
              className="gap-1.5 text-xs h-8"
              onClick={() => setEditMode(!editMode)}
            >
              {editMode ? <Eye className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
              {editMode ? 'Visualizar' : 'Gerenciar'}
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={() => setShowShare(!showShare)}>
              <Share2 className="w-3.5 h-3.5" /> Compartilhar
            </Button>
          </div>
        </div>
      </nav>

      {/* Share panel */}
      <AnimatePresence>
        {showShare && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="fixed top-14 right-4 z-50 bg-card border border-border rounded-xl shadow-xl p-4 w-72">
            <p className="text-xs font-semibold text-foreground mb-1">Compartilhar loja nas redes</p>
            <p className="text-[10px] text-muted-foreground mb-3">Divulgue sua loja para atrair mais clientes</p>
            <div className="bg-muted/50 rounded-lg p-2 mb-3 flex items-center gap-2">
              <Link2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="text-[10px] text-foreground truncate flex-1">{shareUrl}</span>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={copyLink}>
                {copied ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={shareWhatsApp}>
                <ExternalLink className="w-3.5 h-3.5" /> WhatsApp
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={shareFacebook}>
                <Facebook className="w-3.5 h-3.5" /> Facebook
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={shareTwitter}>
                <Twitter className="w-3.5 h-3.5" /> Twitter/X
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={copyLink}>
                <Copy className="w-3.5 h-3.5" /> {copied ? 'Copiado!' : 'Copiar Link'}
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
            {/* Banner gradient - customizable */}
            <div className="h-28 relative" style={{ background: bannerGradient }}>
              {config.bannerText && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white/90 font-bold text-lg drop-shadow-lg">{config.bannerText}</span>
                </div>
              )}
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
              {editMode && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="absolute top-2 right-2 gap-1 text-[10px] h-7 opacity-80 hover:opacity-100"
                  onClick={() => setProviderFormOpen(true)}
                >
                  <Pencil className="w-3 h-3" /> Editar Perfil
                </Button>
              )}
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
                {(config.showPhone !== false) && provider.phone && (
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {provider.phone}</span>
                )}
                {(config.showEmail !== false) && provider.email && (
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {provider.email}</span>
                )}
                {(config.showAddress !== false) && provider.city && (
                  <span className="flex items-center gap-1"><MapPinned className="w-3 h-3" /> {provider.city}{provider.address ? ` - ${provider.address}` : ''}</span>
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

              {/* Stats */}
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
                {editMode && (
                  <div className="ml-auto flex gap-1.5">
                    <Button variant="outline" size="sm" className="gap-1 text-xs h-7" onClick={() => { setEditService(null); setServiceFormOpen(true); }}>
                      <Plus className="w-3 h-3" /> Serviço
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1 text-xs h-7" onClick={() => { setEditProduct(null); setProductFormOpen(true); }}>
                      <Plus className="w-3 h-3" /> Produto
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tabs: Catalog / Customization */}
      <section className="px-4 mt-4">
        <div className="container mx-auto max-w-3xl">
          {editMode ? (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full">
                <TabsTrigger value="catalog" className="flex-1 gap-1"><Store className="w-3.5 h-3.5" /> Catálogo</TabsTrigger>
                <TabsTrigger value="customize" className="flex-1 gap-1"><Palette className="w-3.5 h-3.5" /> Visual da Loja</TabsTrigger>
              </TabsList>

              <TabsContent value="catalog" className="mt-4">
                {renderCatalog()}
              </TabsContent>

              <TabsContent value="customize" className="mt-4">
                {renderCustomizationPanel()}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="mt-4">
              {renderCatalog()}
            </div>
          )}
        </div>
      </section>

      {/* Forms */}
      {provider && (
        <>
          <ProductForm
            open={productFormOpen}
            onClose={() => { setProductFormOpen(false); setEditProduct(null); }}
            onSaved={async () => {
              // Reload provider data from DB in case name changed
              const { data: freshProv } = await supabase.from('providers').select('*').eq('id', provider.id).single();
              if (freshProv) setProvider(freshProv as ProviderData);
              await loadProviderData();
            }}
            product={editProduct}
            providers={allProviders}
            segments={dbSegments}
          />
          <ServiceForm
            open={serviceFormOpen}
            onClose={() => { setServiceFormOpen(false); setEditService(null); }}
            onSaved={async () => {
              await loadProviderData();
            }}
            service={editService}
            providers={[{ id: provider.id, name: provider.name, segment: Array.isArray(provider.segment) ? provider.segment : [provider.segment] }]}
            segments={dbSegments}
          />
          <ProviderForm
            open={providerFormOpen}
            onClose={() => setProviderFormOpen(false)}
            onSaved={async () => {
              // Reload provider
              const { data: freshProv } = await supabase.from('providers').select('*').eq('id', provider.id).single();
              if (freshProv) {
                setProvider(freshProv as ProviderData);
                setConfig({ ...defaultConfig, ...((freshProv.storefront_config as StorefrontConfig) || {}) });
              }
              await loadProviderData(freshProv as ProviderData);
            }}
            provider={provider}
            segments={dbSegments}
          />
        </>
      )}

      {/* Delete confirmation */}
      <Dialog open={deleteConfirm.open} onOpenChange={(v) => !v && setDeleteConfirm({ ...deleteConfirm, open: false })}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Excluir {deleteConfirm.type === 'service' ? 'Serviço' : 'Produto'}
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir <strong>{deleteConfirm.name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm({ ...deleteConfirm, open: false })}>Cancelar</Button>
            <Button variant="destructive" onClick={async () => {
              if (deleteConfirm.type === 'service') await deleteService(deleteConfirm.id);
              else await deleteProduct(deleteConfirm.id);
              setDeleteConfirm({ ...deleteConfirm, open: false });
            }}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  function renderCatalog() {
    return (
      <div className="space-y-6">
        {/* Search */}
        <div className="relative flex items-center bg-card border border-border rounded-xl overflow-hidden">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Buscar em ${provider?.name}...`}
            className="border-0 pl-9 pr-4 py-5 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
          />
        </div>

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
                    className={`transition-all group relative ${
                      isInServiceCart(svc.id)
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border/50 hover:border-primary/30 hover:shadow-md'
                    }`}>
                    <CardContent className="p-4 cursor-pointer" onClick={() => !editMode && toggleServiceInCart(svc)}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isInServiceCart(svc.id) ? 'bg-primary/20' : 'bg-primary/10'}`}>
                          {isInServiceCart(svc.id) ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <SIcon className="w-4 h-4 text-primary" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-sm text-foreground">{svc.name}</h4>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> R$ {svc.price}/{svc.unit || 'hr'}</span>
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
                      {!editMode && (
                        <div className="mt-2 text-[10px] font-medium">
                          {isInServiceCart(svc.id)
                            ? <span className="text-primary flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> No carrinho</span>
                            : <span className="text-primary opacity-0 group-hover:opacity-100 flex items-center gap-1"><Plus className="w-3 h-3" /> Adicionar</span>}
                        </div>
                      )}
                    </CardContent>
                    {editMode && (
                      <div className="absolute top-2 right-2 flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditService(svc); setServiceFormOpen(true); }}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteConfirm({ open: true, type: 'service', id: svc.id, name: svc.name })}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
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
                  className={`transition-all group relative ${
                    isInProductCart(product.id)
                      ? 'border-success bg-success/5 shadow-sm'
                      : 'border-border/50 hover:border-success/40 hover:shadow-md'
                  }`}>
                  <CardContent className="p-4 cursor-pointer" onClick={() => !editMode && toggleProductInCart(product)}>
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
                    {!editMode && (
                      <div className="mt-2 text-[10px] font-medium">
                        {isInProductCart(product.id)
                          ? <span className="text-success flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> No carrinho</span>
                          : <span className="text-success opacity-0 group-hover:opacity-100 flex items-center gap-1"><Plus className="w-3 h-3" /> Adicionar</span>}
                      </div>
                    )}
                  </CardContent>
                  {editMode && (
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditProduct(product); setProductFormOpen(true); }}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteConfirm({ open: true, type: 'product', id: product.id, name: product.name })}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
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
            {editMode && (
              <div className="flex gap-2 justify-center mt-4">
                <Button variant="outline" size="sm" className="gap-1" onClick={() => { setEditService(null); setServiceFormOpen(true); }}>
                  <Plus className="w-3 h-3" /> Adicionar Serviço
                </Button>
                <Button variant="outline" size="sm" className="gap-1" onClick={() => { setEditProduct(null); setProductFormOpen(true); }}>
                  <Plus className="w-3 h-3" /> Adicionar Produto
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  function renderCustomizationPanel() {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-5 space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Palette className="w-4 h-4 text-primary" /> Cores do Banner
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Cor Inicial</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={config.bannerColor1?.startsWith('#') ? config.bannerColor1 : '#6366f1'}
                      onChange={e => setConfig(c => ({ ...c, bannerColor1: e.target.value }))}
                      className="w-8 h-8 rounded cursor-pointer border border-border" />
                    <Input value={config.bannerColor1 || ''} onChange={e => setConfig(c => ({ ...c, bannerColor1: e.target.value }))}
                      className="text-xs h-8" placeholder="hsl(...) ou #hex" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Cor Final</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={config.bannerColor2?.startsWith('#') ? config.bannerColor2 : '#a855f7'}
                      onChange={e => setConfig(c => ({ ...c, bannerColor2: e.target.value }))}
                      className="w-8 h-8 rounded cursor-pointer border border-border" />
                    <Input value={config.bannerColor2 || ''} onChange={e => setConfig(c => ({ ...c, bannerColor2: e.target.value }))}
                      className="text-xs h-8" placeholder="hsl(...) ou #hex" />
                  </div>
                </div>
              </div>
              {/* Preview */}
              <div className="mt-3 h-12 rounded-lg" style={{ background: bannerGradient }} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Texto no Banner</Label>
              <Input value={config.bannerText || ''} onChange={e => setConfig(c => ({ ...c, bannerText: e.target.value }))}
                placeholder="Ex: Bem-vindo à minha loja!" className="text-sm" />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Visibilidade de Informações</h3>
              <div className="space-y-2">
                {[
                  { key: 'showPhone' as const, label: 'Mostrar Telefone', icon: Phone },
                  { key: 'showEmail' as const, label: 'Mostrar Email', icon: Mail },
                  { key: 'showAddress' as const, label: 'Mostrar Endereço', icon: MapPinned },
                ].map(item => (
                  <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={config[item.key] !== false}
                      onChange={e => setConfig(c => ({ ...c, [item.key]: e.target.checked }))}
                      className="rounded border-border" />
                    <item.icon className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs text-foreground">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button onClick={saveConfig} disabled={savingConfig} className="w-full gap-2">
              {savingConfig ? 'Salvando...' : 'Salvar Visual da Loja'}
            </Button>
          </CardContent>
        </Card>

        {/* Share section */}
        <Card>
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-primary" /> Link da sua Loja
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              Compartilhe este link nas redes sociais para atrair clientes diretamente para a sua loja.
            </p>
            <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-2 mb-3">
              <Link2 className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-xs text-foreground truncate flex-1 font-mono">{shareUrl}</span>
              <Button variant="outline" size="sm" className="h-7 px-3 text-xs gap-1" onClick={copyLink}>
                {copied ? <><CheckCircle2 className="w-3 h-3 text-green-500" /> Copiado!</> : <><Copy className="w-3 h-3" /> Copiar</>}
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={shareWhatsApp}>
                <ExternalLink className="w-3 h-3" /> WhatsApp
              </Button>
              <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={shareFacebook}>
                <Facebook className="w-3 h-3" /> Facebook
              </Button>
              <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={shareTwitter}>
                <Twitter className="w-3 h-3" /> Twitter
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
};

export default ProviderStorefront;
