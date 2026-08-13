export type ThemeId =
  | "theme-sand"
  | "theme-blush"
  | "theme-sage"
  | "theme-sky"
  | "theme-lilac"
  | "theme-ivory-gold"
  | "theme-mint"
  | "theme-taupe"
  | "theme-peach"
  | "theme-pearl-grey"
  | "theme-black-white"
  | "theme-blue-white";

/** Payment method codes are admin-editable, so this is a free-form string. */
export type PaymentMethodId = string;

export type OrderStatus =
  | "Pending"
  | "Payment Verification Pending"
  | "Confirmed"
  | "Packed"
  | "Shipped"
  | "Delivered"
  | "Cancelled"
  | "Returned"
  | "Refunded";

export type PaymentStatus = "Not Required" | "Pending Verification" | "Verified" | "Rejected";

export interface BulkRule {
  minQty: number;
  discountPct: number;
}

export interface Review {
  id: string;
  name: string;
  city: string;
  rating: number;
  title: string;
  body: string;
  verified: boolean;
  date: string;
  helpful: number;
  adminReply?: string | undefined;
  productId?: string;
}

export interface ProductColor {
  name: string;
  hex: string;
  images: string[];
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: string;
  brand: string;
  sku: string;
  tagline: string;
  description: string;
  price: number;
  salePrice: number | null;
  stock: number;
  sold: number;
  rating: number;
  images: string[];
  colors?: ProductColor[];
  videoUrl?: string | undefined;
  features: string[];
  specs: { label: string; value: string }[];
  included: string[];
  warranty: string;
  shippingDetails: string;
  flashSale: boolean;
  flashEndsAt: string | null;
  bulkRules: BulkRule[];
  badges: string[];
  featured: boolean;
  trending: boolean;
  active: boolean;
  sortOrder: number;
  reviews: Review[];
  size?: string | undefined;
  fabric?: string | undefined;
  texture?: string | undefined;
  faqs: { q: string; a: string }[];
}

export interface PaymentMethod {
  id: PaymentMethodId;
  label: string;
  note: string;
  discountPct: number;
  enabled: boolean;
  requiresProof: boolean;
  accountTitle?: string | undefined;
  accountNumber?: string | undefined;
  iban?: string | undefined;
  qrUrl?: string | undefined;
  instructions?: string | undefined;
  sortOrder: number;
}


export interface CartLine {
  productId: string;
  qty: number;
}

export interface Customer {
  fullName: string;
  phone: string;
  whatsapp: string;
  email?: string | undefined;
  province: string;
  city: string;
  area: string;
  address: string;
  postalCode?: string | undefined;
  notes?: string | undefined;
}

export interface Order {
  id: string;
  createdAt: string;
  customer: Customer;
  lines: { productId: string; name: string; qty: number; unitPrice: number; lineTotal: number }[];
  paymentMethod: PaymentMethodId;
  
  subtotal: number;
  bulkDiscount: number;
  couponDiscount: number;
  paymentDiscount: number;
  shipping: number;
  total: number;
  advanceDue: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  hasScreenshot: boolean;
  trackingNumber?: string | undefined;
  timeline: { status: string; at: string }[];
}

export interface Settings {
  theme: ThemeId;
  brandName: string;
  tagline: string;
  whatsapp: string;
  email: string;
  supportPhone: string;
  address: string;
  freeShippingOver: number;
  shippingFlat: number;
  shippingKarachi: number;
  shippingKarachiUrgent: number;
  provinceRates: Record<string, number>;
  saleBannerText: string;
  saleEndsAt: string;
  independenceBanner: boolean;
  liveSalesPopup: boolean;
  socials: { facebook: string; instagram: string; tiktok: string; youtube: string; x?: string; linkedin?: string; pinterest?: string };
  seo: { title: string; description: string; keywords?: string };
  analytics: { ga4: string; metaPixel: string; gtm: string; tiktokPixel: string; snapchatPixel?: string; clarityId?: string };
  maintenanceMode: boolean;
  orderNotificationEmail: string;
  currency: string;
  lowStockThreshold: number;
  allowGuestCheckout: boolean;
  showInventoryCount: boolean;
  termsAndConditions: string;
  privacyPolicy: string;
  heroSlides?: { image: string; mobileImage?: string; title?: string; subtitle?: string; link?: string }[];
  categories?: { id: string; name: string; blurb?: string }[];
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  author: string;
  date: string;
}

export interface VisitorRow {
  id: string;
  sessionId: string;
  path: string;
  referrer: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  city: string | null;
  country: string | null;
  isNew: boolean;
  createdAt: string;
}

export interface AnalyticsSummary {
  live: number;
  today: number;
  yesterday: number;
  last7: number;
  last30: number;
  total: number;
  newToday: number;
  daily: { day: string; visits: number }[];
  topPages: { path: string; visits: number }[];
  devices: { device: string; visits: number }[];
  liveVisitors: VisitorRow[];
  recentVisitors: VisitorRow[];
}
