import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { getOrderByNumber } from "@/lib/shop.functions";
import type { Order } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { formatPKR } from "@/lib/pricing";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/order/$orderId")({
  head: ({ params }) => ({
    meta: [
      { title: `Order ${params.orderId} — Hijabi By Anayah` },
      { name: "description", content: "Your Hijabi By Anayah order confirmation and status." },
      { property: "og:title", content: "Order confirmation — Hijabi By Anayah" },
      { property: "og:description", content: "Thanks for your order. We'll confirm on WhatsApp." },
      { property: "og:url", content: `/order/${params.orderId}` },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: `/order/${params.orderId}` }],
  }),
  component: OrderPage,
});

function OrderPage() {
  const { orderId } = Route.useParams();
  const { settings } = useStore();
  const [order, setOrder] = useState<Order | null>(null);
  useEffect(() => {
    void getOrderByNumber({ data: { orderNo: orderId } })
      .then(setOrder)
      .catch(() => setOrder(null));
  }, [orderId]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="premium-card p-8 text-center">
        <CheckCircle2 className="mx-auto size-14 text-success" />
        <h1 className="mt-4 text-3xl font-bold">Thank you! Order placed</h1>
        <p className="mt-2 text-muted-foreground">
          Order <span className="font-semibold text-foreground">{orderId}</span> — our team will
          confirm on WhatsApp within 30 minutes.
        </p>

        {order ? (
          <div className="mt-8 space-y-3 text-left">
            {order.lines.map((l) => (
              <div key={l.productId} className="flex justify-between text-sm">
                <span>
                  {l.name} × {l.qty}
                </span>
                <span className="font-semibold">{formatPKR(l.lineTotal)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-border pt-3">
              <span className="font-display font-bold">Total</span>
              <span className="font-display text-xl font-bold text-primary">
                {formatPKR(order.total)}
              </span>
            </div>
            <p className="rounded-xl bg-secondary p-3 text-xs">
              Advance due now: {formatPKR(order.advanceDue)} · Status {order.status}
            </p>
          </div>
        ) : (
          <p className="mt-6 text-sm text-muted-foreground">
            We couldn't find this order in this browser. Contact us on WhatsApp for help.
          </p>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <a
              href={`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(`Hi, my order ID is ${orderId}`)}`}
              target="_blank"
              rel="noreferrer"
            >
              Confirm on WhatsApp
            </a>
          </Button>
          <Button variant="secondary" asChild>
            <Link to="/shop">Continue shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
