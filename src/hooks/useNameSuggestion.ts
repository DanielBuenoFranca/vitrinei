import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SuggestionResult {
  suggestions: string[];
  duplicate: boolean;
  match?: string;
}

export function useNameSuggestion() {
  const [suggestions, setSuggestions] = useState<SuggestionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const suggest = useCallback((input: string, type: 'product' | 'service', existing: string[]) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (input.trim().length < 3) { setSuggestions(null); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('suggest-name', {
          body: { input, type, existing },
        });
        if (!error && data) setSuggestions(data);
      } catch { /* ignore */ }
      setLoading(false);
    }, 600);
  }, []);

  const clear = useCallback(() => setSuggestions(null), []);

  return { suggestions, loading, suggest, clear };
}
