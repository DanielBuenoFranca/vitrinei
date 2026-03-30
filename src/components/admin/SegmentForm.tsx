import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Segment {
  id: number;
  name: string;
  created_at: string;
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

  useEffect(() => {
    setName(segment?.name || '');
  }, [segment, open]);

  const handleSave = async () => {
    const trimmed = name.trim().toLowerCase();
    if (!trimmed) { toast.error('Nome é obrigatório'); return; }
    setSaving(true);
    if (isEdit) {
      const { error } = await supabase.from('segments').update({ name: trimmed }).eq('id', segment!.id);
      if (error) { toast.error(error.message.includes('unique') ? 'Segmento já existe' : 'Erro ao atualizar'); setSaving(false); return; }
      toast.success('Segmento atualizado');
    } else {
      const { error } = await supabase.from('segments').insert({ name: trimmed });
      if (error) { toast.error(error.message.includes('unique') ? 'Segmento já existe' : 'Erro ao criar'); setSaving(false); return; }
      toast.success('Segmento criado');
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Segmento' : 'Novo Segmento'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Nome do Segmento *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: saude_clinica" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
