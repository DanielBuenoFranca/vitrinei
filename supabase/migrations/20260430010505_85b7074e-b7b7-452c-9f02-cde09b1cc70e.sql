-- Provider ratings (Selo de Qualidade / Ranking)
CREATE TABLE IF NOT EXISTS public.provider_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id integer NOT NULL,
  user_id uuid,
  stars smallint NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment text,
  context jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_provider_ratings_provider ON public.provider_ratings(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_ratings_user ON public.provider_ratings(user_id);

ALTER TABLE public.provider_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read provider_ratings"
  ON public.provider_ratings FOR SELECT TO public USING (true);

CREATE POLICY "Authenticated insert ratings"
  ON public.provider_ratings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Anon insert ratings"
  ON public.provider_ratings FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Admins manage provider_ratings"
  ON public.provider_ratings FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger to keep providers.rating in sync (avg of ratings)
CREATE OR REPLACE FUNCTION public.refresh_provider_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pid integer := COALESCE(NEW.provider_id, OLD.provider_id);
  avg_stars numeric;
BEGIN
  SELECT ROUND(AVG(stars)::numeric, 2) INTO avg_stars
  FROM public.provider_ratings WHERE provider_id = pid;

  IF avg_stars IS NOT NULL THEN
    UPDATE public.providers SET rating = avg_stars WHERE id = pid;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_refresh_provider_rating ON public.provider_ratings;
CREATE TRIGGER trg_refresh_provider_rating
AFTER INSERT OR UPDATE OR DELETE ON public.provider_ratings
FOR EACH ROW EXECUTE FUNCTION public.refresh_provider_rating();