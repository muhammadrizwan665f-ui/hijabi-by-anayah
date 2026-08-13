-- Restore public (anon) read access to site_settings so the storefront can load
-- without requiring the service role key.
DROP POLICY IF EXISTS "authenticated reads settings" ON public.site_settings;
CREATE POLICY "public reads settings" ON public.site_settings
  FOR SELECT TO anon, authenticated USING (true);
GRANT SELECT ON public.site_settings TO anon;
