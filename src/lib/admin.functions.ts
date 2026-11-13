import { createServerFn } from "@tanstack/react-start";
import { requireAdminAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import {
  paymentToRow,
  productToRow,
  rowToOrder,
  rowToPayment,
  rowToProduct,
  rowToVisitor,
  rowToNotification,
  toSettings,
} from "./mappers";
import { getDB, getMedia, newId, dataUrlToBytes } from "./cloudflare-db.server";
import type { AnalyticsSummary, Product, VisitorRow } from "./types";

const STATUSES = [
  "Pending",
  "Payment Verification Pending",
  "Confirmed",
  "Packed",
  "Shipped",
  "Delivered",
  "Cancelled",
  "Returned",
  "Refunded",
  "On Hold",
] as const;

const PAYMENT_STATUSES = [
  "Not Required",
  "Pending Verification",
  "Verified",
  "Rejected",
] as const;

export const getAdminBootstrap = createServerFn({ method: "GET" })
  .middleware([requireAdminAuth])
  .handler(async () => {
    const db = getDB();

    const [products, payments, orders, settings, notifications] =
      await Promise.all([
        db.prepare("SELECT * FROM products ORDER BY sort_order ASC").all(),
        db.prepare("SELECT * FROM payment_methods ORDER BY sort_order ASC").all(),
        db.prepare(
          "SELECT * FROM orders ORDER BY created_at DESC LIMIT 500",
        ).all(),
        db.prepare("SELECT data FROM site_settings WHERE id = 1").first<{
          data: string;
        }>(),
        db.prepare(
          "SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50",
        ).all(),
      ]);

    return {
      products: (products.results ?? []).map(rowToProduct),
      payments: (payments.results ?? []).map(rowToPayment),
      orders: (orders.results ?? []).map(rowToOrder),
      settings: toSettings(settings?.data),
      notifications: (notifications.results ?? []).map(rowToNotification),
    };
  });

export const markNotificationRead = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .inputValidator((input: { id: string }) =>
    z.object({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }) => {
    await getDB()
      .prepare("UPDATE notifications SET is_read = 1 WHERE id = ?")
      .bind(data.id)
      .run();

    return { ok: true };
  });

export const markAllNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .handler(async () => {
    await getDB()
      .prepare("UPDATE notifications SET is_read = 1 WHERE is_read = 0")
      .run();

    return { ok: true };
  });

export const saveProduct = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .inputValidator((input: { product: Product }) =>
    z.object({ product: z.any() }).parse(input),
  )
  .handler(async ({ data }) => {
    const db = getDB();
    const product = data.product as Product;
    const id = product.id || newId();
    const row = productToRow(product);

    const columns = Object.keys(row);
    const values = Object.values(row);

    if (product.id) {
      const assignments = columns.map((column) => `${column} = ?`).join(", ");

      await db
        .prepare(`UPDATE products SET ${assignments} WHERE id = ?`)
        .bind(...values, id)
        .run();
    } else {
      const insertColumns = ["id", ...columns];
      const placeholders = insertColumns.map(() => "?").join(", ");

      await db
        .prepare(
          `INSERT INTO products (${insertColumns.join(", ")}) VALUES (${placeholders})`,
        )
        .bind(id, ...values)
        .run();
    }

    return { ok: true, id };
  });

export const deleteProductFn = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .inputValidator((input: { id: string }) =>
    z.object({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }) => {
    await getDB()
      .prepare("DELETE FROM products WHERE id = ?")
      .bind(data.id)
      .run();

    return { ok: true };
  });

export const duplicateProductFn = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .inputValidator((input: { id: string }) =>
    z.object({ id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data }) => {
    const db = getDB();

    const row = await db
      .prepare("SELECT * FROM products WHERE id = ?")
      .bind(data.id)
      .first<Record<string, unknown>>();

    if (!row) throw new Error("Product not found.");

    const product = rowToProduct(row);
    const stamp = Date.now().toString(36).slice(-4);

    const copy = productToRow({
      ...product,
      name: `${product.name} (Copy)`,
      slug: `${product.slug}-copy-${stamp}`,
      sku: `${product.sku}-C${stamp.toUpperCase()}`,
      active: false,
      sold: 0,
    });

    const columns = ["id", ...Object.keys(copy)];
    const values = [newId(), ...Object.values(copy)];
    const placeholders = columns.map(() => "?").join(", ");

    await db
      .prepare(
        `INSERT INTO products (${columns.join(", ")}) VALUES (${placeholders})`,
      )
      .bind(...values)
      .run();

    return { ok: true };
  });

export const uploadProductImage = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .inputValidator((input: { dataUrl: string; name: string }) =>
    z
      .object({
        dataUrl: z.string().max(6_000_000),
        name: z.string().max(200),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const uploaded = dataUrlToBytes(data.dataUrl);

    if (!uploaded || !uploaded.contentType.startsWith("image/")) {
      throw new Error("Please upload a valid image.");
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/avif",
    ];

    if (!allowedTypes.includes(uploaded.contentType)) {
      throw new Error("Only JPG, PNG, WEBP, GIF and AVIF images are supported.");
    }

    if (uploaded.bytes.byteLength > 5_000_000) {
      throw new Error("Image must be under 5MB.");
    }

    const extension =
      uploaded.contentType === "image/jpeg"
        ? "jpg"
        : uploaded.contentType.split("/")[1];

    const key = `p_${newId()}.${extension}`;

    await getMedia().put(key, uploaded.bytes, {
      httpMetadata: { contentType: uploaded.contentType },
    });

    return { url: `/api/media/${key}` };
  });

export const savePaymentMethod = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .inputValidator((input: { method: unknown }) =>
    z.object({ method: z.any() }).parse(input),
  )
  .handler(async ({ data }) => {
    const db = getDB();
    const method = data.method as Parameters<typeof paymentToRow>[0];
    const row = paymentToRow(method);
    const code = method.id;
    const existing = await db
      .prepare("SELECT id FROM payment_methods WHERE code = ?")
      .bind(code)
      .first<{ id: string }>();

    const id = existing?.id ?? newId();
    const values = {
      id,
      ...row,
    };

    const columns = Object.keys(values);
    const placeholders = columns.map(() => "?").join(", ");
    const updates = columns
      .filter((column) => column !== "id")
      .map((column) => `${column} = excluded.${column}`)
      .join(", ");

    await db
      .prepare(
        `INSERT INTO payment_methods (${columns.join(", ")})
         VALUES (${placeholders})
         ON CONFLICT(code) DO UPDATE SET ${updates}`,
      )
      .bind(...Object.values(values))
      .run();

    return { ok: true };
  });

export const deletePaymentMethod = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .inputValidator((input: { code: string }) =>
    z.object({ code: z.string().trim().min(2).max(40) }).parse(input),
  )
  .handler(async ({ data }) => {
    await getDB()
      .prepare("DELETE FROM payment_methods WHERE code = ?")
      .bind(data.code)
      .run();

    return { ok: true };
  });

export const saveSettings = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .inputValidator((input: { settings: Record<string, unknown> }) =>
    z.object({ settings: z.record(z.any()) }).parse(input),
  )
  .handler(async ({ data }) => {
    await getDB()
      .prepare(
        `INSERT INTO site_settings (id, data, updated_at)
         VALUES (1, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
         data = excluded.data,
         updated_at = excluded.updated_at`,
      )
      .bind(JSON.stringify(data.settings), new Date().toISOString())
      .run();

    return { ok: true };
  });

export const updateOrder = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        orderNo: z.string().trim().min(3).max(30),
        status: z.enum(STATUSES).optional(),
        paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
        trackingNumber: z.string().trim().max(60).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const db = getDB();

    const row = await db
      .prepare("SELECT * FROM orders WHERE order_no = ?")
      .bind(data.orderNo)
      .first<Record<string, unknown>>();

    if (!row) throw new Error("Order not found.");

    const current = rowToOrder(row);
    const now = new Date().toISOString();
    const timeline = [...current.timeline];

    if (data.status && data.status !== current.status) {
      timeline.push({ status: data.status, at: now });
    }

    if (data.paymentStatus && data.paymentStatus !== current.paymentStatus) {
      timeline.push({ status: `Payment ${data.paymentStatus}`, at: now });
    }

    const patchStatus =
      data.paymentStatus === "Verified" &&
      !data.status &&
      current.status === "Payment Verification Pending"
        ? "Confirmed"
        : data.status;

    if (
      patchStatus === "Confirmed" &&
      current.status === "Payment Verification Pending" &&
      !data.status
    ) {
      timeline.push({ status: "Confirmed", at: now });
    }

    const statements = [];

    statements.push(
      db
        .prepare(
          `UPDATE orders SET
           status = ?,
           payment_status = ?,
           tracking_number = ?,
           timeline = ?,
           updated_at = ?
           WHERE order_no = ?`,
        )
        .bind(
          patchStatus ?? current.status,
          data.paymentStatus ?? current.paymentStatus,
          data.trackingNumber !== undefined
            ? data.trackingNumber || null
            : current.trackingNumber ?? null,
          JSON.stringify(timeline),
          now,
          data.orderNo,
        ),
    );

    const finalStatus = patchStatus ?? current.status;
    const restoreStatuses = ["Cancelled", "Refunded", "Returned"];
    let stockRestored = false;

    if (
      restoreStatuses.includes(finalStatus) &&
      !restoreStatuses.includes(current.status)
    ) {
      const lines = current.lines;

      // The migration adds stock_restored. The conditional updates below
      // ensure the same order cannot restore its inventory more than once.
      for (const line of lines) {
        statements.push(
          db
            .prepare(
              `UPDATE products
               SET stock = stock + ?, sold = MAX(0, sold - ?)
               WHERE id = ?
               AND EXISTS (
                 SELECT 1 FROM orders
                 WHERE order_no = ?
                 AND stock_restored = 0
               )`,
            )
            .bind(line.qty, line.qty, line.productId, data.orderNo),
        );
      }

      statements.push(
        db
          .prepare(
            `UPDATE orders SET stock_restored = 1
             WHERE order_no = ? AND stock_restored = 0`,
          )
          .bind(data.orderNo),
      );

      stockRestored = true;
    }

    await db.batch(statements);

    if (data.status && data.status !== current.status) {
      await db
        .prepare(
          `INSERT INTO notifications
           (id, order_no, title, message, type, is_read, created_at)
           VALUES (?, ?, ?, ?, ?, 0, ?)`,
        )
        .bind(
          newId(),
          data.orderNo,
          "Order Status Updated",
          `Your order ${data.orderNo} status is now ${data.status}.`,
          "customer_status_update",
          now,
        )
        .run();
    }

    return { ok: true, stockRestored };
  });

/** Inline inventory adjustment from the admin products table. */
export const adjustStock = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        delta: z.number().int().min(-100000).max(100000).optional(),
        stock: z.number().int().min(0).max(1000000).optional(),
      })
      .refine(
        (value) => value.stock !== undefined || value.delta !== undefined,
        "Provide stock or delta.",
      )
      .parse(input),
  )
  .handler(async ({ data }) => {
    const db = getDB();

    if (data.stock !== undefined) {
      await db
        .prepare("UPDATE products SET stock = ? WHERE id = ?")
        .bind(data.stock, data.id)
        .run();

      return { ok: true, stock: data.stock };
    }

    const result = await db
      .prepare(
        "UPDATE products SET stock = MAX(0, stock + ?) WHERE id = ? RETURNING stock",
      )
      .bind(data.delta ?? 0, data.id)
      .first<{ stock: number }>();

    if (!result) throw new Error("Product not found.");

    return { ok: true, stock: result.stock };
  });

export const getPaymentProofUrl = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .inputValidator((input: { orderNo: string }) =>
    z.object({ orderNo: z.string().trim().min(3).max(30) }).parse(input),
  )
  .handler(async ({ data }) => {
    const row = await getDB()
      .prepare(
        "SELECT payment_screenshot_path FROM orders WHERE order_no = ?",
      )
      .bind(data.orderNo)
      .first<{ payment_screenshot_path: string | null }>();

    const path = row?.payment_screenshot_path;

    if (!path) return { url: null };

    return { url: `/api/media/${encodeURIComponent(path)}` };
  });

export const getAnalytics = createServerFn({ method: "GET" })
  .middleware([requireAdminAuth])
  .handler(async (): Promise<AnalyticsSummary> => {
    const db = getDB();
    const since = new Date(Date.now() - 30 * 86400000).toISOString();

    const [rows, totalRow] = await Promise.all([
      db
        .prepare(
          "SELECT * FROM visits WHERE created_at >= ? ORDER BY created_at DESC LIMIT 5000",
        )
        .bind(since)
        .all(),
      db.prepare("SELECT COUNT(*) AS total FROM visits").first<{
        total: number;
      }>(),
    ]);

    const visits: VisitorRow[] = (rows.results ?? []).map(rowToVisitor);
    const now = Date.now();

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startYesterday = new Date(startOfToday.getTime() - 86400000);

    const at = (visitor: VisitorRow) =>
      new Date(visitor.createdAt).getTime();

    const bySession = new Map<string, VisitorRow>();

    for (const visitor of visits) {
      const existing = bySession.get(visitor.sessionId);
      if (!existing || at(visitor) > at(existing)) {
        bySession.set(visitor.sessionId, visitor);
      }
    }

    const liveVisitors = [...bySession.values()].filter(
      (visitor) => now - at(visitor) < 5 * 60000,
    );

    const dayMap = new Map<string, number>();

    for (const visitor of visits) {
      const day = visitor.createdAt.slice(0, 10);
      dayMap.set(day, (dayMap.get(day) ?? 0) + 1);
    }

    const daily = [...Array(14)].map((_, index) => {
      const date = new Date(
        startOfToday.getTime() - (13 - index) * 86400000,
      )
        .toISOString()
        .slice(0, 10);

      return {
        day: date.slice(5),
        visits: dayMap.get(date) ?? 0,
      };
    });

    const tally = (key: (visitor: VisitorRow) => string) => {
      const map = new Map<string, number>();

      for (const visitor of visits) {
        const value = key(visitor);
        map.set(value, (map.get(value) ?? 0) + 1);
      }

      return [...map.entries()].sort((a, b) => b[1] - a[1]);
    };

    return {
      live: liveVisitors.length,
      today: visits.filter(
        (visitor) => at(visitor) >= startOfToday.getTime(),
      ).length,
      yesterday: visits.filter(
        (visitor) =>
          at(visitor) >= startYesterday.getTime() &&
          at(visitor) < startOfToday.getTime(),
      ).length,
      last7: visits.filter((visitor) => now - at(visitor) < 7 * 86400000)
        .length,
      last30: visits.length,
      total: totalRow?.total ?? visits.length,
      newToday: visits.filter(
        (visitor) =>
          visitor.isNew && at(visitor) >= startOfToday.getTime(),
      ).length,
      daily,
      topPages: tally((visitor) => visitor.path)
        .slice(0, 8)
        .map(([path, visits]) => ({ path, visits })),
      devices: tally((visitor) => visitor.device ?? "unknown")
        .slice(0, 5)
        .map(([device, visits]) => ({ device, visits })),
      liveVisitors: liveVisitors.slice(0, 25),
      recentVisitors: visits.slice(0, 60),
    };
  });
