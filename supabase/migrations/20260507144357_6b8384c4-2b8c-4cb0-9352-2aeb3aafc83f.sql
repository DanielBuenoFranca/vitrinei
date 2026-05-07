
-- 1) Vinculação automática de provider quando user_roles recebe provider/mixed
CREATE OR REPLACE FUNCTION public.link_provider_on_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _doc text;
  _linked int;
BEGIN
  IF NEW.role NOT IN ('provider'::app_role, 'mixed'::app_role) THEN
    RETURN NEW;
  END IF;

  SELECT regexp_replace(coalesce(cpf_cnpj,''),'[^0-9]','','g')
    INTO _doc
    FROM public.profiles
   WHERE user_id = NEW.user_id
   LIMIT 1;

  IF _doc IS NULL OR _doc = '' THEN
    RETURN NEW;
  END IF;

  UPDATE public.providers
     SET user_id = NEW.user_id
   WHERE regexp_replace(coalesce(cpf_cnpj,''),'[^0-9]','','g') = _doc
     AND user_id IS NULL;

  GET DIAGNOSTICS _linked = ROW_COUNT;

  IF _linked > 0 THEN
    UPDATE public.profiles SET is_provider = true WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_link_provider_on_role_change ON public.user_roles;
CREATE TRIGGER trg_link_provider_on_role_change
  AFTER INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.link_provider_on_role_change();

-- 2) CARDEX universal: trigger que classifica e loga movimentação automaticamente
CREATE OR REPLACE FUNCTION public.track_dynamic_stock_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _delta int;
  _kind text;
  _movement_type text;
  _source text;
  _new_qty int;
  _old_qty int;
BEGIN
  -- Determine kind
  IF TG_TABLE_NAME = 'dynamic_products' THEN
    _kind := 'product';
  ELSE
    _kind := 'service';
  END IF;

  _new_qty := COALESCE(NEW.quantity, 0);
  _old_qty := CASE WHEN TG_OP = 'INSERT' THEN 0 ELSE COALESCE(OLD.quantity, 0) END;
  _delta := _new_qty - _old_qty;

  IF _delta = 0 THEN
    RETURN NEW;
  END IF;

  -- Source pode ser definido pela aplicação via SET LOCAL app.movement_source = '...'
  BEGIN
    _source := current_setting('app.movement_source', true);
  EXCEPTION WHEN OTHERS THEN
    _source := NULL;
  END;

  IF _source IS NOT NULL AND _source <> '' THEN
    _movement_type := _source;
  ELSIF _kind = 'service' THEN
    _movement_type := CASE WHEN _delta > 0 THEN 'service_execution' ELSE 'adjust_out' END;
  ELSE
    IF TG_OP = 'INSERT' THEN
      _movement_type := 'entry_in';
    ELSIF _delta > 0 THEN
      _movement_type := 'adjust_in';
    ELSE
      _movement_type := 'adjust_out';
    END IF;
  END IF;

  INSERT INTO public.stock_movements(
    item_id, item_kind, item_name, provider_id,
    movement_type, quantity_delta, balance_after, context
  ) VALUES (
    CASE WHEN _kind='product' THEN NEW.product_id ELSE NEW.service_id END,
    _kind,
    NEW.name,
    NEW.provider_id,
    _movement_type,
    _delta,
    CASE WHEN _kind='product' THEN _new_qty ELSE NULL END,
    jsonb_build_object('auto', true, 'op', TG_OP, 'source', _source)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_track_stock_dynamic_products ON public.dynamic_products;
CREATE TRIGGER trg_track_stock_dynamic_products
  AFTER INSERT OR UPDATE OF quantity ON public.dynamic_products
  FOR EACH ROW
  EXECUTE FUNCTION public.track_dynamic_stock_change();

DROP TRIGGER IF EXISTS trg_track_stock_dynamic_services ON public.dynamic_services;
CREATE TRIGGER trg_track_stock_dynamic_services
  AFTER INSERT OR UPDATE OF quantity ON public.dynamic_services
  FOR EACH ROW
  EXECUTE FUNCTION public.track_dynamic_stock_change();
