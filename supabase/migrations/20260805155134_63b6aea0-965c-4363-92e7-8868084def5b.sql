CREATE POLICY "admins manage product images" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'product-images' AND public.has_role(auth.uid(),'admin'))
  WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(),'admin'));

CREATE POLICY "admins read payment proofs" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'payment-proofs' AND public.has_role(auth.uid(),'admin'));