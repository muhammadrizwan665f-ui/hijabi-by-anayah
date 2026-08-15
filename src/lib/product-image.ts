import type { Product } from "./types";

/** Returns the image that matches the selected colour, falling back to the main product image. */
export function colorImage(product: Product, colorName?: string): string {
  if (colorName) {
    const c = (product.colors ?? []).find(
      (x) => x.name.trim().toLowerCase() === colorName.trim().toLowerCase(),
    );
    if (c?.images?.[0]) return c.images[0];
  }
  return product.images[0] ?? "";
}
