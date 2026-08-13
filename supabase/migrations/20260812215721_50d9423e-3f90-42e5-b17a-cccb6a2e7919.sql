UPDATE public.site_settings 
SET data = jsonb_set(
  data, 
  '{heroSlides}', 
  '[
    {"image": "/products/hero.jpg", "mobileImage": "/products/hero.jpg", "link": "/shop"},
    {"image": "/products/luxury-hijab.jpg", "mobileImage": "/products/luxury-hijab.jpg", "link": "/shop"},
    {"image": "/products/hijab-crinkle.jpg", "mobileImage": "/products/hijab-crinkle.jpg", "link": "/shop"}
  ]'::jsonb
)
WHERE id = true;