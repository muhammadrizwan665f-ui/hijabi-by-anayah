REVOKE EXECUTE ON FUNCTION public.restore_order_stock(text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.reserve_stock(jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.release_stock(jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.restore_order_stock(text) FROM anon;