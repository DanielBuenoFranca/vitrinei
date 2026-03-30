
-- Tabela de Segmentos
CREATE TABLE public.segments (
  id serial PRIMARY KEY,
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.segments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read segments" ON public.segments FOR SELECT TO anon USING (true);
CREATE POLICY "Allow public insert segments" ON public.segments FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow public update segments" ON public.segments FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete segments" ON public.segments FOR DELETE TO anon USING (true);

-- Inserir segmentos existentes
INSERT INTO public.segments (name) VALUES
  ('manutencao'), ('saude_clinica'), ('bem_estar'), ('beleza'), ('casa'), ('auto'),
  ('digital'), ('tech'), ('educacao'), ('pet'), ('eventos'), ('musica'), ('natureza');

-- Adicionar campo labor_cost e linked_product_ids na tabela dynamic_services
ALTER TABLE public.dynamic_services ADD COLUMN labor_cost numeric NOT NULL DEFAULT 0;
ALTER TABLE public.dynamic_services ADD COLUMN linked_product_ids integer[] NOT NULL DEFAULT '{}'::integer[];
