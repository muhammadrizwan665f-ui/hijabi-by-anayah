
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import {
  rowToOrder,
  rowToPayment,
  rowToProduct,
  toSettings,
} from "./mappers";
import { computeTotals, lineTotal } from "./pricing";
import {
  dataUrlToBytes,
  getDB,
  getMedia,
  newId,
} from "./cloudflare-db.server";
import { sendWebPush } from "./push.server";

const cartSchema = z.object({
  lines: z
    .array(
      z.object({
        productId: z.string().uuid(),
        qty: z.number().int().min(1).max(999),
        colorName: z.string().trim().max(60).optional(),
      }),
    )
    .min(1)
    .max(40),
  paymentCode: z.string().trim().min(2).max(40),
  screenshot: z
    .object({
      dataUrl: z.string().max(6_000_000),
      name: z.string().max(200),
    })
    .optional(),
  urgent: z.boolean().optional(),
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

const PUBLIC_PAYMENT_COLUMNS =
  "id,code,label,note,discount_pct,enabled,requires_proof,qr_url,instructions,sort_order,created_at";

function makeOrderNo(): string {
  const date = Date.now().toString(36).toUpperCase().slice(-6);
  const random = crypto.randomUUID().replace(/-/g, "").slice(0, 4).toUpperCase();
  return `AG-${date}${random}`;
}

async function notifyAdmin(
  orderNo: string,
  customerName: string,
  now: string,
): Promise<void> {
  try {
    const db = getDB();
    const subscriptions = await db
      .prepare(
        "SELECT id, endpoint, p256dh, auth FROM push_subscriptions LIMIT 50",
      )
      .all<{
        id: string;
        endpoint: string;
        p256dh: string;
        auth: string;
      }>();

    const subs = subscriptions.results ?? [];
    if (!subs.length) return;

    const dead: string[] = [];

    await Promise.all(
      subs.map(async (sub) => {
        try {
          const result = await sendWebPush(
            {
              endpoint: sub.endpoint,
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
            {
              title: "🛍️ New Order Received",
              message: `A new order ${orderNo} has been placed by ${customerName}.`,
              url: "/admin/orders",
            },
          );

          if (result.gone) dead.push(sub.id);
        } catch {
          // Push notifications are best-effort.
        }
      }),
    );

    if (dead.length) {
      const placeholders = dead.map(() => "?").join(",");
      await db
        .prepare(`DELETE FROM push_subscriptions WHERE id IN (${placeholders})`)
        .bind(...dead)
        .run();
    }
  } catch {
    // Never fail an order because push notification delivery failed.
  }
}

export const getStorefront = createServerFn({
  method: "GET",
}).handler(async () => {
  const db = getDB();

  const [products, payments, settings] = await Promise.all([
    db
      .prepare("SELECT * FROM products WHERE active = 1 ORDER BY sort_order ASC")
      .all(),
    db
      .prepare(
        `SELECT ${PUBLIC_PAYMENT_COLUMNS}
         FROM payment_methods
         WHERE enabled = 1
         ORDER BY sort_order ASC`,
      )
      .all(),
    db
      .prepare("SELECT data FROM site_settings WHERE id = 1")
      .first<{ data: string }>(),
  ]);

  return {
    products: (products.results ?? []).map(rowToProduct),
    payments: (payments.results ?? []).map((row) =>
      rowToPayment(row as Record<string, unknown>),
    ),
    settings: toSettings(settings?.data),
  };
});

export const getPaymentAccount = createServerFn({
  method: "GET",
})
  .inputValidator((input: { code: string }) =>
    z.object({ code: z.string().trim().min(2).max(40) }).parse(input),
  )
  .handler(async ({ data }) => {
    const row = await getDB()
      .prepare(
        `SELECT code, account_title, account_number, iban
         FROM payment_methods
         WHERE code = ? AND enabled = 1
         LIMIT 1`,
      )
      .bind(data.code)
      .first<{
        code: string;
        account_title: string | null;
        account_number: string | null;
        iban: string | null;
      }>();

    if (!row) return null;

    return {
      code: row.code,
      accountTitle: row.account_title ?? undefined,
      accountNumber: row.account_number ?? undefined,
      iban: row.iban ?? undefined,
    };
  });

export const getOrderByNumber = createServerFn({
  method: "GET",
})
  .inputValidator((input: { orderNo: string }) =>
    z.object({ orderNo: z.string().trim().min(3).max(30) }).parse(input),
  )
  .handler(async ({ data }) => {
    const row = await getDB()
      .prepare("SELECT * FROM orders WHERE order_no = ? LIMIT 1")
      .bind(data.orderNo)
      .first<Record<string, unknown>>();

    return row ? rowToOrder(row) : null;
  });

export const createOrder = createServerFn({
  method: "POST",
})
  .inputValidator((input: unknown) => cartSchema.parse(input))
  .handler(async ({ data }) => {
    const db = getDB();

    const requestedIds = [...new Set(data.lines.map((line) => line.productId))];
    const placeholders = requestedIds.map(() => "?").join(",");

    const [productRows, methodRow, settingsRow] = await Promise.all([
      db
        .prepare(
          `SELECT * FROM products
           WHERE active = 1 AND id IN (${placeholders})`,
        )
        .bind(...requestedIds)
        .all(),
      db
        .prepare(
          `SELECT * FROM payment_methods
           WHERE code = ? AND enabled = 1
           LIMIT 1`,
        )
        .bind(data.paymentCode)
        .first<Record<string, unknown>>(),
      db
        .prepare("SELECT data FROM site_settings WHERE id = 1")
        .first<{ data: string }>(),
    ]);

    if (!methodRow) {
      throw new Error("This payment method is unavailable.");
    }

    const method = rowToPayment(methodRow);
    const settings = toSettings(settingsRow?.data);
    const products = (productRows.results ?? []).map(rowToProduct);

    const lines = data.lines.map((line) => ({
      product: products.find((product) => product.id === line.productId),
      qty: line.qty,
      colorName: line.colorName,
    }));

    if (lines.some((line) => !line.product)) {
      throw new Error("Some cart items are no longer available.");
    }

    const validLines = lines as {
      product: (typeof products)[number];
      qty: number;
      colorName: string | undefined;
    }[];

    // Combine duplicate product IDs for one atomic stock reservation.
    const stockMap = new Map<string, number>();

    for (const line of validLines) {
      stockMap.set(
        line.product.id,
        (stockMap.get(line.product.id) ?? 0) + line.qty,
      );
    }

    const stockLines = [...stockMap.entries()].map(([productId, qty]) => ({
      productId,
      qty,
    }));

    const totals = computeTotals({
      lines: validLines,
      method,
      couponPct: 0,
      settings,
      province: data.customer.province,
      city: data.customer.city,
      urgent: !!data.urgent,
    });

    const orderNo = makeOrderNo();
    const now = new Date().toISOString();

    let screenshotPath: string | null = null;

    if (method.requiresProof && data.screenshot) {
      const uploaded = dataUrlToBytes(data.screenshot.dataUrl);

      if (
        uploaded &&
        ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "application/pdf"].includes(
          uploaded.contentType,
        ) &&
        uploaded.bytes.byteLength <= 5_000_000
      ) {
        const extension =
          uploaded.contentType === "application/pdf"
            ? "pdf"
            : uploaded.contentType === "image/jpeg"
              ? "jpg"
              : uploaded.contentType.split("/")[1];

        screenshotPath = `${orderNo}/proof.${extension}`;

        await getMedia().put(screenshotPath, uploaded.bytes, {
          httpMetadata: {
            contentType: uploaded.contentType,
          },
        });
      }
    }

    const paymentStatus = method.requiresProof
      ? "Pending Verification"
      : "Not Required";

    const status = method.requiresProof
      ? "Payment Verification Pending"
      : "Pending";

    const orderLines = validLines.map(({ product, qty, colorName }) => {
      const calculated = lineTotal(product, qty);

      return {
        productId: product.id,
        name: product.name,
        qty,
        ...(colorName ? { colorName } : {}),
        unitPrice: Math.round(calculated.total / qty),
        lineTotal: calculated.total,
      };
    });

    const stockJson = JSON.stringify(stockLines);

    /*
     * The first statement reserves all requested stock together.
     * It updates nothing unless every requested product is active
     * and has enough stock.
     *
     * The following INSERT checks SQLite changes() to ensure the
     * reservation succeeded for every distinct product.
     * D1 batch executes these statements transactionally.
     */
    const reserveStock = db
      .prepare(
        `UPDATE products
         SET
           stock = stock - (
             SELECT SUM(CAST(json_extract(value, '$.qty') AS INTEGER))
             FROM json_each(?)
             WHERE json_extract(value, '$.productId') = products.id
           ),
           sold = sold + (
             SELECT SUM(CAST(json_extract(value, '$.qty') AS INTEGER))
             FROM json_each(?)
             WHERE json_extract(value, '$.productId') = products.id
           )
         WHERE id IN (
           SELECT DISTINCT json_extract(value, '$.productId')
           FROM json_each(?)
         )
         AND active = 1
         AND (
           SELECT COUNT(*)
           FROM products AS p
           WHERE p.id IN (
             SELECT DISTINCT json_extract(value, '$.productId')
             FROM json_each(?)
           )
           AND p.active = 1
           AND p.stock >= (
             SELECT SUM(CAST(json_extract(value, '$.qty') AS INTEGER))
             FROM json_each(?)
             WHERE json_extract(value, '$.productId') = p.id
           )
         ) = (
           SELECT COUNT(DISTINCT json_extract(value, '$.productId'))
           FROM json_each(?)
         )`,
      )
      .bind(
        stockJson,
        stockJson,
        stockJson,
        stockJson,
        stockJson,
        stockJson,
      );

    const saveOrder = db
      .prepare(
        `INSERT INTO orders (
          id, order_no, customer, lines, payment_method_code, coupon,
          subtotal, bulk_discount, coupon_discount, payment_discount,
          shipping, total, advance_due, status, payment_status,
          payment_screenshot_path, timeline, urgent, created_at,
          updated_at, stock_restored
        )
        SELECT ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0
        WHERE changes() = ?`,
      )
      .bind(
        newId(),
        orderNo,
        JSON.stringify(data.customer),
        JSON.stringify(orderLines),
        method.id,
        totals.subtotal,
        totals.bulkDiscount,
        totals.couponDiscount,
        totals.paymentDiscount,
        totals.shipping,
        totals.total,
        totals.advanceDue,
        status,
        paymentStatus,
        screenshotPath,
        JSON.stringify([{ status, at: now }]),
        totals.isUrgent ? 1 : 0,
        now,
        now,
        stockLines.length,
      );

    const notificationMessage =
      `A new order ${orderNo} has been placed by ${data.customer.fullName}.`;

    const saveNotification = db
      .prepare(
        `INSERT INTO notifications (
          id, order_no, title, message, type, is_read, created_at
        )
        SELECT ?, ?, ?, ?, ?, 0, ?
        WHERE EXISTS (
          SELECT 1 FROM orders WHERE order_no = ?
        )`,
      )
      .bind(
        newId(),
        orderNo,
        "New Order Received",
        notificationMessage,
        "admin_new_order",
        now,
        orderNo,
      );

    const results = await db.batch([
      reserveStock,
      saveOrder,
      saveNotification,
    ]);

   const savedChanges = Number(
  (results[1] as { meta?: { changes?: number } } | undefined)?.meta?.changes ?? 0,
);

    if (savedChanges !== 1) {
      if (screenshotPath) {
        try {
          await getMedia().delete(screenshotPath);
        } catch {
          // Ignore cleanup failure.
        }
      }

      throw new Error(
        "Some items in your cart are no longer available in that quantity. Please refresh your cart.",
      );
    }

    const saved = await db
      .prepare("SELECT * FROM orders WHERE order_no = ? LIMIT 1")
      .bind(orderNo)
      .first<Record<string, unknown>>();

    if (!saved) {
      throw new Error("Your order was placed, but we could not load its details. Please contact support with your order number: " + orderNo);
    }

    // Push delivery is best-effort and cannot undo a successful order.
    void notifyAdmin(orderNo, data.customer.fullName, now);

    return rowToOrder(saved);
  });

export const trackVisit = createServerFn({
  method: "POST",
})
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
    await getDB()
      .prepare(
        `INSERT INTO visits (
          id, session_id, path, referrer, device, browser, os,
          country, city, is_new, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        newId(),
        data.sessionId,
        data.path || "/",
        data.referrer ?? null,
        data.device ?? null,
        data.browser ?? null,
        data.os ?? null,
        getRequestHeader("cf-ipcountry") ?? null,
        getRequestHeader("cf-ipcity") ?? null,
        data.isNew === false ? 0 : 1,
        new Date().toISOString(),
      )
      .run();

    return { ok: true };
  });
