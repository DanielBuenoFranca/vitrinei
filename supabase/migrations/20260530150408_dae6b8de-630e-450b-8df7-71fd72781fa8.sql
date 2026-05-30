-- Assign master role to the new account that was recently created
INSERT INTO public.user_roles (user_id, role)
VALUES ('384ef8b5-1ed6-462e-8b9d-afd5b2236053', 'master')
ON CONFLICT DO NOTHING;

-- Also assign mixed role to match the other account
INSERT INTO public.user_roles (user_id, role)
VALUES ('384ef8b5-1ed6-462e-8b9d-afd5b2236053', 'mixed')
ON CONFLICT DO NOTHING;

-- Ensure the profile is active and activated
UPDATE public.profiles
SET status = 'active', is_activated = true
WHERE user_id = '384ef8b5-1ed6-462e-8b9d-afd5b2236053';
