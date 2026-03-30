import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';

interface ClearDataDialogProps {
  open: boolean;
  onClose: () => void;
  onCleared: () => void;
  counts: { providers: number; services: number; products: number; segments: number };
}

export function ClearDataDialog({ open, onClose, onCleared, counts }: ClearDataDialogProps) {
  const [selected, setSelected] = useState({ providers: false, services: false, products: false, segments: false });
  const [clearing, setClearing] = useState(false);

  const toggle = (key: keyof typeof selected) => setSelected(s => ({ ...s, [key]: !s[key] }));

  const anySelected = Object.values(selected).some(Boolean);

  const handleClear = async () => {
    setClearing(true);
    try {
      if (selected.services) await supabase.from('dynamic_services').delete().neq('id', 0);
      if (selected.products) await supabase.from('dynamic_products').delete().neq('id', 0);
      if (selected.providers) {
        if (!selected.services) await supabase.from('dynamic_services').delete().neq('id', 0);
        if (!selected.products) await supabase.from('dynamic_products').delete().neq('id', 0);
        await supabase.from('providers').delete().neq('id', 0);
      }
      if (selected.segments) await supabase.from('segments').delete().neq('id', 0);
      toast.success('Dados excluídos com sucesso');
      setSelected({ providers: false, services: false, products: false, segments: false });
      onCleared();
      onClose();
    } catch {
      toast.error('Erro ao excluir dados');
    }
    setClearing(false);
  };

  const items = [
    { key: 'providers' as const, label: 'Prestadores', count: counts.providers, warn: 'Exclui também serviços e produtos vinculados' },
    { key: 'services' as const, label: 'Serviços', count: counts.services },
    { key: 'products' as const, label: 'Produtos', count: counts.products },
    { key: 'segments' as const, label: 'Segmentos', count: counts.segments },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Excluir Dados
          </DialogTitle>
          <DialogDescription>Selecione quais categorias deseja excluir da base de dados.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          {items.map(item => (
            <div key={item.key} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
              <Checkbox
                id={item.key}
                checked={selected[item.key]}
                onCheckedChange={() => toggle(item.key)}
                disabled={item.count === 0}
              />
              <div className="grid gap-0.5">
                <Label htmlFor={item.key} className="cursor-pointer">
                  {item.label} <span className="text-muted-foreground">({item.count})</span>
                </Label>
                {item.warn && selected[item.key] && (
                  <p className="text-[11px] text-destructive">{item.warn}</p>
                )}
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="destructive" onClick={handleClear} disabled={!anySelected || clearing}>
            {clearing ? 'Excluindo...' : 'Excluir Selecionados'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
