import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { SEED_BLOG, SEED_SETTINGS } from "./seed";
import { THEME_CLASSES } from "./theme";
import { getStorefront, trackVisit } from "./shop.functions";
import type {
  BlogPost,
  CartLine,
  FontId,
  PaymentMethod,
  Product,
  Settings,
  ThemeId,
} from "./types";

const CART_KEY = "anayah-cart-v2";
const SESSION_KEY = "anayah-session";

interface StoreState {
  settings: Settings;
  products: Product[];
  payments: PaymentMethod[];
  
  blog: BlogPost[];
  cart: CartLine[];
  wishlist: string[];
}

const initialState: StoreState = {
  settings: SEED_SETTINGS,
  products: [],
  payments: [],
  
  blog: SEED_BLOG,
  cart: [],
  wishlist: [],
};

interface StoreApi extends StoreState {
  hydrated: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  addToCart: (productId: string, qty?: number, colorName?: string) => void;
  setQty: (productId: string, qty: number, colorName?: string) => void;
  removeFromCart: (productId: string, colorName?: string) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  previewTheme: (t: ThemeId | null) => void;
  previewFont: (f: FontId | null) => void;
}

const StoreContext = createContext<StoreApi | null>(null);

/** Same product + same selected colour = same cart line. */
function sameLine(l: CartLine, productId: string, colorName?: string) {
  return l.productId === productId && (l.colorName ?? "") === (colorName ?? "");
}

function detectDevice() {
  const ua = navigator.userAgent;
  const device = /iPad|Tablet/i.test(ua) ? "tablet" : /Mobi|Android/i.test(ua) ? "mobile" : "desktop";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /Chrome\//.test(ua)
      ? "Chrome"
      : /Safari\//.test(ua)
        ? "Safari"
        : /Firefox\//.test(ua)
          ? "Firefox"
          : "Other";
  const os = /Android/.test(ua)
    ? "Android"
    : /iPhone|iPad|iOS/.test(ua)
      ? "iOS"
      : /Windows/.test(ua)
        ? "Windows"
        : /Mac OS/.test(ua)
          ? "macOS"
          : "Other";
  return { device, browser, os };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>(initialState);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<ThemeId | null>(null);
  const [fontPreview, setFontPreview] = useState<FontId | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await getStorefront();
      setState((s) => ({
        ...s,
        products: data.products,
        payments: data.payments,
        
        settings: data.settings,
      }));
    } catch {
      /* keep last known data */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { cart?: CartLine[]; wishlist?: string[] };
        setState((s) => ({
          ...s,
          cart: parsed.cart ?? [],
          wishlist: parsed.wishlist ?? [],
        }));
      }
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(CART_KEY, JSON.stringify({ cart: state.cart, wishlist: state.wishlist }));
    } catch {
      /* storage full */
    }
  }, [state.cart, state.wishlist, hydrated]);

  const activeTheme = preview ?? state.settings.theme;
  const activeFont = fontPreview ?? state.settings.font ?? "font-serif-classic";

  useEffect(() => {
    const el = document.documentElement;
    el.classList.remove(...THEME_CLASSES);
    el.classList.add(activeTheme);
  }, [activeTheme]);

  useEffect(() => {
    const el = document.documentElement;
    const fontClasses = [
      "font-serif-classic",
      "font-sans-modern",
      "font-display-chic",
      "font-elegant-script",
      "font-minimalist-clean",
      "font-luxury-serif",
      "font-professional-mono",
      "font-organic-soft",
      "font-vintage-type",
      "font-contemporary-bold",
    ];
    el.classList.remove(...fontClasses);
    el.classList.add(activeFont);
  }, [activeFont]);

  // Visitor tracking — one ping per page view.
  useEffect(() => {
    if (!hydrated) return;
    if (window.location.pathname.startsWith("/admin")) return;
    let sessionId = localStorage.getItem(SESSION_KEY);
    const isNew = !sessionId;
    if (!sessionId) {
      sessionId = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(SESSION_KEY, sessionId);
    }
    const info = detectDevice();
    void trackVisit({
      data: {
        sessionId,
        path: window.location.pathname,
        referrer: document.referrer || undefined,
        isNew,
        ...info,
      },
    }).catch(() => undefined);
  }, [hydrated]);

  const patch = useCallback((fn: (s: StoreState) => StoreState) => setState(fn), []);

  const api = useMemo<StoreApi>(
    () => ({
      ...state,
      settings: { ...state.settings, theme: activeTheme, font: activeFont },
      hydrated,
      loading,
      refresh,
      previewTheme: setPreview,
      previewFont: setFontPreview,
      addToCart: (productId, qty = 1, colorName) =>
        patch((s) => ({
          ...s,
          cart: s.cart.some((l) => sameLine(l, productId, colorName))
            ? s.cart.map((l) =>
                sameLine(l, productId, colorName) ? { ...l, qty: l.qty + qty } : l,
              )
            : [...s.cart, { productId, qty, ...(colorName ? { colorName } : {}) }],
        })),
      setQty: (productId, qty, colorName) =>
        patch((s) => ({
          ...s,
          cart: s.cart
            .map((l) => (sameLine(l, productId, colorName) ? { ...l, qty: Math.max(1, qty) } : l))
            .filter((l) => l.qty > 0),
        })),
      removeFromCart: (productId, colorName) =>
        patch((s) => ({
          ...s,
          cart: s.cart.filter((l) => !sameLine(l, productId, colorName)),
        })),
      clearCart: () => patch((s) => ({ ...s, cart: [] })),
      toggleWishlist: (productId) =>
        patch((s) => ({
          ...s,
          wishlist: s.wishlist.includes(productId)
            ? s.wishlist.filter((w) => w !== productId)
            : [...s.wishlist, productId],
        })),
    }),
    [state, hydrated, loading, refresh, patch, activeTheme, activeFont],
  );

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreApi {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

export function useProduct(slug: string): Product | undefined {
  const { products } = useStore();
  return products.find((p) => p.slug === slug);
}
