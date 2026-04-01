
-- Add logo_url column to providers
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS logo_url text;

-- Create storage bucket for provider logos
INSERT INTO storage.buckets (id, name, public) VALUES ('provider-logos', 'provider-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY "Provider logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'provider-logos');

-- Public upload access (demo)
CREATE POLICY "Anyone can upload provider logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'provider-logos');

-- Public update access (demo)
CREATE POLICY "Anyone can update provider logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'provider-logos');

-- Public delete access (demo)
CREATE POLICY "Anyone can delete provider logos"
ON storage.objects FOR DELETE
USING (bucket_id = 'provider-logos');
