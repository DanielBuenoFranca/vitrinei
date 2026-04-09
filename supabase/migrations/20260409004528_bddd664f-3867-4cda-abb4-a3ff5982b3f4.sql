
-- SEGMENTS: add authenticated policies
CREATE POLICY "Authenticated can read segments"
  ON public.segments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage segments"
  ON public.segments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- PROVIDERS: add authenticated policies
CREATE POLICY "Authenticated can read providers"
  ON public.providers FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage providers"
  ON public.providers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- DYNAMIC_SERVICES: add authenticated policies
CREATE POLICY "Authenticated can read dynamic_services"
  ON public.dynamic_services FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage dynamic_services"
  ON public.dynamic_services FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- DYNAMIC_PRODUCTS: add authenticated policies
CREATE POLICY "Authenticated can read dynamic_products"
  ON public.dynamic_products FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage dynamic_products"
  ON public.dynamic_products FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- UNITS: add authenticated policies
CREATE POLICY "Authenticated can read units"
  ON public.units FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage units"
  ON public.units FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
