CREATE OR REPLACE FUNCTION public.track_dynamic_stock_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _delta int;
  _kind text;
  _movement_type text;
  _source text;
  _new_qty int;
  _old_qty int;
  _item_id int;
  _balance_after int;
BEGIN
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

  -- Acessa o campo correto sem referenciar o outro (evita 'no field' em runtime)
  IF _kind = 'product' THEN
    _item_id := NEW.product_id;
    _balance_after := _new_qty;
  ELSE
    _item_id := NEW.service_id;
    _balance_after := NULL;
  END IF;

  INSERT INTO public.stock_movements(
    item_id, item_kind, item_name, provider_id,
    movement_type, quantity_delta, balance_after, context
  ) VALUES (
    _item_id, _kind, NEW.name, NEW.provider_id,
    _movement_type, _delta, _balance_after,
    jsonb_build_object('auto', true, 'op', TG_OP, 'source', _source)
  );

  RETURN NEW;
END;
$function$;