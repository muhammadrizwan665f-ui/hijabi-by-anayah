import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { getOrderByNumber } from "@/lib/shop.functions";
import type { Order } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPKR } from "@/lib/pricing";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/track")({
  head: () => ({
    meta: [
      { title: "Track Your Order — Hijabi By Anayah" },
      {
        name: "description",
        content: "Enter your Hijabi By Anayah order ID to see live status and tracking updates.",
      },
      { property: "og:title", content: "Track Your Order — Hijabi By Anayah" },
      { property: "og:description", content: "Live order status for every Anayah delivery." },
      { property: "og:url", content: "/track" },
    ],
    links: [{ rel: "canonical", href: "/track" }],
  }),
  component: Track,
});

function Track() {
  useStore();
  const [id, setId] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [searched, setSearched] = useState(false);
  const lookup = () => {
    void getOrderByNumber({ data: { orderNo: id.trim() } })
      .then((o) => {
        setOrder(o);
        setSearched(true);
      })
      .catch(() => {
        setOrder(null);
        setSearched(true);
      });
  };
  void searched;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-bold sm:text-4xl">Track your order</h1>
      <p className="mt-2 text-muted-foreground">Enter the order ID from your confirmation page.</p>
      <div className="mt-6 flex gap-2">
        <Input
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="AG-123456"
          maxLength={20}
          aria-label="Order ID"
        />
        <Button onClick={lookup}>
          Track</Button>
      </div>

      {id && !order ? (
        <p className="mt-6 text-sm text-muted-foreground">No order found with that ID.</p>
      ) : null}

      {order ? (
        <div className="premium-card mt-8 p-6">
          <p className="font-display text-lg font-bold">
            {order.id} · {order.status}
          </p>
          <p className="text-sm text-muted-foreground">
            {order.customer.fullName} · {order.customer.city} · {formatPKR(order.total)}
          </p>
          {order.trackingNumber ? (
            <p className="mt-2 text-sm">Tracking #: {order.trackingNumber}</p>
          ) : null}
          <ol className="mt-5 space-y-3">
            {order.timeline.map((t: { status: string; at: string }, i: number) => (
              <li key={i} className="flex items-center gap-3 text-sm">
                <span className="gradient-brand size-2.5 rounded-full" />
                <span className="font-medium">{t.status}</span>
                <span className="text-muted-foreground">{new Date(t.at).toLocaleString()}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  );
}
