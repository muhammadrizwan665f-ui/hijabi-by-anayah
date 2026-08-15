# Plan - Enhance Mobile Menu Visuals

Improve the visual appeal and interactivity of the mobile navigation menu to match the boutique brand aesthetic.

## User Review Required

> [!IMPORTANT]
> The current mobile menu will be replaced with a more premium, animated design.

- **Visual Style**: Premium boutique look with subtle backgrounds and refined typography.
- **Interactivity**: Staggered entry animations for category items.
- **Organization**: Better grouping of shop categories vs. informational links.

## Proposed Changes

### Frontend Improvements

#### `src/components/site/header.tsx`
- Replace the current list-based mobile menu with a more structured layout.
- Add a refined header inside the mobile drawer with the brand logo.
- Implement staggered animations for menu items using Framer Motion.
- Add a "Social & Contact" section at the bottom of the drawer.
- Use better visual cues (icons, badges) for important links like "SALE".
- Refine background colors and spacing to create a sense of hierarchy.

## Technical Details

- **Animation**: Using `motion.div` from `motion/react` (Framer Motion) for exit/entry transitions.
- **Styling**: Leveraging existing Tailwind utility classes and theme tokens (`--surface`, `--primary`).
- **Components**: Enhancing the existing `Sheet` component content from shadcn/ui.
