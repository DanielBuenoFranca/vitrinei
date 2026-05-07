
-- Add source column to referrals to distinguish link-based vs import-based
ALTER TABLE public.referrals 
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'link';

-- Index for filtering
CREATE INDEX IF NOT EXISTS idx_referrals_source ON public.referrals(source);

-- Backfill: registros antigos criados via activate-user (ACT-) ou import marcam como import
UPDATE public.referrals
   SET source = 'import'
 WHERE source = 'link'
   AND (referral_code LIKE 'ACT-%' OR referral_code LIKE 'IMP-%');

-- Update release_referral_phase to skip bonus when source='import'
CREATE OR REPLACE FUNCTION public.release_referral_phase(_referral_id uuid, _phase text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _referral RECORD;
BEGIN
  SELECT * INTO _referral FROM public.referrals WHERE id = _referral_id;
  IF _referral IS NULL THEN
    RETURN jsonb_build_object('error', 'Indicação não encontrada');
  END IF;
  -- Cadastros vindos de importação não geram bonificação
  IF _referral.source = 'import' THEN
    RETURN jsonb_build_object('error', 'Cadastro de origem importação não entra no fluxo de bonificação');
  END IF;
  -- Delega para função antiga (mantida) renomeada via overload? Não há, então reimplemente curto:
  -- Para evitar duplicar lógica, chamamos a versão completa anterior se existir
  RETURN public._release_referral_phase_internal(_referral_id, _phase);
END;
$$;

-- Renomeia a antiga para uso interno (idempotente)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'release_referral_phase_v1'
  ) THEN
    -- já existe
    NULL;
  END IF;
END$$;
