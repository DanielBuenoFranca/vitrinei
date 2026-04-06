
-- 1. Subscriptions table
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan TEXT NOT NULL DEFAULT 'bronze',
  price NUMERIC NOT NULL DEFAULT 50,
  status TEXT NOT NULL DEFAULT 'active',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own subscriptions" ON public.subscriptions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users insert own subscription" ON public.subscriptions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own subscription" ON public.subscriptions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Add pending_balance to wallets
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS pending_balance NUMERIC NOT NULL DEFAULT 0;

-- 3. Add referral detail columns
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS referred_name TEXT;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS referred_phone TEXT;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS referred_email TEXT;
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS referred_role TEXT DEFAULT 'client';
ALTER TABLE public.referrals ADD COLUMN IF NOT EXISTS joined_at TIMESTAMP WITH TIME ZONE;

-- 4. Function to release pending cashback
CREATE OR REPLACE FUNCTION public.release_referral_cashback(_referred_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _referral RECORD;
  _referrer_wallet_id UUID;
BEGIN
  -- Find pending referral for this referred user
  SELECT * INTO _referral FROM public.referrals
    WHERE referred_id = _referred_user_id AND status = 'pending'
    LIMIT 1;

  IF _referral IS NULL THEN RETURN; END IF;

  -- Get referrer wallet
  SELECT id INTO _referrer_wallet_id FROM public.wallets WHERE user_id = _referral.referrer_id;
  IF _referrer_wallet_id IS NULL THEN RETURN; END IF;

  -- Move from pending to available
  UPDATE public.wallets
    SET balance = balance + _referral.commission_amount,
        pending_balance = pending_balance - _referral.commission_amount,
        total_earned = total_earned + _referral.commission_amount,
        updated_at = now()
    WHERE user_id = _referral.referrer_id;

  -- Mark referral as activated
  UPDATE public.referrals
    SET status = 'activated', activated_at = now()
    WHERE id = _referral.id;

  -- Record transaction
  INSERT INTO public.wallet_transactions (user_id, wallet_id, amount, type, description)
    VALUES (_referral.referrer_id, _referrer_wallet_id, _referral.commission_amount, 'cashback_released',
      'Cashback liberado - indicação de ' || COALESCE(_referral.referred_name, 'usuário'));
END;
$$;
