// Shared helpers for the global "Economia de Crédito" (AI credit saver) toggle.
// Reads the site_settings row { key: 'ai_credits_mode', value: { mode: 'on'|'off', auto_off_on_error?: bool } }
// and exposes:
//   - getAiMode(): current mode (defaults to "off" on any failure → safest = saving)
//   - autoOffOnFailure(reason): flips the toggle to OFF when the gateway returns 402/429/etc
//   - logAiSavings(feature, fallback, ...): records the saved call for the BI panel
//
// Keeps everything HTTP-based (PostgREST) to avoid forcing every function to
// import @supabase/supabase-js.

const URL = Deno.env.get("SUPABASE_URL");
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const baseHeaders = () => ({
  apikey: SERVICE_KEY ?? "",
  Authorization: `Bearer ${SERVICE_KEY ?? ""}`,
  "Content-Type": "application/json",
});

export type AiModeInfo = { mode: "on" | "off"; auto_off: boolean; raw: any };

export async function getAiMode(): Promise<AiModeInfo> {
  if (!URL || !SERVICE_KEY) return { mode: "off", auto_off: true, raw: null };
  try {
    const r = await fetch(
      `${URL}/rest/v1/site_settings?select=value&key=eq.ai_credits_mode&limit=1`,
      { headers: baseHeaders() },
    );
    if (!r.ok) return { mode: "off", auto_off: true, raw: null };
    const rows = await r.json();
    const v = rows?.[0]?.value || {};
    return {
      mode: v.mode === "on" ? "on" : "off",
      auto_off: v.auto_off_on_error !== false,
      raw: v,
    };
  } catch {
    return { mode: "off", auto_off: true, raw: null };
  }
}

export async function autoOffOnFailure(reason: string): Promise<void> {
  if (!URL || !SERVICE_KEY) return;
  try {
    const r = await fetch(
      `${URL}/rest/v1/site_settings?select=id,value&key=eq.ai_credits_mode&limit=1`,
      { headers: baseHeaders() },
    );
    if (!r.ok) return;
    const rows = await r.json();
    const row = rows?.[0];
    const cfg = row?.value || {};
    if (cfg?.auto_off_on_error === false) return;
    if (cfg?.mode === "off") return;
    const next = {
      ...cfg,
      mode: "off",
      last_auto_off_reason: reason,
      last_auto_off_at: new Date().toISOString(),
    };
    if (row?.id) {
      await fetch(`${URL}/rest/v1/site_settings?id=eq.${row.id}`, {
        method: "PATCH",
        headers: { ...baseHeaders(), Prefer: "return=minimal" },
        body: JSON.stringify({ value: next, updated_at: new Date().toISOString() }),
      });
    } else {
      await fetch(`${URL}/rest/v1/site_settings`, {
        method: "POST",
        headers: { ...baseHeaders(), Prefer: "return=minimal" },
        body: JSON.stringify({ key: "ai_credits_mode", value: next }),
      });
    }
  } catch (e) {
    console.warn("[aiCredits] autoOffOnFailure failed:", e);
  }
}

export async function logAiSavings(
  feature: string,
  fallback: string,
  estimatedCredits = 1,
  context: Record<string, unknown> = {},
): Promise<void> {
  if (!URL || !SERVICE_KEY) return;
  try {
    await fetch(`${URL}/rest/v1/ai_savings_log`, {
      method: "POST",
      headers: { ...baseHeaders(), Prefer: "return=minimal" },
      body: JSON.stringify({
        feature,
        fallback_used: fallback,
        estimated_credits: estimatedCredits,
        context,
      }),
    });
  } catch {
    /* silencioso */
  }
}

/** Convenience: true when the system is in saving mode (mode === 'off'). */
export async function isSavingMode(): Promise<boolean> {
  const { mode } = await getAiMode();
  return mode !== "on";
}
