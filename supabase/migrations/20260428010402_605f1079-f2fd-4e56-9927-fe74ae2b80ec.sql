-- =========================================================
-- 1) STOCK MOVEMENTS (rastreabilidade total de estoque)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id integer NOT NULL,
  item_kind text NOT NULL CHECK (item_kind IN ('product','service','kit')),
  item_id integer NOT NULL,
  item_name text NOT NULL,
  movement_type text NOT NULL CHECK (movement_type IN ('sale','kit_generation','kit_consumption','kit_supplier_debit','adjustment','import','manual_in','manual_out','rollback')),
  quantity_delta integer NOT NULL,
  balance_after integer,
  unit_cost numeric DEFAULT 0,
  reference_id uuid,
  reference_label text,
  user_id uuid,
  context jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_stock_mov_provider ON public.stock_movements(provider_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_mov_item ON public.stock_movements(item_kind, item_id);

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master sees all stock_movements" ON public.stock_movements
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Provider sees own stock_movements" ON public.stock_movements
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.id = stock_movements.provider_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Master manages stock_movements" ON public.stock_movements
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service insert stock_movements" ON public.stock_movements
  FOR INSERT TO anon WITH CHECK (true);

-- =========================================================
-- 2) KITS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.kits (
  id integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  owner_provider_id integer NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  price numeric NOT NULL DEFAULT 0,
  labor_cost numeric NOT NULL DEFAULT 0,
  unit text NOT NULL DEFAULT 'kit',
  quantity integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(owner_provider_id, name)
);

CREATE TABLE IF NOT EXISTS public.kit_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id integer NOT NULL REFERENCES public.kits(id) ON DELETE CASCADE,
  source_kind text NOT NULL CHECK (source_kind IN ('product','service')),
  source_item_id integer NOT NULL,
  source_provider_id integer NOT NULL,
  is_third_party boolean NOT NULL DEFAULT false,
  quantity_per_kit integer NOT NULL DEFAULT 1 CHECK (quantity_per_kit > 0),
  agreed_unit_cost numeric NOT NULL DEFAULT 0,
  snapshot_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_kit_items_kit ON public.kit_items(kit_id);
CREATE INDEX IF NOT EXISTS idx_kit_items_supplier ON public.kit_items(source_provider_id);

ALTER TABLE public.kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kit_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read kits" ON public.kits FOR SELECT USING (true);
CREATE POLICY "Owner manages kits" ON public.kits FOR ALL TO authenticated
  USING (
    has_role(auth.uid(),'admin'::app_role) OR
    EXISTS (SELECT 1 FROM public.providers p WHERE p.id = kits.owner_provider_id AND p.user_id = auth.uid())
  )
  WITH CHECK (
    has_role(auth.uid(),'admin'::app_role) OR
    EXISTS (SELECT 1 FROM public.providers p WHERE p.id = kits.owner_provider_id AND p.user_id = auth.uid())
  );
CREATE POLICY "Public anon kits CRUD" ON public.kits FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Public read kit_items" ON public.kit_items FOR SELECT USING (true);
CREATE POLICY "Owner manages kit_items" ON public.kit_items FOR ALL TO authenticated
  USING (
    has_role(auth.uid(),'admin'::app_role) OR
    EXISTS (
      SELECT 1 FROM public.kits k JOIN public.providers p ON p.id = k.owner_provider_id
      WHERE k.id = kit_items.kit_id AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (true);
CREATE POLICY "Public anon kit_items CRUD" ON public.kit_items FOR ALL TO anon USING (true) WITH CHECK (true);

-- =========================================================
-- 3) KIT TRANSACTIONS (auditoria por venda/criação)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.kit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id integer NOT NULL,
  action text NOT NULL CHECK (action IN ('created','sold','rollback','partial_sale','b2b_settlement','failed')),
  buyer_user_id uuid,
  owner_provider_id integer,
  total_amount numeric DEFAULT 0,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.kit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Master sees all kit_tx" ON public.kit_transactions FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role));
CREATE POLICY "Owner sees own kit_tx" ON public.kit_transactions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.providers p WHERE p.id = kit_transactions.owner_provider_id AND p.user_id = auth.uid()));
CREATE POLICY "Buyer sees own kit_tx" ON public.kit_transactions FOR SELECT TO authenticated
  USING (auth.uid() = buyer_user_id);
CREATE POLICY "Service insert kit_tx" ON public.kit_transactions FOR INSERT TO anon WITH CHECK (true);

-- =========================================================
-- 4) PENDING STOCK ORDERS (itens de Kit aguardando reposição)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.pending_stock_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_user_id uuid NOT NULL,
  kit_id integer NOT NULL,
  kit_name text NOT NULL,
  owner_provider_id integer NOT NULL,
  pending_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  delivered_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'awaiting_stock' CHECK (status IN ('awaiting_stock','partial','completed','cancelled')),
  message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.pending_stock_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Buyer sees own pending" ON public.pending_stock_orders FOR SELECT TO authenticated
  USING (auth.uid() = buyer_user_id);
CREATE POLICY "Master/Owner sees pending" ON public.pending_stock_orders FOR SELECT TO authenticated
  USING (
    has_role(auth.uid(),'admin'::app_role) OR
    EXISTS (SELECT 1 FROM public.providers p WHERE p.id = pending_stock_orders.owner_provider_id AND p.user_id = auth.uid())
  );
CREATE POLICY "Master manages pending" ON public.pending_stock_orders FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role)) WITH CHECK (true);
CREATE POLICY "Service insert pending" ON public.pending_stock_orders FOR INSERT TO anon WITH CHECK (true);

-- =========================================================
-- 5) FUNÇÃO: check_item_duplicate (anti-duplicidade no estoque)
-- =========================================================
CREATE OR REPLACE FUNCTION public.check_item_duplicate(
  _provider_id integer,
  _kind text,
  _name text,
  _unit text,
  _exclude_id integer DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE
  _norm text;
  _conflict_id integer;
  _conflict_name text;
BEGIN
  _norm := lower(regexp_replace(unaccent_safe(_name), '\s+', ' ', 'g'));
  IF _kind = 'product' THEN
    SELECT id, name INTO _conflict_id, _conflict_name FROM dynamic_products
      WHERE provider_id = _provider_id
        AND lower(regexp_replace(unaccent_safe(name), '\s+', ' ', 'g')) = _norm
        AND lower(coalesce(unit,'un')) = lower(coalesce(_unit,'un'))
        AND (_exclude_id IS NULL OR id <> _exclude_id)
      LIMIT 1;
  ELSIF _kind = 'service' THEN
    SELECT id, name INTO _conflict_id, _conflict_name FROM dynamic_services
      WHERE provider_id = _provider_id
        AND lower(regexp_replace(unaccent_safe(name), '\s+', ' ', 'g')) = _norm
        AND lower(coalesce(unit,'hr')) = lower(coalesce(_unit,'hr'))
        AND (_exclude_id IS NULL OR id <> _exclude_id)
      LIMIT 1;
  ELSIF _kind = 'kit' THEN
    SELECT id, name INTO _conflict_id, _conflict_name FROM kits
      WHERE owner_provider_id = _provider_id
        AND lower(regexp_replace(unaccent_safe(name), '\s+', ' ', 'g')) = _norm
        AND (_exclude_id IS NULL OR id <> _exclude_id)
      LIMIT 1;
  END IF;

  IF _conflict_id IS NOT NULL THEN
    RETURN jsonb_build_object('duplicate', true, 'id', _conflict_id, 'name', _conflict_name);
  END IF;
  RETURN jsonb_build_object('duplicate', false);
END;
$$;

-- helper: unaccent_safe (caso extension unaccent não esteja instalada)
CREATE OR REPLACE FUNCTION public.unaccent_safe(_text text) RETURNS text
LANGUAGE plpgsql IMMUTABLE SET search_path=public AS $$
BEGIN
  RETURN translate(coalesce(_text,''),
    'áàâãäåÁÀÂÃÄÅéèêëÉÈÊËíìîïÍÌÎÏóòôõöÓÒÔÕÖúùûüÚÙÛÜçÇñÑ',
    'aaaaaaAAAAAAeeeeEEEEiiiiIIIIoooooOOOOOuuuuUUUUcCnN');
END;
$$;

-- =========================================================
-- 6) FUNÇÃO: create_kit_acid
-- =========================================================
CREATE OR REPLACE FUNCTION public.create_kit_acid(
  _owner_provider_id integer,
  _name text,
  _description text,
  _price numeric,
  _labor_cost numeric,
  _initial_quantity integer,
  _items jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  _kit_id integer;
  _item jsonb;
  _is_third boolean;
  _prod RECORD;
  _serv RECORD;
  _name_check jsonb;
  _new_balance integer;
BEGIN
  -- validação de duplicidade
  _name_check := check_item_duplicate(_owner_provider_id, 'kit', _name, 'kit', NULL);
  IF (_name_check->>'duplicate')::boolean THEN
    RETURN jsonb_build_object('error','Já existe um Kit com esse nome no seu estoque','conflict_id',_name_check->>'id');
  END IF;

  INSERT INTO kits (owner_provider_id,name,description,price,labor_cost,quantity,unit)
    VALUES (_owner_provider_id,_name,_description,_price,_labor_cost,_initial_quantity,'kit')
    RETURNING id INTO _kit_id;

  FOR _item IN SELECT * FROM jsonb_array_elements(_items)
  LOOP
    _is_third := COALESCE((_item->>'source_provider_id')::int, _owner_provider_id) <> _owner_provider_id;

    INSERT INTO kit_items (kit_id, source_kind, source_item_id, source_provider_id, is_third_party, quantity_per_kit, agreed_unit_cost, snapshot_name)
      VALUES (
        _kit_id,
        _item->>'source_kind',
        (_item->>'source_item_id')::int,
        COALESCE((_item->>'source_provider_id')::int, _owner_provider_id),
        _is_third,
        COALESCE((_item->>'quantity_per_kit')::int, 1),
        COALESCE((_item->>'agreed_unit_cost')::numeric, 0),
        _item->>'snapshot_name'
      );

    -- Se item próprio: debita estoque imediatamente para gerar as unidades iniciais do Kit
    IF NOT _is_third AND _initial_quantity > 0 THEN
      IF (_item->>'source_kind') = 'product' THEN
        SELECT * INTO _prod FROM dynamic_products WHERE id=(_item->>'source_item_id')::int FOR UPDATE;
        IF _prod IS NULL THEN
          RAISE EXCEPTION 'Produto componente não encontrado: %', _item->>'source_item_id';
        END IF;
        IF _prod.quantity < (_initial_quantity * COALESCE((_item->>'quantity_per_kit')::int,1)) THEN
          RAISE EXCEPTION 'Estoque insuficiente do componente %: disponível %, necessário %', _prod.name, _prod.quantity, _initial_quantity * COALESCE((_item->>'quantity_per_kit')::int,1);
        END IF;
        UPDATE dynamic_products
          SET quantity = quantity - (_initial_quantity * COALESCE((_item->>'quantity_per_kit')::int,1))
          WHERE id = _prod.id
          RETURNING quantity INTO _new_balance;
        INSERT INTO stock_movements (provider_id,item_kind,item_id,item_name,movement_type,quantity_delta,balance_after,reference_label,context)
          VALUES (_owner_provider_id,'product',_prod.id,_prod.name,'kit_generation',
            -(_initial_quantity * COALESCE((_item->>'quantity_per_kit')::int,1)),
            _new_balance,
            'Geração de Kit: ' || _name,
            jsonb_build_object('kit_id',_kit_id));
      END IF;
    END IF;
  END LOOP;

  -- registra estoque do próprio Kit
  IF _initial_quantity > 0 THEN
    INSERT INTO stock_movements (provider_id,item_kind,item_id,item_name,movement_type,quantity_delta,balance_after,reference_label,context)
      VALUES (_owner_provider_id,'kit',_kit_id,_name,'manual_in',_initial_quantity,_initial_quantity,'Criação inicial do Kit',
        jsonb_build_object('kit_id',_kit_id));
  END IF;

  INSERT INTO kit_transactions (kit_id,action,owner_provider_id,total_amount,details)
    VALUES (_kit_id,'created',_owner_provider_id,_price,
      jsonb_build_object('initial_quantity',_initial_quantity,'items_count',jsonb_array_length(_items)));

  RETURN jsonb_build_object('success',true,'kit_id',_kit_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('error',SQLERRM);
END;
$$;

-- =========================================================
-- 7) FUNÇÃO: sell_kit_acid
-- Vende um Kit. Valida estoque de TODOS os componentes (próprios e terceiros).
-- Se faltar algum: realiza venda parcial (entrega o que tem) e cria pending_stock_order.
-- Realiza B2B via cashback entre Dono ↔ Fornecedor.
-- =========================================================
CREATE OR REPLACE FUNCTION public.sell_kit_acid(
  _buyer_id uuid,
  _kit_id integer,
  _quantity integer DEFAULT 1
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  _kit RECORD;
  _owner_user uuid;
  _owner_wallet RECORD;
  _buyer_wallet RECORD;
  _supplier RECORD;
  _comp RECORD;
  _need integer;
  _available integer;
  _delivered_items jsonb := '[]'::jsonb;
  _pending_items jsonb := '[]'::jsonb;
  _can_full boolean := true;
  _total numeric;
  _b2b_total numeric := 0;
  _supplier_user uuid;
  _supplier_wallet RECORD;
  _new_balance integer;
  _pending_id uuid;
  _msg text;
  _platform_fee numeric;
BEGIN
  SELECT * INTO _kit FROM kits WHERE id=_kit_id FOR UPDATE;
  IF _kit IS NULL THEN RETURN jsonb_build_object('error','Kit não encontrado'); END IF;

  SELECT user_id INTO _owner_user FROM providers WHERE id=_kit.owner_provider_id;
  IF _owner_user IS NULL THEN RETURN jsonb_build_object('error','Dono do Kit sem usuário vinculado'); END IF;

  SELECT * INTO _buyer_wallet FROM wallets WHERE user_id=_buyer_id FOR UPDATE;
  SELECT * INTO _owner_wallet FROM wallets WHERE user_id=_owner_user FOR UPDATE;
  IF _buyer_wallet IS NULL OR _owner_wallet IS NULL THEN
    RETURN jsonb_build_object('error','Carteira do comprador ou dono não encontrada');
  END IF;

  _total := _kit.price * _quantity;
  IF _buyer_wallet.balance < _total THEN
    RETURN jsonb_build_object('error','Saldo insuficiente do comprador');
  END IF;

  -- valida componentes
  FOR _comp IN SELECT * FROM kit_items WHERE kit_id=_kit_id LOOP
    _need := _comp.quantity_per_kit * _quantity;
    IF _comp.source_kind='product' THEN
      SELECT quantity INTO _available FROM dynamic_products WHERE id=_comp.source_item_id FOR UPDATE;
    ELSE
      SELECT quantity INTO _available FROM dynamic_services WHERE id=_comp.source_item_id FOR UPDATE;
    END IF;
    _available := COALESCE(_available,0);

    IF _available >= _need THEN
      _delivered_items := _delivered_items || jsonb_build_object(
        'kind',_comp.source_kind,'item_id',_comp.source_item_id,'name',_comp.snapshot_name,
        'qty',_need,'supplier_provider_id',_comp.source_provider_id,'is_third_party',_comp.is_third_party,
        'unit_cost',_comp.agreed_unit_cost
      );
    ELSE
      _can_full := false;
      _pending_items := _pending_items || jsonb_build_object(
        'kind',_comp.source_kind,'item_id',_comp.source_item_id,'name',_comp.snapshot_name,
        'qty_needed',_need,'qty_available',_available,'supplier_provider_id',_comp.source_provider_id
      );
    END IF;
  END LOOP;

  -- cobra comprador (sempre integralmente — itens pendentes ficam aguardando entrega)
  _platform_fee := ROUND(_total*0.02,2);
  UPDATE wallets SET balance=balance-_total, total_spent=total_spent+_total, updated_at=now()
    WHERE user_id=_buyer_id;
  INSERT INTO wallet_transactions (user_id,wallet_id,amount,type,description)
    VALUES (_buyer_id,_buyer_wallet.id,-_total,'purchase',
      '[Kit] '||_kit.name||' x'||_quantity);

  -- credita dono (líquido após taxa Vitrinei 2%)
  UPDATE wallets SET balance=balance+(_total-_platform_fee), total_earned=total_earned+(_total-_platform_fee), updated_at=now()
    WHERE user_id=_owner_user;
  INSERT INTO wallet_transactions (user_id,wallet_id,amount,type,description)
    VALUES (_owner_user,_owner_wallet.id,(_total-_platform_fee),'sale_credit',
      '[Venda Kit] '||_kit.name||' x'||_quantity||' (líq. taxas)');
  INSERT INTO wallet_transactions (user_id,wallet_id,amount,type,description)
    VALUES (_owner_user,_owner_wallet.id,-_platform_fee,'platform_fee',
      '[Taxa Vitrinei] 2% sobre Kit '||_kit.name);

  -- baixa estoque dos componentes ENTREGUES
  FOR _comp IN SELECT * FROM jsonb_to_recordset(_delivered_items) AS x(kind text,item_id int,name text,qty int,supplier_provider_id int,is_third_party bool,unit_cost numeric)
  LOOP
    IF _comp.kind='product' THEN
      UPDATE dynamic_products SET quantity=quantity-_comp.qty WHERE id=_comp.item_id RETURNING quantity INTO _new_balance;
    ELSE
      UPDATE dynamic_services SET quantity=quantity-_comp.qty WHERE id=_comp.item_id RETURNING quantity INTO _new_balance;
    END IF;
    INSERT INTO stock_movements (provider_id,item_kind,item_id,item_name,movement_type,quantity_delta,balance_after,reference_label,user_id,context)
      VALUES (_comp.supplier_provider_id,_comp.kind,_comp.item_id,_comp.name,
        CASE WHEN _comp.is_third_party THEN 'kit_supplier_debit' ELSE 'kit_consumption' END,
        -_comp.qty,_new_balance,
        'Venda de Kit: '||_kit.name,_buyer_id,
        jsonb_build_object('kit_id',_kit_id));

    -- B2B: se terceiro, paga via cashback
    IF _comp.is_third_party AND _comp.unit_cost > 0 THEN
      _b2b_total := _comp.unit_cost * _comp.qty;
      SELECT user_id INTO _supplier_user FROM providers WHERE id=_comp.supplier_provider_id;
      IF _supplier_user IS NOT NULL THEN
        SELECT * INTO _supplier_wallet FROM wallets WHERE user_id=_supplier_user FOR UPDATE;
        IF _supplier_wallet IS NOT NULL THEN
          -- crédito ao fornecedor (cashback)
          UPDATE wallets SET locked_cashback=locked_cashback+_b2b_total, total_earned=total_earned+_b2b_total, updated_at=now()
            WHERE user_id=_supplier_user;
          INSERT INTO wallet_transactions (user_id,wallet_id,amount,type,description)
            VALUES (_supplier_user,_supplier_wallet.id,_b2b_total,'locked_cashback',
              '[B2B Kit] Reposição via cashback - '||_kit.name);
          -- débito do dono (cashback ou saldo)
          IF _owner_wallet.locked_cashback >= _b2b_total THEN
            UPDATE wallets SET locked_cashback=locked_cashback-_b2b_total, updated_at=now() WHERE user_id=_owner_user;
            INSERT INTO wallet_transactions (user_id,wallet_id,amount,type,description)
              VALUES (_owner_user,_owner_wallet.id,-_b2b_total,'cashback_debit',
                '[B2B Kit] Insumo de '||_comp.name);
          ELSE
            UPDATE wallets SET balance=balance-_b2b_total, updated_at=now() WHERE user_id=_owner_user;
            INSERT INTO wallet_transactions (user_id,wallet_id,amount,type,description)
              VALUES (_owner_user,_owner_wallet.id,-_b2b_total,'b2b_purchase',
                '[B2B Kit] Insumo de '||_comp.name);
          END IF;

          INSERT INTO kit_transactions (kit_id,action,buyer_user_id,owner_provider_id,total_amount,details)
            VALUES (_kit_id,'b2b_settlement',_buyer_id,_kit.owner_provider_id,_b2b_total,
              jsonb_build_object('supplier',_comp.supplier_provider_id,'item',_comp.name,'qty',_comp.qty));
        END IF;
      END IF;
    END IF;
  END LOOP;

  -- baixa estoque do próprio Kit
  UPDATE kits SET quantity = GREATEST(quantity-_quantity,0) WHERE id=_kit_id RETURNING quantity INTO _new_balance;
  INSERT INTO stock_movements (provider_id,item_kind,item_id,item_name,movement_type,quantity_delta,balance_after,reference_label,user_id)
    VALUES (_kit.owner_provider_id,'kit',_kit_id,_kit.name,'sale',-_quantity,_new_balance,'Venda de Kit',_buyer_id);

  -- pendências
  IF NOT _can_full THEN
    _msg := 'Venda parcial: alguns componentes do Kit "'||_kit.name||'" estão sem estoque e ficarão pendentes de entrega.';
    INSERT INTO pending_stock_orders (buyer_user_id,kit_id,kit_name,owner_provider_id,pending_items,delivered_items,status,message)
      VALUES (_buyer_id,_kit_id,_kit.name,_kit.owner_provider_id,_pending_items,_delivered_items,'partial',_msg)
      RETURNING id INTO _pending_id;
    INSERT INTO kit_transactions (kit_id,action,buyer_user_id,owner_provider_id,total_amount,details)
      VALUES (_kit_id,'partial_sale',_buyer_id,_kit.owner_provider_id,_total,
        jsonb_build_object('pending_id',_pending_id,'pending',_pending_items,'delivered',_delivered_items));
  ELSE
    INSERT INTO kit_transactions (kit_id,action,buyer_user_id,owner_provider_id,total_amount,details)
      VALUES (_kit_id,'sold',_buyer_id,_kit.owner_provider_id,_total,
        jsonb_build_object('delivered',_delivered_items,'quantity',_quantity));
  END IF;

  RETURN jsonb_build_object('success',true,'kit_id',_kit_id,'total',_total,
    'partial', NOT _can_full,'pending_id',_pending_id,'pending_items',_pending_items,'delivered_items',_delivered_items);
EXCEPTION WHEN OTHERS THEN
  INSERT INTO kit_transactions (kit_id,action,buyer_user_id,owner_provider_id,details)
    VALUES (_kit_id,'failed',_buyer_id,_kit.owner_provider_id,jsonb_build_object('error',SQLERRM));
  RAISE;
END;
$$;