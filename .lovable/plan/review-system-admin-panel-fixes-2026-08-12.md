# Review System & Admin Panel Fixes

Implement a customer review submission system on the product page and fix the accessibility issue in the admin panel by ensuring it correctly redirects unauthorized users while being easily accessible for admins.

## Proposed Changes

### Storefront Enhancements (Product Reviews)
- **Review Submission Form**: Add a "Write a Review" section to the Reviews tab on the product detail page (`src/routes/product.$slug.tsx`).
- **Server-side Handler**: Create a new server function `submitReviewFn` in `src/lib/reviews.functions.ts` to save customer reviews to the database.
- **Client-side Logic**: Implement form validation (using Zod) and feedback (toast notifications) when a review is submitted.

### Admin Panel Fixes
- **Link Removal**: The user mentioned "admin panel is not opening" but also previously asked to remove the link from the homepage. I will verify `src/components/site/header.tsx` and `footer.tsx` to ensure the admin link is removed as requested, as the user might be trying to find it there and getting confused.
- **Review Page Fix**: Investigate `src/routes/admin.reviews.tsx` for potential hydration or data-loading issues that might cause it to fail (e.g., handling products without a `reviews` array).

### Technical Details
- **Database**: Reviews are stored as a JSONB array within the `products` table. The `submitReviewFn` will use `adminClient` to append the new review safely.
- **Form Fields**: Name, City, Rating (1-5 stars), Review Title, and Review Body.
- **Security**: Public review submission will be rate-limited or validated to prevent spam. Admin review page will require authenticated admin access.

## User Review
Please confirm if you want the "Write a Review" form to be visible to everyone or only to customers who have purchased the product (requires more complex logic). By default, I will make it visible to all visitors.
