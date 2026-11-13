
import { createServerFn } from "@tanstack/react-start";
import { requireAdminAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { getDB } from "./cloudflare-db.server";
import { rowToProduct } from "./mappers";
import type { Review } from "./types";

const reviewSchema = z.object({
  name: z.string().trim().min(2).max(50),
  city: z.string().trim().min(2).max(50),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().min(2).max(100),
  body: z.string().trim().min(10).max(1000),
});

async function getProduct(productId: string) {
  const row = await getDB()
    .prepare("SELECT * FROM products WHERE id = ?")
    .bind(productId)
    .first<Record<string, unknown>>();

  if (!row) {
    throw new Error("Product not found.");
  }

  return rowToProduct(row);
}

async function saveReviews(
  productId: string,
  reviews: Review[],
) {
  const rating =
    reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) /
        reviews.length
      : 5;

  const result = await getDB()
    .prepare(
      `UPDATE products
       SET reviews = ?,
           rating = ?,
           updated_at = ?
       WHERE id = ?`,
    )
    .bind(
      JSON.stringify(reviews),
      rating,
      new Date().toISOString(),
      productId,
    )
    .run();

  if (!result.meta?.changes) {
    throw new Error("Could not save product reviews.");
  }
}

/**
 * Admin: generate reviews for a product.
 */
export const generateReviewsFn = createServerFn({ method: "POST" })
  .middleware([requireAdminAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        productId: z.string().uuid(),
        count: z.number().int().min(1).max(50),
        reviews: z
          .array(
            z.object({
              name: z.string().trim().min(1).max(50),
              city: z.string().trim().min(1).max(50),
              rating: z.number().int().min(1).max(5),
              title: z.string().trim().min(1).max(100),
              body: z.string().trim().min(1).max(1000),
              date: z.string(),
              verified: z.boolean(),
              helpful: z.number().int().min(0),
            }),
          )
          .min(1)
          .max(50),
      })
      .refine((value) => value.count === value.reviews.length, {
        message: "Review count does not match the reviews provided.",
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const product = await getProduct(data.productId);

    const newReviews: Review[] = data.reviews.map((review) => ({
      ...review,
      id: crypto.randomUUID(),
      productId: data.productId,
    }));

    const updatedReviews = [
      ...newReviews,
      ...(product.reviews ?? []),
    ];

    await saveReviews(data.productId, updatedReviews);

    return {
      ok: true,
      count: newReviews.length,
    };
  });

/**
 * Customer: submit a product review.
 */
export const submitReviewFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        productId: z.string().uuid(),
        review: reviewSchema,
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const product = await getProduct(data.productId);

    const newReview: Review = {
      ...data.review,
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      verified: false,
      helpful: 0,
      productId: data.productId,
    };

    const updatedReviews = [
      newReview,
      ...(product.reviews ?? []),
    ];

    await saveReviews(data.productId, updatedReviews);

    return {
      ok: true,
      reviewId: newReview.id,
    };
  });
