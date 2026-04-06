
CREATE TABLE public.units (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL UNIQUE,
  label text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read units" ON public.units FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public insert units" ON public.units FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow public update units" ON public.units FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete units" ON public.units FOR DELETE TO anon USING (true);

INSERT INTO public.units (name, label) VALUES
  ('un', 'Unidade'),
  ('kg', 'Quilograma'),
  ('g', 'Grama'),
  ('lt', 'Litro'),
  ('ml', 'Mililitro'),
  ('m', 'Metro'),
  ('m²', 'Metro quadrado'),
  ('hr', 'Hora'),
  ('min', 'Minuto'),
  ('pç', 'Peça'),
  ('cx', 'Caixa'),
  ('pct', 'Pacote'),
  ('par', 'Par'),
  ('kit', 'Kit'),
  ('serv', 'Serviço');
