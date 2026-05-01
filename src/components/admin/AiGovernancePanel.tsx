// Painel de Governança de IA V2.1 (Disjuntor Inteligente).
// - Toggle ON/OFF protegido por probe real na Lovable AI.
// - Período atual: contagem ao vivo de créditos economizados (zerado SOMENTE quando ligar com sucesso).
// - Histórico: lista todos os períodos arquivados com totais e datas.
// - Total geral = soma do período atual + soma do histórico.
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAiMode } from "@/hooks/useAiMode";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, ZapOff, Coins, RefreshCw, Power, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface PeriodRow {
  id: string;
  started_at: string;
  ended_at: string | null;
  total_credits_saved: number;
  total_calls_diverted: number;
}

export function AiGovernancePanel() {
  const { mode, isOn, setMode, loading } = useAiMode();
  const { user } = useAuth();
  const [autoOff, setAutoOff] = useState(true);
  const [current, setCurrent] = useState<{ credits: number; calls: number; startedAt: string | null }>({ credits: 0, calls: 0, startedAt: null });
  const [history, setHistory] = useState<PeriodRow[]>([]);
  const [byFeature, setByFeature] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);

  const loadAll = async () => {
    // Config
    const { data: cfg } = await supabase.from("site_settings").select("value").eq("key", "ai_credits_mode").maybeSingle();
    setAutoOff(!!(cfg?.value as any)?.auto_off_on_error);

    // Período atual
    const { data: cur } = await (supabase.rpc as any)("current_ai_savings");
    if (cur) setCurrent({ credits: Number(cur.credits || 0), calls: Number(cur.calls || 0), startedAt: cur.started_at || null });

    // Histórico (períodos fechados)
    const { data: hist } = await supabase
      .from("ai_savings_periods")
      .select("id, started_at, ended_at, total_credits_saved, total_calls_diverted")
      .not("ended_at", "is", null)
      .order("ended_at", { ascending: false })
      .limit(20);
    setHistory((hist || []) as PeriodRow[]);

    // Por feature (últimas 500 economias)
    const { data: log } = await supabase
      .from("ai_savings_log")
      .select("feature, estimated_credits")
      .order("created_at", { ascending: false })
      .limit(500);
    const byF: Record<string, number> = {};
    (log || []).forEach((r: any) => { byF[r.feature] = (byF[r.feature] || 0) + Number(r.estimated_credits || 0); });
    setByFeature(byF);
  };

  useEffect(() => { loadAll(); }, [mode]);

  const totalHistory = history.reduce((s, h) => s + Number(h.total_credits_saved || 0), 0);
  const totalAll = totalHistory + current.credits;

  const toggleAutoOff = async (next: boolean) => {
    const { data } = await supabase.from("site_settings").select("id, value").eq("key","ai_credits_mode").maybeSingle();
    const merged = { ...(data?.value as any || {}), mode, auto_off_on_error: next };
    if (data?.id) await supabase.from("site_settings").update({ value: merged, updated_at: new Date().toISOString() }).eq("id", data.id);
    setAutoOff(next);
    toast.success(next ? "Auto-desligamento em erro ativado" : "Auto-desligamento desativado");
  };

  const handleToggle = async (v: boolean) => {
    setBusy(true);
    const next = v ? "on" : "off";
    if (next === "on") toast.info("🔍 Verificando créditos disponíveis...");
    const result = await setMode(next, user?.id);
    if (next === "on") {
      if (result.ok) {
        toast.success("✅ IA ativada — período de economia arquivado");
      } else {
        const reasonMap: Record<string, string> = {
          no_credits: "Sem créditos disponíveis na Lovable AI",
          rate_limited: "Limite de requisições atingido",
          probe_failed: "Falha ao verificar IA",
          no_api_key: "API Key da Lovable AI não configurada",
          network_error: "Erro de rede ao testar IA",
        };
        toast.error(`❌ ${reasonMap[result.reason] || result.reason} — sistema mantido em modo economia`);
      }
    } else {
      toast.success("Modo economia ativado — novo período iniciado");
    }
    await loadAll();
    setBusy(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Power className="h-4 w-4" /> Disjuntor Inteligente de IA
            </CardTitle>
            <CardDescription>
              Controla se o sistema usa IA paga (geração de imagens, chat, enriquecimento) ou alternativas gratuitas.
              Ao tentar ligar, o sistema verifica créditos antes de assumir o consumo.
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={isOn ? "default" : "secondary"} className="gap-1">
              {isOn ? <Sparkles className="h-3 w-3" /> : <ZapOff className="h-3 w-3" />}
              {isOn ? "IA Ativa" : "Modo Economia"}
            </Badge>
            <Switch checked={isOn} disabled={loading || busy} onCheckedChange={handleToggle} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-lg border p-3 bg-card">
            <div className="text-xs text-muted-foreground flex items-center gap-1"><Coins className="h-3 w-3" /> Período atual (aberto)</div>
            <div className="text-2xl font-semibold tabular-nums mt-1">~{current.credits.toFixed(0)}</div>
            <div className="text-[11px] text-muted-foreground">{current.calls} chamadas • {current.startedAt ? `desde ${new Date(current.startedAt).toLocaleDateString("pt-BR")}` : "sem período aberto"}</div>
          </div>
          <div className="rounded-lg border p-3 bg-card">
            <div className="text-xs text-muted-foreground">Total arquivado (histórico)</div>
            <div className="text-2xl font-semibold tabular-nums mt-1">~{totalHistory.toFixed(0)}</div>
            <div className="text-[11px] text-muted-foreground">{history.length} períodos fechados</div>
          </div>
          <div className="rounded-lg border p-3 bg-card flex flex-col justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Auto-OFF em erro/sem crédito</div>
              <div className="text-[11px] text-muted-foreground mt-1">Se a IA paga falhar (402/429), o sistema desliga sozinho.</div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <Switch checked={autoOff} onCheckedChange={toggleAutoOff} />
              <Button variant="ghost" size="sm" onClick={loadAll}><RefreshCw className="h-3 w-3" /></Button>
            </div>
          </div>
        </div>

        <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-3 flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground">Total geral economizado</div>
            <div className="text-3xl font-bold text-primary tabular-nums">~{totalAll.toFixed(0)} <span className="text-sm font-normal text-muted-foreground">créditos</span></div>
          </div>
          <div className="text-[11px] text-muted-foreground text-right max-w-[180px]">
            Período atual + soma do histórico arquivado.
          </div>
        </div>

        {/* Por feature */}
        {Object.keys(byFeature).length > 0 && (
          <div className="rounded-lg border p-3 bg-muted/20">
            <div className="text-xs text-muted-foreground mb-2">Economia por funcionalidade (últimas 500 chamadas)</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(byFeature).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                <Badge key={k} variant="outline" className="text-xs">{k}: ~{v.toFixed(0)}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Histórico de períodos */}
        {history.length > 0 && (
          <div className="rounded-lg border">
            <div className="px-3 py-2 border-b bg-muted/30 text-xs font-semibold flex items-center gap-1">
              <Coins className="h-3 w-3" /> Histórico de períodos de economia
            </div>
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/20 text-muted-foreground">
                  <tr>
                    <th className="text-left px-3 py-2">Início</th>
                    <th className="text-left px-3 py-2">Fim</th>
                    <th className="text-right px-3 py-2">Créditos</th>
                    <th className="text-right px-3 py-2">Chamadas</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(h => (
                    <tr key={h.id} className="border-t">
                      <td className="px-3 py-1.5">{new Date(h.started_at).toLocaleString("pt-BR")}</td>
                      <td className="px-3 py-1.5">{h.ended_at ? new Date(h.ended_at).toLocaleString("pt-BR") : "—"}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums font-semibold">~{Number(h.total_credits_saved).toFixed(0)}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{h.total_calls_diverted}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground border-t pt-3 flex items-start gap-2">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 text-amber-500 shrink-0" />
          <div>
            <strong>Modo OFF (gating global):</strong> todas as rotinas (Lojas, Saneamento, Importação, Vini, Geração de logos, etc.)
            operam em modo gratuito/local sem gerar erros para o usuário final.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
