# Plan: Dynamic Delivery Charges & Secure Payment Flow

Update the checkout process to reflect specific delivery rates for Karachi (Urgent) vs. Nationwide, and clarify the advance payment requirement for order confirmation.

## Proposed Changes

### 1. Database & Settings
- Update `site_settings` to include specific keys for Karachi vs. Out-of-city rates.
- Add a new "Urgent Karachi" delivery option.

### 2. Pricing Logic (`src/lib/pricing.ts`)
- Modify `computeTotals` to support multiple delivery methods (Standard vs. Urgent Karachi).
- Update calculation logic to handle the new rates:
  - **Urgent Karachi**: Rs 450 (within 24 hours).
  - **Out of city**: Rs 350 (5-6 working days via TRAX).
  - **Standard Karachi**: Rs 350 (if applicable, otherwise default to out-of-city rate).

### 3. Checkout UI (`src/routes/checkout.tsx`)
- Add a "Delivery Method" selector that appears when the city is Karachi.
- Update the "Order Summary" to clearly show the chosen delivery service.
- **Advance Payment Notice**: Add a clear disclaimer about advance payments:
  - "Note: we take payment in advance. Minimum 350 for confirmation."
  - "Leopard courier services: 450 minimum advance required."
- Update the bottom notes about courier receipts.

### 4. Admin Panel (`src/routes/admin.settings.tsx`)
- Add inputs to manage the new delivery rates (Karachi Standard, Karachi Urgent, Nationwide).

## Technical Details
- **Settings Schema**: Add `shippingKarachi`, `shippingKarachiUrgent`, and `shippingNationwide` to the `Settings` interface in `src/lib/types.ts`.
- **Form State**: Add `deliveryMethod` (e.g., `standard` | `urgent`) to the checkout form state.
- **Validation**: Ensure that if "Urgent" is selected, the city must be "Karachi".

## User Review Required
- Should we force Karachi users to choose between Standard and Urgent, or default to one?
- Do you want to charge different advance amounts based on the courier (Leopard vs others) automatically, or just show it as a note?
