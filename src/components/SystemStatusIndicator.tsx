/**
 * SystemStatusIndicator — chip discreto, fixo no canto inferior-direito.
 * - Mostra estado de serviços (IA, imagens) quando algo está em modo contingência/OFF.
 * - Para Master/Admin, abre detalhes ao clicar.
 * - Some quando tudo está normal (não polui a UI).
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
  const [savings, setSavings] = useState({ count: 0, credits: 0, last24h: 0 });

  const isPrivileged = !!(isMaster || isAdmin);
  const showChip = !isOn; // só aparece quando algo está em modo contingência

  useEffect(() => {
    if (!expanded || !isPrivileged) return;
    (async () => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data, count } = await supabase
        .from("ai_savings_log")
        .select("estimated_credits, created_at", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(200);
      let total = 0, last24 = 0;
      (data || []).forEach((r: any) => {
        const v = Number(r.estimated_credits || 0);
        total += v;
        if (new Date(r.created_at).getTime() > Date.now() - 86400000) last24 += v;
      });
      setSavings({ count: count || 0, credits: total, last24h: last24 });
    })();
  }, [expanded, isPrivileged]);

  if (!showChip) return null;

  return (
    <div className="fixed bottom-3 right-3 z-[60] pointer-events-none">
      <motion.button
        type="button"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 0.65, y: 0 }}
        whileHover={{ opacity: 1 }}
        onClick={() => isPrivileged && setExpanded(true)}
        className={`pointer-events-auto flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium border backdrop-blur-md
          bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30
          ${isPrivileged ? "cursor-pointer hover:opacity-100" : "cursor-default"}`}
        title={isPrivileged ? "Clique para detalhes" : "Sistema operando em modo economia"}
        aria-label="Status do sistema"
      >
        <ZapOff className="w-3 h-3" />
        <span>IA off · contingência</span>
      </motion.button>

      <AnimatePresence>
        {expanded && isPrivileged && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="pointer-events-auto absolute bottom-8 right-0 w-72 rounded-xl border bg-card shadow-xl p-3"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <Power className="w-3.5 h-3.5 text-amber-500" />
                Status de Serviços
              </div>
              <button onClick={() => setExpanded(false)} className="text-muted-foreground hover:text-foreground" aria-label="Fechar">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-2 text-[11px]">
              <Row icon={<Sparkles className="w-3 h-3" />} label="IA paga (Lovable AI)" status={isOn ? "online" : "off"} />
              <Row icon={<ImageOff className="w-3 h-3" />} label="Geração de imagens" status={isOn ? "online" : "fallback"} note={!isOn ? "Unsplash → Pixabay" : undefined} />
              <Row icon={<AlertTriangle className="w-3 h-3" />} label="Auto-OFF em erro" status="online" />
            </div>

            <div className="mt-3 pt-2 border-t grid grid-cols-2 gap-2">
              <div className="rounded-md bg-muted/40 p-2">
                <div className="text-[10px] text-muted-foreground">Economia 24h</div>
                <div className="text-sm font-semibold tabular-nums">~{savings.last24h.toFixed(0)} créditos</div>
              </div>
              <div className="rounded-md bg-muted/40 p-2">
                <div className="text-[10px] text-muted-foreground">Desvios totais</div>
                <div className="text-sm font-semibold tabular-nums">{savings.count}</div>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground mt-2">
              Modo OFF protege os créditos do projeto. Reative em <strong>Admin → IA Governance</strong>.
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
