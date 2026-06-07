
-- Dedupe provider slugs by suffixing with id for duplicates (keep oldest as-is)
WITH dups AS (
  SELECT id, slug,
    ROW_NUMBER() OVER (PARTITION BY slug ORDER BY id) AS rn
  FROM public.providers
  WHERE slug IS NOT NULL AND slug <> ''
)
UPDATE public.providers p
SET slug = p.slug || '-' || p.id
FROM dups d
WHERE p.id = d.id AND d.rn > 1;

-- Add unique constraint going forward
DROP INDEX IF EXISTS public.idx_providers_slug;
CREATE UNIQUE INDEX idx_providers_slug_unique
  ON public.providers (slug)
  WHERE slug IS NOT NULL AND slug <> '';
