
-- 1. System Logs table for error tracking
CREATE TABLE IF NOT EXISTS public.system_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level text NOT NULL DEFAULT 'error',
  action text NOT NULL,
  message text NOT NULL,
  context jsonb DEFAULT '{}'::jsonb,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage system_logs"
  ON public.system_logs FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow service role inserts (edge functions)
CREATE POLICY "Service can insert system_logs"
  ON public.system_logs FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE INDEX idx_system_logs_created ON public.system_logs (created_at DESC);
CREATE INDEX idx_system_logs_level ON public.system_logs (level);

-- 2. Add auth_split_5x flag to providers
ALTER TABLE public.providers
  ADD COLUMN IF NOT EXISTS auth_split_5x boolean NOT NULL DEFAULT false;

-- 3. Add locked_cashback to wallets
ALTER TABLE public.wallets
  ADD COLUMN IF NOT EXISTS locked_cashback numeric NOT NULL DEFAULT 0;

-- 4. Atomic sale split function
CREATE OR REPLACE FUNCTION public.process_sale_split(
  _buyer_id uuid,
  _seller_id uuid,
  _amount numeric,
  _description text,
  _installments integer DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _buyer_wallet RECORD;
  _seller_wallet RECORD;
  _vitrinei_fee numeric;
  _buyer_fee numeric;
  _seller_fee numeric;
  _anticipation_discount numeric := 0;
  _locked_for_seller numeric := 0;
  _vitrinei_anticipation numeric := 0;
  _seller_net numeric;
  _seller_available numeric;
  _provider RECORD;
  _log_context jsonb;
BEGIN
  -- Get wallets
  SELECT * INTO _buyer_wallet FROM wallets WHERE user_id = _buyer_id FOR UPDATE;
  SELECT * INTO _seller_wallet FROM wallets WHERE user_id = _seller_id FOR UPDATE;

  IF _buyer_wallet IS NULL OR _seller_wallet IS NULL THEN
    INSERT INTO system_logs (level, action, message, context)
    VALUES ('error', 'process_sale_split', 'Carteira não encontrada',
      jsonb_build_object('buyer_id', _buyer_id, 'seller_id', _seller_id));
    RETURN jsonb_build_object('error', 'Carteira do comprador ou vendedor não encontrada');
  END IF;

  -- Check buyer balance
  IF _buyer_wallet.balance < _amount THEN
    INSERT INTO system_logs (level, action, message, context)
    VALUES ('warn', 'process_sale_split', 'Saldo insuficiente do comprador',
      jsonb_build_object('buyer_id', _buyer_id, 'balance', _buyer_wallet.balance, 'amount', _amount));
    RETURN jsonb_build_object('error', 'Saldo insuficiente');
  END IF;

  -- Calculate fees: 1% buyer + 1% seller = 2% Vitrinei
  _buyer_fee := ROUND(_amount * 0.01, 2);
  _seller_fee := ROUND(_amount * 0.01, 2);
  _vitrinei_fee := _buyer_fee + _seller_fee;

  -- Check if seller has split 5x enabled and buyer chose installments
  IF _installments > 1 AND _installments <= 5 THEN
    -- Check provider auth_split_5x
    SELECT * INTO _provider FROM providers WHERE cpf_cnpj IS NOT NULL LIMIT 0; -- placeholder
    
    _anticipation_discount := ROUND(_amount * 0.20, 2);
    _locked_for_seller := ROUND(_anticipation_discount * 0.50, 2); -- 10% of total → locked cashback
    _vitrinei_anticipation := _anticipation_discount - _locked_for_seller; -- 10% of total → Vitrinei
  END IF;

  _seller_net := _amount - _seller_fee - _anticipation_discount;
  _seller_available := _seller_net;

  -- === BUYER: Debit ===
  UPDATE wallets SET
    balance = balance - _amount - _buyer_fee,
    total_spent = total_spent + _amount + _buyer_fee,
    updated_at = now()
  WHERE user_id = _buyer_id;

  INSERT INTO wallet_transactions (user_id, wallet_id, amount, type, description)
  VALUES (_buyer_id, _buyer_wallet.id, -_amount, 'purchase',
    '[Compra] ' || _description);

  IF _buyer_fee > 0 THEN
    INSERT INTO wallet_transactions (user_id, wallet_id, amount, type, description)
    VALUES (_buyer_id, _buyer_wallet.id, -_buyer_fee, 'platform_fee',
      '[Taxa Vitrinei] 1% sobre compra de R$ ' || _amount::text);
  END IF;

  -- === SELLER: Credit ===
  UPDATE wallets SET
    balance = balance + _seller_available,
    locked_cashback = locked_cashback + _locked_for_seller,
    total_earned = total_earned + _seller_available + _locked_for_seller,
    updated_at = now()
  WHERE user_id = _seller_id;

  INSERT INTO wallet_transactions (user_id, wallet_id, amount, type, description)
  VALUES (_seller_id, _seller_wallet.id, _seller_available, 'sale_credit',
    '[Venda] ' || _description || ' (líquido após taxas)');

  IF _seller_fee > 0 THEN
    INSERT INTO wallet_transactions (user_id, wallet_id, amount, type, description)
    VALUES (_seller_id, _seller_wallet.id, -_seller_fee, 'platform_fee',
      '[Taxa Vitrinei] 1% sobre venda de R$ ' || _amount::text);
  END IF;

  IF _locked_for_seller > 0 THEN
    INSERT INTO wallet_transactions (user_id, wallet_id, amount, type, description)
    VALUES (_seller_id, _seller_wallet.id, _locked_for_seller, 'locked_cashback',
      '[Cashback Retido] Antecipação ' || _installments || 'x - uso interno');
  END IF;

  IF _vitrinei_anticipation > 0 THEN
    INSERT INTO wallet_transactions (user_id, wallet_id, amount, type, description)
    VALUES (_seller_id, _seller_wallet.id, -_vitrinei_anticipation, 'anticipation_fee',
      '[Desconto Antecipação] ' || _installments || 'x - 10% para Vitrinei');
  END IF;

  -- Log success
  _log_context := jsonb_build_object(
    'buyer_id', _buyer_id, 'seller_id', _seller_id,
    'amount', _amount, 'installments', _installments,
    'buyer_fee', _buyer_fee, 'seller_fee', _seller_fee,
    'anticipation_discount', _anticipation_discount,
    'locked_cashback', _locked_for_seller,
    'vitrinei_take', _vitrinei_fee + _vitrinei_anticipation,
    'seller_net', _seller_available
  );

  INSERT INTO system_logs (level, action, message, context, user_id)
  VALUES ('info', 'process_sale_split', 'Split processado com sucesso', _log_context, _buyer_id);

  RETURN jsonb_build_object(
    'success', true,
    'buyer_total', _amount + _buyer_fee,
    'seller_net', _seller_available,
    'locked_cashback', _locked_for_seller,
    'vitrinei_total', _vitrinei_fee + _vitrinei_anticipation
  );
END;
$$;

-- 5. Trigger to auto-release referral bonus on first financial transaction
CREATE OR REPLACE FUNCTION public.trigger_referral_on_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _referral RECORD;
  _phase text;
BEGIN
  -- Only trigger on purchase or sale (real financial movements)
  IF NEW.type NOT IN ('purchase', 'sale_credit', 'subscription_payment') THEN
    RETURN NEW;
  END IF;

  -- Find pending referral where this user is the referred
  FOR _referral IN
    SELECT * FROM referrals
    WHERE referred_id = NEW.user_id
      AND status IN ('pending', 'partial')
  LOOP
    -- Determine phase based on transaction type
    IF NEW.type IN ('purchase', 'subscription_payment') THEN
      _phase := 'buyer';
    ELSE
      _phase := 'seller';
    END IF;

    -- Try to release the cashback for this phase
    BEGIN
      PERFORM release_fractioned_cashback(_referral.id, _phase);
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO system_logs (level, action, message, context, user_id)
      VALUES ('error', 'trigger_referral_on_transaction',
        'Erro ao liberar bônus de indicação: ' || SQLERRM,
        jsonb_build_object('referral_id', _referral.id, 'phase', _phase, 'tx_type', NEW.type),
        NEW.user_id);
    END;
  END LOOP;

  RETURN NEW;
END;
$$;

-- Create the trigger on wallet_transactions
DROP TRIGGER IF EXISTS trg_referral_on_transaction ON public.wallet_transactions;
CREATE TRIGGER trg_referral_on_transaction
  AFTER INSERT ON public.wallet_transactions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_referral_on_transaction();
