import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Minus, Plus, ShieldCheck, Tag, Trash2, Truck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Reveal } from "@/components/site/reveal";
import { computeTotals, formatPKR, lineTotal, unitPrice } from "@/lib/pricing";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart — Hijabi By Anayah" },
      {
        name: "description",
        content:
          "Review your Hijabi By Anayah cart, apply coupon codes, see bundle discounts and continue to checkout.",
      },
      { property: "og:title", content: "Your Cart — Hijabi By Anayah" },
      { property: "og:description", content: "Bulk discounts and coupons applied instantly." },
      { property: "og:url", content: "/cart" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/cart" }],
  }),
  component: Cart,
});

function Cart() {
  const { cart, products, setQty, removeFromCart, coupons, payments, settings } = useStore();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState<{ code: string; pct: number } | null>(null);

  const lines = cart
    .map((l) => ({ product: products.find((p) => p.id === l.productId)!, qty: l.qty }))
    .filter((l) => l.product);

  const bestMethod = payments.filter((p) => p.enabled).sort((a, b) => b.discountPct - a.discountPct)[0] ?? null;

  const totals = computeTotals({
    lines,
    method: null,
    couponPct: applied?.pct ?? 0,
    settings,
  });
  const bestTotals = computeTotals({
    lines,
    method: bestMethod,
    couponPct: applied?.pct ?? 0,
    settings,
  });

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-3xl font-bold">Your cart is empty</h1>
        <p className="mt-3 text-muted-foreground">
          Add a hijab and unlock bundle discounts from 2 pieces onwards.
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
          {lines.map(({ product, qty }, i) => {
            const t = lineTotal(product, qty);
            return (
              <Reveal key={product.id} delay={i * 0.05}>
                <div className="premium-card flex gap-4 p-4">
                  <Link to="/product/$slug" params={{ slug: product.slug }} className="shrink-0">
                    <img
                      src={product.images[0]}
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
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {formatPKR(unitPrice(product))} each
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Remove item"
                        onClick={() => removeFromCart(product.id)}
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
                          onClick={() => setQty(product.id, qty - 1)}
                        >
                          <Minus className="size-3.5" />
                        </Button>
                        <span className="w-8 text-center font-semibold tabular-nums">{qty}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-full"
                          aria-label="Increase quantity"
                          onClick={() => setQty(product.id, qty + 1)}
                        >
                          <Plus className="size-3.5" />
                        </Button>
                      </div>
                      <div className="sm:text-right">
                        {t.rule ? (
                          <p className="text-xs font-semibold text-success">
                            Bulk {t.rule.discountPct}% off applied (-{formatPKR(t.bulk)})
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Buy {product.bulkRules[0]?.minQty ?? 2}+ and save{" "}
                            {product.bulkRules[0]?.discountPct ?? 10}%
                          </p>
                        )}
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

          <form
            className="mt-5 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const found = coupons.find(
                (c) => c.active && c.code.toLowerCase() === code.trim().toLowerCase(),
              );
              if (!found) {
                toast.error("Invalid coupon code");
                return;
              }
              if (totals.subtotal - totals.bulkDiscount < found.minOrder) {
                toast.error(`Minimum order for ${found.code} is ${formatPKR(found.minOrder)}`);
                return;
              }
              setApplied({ code: found.code, pct: found.discountPct });
              toast.success(`${found.code} applied — ${found.discountPct}% off`);
            }}
          >
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Promo code (try ANAYAH10)"
              maxLength={24}
              aria-label="Promo code"
            />
            <Button type="submit" variant="secondary">
              Apply
            </Button>
          </form>

          <dl className="mt-6 space-y-2.5 text-sm">
            <Row label="Subtotal" value={formatPKR(totals.subtotal)} />
            {totals.bulkDiscount > 0 ? (
              <Row
                label="Bulk quantity discount"
                value={`-${formatPKR(totals.bulkDiscount)}`}
                accent
              />
            ) : null}
            {applied ? (
              <Row
                label={`Coupon ${applied.code}`}
                value={`-${formatPKR(totals.couponDiscount)}`}
                accent
              />
            ) : null}
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

          {bestMethod ? (
            <div className="mt-4 rounded-2xl border border-success/40 bg-success/10 p-4">
              <p className="flex items-center gap-1.5 text-sm font-bold text-success">
                <Tag className="size-4" /> Save {bestMethod.discountPct}% with advance payment
              </p>
              <p className="mt-1 text-sm">
                Pay via {bestMethod.label} and your total drops to{" "}
                <span className="font-display font-bold">{formatPKR(bestTotals.total)}</span>
              </p>
            </div>
          ) : null}

          <Button size="lg" className="mt-5 w-full" onClick={() => navigate({ to: "/checkout" })}>
            Proceed to Checkout
          </Button>

          <ul className="mt-5 space-y-2 text-xs text-muted-foreground">
            <li className="flex items-center gap-2">
              <Truck className="size-4 text-primary" /> Estimated delivery: 1-3 working days
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" /> Secure checkout & easy 7-day exchange
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
