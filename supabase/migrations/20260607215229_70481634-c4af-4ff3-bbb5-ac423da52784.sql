ALTER TABLE public.referral_campaigns
  ADD COLUMN IF NOT EXISTS invite_expiration_hours integer NOT NULL DEFAULT 24;