-- Garantir que as tabelas principais tenham as permissões necessárias para os papéis do Supabase
-- Isso resolve o problema onde o frontend não consegue ler os papéis do usuário logado

GRANT SELECT ON public.user_roles TO authenticated, anon;
GRANT SELECT ON public.profiles TO authenticated, anon;
GRANT SELECT ON public.user_roles TO service_role;
GRANT SELECT ON public.profiles TO service_role;

-- Garantir que outras tabelas vitais para a navegação também tenham permissões
GRANT SELECT ON public.providers TO authenticated, anon;
GRANT SELECT ON public.dynamic_products TO authenticated, anon;
GRANT SELECT ON public.dynamic_services TO authenticated, anon;
GRANT SELECT ON public.segments TO authenticated, anon;
GRANT SELECT ON public.subscriptions TO authenticated, anon;
GRANT SELECT ON public.wallets TO authenticated, anon;
GRANT SELECT ON public.referrals TO authenticated, anon;

-- Notificar que as permissões foram atualizadas
COMMENT ON TABLE public.user_roles IS 'Permissions granted to authenticated/anon roles for frontend visibility';
