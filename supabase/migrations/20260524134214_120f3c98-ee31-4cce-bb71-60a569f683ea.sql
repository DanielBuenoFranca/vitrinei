-- We already have profiles and likely user_roles.
-- Let's ensure we have a way to query auth.users email from public if needed, 
-- but an Edge Function is better for this.

-- For now, let's just make sure we have a helper function to normalize strings if not already there.
CREATE OR REPLACE FUNCTION public.normalize_phone(p_phone text)
RETURNS text AS $$
BEGIN
  RETURN regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
END;
$$ LANGUAGE plpgsql IMMUTABLE;
