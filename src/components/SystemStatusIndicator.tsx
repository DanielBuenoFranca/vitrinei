/**
 * SystemStatusIndicator V2.1 — chip discreto, fixo no canto direito da tela,
 * verticalmente acima do botão flutuante (+) do menu lateral.
 * - Mostra APENAS o símbolo (sem texto).
 * - Aparece quando a IA paga está em modo contingência (OFF).
 * - Master/Admin pode clicar para ver detalhes do período aberto + economia ao vivo.
 */
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ZapOff, Sparkles, AlertTriangle, X, Power, ImageOff } from "lucide-react";
import { useAiMode } from "@/hooks/useAiMode";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function SystemStatusIndicator() {
  const { mode, isOn } = useAiMode();
  const { isMaster, isAdmin } = useAuth() as any;
  const [expanded, setExpanded] = useState(false);
  const [savings, setSavings] = useState({ credits: 0, calls: 0, periodStart: null as string | null });

  const isPrivileged = !!(isMaster || isAdmin);
  const showChip = !isOn;

  const loadSavings = async () => {
    try {
      const { data } = await (supabase.rpc as any)("current_ai_savings");
      if (data) {
        setSavings({
          credits: Number(data.credits || 0),
          calls: Number(data.calls || 0),
          periodStart: data.started_at || null,
        });
      }
    } catch { /* silent */ }
  };

  useEffect(() => {
    if (!showChip) return;
    loadSavings();
    const interval = setInterval(loadSavings, 30000);
    return () => clearInterval(interval);
  }, [showChip]);

  if (!showChip) return null;

  return (
    // Posicionado verticalmente acima do botão flutuante "+" (que costuma ficar bottom-3 right-3, ~h-12)
    <div className="fixed right-3 bottom-20 z-[60] pointer-events-none">
      <motion.button
        type="button"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 0.85, scale: 1 }}
        whileHover={{ opacity: 1, scale: 1.08 }}
        onClick={() => isPrivileged && setExpanded(true)}
        className={`pointer-events-auto w-9 h-9 rounded-full border backdrop-blur-md flex items-center justify-center shadow-md
          bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/40
          ${isPrivileged ? "cursor-pointer" : "cursor-default"}`}
        title={isPrivileged ? "IA em contingência — clique para detalhes" : "Sistema operando em modo economia"}
        aria-label="IA em modo economia"
      >
        <ZapOff className="w-4 h-4" />
      </motion.button>

      <AnimatePresence>
        {expanded && isPrivileged && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="pointer-events-auto absolute bottom-12 right-0 w-72 rounded-xl border bg-card shadow-xl p-3"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <Power className="w-3.5 h-3.5 text-amber-500" />
                IA em modo economia
              </div>
              <button onClick={() => setExpanded(false)} className="text-muted-foreground hover:text-foreground" aria-label="Fechar">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-2 text-[11px]">
              <Row icon={<Sparkles className="w-3 h-3" />} label="IA paga (Lovable AI)" status="off" />
              <Row icon={<ImageOff className="w-3 h-3" />} label="Geração de imagens" status="fallback" note="Unsplash → Pixabay" />
              <Row icon={<AlertTriangle className="w-3 h-3" />} label="Auto-OFF em erro" status="online" />
            </div>

            <div className="mt-3 pt-2 border-t grid grid-cols-2 gap-2">
              <div className="rounded-md bg-muted/40 p-2">
                <div className="text-[10px] text-muted-foreground">Economia (período aberto)</div>
                <div className="text-sm font-semibold tabular-nums">~{savings.credits.toFixed(0)} créditos</div>
              </div>
              <div className="rounded-md bg-muted/40 p-2">
                <div className="text-[10px] text-muted-foreground">Chamadas desviadas</div>
                <div className="text-sm font-semibold tabular-nums">{savings.calls}</div>
              </div>
            </div>
            {savings.periodStart && (
              <p className="text-[10px] text-muted-foreground mt-2">
                Desde {new Date(savings.periodStart).toLocaleString("pt-BR")}
              </p>
            )}
            <p className="text-[10px] text-muted-foreground mt-2">
              Reative em <strong>Admin → IA Governance</strong>.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Row({ icon, label, status, note }: { icon: React.ReactNode; label: string; status: "online" | "off" | "fallback"; note?: string }) {
  const tone =
    status === "online" ? "text-emerald-600 bg-emerald-500/10"
    : status === "fallback" ? "text-blue-600 bg-blue-500/10"
    : "text-amber-600 bg-amber-500/10";
  const txt = status === "online" ? "Online" : status === "fallback" ? "Fallback grátis" : "Desligado";
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5 text-foreground/80">{icon} {label}</div>
      <div className="text-right">
        <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${tone}`}>{txt}</span>
        {note && <div className="text-[9px] text-muted-foreground mt-0.5">{note}</div>}
      </div>
    </div>
  );
}
