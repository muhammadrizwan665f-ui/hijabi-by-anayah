UPDATE public.site_settings 
SET data = jsonb_set(
  data, 
  '{heroSlides}', 
  '[
    {"image": "/products/banner-general-wide.jpg", "mobileImage": "/products/banner-hijabs.jpg", "link": "/shop"},
    {"image": "/products/banner-abayas-wide.jpg", "mobileImage": "/products/banner-abayas.jpg", "link": "/shop"},
    {"image": "/products/banner-accessories-wide.jpg", "mobileImage": "/products/banner-accessories.jpg", "link": "/shop"}
  ]'::jsonb
)
WHERE id = true;
