import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Sparkles, X } from 'lucide-react';

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
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const [tagsFetched, setTagsFetched] = useState(false);

  useEffect(() => {
    setName(segment?.name || '');
    setSelectedTags(segment?.suggested_tags || []);
    setSuggestedTags([]);
    setTagsFetched(false);
  }, [segment, open]);

  const fetchTags = async (segName: string) => {
    if (segName.trim().length < 2) return;
    setLoadingTags(true);
    try {
      const { data, error } = await supabase.functions.invoke('suggest-tags', {
        body: { segment: segName.trim(), existingTags: selectedTags },
      });
      if (!error && data?.tags) {
        setSuggestedTags(data.tags.filter((t: string) => !selectedTags.includes(t)));
        setTagsFetched(true);
      }
    } catch { /* ignore */ }
    setLoadingTags(false);
  };

  const handleNameBlur = () => {
    if (!tagsFetched && name.trim().length >= 2) {
      fetchTags(name);
    }
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(prev => prev.filter(t => t !== tag));
      setSuggestedTags(prev => [...prev, tag]);
    } else {
      setSelectedTags(prev => [...prev, tag]);
      setSuggestedTags(prev => prev.filter(t => t !== tag));
    }
  };

  const handleSave = async () => {
    const trimmed = name.trim().toLowerCase();
    if (!trimmed) { toast.error('Nome é obrigatório'); return; }
    setSaving(true);
    const payload = { name: trimmed, suggested_tags: selectedTags };
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
          <div className="grid gap-2">
            <Label>Nome do Segmento *</Label>
            <Input
              value={name}
              onChange={e => { setName(e.target.value); setTagsFetched(false); }}
              onBlur={handleNameBlur}
              placeholder="Ex: beleza, saude, automotivo"
            />
            <p className="text-[10px] text-muted-foreground">Ao sair do campo, a IA sugere tags de produtos para este segmento</p>
          </div>

          {/* Loading */}
          {loadingTags && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Analisando tags com IA...</span>
            </div>
          )}

          {/* Selected tags */}
          {selectedTags.length > 0 && (
            <div className="grid gap-2">
              <Label className="text-xs">Tags selecionadas ({selectedTags.length})</Label>
              <div className="flex flex-wrap gap-1">
                {selectedTags.map(tag => (
                  <Badge key={tag} variant="default" className="gap-1 text-xs">
                    {tag}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => toggleTag(tag)} />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Suggested tags */}
          {suggestedTags.length > 0 && (
            <div className="grid gap-2">
              <Label className="text-xs flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-primary" /> Sugestões da IA
              </Label>
              <div className="flex flex-wrap gap-1">
                {suggestedTags.map(tag => (
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
