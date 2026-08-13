-- Reset all payment method discounts to 0
UPDATE public.payment_methods SET discount_pct = 0;

-- Disable all coupons
UPDATE public.coupons SET active = false;

-- Disable flash sales on all products
UPDATE public.products SET flash_sale = false, sale_price = NULL;
