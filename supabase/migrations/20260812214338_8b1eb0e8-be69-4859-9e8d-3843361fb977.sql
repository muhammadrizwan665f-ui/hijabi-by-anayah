UPDATE public.site_settings
SET data = jsonb_set(
  data,
  '{heroSlides}',
  '[
    {"image":"/products/hero.jpg","link":"/shop"},
    {"image":"/products/luxury-hijab.jpg","link":"/shop"},
    {"image":"/products/hijab-crinkle.jpg","link":"/shop"}
  ]'::jsonb,
  true
);