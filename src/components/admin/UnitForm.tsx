import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Unit {
  id: number;
  name: string;
  label: string;
}

interface UnitFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  unit?: Unit | null;
}

export function UnitForm({ open, onClose, onSaved, unit }: UnitFormProps) {
  const isEdit = !!unit;
  const [name, setName] = useState('');
  const [label, setLabel] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (unit) {
      setName(unit.name);
      setLabel(unit.label);
    } else {
      setName('');
      setLabel('');
    }
  }, [unit, open]);

  const handleSave = async () => {
    if (!name.trim() || !label.trim()) {
      toast.error('Preencha nome e descrição');
      return;
    }
    setSaving(true);
    const data = { name: name.trim().toLowerCase(), label: label.trim() };

    if (isEdit) {
      const { error } = await supabase.from('units').update(data).eq('id', unit!.id);
      if (error) { toast.error('Erro: ' + error.message); setSaving(false); return; }
      toast.success('Unidade atualizada');
    } else {
      const { error } = await supabase.from('units').insert(data);
      if (error) {
        if (error.code === '23505') toast.error('Unidade já existe');
        else toast.error('Erro: ' + error.message);
        setSaving(false);
        return;
      }
      toast.success('Unidade criada');
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar Unidade' : 'Nova Unidade'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>Sigla *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="ex: kg, un, hr" />
          </div>
          <div className="grid gap-2">
            <Label>Descrição *</Label>
            <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="ex: Quilograma, Unidade, Hora" />
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
