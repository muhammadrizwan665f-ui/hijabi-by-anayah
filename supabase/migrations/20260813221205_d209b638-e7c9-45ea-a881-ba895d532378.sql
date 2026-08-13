ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS urgent BOOLEAN DEFAULT false;
COMMENT ON COLUMN public.orders.urgent IS 'Whether the order was marked as urgent delivery';