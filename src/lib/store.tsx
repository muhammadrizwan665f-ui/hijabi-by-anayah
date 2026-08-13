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
  Coupon,
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
  coupons: Coupon[];
  blog: BlogPost[];
  cart: CartLine[];
  wishlist: string[];
}

const initialState: StoreState = {
  settings: SEED_SETTINGS,
  products: [],
  payments: [],
  coupons: [],
  blog: SEED_BLOG,
  cart: [],
  wishlist: [],
};

interface StoreApi extends StoreState {
  hydrated: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  addToCart: (productId: string, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  previewTheme: (t: ThemeId | null) => void;
}

const StoreContext = createContext<StoreApi | null>(null);

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

  const refresh = useCallback(async () => {
    try {
      const data = await getStorefront();
      setState((s) => ({
        ...s,
        products: data.products,
        payments: data.payments,
        coupons: data.coupons,
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
  useEffect(() => {
    const el = document.documentElement;
    el.classList.remove(...THEME_CLASSES);
    el.classList.add(activeTheme);
  }, [activeTheme]);

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
      settings: { ...state.settings, theme: activeTheme },
      hydrated,
      loading,
      refresh,
      previewTheme: setPreview,
      addToCart: (productId, qty = 1) =>
        patch((s) => ({
          ...s,
          cart: s.cart.some((l) => l.productId === productId)
            ? s.cart.map((l) => (l.productId === productId ? { ...l, qty: l.qty + qty } : l))
            : [...s.cart, { productId, qty }],
        })),
      setQty: (productId, qty) =>
        patch((s) => ({
          ...s,
          cart: s.cart
            .map((l) => (l.productId === productId ? { ...l, qty: Math.max(1, qty) } : l))
            .filter((l) => l.qty > 0),
        })),
      removeFromCart: (productId) =>
        patch((s) => ({ ...s, cart: s.cart.filter((l) => l.productId !== productId) })),
      clearCart: () => patch((s) => ({ ...s, cart: [] })),
      toggleWishlist: (productId) =>
        patch((s) => ({
          ...s,
          wishlist: s.wishlist.includes(productId)
            ? s.wishlist.filter((w) => w !== productId)
            : [...s.wishlist, productId],
        })),
    }),
    [state, hydrated, loading, refresh, patch, activeTheme],
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
