# Plan - Remove Discount System

Completely remove the discount and coupon systems from the checkout and store to align with the new brand policy.

## User Review Required

> [!IMPORTANT]
> This will permanently remove:
> 1. The ability for customers to apply coupon codes at checkout.
> 2. Automated discounts for specific payment methods (e.g., EasyPaisa/Bank Transfer discounts).
> 3. Bulk discounts for ordering multiple quantities of the same item.
> 4. Flash sale discount displays (only the original price will be used).

## Proposed Changes

### Database & Seed Data
- Update `public.payment_methods` to set `discount_pct` to 0 for all methods.
- Disable all active coupons in `public.coupons`.
- Update `src/lib/seed.ts` to remove any mention of discounts in payment methods or site settings.

### Pricing Logic
- Refactor `src/lib/pricing.ts`:
    - Force `discountPct` to return 0.
    - Remove bulk discount calculation logic.
    - Set `couponDiscount` and `paymentDiscount` to 0 in `computeTotals`.
- Update `src/lib/shop.functions.ts` (Server Function):
    - Remove coupon validation and application logic during order creation.
    - Ensure `computeTotals` is called without any discounts.

### Frontend UI
- **Checkout Page (`src/routes/checkout.tsx`)**:
    - Remove the "XX% OFF" badges from payment method selection.
    - Remove the Coupon code input field (if present, or ensure it's hidden).
    - Remove "Bulk discount", "Coupon discount", and "Payment method discount" lines from the Order Summary.
- **Cart Page (`src/routes/cart.tsx`)**:
    - Remove coupon input and discount summary lines.
- **Product Display**:
    - Remove "Sale" badges and strikethrough prices from product cards and product details.
- **Admin Panel**:
    - Hide or disable coupon management.
    - Remove discount percentage fields from payment method management.

## Technical Details
- Modify `computeTotals` in `src/lib/pricing.ts` to simplify the calculation to `total = subtotal + shipping`.
- Update `createOrder` server function to ensure no discounts are recorded in the database, even if a legacy client tries to send them.
- Run a migration to reset all `discount_pct` values in the database.
