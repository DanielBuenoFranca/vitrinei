import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Zap, Sparkles, Clock, MapPin, DollarSign,
  ShoppingCart, Star, Package, Store, Plus, CheckCircle2, X, Trash2,
  CreditCard, AlertTriangle, Minus, Share2, ArrowLeft, ShoppingBag,
  Wrench as WrenchIcon, Phone, Mail, MapPinned, Copy, ExternalLink,
  Pencil, Palette, Settings, Eye, Facebook, Twitter, Instagram, Link2,
  Image as ImageIcon, Send, Undo2, RotateCcw, ChevronLeft, ChevronRight,
  MessageCircle, Download, RefreshCw, Upload
} from 'lucide-react';
import { FavoriteButton } from '@/components/FavoriteButton';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { segments as staticSegments, getAllServices, getAllProducts, reloadDynamicEntries, loadSegmentTagsCache, type ProductItem } from '@/data/searchData';
import { supabase } from '@/integrations/supabase/client';
import { useCart, type ServiceCartItem } from '@/contexts/CartContext';
import { ProductForm } from '@/components/admin/ProductForm';
import { ServiceForm } from '@/components/admin/ServiceForm';
import { ProviderForm } from '@/components/admin/ProviderForm';
import { KitBuilder } from '@/components/storefront/KitBuilder';
import { toast } from 'sonner';
import { MaskedPrice, AccessBanner, useAccessLevel } from '@/components/AccessGate';
import { useConversion } from '@/contexts/ConversionContext';
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
  backgroundColor?: string;
  bannerText?: string;
  showPhone?: boolean;
  showEmail?: boolean;
  showAddress?: boolean;
  banners?: BannerSlide[];
}

interface BannerSlide {
  id: string;
  color1: string;
  color2: string;
  text: string;
  imageUrl?: string;
}

const BANNER_TEXT_MAX = 40;

const defaultConfig: StorefrontConfig = {
  bannerColor1: '#6366f1',
  bannerColor2: '#a855f7',
  accentColor: '',
  backgroundColor: '',
  bannerText: '',
  showPhone: true,
  showEmail: true,
  showAddress: true,
  banners: [],
};

const slugify = (str: string) =>
  str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const ProviderStorefront = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const accessLevel = useAccessLevel();
  const { trackStoreVisit } = useConversion();
  const [provider, setProvider] = useState<ProviderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showShare, setShowShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('catalog');

  // Customization
  const [config, setConfig] = useState<StorefrontConfig>(defaultConfig);
  const [configHistory, setConfigHistory] = useState<StorefrontConfig[]>([]);
  const [originalConfig, setOriginalConfig] = useState<StorefrontConfig>(defaultConfig);
  const [savingConfig, setSavingConfig] = useState(false);

  // Banner carousel
  const [currentBannerIdx, setCurrentBannerIdx] = useState(0);
  const bannerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // AI Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

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
  const [dbSegments, setDbSegments] = useState<{ id: number; name: string; image_url?: string | null }[]>([]);
  const [allProviders, setAllProviders] = useState<{ id: number; name: string; segment: string[] }[]>([]);

  // Forms
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [serviceFormOpen, setServiceFormOpen] = useState(false);
  const [providerFormOpen, setProviderFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [editService, setEditService] = useState<any>(null);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; type: 'service' | 'product'; id: number; name: string }>({ open: false, type: 'service', id: 0, name: '' });
  const [generatingLogo, setGeneratingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [kitBuilderOpen, setKitBuilderOpen] = useState(false);
  const bannerFileRef = useRef<HTMLInputElement>(null);

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
        supabase.from('segments').select('id, name, image_url').order('name'),
        supabase.from('providers').select('*'),
        supabase.from('providers').select('id, name, segment'),
      ]);
      setDbSegments((segsData || []) as { id: number; name: string; image_url?: string | null }[]);
      setAllProviders((allProvs || []).map((p: any) => ({ id: p.id, name: p.name, segment: p.segment || [] })));

      if (providers) {
        const found = providers.find((p: any) => slugify(p.name) === slug);
        if (found) {
          const provData = found as ProviderData;
          setProvider(provData);
          trackStoreVisit(provData.name);
          const cfg = { ...defaultConfig, ...((provData.storefront_config as StorefrontConfig) || {}) };
          setConfig(cfg);
          setOriginalConfig(JSON.parse(JSON.stringify(cfg)));

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

  // Banner auto-rotation
  const banners = config.banners && config.banners.length > 0 ? config.banners : null;
  const totalBanners = banners ? banners.length : 1;

  useEffect(() => {
    if (!banners || banners.length <= 1 || editMode) return;
    bannerIntervalRef.current = setInterval(() => {
      setCurrentBannerIdx(prev => (prev + 1) % banners.length);
    }, 5000);
    return () => { if (bannerIntervalRef.current) clearInterval(bannerIntervalRef.current); };
  }, [banners, editMode]);

  // Chat scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // When edit mode turns off, close chat
  useEffect(() => {
    if (!editMode) {
      setChatMessages([]);
      setChatInput('');
      setActiveTab('catalog');
    } else {
      // Welcome message
      setChatMessages([{
        role: 'assistant',
        content: `👋 Olá! Sou seu assistente de design. Estou aqui para te ajudar a deixar sua loja com a sua cara!\n\nPosso alterar cores, banners, textos, fundos e muito mais. O que você gostaria de mudar? 🎨`
      }]);
    }
  }, [editMode]);

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

  const pushConfigHistory = useCallback(() => {
    setConfigHistory(prev => [...prev, JSON.parse(JSON.stringify(config))]);
  }, [config]);

  const undoConfig = useCallback(() => {
    setConfigHistory(prev => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setConfig(last);
      return prev.slice(0, -1);
    });
    toast.info('Alteração desfeita');
  }, []);

  const resetConfig = useCallback(() => {
    pushConfigHistory();
    setConfig(JSON.parse(JSON.stringify(originalConfig)));
    toast.info('Loja restaurada ao padrão original');
  }, [originalConfig, pushConfigHistory]);

  const applyAiChanges = useCallback((changes: Record<string, any>) => {
    pushConfigHistory();
    setConfig(prev => {
      const next = { ...prev };
      Object.entries(changes).forEach(([key, value]) => {
        (next as any)[key] = value;
      });
      return next;
    });
    toast.success('Alteração visual aplicada!');
  }, [pushConfigHistory]);

  const saveConfig = async () => {
    if (!provider) return;
    setSavingConfig(true);
    const { data: updated, error } = await supabase.from('providers').update({ storefront_config: config as any }).eq('id', provider.id).select().single();
    if (error) { toast.error('Erro ao salvar: ' + error.message); }
    else {
      toast.success('Visual da loja salvo!');
      setOriginalConfig(JSON.parse(JSON.stringify(config)));
      setConfigHistory([]);
      if (updated) setProvider(updated as ProviderData);
    }
    setSavingConfig(false);
  };

  // Generate logo via saneamento (respeita economia: usa Unsplash/Pixabay quando IA off / sem créditos)
  const generateLogo = async () => {
    if (!provider) return;
    setGeneratingLogo(true);
    try {
      const seg = Array.isArray(provider.segment) ? provider.segment[0] : provider.segment;
      const resp = await supabase.functions.invoke('sanitize-images', {
        body: { kind: 'provider', id: provider.id, name: provider.name, segment: seg },
      });
      if (resp.error) throw new Error(resp.error.message);
      const logoUrl = (resp.data as any)?.imageUrl || (resp.data as any)?.logoUrl;
      if (logoUrl) {
        const { data: updated } = await supabase.from('providers').update({ logo_url: logoUrl }).eq('id', provider.id).select().single();
        if (updated) setProvider(updated as ProviderData);
        toast.success((resp.data as any)?.source === 'ai' ? 'Logo gerado pela IA!' : 'Logo aplicado sem consumir créditos');
      }
    } catch (e: any) {
      toast.warning('Não foi possível obter imagem — faça upload manual', { icon: '🤖', duration: 5000 });
    }
    setGeneratingLogo(false);
  };

  // Download logo
  const downloadLogo = () => {
    if (!provider?.logo_url) return;
    const a = document.createElement('a');
    a.href = provider.logo_url;
    a.download = `logo-${provider.name.toLowerCase().replace(/\s+/g, '-')}.png`;
    a.target = '_blank';
    a.click();
  };

  // Upload banner image file
  const handleBannerFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, bannerIdx?: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    const fileName = `banner-${provider?.id}-${Date.now()}.${file.name.split('.').pop()}`;
    const { error: uploadError } = await supabase.storage.from('provider-logos').upload(fileName, file, { contentType: file.type, upsert: true });
    if (uploadError) { toast.error('Erro no upload: ' + uploadError.message); setUploadingBanner(false); return; }
    const { data: urlData } = supabase.storage.from('provider-logos').getPublicUrl(fileName);
    const imageUrl = urlData.publicUrl;
    if (bannerIdx !== undefined) {
      updateBannerSlide(bannerIdx, { imageUrl });
    } else {
      pushConfigHistory();
      setConfig(c => ({ ...c, bannerColor1: '', bannerColor2: '', bannerText: c.bannerText }));
    }
    toast.success('Imagem enviada!');
    setUploadingBanner(false);
    if (bannerFileRef.current) bannerFileRef.current.value = '';
  };

  // AI Chat
  const sendChatMessage = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading || !provider) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    const allMessages = [...chatMessages, userMsg];

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/storefront-ai-designer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: allMessages.map(m => ({ role: m.role, content: m.content })),
          providerName: provider.name,
          currentConfig: config,
        }),
      });

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => ({ error: 'Erro desconhecido' }));
        setChatMessages(prev => [...prev, { role: 'assistant', content: `🤖 [AI off] — O assistente está temporariamente indisponível. Tente novamente mais tarde.` }]);
        setChatLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let assistantText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantText += content;
              setChatMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant' && prev.length > allMessages.length) {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantText } : m);
                }
                return [...prev, { role: 'assistant', content: assistantText }];
              });
            }
          } catch { /* partial JSON */ }
        }
      }

      // Parse AI actions from response
      if (assistantText) {
        const actionMatch = assistantText.match(/\{"action"\s*:\s*"([^"]+)"(?:\s*,\s*"changes"\s*:\s*(\{[^}]+\}))?/);
        if (actionMatch) {
          const action = actionMatch[1];
          if (action === 'undo') {
            undoConfig();
          } else if (action === 'reset') {
            resetConfig();
          } else if (action === 'apply_change' && actionMatch[2]) {
            try {
              const changes = JSON.parse(actionMatch[2]);
              applyAiChanges(changes);
            } catch { /* ignore parse errors */ }
          }
        }
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'assistant', content: '🤖 [AI off] — Conexão indisponível. O fluxo continua normalmente sem IA.' }]);
    }

    setChatLoading(false);
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
  const copyLink = () => { navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); };
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

  // Current banner
  const getCurrentBanner = (): { gradient: string; text: string; imageUrl?: string } => {
    if (banners && banners.length > 0) {
      const b = banners[currentBannerIdx % banners.length];
      return {
        gradient: `linear-gradient(135deg, ${b.color1 || '#6366f1'} 0%, ${b.color2 || '#a855f7'} 100%)`,
        text: b.text || '',
        imageUrl: b.imageUrl,
      };
    }
    return {
      gradient: `linear-gradient(135deg, ${config.bannerColor1 || '#6366f1'} 0%, ${config.bannerColor2 || '#a855f7'} 100%)`,
      text: config.bannerText || '',
    };
  };
  const currentBanner = getCurrentBanner();

  // Add/edit/remove banner slides
  const addBannerSlide = () => {
    if ((config.banners || []).length >= 3) { toast.error('Máximo de 3 banners'); return; }
    const id = Date.now().toString();
    pushConfigHistory();
    setConfig(prev => ({
      ...prev,
      banners: [...(prev.banners || []), { id, color1: '#6366f1', color2: '#a855f7', text: '' }],
    }));
  };

  const updateBannerSlide = (idx: number, updates: Partial<BannerSlide>) => {
    pushConfigHistory();
    setConfig(prev => ({
      ...prev,
      banners: (prev.banners || []).map((b, i) => i === idx ? { ...b, ...updates } : b),
    }));
  };

  const removeBannerSlide = (idx: number) => {
    pushConfigHistory();
    setConfig(prev => ({
      ...prev,
      banners: (prev.banners || []).filter((_, i) => i !== idx),
    }));
    toast.success('Banner removido');
  };

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
    <div className="min-h-screen pb-24" style={{ backgroundColor: config.backgroundColor || undefined }}>
      <AccessBanner />
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
            <span className="font-display text-sm font-bold text-foreground">Vitrinei</span>
            <ThemeSwitcher />
          </div>
          <div className="flex items-center gap-2">
            {/* Toggle switch for edit mode */}
            <div className="flex items-center gap-1.5">
              <Label htmlFor="edit-toggle" className="text-[10px] text-muted-foreground cursor-pointer">
                {editMode ? '🎨 Editando' : '👁️ Vitrine'}
              </Label>
              <Switch
                id="edit-toggle"
                checked={editMode}
                onCheckedChange={setEditMode}
                className="data-[state=checked]:bg-primary"
              />
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8" onClick={() => setShowShare(!showShare)}>
              <Share2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Share panel */}
      <AnimatePresence>
        {showShare && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="fixed top-14 right-4 z-50 bg-card border border-border rounded-xl shadow-xl p-4 w-72">
            <p className="text-xs font-semibold text-foreground mb-1">Compartilhar loja</p>
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

      {/* ──────────────── HERO MAGAZINE ──────────────── */}
      <section className="pt-14">
        <div className="relative">
          {/* Banner backdrop full-bleed */}
          <div className="relative h-56 sm:h-72 overflow-hidden">
            {currentBanner.imageUrl ? (
              <>
                <img src={currentBanner.imageUrl} alt="Banner" className="absolute inset-0 w-full h-full object-cover scale-105" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-background" />
              </>
            ) : (
              <>
                <div className="absolute inset-0" style={{ background: currentBanner.gradient }} />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_55%),radial-gradient(circle_at_80%_70%,rgba(0,0,0,0.25),transparent_60%)]" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
              </>
            )}

            {/* Banner text — editorial */}
            {currentBanner.text && (
              <div className="absolute inset-0 flex items-center px-6 sm:px-10">
                <div className="max-w-2xl">
                  <span className="inline-block text-[10px] font-bold tracking-[0.25em] uppercase text-white/70 mb-2">Em destaque</span>
                  <h2 className="text-white font-display text-2xl sm:text-4xl font-extrabold leading-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)]">
                    {currentBanner.text}
                  </h2>
                </div>
              </div>
            )}

            {/* Carousel controls */}
            {totalBanners > 1 && (
              <>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                  {Array.from({ length: totalBanners }).map((_, i) => (
                    <button key={i} onClick={() => setCurrentBannerIdx(i)}
                      className={`h-1.5 rounded-full transition-all ${i === currentBannerIdx % totalBanners ? 'bg-white w-6' : 'bg-white/40 w-1.5 hover:bg-white/70'}`} />
                  ))}
                </div>
                <button onClick={() => setCurrentBannerIdx(prev => (prev - 1 + totalBanners) % totalBanners)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/15 backdrop-blur-md hover:bg-white/30 flex items-center justify-center text-white border border-white/20 z-10">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => setCurrentBannerIdx(prev => (prev + 1) % totalBanners)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/15 backdrop-blur-md hover:bg-white/30 flex items-center justify-center text-white border border-white/20 z-10">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Edit-mode floating actions on banner */}
            {editMode && (
              <div className="absolute top-3 right-3 flex gap-1.5 z-20">
                {provider.logo_url && (
                  <Button variant="secondary" size="sm" className="gap-1 text-[10px] h-7 bg-white/85 hover:bg-white text-foreground" onClick={downloadLogo}>
                    <Download className="w-3 h-3" /> Logo
                  </Button>
                )}
                <Button variant="secondary" size="sm" className="gap-1 text-[10px] h-7 bg-white/85 hover:bg-white text-foreground" onClick={generateLogo} disabled={generatingLogo}>
                  <RefreshCw className={`w-3 h-3 ${generatingLogo ? 'animate-spin' : ''}`} /> {generatingLogo ? 'Gerando...' : 'Logo IA'}
                </Button>
                <Button variant="secondary" size="sm" className="gap-1 text-[10px] h-7 bg-white/85 hover:bg-white text-foreground" onClick={() => setProviderFormOpen(true)}>
                  <Pencil className="w-3 h-3" /> Perfil
                </Button>
              </div>
            )}
          </div>

          {/* Identity card overlapping banner */}
          <div className="container mx-auto max-w-5xl px-4">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              className="relative -mt-20 sm:-mt-24 rounded-3xl border border-border/60 bg-card/90 backdrop-blur-xl shadow-[0_30px_80px_-30px_hsl(var(--primary)/0.35)] overflow-hidden">
              <div className="p-5 sm:p-7 flex flex-col sm:flex-row gap-5 sm:gap-6">
                {/* Logo block */}
                <div className="shrink-0 mx-auto sm:mx-0">
                  {provider.logo_url ? (
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl ring-4 ring-card shadow-[0_15px_40px_-12px_hsl(var(--primary)/0.4)] overflow-hidden bg-card">
                      <img src={provider.logo_url} alt={provider.name} className="w-full h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl ring-4 ring-card bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shadow-lg">
                      <SegIcon className="w-10 h-10 text-primary" />
                    </div>
                  )}
                </div>

                {/* Info block */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground leading-tight">{provider.name}</h1>
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                          {provider.type === 'mei' ? 'MEI' : 'PF'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 font-semibold text-foreground">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {provider.rating}
                          <span className="font-normal text-muted-foreground ml-0.5">avaliação</span>
                        </span>
                        {provider.distance && (
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {provider.distance}</span>
                        )}
                        <span className="hidden sm:flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> Verificado</span>
                      </div>
                    </div>
                  </div>

                  {/* Segment chips */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {(Array.isArray(provider.segment) ? provider.segment : [provider.segment]).map(seg => (
                      <Badge key={seg} className="bg-primary/10 text-primary border-primary/20 text-[11px] hover:bg-primary/15">{seg}</Badge>
                    ))}
                    {segmentTags.slice(0, 4).map(tag => (
                      <span key={tag} className="text-[10px] text-muted-foreground bg-muted/60 border border-border/40 px-2 py-0.5 rounded-full">{tag}</span>
                    ))}
                  </div>

                  {/* Contact row */}
                  {((config.showPhone !== false && provider.phone) || (config.showEmail !== false && provider.email) || (config.showAddress !== false && provider.city)) && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-[11px] text-muted-foreground">
                      {(config.showPhone !== false) && provider.phone && (
                        <span className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-primary" /> {provider.phone}</span>
                      )}
                      {(config.showEmail !== false) && provider.email && (
                        <span className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-primary" /> {provider.email}</span>
                      )}
                      {(config.showAddress !== false) && provider.city && (
                        <span className="flex items-center gap-1.5"><MapPinned className="w-3 h-3 text-primary" /> {provider.city}{provider.address ? ` · ${provider.address}` : ''}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Stat strip */}
              <div className="grid grid-cols-3 border-t border-border/60 divide-x divide-border/60 bg-gradient-to-r from-muted/30 via-transparent to-muted/30">
                <div className="px-4 py-3 flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <WrenchIcon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-foreground leading-none">{providerServices.length}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Serviços</p>
                  </div>
                </div>
                <div className="px-4 py-3 flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <Package className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-foreground leading-none">{providerProducts.length}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Produtos</p>
                  </div>
                </div>
                <div className="px-4 py-3 flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-400/15 flex items-center justify-center">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-foreground leading-none">{provider.rating}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Reputação</p>
                  </div>
                </div>
              </div>

              {/* Edit quick-actions */}
              {editMode && (
                <div className="px-5 py-3 border-t border-border/60 flex flex-wrap gap-2 bg-muted/20">
                  <Button variant="outline" size="sm" className="gap-1 text-xs h-8" onClick={() => { setEditService(null); setServiceFormOpen(true); }}>
                    <Plus className="w-3.5 h-3.5" /> Novo Serviço
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1 text-xs h-8" onClick={() => { setEditProduct(null); setProductFormOpen(true); }}>
                    <Plus className="w-3.5 h-3.5" /> Novo Produto
                  </Button>
                  <Button variant="default" size="sm" className="gap-1 text-xs h-8" onClick={() => setKitBuilderOpen(true)}>
                    <Plus className="w-3.5 h-3.5" /> Novo Kit
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="px-4 mt-4">
        <div className="container mx-auto max-w-3xl">
          {editMode ? (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full">
                <TabsTrigger value="catalog" className="flex-1 gap-1 text-xs"><Store className="w-3.5 h-3.5" /> Catálogo</TabsTrigger>
                <TabsTrigger value="design" className="flex-1 gap-1 text-xs"><Palette className="w-3.5 h-3.5" /> Design</TabsTrigger>
                <TabsTrigger value="ai" className="flex-1 gap-1 text-xs"><MessageCircle className="w-3.5 h-3.5" /> IA Designer</TabsTrigger>
              </TabsList>

              <TabsContent value="catalog" className="mt-4">{renderCatalog()}</TabsContent>
              <TabsContent value="design" className="mt-4">{renderDesignPanel()}</TabsContent>
              <TabsContent value="ai" className="mt-4">{renderAiChat()}</TabsContent>
            </Tabs>
          ) : (
            <div className="mt-4">{renderCatalog()}</div>
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
            onSaved={async () => { await loadProviderData(); }}
            service={editService}
            providers={[{ id: provider.id, name: provider.name, segment: Array.isArray(provider.segment) ? provider.segment : [provider.segment] }]}
            segments={dbSegments}
          />
          <ProviderForm
            open={providerFormOpen}
            onClose={() => setProviderFormOpen(false)}
            onSaved={async () => {
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
          <KitBuilder
            open={kitBuilderOpen}
            onClose={() => setKitBuilderOpen(false)}
            providerId={provider.id}
            providerName={provider.name}
            onCreated={() => loadProviderData()}
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
    const norm = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
    const segImage = (segName?: string) =>
      segName ? dbSegments.find(s => norm(s.name) === norm(segName))?.image_url || null : null;

    return (
      <div className="space-y-8">
        {/* Search bar — Airbnb-inspired hero search */}
        <div className="relative group">
          <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-primary/30 via-accent/20 to-primary/30 opacity-0 group-focus-within:opacity-100 blur-md transition-opacity" />
          <div className="relative flex items-center bg-card/70 backdrop-blur-xl border border-border/60 rounded-2xl overflow-hidden shadow-[0_8px_30px_-12px_hsl(var(--primary)/0.25)] hover:border-primary/50 transition-colors">
            <Search className="w-4 h-4 text-muted-foreground absolute left-5" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`O que você precisa em ${provider?.name}?`}
              className="border-0 pl-12 pr-4 py-6 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm placeholder:text-muted-foreground/70"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-4 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* === SERVIÇOS — Fiverr-style gigs === */}
        {filteredServices.length > 0 && (
          <section>
            <div className="flex items-end justify-between mb-4 px-0.5">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-primary/80 mb-1">Marketplace</p>
                <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                  Serviços profissionais
                  <span className="rounded-full bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5">{filteredServices.length}</span>
                </h2>
              </div>
              <span className="hidden sm:flex items-center gap-1 text-[10px] text-muted-foreground">
                <Sparkles className="w-3 h-3 text-primary" /> Selecionados pelo prestador
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredServices.map((svc: any) => {
                const inCart = isInServiceCart(svc.id);
                const img = segImage(svc.segment);
                return (
                  <motion.div
                    key={svc.id}
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -6 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                    className={`group relative rounded-2xl overflow-hidden cursor-pointer border backdrop-blur-sm transition-all duration-300 ${
                      inCart
                        ? 'border-primary/70 shadow-[0_18px_40px_-18px_hsl(var(--primary)/0.55)] ring-1 ring-primary/30'
                        : 'border-border/40 bg-card/80 hover:border-primary/50 hover:shadow-[0_18px_40px_-18px_hsl(var(--primary)/0.35)]'
                    }`}
                    onClick={() => {
                      if (editMode) return;
                      if (accessLevel === 'visitor') {
                        toast.info('Crie sua conta para contratar serviços', { action: { label: 'Cadastrar', onClick: () => navigate('/auth') }, duration: 5000 }); return;
                      }
                      if (accessLevel === 'lead') {
                        toast.warning('Confirme seu e-mail para contratar serviços', { duration: 6000 }); return;
                      }
                      toggleServiceInCart(svc);
                    }}
                  >
                    {/* Hero image — Airbnb feel */}
                    <div className="aspect-[4/3] relative overflow-hidden bg-gradient-to-br from-primary/20 via-card to-card">
                      {img ? (
                        <img src={img} alt={svc.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.12]" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <WrenchIcon className="w-10 h-10 text-primary/40" />
                        </div>
                      )}
                      {/* Subtle gloss */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {/* Top-left favorite */}
                      {!editMode && (
                        <div className="absolute top-2 left-2 z-10">
                          <FavoriteButton kind="service" id={svc.id} name={svc.name} image={img} provider={provider?.name} />
                        </div>
                      )}
                      {/* Pro badge */}
                      <div className="absolute top-2 right-2 z-10 rounded-md bg-black/60 backdrop-blur-md px-1.5 py-0.5 border border-white/10">
                        <span className="text-[8.5px] font-bold uppercase tracking-wider text-white/90">Pro</span>
                      </div>
                      {/* Cart marker */}
                      {!editMode && (
                        <div className={`absolute bottom-2 right-2 rounded-full backdrop-blur-md px-1.5 py-1 flex items-center gap-0.5 z-10 border transition-all ${inCart ? 'bg-primary border-primary' : 'bg-black/60 border-white/10 group-hover:bg-primary/80 group-hover:border-primary'}`}>
                          {inCart ? <CheckCircle2 className="w-3 h-3 text-primary-foreground" /> : <Plus className="w-3 h-3 text-white" />}
                        </div>
                      )}
                      {editMode && (
                        <div className="absolute bottom-2 right-2 flex gap-1 z-10">
                          <Button variant="secondary" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setEditService(svc); setServiceFormOpen(true); }}>
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button variant="secondary" size="icon" className="h-6 w-6 text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ open: true, type: 'service', id: svc.id, name: svc.name }); }}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                    {/* Info — Fiverr-style */}
                    <div className="p-3 space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        {provider?.logo_url ? (
                          <img src={provider.logo_url} alt="" className="w-5 h-5 rounded-full object-cover border border-border" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center">
                            <SegIcon className="w-3 h-3 text-primary" />
                          </div>
                        )}
                        <span className="text-[10px] text-muted-foreground truncate flex-1">{provider?.name}</span>
                        <span className="flex items-center gap-0.5 text-[10px] font-semibold text-foreground shrink-0">
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" /> {svc.rating ?? provider?.rating ?? 4.8}
                        </span>
                      </div>
                      <h4 className="text-[12.5px] font-semibold text-foreground leading-snug line-clamp-2 min-h-[2.4em]">{svc.name}</h4>
                      <div className="flex items-center justify-between pt-1 border-t border-border/40">
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Clock className="w-2.5 h-2.5" /> {svc.time || '—'}
                        </span>
                        <div className="text-right">
                          <span className="block text-[8.5px] uppercase tracking-wider text-muted-foreground/80">A partir de</span>
                          <span className="text-[13px] font-bold text-foreground"><MaskedPrice value={svc.price} /></span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        {/* === PRODUTOS === */}
        {filteredProducts.length > 0 && (
          <section>
            <div className="flex items-end justify-between mb-4 px-0.5">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.2em] uppercase text-emerald-600/80 mb-1">Catálogo</p>
                <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
                  Produtos disponíveis
                  <span className="rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold px-2 py-0.5">{filteredProducts.length}</span>
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product: any) => {
                const inCart = isInProductCart(product.id);
                const img = product.image_url || segImage(product.segment);
                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -6 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                    className={`group relative rounded-2xl overflow-hidden cursor-pointer border backdrop-blur-sm transition-all duration-300 ${
                      inCart
                        ? 'border-emerald-500/70 shadow-[0_18px_40px_-18px_hsl(160_70%_45%/0.55)] ring-1 ring-emerald-500/30'
                        : 'border-border/40 bg-card/80 hover:border-emerald-400/60 hover:shadow-[0_18px_40px_-18px_hsl(160_70%_45%/0.35)]'
                    }`}
                    onClick={() => {
                      if (editMode) return;
                      if (accessLevel === 'visitor') {
                        toast.info('Crie sua conta para adicionar produtos ao carrinho', { action: { label: 'Cadastrar', onClick: () => navigate('/auth') }, duration: 5000 }); return;
                      }
                      if (accessLevel === 'lead') {
                        toast.warning('Confirme seu e-mail para comprar produtos', { duration: 6000 }); return;
                      }
                      toggleProductInCart(product);
                    }}
                  >
                    <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-emerald-500/15 via-card to-card">
                      {img ? (
                        <img src={img} alt={product.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.12]" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-10 h-10 text-emerald-500/40" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />

                      {/* Stock chip */}
                      <div className="absolute top-2 left-2 rounded-md bg-emerald-500/90 backdrop-blur-md px-1.5 py-0.5 z-10 border border-white/10">
                        <span className="text-[8.5px] font-bold uppercase tracking-wider text-white">{product.stockType === 'fisico' ? 'Estoque' : 'Drop'}</span>
                      </div>
                      {!editMode && (
                        <div className="absolute top-2 right-2 z-10">
                          <FavoriteButton kind="product" id={product.id} name={product.name} image={img} provider={provider?.name} />
                        </div>
                      )}
                      {!editMode && (
                        <div className={`absolute bottom-2 right-2 rounded-full backdrop-blur-md px-1.5 py-1 flex items-center gap-0.5 z-10 border transition-all ${inCart ? 'bg-emerald-500 border-emerald-500' : 'bg-black/60 border-white/10 group-hover:bg-emerald-500/80 group-hover:border-emerald-500'}`}>
                          {inCart ? <CheckCircle2 className="w-3 h-3 text-white" /> : <Plus className="w-3 h-3 text-white" />}
                        </div>
                      )}
                      {editMode && (
                        <div className="absolute bottom-2 right-2 flex gap-1 z-10">
                          <Button variant="secondary" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setEditProduct(product); setProductFormOpen(true); }}>
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button variant="secondary" size="icon" className="h-6 w-6 text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ open: true, type: 'product', id: product.id, name: product.name }); }}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="p-3 space-y-1.5">
                      <h4 className="text-[12.5px] font-semibold text-foreground leading-snug line-clamp-2 min-h-[2.4em]">{product.name}</h4>
                      <div className="flex items-center justify-between pt-1 border-t border-border/40">
                        <span className="flex items-center gap-0.5 text-[10px] font-semibold text-foreground">
                          <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" /> {product.rating ?? 4.8}
                        </span>
                        <span className="text-[13px] font-bold text-foreground"><MaskedPrice value={product.price} /></span>
                      </div>
                      {product.tags && product.tags.length > 0 && (
                        <div className="flex items-center gap-1 overflow-hidden pt-0.5">
                          {product.tags.slice(0, 2).map((t: string) => (
                            <span key={t} className="text-[9px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-full truncate">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        {filteredServices.length === 0 && filteredProducts.length === 0 && (
          <div className="text-center py-20 rounded-3xl border border-dashed border-border bg-gradient-to-br from-card/40 to-card/10 backdrop-blur-sm">
            <Store className="w-14 h-14 text-muted-foreground/60 mx-auto mb-3" />
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

  function renderDesignPanel() {
    return (
      <div className="space-y-4">
        {/* Undo / Reset bar */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1 text-xs h-8" onClick={undoConfig} disabled={configHistory.length === 0}>
            <Undo2 className="w-3.5 h-3.5" /> Desfazer
          </Button>
          <Button variant="outline" size="sm" className="gap-1 text-xs h-8" onClick={resetConfig}>
            <RotateCcw className="w-3.5 h-3.5" /> Restaurar Original
          </Button>
          <div className="flex-1" />
          <Button onClick={saveConfig} disabled={savingConfig} size="sm" className="gap-1 text-xs h-8">
            {savingConfig ? 'Salvando...' : '💾 Salvar'}
          </Button>
        </div>

        {/* Background color */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Palette className="w-4 h-4 text-primary" /> Fundo Geral da Loja
            </h3>
            <div className="flex items-center gap-3">
              <input type="color" value={config.backgroundColor || '#ffffff'}
                onChange={e => { pushConfigHistory(); setConfig(c => ({ ...c, backgroundColor: e.target.value })); }}
                className="w-10 h-10 rounded-lg cursor-pointer border border-border" />
              <Input value={config.backgroundColor || ''} onChange={e => { pushConfigHistory(); setConfig(c => ({ ...c, backgroundColor: e.target.value })); }}
                placeholder="Ex: #f5f5f5" className="text-xs h-8 flex-1" />
              <Button variant="ghost" size="sm" className="text-xs h-8" onClick={() => { pushConfigHistory(); setConfig(c => ({ ...c, backgroundColor: '' })); }}>
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Banner Management */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-primary" /> Banners ({(config.banners || []).length}/3)
              </h3>
              <Button variant="outline" size="sm" className="gap-1 text-xs h-7" onClick={addBannerSlide}
                disabled={(config.banners || []).length >= 3}>
                <Plus className="w-3 h-3" /> Novo Banner
              </Button>
            </div>

            {(!config.banners || config.banners.length === 0) && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">Usando banner padrão. Adicione até 3 banners personalizados com rotação automática.</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Cor Inicial</Label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={config.bannerColor1?.startsWith('#') ? config.bannerColor1 : '#6366f1'}
                        onChange={e => { pushConfigHistory(); setConfig(c => ({ ...c, bannerColor1: e.target.value })); }}
                        className="w-8 h-8 rounded cursor-pointer border border-border" />
                      <Input value={config.bannerColor1 || ''} onChange={e => setConfig(c => ({ ...c, bannerColor1: e.target.value }))}
                        className="text-xs h-8" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Cor Final</Label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={config.bannerColor2?.startsWith('#') ? config.bannerColor2 : '#a855f7'}
                        onChange={e => { pushConfigHistory(); setConfig(c => ({ ...c, bannerColor2: e.target.value })); }}
                        className="w-8 h-8 rounded cursor-pointer border border-border" />
                      <Input value={config.bannerColor2 || ''} onChange={e => setConfig(c => ({ ...c, bannerColor2: e.target.value }))}
                        className="text-xs h-8" />
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Texto ({(config.bannerText || '').length}/{BANNER_TEXT_MAX})</Label>
                  <Input value={config.bannerText || ''}
                    maxLength={BANNER_TEXT_MAX}
                    onChange={e => setConfig(c => ({ ...c, bannerText: e.target.value }))}
                    placeholder="Ex: Bem-vindo à minha loja!" className="text-sm" />
                </div>
                <div className="h-16 rounded-lg flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${config.bannerColor1 || '#6366f1'} 0%, ${config.bannerColor2 || '#a855f7'} 100%)` }}>
                  {config.bannerText && <span className="text-white font-bold text-sm drop-shadow-lg truncate px-4">{config.bannerText}</span>}
                </div>
              </div>
            )}

            {(config.banners || []).map((banner, idx) => (
              <div key={banner.id} className="border border-border rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">Banner {idx + 1}</span>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => removeBannerSlide(idx)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1.5">
                    <input type="color" value={banner.color1 || '#6366f1'}
                      onChange={e => updateBannerSlide(idx, { color1: e.target.value })}
                      className="w-7 h-7 rounded cursor-pointer border border-border" />
                    <span className="text-[10px] text-muted-foreground">Cor 1</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input type="color" value={banner.color2 || '#a855f7'}
                      onChange={e => updateBannerSlide(idx, { color2: e.target.value })}
                      className="w-7 h-7 rounded cursor-pointer border border-border" />
                    <span className="text-[10px] text-muted-foreground">Cor 2</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Texto ({(banner.text || '').length}/{BANNER_TEXT_MAX})</Label>
                  <Input value={banner.text || ''} maxLength={BANNER_TEXT_MAX}
                    onChange={e => updateBannerSlide(idx, { text: e.target.value })}
                    placeholder="Texto do banner" className="text-xs h-7" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px]">Imagem de Fundo (URL ou Upload)</Label>
                  <div className="flex gap-1">
                    <Input value={banner.imageUrl || ''}
                      onChange={e => updateBannerSlide(idx, { imageUrl: e.target.value })}
                      placeholder="https://..." className="text-xs h-7 flex-1" />
                    <Button variant="outline" size="sm" className="h-7 px-2 text-[10px] gap-1" disabled={uploadingBanner}
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (ev: any) => handleBannerFileUpload(ev, idx);
                        input.click();
                      }}>
                      <Upload className="w-3 h-3" /> {uploadingBanner ? '...' : 'Upload'}
                    </Button>
                  </div>
                </div>
                {/* Preview */}
                <div className="h-14 rounded-lg overflow-hidden relative flex items-center justify-center">
                  {banner.imageUrl ? (
                    <>
                      <img src={banner.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/30" />
                    </>
                  ) : (
                    <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${banner.color1} 0%, ${banner.color2} 100%)` }} />
                  )}
                  {banner.text && <span className="relative text-white font-bold text-xs drop-shadow-lg truncate px-4">{banner.text}</span>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Visibility */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground mb-2">Visibilidade de Informações</h3>
            {[
              { key: 'showPhone' as const, label: 'Mostrar Telefone', icon: Phone },
              { key: 'showEmail' as const, label: 'Mostrar Email', icon: Mail },
              { key: 'showAddress' as const, label: 'Mostrar Endereço', icon: MapPinned },
            ].map(item => (
              <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={config[item.key] !== false}
                  onChange={e => { pushConfigHistory(); setConfig(c => ({ ...c, [item.key]: e.target.checked })); }}
                  className="rounded border-border" />
                <item.icon className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs text-foreground">{item.label}</span>
              </label>
            ))}
          </CardContent>
        </Card>

        {/* Share section */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-primary" /> Link da sua Loja
            </h3>
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

  function renderAiChat() {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-0 flex flex-col" style={{ height: '60vh' }}>
          {/* Chat header */}
          <div className="px-4 py-3 border-b border-border bg-primary/5 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Designer IA</p>
              <p className="text-[10px] text-muted-foreground">Personalize sua loja conversando comigo</p>
            </div>
            <div className="ml-auto flex gap-1">
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={undoConfig} disabled={configHistory.length === 0}>
                <Undo2 className="w-3 h-3" /> Desfazer
              </Button>
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={resetConfig}>
                <RotateCcw className="w-3 h-3" /> Reset
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-md'
                    : 'bg-muted text-foreground rounded-bl-md'
                }`}>
                  {msg.content.split('\n').map((line, li) => (
                    <p key={li} className={li > 0 ? 'mt-1' : ''}>{line}</p>
                  ))}
                </div>
              </motion.div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                  <motion.div className="flex gap-1"
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.2, repeat: Infinity }}>
                    <div className="w-2 h-2 rounded-full bg-primary/50" />
                    <div className="w-2 h-2 rounded-full bg-primary/50" />
                    <div className="w-2 h-2 rounded-full bg-primary/50" />
                  </motion.div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick actions */}
          <div className="px-3 py-1.5 border-t border-border/50 flex gap-1.5 overflow-x-auto">
            {[
              '🎨 Mudar cor de fundo',
              '🖼️ Mudar banner',
              '✨ Sugerir cores',
              '↩️ Não gostei, voltar',
            ].map(action => (
              <Button key={action} variant="outline" size="sm" className="text-[10px] h-6 px-2 whitespace-nowrap shrink-0"
                onClick={() => { setChatInput(action.replace(/^[^\s]+\s/, '')); }}>
                {action}
              </Button>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border flex gap-2">
            <Input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChatMessage()}
              placeholder="Diga o que deseja mudar na sua loja..."
              className="text-sm h-9"
              disabled={chatLoading}
            />
            <Button size="sm" className="h-9 px-3" onClick={sendChatMessage} disabled={chatLoading || !chatInput.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
};

export default ProviderStorefront;
