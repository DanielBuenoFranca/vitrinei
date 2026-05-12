CREATE OR REPLACE FUNCTION public.get_referrer_info_by_code(_code text)
 RETURNS TABLE(referrer_name text, referral_code text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.display_name,
    r.referral_code
  FROM referrals r
  JOIN profiles p ON p.user_id = r.referrer_id
  WHERE r.referral_code = _code
  LIMIT 1;
END;
$$;

-- Grant access to anon and authenticated users
GRANT EXECUTE ON FUNCTION public.get_referrer_info_by_code(text) TO anon, authenticated;