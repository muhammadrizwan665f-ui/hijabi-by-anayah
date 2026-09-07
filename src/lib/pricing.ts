import type { BulkRule, PaymentMethod, Product, Settings } from "./types";

export const PROVINCES = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Islamabad Capital Territory",
  "Gilgit-Baltistan",
  "Azad Kashmir",
];

export function formatPKR(value: number): string {
  return "Rs " + Math.round(value).toLocaleString("en-PK");
}

export function unitPrice(product: Product): number {
  return product.salePrice ?? product.price;
}

export function discountPct(product: Product): number {
  if (!product.salePrice || product.price <= 0) return 0;
  return Math.round(((product.price - product.salePrice) / product.price) * 100);
}

export function bulkDiscountFor(rules: BulkRule[], qty: number): BulkRule | null {
  return null;
}

export function lineTotal(product: Product, qty: number) {
  const base = unitPrice(product) * qty;
  const rule = bulkDiscountFor(product.bulkRules, qty);
  const bulk = rule ? (base * rule.discountPct) / 100 : 0;
  return { base, bulk, total: base - bulk, rule };
}

export interface CartTotals {
  subtotal: number;
  bulkDiscount: number;
  couponDiscount: number;
  paymentDiscount: number;
  shipping: number;
  total: number;
  advanceDue: number;
  isUrgent?: boolean;
}

export function computeTotals(opts: {
  lines: { product: Product; qty: number }[];
  method: PaymentMethod | null;
  couponPct: number;
  settings: Settings;
  province?: string;
  city?: string;
  urgent?: boolean;
}): CartTotals {
  let subtotal = 0;
  for (const l of opts.lines) {
    const t = lineTotal(l.product, l.qty);
    subtotal += t.base;
  }
  const goods = subtotal;
  const bulkDiscount = 0;
  const couponDiscount = 0;
  const paymentDiscount = 0;
  const isUrgent = !!opts.urgent;

  let rate = opts.settings.shippingFlat ?? 350;
  const isKarachi = opts.city?.toLowerCase().trim() === "karachi";

  if (isKarachi) {
    rate = isUrgent
      ? (opts.settings.shippingKarachiUrgent || 450)
      : 300; // Standard Karachi only 300
  } else {
    // Non-Karachi: the delivery option the customer picks IS the price —
    // Standard is always the flat rate (350 DC as shown at checkout),
    // Urgent/Leopard is always 450, regardless of province. Per-province
    // custom rates used to silently override this, so the amount charged
    // didn't match what was shown next to the selected option.
    rate = isUrgent ? 450 : (opts.settings.shippingFlat ?? 350);
  }

  const shipping = goods === 0 ? 0 : rate;

  const total = goods + shipping;
  // For Karachi, allow 0 advance on COD as requested.
  // Otherwise, advanceDue for COD is typically just the shipping (delivery charge).
  const advanceDue = opts.method?.id === "cod" 
    ? (isKarachi ? 0 : shipping)
    : total;

  return { subtotal, bulkDiscount, couponDiscount, paymentDiscount, shipping, total, advanceDue, isUrgent };
}

export function countdown(target: string | null) {
  if (!target) return null;
  const diff = new Date(target).getTime() - Date.now();
  if (Number.isNaN(diff) || diff <= 0) return { d: 0, h: 0, m: 0, s: 0, done: true };
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff / 3600000) % 24),
    m: Math.floor((diff / 60000) % 60),
    s: Math.floor((diff / 1000) % 60),
    done: false,
  };
}
