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
  if (!product.salePrice) return 0;
  return Math.round(((product.price - product.salePrice) / product.price) * 100);
}

export function bulkDiscountFor(rules: BulkRule[], qty: number): BulkRule | null {
  const sorted = [...rules].sort((a, b) => b.minQty - a.minQty);
  return sorted.find((r) => qty >= r.minQty) ?? null;
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
}

export function computeTotals(opts: {
  lines: { product: Product; qty: number }[];
  method: PaymentMethod | null;
  couponPct: number;
  settings: Settings;
  province?: string;
}): CartTotals {
  let subtotal = 0;
  let bulkDiscount = 0;
  for (const l of opts.lines) {
    const t = lineTotal(l.product, l.qty);
    subtotal += t.base;
    bulkDiscount += t.bulk;
  }
  const afterBulk = subtotal - bulkDiscount;
  const couponDiscount = (afterBulk * opts.couponPct) / 100;
  const afterCoupon = afterBulk - couponDiscount;
  const paymentDiscount = opts.method ? (afterCoupon * opts.method.discountPct) / 100 : 0;
  const goods = afterCoupon - paymentDiscount;

  const rate =
    (opts.province && opts.settings.provinceRates[opts.province]) || opts.settings.shippingFlat;
  const shipping = goods === 0 ? 0 : goods >= opts.settings.freeShippingOver ? 0 : rate;

  const total = goods + shipping;
  const advanceDue = opts.method?.id === "cod" ? shipping : total;

  return { subtotal, bulkDiscount, couponDiscount, paymentDiscount, shipping, total, advanceDue };
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
