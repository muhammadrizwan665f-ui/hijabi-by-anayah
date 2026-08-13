UPDATE public.products 
SET price = sale_price 
WHERE sale_price IS NOT NULL AND sale_price > 0;

UPDATE public.products 
SET sale_price = NULL, flash_sale = false;