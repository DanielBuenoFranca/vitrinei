// Hook global para o status do toggle de Créditos de IA (ADM Master).
// Lê site_settings.ai_credits_mode em Realtime.
// API: useAiMode() -> { mode, isOn, loading, setMode }
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type AiMode = "on" | "off";
type AiSettingsValue = { mode: AiMode; auto_off_on_error?: boolean; updated_by?: string | null };

let cached: AiMode = "on";
const listeners = new Set<(m: AiMode) => void>();
let initialized = false;

async function bootstrap() {
  if (initialized) return;
  initialized = true;
  const { data } = await supabase.from("site_settings").select("value").eq("key", "ai_credits_mode").maybeSingle();
  const v = (data?.value as AiSettingsValue | null);
  if (v?.mode) {
    cached = v.mode;
    listeners.forEach((l) => l(cached));
  }
  supabase
    .channel("ai-credits-mode")
    .on("postgres_changes", { event: "*", schema: "public", table: "site_settings", filter: "key=eq.ai_credits_mode" }, (payload: any) => {
      const next = (payload?.new?.value as AiSettingsValue | null)?.mode;
      if (next && next !== cached) {
        cached = next;
        listeners.forEach((l) => l(cached));
      }
    })
    .subscribe();
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

  const setMode = useCallback(async (next: AiMode, userId?: string | null) => {
    setLoading(true);
    const { data: existing } = await supabase.from("site_settings").select("id, value").eq("key", "ai_credits_mode").maybeSingle();
    const newValue: AiSettingsValue = {
      mode: next,
      auto_off_on_error: (existing?.value as AiSettingsValue | null)?.auto_off_on_error ?? true,
      updated_by: userId ?? null,
    };
    if (existing?.id) {
      await supabase.from("site_settings").update({ value: newValue as any, updated_at: new Date().toISOString() }).eq("id", existing.id);
    } else {
      await supabase.from("site_settings").insert({ key: "ai_credits_mode", value: newValue as any });
    }
    cached = next;
    listeners.forEach((l) => l(cached));
    setLoading(false);
  }, []);

  return { mode, isOn: mode === "on", loading, setMode };
}

// Para uso fora de componentes (interceptors)
export async function getAiModeAsync(): Promise<AiMode> {
  await bootstrap();
  return cached;
}

export function getAiModeCached(): AiMode {
  return cached;
}

// Loga uma economia (chamada que foi desviada da IA paga)
export async function logAiSavings(feature: string, fallback: string, estimatedCredits = 1, context: Record<string, any> = {}) {
  try {
    await supabase.from("ai_savings_log").insert({
      feature,
      fallback_used: fallback,
      estimated_credits: estimatedCredits,
      context,
    });
  } catch {
    // silencioso por design (Graceful Degradation)
  }
}
