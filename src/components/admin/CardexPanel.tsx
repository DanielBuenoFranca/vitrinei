// CARDEX V2.1 — visão Master de movimentações + criação rápida de Entrada de Estoque.
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { ClipboardList, RefreshCw, Search, Plus, Loader2, Trash2, PackagePlus } from "lucide-react";
import { toast } from "sonner";

type Movement = {
  id: string;
  provider_id: number;
  item_kind: string;
  item_id: number;
  item_name: string;
  movement_type: string;
  quantity_delta: number;
  balance_after: number | null;
  reference_label: string | null;
  unit_cost: number | null;
  created_at: string;
};

type EntryRow = {
  raw_name: string;
  matched_product_id: number | null;
  create_new: boolean;
  quantity: number;
  unit_cost: number;
  applied_price: number;
  apply_choice: "keep" | "custom";
};

export function CardexPanel() {
  const [rows, setRows] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");

  const [open, setOpen] = useState(false);
  const [providers, setProviders] = useState<{ id: number; name: string }[]>([]);
  const [products, setProducts] = useState<{ id: number; name: string; price: number; provider_id: number | null }[]>([]);
  const [providerId, setProviderId] = useState<string>("");
  const [docNumber, setDocNumber] = useState("");
  const [supplier, setSupplier] = useState("");
  const [items, setItems] = useState<EntryRow[]>([
    { raw_name: "", matched_product_id: null, create_new: true, quantity: 1, unit_cost: 0, applied_price: 0, apply_choice: "custom" },
  ]);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("stock_movements").select("*").order("created_at", { ascending: false }).limit(300);
    setRows((data || []) as any);
    setLoading(false);
  };
  const loadOptions = async () => {
    const [{ data: pv }, { data: pr }] = await Promise.all([
      supabase.from("providers").select("id, name").order("name").limit(500),
      supabase.from("dynamic_products").select("id, name, price, provider_id").order("name").limit(1000),
    ]);
    setProviders((pv as any) || []);
    setProducts((pr as any) || []);
  };
  useEffect(() => { load(); loadOptions(); }, []);

  const filtered = rows.filter((r) => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return [r.item_name, r.reference_label, r.movement_type].some((v) => (v || "").toLowerCase().includes(q));
  });

  const addItemRow = () => setItems((it) => [...it, { raw_name: "", matched_product_id: null, create_new: true, quantity: 1, unit_cost: 0, applied_price: 0, apply_choice: "custom" }]);
  const removeItemRow = (idx: number) => setItems((it) => it.filter((_, i) => i !== idx));
  const updateItem = (idx: number, patch: Partial<EntryRow>) => setItems((it) => it.map((r, i) => (i === idx ? { ...r, ...patch } : r)));

  const submitEntry = async () => {
    const pid = Number(providerId);
    if (!pid) { toast.error("Selecione o prestador/fornecedor destino do estoque"); return; }
    const validItems = items.filter((i) => (i.create_new ? i.raw_name.trim() : i.matched_product_id) && i.quantity > 0);
    if (!validItems.length) { toast.error("Adicione ao menos um item válido"); return; }

    setSaving(true);
    try {
      const total = validItems.reduce((s, i) => s + i.unit_cost * i.quantity, 0);
      const { data: entry, error: e1 } = await supabase
        .from("stock_entries")
        .insert({
          provider_id: pid,
          source_type: "manual",
          document_number: docNumber || null,
          supplier_name: supplier || null,
          total_amount: total,
        } as any)
        .select("id")
        .single();
      if (e1 || !entry) throw e1 || new Error("Falha ao criar entrada");

      const payload = validItems.map((i) => {
        const matched = i.matched_product_id ? products.find((p) => p.id === i.matched_product_id) : null;
        return {
          entry_id: entry.id,
          raw_name: i.create_new ? i.raw_name.trim() : matched?.name || i.raw_name.trim(),
          matched_product_id: i.create_new ? null : i.matched_product_id,
          create_new: i.create_new,
          quantity: i.quantity,
          unit_cost: i.unit_cost,
          current_price: matched?.price || 0,
          suggested_price: i.applied_price || matched?.price || i.unit_cost,
          applied_price: i.applied_price || matched?.price || i.unit_cost,
          apply_choice: i.apply_choice,
          unit: "un",
        };
      });

      const { error: e2 } = await supabase.from("stock_entry_items").insert(payload as any);
      if (e2) throw e2;

      const { error: e3 } = await (supabase.rpc as any)("apply_stock_entry", { _entry_id: entry.id });
      if (e3) throw e3;

      toast.success("Entrada aplicada — saldos atualizados.");
      setOpen(false);
      setItems([{ raw_name: "", matched_product_id: null, create_new: true, quantity: 1, unit_cost: 0, applied_price: 0, apply_choice: "custom" }]);
      setDocNumber(""); setSupplier("");
      await Promise.all([load(), loadOptions()]);
    } catch (err: any) {
      toast.error("Erro ao aplicar entrada: " + (err?.message || "desconhecido"));
    }
    setSaving(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
        <div>
          <CardTitle className="text-base flex items-center gap-2"><ClipboardList className="h-4 w-4" /> CARDEX — Movimentações</CardTitle>
          <CardDescription>Auditoria granular + entrada manual de estoque (RPC <code>apply_stock_entry</code>).</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="h-3 w-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filtrar..." className="pl-7 h-8 w-48" />
          </div>
          <Button size="sm" variant="default" onClick={() => setOpen(true)}>
            <Plus className="h-3 w-3 mr-1" /> Nova Entrada
          </Button>
          <Button size="sm" variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`h-3 w-3 mr-1 ${loading ? "animate-spin" : ""}`} /> Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Δ Qtd</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead className="text-right">Custo Un.</TableHead>
                <TableHead>Referência</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs whitespace-nowrap">{new Date(r.created_at).toLocaleString("pt-BR")}</TableCell>
                  <TableCell className="text-xs">
                    <div className="font-medium">{r.item_name}</div>
                    <div className="text-[10px] text-muted-foreground">{r.item_kind} #{r.item_id}</div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px]">{r.movement_type}</Badge></TableCell>
                  <TableCell className={`text-right tabular-nums text-xs ${r.quantity_delta < 0 ? "text-destructive" : "text-emerald-600"}`}>
                    {r.quantity_delta > 0 ? "+" : ""}{r.quantity_delta}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-xs">{r.balance_after ?? "—"}</TableCell>
                  <TableCell className="text-right tabular-nums text-xs">{r.unit_cost ? `R$ ${Number(r.unit_cost).toFixed(2)}` : "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground truncate max-w-[280px]">{r.reference_label || "—"}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && !loading && (
                <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">Nenhuma movimentação encontrada.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><PackagePlus className="h-4 w-4" /> Nova Entrada de Estoque</DialogTitle>
            <DialogDescription>Registra entrada manual; cria/atualiza produtos e dispara movimento auditável no CARDEX.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-1">
                <label className="text-[11px] font-medium block mb-1">Prestador destino *</label>
                <Select value={providerId} onValueChange={setProviderId}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {providers.map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[11px] font-medium block mb-1">Nº documento</label>
                <Input value={docNumber} onChange={(e) => setDocNumber(e.target.value)} placeholder="NF/Pedido" className="h-9" />
              </div>
              <div>
                <label className="text-[11px] font-medium block mb-1">Fornecedor</label>
                <Input value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="Quem entregou" className="h-9" />
              </div>
            </div>

            <div className="border rounded-md">
              <div className="grid grid-cols-12 gap-1 px-2 py-1.5 bg-muted/40 text-[10px] font-semibold uppercase">
                <div className="col-span-5">Item</div>
                <div className="col-span-2">Qtd</div>
                <div className="col-span-2">Custo un.</div>
                <div className="col-span-2">Preço venda</div>
                <div className="col-span-1"></div>
              </div>
              {items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-1 px-2 py-1.5 border-t items-center">
                  <div className="col-span-5">
                    {it.create_new ? (
                      <Input
                        value={it.raw_name}
                        onChange={(e) => updateItem(idx, { raw_name: e.target.value })}
                        placeholder="Nome do produto novo"
                        className="h-8"
                      />
                    ) : (
                      <Select value={it.matched_product_id ? String(it.matched_product_id) : ""} onValueChange={(v) => updateItem(idx, { matched_product_id: Number(v) })}>
                        <SelectTrigger className="h-8"><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {products
                            .filter((p) => !providerId || !p.provider_id || p.provider_id === Number(providerId))
                            .slice(0, 200)
                            .map((p) => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )}
                    <button type="button" onClick={() => updateItem(idx, { create_new: !it.create_new })} className="text-[10px] text-primary mt-0.5">
                      {it.create_new ? "↪ usar produto existente" : "↪ criar novo produto"}
                    </button>
                  </div>
                  <div className="col-span-2"><Input type="number" min={1} value={it.quantity} onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) })} className="h-8" /></div>
                  <div className="col-span-2"><Input type="number" step="0.01" min={0} value={it.unit_cost} onChange={(e) => updateItem(idx, { unit_cost: Number(e.target.value) })} className="h-8" /></div>
                  <div className="col-span-2"><Input type="number" step="0.01" min={0} value={it.applied_price} onChange={(e) => updateItem(idx, { applied_price: Number(e.target.value) })} className="h-8" /></div>
                  <div className="col-span-1 text-right">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeItemRow(idx)} disabled={items.length <= 1}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="px-2 py-1.5 border-t">
                <Button size="sm" variant="outline" onClick={addItemRow}><Plus className="h-3 w-3 mr-1" /> Adicionar item</Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={submitEntry} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />} Aplicar Entrada
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
