# Plan - Add "All Colours" Gallery Feature

Add a way to manage and view a global image gallery for products alongside color-specific galleries.

## User Review Required

> [!IMPORTANT]
> - I will add an "All Colours" option in the admin panel to manage global images.
> - The product page will default to showing these global images until a specific color is selected.
> - Selecting a color will switch the gallery to that color's specific images.

## Proposed Changes

### Admin Panel (`src/routes/admin.products.tsx`)
- Update the `ProductForm` component to treat the existing top-level `images` array as the "All Colours" gallery.
- Add clear labeling in the UI to distinguish between "Global Images (All Colours)" and "Color-Specific Images".
- (Optional but helpful) Move the main images section closer to the colour options section or rename its label to "Global Gallery (All Colours)".

### Product Page (`src/routes/product.$slug.tsx`)
- Add an "All Colours" (or similar) option in the color selector if it makes sense, OR simply ensure that the gallery shows all product images when no specific color is selected.
- Update the `gallery` logic to fallback to `product.images` (the global gallery) when no color is selected or when the selected color has no images.

## Technical Details

- No database schema changes needed as `Product.images` already exists.
- Modify `src/routes/product.$slug.tsx`:
  - Adjust `activeColor` logic to handle the initial "null" state by showing `product.images`.
  - Add a button/option in the color list to "Clear selection" or "View All" to return to the global gallery.
- Modify `src/routes/admin.products.tsx`:
  - Rename the label "Images" to "Main Gallery / All Colours Images".
