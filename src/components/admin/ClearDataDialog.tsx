/**
 * ClearDataDialog — limpeza segura por categoria.
 * Fluxo:
 *  1) Marcar categorias.
 *  2) "Visualizar" -> carrega registros candidatos por categoria.
 *  3) Expandir e desmarcar itens individuais que não devem ser excluídos.
 *  4) Confirmar -> exclui apenas o que ficou marcado.
 *
 * Categorias contempladas (todas tabelas dinâmicas que podem virar lixo):
 *   providers, services, products, segments, kits, kit_items,
 *   stock_entries, stock_entry_items, stock_movements, ai_savings_log
 */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AlertTriangle, ChevronRight, Loader2, Eye } from 'lucide-react';

type CatKey =
  | 'providers' | 'services' | 'products' | 'segments'
  | 'kits' | 'kit_items'
  | 'stock_entries' | 'stock_entry_items' | 'stock_movements'
  | 'ai_savings_log' | 'users';

type Item = { id: string | number; label: string; sublabel?: string; selected: boolean };

interface ClearDataDialogProps {
  open: boolean;
  onClose: () => void;
  onCleared: () => void;
  // mantido para compat — não obrigatório mais
  counts?: { providers?: number; services?: number; products?: number; segments?: number };
}

type CatDef = { key: CatKey; label: string; table: string; warn?: string; idCol?: string; group: 'movements' | 'system' | 'users' };
const CATEGORIES: CatDef[] = [
  // Cadastros de movimentações (operação diária)
  { key: 'providers',         label: 'Prestadores',          table: 'providers',          warn: 'Exclui também serviços/produtos vinculados e reseta flags em perfis.', group: 'movements' },
  { key: 'products',          label: 'Produtos',             table: 'dynamic_products',   group: 'movements' },
  { key: 'services',          label: 'Serviços',             table: 'dynamic_services',   group: 'movements' },
  { key: 'kits',              label: 'Kits',                 table: 'kits',               warn: 'Exclui também itens dos kits.', group: 'movements' },
  { key: 'kit_items',         label: 'Itens de Kits (órfãos)', table: 'kit_items',        idCol: 'id', group: 'movements' },
  // Cadastros do sistema (cuidado — podem gerar inconsistências)
  { key: 'segments',          label: 'Segmentos',            table: 'segments',           group: 'system' },
  { key: 'stock_entries',     label: 'Entradas de Estoque',  table: 'stock_entries',      idCol: 'id', warn: 'Exclui itens da entrada (cardex permanece).', group: 'system' },
  { key: 'stock_entry_items', label: 'Itens de Entrada',     table: 'stock_entry_items',  idCol: 'id', group: 'system' },
  { key: 'stock_movements',   label: 'Movimentações Cardex', table: 'stock_movements',    idCol: 'id', warn: 'Apaga histórico — uso restrito.', group: 'system' },
  { key: 'ai_savings_log',    label: 'Log de Economia IA',   table: 'ai_savings_log',     idCol: 'id', group: 'system' },
  // Usuários (atenção máxima)
  { key: 'users',             label: 'Usuários (exceto Master)', table: 'profiles',       warn: 'Apaga conta de auth, perfil, carteira, assinatura e indicações. Master é preservado.', group: 'users' },
];

const GROUP_META: Record<'movements' | 'system' | 'users', { title: string; description: string; tone: string }> = {
  movements: {
    title: 'Cadastros de movimentações',
    description: 'Registros criados na operação diária da ferramenta.',
    tone: 'border-primary/30',
  },
  system: {
    title: 'Cadastros do sistema',
    description: 'Atenção — apagar pode gerar falhas ou inconsistências nos fluxos.',
    tone: 'border-destructive/40',
  },
  users: {
    title: 'Usuários do sistema',
    description: 'Apaga contas de auth + perfis. Contas Master sempre são preservadas.',
    tone: 'border-destructive/60',
  },
};

export function ClearDataDialog({ open, onClose, onCleared }: ClearDataDialogProps) {
  const [selectedCats, setSelectedCats] = useState<Record<CatKey, boolean>>({} as any);
  const [items, setItems] = useState<Record<CatKey, Item[]>>({} as any);
  const [counts, setCounts] = useState<Record<CatKey, number>>({} as any);
  const [loading, setLoading] = useState<Record<CatKey, boolean>>({} as any);
  const [openCats, setOpenCats] = useState<Record<CatKey, boolean>>({} as any);
  const [scanning, setScanning] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [scanned, setScanned] = useState(false);

  const toggleCat = (k: CatKey) => setSelectedCats(s => ({ ...s, [k]: !s[k] }));

  const labelFor = (k: CatKey, row: any): { label: string; sublabel?: string } => {
    switch (k) {
      case 'providers': return { label: row.name || `#${row.id}`, sublabel: `${row.email || ''} ${row.phone || ''}`.trim() };
      case 'services':  return { label: row.name || `#${row.id}`, sublabel: row.provider || '' };
      case 'products':  return { label: row.name || `#${row.id}`, sublabel: row.provider || '' };
      case 'segments':  return { label: row.name || `#${row.id}` };
      case 'kits':      return { label: row.name || `#${row.id}`, sublabel: `R$ ${Number(row.price || 0).toFixed(2)}` };
      case 'stock_entries': return { label: `Entrada ${row.document_number || row.id}`, sublabel: row.supplier_name || '' };
      case 'stock_movements': return { label: `${row.movement_type} · ${row.item_name}`, sublabel: new Date(row.created_at).toLocaleString('pt-BR') };
      case 'ai_savings_log': return { label: row.feature, sublabel: row.fallback_used };
      case 'users': return { label: row.display_name || row._email || `#${String(row.user_id).slice(0,6)}`, sublabel: row._email || row.phone || '' };
      default: return { label: row.name || `#${row.id}`, sublabel: row.created_at ? new Date(row.created_at).toLocaleDateString('pt-BR') : '' };
    }
  };

  const loadCategory = async (cat: typeof CATEGORIES[number]) => {
    setLoading(l => ({ ...l, [cat.key]: true }));
    if (cat.key === 'users') {
      // Carrega profiles excluindo Masters
      const [{ data: profs }, { data: roles }] = await Promise.all([
        supabase.from('profiles').select('user_id, display_name, phone').limit(1000),
        supabase.from('user_roles').select('user_id, role'),
      ]);
      const masterIds = new Set((roles || []).filter((r: any) => r.role === 'master').map((r: any) => r.user_id));
      const filtered = (profs || []).filter((p: any) => !masterIds.has(p.user_id));
      setItems(p => ({ ...p, users: filtered.map((r: any) => ({ id: r.user_id, ...labelFor('users', r), selected: true })) }));
      setCounts(c => ({ ...c, users: filtered.length }));
      setLoading(l => ({ ...l, users: false }));
      return;
    }
    const { data, count, error } = await supabase
      .from(cat.table as any)
      .select('*', { count: 'exact' })
      .order('created_at' as any, { ascending: false } as any)
      .limit(500);
    if (error) {
      const fb = await supabase.from(cat.table as any).select('*', { count: 'exact' }).limit(500);
      setItems(p => ({ ...p, [cat.key]: (fb.data || []).map((r: any) => ({ id: r.id, ...labelFor(cat.key, r), selected: true })) }));
      setCounts(c => ({ ...c, [cat.key]: fb.count || 0 }));
    } else {
      setItems(p => ({ ...p, [cat.key]: (data || []).map((r: any) => ({ id: r.id, ...labelFor(cat.key, r), selected: true })) }));
      setCounts(c => ({ ...c, [cat.key]: count || 0 }));
    }
    setLoading(l => ({ ...l, [cat.key]: false }));
  };

  const scan = async () => {
    setScanning(true);
    await Promise.all(
      CATEGORIES.filter(c => selectedCats[c.key]).map(loadCategory)
    );
    setScanned(true);
    setScanning(false);
  };

  const toggleItem = (k: CatKey, id: any) => {
    setItems(p => ({
      ...p,
      [k]: (p[k] || []).map(it => it.id === id ? { ...it, selected: !it.selected } : it),
    }));
  };

  const toggleAllInCat = (k: CatKey, value: boolean) => {
    setItems(p => ({ ...p, [k]: (p[k] || []).map(it => ({ ...it, selected: value })) }));
  };

  const totalToDelete = CATEGORIES.reduce((acc, c) => acc + (selectedCats[c.key] ? (items[c.key] || []).filter(i => i.selected).length : 0), 0);

  const handleClear = async () => {
    setClearing(true);
    try {
      // Ordem importa: filhos antes de pais
      const order: CatKey[] = [
        'stock_movements', 'stock_entry_items', 'stock_entries',
        'kit_items', 'kits',
        'services', 'products',
        'providers', 'segments', 'ai_savings_log',
        'users',
      ];
      for (const k of order) {
        if (!selectedCats[k]) continue;
        const ids = (items[k] || []).filter(i => i.selected).map(i => i.id);
        if (!ids.length) continue;
        const cat = CATEGORIES.find(c => c.key === k)!;

        if (k === 'providers') {
          const provIds = ids as number[];
          const { data: provRows } = await supabase
            .from('providers').select('id, user_id').in('id', provIds);
          const userIds = (provRows || []).map((r: any) => r.user_id).filter(Boolean);

          await supabase.from('dynamic_services').delete().in('provider_id', provIds);
          await supabase.from('dynamic_products').delete().in('provider_id', provIds);
          await supabase.from('stock_movements').delete().in('provider_id', provIds);
          const { data: entries } = await supabase.from('stock_entries').select('id').in('provider_id', provIds);
          const entryIds = (entries || []).map((e: any) => e.id);
          if (entryIds.length) await supabase.from('stock_entry_items').delete().in('entry_id', entryIds);
          await supabase.from('stock_entries').delete().in('provider_id', provIds);
          const { data: kitRows } = await supabase.from('kits').select('id').in('owner_provider_id', provIds);
          const kitIds = (kitRows || []).map((k: any) => k.id);
          if (kitIds.length) {
            await supabase.from('kit_items').delete().in('kit_id', kitIds);
            await supabase.from('kits').delete().in('id', kitIds);
          }

          const { error } = await supabase.from('providers').delete().in('id', provIds);
          if (error) toast.error(`Erro em ${cat.label}: ${error.message}`);

          if (userIds.length) {
            await supabase.from('profiles').update({
              is_provider: false,
              provider_segments: [],
              provider_active: false,
            }).in('user_id', userIds);
            await supabase.from('user_roles').delete().in('user_id', userIds).eq('role', 'provider' as any);
          }
          continue;
        }

        if (k === 'users') {
          // Usa edge function delete-user para apagar auth + todas as tabelas relacionadas
          const userIds = ids as string[];
          let okCount = 0;
          let failCount = 0;
          for (const uid of userIds) {
            const { error } = await supabase.functions.invoke('delete-user', { body: { user_id: uid } });
            if (error) { failCount++; console.error('delete-user', uid, error); }
            else okCount++;
          }
          if (failCount) toast.error(`${failCount} usuário(s) com erro de exclusão`);
          if (okCount) toast.success(`${okCount} usuário(s) excluído(s)`);
          continue;
        }

        const { error } = await supabase.from(cat.table as any).delete().in('id', ids as any);
        if (error) {
          toast.error(`Erro em ${cat.label}: ${error.message}`);
        }
      }
      toast.success('Limpeza concluída');
      setSelectedCats({} as any);
      setItems({} as any);
      setScanned(false);
      onCleared();
      onClose();
    } catch (e: any) {
      toast.error('Erro ao excluir dados: ' + (e?.message || ''));
    }
    setClearing(false);
  };

  const anyCatSelected = Object.values(selectedCats).some(Boolean);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Excluir Dados
          </DialogTitle>
          <DialogDescription>
            Selecione categorias, visualize os registros candidatos e desmarque o que <strong>não</strong> deseja excluir.
          </DialogDescription>
        </DialogHeader>

        {/* Step 1 — categorias agrupadas */}
        <div className="space-y-3">
          {(['movements', 'system', 'users'] as const).map(group => {
            const cats = CATEGORIES.filter(c => c.group === group);
            const allSelected = cats.every(c => selectedCats[c.key]);
            const meta = GROUP_META[group];
            return (
              <div key={group} className={`rounded-lg border-2 ${meta.tone} p-3 bg-card/50`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="text-sm font-semibold">{meta.title}</div>
                    <div className="text-[11px] text-muted-foreground">{meta.description}</div>
                  </div>
                  <Button
                    variant="ghost" size="sm" className="h-6 text-[10px]"
                    onClick={() => setSelectedCats(s => {
                      const next = { ...s };
                      cats.forEach(c => { next[c.key] = !allSelected; });
                      return next;
                    })}
                  >
                    {allSelected ? 'desmarcar grupo' : 'marcar grupo'}
                  </Button>
                </div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {cats.map(cat => (
                    <div key={cat.key} className="flex items-start gap-3 p-2.5 rounded-lg border bg-background">
                      <Checkbox id={cat.key} checked={!!selectedCats[cat.key]} onCheckedChange={() => toggleCat(cat.key)} />
                      <div className="grid gap-0.5 flex-1">
                        <Label htmlFor={cat.key} className="cursor-pointer text-sm">{cat.label}</Label>
                        {cat.warn && selectedCats[cat.key] && (
                          <p className="text-[10px] text-destructive">{cat.warn}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Step 2 — visualizar */}
        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" size="sm" disabled={!anyCatSelected || scanning} onClick={scan}>
            {scanning ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Eye className="h-3.5 w-3.5 mr-1.5" />}
            {scanned ? 'Atualizar lista' : 'Visualizar registros'}
          </Button>
          {scanned && (
            <Badge variant="outline" className="text-xs">
              {totalToDelete} registro(s) marcados para exclusão
            </Badge>
          )}
        </div>

        {/* Step 3 — listas detalhadas */}
        {scanned && (
          <div className="space-y-2">
            {CATEGORIES.filter(c => selectedCats[c.key]).map(cat => {
              const list = items[cat.key] || [];
              const sel = list.filter(i => i.selected).length;
              return (
                <Collapsible key={cat.key} open={!!openCats[cat.key]} onOpenChange={(v) => setOpenCats(o => ({ ...o, [cat.key]: v }))}>
                  <div className="rounded-md border">
                    <div className="flex items-center justify-between p-2 bg-muted/30">
                      <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium flex-1">
                        <ChevronRight className={`h-3.5 w-3.5 transition-transform ${openCats[cat.key] ? 'rotate-90' : ''}`} />
                        {cat.label}
                        <Badge variant="secondary" className="text-[10px]">{sel}/{list.length}{counts[cat.key] > list.length ? `+ (de ${counts[cat.key]})` : ''}</Badge>
                      </CollapsibleTrigger>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => toggleAllInCat(cat.key, true)}>marcar tudo</Button>
                        <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => toggleAllInCat(cat.key, false)}>desmarcar</Button>
                      </div>
                    </div>
                    <CollapsibleContent>
                      <div className="max-h-60 overflow-y-auto divide-y" style={{ scrollbarGutter: 'stable' }}>
                        {loading[cat.key] && <div className="p-3 text-xs text-muted-foreground text-center"><Loader2 className="h-3 w-3 animate-spin inline mr-1" /> carregando...</div>}
                        {!loading[cat.key] && list.length === 0 && <div className="p-3 text-xs text-muted-foreground text-center">Nenhum registro encontrado.</div>}
                        {list.map(it => (
                          <label key={String(it.id)} className="flex items-center gap-2 p-2 hover:bg-muted/30 cursor-pointer text-xs">
                            <Checkbox checked={it.selected} onCheckedChange={() => toggleItem(cat.key, it.id)} />
                            <div className="flex-1 min-w-0">
                              <div className="truncate font-medium">{it.label}</div>
                              {it.sublabel && <div className="truncate text-[10px] text-muted-foreground">{it.sublabel}</div>}
                            </div>
                            <span className="text-[9px] text-muted-foreground font-mono">#{String(it.id).slice(0, 6)}</span>
                          </label>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="destructive" onClick={handleClear} disabled={!scanned || totalToDelete === 0 || clearing}>
            {clearing ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />}
            Excluir {totalToDelete > 0 ? `${totalToDelete} registro(s)` : 'selecionados'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
