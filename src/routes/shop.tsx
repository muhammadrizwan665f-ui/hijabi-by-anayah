import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductCard } from "@/components/site/product-card";
import { Reveal } from "@/components/site/reveal";
import { CATEGORIES } from "@/lib/seed";
import { unitPrice } from "@/lib/pricing";
import { useStore } from "@/lib/store";

interface ShopSearch {
  q?: string | undefined;
  category?: string | undefined;
}

export const Route = createFileRoute("/shop")({
  validateSearch: (search: Record<string, unknown>): ShopSearch => ({
    q: typeof search["q"] === "string" ? (search["q"] as string) : undefined,
    category: typeof search["category"] === "string" ? (search["category"] as string) : undefined,
  }),

  head: () => ({
    meta: [
      { title: "Shop All Hijabs & Chadars — Hijabi By Anayah" },
      {
        name: "description",
        content:
          "Browse every Hijabi By Anayah hijab, namaz chadar, undercap and hijab accessory with live stock and offer pricing.",
      },
      { property: "og:title", content: "Shop All Hijabs — Hijabi By Anayah" },
      {
        property: "og:description",
        content: "Filter by category, price, rating and availability. Nationwide cash on delivery.",
      },
      { property: "og:url", content: "/shop" },
    ],
    links: [{ rel: "canonical", href: "/shop" }],
  }),
  component: Shop,
});

type SortKey = "featured" | "best" | "rating" | "low" | "high" | "new";

function Shop() {
  const search = Route.useSearch();
  const { products, settings } = useStore();
  const [q, setQ] = useState(search.q ?? "");
  const [cats, setCats] = useState<string[]>(search.category ? [search.category] : []);
  const [maxPrice, setMaxPrice] = useState(15000);
  const [minRating, setMinRating] = useState(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("featured");

  const filtered = useMemo(() => {
    let list = products.filter((p) => p.active);
    if (q.trim())
      list = list.filter((p) =>
        (p.name + p.category + p.tagline).toLowerCase().includes(q.trim().toLowerCase()),
      );
    if (cats.length) list = list.filter((p) => cats.includes(p.category));
    list = list.filter((p) => unitPrice(p) <= maxPrice && p.rating >= minRating);
    if (inStockOnly) list = list.filter((p) => p.stock > 0);
    switch (sort) {
      case "best":
        return [...list].sort((a, b) => b.sold - a.sold);
      case "rating":
        return [...list].sort((a, b) => b.rating - a.rating);
      case "low":
        return [...list].sort((a, b) => unitPrice(a) - unitPrice(b));
      case "high":
        return [...list].sort((a, b) => unitPrice(b) - unitPrice(a));
      case "new":
        return [...list].reverse();
      default:
        return list;
    }
  }, [products, q, cats, maxPrice, minRating, inStockOnly, sort]);

  const filters = (
    <div className="space-y-8">
      <div>
        <h3 className="font-display text-sm font-bold uppercase tracking-widest">Category</h3>
        <div className="mt-3 space-y-2.5">
          {(settings.categories || []).map((c) => (
            <div key={c.id} className="flex items-center gap-2">
              <Checkbox
                id={`cat-${c.id}`}
                checked={cats.includes(c.name)}
                onCheckedChange={(v) =>
                  setCats((prev) => (v ? [...prev, c.name] : prev.filter((x) => x !== c.name)))
                }
              />
              <Label htmlFor={`cat-${c.id}`} className="text-sm font-normal">
                {c.name}
              </Label>
            </div>
          ))}

        </div>
      </div>

      <div>
        <h3 className="font-display text-sm font-bold uppercase tracking-widest">Max price</h3>
        <Slider
          className="mt-4"
          min={1000}
          max={15000}
          step={500}
          value={[maxPrice]}
          onValueChange={([v]) => setMaxPrice(v ?? 15000)}
        />
        <p className="mt-2 text-sm text-muted-foreground">Up to Rs {maxPrice.toLocaleString()}</p>
      </div>

      <div>
        <h3 className="font-display text-sm font-bold uppercase tracking-widest">Rating</h3>
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap">
          {[0, 4, 4.5].map((r) => (
            <Button
              key={r}
              size="sm"
              variant={minRating === r ? "default" : "secondary"}
              className="shrink-0 sm:shrink"
              onClick={() => setMinRating(r)}
            >
              {r === 0 ? "All" : `${r}+`}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="stock"
          checked={inStockOnly}
          onCheckedChange={(v) => setInStockOnly(Boolean(v))}
        />
        <Label htmlFor="stock" className="text-sm font-normal">
          In stock only
        </Label>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Reveal>
        <h1 className="text-3xl font-bold sm:text-4xl">All Products</h1>
        <p className="mt-2 text-muted-foreground">
          {filtered.length} products
        </p>
      </Reveal>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Live search: georgette, chadar, cap..."
          className="rounded-full"
          aria-label="Search products"
        />
        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="w-full rounded-full sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="featured">Featured</SelectItem>
            <SelectItem value="best">Best Selling</SelectItem>
            <SelectItem value="rating">Highest Rated</SelectItem>
            <SelectItem value="low">Price: Low to High</SelectItem>
            <SelectItem value="high">Price: High to Low</SelectItem>
            <SelectItem value="new">Newest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="premium-card h-fit p-6 max-lg:hidden">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-primary" />
            <h2 className="font-display font-bold">Filters</h2>
          </div>
          <div className="mt-6">{filters}</div>
        </aside>

        <details className="premium-card p-4 lg:hidden">
          <summary className="cursor-pointer font-display font-bold">Filters</summary>
          <div className="mt-5">{filters}</div>
        </details>

        <div>
          {filtered.length === 0 ? (
            <p className="premium-card p-10 text-center text-muted-foreground">
              No products match your filters.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:gap-5 xl:grid-cols-3">
              {filtered.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
