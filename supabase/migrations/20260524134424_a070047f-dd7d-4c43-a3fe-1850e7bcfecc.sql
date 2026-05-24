CREATE OR REPLACE FUNCTION public.get_profile_by_normalized_phone(_phone text)
RETURNS TABLE (
    user_id uuid,
    display_name text,
    phone text,
    status text,
    email text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.user_id,
        v.display_name,
        v.phone,
        v.status,
        v.email
    FROM public.registration_check_view v
    WHERE regexp_replace(coalesce(v.phone, ''), '[^0-9]', '', 'g') = _phone
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
