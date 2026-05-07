
-- Tratativa: CPF/CNPJ = 'ISENTO' não deve gerar conflito de unicidade
-- 1) Profiles: recriar índices excluindo o valor literal 'ISENTO'
DROP INDEX IF EXISTS public.idx_profiles_cpf_cnpj;
CREATE UNIQUE INDEX idx_profiles_cpf_cnpj
  ON public.profiles (cpf_cnpj)
  WHERE cpf_cnpj IS NOT NULL
    AND cpf_cnpj <> ''
    AND upper(cpf_cnpj) <> 'ISENTO';

-- O cpf_cnpj_normalized para ISENTO ficará vazio/null, então os índices existentes
-- (que filtram por <> '') já não conflitam. Garantimos isso recriando os dois para deixar explícito.
DROP INDEX IF EXISTS public.profiles_cpf_cnpj_unique_idx;
DROP INDEX IF EXISTS public.idx_profiles_cpf_cnpj_norm;
CREATE UNIQUE INDEX idx_profiles_cpf_cnpj_norm
  ON public.profiles (cpf_cnpj_normalized)
  WHERE cpf_cnpj_normalized IS NOT NULL AND cpf_cnpj_normalized <> '';

-- 2) Providers: substituir uniques por parciais que ignoram 'ISENTO'
ALTER TABLE public.providers DROP CONSTRAINT IF EXISTS providers_cpf_cnpj_key;
DROP INDEX IF EXISTS public.providers_cpf_cnpj_key;
DROP INDEX IF EXISTS public.idx_providers_cpf_cnpj_unique;
CREATE UNIQUE INDEX idx_providers_cpf_cnpj_unique
  ON public.providers (cpf_cnpj)
  WHERE cpf_cnpj IS NOT NULL
    AND cpf_cnpj <> ''
    AND upper(cpf_cnpj) <> 'ISENTO';

-- 3) Função de checagem de unicidade considera ISENTO como sempre disponível
CREATE OR REPLACE FUNCTION public.check_cpf_cnpj_available(_doc text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _normalized text;
  _profile_owner uuid;
  _provider_count int;
BEGIN
  -- ISENTO sempre disponível (não conflita com ninguém)
  IF upper(coalesce(_doc, '')) = 'ISENTO' THEN
    RETURN jsonb_build_object('available', true, 'isento', true);
  END IF;

  _normalized := regexp_replace(coalesce(_doc, ''), '[^0-9]', '', 'g');
  IF _normalized = '' OR length(_normalized) NOT IN (11, 14) THEN
    RETURN jsonb_build_object('available', false, 'reason', 'invalid_format');
  END IF;

  SELECT user_id INTO _profile_owner
  FROM public.profiles
  WHERE cpf_cnpj_normalized = _normalized
  LIMIT 1;

  IF _profile_owner IS NOT NULL THEN
    RETURN jsonb_build_object('available', false, 'reason', 'already_registered');
  END IF;

  SELECT count(*) INTO _provider_count
  FROM public.providers
  WHERE regexp_replace(coalesce(cpf_cnpj, ''), '[^0-9]', '', 'g') = _normalized
    AND user_id IS NULL;

  RETURN jsonb_build_object(
    'available', true,
    'has_existing_provider', _provider_count > 0,
    'provider_count', _provider_count
  );
END;
$function$;
