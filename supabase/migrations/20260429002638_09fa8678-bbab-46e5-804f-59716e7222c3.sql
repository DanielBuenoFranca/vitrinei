-- 1) Margem/Lucro nos providers e profiles
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS margin_pct numeric NOT NULL DEFAULT 30;
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS profit_pct numeric NOT NULL DEFAULT 20;
ALTER TABLE public.profiles  ADD COLUMN IF NOT EXISTS margin_pct numeric DEFAULT 30;
ALTER TABLE public.profiles  ADD COLUMN IF NOT EXISTS profit_pct numeric DEFAULT 20;

-- 2) Tabela de auditoria de economia de IA
CREATE TABLE IF NOT EXISTS public.ai_savings_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature text NOT NULL,                  -- 'image_sanitize' | 'vini_chat' | 'logo_gen' | 'enrich' | etc
  fallback_used text NOT NULL,            -- 'unsplash' | 'pixabay' | 'local_placeholder' | 'decision_tree'
  estimated_credits numeric NOT NULL DEFAULT 0,
  context jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_savings_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage ai_savings_log" ON public.ai_savings_log
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Service insert ai_savings_log" ON public.ai_savings_log
  FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Public read ai_savings_log" ON public.ai_savings_log
  FOR SELECT TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_ai_savings_created ON public.ai_savings_log(created_at DESC);

-- 3) CARDEX: cabeçalho de entrada
CREATE TABLE IF NOT EXISTS public.stock_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id integer NOT NULL,
  source_type text NOT NULL DEFAULT 'manual',  -- 'manual' | 'nf' | 'cupom' | 'barcode'
  supplier_doc text,
  supplier_name text,
  document_number text,
  total_amount numeric NOT NULL DEFAULT 0,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.stock_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner sees own stock_entries" ON public.stock_entries
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(),'admin'::app_role)
    OR EXISTS (SELECT 1 FROM providers p WHERE p.id = stock_entries.provider_id AND p.user_id = auth.uid())
  );
CREATE POLICY "Owner manages stock_entries" ON public.stock_entries
  FOR ALL TO authenticated
  USING (
    has_role(auth.uid(),'admin'::app_role)
    OR EXISTS (SELECT 1 FROM providers p WHERE p.id = stock_entries.provider_id AND p.user_id = auth.uid())
  )
  WITH CHECK (
    has_role(auth.uid(),'admin'::app_role)
    OR EXISTS (SELECT 1 FROM providers p WHERE p.id = stock_entries.provider_id AND p.user_id = auth.uid())
  );
CREATE POLICY "Public anon stock_entries CRUD" ON public.stock_entries
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- 4) CARDEX: itens de entrada
CREATE TABLE IF NOT EXISTS public.stock_entry_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL,
  raw_name text NOT NULL,
  raw_barcode text,
  matched_product_id integer,           -- de-para
  create_new boolean NOT NULL DEFAULT false,
  unit text DEFAULT 'un',
  quantity integer NOT NULL DEFAULT 1,
  unit_cost numeric NOT NULL DEFAULT 0,
  current_price numeric DEFAULT 0,      -- preço atual do SKU (snapshot)
  suggested_price numeric DEFAULT 0,    -- calculado via margem/lucro
  applied_price numeric,                -- preço escolhido para aplicar
  apply_choice text DEFAULT 'keep',     -- 'keep' | 'suggested' | 'custom'
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.stock_entry_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner sees stock_entry_items" ON public.stock_entry_items
  FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(),'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM stock_entries e JOIN providers p ON p.id = e.provider_id
      WHERE e.id = stock_entry_items.entry_id AND p.user_id = auth.uid()
    )
  );
CREATE POLICY "Owner manages stock_entry_items" ON public.stock_entry_items
  FOR ALL TO authenticated
  USING (
    has_role(auth.uid(),'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM stock_entries e JOIN providers p ON p.id = e.provider_id
      WHERE e.id = stock_entry_items.entry_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (true);
CREATE POLICY "Public anon stock_entry_items CRUD" ON public.stock_entry_items
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- 5) site_settings: chave ai_credits_mode
INSERT INTO public.site_settings (key, value)
VALUES ('ai_credits_mode', jsonb_build_object('mode','on','auto_off_on_error',true,'updated_by',null))
ON CONFLICT (key) DO NOTHING;

-- garante UNIQUE em key (necessário para ON CONFLICT)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'site_settings_key_unique'
  ) THEN
    ALTER TABLE public.site_settings ADD CONSTRAINT site_settings_key_unique UNIQUE (key);
  END IF;
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

-- 6) Realtime para site_settings (se ainda não estiver)
DO $$
BEGIN
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='site_settings';
  IF NOT FOUND THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.site_settings';
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 7) RPC para aplicar a entrada (atualiza estoque + preço escolhido + stock_movements)
CREATE OR REPLACE FUNCTION public.apply_stock_entry(_entry_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _entry RECORD;
  _item RECORD;
  _prod RECORD;
  _new_product_id integer;
  _final_price numeric;
  _new_balance integer;
  _processed int := 0;
BEGIN
  SELECT * INTO _entry FROM stock_entries WHERE id=_entry_id FOR UPDATE;
  IF _entry IS NULL THEN RETURN jsonb_build_object('error','Entrada não encontrada'); END IF;

  FOR _item IN SELECT * FROM stock_entry_items WHERE entry_id=_entry_id LOOP
    -- decide o produto destino
    IF _item.create_new THEN
      INSERT INTO dynamic_products (product_id, name, price, provider, provider_id, unit, quantity, stock_type, tags)
      VALUES (
        nextval('dynamic_products_id_seq')::int,
        _item.raw_name,
        COALESCE(_item.applied_price, _item.suggested_price, _item.unit_cost),
        (SELECT name FROM providers WHERE id=_entry.provider_id),
        _entry.provider_id,
        COALESCE(_item.unit,'un'),
        _item.quantity,
        'fisico',
        '{}'::text[]
      )
      RETURNING id INTO _new_product_id;
      _final_price := COALESCE(_item.applied_price, _item.suggested_price, _item.unit_cost);

      INSERT INTO stock_movements (provider_id,item_kind,item_id,item_name,movement_type,quantity_delta,balance_after,reference_label,user_id,unit_cost,context)
      VALUES (_entry.provider_id,'product',_new_product_id,_item.raw_name,'entry_in',
        _item.quantity,_item.quantity,'Entrada CARDEX: '||COALESCE(_entry.document_number,_entry.source_type),
        _entry.created_by,_item.unit_cost,jsonb_build_object('entry_id',_entry_id,'created_new',true));

    ELSIF _item.matched_product_id IS NOT NULL THEN
      SELECT * INTO _prod FROM dynamic_products WHERE id=_item.matched_product_id FOR UPDATE;
      IF _prod IS NULL THEN CONTINUE; END IF;

      _final_price := CASE _item.apply_choice
        WHEN 'suggested' THEN COALESCE(_item.suggested_price,_prod.price)
        WHEN 'custom'    THEN COALESCE(_item.applied_price,_prod.price)
        ELSE _prod.price
      END;

      UPDATE dynamic_products
        SET quantity = quantity + _item.quantity,
            price = _final_price
        WHERE id = _prod.id
        RETURNING quantity INTO _new_balance;

      INSERT INTO stock_movements (provider_id,item_kind,item_id,item_name,movement_type,quantity_delta,balance_after,reference_label,user_id,unit_cost,context)
      VALUES (_entry.provider_id,'product',_prod.id,_prod.name,'entry_in',
        _item.quantity,_new_balance,'Entrada CARDEX: '||COALESCE(_entry.document_number,_entry.source_type),
        _entry.created_by,_item.unit_cost,jsonb_build_object('entry_id',_entry_id,'old_price',_prod.price,'new_price',_final_price));
    END IF;

    _processed := _processed + 1;
  END LOOP;

  RETURN jsonb_build_object('success',true,'processed',_processed);
END $$;

-- 8) Helpers de policies para stock_movements (admin pode editar/excluir)
DROP POLICY IF EXISTS "Master deletes stock_movements" ON public.stock_movements;
CREATE POLICY "Master deletes stock_movements" ON public.stock_movements
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role));

DROP POLICY IF EXISTS "Master updates stock_movements" ON public.stock_movements;
CREATE POLICY "Master updates stock_movements" ON public.stock_movements
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));