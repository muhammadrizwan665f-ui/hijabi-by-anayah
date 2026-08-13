import type { ThemeId } from "./types";

export interface ThemeOption {
  id: ThemeId;
  name: string;
  description: string;
  swatch: string[];
}

export const THEME_CLASSES: ThemeId[] = [
  "theme-sand",
  "theme-blush",
  "theme-sage",
  "theme-sky",
  "theme-lilac",
  "theme-ivory-gold",
  "theme-mint",
  "theme-taupe",
  "theme-peach",
  "theme-pearl-grey",
  "theme-black-white",
  "theme-blue-white",
];

export const THEMES: ThemeOption[] = [
  { id: "theme-sand", name: "Sand", description: "Soft, neutral sand", swatch: ["#C9A88A"] },
  { id: "theme-blush", name: "Blush", description: "Delicate blush pink", swatch: ["#E8B4B8"] },
  { id: "theme-sage", name: "Sage", description: "Calm, earthy sage", swatch: ["#A8B89C"] },
  { id: "theme-sky", name: "Sky", description: "Bright, airy sky blue", swatch: ["#A9C6E8"] },
  { id: "theme-lilac", name: "Lilac", description: "Soft, romantic lilac", swatch: ["#C6B6E2"] },
  { id: "theme-ivory-gold", name: "Ivory Gold", description: "Elegant ivory and gold", swatch: ["#D9C08C"] },
  { id: "theme-mint", name: "Mint", description: "Fresh, cooling mint", swatch: ["#A9D8C7"] },
  { id: "theme-taupe", name: "Taupe", description: "Sophisticated warm taupe", swatch: ["#B7A99A"] },
  { id: "theme-peach", name: "Peach", description: "Warm, inviting peach", swatch: ["#F0C9A8"] },
  { id: "theme-pearl-grey", name: "Pearl Grey", description: "Modern, chic pearl grey", swatch: ["#C4C7CC"] },
  { id: "theme-black-white", name: "Black & White", description: "Classic black and white", swatch: ["#000000"] },
  { id: "theme-blue-white", name: "Blue & White", description: "Clean blue and white", swatch: ["#0000FF"] },
];
