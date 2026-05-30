import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Sparkles, Upload, X, Loader2, ImageIcon } from 'lucide-react';

interface Props {
  kind: 'product' | 'service' | 'segment' | 'kit';
  id?: number | null;
  name: string;
  segment?: string;
  imageUrl: string | null;
  onChange: (url: string | null) => void;
  bucket?: string; // override
  /** Tags do item (ajuda IA a desambiguar) */
  tags?: string[];
  /** Descrição livre do item */
  description?: string;
  /** Nome do prestador associado */
  providerName?: string;
  /** Tipo do prestador (mei, comercial...) */
  providerType?: string;
  /** Itens vinculados (ex.: produtos de um serviço/kit) */
  linkedNames?: string[];
  /** Unidade de medida */
  unit?: string;
  /** Preço estimado */
  price?: number;
}

/**
 * Bloco reutilizável: mostra a imagem do item em tamanho normal,
 * permite upload manual e geração via sanitize-images (respeita modo economia).
 */
export function ItemImagePicker({ kind, id, name, segment, imageUrl, onChange, bucket, tags, description, providerName, providerType, linkedNames, unit, price }: Props) {
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState<'idle' | 'enriching' | 'searching' | 'generating' | 'saving'>('idle');
  const [uploading, setUploading] = useState(false);

  const targetBucket = bucket || 'storefront-assets';
  const folder = `${kind}-images/`;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { toast.error('Máximo 4MB'); return; }
    setUploading(true);
    const ext = file.name.split('.').pop() || 'png';
    const fileName = `${folder}upload-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from(targetBucket).upload(fileName, file, { upsert: true });
    if (error) { toast.error('Erro upload: ' + error.message); setUploading(false); return; }
    const { data } = supabase.storage.from(targetBucket).getPublicUrl(fileName);
    onChange(data.publicUrl);
    setUploading(false);
    toast.success('Imagem enviada');
  };

  const generate = async () => {
    if (!name.trim()) { toast.error('Informe o nome do item antes de gerar a imagem'); return; }
    
    if (imageUrl) {
      const proceed = window.confirm('Este item já possui uma imagem. Deseja realmente trocá-la por uma nova imagem buscada via IA/Banco de Imagens?');
      if (!proceed) return;
    }

    setBusy(true);
    setStep('enriching');
    try {
      // Pequeno delay visual para o usuário perceber as etapas
      await new Promise(r => setTimeout(r, 600));
      setStep('generating');
      
      const { data, error } = await supabase.functions.invoke('sanitize-images', {
        body: {
          kind,
          id: id || 0,
          name: name.trim(),
          currentImageUrl: imageUrl,
          segment,
          tags: (tags || []).filter(Boolean),
          description,
          providerName,
          providerType,
          linkedNames: (linkedNames || []).filter(Boolean),
          unit,
          price,
        },
      });
      
      setStep('saving');
      const url = (data as any)?.imageUrl;
      if (error || !url) {
        toast.warning('Não foi possível obter imagem agora');
      } else {
        onChange(url);
        toast.success((data as any)?.source === 'ai' ? 'Imagem gerada pela IA com base no contexto do item' : 'Imagem aplicada (sem custo de créditos)');
      }
    } catch (err) {
      console.error('Error generating image:', err);
      toast.warning('Falha ao gerar imagem');
    } finally {
      setBusy(false);
      setStep('idle');
    }
  };

  const getStepLabel = () => {
    switch (step) {
      case 'enriching': return 'Analisando contexto...';
      case 'searching': return 'Buscando referências...';
      case 'generating': return 'IA gerando imagem...';
      case 'saving': return 'Finalizando...';
      default: return 'Gerando...';
    }
  };

  return (
    <div className="grid gap-2">
      <Label className="flex items-center gap-2"><ImageIcon className="w-3.5 h-3.5 text-primary" /> Imagem do item</Label>
      <div className="flex items-start gap-3">
        <div className="relative w-28 h-28 shrink-0 rounded-lg border bg-muted/30 overflow-hidden flex items-center justify-center">
          {imageUrl ? (
            <>
              <img src={imageUrl} alt={name || kind} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => onChange(null)}
                title="Remover"
                className="absolute top-1 right-1 bg-background/80 hover:bg-background rounded-full p-0.5 border"
              >
                <X className="w-3 h-3" />
              </button>
            </>
          ) : (
            <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
          )}
        </div>
        <div className="flex-1 grid gap-2">
          <Button type="button" size="sm" variant="outline" onClick={generate} disabled={busy} className="gap-1 relative overflow-hidden">
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-primary" />}
            {busy ? getStepLabel() : 'Trocar Imagem'}
            {busy && (
              <div className="absolute bottom-0 left-0 h-0.5 bg-primary animate-pulse w-full" />
            )}
          </Button>
          <label className="inline-flex">
            <Button type="button" size="sm" variant="ghost" disabled={uploading} asChild className="gap-1 cursor-pointer">
              <span>
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                {uploading ? 'Enviando...' : 'Enviar imagem'}
              </span>
            </Button>
            <Input type="file" accept="image/*" onChange={handleFile} className="hidden" />
          </label>
          <p className="text-[10px] text-muted-foreground leading-tight">
            Modo economia ligado: usa Unsplash/Pixabay automaticamente quando os créditos de IA estiverem desligados.
          </p>
        </div>
      </div>
    </div>
  );
}
