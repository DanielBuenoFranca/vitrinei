
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings
CREATE POLICY "Public read site_settings"
  ON public.site_settings FOR SELECT
  USING (true);

-- Only admins/masters can manage
CREATE POLICY "Admins manage site_settings"
  ON public.site_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_site_settings_updated_at
  BEFORE UPDATE ON public.site_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.site_settings;

-- Seed default marquee
INSERT INTO public.site_settings (key, value) VALUES (
  'header_marquee',
  '{"messages": ["Serviços, produtos, profissionais — tudo em um só lugar. Pesquise, compare e contrate com inteligência artificial."]}'::jsonb
);
