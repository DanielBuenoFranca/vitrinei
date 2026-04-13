
-- Fix security definer view
DROP VIEW IF EXISTS public.admin_financial_health;
CREATE VIEW public.admin_financial_health WITH (security_invoker = true) AS
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
