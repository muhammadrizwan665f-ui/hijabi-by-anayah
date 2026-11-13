
import type {
  Notification,
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

const num = (v: unknown, d = 0): number =>
  v === null || v === undefined ? d : Number(v);

const str = (v: unknown, d = ""): string =>
  typeof v === "string" ? v : d;

const bool = (v: unknown, d = false): boolean => {
  if (v === null || v === undefined) return d;
  return v === true || v === 1 || v === "1" || v === "true";
};

const arr = <T>(v: unknown): T[] => {
  if (Array.isArray(v)) return v as T[];
  if (typeof v !== "string" || !v.trim()) return [];
  try {
    const parsed: unknown = JSON.parse(v);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
};

const object = <T extends Record<string, unknown>>(
  v: unknown,
  fallback: T,
): T => {
  if (v && typeof v === "object" && !Array.isArray(v)) return v as T;
  if (typeof v === "string") {
    try {
      const parsed: unknown = JSON.parse(v);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as T;
      }
    } catch {
      // Use fallback for invalid JSON.
    }
  }
  return fallback;
};

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
    salePrice:
      r["sale_price"] === null || r["sale_price"] === undefined
        ? null
        : num(r["sale_price"]),
    stock: num(r["stock"]),
    sold: num(r["sold"]),
    rating: num(r["rating"], 5),
    images: arr<string>(r["images"]),
    colors: arr<{
      name: string;
      hex: string;
      images: string[];
      stock?: number | null;
    }>(r["colors"]).map((c) => ({
      name: str(c?.name),
      hex: str(c?.hex, "#C9A88A"),
      images: arr<string>(c?.images),
      stock:
        c?.stock === null ||
        c?.stock === undefined ||
        Number.isNaN(Number(c.stock))
          ? null
          : Math.max(0, Math.trunc(Number(c.stock))),
    })),
    videoUrl: (r["video_url"] as string | null) ?? undefined,
    features: arr<string>(r["features"]),
    specs: arr<{ label: string; value: string }>(r["specs"]),
    included: arr<string>(r["included"]),
    warranty: str(r["warranty"]),
    shippingDetails: str(r["shipping_details"]),
    flashSale: bool(r["flash_sale"]),
    flashEndsAt: (r["flash_ends_at"] as string | null) ?? null,
    bulkRules: arr(r["bulk_rules"]),
    badges: arr<string>(r["badges"]),
    featured: bool(r["featured"]),
    trending: bool(r["trending"]),
    active: bool(r["active"], true),
    sortOrder: num(r["sort_order"]),
    size: (r["size"] as string | null) ?? undefined,
    fabric: (r["fabric"] as string | null) ?? undefined,
    texture: (r["texture"] as string | null) ?? undefined,
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
    images: JSON.stringify(p.images ?? []),
    colors: JSON.stringify(p.colors ?? []),
    video_url: p.videoUrl ?? null,
    features: JSON.stringify(p.features ?? []),
    specs: JSON.stringify(p.specs ?? []),
    included: JSON.stringify(p.included ?? []),
    warranty: p.warranty,
    shipping_details: p.shippingDetails,
    flash_sale: p.flashSale ? 1 : 0,
    flash_ends_at: p.flashEndsAt,
    bulk_rules: JSON.stringify(p.bulkRules ?? []),
    badges: JSON.stringify(p.badges ?? []),
    faqs: JSON.stringify(p.faqs ?? []),
    reviews: JSON.stringify(p.reviews ?? []),
    featured: p.featured ? 1 : 0,
    trending: p.trending ? 1 : 0,
    active: p.active ? 1 : 0,
    sort_order: p.sortOrder,
    size: p.size ?? null,
    fabric: p.fabric ?? null,
    texture: p.texture ?? null,
    updated_at: new Date().toISOString(),
  };
}

export function rowToPayment(r: Row): PaymentMethod {
  return {
    id: str(r["code"]),
    label: str(r["label"]),
    note: str(r["note"]),
    discountPct: num(r["discount_pct"]),
    enabled: bool(r["enabled"]),
    requiresProof: bool(r["requires_proof"]),
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
    enabled: m.enabled ? 1 : 0,
    requires_proof: m.requiresProof ? 1 : 0,
    account_title: m.accountTitle ?? null,
    account_number: m.accountNumber ?? null,
    iban: m.iban ?? null,
    qr_url: m.qrUrl ?? null,
    instructions: m.instructions ?? null,
    sort_order: m.sortOrder,
  };
}

export function rowToOrder(r: Row): Order {
  return {
    id: str(r["order_no"]),
    createdAt: str(r["created_at"]),
    customer: object(r["customer"], {} as Order["customer"]),
    lines: arr<{
      productId: string;
      name: string;
      qty: number;
      unitPrice: number;
      lineTotal: number;
      colorName?: string;
    }>(r["lines"]).map((l) => ({
      productId: str(l.productId),
      name: str(l.name),
      qty: num(l.qty, 1),
      unitPrice: num(l.unitPrice),
      lineTotal: num(l.lineTotal),
      colorName: l.colorName ? str(l.colorName) : undefined,
    })),
    paymentMethod: str(r["payment_method_code"]),
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
    isNew: bool(r["is_new"]),
    createdAt: str(r["created_at"]),
  };
}

export function toSettings(data: unknown): Settings {
  const d = object<Partial<Settings> & Record<string, unknown>>(
    data,
    {} as Partial<Settings> & Record<string, unknown>,
  );

  return {
    ...SEED_SETTINGS,
    ...d,
    provinceRates: {
      ...SEED_SETTINGS.provinceRates,
      ...(d.provinceRates ?? {}),
    },
    socials: {
      ...SEED_SETTINGS.socials,
      ...(d.socials ?? {}),
    },
    seo: {
      ...SEED_SETTINGS.seo,
      ...(d.seo ?? {}),
    },
    analytics: {
      ...SEED_SETTINGS.analytics,
      ...(d.analytics ?? {}),
    },
  };
}

export function rowToNotification(r: Row): Notification {
  return {
    id: str(r["id"]),
    userId: (r["user_id"] as string | null) ?? null,
    orderNo: str(r["order_no"]),
    title: str(r["title"]),
    message: str(r["message"]),
    type: str(r["type"]) as Notification["type"],
    isRead: bool(r["is_read"]),
    createdAt: str(r["created_at"]),
  };
}
