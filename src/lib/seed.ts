import type { BlogPost, Settings } from "./types";

export const CATEGORIES = [
  { id: "abayah", name: "Abayah", blurb: "Elegant and modest abayahs" },
  { id: "namaz-chadar", name: "Namaz Chadar", blurb: "Soft, breathable prayer chadars" },
  { id: "inner-caps", name: "Hijab Inner/caps", blurb: "Essential base layers for a clean drape" },
  { id: "accessories", name: "Accessories", blurb: "Magnet pins, brooches & more" },
  { id: "basic-hijabs", name: "Basic/ Plain Hijabs", blurb: "Everyday essentials in every shade" },
  { id: "printed", name: "Printed", blurb: "Beautiful patterns and floral designs" },
  { id: "fancy-stoles", name: "Fancy Stoles", blurb: "Party and formal wear stoles" },
  { id: "silk-stoles", name: "Silk Stoles", blurb: "Luxurious silk and satin drapes" },
  { id: "maqnay", name: "Maqnay/ Modest Wear", blurb: "Traditional and modern modest wear" },
  { id: "chadaren", name: "Chadaren", blurb: "Traditional wraps and shawls" },
];

export const SEED_SETTINGS: Settings = {
  theme: "theme-sand",
  brandName: "Hijabi By Anayah",
  tagline: "Quietly luxurious modest wear, delivered across Pakistan",
  whatsapp: "+923351038550",
  email: "hello@hijabibyanayah.pk",
  supportPhone: "0343 5295541",
  address: "Lahore, Punjab, Pakistan",
  freeShippingOver: 5000,
  shippingFlat: 249,
  provinceRates: {
    Punjab: 199,
    Sindh: 249,
    "Khyber Pakhtunkhwa": 279,
    Balochistan: 349,
    "Islamabad Capital Territory": 199,
    "Gilgit-Baltistan": 399,
    "Azad Kashmir": 349,
  },
  saleBannerText: "NEW SEASON EDIT — up to 40% off + free delivery over Rs 5,000",
  saleEndsAt: new Date(Date.now() + 6 * 3600000).toISOString(),
  independenceBanner: true,
  liveSalesPopup: true,
  socials: {
    facebook: "https://facebook.com/hijabibyanayah",
    instagram: "https://instagram.com/hijabibyanayah",
    tiktok: "https://tiktok.com/@hijabibyanayah",
    youtube: "https://youtube.com/@hijabibyanayah",
  },
  seo: {
    title: "Hijabi By Anayah — Premium Hijabs, Namaz Chadars & Accessories",
    description:
      "Shop premium hijabs, namaz chadars, undercaps and hijab accessories in Pakistan. Cash on delivery and free shipping over Rs 5,000.",
    keywords: "hijab, namaz chadar, undercap, modest wear, pakistan, hijabi by anayah",
  },
  analytics: { ga4: "", metaPixel: "", gtm: "", tiktokPixel: "" },
  maintenanceMode: false,
  orderNotificationEmail: "hello@hijabibyanayah.pk",
  currency: "PKR",
  lowStockThreshold: 5,
  allowGuestCheckout: true,
  showInventoryCount: true,
  termsAndConditions: "Standard terms apply.",
  privacyPolicy: "We protect your data.",
  heroSlides: [
    {
      image: "/products/banner-hijabs.jpg",
      mobileImage: "/products/banner-hijabs.jpg",
      link: "/shop",
    },
    {
      image: "/products/banner-abayas.jpg",
      mobileImage: "/products/banner-abayas.jpg",
      link: "/shop",
    },
    {
      image: "/products/banner-accessories.jpg",
      mobileImage: "/products/banner-accessories.jpg",
      link: "/shop",
    },
  ],
  categories: CATEGORIES,
};

export const SEED_BLOG: BlogPost[] = [
  {
    id: "b1",
    slug: "how-to-style-a-crinkle-silk-hijab",
    title: "How to Style a Crinkle Silk Hijab (5 Everyday Looks)",
    excerpt:
      "Five simple, no-slip ways to drape crinkle silk — from the classic wrap to a soft turban finish.",
    body: "Crinkle silk holds its shape without pins, which makes it the easiest fabric for beginners. Start with a fitted undercap, centre the hijab slightly off-balance, and let the longer side carry the drape. For a fuller look, pleat once at the shoulder and secure with a magnet pin.",
    category: "Styling",
    author: "Anayah Studio",
    date: "2026-07-22",
  },
  {
    id: "b2",
    slug: "choosing-the-right-namaz-chadar",
    title: "Choosing the Right Namaz Chadar: Fabric, Length & Care",
    excerpt: "What to look for in a prayer chadar so it stays soft, opaque and easy to wash.",
    body: "A good namaz chadar is lightweight, fully opaque and long enough to cover comfortably while sitting. Cotton-viscose blends breathe best in summer, while brushed poly-cotton keeps warmth in winter. Wash cold, dry flat, and never wring the fabric.",
    category: "Guides",
    author: "Anayah Studio",
    date: "2026-07-10",
  },
  {
    id: "b3",
    slug: "hijab-fabric-care-guide",
    title: "A Simple Fabric Care Guide for Georgette & Jersey Hijabs",
    excerpt: "Keep colour, drape and texture intact with a five-minute routine.",
    body: "Georgette prefers a cold hand wash and shade drying; jersey can be machine washed on a gentle cycle inside a mesh bag. Store folded rather than hung so the fibres do not stretch, and steam instead of ironing directly on printed panels.",
    category: "Care",
    author: "Anayah Studio",
    date: "2026-06-28",
  },
];

export const LIVE_SALES_FEED = [
  "Ayesha from Lahore purchased Crinkle Silk Hijab",
  "Maryam from Karachi purchased Soft Cotton Namaz Chadar",
  "Fatima from Islamabad purchased Georgette Luxe Hijab",
  "Hira from Faisalabad purchased Undercap 3-Pack",
  "Zainab from Multan purchased Magnet Pin Set",
  "Sana from Peshawar purchased Printed Monogram Stole",
];
