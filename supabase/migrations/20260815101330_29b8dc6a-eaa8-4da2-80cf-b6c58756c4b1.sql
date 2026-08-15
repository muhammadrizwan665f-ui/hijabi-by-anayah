REVOKE EXECUTE ON FUNCTION public.adjust_color_stock(uuid, text, int) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.reserve_stock(jsonb) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.release_stock(jsonb) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.restore_order_stock(text) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.adjust_color_stock(uuid, text, int) TO service_role;
GRANT EXECUTE ON FUNCTION public.reserve_stock(jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_stock(jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.restore_order_stock(text) TO service_role;