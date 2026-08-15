# Swipeable Product Images Plan

Implement touch-friendly swipe gestures for product images on the product details page using `framer-motion`'s drag capabilities.

## User Review Required

> [!IMPORTANT]
> The swipe functionality will be primarily for mobile users. On desktop, the click-to-change thumbnails and arrows (if added) will still function as usual.

## Proposed Changes

### Storefront

#### Product Details Page (`src/routes/product.$slug.tsx`)
- Wrap the main product image in a `motion.div` that supports horizontal dragging.
- Implement `onDragEnd` logic to detect swipe direction and update the current image index (`img`).
- Add visual indicators (pagination dots) below the image for better mobile UX.
- Ensure smooth transitions between images during and after swiping.

## Technical Details

- Use `drag="x"` and `dragConstraints={{ left: 0, right: 0 }}` on the `motion.div`.
- Calculate swipe threshold (e.g., 50px) to trigger image change.
- `animate={{ x: 0 }}` to snap back if threshold not met, or animate to exit if met.
- Key the `motion.div` with the image index to trigger entry/exit animations if using `AnimatePresence`.
