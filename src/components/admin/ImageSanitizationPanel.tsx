import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { ImageOff, Loader2, RefreshCw, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useBackgroundJobs } from '@/contexts/BackgroundJobsContext';

type Item = {
  kind: 'provider' | 'product' | 'kit' | 'service' | 'segment' | 'profile';
  id: number | string;
  name: string;
  segment?: string;
  current?: string | null;
  description?: string;
  type?: string;
  tags?: string[];
};

const isMissing = (url: string | null | undefined) =>
  !url || url.trim() === '' || url === 'null' || /placeholder/i.test(url);

export function ImageSanitizationPanel() {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const { startJob, isRunning } = useBackgroundJobs();
  const running = isRunning('sanitize-images') || isRunning('bulk-catalog-images') || isRunning('bulk-catalog-images-force');

  const scan = async () => {
    setLoading(true);
    try {
      const [provs, prods, kits, svcs, segs, profs] = await Promise.all([
        supabase.from('providers').select('id, name, logo_url, segment, type').order('id'),
        supabase.from('dynamic_products').select('id, name, image_url, provider, segments, tags, stock_type').order('id'),
        supabase.from('kits').select('id, name, image_url, description').order('id'),
        supabase.from('dynamic_services').select('id, name, image_url, segment, provider, segments').order('id'),
        supabase.from('segments').select('id, name, image_url, suggested_tags').order('name'),
        supabase.from('profiles').select('user_id, display_name, avatar_url, logo_url, provider_segments, is_provider').order('display_name'),
      ]);

      const list: Item[] = [];
      (provs.data || []).forEach((p: any) => {
        if (isMissing(p.logo_url))
          list.push({ kind: 'provider', id: p.id, name: p.name, segment: Array.isArray(p.segment) ? p.segment[0] : p.segment, current: p.logo_url, type: p.type });
      });
      (prods.data || []).forEach((p: any) => {
        if (isMissing(p.image_url))
          list.push({ kind: 'product', id: p.id, name: p.name, segment: p.segments?.[0] || p.provider, current: p.image_url, type: p.stock_type, tags: p.tags });
      });
      (kits.data || []).forEach((k: any) => {
        if (isMissing(k.image_url))
          list.push({ kind: 'kit', id: k.id, name: k.name, current: k.image_url, description: k.description });
      });
      (svcs.data || []).forEach((s: any) => {
        if (isMissing(s.image_url))
          list.push({ kind: 'service', id: s.id, name: s.name, segment: s.segment || s.segments?.[0] || s.provider, current: s.image_url });
      });
      (segs.data || []).forEach((s: any) => {
        if (isMissing(s.image_url))
          list.push({ kind: 'segment', id: s.id, name: s.name, current: s.image_url, tags: s.suggested_tags });
      });
      (profs.data || []).forEach((p: any) => {
        if (isMissing(p.avatar_url) && isMissing(p.logo_url))
          list.push({ 
            kind: 'profile', 
            id: p.user_id, 
            name: p.display_name || 'Usuário sem nome', 
            current: p.avatar_url,
            segment: p.provider_segments?.[0],
            type: p.is_provider ? 'provider' : 'user'
          });
      });
      setItems(list);
      toast.success(`${list.length} registros sem imagem encontrados`);
    } catch (e: any) {
      toast.error('Falha no scan: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { scan(); }, []);

  const sanitizeOne = async (item: Item) => {
    const { data, error } = await supabase.functions.invoke('sanitize-images', {
      body: { kind: item.kind, id: item.id, name: item.name, segment: item.segment },
    });
    if (error || !data?.imageUrl) throw new Error(error?.message || data?.error || 'falha');
    return data.imageUrl as string;
  };

  const runAll = async () => {
    if (items.length === 0) { toast.info('Nada a sanear'); return; }
    const queue = [...items];
    const total = queue.length;
    await startJob({
      id: 'sanitize-images',
      label: `Saneamento de imagens (${total})`,
      route: '/admin',
      run: async (report) => {
        let ok = 0, fail = 0;
        const remaining: Item[] = [];
        for (let i = 0; i < queue.length; i++) {
          const item = queue[i];
          report(`${item.kind}: ${item.name} (${i + 1}/${total})`, Math.round((i / total) * 100));
          try {
            await sanitizeOne(item);
            ok++;
            // remove do estado mesmo se o usuário ainda estiver na tela
            setItems((prev) => prev.filter((x) => !(x.kind === item.kind && x.id === item.id)));
          } catch (e) {
            console.error('sanitize failed', item, e);
            fail++;
            remaining.push(item);
          }
        }
        return { ok, fail };
      },
      successMessage: (r) => `Saneamento concluído: ${r?.ok ?? 0} ok, ${r?.fail ?? 0} falhas`,
    });
  };

  const sanitizeSingle = async (item: Item) => {
    try {
      await sanitizeOne(item);
      setItems((prev) => prev.filter((i) => !(i.kind === item.kind && i.id === item.id)));
      toast.success(`Imagem gerada para ${item.name}`);
    } catch (e: any) {
      toast.error(`Falha em ${item.name}: ${e.message}`);
    }
  };

  const kindLabel = (k: Item['kind']) =>
    k === 'provider' ? 'Prestador' : k === 'product' ? 'Produto' : k === 'kit' ? 'Kit' : k === 'service' ? 'Serviço' : k === 'profile' ? 'Usuário' : 'Segmento';
  const kindColor = (k: Item['kind']) =>
    k === 'provider' ? 'default' : k === 'product' ? 'secondary' : k === 'kit' ? 'outline' : k === 'service' ? 'secondary' : k === 'profile' ? 'outline' : 'default';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <ImageOff className="h-4 w-4" /> Saneamento de Imagens
          </CardTitle>
          <CardDescription>
            Detecta prestadores, produtos e kits sem imagem e gera via IA
          </CardDescription>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={scan} disabled={loading || running}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RefreshCw className="h-4 w-4 mr-1" />}
            Re-escanear
          </Button>
          <Button size="sm" onClick={runAll} disabled={running || items.length === 0}>
            {running ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
            Sanear todos ({items.length})
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={running}
            onClick={() => {
              startJob({
                id: 'bulk-catalog-images',
                label: 'Gerando imagens IA do catálogo',
                route: '/admin',
                run: async (report) => {
                  report('Disparando geração no servidor...', 10);
                  const { data, error } = await supabase.functions.invoke('bulk-generate-catalog-images', {
                    body: { target: 'all', force: false },
                  });
                  if (error) throw new Error(error.message);
                  report('Atualizando lista...', 95);
                  scan();
                  return data?.result;
                },
                successMessage: (r: any) =>
                  `Catálogo: Seg ${r?.segments?.ok ?? 0}/${r?.segments?.fail ?? 0} · Prest ${r?.providers?.ok ?? 0}/${r?.providers?.fail ?? 0}`,
              });
            }}
          >
            <Sparkles className="h-4 w-4 mr-1" /> Gerar imagens catálogo (IA)
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={running}
            onClick={() => {
              if (!confirm('Regerar TODAS as imagens (segmentos + prestadores), inclusive os que já têm? Custo de IA elevado.')) return;
              startJob({
                id: 'bulk-catalog-images-force',
                label: 'Regerando todas as imagens do catálogo',
                route: '/admin',
                run: async (report) => {
                  report('Disparando regeração...', 10);
                  const { data, error } = await supabase.functions.invoke('bulk-generate-catalog-images', {
                    body: { target: 'all', force: true },
                  });
                  if (error) throw new Error(error.message);
                  report('Atualizando lista...', 95);
                  scan();
                  return data?.result;
                },
                successMessage: (r: any) => `Regenerado. Seg ${r?.segments?.ok ?? 0} · Prest ${r?.providers?.ok ?? 0}`,
              });
            }}
          >
            Forçar regeração
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {running && (
          <div className="p-3 rounded-lg bg-muted/40 border text-xs text-muted-foreground">
            Rodando em segundo plano — você pode navegar livremente. O progresso aparece no canto inferior direito e um aviso será emitido ao concluir.
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
            Tudo certo — nenhum item sem imagem.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[60vh] overflow-y-auto">
          {items.map((it) => (
            <div
              key={`${it.kind}-${it.id}`}
              className="flex items-center justify-between gap-2 p-2 rounded-md border bg-card"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-10 w-10 rounded bg-muted flex items-center justify-center shrink-0">
                  <ImageOff className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{it.name}</div>
                  <div className="flex items-center gap-1">
                    <Badge variant={kindColor(it.kind) as any} className="text-[10px] px-1 py-0 h-4">
                      {kindLabel(it.kind)}
                    </Badge>
                    {it.segment && (
                      <span className="text-[10px] text-muted-foreground truncate">{it.segment}</span>
                    )}
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => sanitizeSingle(it)}
                disabled={running}
                className="shrink-0"
              >
                <Sparkles className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
