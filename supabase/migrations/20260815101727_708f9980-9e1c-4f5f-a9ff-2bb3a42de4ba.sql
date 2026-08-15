DROP POLICY IF EXISTS "public reads settings" ON public.site_settings;
REVOKE ALL ON public.site_settings FROM anon;
CREATE POLICY "admins read settings" ON public.site_settings FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;