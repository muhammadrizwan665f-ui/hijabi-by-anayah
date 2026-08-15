import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { productToRow, rowToProduct } from "./mappers";

export const generateReviewsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        productId: z.string().uuid(),
        count: z.number().int().min(1).max(50),
        reviews: z.array(
          z.object({
            name: z.string().min(1),
            city: z.string().min(1),
            rating: z.number().min(1).max(5),
            title: z.string().min(1),
            body: z.string().min(1),
            date: z.string(),
            verified: z.boolean(),
            helpful: z.number(),
          })
        ),
      })
      .parse(input)
  )
  .handler(async ({ data, context }) => {
    // 1. Check admin role
    const { data: roleData, error: roleError } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !roleData) {
      throw new Error("Forbidden: admin access only.");
    }

    // 2. Fetch current product
    const { data: row, error: fetchError } = await context.supabase
      .from("products")
      .select("*")
      .eq("id", data.productId)
      .single();

    if (fetchError || !row) {
      throw new Error("Product not found");
    }

    const product = rowToProduct(row as Record<string, unknown>);
    
    // 3. Append new reviews
    const newReviews = data.reviews.map(r => ({
      ...r,
      id: crypto.randomUUID(),
    }));

    const updatedProduct = {
      ...product,
      reviews: [...newReviews, ...product.reviews],
    };

    // 4. Save back
    const { error: saveError } = await context.supabase
      .from("products")
      .update(productToRow(updatedProduct) as never)
      .eq("id", data.productId);

    if (saveError) {
      throw new Error(saveError.message);
    }

    return { ok: true, count: newReviews.length };
  });

export const submitReviewFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        productId: z.string().uuid(),
        review: z.object({
          name: z.string().trim().min(2).max(50),
          city: z.string().trim().min(2).max(50),
          rating: z.number().int().min(1).max(5),
          title: z.string().trim().min(2).max(100),
          body: z.string().trim().min(10).max(1000),
        }),
      })
      .parse(input)
  )
  .handler(async ({ data }) => {
    const { getPublicClient } = await import("./db.server");
    const supabase = getPublicClient();

    const { data: newReview, error } = await supabase.rpc("submit_product_review", {
      _product_id: data.productId,
      _review: data.review,
    });

    if (error) {
      throw new Error(error.message || "Could not submit your review.");
    }

    return { ok: true, reviewId: (newReview as { id: string } | null)?.id };
  });