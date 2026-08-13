import { createFileRoute } from "@tanstack/react-router";
import { Flame } from "lucide-react";
import { Countdown } from "@/components/site/countdown";
import { ProductCard } from "@/components/site/product-card";
import { Reveal } from "@/components/site/reveal";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/deals")({
  head: () => ({
    meta: [
      { title: "Seasonal Offers — Hijabi By Anayah" },
      {
        name: "description",
        content:
          "Limited-time offers on Anayah hijabs, namaz chadars and accessories. Countdown pricing with up to 40% off.",
      },
      { property: "og:title", content: "Seasonal Offers — Hijabi By Anayah" },
      {
        property: "og:description",
        content: "Limited-time countdown offers with extra 30% off on advance payment.",
      },
      { property: "og:url", content: "/deals" },
    ],
    links: [{ rel: "canonical", href: "/deals" }],
  }),
  component: Deals,
});

function Deals() {
  const { products, settings } = useStore();
  const flash = products.filter((p) => p.active && p.flashSale);
  const others = products.filter((p) => p.active && !p.flashSale);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <Reveal className="rounded-[2rem] border border-primary p-8 text-primary shadow-premium sm:p-12 bg-surface">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 px-3 py-1 text-xs font-bold uppercase tracking-widest">
          <Flame className="size-3.5" /> Live now
        </span>
        <h1 className="mt-4 text-3xl font-bold sm:text-4xl">Flash Deals</h1>
        <p className="mt-2 max-w-xl text-sm opacity-90">{settings.saleBannerText}</p>
        <div className="mt-6">
          <Countdown target={settings.saleEndsAt} />
        </div>
      </Reveal>

      <div className="mt-10 grid grid-cols-2 gap-2 sm:gap-5 lg:grid-cols-4">
        {flash.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </div>

      <h2 className="mt-16 text-2xl font-bold">More great prices</h2>
      <div className="mt-6 grid grid-cols-2 gap-2 sm:gap-5 lg:grid-cols-4">
        {others.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </div>
    </div>
  );
}
