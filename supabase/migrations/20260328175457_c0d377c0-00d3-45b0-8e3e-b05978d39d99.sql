
-- Table for dynamically added services/professionals from Support Center
CREATE TABLE public.dynamic_services (
  id SERIAL PRIMARY KEY,
  service_id INT NOT NULL,
  name TEXT NOT NULL,
  segment TEXT NOT NULL,
  provider TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  rating NUMERIC NOT NULL DEFAULT 4.5,
  distance TEXT NOT NULL DEFAULT '2 km',
  time TEXT NOT NULL DEFAULT '45 min',
  products TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table for dynamically added products from Support Center
CREATE TABLE public.dynamic_products (
  id SERIAL PRIMARY KEY,
  product_id INT NOT NULL,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  provider TEXT NOT NULL,
  stock_type TEXT NOT NULL DEFAULT 'fisico',
  rating NUMERIC NOT NULL DEFAULT 4.5,
  distance TEXT NOT NULL DEFAULT '2 km',
  related_service_ids INT[] NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Allow public read/write (no auth required for this demo)
ALTER TABLE public.dynamic_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dynamic_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read dynamic_services" ON public.dynamic_services FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public insert dynamic_services" ON public.dynamic_services FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow public delete dynamic_services" ON public.dynamic_services FOR DELETE TO anon USING (true);

CREATE POLICY "Allow public read dynamic_products" ON public.dynamic_products FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public insert dynamic_products" ON public.dynamic_products FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow public delete dynamic_products" ON public.dynamic_products FOR DELETE TO anon USING (true);
