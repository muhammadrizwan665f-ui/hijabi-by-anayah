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
      <svg viewBox="0 0 24 24" className="size-5 fill-current" aria-hidden>
        <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.95 1.16-.17.2-.35.22-.65.07-.3-.15-1.12-.41-2.13-1.31-.79-.7-1.32-1.57-1.47-1.87-.15-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.62-1.51-.85-2.06-.22-.54-.45-.47-.62-.48h-.53c-.18 0-.47.07-.72.34-.25.27-.94.92-.94 2.25 0 1.32.96 2.6 1.09 2.78.13.17 1.85 2.96 4.5 4.03 2.65 1.07 2.65.71 3.13.67.47-.05 1.53-.62 1.75-1.23.22-.6.22-1.12.15-1.23-.07-.1-.27-.17-.57-.32zM12 2a10 10 0 0 0-8.6 15.1L2 22l5.05-1.32A10 10 0 1 0 12 2z" />
      </svg>
      <span className="hidden sm:inline">WhatsApp Order</span>
    </a>
  );
}
