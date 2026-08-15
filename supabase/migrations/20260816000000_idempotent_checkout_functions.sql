-- Idempotent (safe to run multiple times) version.

-- 1) Orders
GRANT INSERT ON public.orders TO anon;
DROP POLICY IF EXISTS "anon can create orders" ON public.orders;
CREATE POLICY "anon can create orders" ON public.orders
  FOR INSERT TO anon
  WITH CHECK (status IN ('Pending', 'Payment Verification Pending'));

-- 2) Notifications
GRANT INSERT ON public.notifications TO anon;
DROP POLICY IF EXISTS "anon can create order notifications" ON public.notifications;
CREATE POLICY "anon can create order notifications" ON public.notifications
  FOR INSERT TO anon
  WITH CHECK (type = 'admin_new_order');

-- 3) Visits
GRANT INSERT ON public.visits TO anon;
DROP POLICY IF EXISTS "anon can log visits" ON public.visits;
CREATE POLICY "anon can log visits" ON public.visits
  FOR INSERT TO anon
  WITH CHECK (true);

-- 4) Storage: payment proof uploads
DROP POLICY IF EXISTS "Anon Upload Payment Proofs" ON storage.objects;
CREATE POLICY "Anon Upload Payment Proofs"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'payment-proofs');

-- 5) Stock reservation RPCs
GRANT EXECUTE ON FUNCTION public.reserve_stock(jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.release_stock(jsonb) TO anon;

-- 6) Payment account details lookup
CREATE OR REPLACE FUNCTION public.get_payment_account(_code text)
RETURNS TABLE (code text, account_title text, account_number text, iban text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT code, account_title, account_number, iban
  FROM public.payment_methods
  WHERE code = _code AND enabled = true
  LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_payment_account(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_payment_account(text) TO anon, authenticated;

-- 7) Order tracking by order number
CREATE OR REPLACE FUNCTION public.get_order_by_number(_order_no text)
RETURNS SETOF public.orders
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.orders WHERE order_no = upper(_order_no) LIMIT 1;
$$;
REVOKE ALL ON FUNCTION public.get_order_by_number(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_order_by_number(text) TO anon, authenticated;

-- 8) Product reviews
CREATE OR REPLACE FUNCTION public.submit_product_review(_product_id uuid, _review jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_review jsonb;
BEGIN
  new_review := _review || jsonb_build_object(
    'id', gen_random_uuid(),
    'date', now(),
    'verified', false,
    'helpful', 0
  );
  UPDATE public.products
  SET reviews = jsonb_build_array(new_review) || COALESCE(reviews, '[]'::jsonb)
  WHERE id = _product_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found';
  END IF;
  RETURN new_review;
END;
$$;
REVOKE ALL ON FUNCTION public.submit_product_review(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_product_review(uuid, jsonb) TO anon, authenticated;
