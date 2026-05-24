-- 1. Function to check if a user is a Master (utility)
CREATE OR REPLACE FUNCTION public.is_master(_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'master'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 2. Refine the prevent_last_master_deletion to be more robust
CREATE OR REPLACE FUNCTION public.prevent_last_master_deletion()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  master_count INTEGER;
BEGIN
  -- Handle deletions from user_roles
  IF TG_OP = 'DELETE' THEN
    IF OLD.role = 'master' THEN
      SELECT count(*) INTO master_count FROM public.user_roles WHERE role = 'master';
      IF master_count <= 1 THEN
        RAISE EXCEPTION 'Não é possível concluir a operação porque um usuário MASTER ativo é obrigatório.';
      END IF;
    END IF;
    RETURN OLD;
  END IF;

  -- Handle updates in user_roles (changing away from master)
  IF TG_OP = 'UPDATE' THEN
    IF OLD.role = 'master' AND NEW.role != 'master' THEN
      SELECT count(*) INTO master_count FROM public.user_roles WHERE role = 'master';
      IF master_count <= 1 THEN
        RAISE EXCEPTION 'Não é possível concluir a operação porque um usuário MASTER ativo é obrigatório.';
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$function$;

-- Ensure the trigger is attached correctly (it already exists but we updated the function)
-- DROP TRIGGER IF EXISTS prevent_last_master_delete ON public.user_roles;
-- CREATE TRIGGER prevent_last_master_delete
-- BEFORE DELETE OR UPDATE ON public.user_roles
-- FOR EACH ROW EXECUTE FUNCTION public.prevent_last_master_deletion();

-- 3. Enforce Master is always ACTIVE in profiles
CREATE OR REPLACE FUNCTION public.sync_master_active_status()
RETURNS trigger AS $$
BEGIN
  IF public.is_master(NEW.user_id) THEN
    NEW.status := 'active';
    NEW.is_activated := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_master_active_status ON public.profiles;
CREATE TRIGGER trg_sync_master_active_status
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_master_active_status();

-- 4. Trigger when role changes to master to immediately update profile
CREATE OR REPLACE FUNCTION public.on_role_change_sync_profile()
RETURNS trigger AS $$
BEGIN
  IF NEW.role = 'master' THEN
    UPDATE public.profiles
    SET status = 'active', is_activated = true
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_on_role_change_sync_profile ON public.user_roles;
CREATE TRIGGER trg_on_role_change_sync_profile
AFTER INSERT OR UPDATE OF role ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.on_role_change_sync_profile();

-- 5. Prevent deactivation of Master via profiles table updates
CREATE OR REPLACE FUNCTION public.prevent_master_deactivation()
RETURNS trigger AS $$
BEGIN
  IF public.is_master(OLD.user_id) AND (NEW.status != 'active' OR NEW.is_activated = false) THEN
    -- If it's a master, we force it to stay active
    NEW.status := 'active';
    NEW.is_activated := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_master_deactivation ON public.profiles;
CREATE TRIGGER trg_prevent_master_deactivation
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_master_deactivation();

-- 6. Exclude Master from Metrics View (admin_financial_health)
CREATE OR REPLACE VIEW public.admin_financial_health AS
 SELECT ( SELECT COALESCE(sum(w.balance), (0)::numeric) AS "coalesce"
           FROM wallets w
          WHERE (w.balance > (0)::numeric AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = w.user_id AND ur.role = 'master'))) AS total_float,
    ( SELECT COALESCE(sum(abs(w.balance)), (0)::numeric) AS "coalesce"
           FROM wallets w
          WHERE (w.balance < (0)::numeric AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = w.user_id AND ur.role = 'master'))) AS total_debt,
    ( SELECT COALESCE(sum(w.locked_cashback), (0)::numeric) AS "coalesce"
           FROM wallets w
           WHERE NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = w.user_id AND ur.role = 'master')) AS total_locked_cashback,
    ( SELECT COALESCE(sum(w.pending_balance), (0)::numeric) AS "coalesce"
           FROM wallets w
           WHERE NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = w.user_id AND ur.role = 'master')) AS total_pending,
    ( SELECT COALESCE(sum(w.credit_used), (0)::numeric) AS "coalesce"
           FROM wallets w
           WHERE NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = w.user_id AND ur.role = 'master')) AS total_credit_used,
    ( SELECT count(*) AS count
           FROM wallets w
          WHERE (w.balance < (0)::numeric AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = w.user_id AND ur.role = 'master'))) AS debtors_count,
    ( SELECT count(*) AS count
           FROM wallets w
          WHERE (w.balance >= (0)::numeric AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = w.user_id AND ur.role = 'master'))) AS healthy_count,
    ( SELECT count(*) AS count
           FROM profiles p
           WHERE NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = p.user_id AND ur.role = 'master')) AS total_users,
    ( SELECT count(*) AS count
           FROM profiles p
          WHERE (p.is_provider = true AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = p.user_id AND ur.role = 'master'))) AS total_providers,
    ( SELECT count(*) AS count
           FROM profiles p
          WHERE (p.is_customer = true AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = p.user_id AND ur.role = 'master'))) AS total_customers,
    ( SELECT count(*) AS count
           FROM referrals r
          WHERE (r.status = 'pending'::text AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = r.referred_id AND ur.role = 'master'))) AS pending_referrals,
    ( SELECT count(*) AS count
           FROM referrals r
          WHERE (r.status = 'activated'::text AND NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = r.referred_id AND ur.role = 'master'))) AS activated_referrals,
    ( SELECT COALESCE(sum(wallet_transactions.amount), (0)::numeric) AS "coalesce"
           FROM wallet_transactions
          WHERE (wallet_transactions.type = 'platform_fee'::text)) AS total_vitrinei_fees,
    ( SELECT COALESCE(sum(wallet_transactions.amount), (0)::numeric) AS "coalesce"
           FROM wallet_transactions
          WHERE (wallet_transactions.type = 'anticipation_fee'::text)) AS total_anticipation_fees;

-- 7. Exclude Master from Funnel View (v_lead_funnel)
CREATE OR REPLACE VIEW public.v_lead_funnel AS
 SELECT r.id AS referral_id,
    r.referral_code,
    r.referrer_id,
    rp.display_name AS referrer_name,
    r.referred_id,
    r.referred_name,
    r.referred_email,
    r.referred_phone,
    r.referred_role,
    r.status AS referral_status,
    r.created_at AS referral_created_at,
    r.activated_at,
    r.total_paid,
    r.commission_amount,
    r.buyer_released,
    r.seller_released,
    r.bonus_released,
    (p.user_id IS NOT NULL) AS profile_created,
    (s.id IS NOT NULL) AS has_subscription,
    s.status AS subscription_status,
    COALESCE(p.subscription_paid, false) AS subscription_paid,
    ( SELECT min(wt.created_at) AS min
           FROM wallet_transactions wt
          WHERE ((wt.user_id = r.referred_id) AND (wt.type = 'purchase'::text))) AS first_purchase_at,
    ( SELECT min(wt.created_at) AS min
           FROM wallet_transactions wt
          WHERE ((wt.user_id = r.referred_id) AND (wt.type = 'sale_credit'::text))) AS first_sale_at
   FROM (((referrals r
     LEFT JOIN profiles p ON ((p.user_id = r.referred_id)))
     LEFT JOIN profiles rp ON ((rp.user_id = r.referrer_id)))
     LEFT JOIN LATERAL ( SELECT subscriptions.id,
            subscriptions.status
           FROM subscriptions
          WHERE (subscriptions.user_id = r.referred_id)
          ORDER BY subscriptions.created_at DESC
         LIMIT 1) s ON (true))
    WHERE NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = r.referred_id AND ur.role = 'master');
