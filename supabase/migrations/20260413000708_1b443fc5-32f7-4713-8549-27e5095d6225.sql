
-- 1. Add quantity to products and services for stock management
ALTER TABLE public.dynamic_products ADD COLUMN IF NOT EXISTS quantity integer NOT NULL DEFAULT 0;
ALTER TABLE public.dynamic_services ADD COLUMN IF NOT EXISTS quantity integer NOT NULL DEFAULT 0;

-- 2. Add identity/progressive fields to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cpf_cnpj text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS fidelity_score numeric NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS elite_since timestamp with time zone;

-- Create unique index on cpf_cnpj (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_cpf_cnpj ON public.profiles (cpf_cnpj) WHERE cpf_cnpj IS NOT NULL AND cpf_cnpj != '';

-- 3. Add credit module fields to wallets
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS credit_limit numeric NOT NULL DEFAULT 0;
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS credit_used numeric NOT NULL DEFAULT 0;

-- 4. Add user_id to providers for unified identity
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS user_id uuid;

-- 5. Create view for admin financial health dashboard
CREATE OR REPLACE VIEW public.admin_financial_health AS
SELECT
  (SELECT COALESCE(SUM(balance), 0) FROM wallets WHERE balance > 0) AS total_float,
  (SELECT COALESCE(SUM(ABS(balance)), 0) FROM wallets WHERE balance < 0) AS total_debt,
  (SELECT COALESCE(SUM(locked_cashback), 0) FROM wallets) AS total_locked_cashback,
  (SELECT COALESCE(SUM(pending_balance), 0) FROM wallets) AS total_pending,
  (SELECT COALESCE(SUM(credit_used), 0) FROM wallets) AS total_credit_used,
  (SELECT COUNT(*) FROM wallets WHERE balance < 0) AS debtors_count,
  (SELECT COUNT(*) FROM wallets WHERE balance >= 0) AS healthy_count,
  (SELECT COUNT(*) FROM profiles) AS total_users,
  (SELECT COUNT(*) FROM profiles WHERE is_provider = true) AS total_providers,
  (SELECT COUNT(*) FROM profiles WHERE is_customer = true) AS total_customers,
  (SELECT COUNT(*) FROM referrals WHERE status = 'pending') AS pending_referrals,
  (SELECT COUNT(*) FROM referrals WHERE status = 'activated') AS activated_referrals,
  (SELECT COALESCE(SUM(amount), 0) FROM wallet_transactions WHERE type = 'platform_fee') AS total_vitrinei_fees,
  (SELECT COALESCE(SUM(amount), 0) FROM wallet_transactions WHERE type = 'anticipation_fee') AS total_anticipation_fees;

-- 6. Function: Atomic checkout with stock deduction + split + cashback priority
CREATE OR REPLACE FUNCTION public.process_checkout_acid(
  _buyer_id uuid,
  _seller_id uuid,
  _items jsonb, -- [{product_id: int, quantity: int, unit_price: numeric}]
  _description text DEFAULT 'Compra de produtos/serviços',
  _installments integer DEFAULT 1,
  _use_cashback boolean DEFAULT true
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _buyer_wallet RECORD;
  _seller_wallet RECORD;
  _total_amount numeric := 0;
  _item RECORD;
  _product RECORD;
  _buyer_fee numeric;
  _seller_fee numeric;
  _vitrinei_fee numeric;
  _cashback_used numeric := 0;
  _remaining_amount numeric;
  _anticipation_discount numeric := 0;
  _locked_for_seller numeric := 0;
  _vitrinei_anticipation numeric := 0;
  _seller_net numeric;
  _result jsonb;
BEGIN
  -- Lock wallets
  SELECT * INTO _buyer_wallet FROM wallets WHERE user_id = _buyer_id FOR UPDATE;
  SELECT * INTO _seller_wallet FROM wallets WHERE user_id = _seller_id FOR UPDATE;

  IF _buyer_wallet IS NULL OR _seller_wallet IS NULL THEN
    RETURN jsonb_build_object('error', 'Carteira não encontrada');
  END IF;

  -- Validate and deduct stock for each item
  FOR _item IN SELECT * FROM jsonb_to_recordset(_items) AS x(product_id int, quantity int, unit_price numeric)
  LOOP
    SELECT * INTO _product FROM dynamic_products WHERE id = _item.product_id FOR UPDATE;
    IF _product IS NULL THEN
      RETURN jsonb_build_object('error', 'Produto ID ' || _item.product_id || ' não encontrado');
    END IF;
    IF _product.quantity < _item.quantity THEN
      RETURN jsonb_build_object('error', 'Estoque insuficiente para ' || _product.name || ' (disponível: ' || _product.quantity || ')');
    END IF;
    -- Deduct stock
    UPDATE dynamic_products SET quantity = quantity - _item.quantity WHERE id = _item.product_id;
    _total_amount := _total_amount + (_item.unit_price * _item.quantity);
  END LOOP;

  -- Cashback priority: use locked_cashback first if enabled
  IF _use_cashback AND _buyer_wallet.locked_cashback > 0 THEN
    _cashback_used := LEAST(_buyer_wallet.locked_cashback, _total_amount);
    -- Tax-free for 100% cashback transactions
    IF _cashback_used >= _total_amount THEN
      -- Full cashback: no fees
      UPDATE wallets SET
        locked_cashback = locked_cashback - _cashback_used,
        total_spent = total_spent + _total_amount,
        updated_at = now()
      WHERE user_id = _buyer_id;

      INSERT INTO wallet_transactions (user_id, wallet_id, amount, type, description)
      VALUES (_buyer_id, _buyer_wallet.id, -_total_amount, 'purchase',
        '[Compra Cashback] ' || _description || ' (100% cashback - taxa zero)');

      -- Credit seller full amount (no fees on cashback)
      UPDATE wallets SET
        balance = balance + _total_amount,
        total_earned = total_earned + _total_amount,
        updated_at = now()
      WHERE user_id = _seller_id;

      INSERT INTO wallet_transactions (user_id, wallet_id, amount, type, description)
      VALUES (_seller_id, _seller_wallet.id, _total_amount, 'sale_credit',
        '[Venda] ' || _description || ' (cashback do comprador - sem taxas)');

      RETURN jsonb_build_object(
        'success', true,
        'total', _total_amount,
        'cashback_used', _cashback_used,
        'fees', 0,
        'seller_net', _total_amount
      );
    END IF;
  END IF;

  -- Remaining after cashback
  _remaining_amount := _total_amount - _cashback_used;

  -- Check buyer balance for remaining
  IF _buyer_wallet.balance + _buyer_wallet.locked_cashback - _cashback_used < _remaining_amount THEN
    -- Rollback stock
    FOR _item IN SELECT * FROM jsonb_to_recordset(_items) AS x(product_id int, quantity int, unit_price numeric)
    LOOP
      UPDATE dynamic_products SET quantity = quantity + _item.quantity WHERE id = _item.product_id;
    END LOOP;
    RETURN jsonb_build_object('error', 'Saldo insuficiente');
  END IF;

  -- Calculate fees on remaining (non-cashback) amount
  _buyer_fee := ROUND(_remaining_amount * 0.01, 2);
  _seller_fee := ROUND(_remaining_amount * 0.01, 2);
  _vitrinei_fee := _buyer_fee + _seller_fee;

  -- Anticipation for installments
  IF _installments > 1 AND _installments <= 5 THEN
    _anticipation_discount := ROUND(_remaining_amount * 0.20, 2);
    _locked_for_seller := ROUND(_anticipation_discount * 0.50, 2);
    _vitrinei_anticipation := _anticipation_discount - _locked_for_seller;
  END IF;

  _seller_net := _remaining_amount - _seller_fee - _anticipation_discount;

  -- Debit buyer
  UPDATE wallets SET
    balance = balance - _remaining_amount - _buyer_fee,
    locked_cashback = locked_cashback - _cashback_used,
    total_spent = total_spent + _total_amount + _buyer_fee,
    updated_at = now()
  WHERE user_id = _buyer_id;

  -- Buyer transactions
  IF _cashback_used > 0 THEN
    INSERT INTO wallet_transactions (user_id, wallet_id, amount, type, description)
    VALUES (_buyer_id, _buyer_wallet.id, -_cashback_used, 'cashback_debit',
      '[Cashback Utilizado] ' || _description || ' (taxa zero)');
  END IF;

  INSERT INTO wallet_transactions (user_id, wallet_id, amount, type, description)
  VALUES (_buyer_id, _buyer_wallet.id, -_remaining_amount, 'purchase',
    '[Compra] ' || _description);

  IF _buyer_fee > 0 THEN
    INSERT INTO wallet_transactions (user_id, wallet_id, amount, type, description)
    VALUES (_buyer_id, _buyer_wallet.id, -_buyer_fee, 'platform_fee',
      '[Taxa Vitrinei] 1% sobre R$ ' || _remaining_amount::text);
  END IF;

  -- Credit seller
  UPDATE wallets SET
    balance = balance + _seller_net + _cashback_used,
    locked_cashback = locked_cashback + _locked_for_seller,
    total_earned = total_earned + _seller_net + _locked_for_seller + _cashback_used,
    updated_at = now()
  WHERE user_id = _seller_id;

  INSERT INTO wallet_transactions (user_id, wallet_id, amount, type, description)
  VALUES (_seller_id, _seller_wallet.id, _seller_net + _cashback_used, 'sale_credit',
    '[Venda] ' || _description || ' (líquido após taxas)');

  IF _seller_fee > 0 THEN
    INSERT INTO wallet_transactions (user_id, wallet_id, amount, type, description)
    VALUES (_seller_id, _seller_wallet.id, -_seller_fee, 'platform_fee',
      '[Taxa Vitrinei] 1% sobre venda R$ ' || _remaining_amount::text);
  END IF;

  IF _locked_for_seller > 0 THEN
    INSERT INTO wallet_transactions (user_id, wallet_id, amount, type, description)
    VALUES (_seller_id, _seller_wallet.id, _locked_for_seller, 'locked_cashback',
      '[Cashback Retido] Antecipação ' || _installments || 'x');
  END IF;

  IF _vitrinei_anticipation > 0 THEN
    INSERT INTO wallet_transactions (user_id, wallet_id, amount, type, description)
    VALUES (_seller_id, _seller_wallet.id, -_vitrinei_anticipation, 'anticipation_fee',
      '[Desconto Antecipação] ' || _installments || 'x - Vitrinei');
  END IF;

  -- Log
  INSERT INTO system_logs (level, action, message, context, user_id)
  VALUES ('info', 'checkout_acid', 'Checkout processado com sucesso',
    jsonb_build_object('buyer_id', _buyer_id, 'seller_id', _seller_id, 'total', _total_amount,
      'cashback_used', _cashback_used, 'fees', _vitrinei_fee, 'seller_net', _seller_net),
    _buyer_id);

  RETURN jsonb_build_object(
    'success', true,
    'total', _total_amount,
    'cashback_used', _cashback_used,
    'buyer_fee', _buyer_fee,
    'seller_fee', _seller_fee,
    'anticipation', _anticipation_discount,
    'seller_net', _seller_net + _cashback_used,
    'vitrinei_total', _vitrinei_fee + _vitrinei_anticipation
  );
END;
$$;

-- 7. Function: Calculate fidelity score
CREATE OR REPLACE FUNCTION public.calculate_fidelity_score(_user_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _tx_count integer;
  _total_volume numeric;
  _days_active integer;
  _has_debt boolean;
  _score numeric := 0;
BEGIN
  SELECT COUNT(*), COALESCE(SUM(ABS(amount)), 0)
  INTO _tx_count, _total_volume
  FROM wallet_transactions
  WHERE user_id = _user_id AND type IN ('purchase', 'sale_credit', 'subscription_payment');

  SELECT EXTRACT(DAY FROM now() - MIN(created_at))::integer
  INTO _days_active
  FROM wallet_transactions WHERE user_id = _user_id;

  SELECT (balance < 0) INTO _has_debt FROM wallets WHERE user_id = _user_id;

  -- Score formula: transactions * 10 + volume/100 + days_active * 2
  _score := (_tx_count * 10) + (_total_volume / 100) + (COALESCE(_days_active, 0) * 2);

  -- Penalty for debt
  IF _has_debt THEN
    _score := _score * 0.3;
  END IF;

  -- Update profile
  UPDATE profiles SET
    fidelity_score = ROUND(_score, 2),
    elite_since = CASE
      WHEN ROUND(_score, 2) >= 100 AND NOT _has_debt THEN COALESCE(elite_since, now())
      ELSE NULL
    END
  WHERE user_id = _user_id;

  RETURN ROUND(_score, 2);
END;
$$;

-- 8. Function: Contract credit based on locked_cashback
CREATE OR REPLACE FUNCTION public.contract_credit(_user_id uuid, _amount numeric)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _wallet RECORD;
  _max_credit numeric;
  _available_credit numeric;
  _vitrinei_fee numeric;
  _anticipation_fee numeric;
  _net_amount numeric;
BEGIN
  SELECT * INTO _wallet FROM wallets WHERE user_id = _user_id FOR UPDATE;
  IF _wallet IS NULL THEN
    RETURN jsonb_build_object('error', 'Carteira não encontrada');
  END IF;

  -- R$ 1,00 cashback = R$ 0,50 credit limit
  _max_credit := ROUND(_wallet.locked_cashback * 0.50, 2);
  _available_credit := _max_credit - _wallet.credit_used;

  IF _amount > _available_credit THEN
    RETURN jsonb_build_object('error', 'Limite de crédito insuficiente. Disponível: R$ ' || _available_credit::text);
  END IF;

  IF _amount <= 0 THEN
    RETURN jsonb_build_object('error', 'Valor deve ser positivo');
  END IF;

  -- Fees: 1% utilization + 20% anticipation for the company
  _vitrinei_fee := ROUND(_amount * 0.01, 2);
  _anticipation_fee := ROUND(_amount * 0.20, 2);
  _net_amount := _amount - _vitrinei_fee - _anticipation_fee;

  -- Credit user wallet
  UPDATE wallets SET
    balance = balance + _net_amount,
    credit_used = credit_used + _amount,
    updated_at = now()
  WHERE user_id = _user_id;

  -- Record transactions
  INSERT INTO wallet_transactions (user_id, wallet_id, amount, type, description)
  VALUES (_user_id, _wallet.id, _net_amount, 'credit_release',
    '[Crédito] Empréstimo R$ ' || _amount::text || ' (líquido após taxas)');

  INSERT INTO wallet_transactions (user_id, wallet_id, amount, type, description)
  VALUES (_user_id, _wallet.id, -_vitrinei_fee, 'platform_fee',
    '[Taxa Vitrinei] 1% sobre crédito de R$ ' || _amount::text);

  INSERT INTO wallet_transactions (user_id, wallet_id, amount, type, description)
  VALUES (_user_id, _wallet.id, -_anticipation_fee, 'anticipation_fee',
    '[Antecipação] 20% sobre crédito de R$ ' || _amount::text);

  INSERT INTO system_logs (level, action, message, context, user_id)
  VALUES ('info', 'contract_credit', 'Crédito contratado com sucesso',
    jsonb_build_object('amount', _amount, 'net', _net_amount, 'fee', _vitrinei_fee, 'anticipation', _anticipation_fee),
    _user_id);

  RETURN jsonb_build_object(
    'success', true,
    'gross', _amount,
    'net', _net_amount,
    'fee', _vitrinei_fee,
    'anticipation', _anticipation_fee,
    'credit_used', _wallet.credit_used + _amount,
    'credit_limit', _max_credit
  );
END;
$$;

-- 9. Trigger to update fidelity score after financial transactions
CREATE OR REPLACE FUNCTION public.update_fidelity_on_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.type IN ('purchase', 'sale_credit', 'subscription_payment') THEN
    PERFORM calculate_fidelity_score(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_fidelity_on_transaction ON wallet_transactions;
CREATE TRIGGER trg_fidelity_on_transaction
  AFTER INSERT ON wallet_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_fidelity_on_transaction();

-- Re-create the referral trigger (was missing from db-triggers)
DROP TRIGGER IF EXISTS trg_referral_on_transaction ON wallet_transactions;
CREATE TRIGGER trg_referral_on_transaction
  AFTER INSERT ON wallet_transactions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_referral_on_transaction();
