-- ============================================================
-- 1) GOVERNANÇA DE IA — Períodos de Economia
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_savings_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  started_by uuid,
  ended_by uuid,
  total_credits_saved numeric NOT NULL DEFAULT 0,
  total_calls_diverted integer NOT NULL DEFAULT 0,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_savings_periods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage ai_savings_periods" ON public.ai_savings_periods;
CREATE POLICY "Admins manage ai_savings_periods" ON public.ai_savings_periods
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated read ai_savings_periods" ON public.ai_savings_periods;
CREATE POLICY "Authenticated read ai_savings_periods" ON public.ai_savings_periods
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Service insert ai_savings_periods" ON public.ai_savings_periods;
CREATE POLICY "Service insert ai_savings_periods" ON public.ai_savings_periods
  FOR INSERT TO anon WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_ai_savings_periods_open ON public.ai_savings_periods(ended_at) WHERE ended_at IS NULL;

-- Abre novo período (chamada quando o disjuntor é desligado)
CREATE OR REPLACE FUNCTION public.start_ai_savings_period(_user_id uuid DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _open uuid;
  _new uuid;
BEGIN
  -- Se já existe um período aberto, retorna ele
  SELECT id INTO _open FROM ai_savings_periods WHERE ended_at IS NULL ORDER BY started_at DESC LIMIT 1;
  IF _open IS NOT NULL THEN RETURN _open; END IF;

  INSERT INTO ai_savings_periods (started_by) VALUES (_user_id) RETURNING id INTO _new;
  RETURN _new;
END $$;

-- Fecha período aberto: soma o total economizado (de ai_savings_log) durante o período
CREATE OR REPLACE FUNCTION public.close_ai_savings_period(_user_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _open RECORD;
  _credits numeric := 0;
  _calls integer := 0;
BEGIN
  SELECT * INTO _open FROM ai_savings_periods WHERE ended_at IS NULL ORDER BY started_at DESC LIMIT 1;
  IF _open IS NULL THEN RETURN jsonb_build_object('closed', false, 'reason', 'no_open_period'); END IF;

  SELECT COALESCE(SUM(estimated_credits),0), COUNT(*)
    INTO _credits, _calls
    FROM ai_savings_log
    WHERE created_at >= _open.started_at;

  UPDATE ai_savings_periods
    SET ended_at = now(),
        ended_by = _user_id,
        total_credits_saved = _credits,
        total_calls_diverted = _calls
    WHERE id = _open.id;

  RETURN jsonb_build_object('closed', true, 'period_id', _open.id, 'credits', _credits, 'calls', _calls);
END $$;

-- Total acumulado do período aberto (em tempo real)
CREATE OR REPLACE FUNCTION public.current_ai_savings()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _open RECORD;
  _credits numeric := 0;
  _calls integer := 0;
BEGIN
  SELECT * INTO _open FROM ai_savings_periods WHERE ended_at IS NULL ORDER BY started_at DESC LIMIT 1;
  IF _open IS NULL THEN
    RETURN jsonb_build_object('open', false, 'credits', 0, 'calls', 0);
  END IF;
  SELECT COALESCE(SUM(estimated_credits),0), COUNT(*)
    INTO _credits, _calls
    FROM ai_savings_log
    WHERE created_at >= _open.started_at;
  RETURN jsonb_build_object('open', true, 'period_id', _open.id, 'started_at', _open.started_at,
                             'credits', _credits, 'calls', _calls);
END $$;

-- ============================================================
-- 2) RANKING AGRUPADO + HISTÓRICO POR ITEM
-- ============================================================
CREATE TABLE IF NOT EXISTS public.provider_ranking_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id integer NOT NULL,
  group_index integer NOT NULL,
  sales_count integer NOT NULL,
  avg_stars numeric(4,2) NOT NULL,
  rating_ids uuid[] NOT NULL DEFAULT '{}',
  first_at timestamptz NOT NULL,
  last_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prg_provider ON public.provider_ranking_groups(provider_id, group_index);

ALTER TABLE public.provider_ranking_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read ranking_groups" ON public.provider_ranking_groups;
CREATE POLICY "Public read ranking_groups" ON public.provider_ranking_groups
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Admins manage ranking_groups" ON public.provider_ranking_groups;
CREATE POLICY "Admins manage ranking_groups" ON public.provider_ranking_groups
  FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));

-- Colunas de ranking no providers
ALTER TABLE public.providers
  ADD COLUMN IF NOT EXISTS ranking_score numeric(4,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS groups_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_sales_rated integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_top_provider boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS top_provider_since timestamptz;

-- Avaliação por item (PIN exibe lista, cliente avalia o item entregue)
ALTER TABLE public.provider_ratings
  ADD COLUMN IF NOT EXISTS item_kind text,
  ADD COLUMN IF NOT EXISTS item_id integer,
  ADD COLUMN IF NOT EXISTS item_name text,
  ADD COLUMN IF NOT EXISTS order_ref uuid;

CREATE INDEX IF NOT EXISTS idx_provider_ratings_provider_created
  ON public.provider_ratings(provider_id, created_at);

-- Recalcula agrupamento e ranking de UM prestador
CREATE OR REPLACE FUNCTION public.recalc_provider_ranking(_provider_id integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _sales_per_group integer := 5;
  _min_groups integer := 3;
  _campaign RECORD;
  _r RECORD;
  _ids uuid[] := ARRAY[]::uuid[];
  _stars numeric := 0;
  _count integer := 0;
  _group_idx integer := 0;
  _first timestamptz;
  _last timestamptz;
  _new_score numeric := 0;
  _groups_total integer := 0;
  _total_rated integer := 0;
BEGIN
  SELECT sales_per_group, min_groups_for_ranking
    INTO _campaign
    FROM referral_campaigns
    WHERE is_active = true
    ORDER BY created_at DESC LIMIT 1;
  IF FOUND THEN
    _sales_per_group := COALESCE(_campaign.sales_per_group, 5);
    _min_groups := COALESCE(_campaign.min_groups_for_ranking, 3);
  END IF;

  -- Limpa grupos antigos
  DELETE FROM provider_ranking_groups WHERE provider_id = _provider_id;

  -- Recompõe grupos em ordem cronológica
  FOR _r IN SELECT id, stars, created_at FROM provider_ratings
            WHERE provider_id = _provider_id ORDER BY created_at ASC
  LOOP
    _ids := _ids || _r.id;
    _stars := _stars + _r.stars;
    _count := _count + 1;
    _total_rated := _total_rated + 1;
    IF _first IS NULL THEN _first := _r.created_at; END IF;
    _last := _r.created_at;

    IF _count = _sales_per_group THEN
      _group_idx := _group_idx + 1;
      INSERT INTO provider_ranking_groups
        (provider_id, group_index, sales_count, avg_stars, rating_ids, first_at, last_at)
      VALUES
        (_provider_id, _group_idx, _count, ROUND(_stars/_count, 2), _ids, _first, _last);
      _ids := ARRAY[]::uuid[]; _stars := 0; _count := 0; _first := NULL;
    END IF;
  END LOOP;

  -- Score = média das médias dos grupos completos
  SELECT COUNT(*), COALESCE(ROUND(AVG(avg_stars),2), 0)
    INTO _groups_total, _new_score
    FROM provider_ranking_groups WHERE provider_id = _provider_id;

  UPDATE providers
    SET ranking_score = _new_score,
        groups_count = _groups_total,
        total_sales_rated = _total_rated,
        rating = COALESCE((SELECT ROUND(AVG(stars)::numeric,2) FROM provider_ratings WHERE provider_id = _provider_id), rating)
    WHERE id = _provider_id;

  -- Retorna info p/ debug
  RETURN jsonb_build_object('provider_id', _provider_id, 'score', _new_score, 'groups', _groups_total, 'rated', _total_rated);
END $$;

-- Refresh global do selo "Melhor Prestador" (top X de quem tem >= min_groups)
CREATE OR REPLACE FUNCTION public.refresh_top_providers()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _top_count integer := 10;
  _min_groups integer := 3;
  _rows integer := 0;
BEGIN
  SELECT COALESCE(top_ranked_count, 10), COALESCE(min_groups_for_ranking, 3)
    INTO _top_count, _min_groups
    FROM referral_campaigns WHERE is_active = true ORDER BY created_at DESC LIMIT 1;

  UPDATE providers SET is_top_provider = false, top_provider_since = NULL
    WHERE is_top_provider = true;

  WITH eligible AS (
    SELECT id FROM providers
    WHERE groups_count >= _min_groups AND active = true
    ORDER BY ranking_score DESC, total_sales_rated DESC
    LIMIT _top_count
  )
  UPDATE providers p SET is_top_provider = true, top_provider_since = now()
    FROM eligible e WHERE p.id = e.id;

  GET DIAGNOSTICS _rows = ROW_COUNT;
  RETURN _rows;
END $$;

-- Substitui o trigger antigo: ao inserir avaliação, recalcula grupos + selo
CREATE OR REPLACE FUNCTION public.refresh_provider_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  pid integer := COALESCE(NEW.provider_id, OLD.provider_id);
BEGIN
  PERFORM recalc_provider_ranking(pid);
  PERFORM refresh_top_providers();
  RETURN NEW;
END $$;

-- ============================================================
-- 3) CONFIG DE RANKING NA ABA CAMPANHAS
-- ============================================================
ALTER TABLE public.referral_campaigns
  ADD COLUMN IF NOT EXISTS sales_per_group integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS min_groups_for_ranking integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS top_ranked_count integer NOT NULL DEFAULT 10;

-- ============================================================
-- 4) PAYWALL VISITANTE
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_paid boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS subscription_paid_at timestamptz;

-- ============================================================
-- 5) VIEW DE FUNIL DE LEADS (Painel Master)
-- ============================================================
CREATE OR REPLACE VIEW public.v_lead_funnel AS
SELECT
  r.id AS referral_id,
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
  p.user_id IS NOT NULL AS profile_created,
  s.id IS NOT NULL AS has_subscription,
  s.status AS subscription_status,
  COALESCE(p.subscription_paid, false) AS subscription_paid,
  (SELECT MIN(created_at) FROM wallet_transactions wt WHERE wt.user_id = r.referred_id AND wt.type = 'purchase') AS first_purchase_at,
  (SELECT MIN(created_at) FROM wallet_transactions wt WHERE wt.user_id = r.referred_id AND wt.type = 'sale_credit') AS first_sale_at
FROM referrals r
LEFT JOIN profiles p ON p.user_id = r.referred_id
LEFT JOIN profiles rp ON rp.user_id = r.referrer_id
LEFT JOIN LATERAL (
  SELECT id, status FROM subscriptions WHERE user_id = r.referred_id ORDER BY created_at DESC LIMIT 1
) s ON true;

-- ============================================================
-- 6) Recalcula tudo uma vez (popula novos campos a partir do histórico)
-- ============================================================
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT DISTINCT provider_id FROM provider_ratings WHERE provider_id IS NOT NULL LOOP
    PERFORM recalc_provider_ranking(r.provider_id);
  END LOOP;
  PERFORM refresh_top_providers();
END $$;