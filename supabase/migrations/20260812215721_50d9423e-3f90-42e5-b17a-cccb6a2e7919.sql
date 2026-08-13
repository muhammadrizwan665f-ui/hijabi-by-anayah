UPDATE public.site_settings 
SET data = jsonb_set(
  data, 
  '{heroSlides}', 
  '[
    {"image": "/__l5e/assets-v1/b2a10de9-008d-49a7-80e4-df6c5e8b4271/banner-8.jpg", "mobileImage": "/__l5e/assets-v1/e96e86bf-4ab2-4928-b22c-b9e76336fa1d/mobile-banner-1.jpg", "link": "/shop"},
    {"image": "/__l5e/assets-v1/871b4302-09e7-4a4d-bc31-0fdfa2813631/banner-9.jpg", "mobileImage": "/__l5e/assets-v1/bbcae193-ec0e-4b7a-a769-58362a66aa67/mobile-banner-2.jpg", "link": "/shop"},
    {"image": "/__l5e/assets-v1/49d19dc6-0d10-4a12-9cf3-57c8f8401b2b/banner-7.jpg", "mobileImage": "/__l5e/assets-v1/442be045-b378-4dfe-bfda-3767ff60b033/mobile-banner-3.jpg", "link": "/shop"}
  ]'::jsonb
)
WHERE id = true;