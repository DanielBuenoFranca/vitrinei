
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS provider_type text DEFAULT 'mei',
  ADD COLUMN IF NOT EXISTS provider_segments text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS distance text DEFAULT '2 km',
  ADD COLUMN IF NOT EXISTS rating numeric DEFAULT 4.5,
  ADD COLUMN IF NOT EXISTS provider_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS auth_split_5x boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS storefront_config jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS logo_url text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_cpf_cnpj_norm
  ON public.profiles(cpf_cnpj_normalized)
  WHERE cpf_cnpj_normalized IS NOT NULL AND cpf_cnpj_normalized <> '';

CREATE OR REPLACE FUNCTION public.sync_profile_to_provider()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _is_provider boolean;
  _email text;
  _provider_id integer;
  _norm_doc text;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = NEW.user_id AND role IN ('provider','mixed')
  ) INTO _is_provider;

  IF _is_provider THEN
    NEW.is_provider := true;
  END IF;

  SELECT email INTO _email FROM auth.users WHERE id = NEW.user_id;
  _norm_doc := regexp_replace(COALESCE(NEW.cpf_cnpj, ''), '[^0-9]', '', 'g');

  IF NEW.is_provider OR _is_provider THEN
    SELECT id INTO _provider_id
    FROM public.providers
    WHERE user_id = NEW.user_id
       OR (_norm_doc <> '' AND regexp_replace(coalesce(cpf_cnpj,''), '[^0-9]', '', 'g') = _norm_doc)
    LIMIT 1;

    IF _provider_id IS NULL THEN
      INSERT INTO public.providers (
        user_id, name, type, segment, phone, email, address, city,
        distance, rating, active, cpf_cnpj, logo_url, storefront_config, auth_split_5x
      ) VALUES (
        NEW.user_id,
        COALESCE(NEW.display_name, _email, 'Prestador'),
        COALESCE(NEW.provider_type, 'mei'),
        COALESCE(NEW.provider_segments, ARRAY[]::text[]),
        NEW.phone, _email, NEW.address, NEW.city,
        COALESCE(NEW.distance, '2 km'),
        COALESCE(NEW.rating, 4.5),
        COALESCE(NEW.provider_active, true),
        NULLIF(_norm_doc, ''),
        NEW.logo_url,
        COALESCE(NEW.storefront_config, '{}'::jsonb),
        COALESCE(NEW.auth_split_5x, false)
      );
    ELSE
      UPDATE public.providers SET
        user_id = NEW.user_id,
        name = COALESCE(NEW.display_name, name),
        type = COALESCE(NEW.provider_type, type),
        segment = CASE WHEN array_length(NEW.provider_segments,1) > 0 THEN NEW.provider_segments ELSE segment END,
        phone = COALESCE(NEW.phone, phone),
        email = COALESCE(_email, email),
        address = COALESCE(NEW.address, address),
        city = COALESCE(NEW.city, city),
        distance = COALESCE(NEW.distance, distance),
        rating = COALESCE(NEW.rating, rating),
        active = COALESCE(NEW.provider_active, active),
        cpf_cnpj = COALESCE(NULLIF(_norm_doc,''), cpf_cnpj),
        logo_url = COALESCE(NEW.logo_url, logo_url),
        storefront_config = COALESCE(NEW.storefront_config, storefront_config),
        auth_split_5x = COALESCE(NEW.auth_split_5x, auth_split_5x)
      WHERE id = _provider_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_to_provider ON public.profiles;
CREATE TRIGGER trg_sync_profile_to_provider
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_to_provider();

CREATE OR REPLACE FUNCTION public.sync_role_to_provider()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IN ('provider','mixed') THEN
    UPDATE public.profiles
      SET is_provider = true, updated_at = now()
      WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_role_to_provider ON public.user_roles;
CREATE TRIGGER trg_sync_role_to_provider
AFTER INSERT ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.sync_role_to_provider();

-- Backfill: providers já com user_id → copia para profiles
UPDATE public.profiles p
SET
  provider_type = COALESCE(p.provider_type, pr.type),
  provider_segments = CASE WHEN p.provider_segments IS NULL OR p.provider_segments = '{}' THEN pr.segment ELSE p.provider_segments END,
  distance = COALESCE(p.distance, pr.distance),
  rating = COALESCE(p.rating, pr.rating),
  provider_active = COALESCE(p.provider_active, pr.active),
  auth_split_5x = COALESCE(p.auth_split_5x, pr.auth_split_5x),
  logo_url = COALESCE(p.logo_url, pr.logo_url),
  storefront_config = CASE WHEN p.storefront_config IS NULL OR p.storefront_config = '{}'::jsonb THEN pr.storefront_config ELSE p.storefront_config END,
  city = COALESCE(p.city, pr.city),
  address = COALESCE(p.address, pr.address),
  cpf_cnpj = COALESCE(p.cpf_cnpj, pr.cpf_cnpj),
  is_provider = true
FROM public.providers pr
WHERE pr.user_id = p.user_id;
