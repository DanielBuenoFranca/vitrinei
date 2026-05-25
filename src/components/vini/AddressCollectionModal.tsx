import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, MapPin, Send } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface AddressCollectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onSuccess: () => void;
}

export function AddressCollectionModal({ open, onOpenChange, userId, onSuccess }: AddressCollectionModalProps) {
  const [cep, setCep] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingCep, setFetchingCep] = useState(false);

  const handleCepChange = async (value: string) => {
    const cleanCep = value.replace(/\D/g, '').slice(0, 8);
    setCep(cleanCep);

    if (cleanCep.length === 8) {
      setFetchingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          setCity(data.localidade);
          setState(data.uf);
          setNeighborhood(data.bairro);
          setAddress(data.logradouro);
          toast.success('Endereço localizado!');
        } else {
          toast.error('CEP não encontrado.');
        }
      } catch (err) {
        console.error('Error fetching CEP:', err);
        toast.error('Erro ao buscar CEP.');
      } finally {
        setFetchingCep(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cep || !city || !state || !address) {
      toast.error('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          cep,
          city,
          state,
          neighborhood,
          address,
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('Dados de localização atualizados!');
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error('Error updating profile address:', err);
      toast.error('Erro ao salvar endereço.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Atualizar Localização
          </DialogTitle>
          <DialogDescription>
            Para continuar, precisamos confirmar sua localização base. Isso nos ajuda a encontrar os melhores prestadores perto de você.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="cep">CEP</Label>
            <div className="relative">
              <Input
                id="cep"
                value={cep}
                onChange={(e) => handleCepChange(e.target.value)}
                placeholder="00000-000"
                maxLength={9}
                className="pr-10"
              />
              {fetchingCep && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Cidade" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">UF</Label>
              <Input id="state" value={state} onChange={(e) => setState(e.target.value)} placeholder="UF" maxLength={2} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="neighborhood">Bairro</Label>
            <Input id="neighborhood" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Bairro" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Endereço / Logradouro</Label>
            <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua, Avenida, etc." required />
          </div>

          <DialogFooter className="pt-4">
            <Button type="submit" className="w-full" disabled={loading || fetchingCep}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Salvar e Continuar
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
