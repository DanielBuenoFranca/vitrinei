
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS storefront_config jsonb NOT NULL DEFAULT '{}';
