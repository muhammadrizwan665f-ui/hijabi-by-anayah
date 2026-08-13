import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPKR } from "@/lib/pricing";
import { useAdmin } from "@/lib/admin-store";
import { updateOrder } from "@/lib/admin.functions";
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
  const { orders, reload } = useAdmin();
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
            <div key={o.id} className="premium-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-display font-bold">{o.id}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(o.createdAt).toLocaleString()} · {o.paymentMethod.toUpperCase()}
                  </p>
                  <p className="mt-2 text-sm">
                    {o.customer.fullName} · {o.customer.phone} · {o.customer.city},{" "}
                    {o.customer.province}
                  </p>
                  <p className="text-xs text-muted-foreground">{o.customer.address}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-xl font-bold text-primary">
                    {formatPKR(o.total)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Advance due {formatPKR(o.advanceDue)}
                  </p>
                </div>
              </div>

              <ul className="mt-4 space-y-1 text-sm">
                {o.lines.map((l) => (
                  <li key={l.productId} className="flex justify-between">
                    <span>
                      {l.name} × {l.qty}
                    </span>
                    <span>{formatPKR(l.lineTotal)}</span>
                  </li>
                ))}
              </ul>

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
                <span className="text-center text-xs text-muted-foreground sm:text-right">
                  {o.timeline.length} events
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
