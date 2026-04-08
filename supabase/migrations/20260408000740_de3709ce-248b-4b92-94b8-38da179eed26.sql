
-- Create referral_campaigns table
CREATE TABLE public.referral_campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reward_buyer numeric NOT NULL DEFAULT 5.00,
  reward_seller numeric NOT NULL DEFAULT 15.00,
  reward_mixed_total numeric NOT NULL DEFAULT 25.00,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_campaigns ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read active campaigns
CREATE POLICY "Anyone can read campaigns"
  ON public.referral_campaigns FOR SELECT
  TO authenticated
  USING (true);

-- Only admins/masters can manage campaigns
CREATE POLICY "Admins manage campaigns"
  ON public.referral_campaigns FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Auto-update timestamp
CREATE TRIGGER update_referral_campaigns_updated_at
  BEFORE UPDATE ON public.referral_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add snapshot and fractioned tracking columns to referrals
ALTER TABLE public.referrals
  ADD COLUMN IF NOT EXISTS reward_snapshot jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS buyer_released boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS seller_released boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bonus_released boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS total_paid numeric NOT NULL DEFAULT 0;

-- Insert a default active campaign
INSERT INTO public.referral_campaigns (reward_buyer, reward_seller, reward_mixed_total, is_active)
VALUES (5.00, 15.00, 25.00, true);

-- Create fractioned cashback release function
CREATE OR REPLACE FUNCTION public.release_fractioned_cashback(
  _referral_id uuid,
  _phase text -- 'buyer' or 'seller'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _referral RECORD;
  _snapshot jsonb;
  _reward_buyer numeric;
  _reward_seller numeric;
  _reward_mixed_total numeric;
  _amount_to_release numeric := 0;
  _referrer_wallet_id uuid;
  _new_total numeric;
  _phase_label text;
  _result jsonb;
BEGIN
  -- Get referral with lock
  SELECT * INTO _referral FROM public.referrals WHERE id = _referral_id FOR UPDATE;
  IF _referral IS NULL THEN
    RETURN jsonb_build_object('error', 'Indicação não encontrada');
  END IF;

  -- Get snapshot values
  _snapshot := _referral.reward_snapshot;
  IF _snapshot IS NULL THEN
    RETURN jsonb_build_object('error', 'Snapshot de recompensa não encontrado');
  END IF;

  _reward_buyer := (_snapshot->>'reward_buyer')::numeric;
  _reward_seller := (_snapshot->>'reward_seller')::numeric;
  _reward_mixed_total := (_snapshot->>'reward_mixed_total')::numeric;

  -- Determine amount based on phase and referred_role
  IF _referral.referred_role = 'mixed' THEN
    IF _phase = 'buyer' AND NOT _referral.buyer_released THEN
      _amount_to_release := _reward_buyer;
      _phase_label := 'Fase 1/2 (Compra)';
    ELSIF _phase = 'seller' AND NOT _referral.seller_released THEN
      _amount_to_release := _reward_seller;
      _phase_label := 'Fase 2/2 (Venda)';
    ELSE
      RETURN jsonb_build_object('error', 'Fase já liberada ou inválida');
    END IF;
  ELSIF _referral.referred_role IN ('client', 'buyer') THEN
    IF _phase = 'buyer' AND NOT _referral.buyer_released THEN
      _amount_to_release := _reward_buyer;
      _phase_label := 'Completo';
    ELSE
      RETURN jsonb_build_object('error', 'Já liberado');
    END IF;
  ELSIF _referral.referred_role IN ('provider', 'seller') THEN
    IF _phase = 'seller' AND NOT _referral.seller_released THEN
      _amount_to_release := _reward_seller;
      _phase_label := 'Completo';
    ELSE
      RETURN jsonb_build_object('error', 'Já liberado');
    END IF;
  END IF;

  -- Safety check: never exceed mixed_total
  _new_total := _referral.total_paid + _amount_to_release;
  IF _new_total > _reward_mixed_total THEN
    _amount_to_release := _reward_mixed_total - _referral.total_paid;
    IF _amount_to_release <= 0 THEN
      RETURN jsonb_build_object('error', 'Limite de recompensa atingido');
    END IF;
  END IF;

  -- Get referrer wallet
  SELECT id INTO _referrer_wallet_id FROM public.wallets WHERE user_id = _referral.referrer_id;
  IF _referrer_wallet_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Carteira do indicador não encontrada');
  END IF;

  -- Credit the referrer
  UPDATE public.wallets
    SET balance = balance + _amount_to_release,
        pending_balance = GREATEST(pending_balance - _amount_to_release, 0),
        total_earned = total_earned + _amount_to_release,
        updated_at = now()
    WHERE user_id = _referral.referrer_id;

  -- Record transaction
  INSERT INTO public.wallet_transactions (user_id, wallet_id, amount, type, description)
    VALUES (
      _referral.referrer_id,
      _referrer_wallet_id,
      _amount_to_release,
      'referral_cashback',
      '[Indicação] ' || COALESCE(_referral.referred_name, 'Usuário') || ' - ' || _phase_label
    );

  -- Update referral tracking
  UPDATE public.referrals SET
    buyer_released = CASE WHEN _phase = 'buyer' THEN true ELSE buyer_released END,
    seller_released = CASE WHEN _phase = 'seller' THEN true ELSE seller_released END,
    total_paid = _referral.total_paid + _amount_to_release,
    status = CASE 
      WHEN _referral.referred_role = 'mixed' AND 
           (CASE WHEN _phase = 'buyer' THEN true ELSE buyer_released END) AND
           (CASE WHEN _phase = 'seller' THEN true ELSE seller_released END) 
        THEN 'activated'
      WHEN _referral.referred_role != 'mixed' THEN 'activated'
      ELSE 'partial'
    END,
    activated_at = CASE
      WHEN _referral.referred_role = 'mixed' AND 
           (CASE WHEN _phase = 'buyer' THEN true ELSE buyer_released END) AND
           (CASE WHEN _phase = 'seller' THEN true ELSE seller_released END) 
        THEN now()
      WHEN _referral.referred_role != 'mixed' THEN now()
      ELSE activated_at
    END
  WHERE id = _referral_id;

  -- Check if bonus should be released (mixed profile, both phases done)
  IF _referral.referred_role = 'mixed' AND NOT _referral.bonus_released THEN
    DECLARE
      _updated_ref RECORD;
      _bonus numeric;
    BEGIN
      SELECT * INTO _updated_ref FROM public.referrals WHERE id = _referral_id;
      IF _updated_ref.buyer_released AND _updated_ref.seller_released THEN
        _bonus := _reward_mixed_total - _updated_ref.total_paid;
        IF _bonus > 0 THEN
          UPDATE public.wallets
            SET balance = balance + _bonus,
                pending_balance = GREATEST(pending_balance - _bonus, 0),
                total_earned = total_earned + _bonus,
                updated_at = now()
            WHERE user_id = _referral.referrer_id;

          INSERT INTO public.wallet_transactions (user_id, wallet_id, amount, type, description)
            VALUES (
              _referral.referrer_id,
              _referrer_wallet_id,
              _bonus,
              'referral_bonus',
              '[Indicação] ' || COALESCE(_referral.referred_name, 'Usuário') || ' - Bônus Misto'
            );

          UPDATE public.referrals SET
            bonus_released = true,
            total_paid = _updated_ref.total_paid + _bonus
          WHERE id = _referral_id;
        END IF;
      END IF;
    END;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'amount', _amount_to_release,
    'phase', _phase_label
  );
END;
$$;
