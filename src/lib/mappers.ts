import type {
  Coupon,
  Order,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Product,
  Settings,
  VisitorRow,
} from "./types";
import { SEED_SETTINGS } from "./seed";

type Row = Record<string, unknown>;

const num = (v: unknown, d = 0): number => (v === null || v === undefined ? d : Number(v));
const str = (v: unknown, d = ""): string => (typeof v === "string" ? v : d);
const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

export function rowToProduct(r: Row): Product {
  return {
    id: str(r["id"]),
    slug: str(r["slug"]),
    name: str(r["name"]),
    category: str(r["category"]),
    brand: str(r["brand"], "Anayah"),
    sku: str(r["sku"]),
    tagline: str(r["tagline"]),
    description: str(r["description"]),
    price: num(r["price"]),
    salePrice: r["sale_price"] === null || r["sale_price"] === undefined ? null : num(r["sale_price"]),
    stock: num(r["stock"]),
    sold: num(r["sold"]),
    rating: num(r["rating"], 5),
    images: arr<string>(r["images"]),
    colors: arr<{ name: string; hex: string; images: string[] }>(r["colors"]).map((c) => ({
      name: str(c?.name),
      hex: str(c?.hex, "#C9A88A"),
      images: arr<string>(c?.images),
    })),
    videoUrl: (r["video_url"] as string | null) ?? undefined,
    features: arr<string>(r["features"]),
    specs: arr<{ label: string; value: string }>(r["specs"]),
    included: arr<string>(r["included"]),
    warranty: str(r["warranty"]),
    shippingDetails: str(r["shipping_details"]),
    flashSale: Boolean(r["flash_sale"]),
    flashEndsAt: (r["flash_ends_at"] as string | null) ?? null,
    bulkRules: arr(r["bulk_rules"]),
    badges: arr<string>(r["badges"]),
    featured: Boolean(r["featured"]),
    trending: Boolean(r["trending"]),
    active: r["active"] === undefined ? true : Boolean(r["active"]),
    sortOrder: num(r["sort_order"]),
    reviews: arr(r["reviews"]),
    faqs: arr(r["faqs"]),
  };
}

export function productToRow(p: Product): Row {
  return {
    slug: p.slug,
    name: p.name,
    category: p.category,
    brand: p.brand,
    sku: p.sku,
    tagline: p.tagline,
    description: p.description,
    price: p.price,
    sale_price: p.salePrice,
    stock: p.stock,
    sold: p.sold,
    rating: p.rating,
    images: p.images,
    colors: p.colors ?? [],
    video_url: p.videoUrl ?? null,
    features: p.features,
    specs: p.specs,
    included: p.included,
    warranty: p.warranty,
    shipping_details: p.shippingDetails,
    flash_sale: p.flashSale,
    flash_ends_at: p.flashEndsAt,
    bulk_rules: p.bulkRules,
    badges: p.badges,
    faqs: p.faqs,
    reviews: p.reviews,
    featured: p.featured,
    trending: p.trending,
    active: p.active,
    sort_order: p.sortOrder,
    updated_at: new Date().toISOString(),
  };
}

export function rowToPayment(r: Row): PaymentMethod {
  return {
    id: str(r["code"]),
    label: str(r["label"]),
    note: str(r["note"]),
    discountPct: num(r["discount_pct"]),
    enabled: Boolean(r["enabled"]),
    requiresProof: Boolean(r["requires_proof"]),
    accountTitle: (r["account_title"] as string | null) ?? undefined,
    accountNumber: (r["account_number"] as string | null) ?? undefined,
    iban: (r["iban"] as string | null) ?? undefined,
    qrUrl: (r["qr_url"] as string | null) ?? undefined,
    instructions: (r["instructions"] as string | null) ?? undefined,
    sortOrder: num(r["sort_order"]),
  };
}

export function paymentToRow(m: PaymentMethod): Row {
  return {
    code: m.id,
    label: m.label,
    note: m.note,
    discount_pct: m.discountPct,
    enabled: m.enabled,
    requires_proof: m.requiresProof,
    account_title: m.accountTitle ?? null,
    account_number: m.accountNumber ?? null,
    iban: m.iban ?? null,
    qr_url: m.qrUrl ?? null,
    instructions: m.instructions ?? null,
    sort_order: m.sortOrder,
  };
}

export function rowToCoupon(r: Row): Coupon {
  return {
    code: str(r["code"]),
    discountPct: num(r["discount_pct"]),
    minOrder: num(r["min_order"]),
    active: Boolean(r["active"]),
  };
}

export function rowToOrder(r: Row): Order {
  return {
    id: str(r["order_no"]),
    createdAt: str(r["created_at"]),
    customer: (r["customer"] ?? {}) as Order["customer"],
    lines: arr(r["lines"]),
    paymentMethod: str(r["payment_method_code"]),
    coupon: (r["coupon"] as string | null) ?? undefined,
    subtotal: num(r["subtotal"]),
    bulkDiscount: num(r["bulk_discount"]),
    couponDiscount: num(r["coupon_discount"]),
    paymentDiscount: num(r["payment_discount"]),
    shipping: num(r["shipping"]),
    total: num(r["total"]),
    advanceDue: num(r["advance_due"]),
    status: str(r["status"], "Pending") as OrderStatus,
    paymentStatus: str(r["payment_status"], "Not Required") as PaymentStatus,
    hasScreenshot: Boolean(r["payment_screenshot_path"]),
    trackingNumber: (r["tracking_number"] as string | null) ?? undefined,
    timeline: arr(r["timeline"]),
  };
}

export function rowToVisitor(r: Row): VisitorRow {
  return {
    id: str(r["id"]),
    sessionId: str(r["session_id"]),
    path: str(r["path"], "/"),
    referrer: (r["referrer"] as string | null) ?? null,
    device: (r["device"] as string | null) ?? null,
    browser: (r["browser"] as string | null) ?? null,
    os: (r["os"] as string | null) ?? null,
    city: (r["city"] as string | null) ?? null,
    country: (r["country"] as string | null) ?? null,
    isNew: Boolean(r["is_new"]),
    createdAt: str(r["created_at"]),
  };
}

export function toSettings(data: unknown): Settings {
  const d = (data ?? {}) as Partial<Settings>;
  return {
    ...SEED_SETTINGS,
    ...d,
    provinceRates: { ...SEED_SETTINGS.provinceRates, ...(d.provinceRates ?? {}) },
    socials: { ...SEED_SETTINGS.socials, ...(d.socials ?? {}) },
    seo: { ...SEED_SETTINGS.seo, ...(d.seo ?? {}) },
    analytics: { ...SEED_SETTINGS.analytics, ...(d.analytics ?? {}) },
  };
}
