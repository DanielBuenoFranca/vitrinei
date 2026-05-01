// Hook global do disjuntor inteligente de IA (V2.1).
// Regras:
//  - Modo padrão é OFF (modo economia / contingência).
//  - Ao tentar ligar (ON), faz PROBE real na IA paga; se falhar (402/429/etc), volta para OFF e mantém contagem.
//  - Ao ligar com sucesso: fecha o período de economia atual (arquiva total) e zera o contador.
//  - Ao desligar: abre novo período de economia (a contagem cresce até o próximo ON com sucesso).
//  - Realtime no site_settings + na ai_savings_log para refletir economia ao vivo.

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type AiMode = "on" | "off";
type AiSettingsValue = {
  mode: AiMode;
  auto_off_on_error?: boolean;
  updated_by?: string | null;
  last_probe?: { ok: boolean; code: number; reason?: string; at: string } | null;
};

let cached: AiMode = "off";
const listeners = new Set<(m: AiMode) => void>();
let initialized = false;

async function bootstrap() {
  if (initialized) return;
  initialized = true;
  const { data } = await supabase.from("site_settings").select("value").eq("key", "ai_credits_mode").maybeSingle();
  const v = (data?.value as AiSettingsValue | null);
  if (v?.mode) {
    cached = v.mode;
  }
  listeners.forEach((l) => l(cached));

  supabase
    .channel("ai-credits-mode")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "site_settings", filter: "key=eq.ai_credits_mode" },
      (payload: any) => {
        const next = (payload?.new?.value as AiSettingsValue | null)?.mode;
        if (next && next !== cached) {
          cached = next;
          listeners.forEach((l) => l(cached));
        }
      },
    )
    .subscribe();
}

async function persistMode(next: AiMode, userId?: string | null, lastProbe?: AiSettingsValue["last_probe"]) {
  const { data: existing } = await supabase
    .from("site_settings").select("id, value").eq("key", "ai_credits_mode").maybeSingle();
  const newValue: AiSettingsValue = {
    mode: next,
    auto_off_on_error: (existing?.value as AiSettingsValue | null)?.auto_off_on_error ?? true,
    updated_by: userId ?? null,
    last_probe: lastProbe ?? (existing?.value as AiSettingsValue | null)?.last_probe ?? null,
  };
  if (existing?.id) {
    await supabase.from("site_settings").update({ value: newValue as any, updated_at: new Date().toISOString() }).eq("id", existing.id);
  } else {
    await supabase.from("site_settings").insert({ key: "ai_credits_mode", value: newValue as any });
  }
  cached = next;
  listeners.forEach((l) => l(cached));
}

export function useAiMode() {
  const [mode, setModeState] = useState<AiMode>(cached);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    bootstrap();
    const handler = (m: AiMode) => setModeState(m);
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  /**
   * Tenta mudar o modo.
   * - Para 'off': sempre permitido. Abre novo período de economia (não zera nada).
   * - Para 'on': dispara PROBE. Se falhar, mantém OFF e retorna erro para a UI.
   */
  const setMode = useCallback(async (next: AiMode, userId?: string | null) => {
    setLoading(true);
    try {
      if (next === "off") {
        await persistMode("off", userId);
        await supabase.rpc("start_ai_savings_period" as any, { _user_id: userId ?? null }).then(() => null, () => null);
        return { ok: true as const };
      }

      // ON: probe primeiro
      const probeRes = await supabase.functions.invoke("ai-credits-probe", { body: {} });
      const data: any = probeRes.data || { ok: false, code: 0, reason: "no_response" };
      const lastProbe = { ok: !!data.ok, code: Number(data.code) || 0, reason: data.reason as string | undefined, at: new Date().toISOString() };

      if (!data.ok) {
        // Falha: mantém OFF, registra last_probe
        await persistMode("off", userId, lastProbe);
        return { ok: false as const, reason: data.reason || "probe_failed", code: data.code || 0 };
      }

      // Sucesso: fecha período de economia (arquiva total) e liga
      await supabase.rpc("close_ai_savings_period" as any, { _user_id: userId ?? null }).then(() => null, () => null);
      await persistMode("on", userId, lastProbe);
      return { ok: true as const };
    } finally {
      setLoading(false);
    }
  }, []);

  return { mode, isOn: mode === "on", loading, setMode };
}

export async function getAiModeAsync(): Promise<AiMode> {
  await bootstrap();
  return cached;
}
export function getAiModeCached(): AiMode {
  return cached;
}

export async function logAiSavings(feature: string, fallback: string, estimatedCredits = 1, context: Record<string, any> = {}) {
  try {
    await supabase.from("ai_savings_log").insert({
      feature,
      fallback_used: fallback,
      estimated_credits: estimatedCredits,
      context,
    });
  } catch {
    /* silencioso */
  }
}
