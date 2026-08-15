import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { FileImage } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatPKR } from "@/lib/pricing";
import { useAdmin } from "@/lib/admin-store";
import { getPaymentProofUrl, updateOrder } from "@/lib/admin.functions";
import { colorImage } from "@/lib/product-image";
import type { OrderStatus } from "@/lib/types";

const STATUSES: OrderStatus[] = [
  "Pending",
  "Confirmed",
  "Packed",
  "Shipped",
  "Delivered",
  "Cancelled",
  "Returned",
  "Refunded",
];

export const Route = createFileRoute("/admin/orders")({
  component: AdminOrders,
});

function AdminOrders() {
  const { orders, products, reload } = useAdmin();
  const setOrderStatus = (orderNo: string, status: string, trackingNumber?: string) => {
    void updateOrder({
      data: { orderNo, status: status as never, ...(trackingNumber ? { trackingNumber } : {}) },
    })
      .then(() => reload())
      .catch(() => undefined);
  };
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const list = orders.filter(
    (o) =>
      (filter === "all" || o.status === filter) &&
      (q.trim() === "" ||
        (o.id + o.customer.fullName + o.customer.phone + o.customer.city)
          .toLowerCase()
          .includes(q.toLowerCase())),
  );

  function exportCsv() {
    const rows = [
      ["Order", "Date", "Name", "Phone", "City", "Payment", "Total", "Status"],
      ...list.map((o) => [
        o.id,
        new Date(o.createdAt).toLocaleString(),
        o.customer.fullName,
        o.customer.phone,
        o.customer.city,
        o.paymentMethod,
        String(o.total),
        o.status,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "anayah-orders.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold sm:text-3xl">Orders</h1>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <div className="flex flex-1 gap-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search order, name..."
            className="flex-1"
            aria-label="Search orders"
          />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-32 sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1 sm:flex-none" onClick={exportCsv}>
            Export
          </Button>
          <Button variant="secondary" className="flex-1 sm:flex-none" onClick={() => window.print()}>
            Print
          </Button>
        </div>
      </div>

      {list.length === 0 ? (
        <p className="premium-card mt-6 p-8 text-center text-sm text-muted-foreground">
          No orders found.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {list.map((o) => (
            <OrderRow key={o.id} order={o} products={products} reload={reload} setOrderStatus={setOrderStatus} />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderRow({ order: o, products, reload, setOrderStatus }: { order: any; products: any[]; reload: () => Promise<void>; setOrderStatus: any }) {
  const [viewingProof, setViewingProof] = useState(false);
  const [proofUrl, setProofUrl] = useState<string | null>(null);

  async function showProof() {
    setViewingProof(true);
    try {
      const { url } = await getPaymentProofUrl({ data: { orderNo: o.id } });
      if (!url) {
        toast.error("No screenshot found for this order.");
        return;
      }
      setProofUrl(url);
    } catch (err) {
      toast.error("Could not load payment screenshot");
    }
  }

  return (
    <div className="premium-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-display font-bold">{o.id}</p>
          <p className="text-xs text-muted-foreground">
            {new Date(o.createdAt).toLocaleString()} · {o.paymentMethod.toUpperCase()}
          </p>
          <p className="mt-2 text-sm">
            {o.customer.fullName} · {o.customer.phone} · {o.customer.city}, {o.customer.province}
          </p>
          <p className="text-xs text-muted-foreground">{o.customer.address}</p>
        </div>
        <div className="text-right">
          <p className="font-display text-xl font-bold text-primary">{formatPKR(o.total)}</p>
          <p className="text-xs text-muted-foreground">Advance due {formatPKR(o.advanceDue)}</p>
          {o.hasScreenshot && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2 h-7 gap-1.5 text-[10px]"
              onClick={showProof}
            >
              <FileImage className="size-3" /> View Receipt
            </Button>
          )}
        </div>
      </div>

      <ul className="mt-4 space-y-2 text-sm">
        {o.lines.map((l: any, i: number) => {
          const product = products.find((p) => p.id === l.productId);
          const img = product ? colorImage(product, l.colorName) : "";
          return (
            <li key={`${l.productId}-${i}`} className="flex gap-3 border-b border-border/40 pb-2 last:border-0 last:pb-0">
              {img ? (
                <img
                  src={img}
                  alt={l.colorName ? `${l.name} — ${l.colorName}` : l.name}
                  loading="lazy"
                  className="size-12 shrink-0 rounded-lg object-cover ring-1 ring-border"
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-2">
                  <span className="font-medium">
                    {l.name} × {l.qty}
                  </span>
                  <span className="text-muted-foreground">{formatPKR(l.lineTotal)}</span>
                </div>
                {l.colorName && (
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Color:</span>
                    <span className="inline-flex items-center rounded-full bg-surface px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ring-border">
                      {l.colorName}
                    </span>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>


      {o.customer.notes && (
        <div className="mt-3 rounded-lg bg-surface p-2.5 text-xs italic text-muted-foreground">
          Note: {o.customer.notes}
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center">
        <div className="flex flex-1 gap-2">
          <Select
            value={o.status}
            onValueChange={(v) => {
              setOrderStatus(o.id, v as OrderStatus);
              toast.success(`Order ${o.id} → ${v}`);
            }}
          >
            <SelectTrigger className="flex-1 sm:w-44 sm:flex-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            defaultValue={o.trackingNumber ?? ""}
            placeholder="Tracking #"
            className="flex-1 sm:max-w-48 sm:flex-none"
            aria-label="Tracking number"
            onBlur={(e) => setOrderStatus(o.id, o.status, e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          {o.paymentStatus !== "Not Required" && o.paymentStatus !== "Verified" && (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                o.paymentStatus === "Rejected"
                  ? "bg-red-100 text-red-700"
                  : "bg-amber-100 text-amber-700",
              )}
            >
              {o.paymentStatus}
            </span>
          )}
          <span className="text-center text-xs text-muted-foreground sm:text-right">
            {o.timeline.length} events
          </span>
        </div>
      </div>

      {viewingProof && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-2 sm:p-8">
          <div className="relative flex max-h-[95vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-card shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b p-4">
              <h3 className="font-display font-bold">Payment Receipt — {o.id}</h3>
              <Button variant="ghost" size="sm" onClick={() => setViewingProof(false)}>
                Close
              </Button>
            </div>
            <div className="flex-1 overflow-auto p-4 flex flex-col items-center gap-4">
              <ul className="w-full space-y-2 rounded-xl bg-surface p-3">
                {o.lines.map((l: any, i: number) => {
                  const product = products.find((p) => p.id === l.productId);
                  const img = product ? colorImage(product, l.colorName) : "";
                  return (
                    <li key={`proof-${l.productId}-${i}`} className="flex items-center gap-3 text-sm">
                      {img ? (
                        <img
                          src={img}
                          alt={l.colorName ? `${l.name} — ${l.colorName}` : l.name}
                          className="size-10 shrink-0 rounded-lg object-cover ring-1 ring-border"
                        />
                      ) : null}
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {l.name} × {l.qty}
                        {l.colorName ? (
                          <span className="ml-2 rounded-full bg-card px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ring-1 ring-inset ring-border">
                            {l.colorName}
                          </span>
                        ) : null}
                      </span>
                      <span className="text-muted-foreground">{formatPKR(l.lineTotal)}</span>
                    </li>
                  );
                })}
              </ul>
              {proofUrl ? (
                <>

                  <a
                    href={proofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cursor-zoom-in"
                    title="Click to open full size"
                  >
                    <img
                      src={proofUrl}
                      alt="Payment Receipt"
                      className="h-auto w-full rounded-lg object-contain shadow-sm"
                    />
                  </a>
                  <div className="sticky bottom-0 mt-auto flex w-full justify-center gap-4 bg-card/80 py-4 backdrop-blur-sm">
                    <Button
                      variant="outline"
                      className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                      onClick={() => {
                        void updateOrder({ data: { orderNo: o.id, paymentStatus: "Verified", status: "Confirmed" } })
                          .then(() => {
                            toast.success("Payment verified & Order confirmed");
                            setViewingProof(false);
                            void reload();
                          })
                          .catch(() => undefined);
                      }}
                    >
                      Verify & Confirm
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        void updateOrder({ data: { orderNo: o.id, paymentStatus: "Rejected", status: "Cancelled" } })
                          .then(() => {
                            toast.error("Payment rejected & Order cancelled");
                            setViewingProof(false);
                            void reload();
                          })
                          .catch(() => undefined);
                      }}
                    >
                      Reject & Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex h-64 items-center justify-center px-12">
                  <p className="animate-pulse text-sm text-muted-foreground">Loading image...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
