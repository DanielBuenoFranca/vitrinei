CREATE OR REPLACE FUNCTION public.update_provider_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  candidate TEXT;
  n INT := 2;
BEGIN
  IF (TG_OP = 'INSERT') OR (NEW.name IS DISTINCT FROM OLD.name) OR (NEW.slug IS NULL) THEN
    base_slug := public.slugify(NEW.name);
    IF base_slug IS NULL OR base_slug = '' THEN
      base_slug := 'prestador';
    END IF;
    candidate := base_slug;
    WHILE EXISTS (
      SELECT 1 FROM public.providers
      WHERE slug = candidate
        AND id IS DISTINCT FROM NEW.id
    ) LOOP
      candidate := base_slug || '-' || n::text;
      n := n + 1;
    END LOOP;
    NEW.slug := candidate;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;