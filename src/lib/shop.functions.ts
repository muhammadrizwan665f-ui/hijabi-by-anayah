import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { rowToCoupon, rowToOrder, rowToPayment, rowToProduct, toSettings } from "./mappers";
import { computeTotals, lineTotal } from "./pricing";

const cartSchema = z.object({
  lines: z
    .array(z.object({ productId: z.string().uuid(), qty: z.number().int().min(1).max(999) }))
    .min(1)
    .max(40),
  paymentCode: z.string().trim().min(2).max(40),
  couponCode: z.string().trim().max(40).optional(),
  screenshot: z
    .object({ dataUrl: z.string().max(6_000_000), name: z.string().max(200) })
    .optional(),
  customer: z.object({
    fullName: z.string().trim().min(3).max(80),
    phone: z.string().trim().min(10).max(20),
    whatsapp: z.string().trim().min(10).max(20),
    email: z.string().trim().max(255).optional(),
    province: z.string().trim().min(2).max(60),
    city: z.string().trim().min(2).max(60),
    area: z.string().trim().min(2).max(80),
    address: z.string().trim().min(8).max(300),
    postalCode: z.string().trim().max(10).optional(),
    notes: z.string().trim().max(500).optional(),
  }),
});

/** Columns safe to expose publicly — excludes bank/wallet account identifiers. */
const PUBLIC_PAYMENT_COLUMNS =
  "id,code,label,note,discount_pct,enabled,requires_proof,qr_url,instructions,sort_order,created_at";

export const getStorefront = createServerFn({ method: "GET" }).handler(async () => {
  const { getPublicClient } = await import("./db.server");
  const supabase = getPublicClient();
  const [products, payments, coupons, settings] = await Promise.all([
    supabase.from("products").select("*").eq("active", true).order("sort_order"),
    supabase.from("payment_methods").select(PUBLIC_PAYMENT_COLUMNS).eq("enabled", true).order("sort_order"),
    supabase.from("coupons").select("*").eq("active", true),
    supabase.from("site_settings").select("data").maybeSingle(),
  ]);
  return {
    products: (products.data ?? []).map(rowToProduct),
    payments: (payments.data ?? []).map((r) => rowToPayment(r as Record<string, unknown>)),
    coupons: (coupons.data ?? []).map(rowToCoupon),
    settings: toSettings(settings.data?.data),
  };
});

/**
 * Bank/wallet account details for one enabled payment method, fetched only when
 * a shopper actually picks it. Never bulk-readable through the public API.
 */
export const getPaymentAccount = createServerFn({ method: "GET" })
  .inputValidator((input: { code: string }) =>
    z.object({ code: z.string().trim().min(2).max(40) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { getAdminClient } = await import("./db.server");
    const admin = await getAdminClient();
    const { data: row } = await admin
      .from("payment_methods")
      .select("code,account_title,account_number,iban")
      .eq("code", data.code)
      .eq("enabled", true)
      .maybeSingle();
    if (!row) return null;
    return {
      code: row.code as string,
      accountTitle: (row.account_title as string | null) ?? undefined,
      accountNumber: (row.account_number as string | null) ?? undefined,
      iban: (row.iban as string | null) ?? undefined,
    };
  });


export const getOrderByNumber = createServerFn({ method: "GET" })
  .inputValidator((input: { orderNo: string }) =>
    z.object({ orderNo: z.string().trim().min(3).max(30) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { getAdminClient } = await import("./db.server");
    const supabase = await getAdminClient();
    const { data: row } = await supabase
      .from("orders")
      .select("*")
      .eq("order_no", data.orderNo.toUpperCase())
      .maybeSingle();
    return row ? rowToOrder(row as Record<string, unknown>) : null;
  });

export const createOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => cartSchema.parse(input))
  .handler(async ({ data }) => {
    const { getAdminClient, getPublicClient, newOrderNo } = await import("./db.server");
    const pub = getPublicClient();
    const adminDb = await getAdminClient();

    const [{ data: productRows }, { data: methodRow }, { data: settingsRow }] = await Promise.all([
      pub
        .from("products")
        .select("*")
        .in(
          "id",
          data.lines.map((l) => l.productId),
        ),
      adminDb.from("payment_methods").select("*").eq("code", data.paymentCode).eq("enabled", true).maybeSingle(),
      adminDb.from("site_settings").select("data").maybeSingle(),
    ]);


    if (!methodRow) throw new Error("This payment method is unavailable.");
    const method = rowToPayment(methodRow as Record<string, unknown>);
    const settings = toSettings(settingsRow?.data);
    const products = (productRows ?? []).map(rowToProduct);

    const lines = data.lines
      .map((l) => ({ product: products.find((p) => p.id === l.productId), qty: l.qty }))
      .filter((l): l is { product: (typeof products)[number]; qty: number } => Boolean(l.product));
    if (lines.length === 0) throw new Error("Your cart items are no longer available.");

    let couponPct = 0;
    let couponCode: string | null = null;
    if (data.couponCode) {
      const { data: c } = await pub
        .from("coupons")
        .select("*")
        .eq("code", data.couponCode.toUpperCase())
        .eq("active", true)
        .maybeSingle();
      if (c) {
        const coupon = rowToCoupon(c as Record<string, unknown>);
        const goods = lines.reduce((a, l) => a + lineTotal(l.product, l.qty).total, 0);
        if (goods >= coupon.minOrder) {
          couponPct = coupon.discountPct;
          couponCode = coupon.code;
        }
      }
    }

    const totals = computeTotals({
      lines,
      method,
      couponPct,
      settings,
      province: data.customer.province,
    });

    const orderNo = newOrderNo();
    const admin = await getAdminClient();

    let screenshotPath: string | null = null;
    if (method.requiresProof && data.screenshot) {
      const match = /^data:(image\/[a-z+]+|application\/pdf);base64,(.+)$/i.exec(
        data.screenshot.dataUrl,
      );
      if (match) {
        const contentType = match[1]!;
        const bytes = Buffer.from(match[2]!, "base64");
        if (bytes.byteLength <= 5_000_000) {
          const ext = contentType === "application/pdf" ? "pdf" : contentType.split("/")[1];
          const path = `${orderNo}/proof.${ext}`;
          const { error } = await admin.storage
            .from("payment-proofs")
            .upload(path, bytes, { contentType, upsert: true });
          if (!error) screenshotPath = path;
        }
      }
    }

    const paymentStatus = method.requiresProof
      ? screenshotPath
        ? "Pending Verification"
        : "Pending Verification"
      : "Not Required";
    const status = method.requiresProof ? "Payment Verification Pending" : "Pending";
    const now = new Date().toISOString();

    const stockLines = lines.map(({ product, qty }) => ({ productId: product.id, qty }));

    // Atomic reservation: locks each product row, validates availability, then
    // decrements stock and increments sold. Blocks overselling under races.
    const { error: stockError } = await admin.rpc("reserve_stock", { _lines: stockLines });
    if (stockError) {
      const msg = (stockError.message || "").trim();
      const isStockMessage = /out of stock|left in stock|no longer available/i.test(msg);
      throw new Error(
        isStockMessage
          ? msg
          : "Some items in your cart are no longer available in that quantity.",
      );
    }

    const { data: inserted, error } = await admin
      .from("orders")
      .insert({
        order_no: orderNo,
        customer: data.customer,
        lines: lines.map(({ product, qty }) => {
          const t = lineTotal(product, qty);
          return {
            productId: product.id,
            name: product.name,
            qty,
            unitPrice: Math.round(t.total / qty),
            lineTotal: t.total,
          };
        }),
        payment_method_code: method.id,
        coupon: couponCode,
        subtotal: totals.subtotal,
        bulk_discount: totals.bulkDiscount,
        coupon_discount: totals.couponDiscount,
        payment_discount: totals.paymentDiscount,
        shipping: totals.shipping,
        total: totals.total,
        advance_due: totals.advanceDue,
        status,
        payment_status: paymentStatus,
        payment_screenshot_path: screenshotPath,
        timeline: [{ status, at: now }],
      })
      .select("*")
      .single();

    if (error) {
      // Order failed to save — give the reserved stock back so nothing is stuck.
      await admin.rpc("release_stock", { _lines: stockLines });
      throw new Error("We could not save your order. Please try again.");
    }

    return rowToOrder(inserted as Record<string, unknown>);
  });

export const trackVisit = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        sessionId: z.string().trim().min(6).max(64),
        path: z.string().trim().max(300),
        referrer: z.string().trim().max(300).optional(),
        device: z.string().trim().max(20).optional(),
        browser: z.string().trim().max(40).optional(),
        os: z.string().trim().max(40).optional(),
        isNew: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { getAdminClient } = await import("./db.server");
    const { getRequestHeader } = await import("@tanstack/react-start/server");
    const admin = await getAdminClient();
    await admin.from("visits").insert({
      session_id: data.sessionId,
      path: data.path || "/",
      referrer: data.referrer ?? null,
      device: data.device ?? null,
      browser: data.browser ?? null,
      os: data.os ?? null,
      country: getRequestHeader("cf-ipcountry") ?? null,
      city: getRequestHeader("cf-ipcity") ?? null,
      is_new: data.isNew ?? true,
    });
    return { ok: true };
  });
