# Colour-wise Stock (Admin + Storefront)

Har colour ke sath uska apna stock number hoga: admin panel se edit ho sakega, product page pr out-of-stock colour "Sold out" dikhega, aur order place hone pr sirf usi colour ka stock kam hoga.

## Admin panel (Products > Colours)

- Har colour row me colour name + swatch ke sath ek chhota "Stock" number input.
- Purane products jinme colour stock nahi hai: khaali/0 ke bajaye "not tracked" treat honge (matlab pehle jaisa product-level stock chalega), taake koi product galti se sold out na ho jaye.
- Inventory page pr product ke neeche colour-wise stock ki chhoti list, +/- adjust ke sath.

## Storefront (product page)

- Jis colour ka stock 0 hai: swatch disabled + "Sold out" label.
- Colour select karna zaroori hoga jab product me colours defined hain; Add to Cart selected colour ke sath jayega.
- Cart aur checkout me line item ke sath colour name dikhega (colour ke hisaab se separate line).

## Order placement

- Order lines me colour ka reference save hoga.
- Stock reservation ab colour-level pr hogi: colour stock ghatega aur product ka total stock bhi sync hoga.
- Order cancel/refund/return pr colour ka stock wapis add hoga (existing restore flow ke sath).

## Technical notes

- `ProductColor` type me `stock?: number` add; `src/lib/mappers.ts` me read/write (colors JSONB me hi rahega, koi naya table nahi).
- `src/routes/admin.products.tsx`: colour editor me stock input; `src/routes/admin.inventory.tsx`: colour breakdown + adjust (existing `adjustStock` ke saath ek naya colour-stock server fn `src/lib/admin.functions.ts` me).
- Cart line shape me optional `colorName` add (`src/lib/store.tsx`, cart/checkout UI); same product + different colour = alag cart line.
- DB migration: `reserve_stock`, `release_stock`, `restore_order_stock` functions update taake `_lines` me aaya `colorName` colors JSONB ke us element ka stock atomically adjust kare, product-level stock ke saath. Colour stock null/absent ho to purana product-level behaviour.
- Backward compatible: colour stock define na hone pr sab kuch aaj jaisa chalega.
