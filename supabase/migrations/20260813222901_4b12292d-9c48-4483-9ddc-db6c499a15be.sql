UPDATE public.site_settings 
SET data = data || '{
  "shippingFlat": 350,
  "shippingKarachi": 300,
  "provinceRates": {
    "Punjab": 350,
    "Sindh": 350,
    "Balochistan": 349,
    "Azad Kashmir": 349,
    "Gilgit-Baltistan": 399,
    "Khyber Pakhtunkhwa": 279,
    "Islamabad Capital Territory": 350
  }
}'::jsonb
WHERE id = true;