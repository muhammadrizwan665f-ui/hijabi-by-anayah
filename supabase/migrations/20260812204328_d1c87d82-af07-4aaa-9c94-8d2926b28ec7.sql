-- Stop anonymous visitors from reading bank/wallet account identifiers directly.
REVOKE SELECT ON public.payment_methods FROM anon;
GRANT SELECT (id, code, label, note, discount_pct, enabled, requires_proof, qr_url, instructions, sort_order, created_at)
  ON public.payment_methods TO anon;

-- Site settings are served through the app's server layer only.
REVOKE SELECT ON public.site_settings FROM anon;
DROP POLICY IF EXISTS "public reads settings" ON public.site_settings;
CREATE POLICY "authenticated reads settings" ON public.site_settings
  FOR SELECT TO authenticated USING (true);