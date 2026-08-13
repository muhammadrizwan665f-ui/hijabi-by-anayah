ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stock_restored boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.reserve_stock(_lines jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  l record;
  p record;
BEGIN
  FOR l IN
    SELECT (x->>'productId')::uuid AS pid, (x->>'qty')::int AS qty
    FROM jsonb_array_elements(_lines) x
    ORDER BY 1
  LOOP
    SELECT id, name, stock INTO p FROM public.products WHERE id = l.pid FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'A product in your cart is no longer available.';
    END IF;
    IF p.stock < l.qty THEN
      IF p.stock <= 0 THEN
        RAISE EXCEPTION '% is out of stock.', p.name;
      ELSE
        RAISE EXCEPTION 'Only % left in stock for %.', p.stock, p.name;
      END IF;
    END IF;
    UPDATE public.products SET stock = stock - l.qty, sold = sold + l.qty WHERE id = l.pid;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_stock(_lines jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  l record;
BEGIN
  FOR l IN
    SELECT (x->>'productId')::uuid AS pid, (x->>'qty')::int AS qty
    FROM jsonb_array_elements(_lines) x
  LOOP
    UPDATE public.products
      SET stock = stock + l.qty, sold = GREATEST(0, sold - l.qty)
      WHERE id = l.pid;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.restore_order_stock(_order_no text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  o record;
  l record;
BEGIN
  SELECT id, lines, stock_restored INTO o
  FROM public.orders WHERE order_no = _order_no FOR UPDATE;
  IF NOT FOUND OR o.stock_restored THEN
    RETURN false;
  END IF;
  FOR l IN
    SELECT (x->>'productId')::uuid AS pid, (x->>'qty')::int AS qty
    FROM jsonb_array_elements(o.lines) x
  LOOP
    UPDATE public.products
      SET stock = stock + l.qty, sold = GREATEST(0, sold - l.qty)
      WHERE id = l.pid;
  END LOOP;
  UPDATE public.orders SET stock_restored = true WHERE id = o.id;
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_stock(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.release_stock(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.restore_order_stock(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reserve_stock(jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_stock(jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.restore_order_stock(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.restore_order_stock(text) TO authenticated;