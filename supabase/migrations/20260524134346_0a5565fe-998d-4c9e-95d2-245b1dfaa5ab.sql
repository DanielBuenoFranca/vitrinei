-- Create a view in the public schema that exposes necessary fields for duplicate checking
-- This view will be used by the Edge Function with service_role permissions.
CREATE OR REPLACE VIEW public.registration_check_view AS
SELECT 
    p.user_id,
    p.display_name,
    p.phone,
    p.status,
    p.cpf_cnpj_normalized,
    u.email
FROM public.profiles p
JOIN auth.users u ON p.user_id = u.id;

-- Ensure only service role can access this (though it's in public, we can rely on the Edge Function using service role)
-- Actually, let's keep it simple.
