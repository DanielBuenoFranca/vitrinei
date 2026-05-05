
ALTER TABLE public.segments ADD COLUMN IF NOT EXISTS image_url text;

INSERT INTO storage.buckets (id, name, public)
VALUES ('segment-images', 'segment-images', true)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='Public read segment-images' AND tablename='objects' AND schemaname='storage') THEN
    CREATE POLICY "Public read segment-images" ON storage.objects FOR SELECT USING (bucket_id = 'segment-images');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='Public write segment-images' AND tablename='objects' AND schemaname='storage') THEN
    CREATE POLICY "Public write segment-images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'segment-images');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='Public update segment-images' AND tablename='objects' AND schemaname='storage') THEN
    CREATE POLICY "Public update segment-images" ON storage.objects FOR UPDATE USING (bucket_id = 'segment-images');
  END IF;
END $$;
