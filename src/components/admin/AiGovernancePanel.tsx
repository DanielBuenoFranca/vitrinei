// Painel de Governança de IA — controle do Mestre.
// - Toggle ON/OFF do consumo de créditos.
// - Auto-OFF em erro (quando IA paga falhar).
// - Contador de economia (créditos desviados para alternativas grátis).
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAiMode } from "@/hooks/useAiMode";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, ZapOff, Coins, RefreshCw, Power } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function AiGovernancePanel() {
  const { mode, isOn, setMode, loading } = useAiMode();
  const { user } = useAuth();
  const [autoOff, setAutoOff] = useState(true);
  const [savings, setSavings] = useState({ count: 0, credits: 0, last24h: 0 });
  const [byFeature, setByFeature] = useState<Record<string, number>>({});

  const loadSavings = async () => {
    const { data: cfg } = await supabase.from("site_settings").select("value").eq("key", "ai_credits_mode").maybeSingle();
    setAutoOff(!!(cfg?.value as any)?.auto_off_on_error);

    const { data, count } = await supabase
      .from("ai_savings_log")
      .select("feature, estimated_credits, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(500);

    const since = Date.now() - 24 * 60 * 60 * 1000;
    let total = 0, last24 = 0;
    const byF: Record<string, number> = {};
    (data || []).forEach((r: any) => {
      total += Number(r.estimated_credits || 0);
      if (new Date(r.created_at).getTime() > since) last24 += Number(r.estimated_credits || 0);
      byF[r.feature] = (byF[r.feature] || 0) + Number(r.estimated_credits || 0);
    });
    setSavings({ count: count || 0, credits: total, last24h: last24 });
    setByFeature(byF);
  };

  useEffect(() => { loadSavings(); }, [mode]);

  const toggleAutoOff = async (next: boolean) => {
    const { data } = await supabase.from("site_settings").select("id, value").eq("key","ai_credits_mode").maybeSingle();
    const merged = { ...(data?.value as any || {}), mode, auto_off_on_error: next };
    if (data?.id) await supabase.from("site_settings").update({ value: merged, updated_at: new Date().toISOString() }).eq("id", data.id);
    setAutoOff(next);
    toast.success(next ? "Auto-desligamento em erro ativado" : "Auto-desligamento desativado");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Power className="h-4 w-4" /> Consumo de Créditos de IA
            </CardTitle>
            <CardDescription>
              Controla se o sistema usa IA paga (geração de imagens, chat avançado) ou alternativas gratuitas.
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={isOn ? "default" : "secondary"} className="gap-1">
              {isOn ? <Sparkles className="h-3 w-3" /> : <ZapOff className="h-3 w-3" />}
              {isOn ? "IA Ativa" : "Modo Economia"}
            </Badge>
            <Switch checked={isOn} disabled={loading} onCheckedChange={(v) => setMode(v ? "on" : "off", user?.id)} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-lg border p-3 bg-card">
            <div className="text-xs text-muted-foreground flex items-center gap-1"><Coins className="h-3 w-3" /> Créditos economizados (total)</div>
            <div className="text-2xl font-semibold tabular-nums mt-1">~{savings.credits.toFixed(0)}</div>
            <div className="text-[11px] text-muted-foreground">{savings.count} chamadas desviadas</div>
          </div>
          <div className="rounded-lg border p-3 bg-card">
            <div className="text-xs text-muted-foreground">Últimas 24h</div>
            <div className="text-2xl font-semibold tabular-nums mt-1">~{savings.last24h.toFixed(0)}</div>
            <div className="text-[11px] text-muted-foreground">créditos preservados</div>
          </div>
          <div className="rounded-lg border p-3 bg-card flex flex-col justify-between">
            <div>
              <div className="text-xs text-muted-foreground">Auto-OFF em erro/sem crédito</div>
              <div className="text-[11px] text-muted-foreground mt-1">Se a IA paga falhar, o sistema desliga sozinho e usa o modo grátis.</div>
            </div>
            <div className="flex items-center justify-between mt-2">
              <Switch checked={autoOff} onCheckedChange={toggleAutoOff} />
              <Button variant="ghost" size="sm" onClick={loadSavings}><RefreshCw className="h-3 w-3" /></Button>
            </div>
          </div>
        </div>

        {Object.keys(byFeature).length > 0 && (
          <div className="rounded-lg border p-3 bg-muted/20">
            <div className="text-xs text-muted-foreground mb-2">Economia por funcionalidade</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(byFeature).map(([k, v]) => (
                <Badge key={k} variant="outline" className="text-xs">
                  {k}: ~{v.toFixed(0)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground border-t pt-3">
          <strong>Modo OFF:</strong> imagens vêm de bancos gratuitos (Unsplash → Pixabay), o Vini responde por árvore de decisão local,
          e nenhuma chamada paga é disparada. O usuário final nunca vê erro de "créditos insuficientes".
        </div>
      </CardContent>
    </Card>
  );
}
