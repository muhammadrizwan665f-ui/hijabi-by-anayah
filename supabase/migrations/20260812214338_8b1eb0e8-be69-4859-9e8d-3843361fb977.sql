UPDATE public.site_settings
SET data = jsonb_set(
  data,
  '{heroSlides}',
  '[
    {"image":"/__l5e/assets-v1/b2a10de9-008d-49a7-80e4-df6c5e8b4271/banner-8.jpg","link":"/shop"},
    {"image":"/__l5e/assets-v1/871b4302-09e7-4a4d-bc31-0fdfa2813631/banner-9.jpg","link":"/shop"},
    {"image":"/__l5e/assets-v1/49d19dc6-0d10-4a12-9cf3-57c8f8401b2b/banner-7.jpg","link":"/shop"}
  ]'::jsonb,
  true
);