
-- Profiles: tighten read policy
DROP POLICY IF EXISTS "Profiles viewable by authenticated" ON public.profiles;

CREATE POLICY "Users view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Public RPC to get only display_name (used by referral landing)
CREATE OR REPLACE FUNCTION public.get_public_display_name(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT display_name FROM public.profiles WHERE user_id = _user_id LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_display_name(uuid) TO anon, authenticated;

-- Segments: drop anon write policies (admin-only writes remain)
DROP POLICY IF EXISTS "Allow public insert segments" ON public.segments;
DROP POLICY IF EXISTS "Allow public update segments" ON public.segments;
DROP POLICY IF EXISTS "Allow public delete segments" ON public.segments;

-- Units: drop anon write policies
DROP POLICY IF EXISTS "Allow public insert units" ON public.units;
DROP POLICY IF EXISTS "Allow public update units" ON public.units;
DROP POLICY IF EXISTS "Allow public delete units" ON public.units;
