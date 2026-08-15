# Premium Mobile Menu Redesign

The mobile slide-out menu is currently a plain list of uppercase links on a flat background. It will be rebuilt as a branded, boutique-style navigation panel.

## What changes

- **Branded header inside the menu**: the Hijabi By Anayah logo at the top with a soft tagline line ("Modesty, Elevated"), separated by a thin gold hairline.
- **Refined link rows**: each category gets generous spacing, a small chevron on the right, a subtle sand-tinted hover/active surface, and a rounded pill highlight for the page you are currently on (instead of only HOME looking selected).
- **Section grouping**: shopping categories grouped under a small "SHOP BY CATEGORY" label, with NEW ARRIVAL / SALE / OUR STORY separated below a divider. SALE gets a small accent badge.
- **Staggered entrance**: links fade and slide in one after another when the menu opens, matching the motion language used elsewhere on the site.
- **Footer block**: a WhatsApp order button plus small contact line and social icons pinned at the bottom of the panel, so the menu doubles as a contact point.
- **Panel styling**: warm surface background, soft inner shadow, slightly wider panel, and a properly styled close button.

## Notes

- Only the mobile menu section is touched; desktop navigation, the announcement bar, search, and cart stay exactly as they are.
- Category names continue to come from the managed categories in admin settings, so nothing is hardcoded.
- All colors use the existing theme tokens, so the menu adapts to every one of the 12 selectable themes.

## Technical detail

Work is limited to the `SheetContent side="left"` block in `src/components/site/header.tsx`, using `motion/react` for the staggered reveal and existing semantic tokens (`primary`, `surface`, `secondary`, `muted-foreground`) for all styling.
