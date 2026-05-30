import { useState, useRef, useEffect } from 'react';
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
  /** Callback para o componente pai monitorar se está processando */
  onBusy?: (isBusy: boolean) => void;
  /** Quantidade/Estoque do item */
  quantity?: number;
}

/**
 * Bloco reutilizável: mostra a imagem do item em tamanho normal,
 * permite upload manual e geração via sanitize-images (respeita modo economia).
 */
export function ItemImagePicker({ kind, id, name, segment, imageUrl, onChange, bucket, tags, description, providerName, providerType, linkedNames, unit, price, onBusy, quantity }: Props) {
  const [busy, _setBusy] = useState(false);
  const busyRef = useRef(false);
  const [step, setStep] = useState<'idle' | 'enriching' | 'searching' | 'generating' | 'saving'>('idle');
  const [uploading, setUploading] = useState(false);

  const setBusy = (val: boolean) => {
    // Only update if state actually changes to avoid unnecessary re-renders
    if (busyRef.current === val) return;
    
    console.log(`[ItemImagePicker] Setting busy to ${val}`);
    busyRef.current = val;
    _setBusy(val);
    // Use a small delay to ensure state has propagated before parent re-renders
    // though this is mostly to avoid "Update while rendering" warnings if called too early
    if (onBusy) onBusy(val);
  };

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
    if (busyRef.current) return;
    
    if (!name.trim()) {
      toast.error('Informe o nome do item antes de gerar a imagem');
      return;
    }
    
    setBusy(true);
    setStep('enriching');
    
    // Fallback timer: se a função demorar mais de 60s, destravamos a tela
    const timeoutId = setTimeout(() => {
      console.log('[ItemImagePicker] Timeout reached, forcing unlock');
      if (busyRef.current) {
        setBusy(false);
        setStep('idle');
        toast.error('A geração da imagem demorou demais. A tela foi destravada.');
      }
    }, 60000);

    try {
      console.log('[ItemImagePicker] Starting generation for:', name);
      setStep('generating');
      
      const { data, error } = await supabase.functions.invoke('sanitize-images', {
        body: {
          kind,
          id: id || 0,
          name: name.trim(),
          currentImageUrl: imageUrl || undefined,
          segment,
          tags: (tags || []).filter(Boolean),
          description,
          providerName,
          providerType,
          linkedNames: (linkedNames || []).filter(Boolean),
          unit,
          price,
          quantity,
        },
      });
      
      if (error) throw error;

      setStep('saving');
      const url = (data as any)?.imageUrl;
      
      // Pequeno delay para garantir que o estado 'saving' seja visível
      await new Promise(r => setTimeout(r, 500));
      
      if (!url) {
        console.warn('[ItemImagePicker] No URL returned from function');
        toast.warning('Não foi possível obter imagem agora');
      } else {
        console.log('[ItemImagePicker] New image URL:', url);
        // Garante que o estado seja atualizado e o componente pai notificado
        onChange(url);
        toast.success((data as any)?.source === 'ai' ? 'Imagem gerada pela IA' : 'Imagem aplicada com sucesso');
      }
    } catch (err: any) {
      console.error('[ItemImagePicker] Error generating image:', err);
      // Se for timeout do Edge Function, já avisamos no timeoutId
      if (err.message !== 'timeout') {
        toast.error('Falha ao gerar imagem. A tela foi destravada para permitir salvar.');
      }
    } finally {
      clearTimeout(timeoutId);
      // Garante que o estado 'busy' seja resetado antes de qualquer outra coisa
      // para evitar que o formulário pai fique bloqueado
      busyRef.current = false;
      _setBusy(false);
      if (onBusy) onBusy(false);
      setStep('idle');
      console.log('[ItemImagePicker] Generation finished and UI unlocked');
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
    <div className="grid gap-2" data-busy={busy}>
      <Label className="flex items-center gap-2"><ImageIcon className="w-3.5 h-3.5 text-primary" /> Imagem do item</Label>
      <div className="flex items-start gap-3">
        <div className="relative w-28 h-28 shrink-0 rounded-lg border bg-muted/30 overflow-hidden flex items-center justify-center">
          {busy ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm z-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary mb-1" />
              <span className="text-[9px] font-bold uppercase text-primary animate-pulse">{step === 'generating' ? 'IA...' : '...'}</span>
            </div>
          ) : null}
          
          {imageUrl ? (
            <>
              <img src={imageUrl} alt={name || kind} className="w-full h-full object-cover" />
              {!busy && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(null);
                  }}
                  title="Remover"
                  className="absolute top-1 right-1 bg-background/80 hover:bg-background rounded-full p-0.5 border z-20"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
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
