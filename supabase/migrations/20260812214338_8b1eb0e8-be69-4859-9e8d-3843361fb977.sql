UPDATE public.site_settings
SET data = jsonb_set(
  data,
  '{heroSlides}',
  '[
    {"image":"/products/banner-hijabs.jpg","link":"/shop"},
    {"image":"/products/banner-abayas.jpg","link":"/shop"},
    {"image":"/products/banner-accessories.jpg","link":"/shop"}
  ]'::jsonb,
  true
);