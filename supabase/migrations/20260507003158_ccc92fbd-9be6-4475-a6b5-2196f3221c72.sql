
-- Fix stock_movements_movement_type_check to include all values used by production RPCs
ALTER TABLE public.stock_movements DROP CONSTRAINT IF EXISTS stock_movements_movement_type_check;
ALTER TABLE public.stock_movements ADD CONSTRAINT stock_movements_movement_type_check
CHECK (movement_type = ANY (ARRAY[
  'sale','entry_in','kit_generation','kit_consumption','kit_supplier_debit',
  'adjustment','adjust_in','adjust_out','import','manual_in','manual_out',
  'rollback','service_execution','transfer_in','transfer_out'
]));

-- Allow service movements to skip physical balance
ALTER TABLE public.stock_movements ALTER COLUMN balance_after DROP NOT NULL;

-- Referrals: add 24h link tokens
ALTER TABLE public.referrals
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS link_token text,
  ADD COLUMN IF NOT EXISTS consumed_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS referrals_link_token_key ON public.referrals(link_token) WHERE link_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS referrals_expires_at_idx ON public.referrals(expires_at);

-- RPC: generate 24h referral link (max 3 active per user)
CREATE OR REPLACE FUNCTION public.generate_referral_link_24h(_referrer uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _active int;
  _token text;
  _id uuid;
BEGIN
  IF _referrer IS NULL THEN
    RETURN jsonb_build_object('error','Usuário inválido');
  END IF;

  SELECT COUNT(*) INTO _active FROM referrals
    WHERE referrer_id = _referrer
      AND status = 'pending'
      AND expires_at IS NOT NULL
      AND expires_at > now()
      AND consumed_at IS NULL;

  IF _active >= 3 THEN
    RETURN jsonb_build_object('error','Limite de 3 links ativos atingido. Aguarde expirar ou ser usado.');
  END IF;

  _token := encode(gen_random_bytes(12),'hex');

  INSERT INTO referrals (referrer_id, referral_code, link_token, status, expires_at, commission_amount)
  VALUES (_referrer, upper(substring(_token from 1 for 8)), _token, 'pending', now() + interval '24 hours', 5)
  RETURNING id INTO _id;

  RETURN jsonb_build_object('success', true, 'id', _id, 'token', _token,
    'expires_at', (now() + interval '24 hours'));
END;
$$;

-- Public lookup of a 24h link by token
CREATE OR REPLACE FUNCTION public.get_referral_by_token(_token text)
RETURNS TABLE(id uuid, referrer_id uuid, expires_at timestamptz, consumed_at timestamptz, status text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT id, referrer_id, expires_at, consumed_at, status FROM referrals WHERE link_token = _token LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_referral_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_referral_link_24h(uuid) TO authenticated;
