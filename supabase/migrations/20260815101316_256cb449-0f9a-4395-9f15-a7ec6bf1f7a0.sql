CREATE OR REPLACE FUNCTION public.adjust_color_stock(_product_id uuid, _color_name text, _qty int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  cols jsonb;
  idx int;
  el jsonb;
  cur int;
BEGIN
  IF _color_name IS NULL OR _color_name = '' OR _qty = 0 THEN RETURN; END IF;
  SELECT colors INTO cols FROM public.products WHERE id = _product_id;
  IF cols IS NULL THEN RETURN; END IF;
  idx := NULL;
  FOR i IN 0..(jsonb_array_length(cols) - 1) LOOP
    IF lower(coalesce(cols->i->>'name','')) = lower(_color_name) THEN idx := i; EXIT; END IF;
  END LOOP;
  IF idx IS NULL THEN RETURN; END IF;
  el := cols->idx;
  IF el->>'stock' IS NULL THEN RETURN; END IF;
  cur := (el->>'stock')::int;
  el := jsonb_set(el, '{stock}', to_jsonb(GREATEST(0, cur + _qty)));
  UPDATE public.products SET colors = jsonb_set(cols, ARRAY[idx::text], el) WHERE id = _product_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.reserve_stock(_lines jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  l record;
  p record;
  cols jsonb;
  cstock int;
  i int;
  found_color boolean;
BEGIN
  FOR l IN
    SELECT (x->>'productId')::uuid AS pid, (x->>'qty')::int AS qty, NULLIF(x->>'colorName','') AS cname
    FROM jsonb_array_elements(_lines) x
    ORDER BY 1
  LOOP
    SELECT id, name, stock, colors INTO p FROM public.products WHERE id = l.pid FOR UPDATE;
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

    IF l.cname IS NOT NULL AND p.colors IS NOT NULL THEN
      cols := p.colors;
      found_color := false;
      cstock := NULL;
      FOR i IN 0..(jsonb_array_length(cols) - 1) LOOP
        IF lower(coalesce(cols->i->>'name','')) = lower(l.cname) THEN
          found_color := true;
          IF cols->i->>'stock' IS NOT NULL THEN cstock := (cols->i->>'stock')::int; END IF;
          EXIT;
        END IF;
      END LOOP;
      IF found_color AND cstock IS NOT NULL THEN
        IF cstock < l.qty THEN
          IF cstock <= 0 THEN
            RAISE EXCEPTION '% (%) is out of stock.', p.name, l.cname;
          ELSE
            RAISE EXCEPTION 'Only % left of % (%).', cstock, p.name, l.cname;
          END IF;
        END IF;
        PERFORM public.adjust_color_stock(l.pid, l.cname, -l.qty);
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
SET search_path TO 'public'
AS $$
DECLARE
  l record;
BEGIN
  FOR l IN
    SELECT (x->>'productId')::uuid AS pid, (x->>'qty')::int AS qty, NULLIF(x->>'colorName','') AS cname
    FROM jsonb_array_elements(_lines) x
  LOOP
    UPDATE public.products
      SET stock = stock + l.qty, sold = GREATEST(0, sold - l.qty)
      WHERE id = l.pid;
    IF l.cname IS NOT NULL THEN
      PERFORM public.adjust_color_stock(l.pid, l.cname, l.qty);
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.restore_order_stock(_order_no text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
    SELECT (x->>'productId')::uuid AS pid, (x->>'qty')::int AS qty, NULLIF(x->>'colorName','') AS cname
    FROM jsonb_array_elements(o.lines) x
  LOOP
    UPDATE public.products
      SET stock = stock + l.qty, sold = GREATEST(0, sold - l.qty)
      WHERE id = l.pid;
    IF l.cname IS NOT NULL THEN
      PERFORM public.adjust_color_stock(l.pid, l.cname, l.qty);
    END IF;
  END LOOP;
  UPDATE public.orders SET stock_restored = true WHERE id = o.id;
  RETURN true;
END;
$$;