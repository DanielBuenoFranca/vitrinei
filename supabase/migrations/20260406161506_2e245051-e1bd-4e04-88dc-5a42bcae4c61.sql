
-- provider-logos bucket
DROP POLICY IF EXISTS "Anyone can upload provider logos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update provider logos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete provider logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload provider logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update provider logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete provider logos" ON storage.objects;

CREATE POLICY "Authenticated upload provider logos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'provider-logos');

CREATE POLICY "Authenticated update provider logos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'provider-logos');

CREATE POLICY "Authenticated delete provider logos"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'provider-logos');

-- storefront-assets bucket - drop old permissive + existing ones, recreate
DROP POLICY IF EXISTS "Anyone can upload storefront assets" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update storefront assets" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete storefront assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload storefront assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update storefront assets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete storefront assets" ON storage.objects;

CREATE POLICY "Authenticated upload storefront assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'storefront-assets');

CREATE POLICY "Authenticated update storefront assets"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'storefront-assets');

CREATE POLICY "Authenticated delete storefront assets"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'storefront-assets');
