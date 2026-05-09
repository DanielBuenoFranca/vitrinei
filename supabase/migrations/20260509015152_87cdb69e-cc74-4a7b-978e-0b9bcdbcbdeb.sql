ALTER TABLE public.dynamic_products
  ADD COLUMN IF NOT EXISTS segments text[] NOT NULL DEFAULT '{}'::text[];

ALTER TABLE public.dynamic_services
  ADD COLUMN IF NOT EXISTS segments text[] NOT NULL DEFAULT '{}'::text[];

-- Backfill: copiar segmentos do prestador quando o produto/serviço ainda não tem segmentos
UPDATE public.dynamic_products dp
SET segments = COALESCE(p.segment, '{}'::text[])
FROM public.providers p
WHERE dp.provider_id = p.id
  AND (dp.segments IS NULL OR array_length(dp.segments, 1) IS NULL);

UPDATE public.dynamic_services ds
SET segments = ARRAY[ds.segment]
WHERE (ds.segments IS NULL OR array_length(ds.segments, 1) IS NULL)
  AND ds.segment IS NOT NULL AND ds.segment <> '';

CREATE INDEX IF NOT EXISTS idx_dynamic_products_segments ON public.dynamic_products USING GIN (segments);
CREATE INDEX IF NOT EXISTS idx_dynamic_services_segments ON public.dynamic_services USING GIN (segments);