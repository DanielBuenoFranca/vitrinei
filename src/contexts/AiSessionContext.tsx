import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export interface AiSessionState {
  tags: string[];
  segments: string[];
  priceRange?: { min?: number; max?: number };
  location?: { lat?: number; lon?: number; city?: string };
  cartSnapshot?: any[];
  lastIntent?: string;
  lastQuery?: string;
}

interface Ctx {
  session: AiSessionState;
  update: (patch: Partial<AiSessionState>) => void;
  clear: () => void;
}

const KEY = 'vitrinei_ai_session_v1';
const AiSessionCtx = createContext<Ctx | null>(null);

const load = (): AiSessionState => {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { tags: [], segments: [] };
};

export const AiSessionProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<AiSessionState>(load);

  useEffect(() => {
    try { sessionStorage.setItem(KEY, JSON.stringify(session)); } catch {}
  }, [session]);

  const update = useCallback((patch: Partial<AiSessionState>) => {
    setSession((s) => ({
      ...s,
      ...patch,
      tags: patch.tags ? Array.from(new Set([...(s.tags || []), ...patch.tags])) : s.tags,
      segments: patch.segments ? Array.from(new Set([...(s.segments || []), ...patch.segments])) : s.segments,
    }));
  }, []);

  const clear = useCallback(() => setSession({ tags: [], segments: [] }), []);

  return <AiSessionCtx.Provider value={{ session, update, clear }}>{children}</AiSessionCtx.Provider>;
};

export const useAiSession = () => {
  const ctx = useContext(AiSessionCtx);
  if (!ctx) throw new Error('useAiSession must be used within AiSessionProvider');
  return ctx;
};
