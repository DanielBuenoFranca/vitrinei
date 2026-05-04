// Painel Master de Leads — Jornada completa:
// Indicação → Cadastro → Assinatura paga → 1ª Compra/Venda → Bônus liberado.
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, RefreshCw, Search, CheckCircle2, Circle } from "lucide-react";

interface Lead {
  id: string;
  referrer_id: string;
  referrer_name?: string;
  referred_id: string | null;
  referred_name: string | null;
  referred_email: string | null;
  referred_role: string | null;
  status: string;
  joined_at: string | null;
  created_at: string;
  buyer_released: boolean;
  seller_released: boolean;
  bonus_released: boolean;
  total_paid: number;
  // computed
  has_subscription: boolean;
  first_purchase_at: string | null;
  first_sale_at: string | null;
}

const Step = ({ done, label, sub }: { done: boolean; label: string; sub?: string | null }) => (
  <div className="flex items-center gap-1.5 min-w-0">
    {done ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <Circle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
    <div className="min-w-0">
      <div className={`text-[11px] truncate ${done ? "text-foreground" : "text-muted-foreground"}`}>{label}</div>
      {sub && <div className="text-[9px] text-muted-foreground truncate">{sub}</div>}
    </div>
  </div>
);

export function LeadsJourneyPanel() {
  const [rows, setRows] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");

  const load = async () => {
    setLoading(true);
    const { data: refs } = await supabase
      .from("referrals")
      .select("id, referrer_id, referred_id, referred_name, referred_email, referred_role, status, joined_at, created_at, buyer_released, seller_released, bonus_released, total_paid")
      .order("created_at", { ascending: false })
      .limit(200);

    const list = (refs || []) as any[];
    const referrerIds = [...new Set(list.map((r) => r.referrer_id))];
    const referredIds = list.map((r) => r.referred_id).filter(Boolean) as string[];

    const [{ data: profiles }, { data: subs }, { data: txs }] = await Promise.all([
      supabase.from("profiles").select("user_id, display_name").in("user_id", referrerIds.length ? referrerIds : ["00000000-0000-0000-0000-000000000000"]),
      referredIds.length
        ? supabase.from("subscriptions").select("user_id, status").eq("status", "active").in("user_id", referredIds)
        : Promise.resolve({ data: [] as any[] }),
      referredIds.length
        ? supabase.from("wallet_transactions").select("user_id, type, created_at").in("user_id", referredIds).in("type", ["purchase", "sale_credit", "subscription_payment"])
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const nameMap: Record<string, string> = {};
    (profiles || []).forEach((p: any) => { nameMap[p.user_id] = p.display_name || "Sem nome"; });
    const subSet = new Set((subs || []).map((s: any) => s.user_id));
    const firstByType: Record<string, { purchase?: string; sale?: string }> = {};
    (txs || []).forEach((t: any) => {
      const key = t.user_id;
      if (!firstByType[key]) firstByType[key] = {};
      if (t.type === "purchase" || t.type === "subscription_payment") {
        if (!firstByType[key].purchase || t.created_at < firstByType[key].purchase!) firstByType[key].purchase = t.created_at;
      } else if (t.type === "sale_credit") {
        if (!firstByType[key].sale || t.created_at < firstByType[key].sale!) firstByType[key].sale = t.created_at;
      }
    });

    const enriched: Lead[] = list.map((r) => ({
      ...r,
      referrer_name: nameMap[r.referrer_id] || r.referrer_id?.slice(0, 6) || "—",
      has_subscription: !!(r.referred_id && subSet.has(r.referred_id)),
      first_purchase_at: r.referred_id ? firstByType[r.referred_id]?.purchase ?? null : null,
      first_sale_at: r.referred_id ? firstByType[r.referred_id]?.sale ?? null : null,
    }));
    setRows(enriched);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = rows.filter((r) => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return [r.referred_name, r.referred_email, r.referrer_name, r.status].some((v) => (v || "").toString().toLowerCase().includes(q));
  });

  const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString("pt-BR") : null);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 flex-wrap">
        <div>
          <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Painel Master de Leads</CardTitle>
          <CardDescription>Jornada completa: Indicação → Cadastro → Assinatura paga → 1ª compra/venda → Bônus liberado.</CardDescription>
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
                <TableHead>Indicador</TableHead>
                <TableHead>Indicado</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead className="min-w-[760px]">Jornada</TableHead>
                <TableHead className="text-right">Pago (R$)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => {
                const profileLabel = r.referred_role === "mixed" ? "Bônus Extra" : r.referred_role === "provider" ? "Prestador" : r.referred_role === "client" ? "Comprador" : (r.referred_role || "—");
                const isMixed = r.referred_role === "mixed" || r.referred_role === "provider";
                return (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs font-medium">{r.referrer_name}</TableCell>
                    <TableCell className="text-xs">
                      <div className="font-medium">{r.referred_name || "—"}</div>
                      <div className="text-[10px] text-muted-foreground">{r.referred_email || ""}</div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-[9px]">{profileLabel}</Badge></TableCell>
                    <TableCell>
                      <div className="grid grid-cols-5 gap-2 items-center">
                        <Step done={true} label="Indicação" sub={fmt(r.created_at)} />
                        <Step done={!!r.referred_id} label="Cadastro" sub={fmt(r.joined_at)} />
                        <Step done={r.has_subscription} label="Assinatura" sub={r.has_subscription ? "ativa" : null} />
                        <Step done={!!r.first_purchase_at || !!r.first_sale_at} label={isMixed ? "1ª compra/venda" : "1ª compra"} sub={fmt(r.first_purchase_at || r.first_sale_at)} />
                        <Step done={r.bonus_released || r.status === "activated"} label="Bônus liberado" sub={r.status} />
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-xs">{Number(r.total_paid || 0).toFixed(2)}</TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && !loading && (
                <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">Nenhum lead encontrado.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
