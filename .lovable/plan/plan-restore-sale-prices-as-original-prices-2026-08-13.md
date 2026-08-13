# Plan - Restore Sale Prices as Original Prices

The user noted that the current "original" prices are incorrect, and the "sale" prices previously set in the Sale section are the true intended prices. I will swap the current `price` with the `salePrice` for all products where a sale price exists, then clear the sale prices to revert to a non-sale state with the correct base prices.

## User Review Required

> [!IMPORTANT]
> This will permanently update the base prices of your products to what was previously shown as their "Sale Price". All active sale/discount tags will be removed, and these new prices will become the standard prices.

## Proposed Changes

### Database & Content
- Swap `price` and `sale_price` for all products where `sale_price` is currently set.
- Reset `sale_price` to `NULL` and `flash_sale` to `false` for all products.
- This ensures the "sale" prices the user provided are now the "original" prices as requested.

### Frontend Styling
- Update `ProductCard` and the product details page to show the "Original Price" crossed out alongside the "Sale Price" if a sale is active (currently they just show the unit price).
- This will provide better visual feedback when a sale is active in the future.

## Technical Details

### Database Migration
```sql
-- Step 1: Update original price to the sale price where a sale price exists
UPDATE public.products 
SET price = sale_price 
WHERE sale_price IS NOT NULL AND sale_price > 0;

-- Step 2: Clear sale states
UPDATE public.products 
SET sale_price = NULL, flash_sale = false;
```

### Component Updates
- **src/components/site/product-card.tsx**: Update price display to show `price` crossed out if `salePrice` exists.
- **src/routes/product.$slug.tsx**: Similar update for the product detail page.
- **src/lib/pricing.ts**: Ensure `unitPrice` logic remains robust but doesn't hide the original price in the UI.
