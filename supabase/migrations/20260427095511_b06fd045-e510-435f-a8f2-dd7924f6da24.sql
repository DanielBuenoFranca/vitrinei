-- 1) CPF/CNPJ único em profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cpf_cnpj_normalized text
  GENERATED ALWAYS AS (regexp_replace(coalesce(cpf_cnpj, ''), '[^0-9]', '', 'g')) STORED;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_cpf_cnpj_unique_idx
  ON public.profiles (cpf_cnpj_normalized)
  WHERE cpf_cnpj_normalized <> '';

-- 2) Função pública: checar se um CPF/CNPJ já está em uso
CREATE OR REPLACE FUNCTION public.check_cpf_cnpj_available(_doc text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _normalized text;
  _profile_owner uuid;
  _provider_count int;
BEGIN
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

  -- Sinaliza se há um provider catalogado sem dono — pode ser auto-vinculado
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
$$;

GRANT EXECUTE ON FUNCTION public.check_cpf_cnpj_available(text) TO anon, authenticated;

-- 3) Trigger: ao definir/alterar cpf_cnpj no profile, vincular provider órfão
CREATE OR REPLACE FUNCTION public.link_provider_on_profile_doc()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _normalized text;
  _linked_count int;
BEGIN
  _normalized := regexp_replace(coalesce(NEW.cpf_cnpj, ''), '[^0-9]', '', 'g');
  IF _normalized = '' THEN RETURN NEW; END IF;

  -- Vincula providers órfãos com mesmo CPF/CNPJ
  UPDATE public.providers
  SET user_id = NEW.user_id
  WHERE regexp_replace(coalesce(cpf_cnpj, ''), '[^0-9]', '', 'g') = _normalized
    AND user_id IS NULL;

  GET DIAGNOSTICS _linked_count = ROW_COUNT;

  IF _linked_count > 0 THEN
    -- marca profile como provider e atribui role
    UPDATE public.profiles SET is_provider = true WHERE id = NEW.id;
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'provider')
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_link_provider_on_profile_doc ON public.profiles;
CREATE TRIGGER trg_link_provider_on_profile_doc
  AFTER INSERT OR UPDATE OF cpf_cnpj ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.link_provider_on_profile_doc();