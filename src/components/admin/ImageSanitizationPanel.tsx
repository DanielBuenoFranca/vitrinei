import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { ImageOff, Loader2, RefreshCw, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

type Item = {
  kind: 'provider' | 'product' | 'kit' | 'service' | 'segment' | 'profile';
  id: number | string;
  name: string;
  segment?: string;
  current?: string | null;
};

const isMissing = (url: string | null | undefined) =>
  !url || url.trim() === '' || url === 'null' || /placeholder/i.test(url);

export function ImageSanitizationPanel() {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, current: '' });
  const [results, setResults] = useState<{ ok: number; fail: number }>({ ok: 0, fail: 0 });

  const scan = async () => {
    setLoading(true);
    try {
      const [provs, prods, kits, svcs, segs, profs] = await Promise.all([
        supabase.from('providers').select('id, name, logo_url, segment').order('id'),
        supabase.from('dynamic_products').select('id, name, image_url, provider').order('id'),
        supabase.from('kits').select('id, name, image_url').order('id'),
        supabase.from('dynamic_services').select('id, name, image_url, segment, provider').order('id'),
        supabase.from('segments').select('id, name, image_url').order('name'),
        supabase.from('profiles').select('user_id, display_name, avatar_url, logo_url').order('display_name'),
      ]);

      const list: Item[] = [];
      (provs.data || []).forEach((p: any) => {
        if (isMissing(p.logo_url))
          list.push({ kind: 'provider', id: p.id, name: p.name, segment: Array.isArray(p.segment) ? p.segment[0] : p.segment, current: p.logo_url });
      });
      (prods.data || []).forEach((p: any) => {
        if (isMissing(p.image_url))
          list.push({ kind: 'product', id: p.id, name: p.name, segment: p.provider, current: p.image_url });
      });
      (kits.data || []).forEach((k: any) => {
        if (isMissing(k.image_url))
          list.push({ kind: 'kit', id: k.id, name: k.name, current: k.image_url });
      });
      (svcs.data || []).forEach((s: any) => {
        if (isMissing(s.image_url))
          list.push({ kind: 'service', id: s.id, name: s.name, segment: s.segment || s.provider, current: s.image_url });
      });
      (segs.data || []).forEach((s: any) => {
        if (isMissing(s.image_url))
          list.push({ kind: 'segment', id: s.id, name: s.name, current: s.image_url });
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
    setRunning(true);
    setResults({ ok: 0, fail: 0 });
    setProgress({ done: 0, total: items.length, current: '' });
    let ok = 0, fail = 0;
    const remaining: Item[] = [];
    for (const item of items) {
      setProgress({ done: ok + fail, total: items.length, current: `${item.kind}: ${item.name}` });
      try {
        await sanitizeOne(item);
        ok++;
      } catch (e: any) {
        console.error('sanitize failed', item, e);
        fail++;
        remaining.push(item);
      }
      setResults({ ok, fail });
    }
    setProgress({ done: ok + fail, total: items.length, current: '' });
    setItems(remaining);
    setRunning(false);
    toast.success(`Saneamento concluído: ${ok} ok, ${fail} falhas`);
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
    k === 'provider' ? 'Prestador' : k === 'product' ? 'Produto' : k === 'kit' ? 'Kit' : k === 'service' ? 'Serviço' : 'Segmento';
  const kindColor = (k: Item['kind']) =>
    k === 'provider' ? 'default' : k === 'product' ? 'secondary' : k === 'kit' ? 'outline' : k === 'service' ? 'secondary' : 'default';

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
            onClick={async () => {
              setRunning(true);
              toast.info('Gerando imagens IA do catálogo (pode demorar)...');
              const { data, error } = await supabase.functions.invoke('bulk-generate-catalog-images', {
                body: { target: 'all', force: false },
              });
              setRunning(false);
              if (error) { toast.error('Falha: ' + error.message); return; }
              const r = data?.result;
              toast.success(
                `Segmentos: ${r?.segments?.ok ?? 0} ok / ${r?.segments?.fail ?? 0} falhas. ` +
                `Prestadores: ${r?.providers?.ok ?? 0} ok / ${r?.providers?.fail ?? 0} falhas.`
              );
              scan();
            }}
          >
            <Sparkles className="h-4 w-4 mr-1" /> Gerar imagens catálogo (IA)
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={running}
            onClick={async () => {
              if (!confirm('Regerar TODAS as imagens (segmentos + prestadores), inclusive os que já têm? Custo de IA elevado.')) return;
              setRunning(true);
              const { data, error } = await supabase.functions.invoke('bulk-generate-catalog-images', {
                body: { target: 'all', force: true },
              });
              setRunning(false);
              if (error) { toast.error('Falha: ' + error.message); return; }
              const r = data?.result;
              toast.success(`Regenerado. Seg: ${r?.segments?.ok}/${r?.providers?.ok} prestadores`);
              scan();
            }}
          >
            Forçar regeração
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {running && (
          <div className="space-y-1 p-3 rounded-lg bg-muted/40 border">
            <div className="flex items-center justify-between text-xs">
              <span className="truncate">{progress.current || 'Processando...'}</span>
              <span className="text-muted-foreground tabular-nums">
                {progress.done}/{progress.total}
              </span>
            </div>
            <Progress value={(progress.done / Math.max(1, progress.total)) * 100} />
            <div className="flex gap-3 text-xs pt-1">
              <span className="text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> {results.ok} ok
              </span>
              <span className="text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> {results.fail} falhas
              </span>
            </div>
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
