import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Minus, Plus, ShieldCheck, Tag, Trash2, Truck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Reveal } from "@/components/site/reveal";
import { computeTotals, formatPKR, lineTotal, unitPrice } from "@/lib/pricing";
import { useStore } from "@/lib/store";
import { colorImage } from "@/lib/product-image";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart — Hijabi By Anayah" },
      {
        name: "description",
        content:
          "Review your Hijabi By Anayah cart and continue to checkout.",
      },
      { property: "og:title", content: "Your Cart — Hijabi By Anayah" },
      { property: "og:description", content: "Secure checkout for Pakistan." },
      { property: "og:url", content: "/cart" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/cart" }],
  }),
  component: Cart,
});

function Cart() {
  const { cart, products, setQty, removeFromCart, payments, settings } = useStore();
  const navigate = useNavigate();

  const lines = cart
    .map((l) => ({
      product: products.find((p) => p.id === l.productId)!,
      qty: l.qty,
      colorName: l.colorName,
    }))
    .filter((l) => l.product);

  const bestMethod = payments.filter((p) => p.enabled).sort((a, b) => b.discountPct - a.discountPct)[0] ?? null;

  const totals = computeTotals({
    lines,
    method: null,
    couponPct: 0,
    settings,
  });
  const bestTotals = computeTotals({
    lines,
    method: bestMethod,
    couponPct: 0,
    settings,
  });

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-3xl font-bold">Your cart is empty</h1>
        <p className="mt-3 text-muted-foreground">
          Your cart is currently empty.
        </p>
        <Button className="mt-7" size="lg" asChild>
          <Link to="/shop">Start shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="text-3xl font-bold sm:text-4xl">Your Cart</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          {lines.map(({ product, qty, colorName }, i) => {
            const t = lineTotal(product, qty);
            return (
              <Reveal key={`${product.id}-${colorName ?? ""}`} delay={i * 0.05}>
                <div className="premium-card flex gap-4 p-4">
                  <Link to="/product/$slug" params={{ slug: product.slug }} className="shrink-0">
                    <img
                      src={colorImage(product, colorName)}
                      alt={product.name}
                      loading="lazy"
                      width={1024}
                      height={1024}
                      className="size-24 rounded-2xl object-cover sm:size-28"
                    />
                  </Link>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          to="/product/$slug"
                          params={{ slug: product.slug }}
                          className="font-display font-semibold hover:text-primary"
                        >
                          {product.name}
                        </Link>
                        {colorName ? (
                          <p className="mt-0.5 text-xs font-medium">
                            Colour: <span className="text-muted-foreground">{colorName}</span>
                          </p>
                        ) : null}
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {formatPKR(unitPrice(product))} each
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Remove item"
                        onClick={() => removeFromCart(product.id, colorName)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>

                    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex w-fit items-center gap-1 rounded-full border border-border p-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-full"
                          aria-label="Decrease quantity"
                          onClick={() => setQty(product.id, qty - 1, colorName)}
                        >
                          <Minus className="size-3.5" />
                        </Button>
                        <span className="w-8 text-center font-semibold tabular-nums">{qty}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-full"
                          aria-label="Increase quantity"
                          onClick={() => setQty(product.id, qty + 1, colorName)}
                        >
                          <Plus className="size-3.5" />
                        </Button>
                      </div>
                      <div className="sm:text-right">
                        <p className="font-display text-lg font-bold">{formatPKR(t.total)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        <aside className="premium-card h-fit p-6 lg:sticky lg:top-28">
          <h2 className="font-display text-lg font-bold">Order Summary</h2>


          <dl className="mt-6 space-y-2.5 text-sm">
            <Row label="Subtotal" value={formatPKR(totals.subtotal)} />
            <Row
              label="Delivery"
              value={totals.shipping === 0 ? "FREE" : formatPKR(totals.shipping)}
            />
            <div className="flex items-baseline justify-between border-t border-primary/20 pt-3">
              <dt className="font-display font-bold">Total (COD)</dt>
              <dd className="font-display text-2xl font-bold text-primary">
                {formatPKR(totals.total)}
              </dd>
            </div>
          </dl>


          <Button size="lg" className="mt-5 w-full" onClick={() => navigate({ to: "/checkout" })}>
            Proceed to Checkout
          </Button>

          <ul className="mt-5 space-y-2 text-xs text-muted-foreground">
            <li className="flex items-center gap-2">
              <Truck className="size-4 text-primary" /> Estimated delivery: 1-3 working days
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" /> Secure checkout & verified quality
            </li>
          </ul>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={accent ? "font-semibold text-success" : "font-medium"}>{value}</dd>
    </div>
  );
}
