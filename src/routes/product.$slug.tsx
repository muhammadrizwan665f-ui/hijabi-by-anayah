import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BadgeCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Heart,
  RotateCcw,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Countdown } from "@/components/site/countdown";
import { ProductCard } from "@/components/site/product-card";
import { Reveal } from "@/components/site/reveal";
import { discountPct, formatPKR, lineTotal, unitPrice } from "@/lib/pricing";
import { useStore } from "@/lib/store";
import { useServerFn } from "@tanstack/react-start";
import { submitReviewFn } from "@/lib/reviews.functions";

export const Route = createFileRoute("/product/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ")} — Hijabi By Anayah` },
      {
        name: "description",
        content:
          "Premium Anayah modest wear with offer pricing, bundle discounts and cash on delivery across Pakistan.",
      },
      { property: "og:type", content: "product" },
      { property: "og:url", content: `/product/${params.slug}` },
    ],
    links: [{ rel: "canonical", href: `/product/${params.slug}` }],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { products, payments, addToCart, wishlist, toggleWishlist, settings } = useStore();
  const product = products.find((p) => p.slug === slug);
  const [qty, setQty] = useState(1);
  const [img, setImg] = useState(0);
  const [colorIdx, setColorIdx] = useState<number | null>(null);

  // Default to showing all colours (global gallery) initially
  useEffect(() => {
    setImg(0);
    setColorIdx(null);
  }, [product?.id]);

  if (!product) throw notFound();

  const colors = (product.colors ?? []).filter((c) => c.images.length > 0 || c.name);
  const colorSoldOut = (c: { stock?: number | null }) =>
    typeof c.stock === "number" && c.stock <= 0;
  const activeColor = colorIdx === null ? null : (colors[colorIdx] ?? null);
  const gallery =
    activeColor && activeColor.images.length > 0 ? activeColor.images : product.images;

  const allColorsOut = colors.length > 0 && colors.every(colorSoldOut);
  const activeColorOut = activeColor ? colorSoldOut(activeColor) : false;
  const needsColor = colors.length > 0 && colorIdx === null;

  const t = lineTotal(product, qty);
  // const off = discountPct(product);
  const related = products.filter((p) => p.id !== product.id && p.active).slice(0, 4);
  const wished = wishlist.includes(product.id);
  const bestPay = payments.filter((p) => p.enabled).sort((a, b) => b.sortOrder - a.sortOrder)[0];
  const outOfStock = product.stock <= 0 || allColorsOut;
  
  const lowStock = product.stock > 0 && product.stock <= (settings.lowStockThreshold || 5);

  const waText = encodeURIComponent(
    `Assalam o Alaikum! I want to order: ${product.name} (Qty ${qty}) — ${formatPKR(t.total)}`,
  );

  return (
    <div className="mx-auto max-w-7xl px-3 py-1 sm:py-6">
      <nav className="text-sm text-muted-foreground">
        <Link to="/" className="hover:text-primary">
          Home
        </Link>{" "}
        /{" "}
        <Link to="/shop" className="hover:text-primary">
          Shop
        </Link>{" "}
        / <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="mt-2 grid gap-4 lg:grid-cols-2 lg:gap-10">
        <div className="relative">
          <div className="premium-card relative overflow-hidden p-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${activeColor?.name ?? "all"}-${img}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={(_, info) => {
                  const threshold = 50;
                  if (info.offset.x > threshold) {
                    setImg((prev) => (prev > 0 ? prev - 1 : gallery.length - 1));
                  } else if (info.offset.x < -threshold) {
                    setImg((prev) => (prev < gallery.length - 1 ? prev + 1 : 0));
                  }
                }}
                className="cursor-grab touch-pan-y active:cursor-grabbing relative z-0"
              >
                <img
                  src={gallery[img] ?? gallery[0]}
                  alt={activeColor ? `${product.name} — ${activeColor.name}` : product.name}
                  width={1024}
                  height={1024}
                  className="aspect-square w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </motion.div>


            </AnimatePresence>

            {/* Mobile swipe indicator dots */}
            {gallery.length > 1 && (
              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5 sm:hidden">
                {gallery.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i === img ? "w-4 bg-primary" : "w-1.5 bg-primary/30"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Desktop navigation arrows */}
          {gallery.length > 1 && (
            <div className="hidden sm:block">
              <button
                type="button"

                onClick={() => setImg((prev) => (prev > 0 ? prev - 1 : gallery.length - 1))}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-surface/80 p-2 text-primary shadow-sm hover:bg-surface"
                aria-label="Previous image"
              >
                <ChevronLeft className="size-6" />
              </button>
              <button
                type="button"

                onClick={() => setImg((prev) => (prev < gallery.length - 1 ? prev + 1 : 0))}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-surface/80 p-2 text-primary shadow-sm hover:bg-surface"
                aria-label="Next image"
              >
                <ChevronRight className="size-6" />
              </button>
            </div>
          )}
        </div>
        <div>
          <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
            {gallery.map((src, i) => (
              <button
                type="button"

                key={`${src}-${i}`}
                onClick={() => setImg(i)}
                aria-label={`View image ${i + 1}`}
                className={`size-16 shrink-0 overflow-hidden rounded-xl border-2 sm:shrink ${i === img ? "border-primary" : "border-border"}`}
              >
                <img src={src} alt="" loading="lazy" className="size-full object-cover" />
              </button>
            ))}
          </div>

          {colors.length > 0 ? (
            <div className="mt-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">
                  Colour:{" "}
                  <span className="font-normal text-muted-foreground">
                    {activeColor ? activeColor.name : "All Colours"}
                  </span>
                </p>
                {colorIdx !== null && (
                  <button
                    onClick={() => {
                      setColorIdx(null);
                      setImg(0);
                    }}
                    className="text-[10px] font-medium text-primary hover:underline"
                  >
                    View All
                  </button>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    setColorIdx(null);
                    setImg(0);
                  }}
                  className={`flex items-center gap-2 rounded-full border px-2 py-1.5 pr-3 text-xs font-medium transition-colors ${
                    colorIdx === null ? "border-primary text-primary" : "border-border"
                  }`}
                >
                  <span className="flex size-5 items-center justify-center rounded-full border border-border bg-surface text-[8px] font-bold">
                    ALL
                  </span>
                  All
                </button>
                {colors.map((c, i) => {
                  const soldOut = colorSoldOut(c);
                  return (
                    <button
                      key={`${c.name}-${i}`}
                      disabled={soldOut}
                      onClick={() => {
                        if (soldOut) return;
                        setColorIdx(i);
                        setImg(0);
                      }}
                      title={soldOut ? `${c.name} — Sold out` : c.name}
                      aria-label={c.name}
                      className={`flex items-center gap-2 rounded-full border px-2 py-1.5 pr-3 text-xs font-medium transition-colors ${
                        soldOut
                          ? "cursor-not-allowed border-border opacity-50 line-through"
                          : colorIdx === i
                            ? "border-primary text-primary"
                            : "border-border"
                      }`}
                    >
                      <span
                        className="size-5 rounded-full border border-border"
                        style={{ backgroundColor: c.hex || "#C9A88A" }}
                      />
                      {c.name}
                      {soldOut ? (
                        <span className="text-[10px] font-semibold text-destructive">Sold out</span>
                      ) : typeof c.stock === "number" ? (
                        <span className="text-[10px] text-muted-foreground">({c.stock})</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
        
        <div className="flex flex-col gap-2.5">
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
            {product.badges.map((b) => (
              <span
                key={b}
                className="shrink-0 rounded-full border border-primary px-3 py-1 text-xs font-bold text-primary sm:shrink bg-surface"
              >
                {b}
              </span>
            ))}
          </div>

          <div className="flex flex-col gap-0.5 sm:gap-1">
            <h1 className="text-xl font-bold sm:text-3xl">{product.name}</h1>
            <p className="text-xs text-muted-foreground">{product.tagline}</p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`size-3.5 ${i < Math.round(product.rating) ? "fill-warning text-warning" : "text-muted-foreground"}`}
                />
              ))}
            </div>
            <span className="font-semibold">{product.rating}</span>
            <span className="text-muted-foreground">· {product.sold.toLocaleString()} sold</span>
          </div>

          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-display text-3xl font-bold text-primary">
              {formatPKR(unitPrice(product))}
            </span>
          </div>

          <div className="mt-1 grid gap-x-4 gap-y-2 border-y border-primary/10 py-2 text-xs">
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {product.fabric && (
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/70">Fabric</span>
                  <span className="font-medium">{product.fabric}</span>
                </div>
              )}
              {product.texture && (
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/70">Texture</span>
                  <span className="font-medium">{product.texture}</span>
                </div>
              )}
              {product.size && (
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/70">Size</span>
                  <span className="font-medium">{product.size}</span>
                </div>
              )}
            </div>
          </div>

          {product.flashSale && product.flashEndsAt ? (
            <div className="mt-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 sm:mt-5">
              <p className="flex items-center gap-1.5 text-sm font-bold text-destructive">
                <Zap className="size-4" /> Flash sale ends in
              </p>
              <div className="mt-2">
                <Countdown target={product.flashEndsAt} />
              </div>
            </div>
          ) : null}

          {outOfStock ? (
            <p className="text-xs font-semibold text-destructive">Out of Stock</p>
          ) : lowStock ? (
            <p className="text-xs">
              <span className="font-semibold text-destructive">
                Only {product.stock} left
              </span>{" "}
              · live stock
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">In stock · ready to ship</p>
          )}


          <div className="mt-2 flex items-center gap-3">
            <div className="flex items-center gap-1 rounded-full border border-border p-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="size-9 rounded-full"
                aria-label="Decrease quantity"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
              >
                −
              </Button>
              <span className="w-8 text-center font-semibold tabular-nums">{qty}</span>
              <Button
                variant="ghost"
                size="icon"
                className="size-9 rounded-full"
                aria-label="Increase quantity"
                onClick={() => setQty((q) => q + 1)}
              >
                +
              </Button>
            </div>
            <p className="text-xs">
              Total:{" "}
              <span className="font-display text-base font-bold">{formatPKR(t.total)}</span>
            </p>
          </div>

          {lowStock ? (
            <p className="mt-4 text-xs font-semibold text-destructive">
              Only {product.stock} left in stock
            </p>
          ) : null}

          <div className="mt-3 flex flex-col gap-2.5 sm:grid sm:grid-cols-2">
            <Button
              size="lg"
              className="h-12 w-full text-base sm:h-11 sm:text-sm"
              disabled={outOfStock || activeColorOut}
              onClick={() => {
                if (outOfStock || activeColorOut) return;
                if (needsColor) {
                  toast.error("Please select a colour first");
                  return;
                }
                addToCart(product.id, qty, activeColor?.name);
                toast.success("Added to cart", {
                  description: activeColor ? `${product.name} — ${activeColor.name}` : product.name,
                });
              }}
            >
              {outOfStock ? "Out of Stock" : activeColorOut ? "Sold Out" : "Add to Cart"}
            </Button>
            {outOfStock || activeColorOut ? (
              <Button size="lg" variant="secondary" className="h-12 w-full text-base sm:h-11 sm:text-sm" disabled>
                Buy Now
              </Button>
            ) : needsColor ? (
              <Button
                size="lg"
                variant="secondary"
                className="h-12 w-full text-base sm:h-11 sm:text-sm"
                onClick={() => toast.error("Please select a colour first")}
              >
                Buy Now
              </Button>
            ) : (
              <Button size="lg" variant="secondary" className="h-12 w-full text-base sm:h-11 sm:text-sm" asChild>
                <Link
                  to="/checkout"
                  onClick={() => addToCart(product.id, qty, activeColor?.name)}
                >
                  Buy Now
                </Link>
              </Button>
            )}
            <a
              href={`https://wa.me/${settings.whatsapp}?text=${waText}`}
              target="_blank"
              rel="noreferrer"
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-success px-4 py-3 font-semibold text-background transition-transform hover:scale-[1.02] sm:col-span-2 sm:h-11"
            >
              Order on WhatsApp
            </a>
          </div>

          <div className="mt-2 flex gap-3 sm:mt-5">
            <Button variant="ghost" onClick={() => toggleWishlist(product.id)}>
              <Heart className={`mr-1.5 size-4 ${wished ? "fill-destructive text-destructive" : ""}`} />
              {wished ? "In wishlist" : "Add to wishlist"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                void navigator.clipboard?.writeText(window.location.href);
                toast.success("Link copied");
              }}
            >
              <Share2 className="mr-1.5 size-4" /> Share
            </Button>
          </div>

          <div className="mt-3 grid gap-2 sm:mt-6 sm:grid-cols-3">
            {[
              { Icon: Truck, t: "Karachi: 1-3 Working Days | Other Cities : 4-6 Days" },
              { Icon: ShieldCheck, t: product.warranty },
              { Icon: Sparkles, t: "Verified Quality" },
            ].map(({ Icon, t: text }) => (
              <div
                key={text}
                className="flex items-center gap-2 rounded-2xl border border-primary/20 bg-surface p-3 text-xs"
              >
                <Icon className="size-4 shrink-0 text-primary" /> {text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DETAILS */}
      <Tabs 
        defaultValue={
          product.features.length > 0 ? "features" : 
          product.specs.length > 0 ? "specs" : 
          product.included.length > 0 ? "included" : 
          "reviews"
        } 
        className="mt-10 sm:mt-12"
      >
        <TabsList className="no-scrollbar flex w-full justify-start overflow-x-auto pb-1 sm:justify-center">
          {product.features.length > 0 && <TabsTrigger value="features" className="shrink-0">Features</TabsTrigger>}
          {product.specs.length > 0 && <TabsTrigger value="specs" className="shrink-0">Specifications</TabsTrigger>}
          {product.included.length > 0 && <TabsTrigger value="included" className="shrink-0">What's Included</TabsTrigger>}
          <TabsTrigger value="reviews" className="shrink-0">Reviews ({product.reviews.length})</TabsTrigger>
          {product.faqs.length > 0 && <TabsTrigger value="faq" className="shrink-0">FAQs</TabsTrigger>}
        </TabsList>

        {product.features.length > 0 && (
          <TabsContent value="features" className="premium-card mt-5 p-6">
            <p className="text-muted-foreground">{product.description}</p>
            <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
              {product.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" /> {f}
                </li>
              ))}
            </ul>
          </TabsContent>
        )}

        {product.specs.length > 0 && (
          <TabsContent value="specs" className="premium-card mt-5 p-6">
            <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {product.specs.map((s) => (
                <div key={s.label} className="flex justify-between gap-4 border-b border-primary/10 pb-2 text-sm">
                  <dt className="text-muted-foreground">{s.label}</dt>
                  <dd className="font-medium">{s.value}</dd>
                </div>
              ))}
            </dl>
          </TabsContent>
        )}

        {product.included.length > 0 && (
          <TabsContent value="included" className="premium-card mt-5 p-6">
            <ul className="space-y-2.5">
              {product.included.map((i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <BadgeCheck className="size-4 text-primary" /> {i}
                </li>
              ))}
            </ul>
          </TabsContent>
        )}

        <TabsContent value="reviews" className="mt-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h3 className="font-display text-xl font-bold">Customer Feedback</h3>
            <Dialog>
              <DialogTrigger asChild>
                <Button>Write a Review</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <ReviewForm productId={product.id} onComplete={() => window.location.reload()} />
              </DialogContent>
            </Dialog>
          </div>

          {product.reviews.length === 0 ? (
            <p className="premium-card p-6 text-muted-foreground">
              No reviews yet — be the first to review this product.
            </p>
          ) : (
            <div className="no-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:grid sm:overflow-visible sm:px-0 sm:pb-0">
              {product.reviews.map((r) => (
                <div key={r.id} className="premium-card w-[85vw] shrink-0 p-6 sm:w-full">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-display font-semibold">{r.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.name} · {r.city} · {r.date && !isNaN(new Date(r.date).getTime()) ? new Date(r.date).toLocaleDateString() : "Recently"}
                        {r.verified ? (
                          <span className="ml-1 font-semibold text-primary">Verified purchase</span>
                        ) : null}
                      </p>
                    </div>
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          className={`size-4 ${i < r.rating ? "fill-warning text-warning" : "text-muted-foreground/30"}`} 
                        />
                      ))}
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{r.body}</p>
                  {r.adminReply ? (
                    <p className="mt-3 rounded-2xl bg-surface border border-primary/10 p-3 text-sm">
                      <span className="font-semibold">Hijabi By Anayah:</span> {r.adminReply}
                    </p>
                  ) : null}
                  <p className="mt-3 text-xs text-muted-foreground">{r.helpful} people found this helpful</p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {product.faqs.length > 0 && (
          <TabsContent value="faq" className="premium-card mt-5 p-6">
            <Accordion type="single" collapsible>
              {product.faqs.map((f, i) => (
                <AccordionItem key={f.q} value={`f${i}`}>
                  <AccordionTrigger>{f.q}</AccordionTrigger>
                  <AccordionContent>{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </TabsContent>
        )}
      </Tabs>

      <section className="mt-20">
        <h2 className="text-2xl font-bold">You may also like</h2>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {related.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </section>

      {/* Sticky mobile buy bar */}
      <Reveal className="fixed inset-x-0 bottom-0 z-40 lg:hidden">
        <div className="glass flex items-center gap-3 border-t border-primary/20 p-3 pb-safe-bottom">
          <div className="flex-1 min-w-0">
            <p className="font-display text-base font-bold leading-tight truncate sm:text-lg">{formatPKR(t.total)}</p>
            {outOfStock ? (
              <p className="text-[10px] font-semibold text-destructive leading-tight sm:text-[11px]">Out of Stock</p>
            ) : lowStock ? (
              <p className="text-[10px] font-semibold text-destructive leading-tight sm:text-[11px]">Only {product.stock} left</p>
            ) : null}
          </div>
          <Button
            size="sm"
            className="h-10 px-3 text-xs sm:h-11 sm:px-4 sm:text-sm"
            disabled={outOfStock || activeColorOut}

            onClick={() => {
              if (outOfStock || activeColorOut) return;
              if (needsColor) {
                toast.error("Please select a colour first");
                return;
              }
              addToCart(product.id, qty, activeColor?.name);
              toast.success("Added to cart");
            }}
          >
            Add to Cart
          </Button>
          {outOfStock || activeColorOut ? (
            <Button variant="secondary" size="sm" className="h-10 px-3 text-xs sm:h-11 sm:px-4 sm:text-sm" disabled>
              Buy Now
            </Button>
          ) : needsColor ? (
            <Button
              variant="secondary"
              size="sm"
              className="h-10 px-3 text-xs sm:h-11 sm:px-4 sm:text-sm"
              onClick={() => toast.error("Please select a colour first")}
            >
              Buy Now
            </Button>
          ) : (
            <Button variant="secondary" size="sm" className="h-10 px-3 text-xs sm:h-11 sm:px-4 sm:text-sm" asChild>
              <Link to="/checkout" onClick={() => addToCart(product.id, qty, activeColor?.name)}>
                Buy Now
              </Link>
            </Button>
          )}
        </div>
      </Reveal>
    </div>
  );
}

function ReviewForm({ productId, onComplete }: { productId: string; onComplete: () => void }) {
  const submitReview = useServerFn(submitReviewFn);
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(5);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      await submitReview({
        data: {
          productId,
          review: {
            name: fd.get("name") as string,
            city: fd.get("city") as string,
            rating,
            title: fd.get("title") as string,
            body: fd.get("body") as string,
          },
        },
      });
      toast.success("Review submitted! Thank you for your feedback.");
      onComplete();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Write a Review</DialogTitle>
        <DialogDescription>
          Share your experience with other customers.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" name="name" placeholder="E.g. Ayesha Khan" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" name="city" placeholder="E.g. Lahore" required />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Rating</Label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"

                onClick={() => setRating(s)}
                className="transition-transform active:scale-90"
              >
                <Star
                  className={`size-6 ${s <= rating ? "fill-warning text-warning" : "text-muted-foreground/30"}`}
                />
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="title">Review Title</Label>
          <Input id="title" name="title" placeholder="Summary of your experience" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="body">Your Review</Label>
          <Textarea
            id="body"
            name="body"
            placeholder="What did you like or dislike?"
            className="min-h-[100px]"
            required
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading ? "Submitting..." : "Post Review"}
        </Button>
      </DialogFooter>
    </form>
  );
}
