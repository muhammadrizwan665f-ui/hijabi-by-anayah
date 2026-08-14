import { Link, useRouterState } from "@tanstack/react-router";
import { useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ChevronUp,
  Menu,
  Search,
  ShoppingCart,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Countdown } from "@/components/site/countdown";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "HOME" },
  { to: "/shop", label: "ABAYAH", search: { category: "Abayah" } },
  { to: "/shop", label: "NAMAZ CHADAR", search: { category: "Namaz Chadar" } },
  { to: "/shop", label: "HIJAB INNER/CAPS", search: { category: "Hijab Inner/caps" } },
  { to: "/shop", label: "ACCESSORIES", search: { category: "Accessories" } },
  { to: "/shop", label: "BASIC/ PLAIN HIJABS", search: { category: "Basic/ Plain Hijabs" } },
  { to: "/shop", label: "NEW ARRIVAL" },
  { to: "/deals", label: "SALE" },
  { to: "/about", label: "OUR STORY" },
] as any[];

export function Header() {
  const { cart, settings } = useStore();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [bannerIndex, setBannerIndex] = useState(0);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const count = cart.reduce((a, l) => a + l.qty, 0);

  const banners = useMemo(
    () => [
      { text: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", arabic: true },
      { text: "Welcome to Hijabi By Anayah — Modesty, Elevated.", icon: true },
      { text: settings.saleBannerText, icon: true, countdown: true },
    ],
    [settings.saleBannerText],
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % banners.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [banners.length]);

  const dynamicNav = useMemo(() => {
    const base = [
      { to: "/", label: "HOME" },
      ...(settings.categories || [])
        .slice(0, 6)
        .map((c) => ({ to: "/shop", label: c.name.toUpperCase(), search: { category: c.name } })),
      { to: "/shop", label: "NEW ARRIVAL" },
      { to: "/deals", label: "SALE" },
      { to: "/about", label: "OUR STORY" },
    ];
    // Fallback to static nav if no categories are managed yet
    if (base.length <= 4) return NAV;
    return base;
  }, [settings.categories]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div className="relative h-10 overflow-hidden border-b border-primary/20 bg-surface text-primary sm:h-9">
        <AnimatePresence mode="wait">
          <motion.div
            key={bannerIndex}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="absolute inset-0 flex items-center justify-center px-4 text-center"
          >
            <div className="flex flex-col items-center justify-center gap-x-4 text-xs font-semibold sm:flex-row sm:text-sm">
              <span
                className={cn(
                  "flex items-center gap-1.5",
                  banners[bannerIndex]?.arabic && "text-lg sm:text-xl",
                )}
              >
                {banners[bannerIndex]?.icon && <Sparkles className="size-4 shrink-0" />}
                {banners[bannerIndex]?.text}
              </span>
              {banners[bannerIndex]?.countdown && (
                <Countdown target={settings.saleEndsAt} compact className="tracking-wide" />
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <header
        className={cn(
          "sticky top-0 z-50 transition-all duration-300",
          scrolled ? "glass shadow-soft" : "bg-background/70 backdrop-blur-md",
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <div className="mt-8 flex flex-col gap-1">
                {dynamicNav.map((n) => (
                  <Link
                    key={n.to}
                    to={n.to}
                    search={n.search}
                    onClick={() => setOpen(false)}
                    className="rounded-xl px-4 py-3 text-base font-medium hover:bg-secondary"
                  >
                    {n.label}
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>

          <Link to="/" className="flex items-center gap-2">
            <img
              src="/favicon.png"
              alt="Hijabi By Anayah logo"
              className="h-11 w-11 rounded-full object-cover"
            />
            <span className="hidden font-display text-lg font-bold tracking-tight sm:inline">Hijabi By Anayah</span>
          </Link>

          <nav className="ml-6 hidden items-center gap-1 lg:flex">
            {dynamicNav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                search={n.search}
                className={cn(
                  "rounded-full px-3.5 py-2 text-sm font-medium transition-colors hover:bg-secondary",
                  pathname === n.to && "bg-secondary text-primary",
                )}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto hidden items-center gap-1 md:flex">
            <div className="flex items-center gap-1 rounded-full border border-primary/10 bg-secondary/30 p-1 shadow-sm">
              <form
                className="flex items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  window.location.href = `/shop?q=${encodeURIComponent(q)}`;
                }}
              >
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search..."
                    className="h-9 w-32 rounded-full border-none bg-transparent pl-9 transition-all focus-visible:w-48 focus-visible:ring-0"
                    aria-label="Search products"
                  />
                </div>
              </form>
              <div className="h-4 w-px bg-primary/10" />
              <Button variant="ghost" size="icon" className="group relative size-9 rounded-full" asChild aria-label="Cart">
                <Link to="/cart">
                  <ShoppingCart className="size-4.5 transition-transform group-hover:scale-110" />
                  <AnimatePresence>
                    {count > 0 ? (
                      <motion.span
                        key={count}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full border-2 border-background bg-primary text-[10px] font-bold text-background shadow-sm"
                      >
                        {count}
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </Link>
              </Button>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-1 md:hidden">
            <div className="flex items-center gap-1 rounded-full border border-primary/10 bg-secondary/30 p-1 shadow-sm">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="size-9 rounded-full" aria-label="Search">
                    <Search className="size-4.5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="top" className="h-32 pt-10">
                  <form
                    className="mx-auto mt-4 flex max-w-md items-center gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      setOpen(false);
                      window.location.href = `/shop?q=${encodeURIComponent(q)}`;
                    }}
                  >
                    <div className="relative w-full">
                      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        autoFocus
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search hijabs, chadars..."
                        className="h-12 rounded-full pl-10 text-base"
                      />
                    </div>
                  </form>
                </SheetContent>
              </Sheet>
              <div className="h-4 w-px bg-primary/10" />
              <Button variant="ghost" size="icon" className="group relative size-9 rounded-full" asChild aria-label="Cart">
                <Link to="/cart">
                  <ShoppingCart className="size-4.5 transition-transform group-hover:scale-110" />
                  <AnimatePresence>
                    {count > 0 ? (
                      <motion.span
                        key={count}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full border-2 border-background bg-primary text-[10px] font-bold text-background shadow-sm"
                      >
                        {count}
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </Link>
              </Button>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="hidden size-9 rounded-full lg:hidden" aria-label="Search">
            <Search className="size-4.5" />
          </Button>
          <Button className="hidden sm:inline-flex" asChild>
            <Link to="/shop">Shop Now</Link>
          </Button>
        </div>
      </header>
    </>
  );
}

export function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <AnimatePresence>
      {show ? (
        <motion.button
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.7 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Back to top"
          className="glass fixed bottom-24 right-5 z-40 flex size-11 items-center justify-center rounded-full shadow-premium"
        >
          <ChevronUp className="size-5" />
        </motion.button>
      ) : null}
    </AnimatePresence>
  );
}

export function WhatsAppButton() {
  const { settings } = useStore();
  return (
    <a
      href={`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent("Assalam o Alaikum! I want to order from Hijabi By Anayah.")}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Order on WhatsApp"
      className="fixed bottom-6 right-5 z-40 flex items-center gap-2 rounded-full bg-success px-4 py-3 font-semibold text-background shadow-premium transition-transform hover:scale-105"
    >
      <svg viewBox="0 0 448 512" className="size-5 fill-current" aria-hidden>
        <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3s19.9 53.7 22.6 57.4c2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
      </svg>
      <span className="hidden sm:inline">WhatsApp Order</span>
    </a>
  );
}
