// CARDEX Auditável — visão Master de todas as movimentações de estoque.
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { ClipboardList, RefreshCw, Search } from "lucide-react";

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

export function CardexPanel() {
  const [rows, setRows] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("stock_movements").select("*").order("created_at", { ascending: false }).limit(300);
    setRows((data || []) as any);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = rows.filter((r) => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return [r.item_name, r.reference_label, r.movement_type].some((v) => (v || "").toLowerCase().includes(q));
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
        <div>
          <CardTitle className="text-base flex items-center gap-2"><ClipboardList className="h-4 w-4" /> CARDEX — Movimentações</CardTitle>
          <CardDescription>Auditoria granular de cada entrada e saída de estoque.</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="h-3 w-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filtrar..." className="pl-7 h-8 w-48" />
          </div>
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
    </Card>
  );
}
