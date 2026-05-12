-- Enable unaccent extension
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Add slug column to providers
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create function to slugify text
CREATE OR REPLACE FUNCTION public.slugify(text) RETURNS text AS $$
BEGIN
  RETURN lower(regexp_replace(regexp_replace(unaccent($1), '[^a-zA-Z0-9\s]+', '', 'g'), '\s+', '-', 'g'));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update existing providers with slugs
UPDATE public.providers SET slug = public.slugify(name) WHERE slug IS NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_providers_slug ON public.providers(slug);

-- Create trigger to keep slug in sync with name
CREATE OR REPLACE FUNCTION public.update_provider_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') OR (NEW.name <> OLD.name) THEN
    NEW.slug := public.slugify(NEW.name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_update_provider_slug ON public.providers;
CREATE TRIGGER tr_update_provider_slug
BEFORE INSERT OR UPDATE ON public.providers
FOR EACH ROW EXECUTE FUNCTION public.update_provider_slug();
