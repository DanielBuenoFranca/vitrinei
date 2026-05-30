import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNameSuggestion } from '@/hooks/useNameSuggestion';
import { NameSuggestions } from '@/components/admin/NameSuggestions';
import { ItemImagePicker } from '@/components/admin/ItemImagePicker';
import { X, Plus, Loader2, Sparkles } from 'lucide-react';

interface DynamicProduct {
  id: number;
  product_id: number;
  name: string;
  price: number;
  provider: string;
  provider_id: number | null;
  stock_type: string;
  rating: number;
  distance: string;
  tags: string[];
  unit?: string;
}

interface Provider {
  id: number;
  name: string;
  segment: string[];
}

interface Segment {
  id: number;
  name: string;
  suggested_tags?: string[];
}

interface ProductFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  product?: DynamicProduct | null;
  providers: Provider[];
  segments?: Segment[];
  highlightField?: string;
}

const UNIT_OPTIONS = [
  { value: 'un', label: 'Unidade (un)' },
  { value: 'kg', label: 'Quilograma (kg)' },
  { value: 'g', label: 'Grama (g)' },
  { value: 'l', label: 'Litro (L)' },
  { value: 'ml', label: 'Mililitro (ml)' },
  { value: 'm', label: 'Metro (m)' },
  { value: 'cm', label: 'Centímetro (cm)' },
  { value: 'm2', label: 'Metro² (m²)' },
  { value: 'pct', label: 'Pacote (pct)' },
  { value: 'cx', label: 'Caixa (cx)' },
  { value: 'par', label: 'Par' },
  { value: 'kit', label: 'Kit' },
];

export function ProductForm({ open, onClose, onSaved, product, providers, segments = [], highlightField }: ProductFormProps) {
  const isEdit = !!product && !!product.id;
  const [form, setForm] = useState({
    name: '', price: 0, provider: '', provider_id: null as number | null,
    stock_type: 'fisico', rating: 4.5, distance: '2 km',
    product_id: Math.floor(Math.random() * 9000) + 1000,
    unit: 'un',
    quantity: 0,
  });
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [segmentTags, setSegmentTags] = useState<string[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [saving, setSaving] = useState(false);
  const [allProductNames, setAllProductNames] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [localIsEdit, setLocalIsEdit] = useState(false);
  const lastSetImageUrl = useRef<string | null>(null);
  const hasLoadedRef = useRef<number | null>(null);
  const isClosingRef = useRef(false);

  useEffect(() => {
    if (open) {
      setLocalIsEdit(!!product && !!product.id);
      isClosingRef.current = false;
    } else {
      isClosingRef.current = true;
      // Reset synchronization ref when closing to allow fresh load next time
      hasLoadedRef.current = null;
    }
  }, [open, product]);
  
  const handleImageUrlChange = useCallback((url: string | null) => {
    console.log('[ProductForm] handleImageUrlChange called with:', url);
    setImageUrl(url);
    // Explicitly update ref to prevent the sync useEffect from reverting this change
    lastSetImageUrl.current = url;
  }, []);
  const { suggestions, loading: sugLoading, suggest, clear: clearSuggestions } = useNameSuggestion();
  const [imageBusy, setImageBusy] = useState(false);

  useEffect(() => {
    if (open) {
      supabase.from('dynamic_products').select('name').then(({ data }) => {
        setAllProductNames((data || []).map((d: any) => d.name));
      });
    }
  }, [open]);

  useEffect(() => {
    if (product && open && !isClosingRef.current) {
      const isNewItem = hasLoadedRef.current !== product.id;
      
      // Update basic form fields
      if (isNewItem) {
        console.log('[ProductForm] Initial load for product:', product.id, product.name);
        setForm({
          name: product.name, price: product.price, provider: product.provider,
          provider_id: product.provider_id, stock_type: product.stock_type,
          rating: product.rating, distance: product.distance,
          product_id: product.product_id,
          unit: (product as any).unit || 'un',
          quantity: (product as any).quantity ?? 0,
        });
        setSelectedTags(product.tags || []);
        
        // Initial image load
        const currentUrl = (product as any).image_url || null;
        setImageUrl(currentUrl);
        lastSetImageUrl.current = currentUrl;
        hasLoadedRef.current = product.id;
        
        // Segment loading
        const productSegs: string[] = Array.isArray((product as any).segments) ? (product as any).segments : [];
        let initialSegs = productSegs;
        if (initialSegs.length === 0 && product.provider_id) {
          const prov = providers.find(p => p.id === product.provider_id);
          if (prov) initialSegs = Array.isArray(prov.segment) ? prov.segment : [prov.segment];
        }
        setSelectedSegments(initialSegs);
        loadSegmentTags(initialSegs);
      } else {
        // We are already editing this item. Only sync image if it changed externally 
        // AND we are not currently busy generating one.
        const externalUrl = (product as any).image_url || null;
        if (!imageBusy && externalUrl !== lastSetImageUrl.current) {
          console.log('[ProductForm] External image change detected, updating state:', externalUrl);
          setImageUrl(externalUrl);
          lastSetImageUrl.current = externalUrl;
        }
      }
    } else if (!open && isClosingRef.current) {
      // Reset form ONLY when fully closing to avoid race conditions during re-renders
      setForm({ name: '', price: 0, provider: '', provider_id: null, stock_type: 'fisico', rating: 4.5, distance: '2 km', product_id: Math.floor(Math.random() * 9000) + 1000, unit: 'un', quantity: 0 });
      setSelectedTags([]);
      setSelectedSegments([]);
      setSegmentTags([]);
      setImageUrl(null);
      lastSetImageUrl.current = null;
      hasLoadedRef.current = null;
    }
  }, [product, open, providers, imageBusy]); 


  const loadSegmentTags = useCallback(async (segNames: string[]) => {
    if (segNames.length === 0) { setSegmentTags([]); return; }
    setLoadingTags(true);
    try {
      const { data: segData } = await supabase.from('segments').select('suggested_tags').in('name', segNames);
      const tags = (segData || []).flatMap((s: any) => s.suggested_tags || []);
      setSegmentTags([...new Set(tags)]);
    } catch { /* ignore */ }
    setLoadingTags(false);
  }, []);

  const handleSegmentToggle = (segName: string) => {
    setSelectedSegments(prev => {
      const next = prev.includes(segName) ? prev.filter(s => s !== segName) : [...prev, segName];
      loadSegmentTags(next);
      return next;
    });
  };

  const handleProviderSelect = (providerId: string) => {
    const prov = providers.find(p => p.id === Number(providerId));
    if (prov) {
      setForm(f => ({ ...f, provider: prov.name, provider_id: prov.id }));
      const provSegs = Array.isArray(prov.segment) ? prov.segment : [prov.segment];
      const merged = [...new Set([...selectedSegments, ...provSegs])];
      setSelectedSegments(merged);
      loadSegmentTags(merged);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const addNewTag = () => {
    const trimmed = newTag.trim().toLowerCase();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags(prev => [...prev, trimmed]);
      setNewTag('');
    }
  };

  const handleSave = async () => {
    console.log('[ProductForm] handleSave initiated. States:', { name: form.name, imageBusy, saving, isEdit });
    
    if (!form.name || !form.name.trim()) { toast.error('Nome é obrigatório'); return; }
    if (!form.provider || !form.provider.trim()) { toast.error('Fornecedor é obrigatório'); return; }
    if (selectedSegments.length === 0) { toast.error('Selecione pelo menos um segmento'); return; }

    
    if (imageBusy) {
      toast.warning('Aguarde a conclusão da imagem antes de salvar');
      return;
    }

    setSaving(true);
    try {
      // Anti-duplicidade no estoque do prestador
      if (form.provider_id) {
        const { data: dup } = await (supabase as any).rpc('check_item_duplicate', {
          _provider_id: form.provider_id, _kind: 'product',
          _name: form.name, _unit: form.unit, _exclude_id: isEdit ? product!.id : null,
        });
        if (dup?.duplicate) {
          toast.error(`Produto duplicado neste prestador: já existe "${dup.name}". Renomeie ou ajuste a unidade.`);
          setSaving(false);
          return;
        }
      }

      const data: any = {
        name: form.name, price: form.price, provider: form.provider,
        provider_id: form.provider_id, stock_type: form.stock_type,
        rating: form.rating, distance: form.distance, tags: selectedTags,
        product_id: form.product_id, related_service_ids: [] as number[],
        unit: form.unit,
        quantity: form.quantity,
        image_url: imageUrl,
        segments: selectedSegments,
      };

      if (isEdit) {
        const { error } = await supabase.from('dynamic_products').update(data).eq('id', product!.id);
        if (error) throw error;
        toast.success('Produto atualizado');
      } else {
        const { error } = await supabase.from('dynamic_products').insert(data);
        if (error) throw error;
        toast.success('Produto criado');
      }

      // Sincronização de segmentos do prestador
      if (form.provider_id && selectedSegments.length > 0) {
        const prov = providers.find(p => p.id === form.provider_id);
        const current = Array.isArray(prov?.segment) ? (prov!.segment as string[]) : [];
        const merged = Array.from(new Set([...current, ...selectedSegments]));
        if (merged.length !== current.length) {
          await supabase.from('providers').update({ segment: merged }).eq('id', form.provider_id);
          const { data: provRow } = await supabase.from('providers').select('user_id').eq('id', form.provider_id).maybeSingle();
          if (provRow?.user_id) {
            await supabase.from('profiles').update({ provider_segments: merged, is_provider: true }).eq('user_id', provRow.user_id);
          }
        }
      }

      onSaved();
      onClose();
    } catch (error: any) {
      console.error('[ProductForm] Error saving product:', error);
      toast.error('Erro ao salvar produto: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (open && highlightField) {
      setTimeout(() => {
        const el = document.getElementsByName(highlightField)[0] || 
                   document.getElementById(highlightField) ||
                   document.querySelector(`[data-fieldname="${highlightField}"]`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
            el.focus();
          }
          el.classList.add('ring-2', 'ring-destructive', 'ring-offset-2');
          setTimeout(() => el.classList.remove('ring-2', 'ring-destructive', 'ring-offset-2'), 3000);
        }
      }, 300);
    }
  }, [open, highlightField]);

  // Tags from segments that are NOT yet selected
  const availableSegmentTags = segmentTags.filter(t => !selectedTags.includes(t));

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg p-0 flex flex-col max-h-[90vh] overflow-hidden">
        <div className="p-6 pb-2 shrink-0">
          <DialogHeader>
            <DialogTitle>{localIsEdit ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
          </DialogHeader>
        </div>
        <ScrollArea className="flex-1 px-6 admin-scroll-area">
          <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Nome *</Label>
            <Input value={form.name} onChange={e => { setForm(f => ({ ...f, name: e.target.value })); suggest(e.target.value, 'product', allProductNames); }} placeholder="Nome do produto" />
            <NameSuggestions suggestions={suggestions} loading={sugLoading} onSelect={(n) => { setForm(f => ({ ...f, name: n })); clearSuggestions(); }} />
          </div>
          <ItemImagePicker
            kind="product"
            id={product?.id}
            name={form.name}
            segment={selectedSegments[0]}
            tags={selectedTags}
            providerName={form.provider}
            unit={form.unit}
            price={form.price}
            imageUrl={imageUrl}
            onChange={handleImageUrlChange}
            onBusy={setImageBusy}
            quantity={form.quantity}
          />
          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-2">
              <Label>Preço (R$)</Label>
              <Input name="price" type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div className="grid gap-2">
              <Label>Unidade</Label>
              <Select value={form.unit} onValueChange={v => setForm(f => ({ ...f, unit: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {UNIT_OPTIONS.map(u => (
                    <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Tipo Estoque</Label>
              <Select value={form.stock_type} onValueChange={v => setForm(f => ({ ...f, stock_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fisico">Físico</SelectItem>
                  <SelectItem value="drop">Dropshipping</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2" data-fieldname="provider">
            <Label>Prestador / Fornecedor *</Label>
            {providers.length > 0 ? (
              <Select value={form.provider_id ? String(form.provider_id) : ''} onValueChange={handleProviderSelect}>
                <SelectTrigger><SelectValue placeholder="Selecione um prestador" /></SelectTrigger>
                <SelectContent>
                  {providers.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name} ({(p.segment || []).join(', ')})</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <Input value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value }))} placeholder="Nome do fornecedor" />
            )}
          </div>

          {/* Segment selection */}
          <div className="grid gap-2" data-fieldname="segments">
            <Label>Segmento(s) *</Label>
            <div className="flex flex-wrap gap-1.5">
              {segments.map(seg => (
                <button
                  key={seg.id}
                  type="button"
                  onClick={() => handleSegmentToggle(seg.name)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
                    selectedSegments.includes(seg.name)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted/30 text-muted-foreground border-border hover:border-primary/40'
                  }`}
                >
                  {seg.name}
                </button>
              ))}
            </div>
          </div>

          {/* Tags section */}
          <div className="grid gap-2" data-fieldname="tags">
            <Label className="flex items-center gap-2">
              Tags do Produto
              {loadingTags && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
            </Label>
            {/* Selected tags */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedTags.map(tag => (
                  <Badge key={tag} variant="default" className="gap-1 text-xs">
                    {tag}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedTags(prev => prev.filter(t => t !== tag))} />
                  </Badge>
                ))}
              </div>
            )}
            {/* Tags from segment — click to select */}
            {availableSegmentTags.length > 0 && (
              <div className="space-y-1">
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-primary" /> Tags do segmento (clique para vincular ao produto):
                </p>
                <div className="flex flex-wrap gap-1">
                  {availableSegmentTags.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-accent/10 text-accent-foreground border border-accent/20 hover:bg-accent/20 transition-colors"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {/* Add new tag */}
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addNewTag())}
                placeholder="Nova tag personalizada..."
                className="text-sm"
              />
              <Button type="button" variant="outline" size="sm" onClick={addNewTag} disabled={!newTag.trim()}>
                <Plus className="w-3 h-3 mr-1" /> Tag
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-2">
              <Label>Quantidade (estoque)</Label>
              <Input type="number" min="0" step="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: parseInt(e.target.value, 10) || 0 }))} />
            </div>
            <div className="grid gap-2">
              <Label>Avaliação</Label>
              <Input type="number" step="0.1" min="0" max="5" value={form.rating} onChange={e => setForm(f => ({ ...f, rating: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div className="grid gap-2">
              <Label>Distância</Label>
              <Input value={form.distance} onChange={e => setForm(f => ({ ...f, distance: e.target.value }))} />
            </div>
          </div>
        </div>
        </ScrollArea>
        <DialogFooter className="p-6 pt-2 shrink-0 border-t">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : localIsEdit ? 'Salvar' : 'Criar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
