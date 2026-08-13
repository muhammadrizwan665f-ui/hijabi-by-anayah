UPDATE public.site_settings 
SET whatsapp = '+92 335 1038550' 
WHERE id = (SELECT id FROM public.site_settings LIMIT 1);
