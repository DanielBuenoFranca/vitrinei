
-- Create providers table for MEI and PF service providers
CREATE TABLE public.providers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'mei',
  segment TEXT NOT NULL,
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  address TEXT DEFAULT '',
  city TEXT DEFAULT '',
  rating NUMERIC NOT NULL DEFAULT 4.5,
  distance TEXT NOT NULL DEFAULT '2 km',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

-- RLS policies (public access for demo)
CREATE POLICY "Allow public read providers" ON public.providers FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public insert providers" ON public.providers FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow public update providers" ON public.providers FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete providers" ON public.providers FOR DELETE TO anon USING (true);

-- Add provider_id column to dynamic_services
ALTER TABLE public.dynamic_services ADD COLUMN provider_id INTEGER REFERENCES public.providers(id) ON DELETE SET NULL;

-- Add provider_id column to dynamic_products  
ALTER TABLE public.dynamic_products ADD COLUMN provider_id INTEGER REFERENCES public.providers(id) ON DELETE SET NULL;

-- Allow updates on dynamic_services and dynamic_products
CREATE POLICY "Allow public update dynamic_services" ON public.dynamic_services FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow public update dynamic_products" ON public.dynamic_products FOR UPDATE TO anon USING (true) WITH CHECK (true);
