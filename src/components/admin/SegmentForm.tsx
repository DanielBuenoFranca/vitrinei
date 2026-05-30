import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Sparkles, X, Plus, Pencil, Check } from 'lucide-react';
import { ItemImagePicker } from '@/components/admin/ItemImagePicker';

interface Segment {
  id: number;
  name: string;
  created_at: string;
  suggested_tags?: string[];
}

interface SegmentFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  segment?: Segment | null;
}

export function SegmentForm({ open, onClose, onSaved, segment }: SegmentFormProps) {
  const isEdit = !!segment;
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const lastSetImageUrl = useRef<string | null>(null);
  const hasLoadedRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) {
      hasLoadedRef.current = null;
      return;
    }
    
    if (hasLoadedRef.current !== segment?.id) {
      setName(segment?.name || '');
      setSelectedTags(segment?.suggested_tags || []);
      const currentUrl = (segment as any)?.image_url || null;
      setImageUrl(currentUrl);
      lastSetImageUrl.current = currentUrl;
      hasLoadedRef.current = segment?.id || -1;
      
      setSuggestedTags([]);
      setLoadingTags(false);
      setNewTag('');
      setEditingIdx(null);
    }

    // Auto-generate tags for new segments when name is provided via edit
    if (segment?.name && (!segment.suggested_tags || segment.suggested_tags.length === 0)) {
      autoFetchTags(segment.name, []);
    }
  }, [segment, open]);

  const autoFetchTags = async (segName: string, existing: string[]) => {
    if (segName.trim().length < 2) return;
    setLoadingTags(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-tags', {
        body: { segment: segName.trim(), existingTags: existing },
      });
      if (!error && data?.tags) {
        const newTags = (data.tags as string[]).filter(t => !existing.includes(t));
        setSuggestedTags(newTags);
      }
    } catch { /* ignore */ }
    setLoadingTags(false);
  };

  const fetchTags = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) { toast.error('Digite o nome do segmento primeiro'); return; }
    setLoadingTags(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-tags', {
        body: { segment: trimmed, existingTags: selectedTags },
      });
      if (!error && data?.tags) {
        const newTags = (data.tags as string[]).filter(t => !selectedTags.includes(t));
        setSuggestedTags(newTags);
        if (newTags.length === 0) toast.info('Nenhuma tag nova sugerida');
      } else {
        toast.error('Erro ao buscar sugestões');
      }
    } catch {
      toast.error('Erro ao conectar com IA');
    }
    setLoadingTags(false);
  };

  const addSuggested = (tag: string) => {
    setSelectedTags(prev => [...prev, tag]);
    setSuggestedTags(prev => prev.filter(t => t !== tag));
  };

  const addAllSuggested = () => {
    setSelectedTags(prev => [...prev, ...suggestedTags]);
    setSuggestedTags([]);
  };

  const removeTag = (idx: number) => {
    setSelectedTags(prev => prev.filter((_, i) => i !== idx));
    setEditingIdx(null);
  };

  const startEdit = (idx: number) => {
    setEditingIdx(idx);
    setEditValue(selectedTags[idx]);
  };

  const confirmEdit = () => {
    if (editingIdx === null) return;
    const v = editValue.trim().toLowerCase();
    if (!v) { removeTag(editingIdx); return; }
    setSelectedTags(prev => prev.map((t, i) => i === editingIdx ? v : t));
    setEditingIdx(null);
    setEditValue('');
  };

  const addManualTag = () => {
    const v = newTag.trim().toLowerCase();
    if (!v) return;
    if (selectedTags.includes(v)) { toast.error('Tag já existe'); return; }
    setSelectedTags(prev => [...prev, v]);
    setNewTag('');
  };

  const handleNameBlur = () => {
    const trimmed = name.trim();
    if (trimmed.length >= 2 && selectedTags.length === 0 && suggestedTags.length === 0) {
      autoFetchTags(trimmed, []);
    }
  };

  const handleSave = async () => {
    const trimmed = name.trim().toLowerCase();
    if (!trimmed) { toast.error('Nome é obrigatório'); return; }
    setSaving(true);
    const payload: any = { name: trimmed, suggested_tags: selectedTags, image_url: imageUrl };
    if (isEdit) {
      const { error } = await supabase.from('segments').update(payload).eq('id', segment!.id);
      if (error) { toast.error(error.message.includes('unique') ? 'Segmento já existe' : 'Erro ao atualizar'); setSaving(false); return; }
      toast.success('Segmento atualizado');
    } else {
      const { error } = await supabase.from('segments').insert(payload);
      if (error) { toast.error(error.message.includes('unique') ? 'Segmento já existe' : 'Erro ao criar'); setSaving(false); return; }
      toast.success('Segmento criado');
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Segmento' : 'Novo Segmento'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          {/* Nome + Botão IA */}
          <div className="grid gap-2">
            <Label>Nome do Segmento *</Label>
            <div className="flex gap-2">
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                onBlur={handleNameBlur}
                placeholder="Ex: beleza, saude, automotivo"
                className="flex-1"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={fetchTags}
                disabled={loadingTags || name.trim().length < 2}
                className="shrink-0 gap-1"
              >
                {loadingTags ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-primary" />}
                {loadingTags ? 'Analisando...' : 'Gerar Tags'}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">Clique em "Gerar Tags" ou saia do campo para a IA sugerir tags de produtos para este segmento</p>
          </div>

          <ItemImagePicker
            kind="segment"
            id={segment?.id}
            name={name}
            tags={selectedTags}
            imageUrl={imageUrl}
            onChange={(url) => {
              setImageUrl(url);
              lastSetImageUrl.current = url;
            }}
          />

          {/* Tags selecionadas */}
          {selectedTags.length > 0 && (
            <div className="grid gap-2">
              <Label className="text-xs">Tags do segmento ({selectedTags.length})</Label>
              <div className="flex flex-wrap gap-1">
                {selectedTags.map((tag, idx) => (
                  <div key={`${tag}-${idx}`}>
                    {editingIdx === idx ? (
                      <div className="flex items-center gap-0.5">
                        <Input
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && confirmEdit()}
                          className="h-6 w-24 text-xs px-1"
                          autoFocus
                        />
                        <button onClick={confirmEdit} className="text-primary"><Check className="h-3 w-3" /></button>
                        <button onClick={() => setEditingIdx(null)} className="text-muted-foreground"><X className="h-3 w-3" /></button>
                      </div>
                    ) : (
                      <Badge variant="default" className="gap-0.5 text-xs pr-0.5">
                        {tag}
                        <button onClick={() => startEdit(idx)} className="ml-0.5 hover:text-primary-foreground/70"><Pencil className="h-2.5 w-2.5" /></button>
                        <button onClick={() => removeTag(idx)} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Adicionar tag manual */}
          <div className="flex gap-1.5 items-center">
            <Input
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addManualTag())}
              placeholder="Adicionar tag manualmente"
              className="h-8 text-xs flex-1"
            />
            <Button type="button" size="sm" variant="ghost" onClick={addManualTag} disabled={!newTag.trim()} className="h-8 px-2">
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Sugestões da IA */}
          {suggestedTags.length > 0 && (
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-primary" /> Sugestões da IA (clique para adicionar)
                </Label>
                <Button type="button" size="sm" variant="ghost" onClick={addAllSuggested} className="h-6 text-[10px] px-2 text-primary">
                  Adicionar todas
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {suggestedTags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => addSuggested(tag)}
                    className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-accent/10 text-accent-foreground border border-accent/20 hover:bg-accent/20 transition-colors"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
