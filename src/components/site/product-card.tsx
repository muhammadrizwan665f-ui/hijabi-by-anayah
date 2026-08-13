import { Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Flame, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Countdown } from "@/components/site/countdown";
import { discountPct, formatPKR, unitPrice } from "@/lib/pricing";
import { useStore } from "@/lib/store";
import type { Product } from "@/lib/types";
import { toast } from "sonner";

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { addToCart } = useStore();
  // discountPct is no longer needed since we show a single price or a specific sale price
  // const off = discountPct(product);
  const soldPct = Math.min(96, Math.round((product.sold / (product.sold + product.stock)) * 100));
  const outOfStock = product.stock <= 0;
  const lowStock = product.stock > 0 && product.stock <= 5;

  return (
    <motion.article
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay: (index % 4) * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="premium-card group relative flex flex-col overflow-hidden"
    >
      <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5">
        {product.flashSale ? (
          <span className="flex items-center gap-1 rounded-full bg-destructive px-2.5 py-1 text-xs font-bold text-destructive-foreground">
            <Flame className="size-3" /> Flash
          </span>
        ) : null}
      </div>

      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        className="relative block overflow-hidden rounded-t-[inherit] bg-surface-2"
      >
        <img
          src={product.images[0]}
          alt={product.name}
          loading="lazy"
          width={1024}
          height={1024}
          className="aspect-square w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-2 sm:gap-3 sm:p-4">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="size-3.5 fill-warning text-warning" />
          <span className="font-semibold text-foreground">{product.rating}</span>
          <span>· {product.sold.toLocaleString()} sold</span>
        </div>

        <Link to="/product/$slug" params={{ slug: product.slug }} className="min-h-11">
          <h3 className="line-clamp-2 font-display text-xs font-semibold leading-snug hover:text-primary sm:text-base">
            {product.name}
          </h3>
        </Link>

        <div className="flex flex-wrap items-baseline gap-2">
          <span className="font-display text-base font-bold text-primary sm:text-xl">
            {formatPKR(unitPrice(product))}
          </span>
        </div>

        <div>
          <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
            <div className="gradient-brand h-full rounded-full" style={{ width: `${soldPct}%` }} />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {outOfStock ? (
              <span className="font-semibold text-destructive">Out of Stock</span>
            ) : lowStock ? (
              <>
                Only <span className="font-semibold text-destructive">{product.stock}</span> left in
                stock
              </>
            ) : (
              <>In stock</>
            )}
          </p>
        </div>

        {product.flashSale && product.flashEndsAt ? (
          <div className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-2 text-xs font-medium">
            <Zap className="size-3.5 text-primary" />
            Ends in <Countdown target={product.flashEndsAt} compact className="text-primary" />
          </div>
        ) : null}

        <div className="mt-auto flex flex-col gap-1.5 pt-1 sm:flex-row sm:gap-2">
          <Button
            className="h-8 flex-1 text-xs sm:h-10 sm:text-sm"
            disabled={outOfStock}
            onClick={() => {
              if (outOfStock) return;
              addToCart(product.id);
              toast.success("Added to cart", { description: product.name });
            }}
          >
            {outOfStock ? "Out of Stock" : "Add to Cart"}
          </Button>
          <Button variant="secondary" className="h-8 text-xs sm:h-10 sm:text-sm" asChild>
            <Link to="/product/$slug" params={{ slug: product.slug }}>
              View
            </Link>
          </Button>
        </div>
      </div>
    </motion.article>
  );
}
