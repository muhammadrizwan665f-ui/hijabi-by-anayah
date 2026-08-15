import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { ArrowRight, RotateCcw, ShieldCheck, Sparkles, Star, Truck, Wallet, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductCard } from "@/components/site/product-card";
import { Reveal, SectionHeading } from "@/components/site/reveal";
import { CATEGORIES, SEED_SETTINGS } from "@/lib/seed";
import { formatPKR, unitPrice } from "@/lib/pricing";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hijabi By Anayah — Premium Hijabs, Namaz Chadars & Accessories" },
      {
        name: "description",
        content:
          "Shop premium hijabs, namaz chadars, undercaps and hijab accessories in Pakistan. Cash on delivery and free shipping over Rs 5,000.",
      },
      { property: "og:title", content: "Hijabi By Anayah — Premium Modest Wear" },
      {
        property: "og:description",
        content: "Handpicked hijabs and namaz chadars with nationwide cash on delivery.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

const TRUST = [
  { Icon: Truck, title: "Fast Delivery", text: "2-4 days nationwide" },
  { Icon: Wallet, title: "Cash on Delivery", text: "Pay when it arrives" },
  { Icon: ShieldCheck, title: "Premium Fabrics", text: "Hand-checked quality" },
  { Icon: Sparkles, title: "Ethical Sourcing", text: "Direct from makers" },
];

function Home() {
  const { products, settings } = useStore();
  const [heroIndex, setHeroIndex] = useState(0);

  const active = products.filter((p) => p.active);
  const flash = active.filter((p) => p.flashSale);
  const best = [...active].sort((a, b) => b.sold - a.sold).slice(0, 4);
  const trending = [...active].sort((a, b) => b.rating - a.rating).slice(0, 4);

  // Filter out empty slides if they exist in DB
  const slides = (settings.heroSlides || []).filter(s => s.image || s.mobileImage).length
    ? settings.heroSlides!.filter(s => s.image || s.mobileImage)
    : SEED_SETTINGS.heroSlides!;

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const currentSlide = slides[heroIndex];

  return (
    <>
      {/* HERO BANNER SLIDER */}
      <section className="relative w-full overflow-hidden bg-surface">
        <div className="relative w-full overflow-hidden">
          {/* Desktop Banner: aspect ratio preserved, visible only on sm+ */}
          <div className="relative hidden aspect-[1536/310] max-h-[420px] min-h-[190px] w-full sm:block">
            <AnimatePresence mode="wait">
              <motion.div
                key={heroIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="absolute inset-0"
              >
                <div className="h-full w-full">
                  <img
                    src={currentSlide?.image}
                    alt={currentSlide?.title || "Hijabi By Anayah collection banner"}
                    className="h-full w-full object-cover"
                  />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Mobile Banner: 2:1 ratio for better mobile display, visible only on < sm */}
          <div className="relative block aspect-[2/1] w-full sm:hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={`mobile-${heroIndex}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="absolute inset-0"
              >
                <div className="h-full w-full">
                  <img
                    src={currentSlide?.mobileImage || currentSlide?.image}
                    alt={currentSlide?.title || "Hijabi By Anayah collection banner"}
                    className="h-full w-full object-cover"
                  />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {slides.length > 1 && (
            <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-2 sm:bottom-5">
              {slides.map((_: any, i: number) => (
                <button
                  key={i}
                  onClick={() => setHeroIndex(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === heroIndex ? "w-6 bg-primary" : "w-2 bg-primary/30"
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>





      {/* PRODUCT TICKER */}
      {(settings.showTicker ?? true) && (
        <section className="overflow-hidden border-y border-primary/10 bg-surface py-2.5">
          <div className="flex whitespace-nowrap">
            <motion.div
              initial={{ x: 0 }}
              animate={{ x: "-50%" }}
              transition={{
                duration:
                  settings.tickerSpeed === "fast"
                    ? 15
                    : settings.tickerSpeed === "slow"
                      ? 45
                      : 30,
                repeat: Infinity,
                ease: "linear",
              }}
              className="flex items-center gap-6 px-3"
            >
              {[...active, ...active, ...active].map((p, i) => (
                <Link
                  key={`${p.id}-${i}`}
                  to="/product/$slug"
                  params={{ slug: p.slug }}
                  className="group flex w-[180px] shrink-0 items-center gap-3 rounded-full border border-primary/10 bg-surface px-4 py-2 shadow-sm transition-all hover:border-primary hover:shadow-md"
                >
                  <img
                    src={p.images[0] ?? "/placeholder.svg"}
                    alt={p.name}
                    className="size-11 flex-shrink-0 rounded-full object-cover outline outline-2 outline-offset-2 outline-transparent transition-all group-hover:outline-primary"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="truncate text-xs font-bold leading-tight">{p.name}</span>
                    <span className="text-[11px] font-bold text-primary">
                      {formatPKR(unitPrice(p))}
                    </span>
                  </div>
                </Link>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* Professional Category Selection */}
      <section className="mx-auto max-w-7xl px-4 pt-2">
        <div className="flex justify-center border-b border-primary/10 pb-2">
          <Select
            onValueChange={(val) => {
              if (val) window.location.href = `/shop?category=${encodeURIComponent(val)}`;
            }}
          >
            <SelectTrigger className="h-10 w-60 rounded-full border-primary/20 bg-surface px-6 text-[10px] font-bold uppercase tracking-[0.2em] shadow-sm transition-all hover:border-primary">
              <div className="flex items-center gap-3">
                <Sparkles className="size-3.5 text-primary" />
                <SelectValue placeholder="FILTER COLLECTIONS" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-primary/10 p-2 shadow-premium">
              {(settings.categories?.length ? settings.categories : CATEGORIES).map((c) => (
                <SelectItem
                  key={c.id}
                  value={c.name}
                  className="rounded-xl py-2.5 text-[10px] font-bold uppercase tracking-wider"
                >
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* TRENDING */}
      <section className="mx-auto max-w-7xl px-4 pt-4">
        <SectionHeading eyebrow="Trending" title="Highest rated right now" />
        <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-5 lg:grid-cols-4">
          {trending.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </section>

      {/* FLASH DEALS */}
      {flash.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 pt-2">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-4">
              <div className="pt-4">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary bg-surface">
                  <Zap className="size-3.5" /> Limited Offer
                </span>
                <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Weekly Highlights</h2>
              </div>
            </div>
            <Button variant="secondary" asChild>
              <Link to="/deals">View all offers</Link>
            </Button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:gap-5 lg:grid-cols-4">
            {flash.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      ) : null}

      {/* BEST SELLERS */}
      <section className="mx-auto max-w-7xl px-4 pt-3">
        <SectionHeading
          eyebrow="Best Selling"
          title="Most loved this month"
          subtitle="Ranked by real orders delivered across Pakistan."
        />
        <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-5 lg:grid-cols-4">
          {best.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </section>

      {/* ALL PRODUCTS (if needed more volume) */}
      <section className="mx-auto max-w-7xl px-4 pt-4">
        <SectionHeading
          eyebrow="Our Catalog"
          title="The full collection"
          subtitle="Every piece in stock and ready to ship."
        />
        <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-5 lg:grid-cols-4">
          {active.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </section>


      {/* REVIEWS */}
      <section className="mt-6 border-y border-primary/10 bg-surface py-8">
        <div className="mx-auto max-w-7xl px-4">
          <SectionHeading
            eyebrow="Reviews"
            title="Loved by 600,000+ customers"
            subtitle="Verified reviews from real delivered orders."
          />
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {active
              .flatMap((p) => p.reviews.map((r) => ({ ...r, product: p.name })))
              .slice(0, 3)
              .map((r, i) => (
                <Reveal key={r.id} delay={i * 0.08}>
                  <figure className="premium-card h-full p-6">
                    <div className="flex gap-0.5">
                      {Array.from({ length: r.rating }).map((_, k) => (
                        <Star key={k} className="size-4 fill-warning text-warning" />
                      ))}
                    </div>
                    <blockquote className="mt-3">
                      <p className="font-display font-semibold">{r.title}</p>
                      <p className="mt-2 text-sm text-muted-foreground">{r.body}</p>
                    </blockquote>
                    <figcaption className="mt-4 text-sm">
                      <span className="font-semibold">{r.name}</span>
                      <span className="text-muted-foreground"> · {r.city}</span>
                      <span className="mt-1 block text-xs text-primary">
                        Verified purchase · {r.product}
                      </span>
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
          </div>
        </div>
      </section>

      {/* TRUST STRIP (Moved to end) */}
      <section className="border-y border-primary/10 bg-surface/50">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST.map(({ Icon, title, text }, i) => (
            <Reveal key={title} delay={i * 0.06}>
              <div className="flex items-center gap-4 text-left">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-surface text-primary">
                  <Icon className="size-6" />
                </span>
                <div>
                  <p className="font-display text-base font-bold">{title}</p>
                  <p className="text-sm text-muted-foreground">{text}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 text-center">
        <Reveal>
          <h2 className="text-3xl font-bold sm:text-4xl">Ready to build your everyday edit?</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Order now and pay cash on delivery, or pay in advance with EasyPaisa, Raast or bank
            transfer.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild>
              <Link to="/shop">Browse all products</Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/contact">Talk to us</Link>
            </Button>
          </div>
        </Reveal>
      </section>
    </>
  );
}
