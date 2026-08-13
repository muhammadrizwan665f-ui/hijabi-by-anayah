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
    // For non-Karachi, if urgent is selected it's always 450
    if (isUrgent) {
      rate = 450;
    } else if (opts.province && opts.settings.provinceRates && opts.settings.provinceRates[opts.province]) {
      rate = opts.settings.provinceRates[opts.province] ?? opts.settings.shippingFlat ?? 350;
    }
  }

  const shipping = goods === 0 ? 0 : goods >= opts.settings.freeShippingOver ? 0 : rate;

  const total = goods + shipping;
  const advanceDue = opts.method?.id === "cod" ? shipping : total;

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
