
-- Add multi-role flags and banking/geo fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_provider boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_customer boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS bank_agency text,
  ADD COLUMN IF NOT EXISTS bank_account text,
  ADD COLUMN IF NOT EXISTS pix_key text,
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric;

-- Unique partial indexes on providers (only non-empty values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_providers_cpf_cnpj_unique 
  ON public.providers (cpf_cnpj) 
  WHERE cpf_cnpj IS NOT NULL AND cpf_cnpj != '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_providers_email_unique 
  ON public.providers (email) 
  WHERE email IS NOT NULL AND email != '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_providers_phone_unique 
  ON public.providers (phone) 
  WHERE phone IS NOT NULL AND phone != '';

-- Function to check provider uniqueness across CPF, email, phone
CREATE OR REPLACE FUNCTION public.check_provider_uniqueness(
  _cpf_cnpj text DEFAULT NULL,
  _email text DEFAULT NULL,
  _phone text DEFAULT NULL,
  _exclude_id integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _conflicts jsonb := '[]'::jsonb;
  _row RECORD;
BEGIN
  -- Check CPF/CNPJ
  IF _cpf_cnpj IS NOT NULL AND _cpf_cnpj != '' THEN
    FOR _row IN SELECT id, name, cpf_cnpj, email, phone FROM providers 
      WHERE cpf_cnpj = _cpf_cnpj AND (_exclude_id IS NULL OR id != _exclude_id)
    LOOP
      _conflicts := _conflicts || jsonb_build_object(
        'field', 'cpf_cnpj', 'provider_id', _row.id, 'provider_name', _row.name,
        'cpf_cnpj', _row.cpf_cnpj, 'email', _row.email, 'phone', _row.phone
      );
    END LOOP;
  END IF;

  -- Check Email
  IF _email IS NOT NULL AND _email != '' THEN
    FOR _row IN SELECT id, name, cpf_cnpj, email, phone FROM providers 
      WHERE email = _email AND (_exclude_id IS NULL OR id != _exclude_id)
    LOOP
      _conflicts := _conflicts || jsonb_build_object(
        'field', 'email', 'provider_id', _row.id, 'provider_name', _row.name,
        'cpf_cnpj', _row.cpf_cnpj, 'email', _row.email, 'phone', _row.phone
      );
    END LOOP;
  END IF;

  -- Check Phone
  IF _phone IS NOT NULL AND _phone != '' THEN
    FOR _row IN SELECT id, name, cpf_cnpj, email, phone FROM providers 
      WHERE phone = _phone AND (_exclude_id IS NULL OR id != _exclude_id)
    LOOP
      _conflicts := _conflicts || jsonb_build_object(
        'field', 'phone', 'provider_id', _row.id, 'provider_name', _row.name,
        'cpf_cnpj', _row.cpf_cnpj, 'email', _row.email, 'phone', _row.phone
      );
    END LOOP;
  END IF;

  RETURN _conflicts;
END;
$$;
