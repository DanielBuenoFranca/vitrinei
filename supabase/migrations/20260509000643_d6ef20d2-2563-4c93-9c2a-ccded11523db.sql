-- Padrões aprendidos pelo cérebro do Vini
CREATE TABLE IF NOT EXISTS public.vini_brain_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic text NOT NULL,
  keywords text[] NOT NULL DEFAULT '{}',
  replies text[] NOT NULL DEFAULT '{}',
  follow_up text,
  hits integer NOT NULL DEFAULT 0,
  successes integer NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT 'ai',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  CONSTRAINT vini_brain_patterns_source_chk CHECK (source IN ('ai','stat','manual'))
);

CREATE INDEX IF NOT EXISTS vini_brain_patterns_keywords_idx
  ON public.vini_brain_patterns USING gin (keywords);
CREATE INDEX IF NOT EXISTS vini_brain_patterns_topic_idx
  ON public.vini_brain_patterns (topic);
CREATE INDEX IF NOT EXISTS vini_brain_patterns_score_idx
  ON public.vini_brain_patterns ((successes - (hits - successes)) DESC);

ALTER TABLE public.vini_brain_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brain patterns readable by all"
  ON public.vini_brain_patterns FOR SELECT USING (true);

CREATE TRIGGER trg_vini_brain_patterns_updated
  BEFORE UPDATE ON public.vini_brain_patterns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Sinais de cada turno conversado
CREATE TABLE IF NOT EXISTS public.vini_brain_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_id uuid REFERENCES public.vini_brain_patterns(id) ON DELETE SET NULL,
  user_message text NOT NULL,
  assistant_reply text NOT NULL,
  mode text NOT NULL,
  session_id uuid,
  user_id uuid,
  signal text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT vini_brain_signals_mode_chk CHECK (mode IN ('ai','local'))
);

CREATE INDEX IF NOT EXISTS vini_brain_signals_pattern_idx
  ON public.vini_brain_signals (pattern_id);
CREATE INDEX IF NOT EXISTS vini_brain_signals_session_idx
  ON public.vini_brain_signals (session_id);

ALTER TABLE public.vini_brain_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "brain signals readable by all"
  ON public.vini_brain_signals FOR SELECT USING (true);

-- Função para registrar acerto de um padrão sem corrida
CREATE OR REPLACE FUNCTION public.vini_brain_register_hit(
  p_pattern_id uuid,
  p_success boolean DEFAULT true
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.vini_brain_patterns
     SET hits = hits + 1,
         successes = successes + CASE WHEN p_success THEN 1 ELSE 0 END,
         last_used_at = now()
   WHERE id = p_pattern_id;
END;
$$;

REVOKE ALL ON FUNCTION public.vini_brain_register_hit(uuid, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.vini_brain_register_hit(uuid, boolean) TO service_role;