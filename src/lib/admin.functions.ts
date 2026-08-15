import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
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
import type { AnalyticsSummary, Notification, Product, VisitorRow } from "./types";

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

async function assertAdmin(context: { supabase: any; userId: string }) {
  // Direct check against user_roles table instead of RPC to avoid any function-level permission issues
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();

  if (error) {
    console.error("Error checking admin role:", error);
    throw new Error(`Forbidden: admin access only (Database error: ${error.message})`);
  }
  if (!data) throw new Error("Forbidden: admin access only.");
}

export const getAdminBootstrap = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as never);
    const supabase = context.supabase;
    const [products, payments, orders, settings, notifications] = await Promise.all([
      supabase.from("products").select("*").order("sort_order"),
      supabase.from("payment_methods").select("*").order("sort_order"),
      supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("site_settings").select("data").maybeSingle(),
      supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50),
    ]);
    return {
      products: (products.data ?? []).map(rowToProduct),
      payments: (payments.data ?? []).map(rowToPayment),
      orders: (orders.data ?? []).map(rowToOrder),
      settings: toSettings(settings.data?.data),
      notifications: (notifications.data ?? []).map(rowToNotification),
    };
  });

export const markNotificationRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { error } = await context.supabase
      .from("notifications")
      .update({ is_read: true } as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const markAllNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as never);
    const { error } = await context.supabase
      .from("notifications")
      .update({ is_read: true } as never)
      .eq("is_read", false);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { product: Product }) => z.object({ product: z.any() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const row = productToRow(data.product);
    if (data.product.id) {
      const { error } = await context.supabase.from("products").update(row as never).eq("id", data.product.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("products").insert(row as never);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const deleteProductFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { error } = await context.supabase.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const duplicateProductFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { data: row } = await context.supabase.from("products").select("*").eq("id", data.id).single();
    const product = rowToProduct(row as Record<string, unknown>);
    const stamp = Date.now().toString(36).slice(-4);
    const copy = productToRow({
      ...product,
      name: `${product.name} (Copy)`,
      slug: `${product.slug}-copy-${stamp}`,
      sku: `${product.sku}-C${stamp.toUpperCase()}`,
      active: false,
      sold: 0,
    });
    const { error } = await context.supabase.from("products").insert(copy as never);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const uploadProductImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { dataUrl: string; name: string }) =>
    z.object({ dataUrl: z.string().max(6_000_000), name: z.string().max(200) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const match = /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(data.dataUrl);
    if (!match) throw new Error("Please upload a PNG, JPG or WEBP image.");
    const contentType = match[1]!;
    const bytes = Buffer.from(match[2]!, "base64");
    if (bytes.byteLength > 5_000_000) throw new Error("Image must be under 5MB.");
    const ext = contentType.split("/")[1];
    const path = `products/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await context.supabase.storage
      .from("product-images")
      .upload(path, bytes, { contentType, upsert: false });
    if (error) throw new Error(error.message);
    const { data: signed } = await context.supabase.storage
      .from("product-images")
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
    if (!signed?.signedUrl) throw new Error("Could not generate the image link.");
    return { url: signed.signedUrl };
  });

export const savePaymentMethod = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { method: ReturnType<typeof rowToPayment> }) => z.object({ method: z.any() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const row = paymentToRow(data.method);
    const { error } = await context.supabase
      .from("payment_methods")
      .upsert(row as never, { onConflict: "code" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deletePaymentMethod = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { code: string }) =>
    z.object({ code: z.string().trim().min(2).max(40) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { error } = await context.supabase.from("payment_methods").delete().eq("code", data.code);
    if (error) throw new Error(error.message);
    return { ok: true };
  });


export const saveSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { settings: Record<string, unknown> }) => z.object({ settings: z.record(z.any()) }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { error } = await context.supabase
      .from("site_settings")
      .upsert({ id: true, data: data.settings as never, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        orderNo: z.string().trim().min(3).max(30),
        status: z.enum(STATUSES).optional(),
        paymentStatus: z.enum(["Not Required", "Pending Verification", "Verified", "Rejected"]).optional(),
        trackingNumber: z.string().trim().max(60).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { data: row } = await context.supabase
      .from("orders")
      .select("*")
      .eq("order_no", data.orderNo)
      .single();
    const current = rowToOrder(row as Record<string, unknown>);
    const now = new Date().toISOString();
    const timeline = [...current.timeline];
    if (data.status && data.status !== current.status) timeline.push({ status: data.status, at: now });
    if (data.paymentStatus && data.paymentStatus !== current.paymentStatus) {
      timeline.push({ status: `Payment ${data.paymentStatus}`, at: now });
    }

    const patch: Record<string, unknown> = { timeline, updated_at: now };
    if (data.status) patch["status"] = data.status;
    if (data.paymentStatus) patch["payment_status"] = data.paymentStatus;
    if (data.trackingNumber !== undefined) patch["tracking_number"] = data.trackingNumber || null;
    if (data.paymentStatus === "Verified" && !data.status && current.status === "Payment Verification Pending") {
      patch["status"] = "Confirmed";
      timeline.push({ status: "Confirmed", at: now });
    }

    const { error } = await context.supabase.from("orders").update(patch as never).eq("order_no", data.orderNo);
    if (error) throw new Error(error.message);

    // Notification for Customer on status update
    if (data.status && data.status !== current.status) {
      // In a real app, we might find the user_id associated with this order's phone/email
      // For now, we'll just insert a notification without a user_id (publicly trackable by order number)
      await context.supabase.from("notifications").insert({
        order_no: data.orderNo,
        title: "Order Status Updated",
        message: `Your order ${data.orderNo} status is now ${data.status}.`,
        type: "customer_status_update",
        is_read: false,
      });
    }

    // Inventory: give stock back once when an order is cancelled/refunded/returned.
    const finalStatus = (patch["status"] as string | undefined) ?? current.status;
    const RESTORE = ["Cancelled", "Refunded", "Returned"];
    let stockRestored = false;
    if (RESTORE.includes(finalStatus) && !RESTORE.includes(current.status)) {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: restored } = await supabaseAdmin.rpc("restore_order_stock", {
        _order_no: data.orderNo,
      });
      stockRestored = Boolean(restored);
    }
    return { ok: true, stockRestored };
  });

/** Inline inventory adjustment from the admin products table. */
export const adjustStock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        delta: z.number().int().min(-100000).max(100000).optional(),
        stock: z.number().int().min(0).max(1000000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { data: row, error: readError } = await context.supabase
      .from("products")
      .select("stock")
      .eq("id", data.id)
      .single();
    if (readError) throw new Error(readError.message);
    const currentStock = Number((row as { stock: number }).stock ?? 0);
    const next =
      data.stock !== undefined ? data.stock : Math.max(0, currentStock + (data.delta ?? 0));
    const { error } = await context.supabase
      .from("products")
      .update({ stock: next } as never)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true, stock: next };
  });

export const getPaymentProofUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { orderNo: string }) =>
    z.object({ orderNo: z.string().trim().min(3).max(30) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as never);
    const { data: row } = await context.supabase
      .from("orders")
      .select("payment_screenshot_path")
      .eq("order_no", data.orderNo)
      .single();
    const path = (row as { payment_screenshot_path: string | null } | null)?.payment_screenshot_path;
    if (!path) return { url: null };
    const { data: signed } = await context.supabase.storage
      .from("payment-proofs")
      .createSignedUrl(path, 60 * 10);
    return { url: signed?.signedUrl ?? null };
  });

export const getAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AnalyticsSummary> => {
    await assertAdmin(context as never);
    const since = new Date(Date.now() - 30 * 86400000).toISOString();
    const { data: rows } = await context.supabase
      .from("visits")
      .select("*")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(5000);
    const { count: total } = await context.supabase
      .from("visits")
      .select("id", { count: "exact", head: true });

    const visits: VisitorRow[] = (rows ?? []).map(rowToVisitor);
    const now = Date.now();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startYesterday = new Date(startOfToday.getTime() - 86400000);

    const at = (v: VisitorRow) => new Date(v.createdAt).getTime();
    const bySession = new Map<string, VisitorRow>();
    for (const v of visits) if (!bySession.has(v.sessionId)) bySession.set(v.sessionId, v);

    const liveVisitors = [...bySession.values()].filter((v) => now - at(v) < 5 * 60000);
    const dayMap = new Map<string, number>();
    for (const v of visits) {
      const day = v.createdAt.slice(0, 10);
      dayMap.set(day, (dayMap.get(day) ?? 0) + 1);
    }
    const daily = [...Array(14)].map((_, i) => {
      const d = new Date(startOfToday.getTime() - (13 - i) * 86400000).toISOString().slice(0, 10);
      return { day: d.slice(5), visits: dayMap.get(d) ?? 0 };
    });

    const tally = (key: (v: VisitorRow) => string) => {
      const m = new Map<string, number>();
      for (const v of visits) m.set(key(v), (m.get(key(v)) ?? 0) + 1);
      return [...m.entries()].sort((a, b) => b[1] - a[1]);
    };

    return {
      live: liveVisitors.length,
      today: visits.filter((v) => at(v) >= startOfToday.getTime()).length,
      yesterday: visits.filter(
        (v) => at(v) >= startYesterday.getTime() && at(v) < startOfToday.getTime(),
      ).length,
      last7: visits.filter((v) => now - at(v) < 7 * 86400000).length,
      last30: visits.length,
      total: total ?? visits.length,
      newToday: visits.filter((v) => v.isNew && at(v) >= startOfToday.getTime()).length,
      daily,
      topPages: tally((v) => v.path)
        .slice(0, 8)
        .map(([path, visits]) => ({ path, visits })),
      devices: tally((v) => v.device ?? "unknown")
        .slice(0, 5)
        .map(([device, visits]) => ({ device, visits })),
      liveVisitors: liveVisitors.slice(0, 25),
      recentVisitors: visits.slice(0, 60),
    };
  });
