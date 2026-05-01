ALTER VIEW public.v_lead_funnel SET (security_invoker = on);
REVOKE ALL ON public.v_lead_funnel FROM anon, public;
GRANT SELECT ON public.v_lead_funnel TO authenticated;