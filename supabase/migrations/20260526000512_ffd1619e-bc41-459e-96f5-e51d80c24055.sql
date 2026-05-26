-- Ensure the roles exist for both IDs associated with the Master user
DO $$
DECLARE
    user_id_1 UUID := 'dfa6a32c-f166-4407-8f2e-7baa511a1117';
    user_id_2 UUID := 'b7c673c7-1152-4057-ad4f-22970f081436';
BEGIN
    -- For first ID
    IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = user_id_1) THEN
        INSERT INTO public.user_roles (user_id, role) 
        VALUES (user_id_1, 'master')
        ON CONFLICT (user_id, role) DO NOTHING;
        
        INSERT INTO public.user_roles (user_id, role) 
        VALUES (user_id_1, 'mixed')
        ON CONFLICT (user_id, role) DO NOTHING;

        UPDATE public.profiles SET status = 'active', is_activated = true WHERE user_id = user_id_1;
    END IF;

    -- For second ID (likely the Google Login one)
    IF EXISTS (SELECT 1 FROM public.profiles WHERE user_id = user_id_2) THEN
        INSERT INTO public.user_roles (user_id, role) 
        VALUES (user_id_2, 'master')
        ON CONFLICT (user_id, role) DO NOTHING;
        
        INSERT INTO public.user_roles (user_id, role) 
        VALUES (user_id_2, 'mixed')
        ON CONFLICT (user_id, role) DO NOTHING;

        UPDATE public.profiles SET status = 'active', is_activated = true WHERE user_id = user_id_2;
    END IF;
END $$;

-- Optional: Cleanup profiles that are clearly duplicates and marked as 'lead' but have the same name/context
-- We'll keep them for now but ensure they both have permissions to avoid lockout.
