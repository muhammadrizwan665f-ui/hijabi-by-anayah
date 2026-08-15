import { Link, useRouterState } from "@tanstack/react-router";
import { useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ChevronRight,
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
  { to: "/shop", label: "HIJAB CAPS", search: { category: "Hijab Inner/caps" } },
  { to: "/shop", label: "ACCESSORIES", search: { category: "Accessories" } },
  { to: "/shop", label: "BASIC HIJAB", search: { category: "Basic/ Plain Hijabs" } },
  { to: "/shop", label: "NEW ARRIVAL" },
  { to: "/deals", label: "SALE" },
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
    // Define the desired priority sequence
    const priority = ["ABAYAH", "HIJAB", "CHADAR", "HIJAB CAPS", "ACCESSORIES"];
    
    const categories = (settings.categories || []).map((c) => ({
      to: "/shop" as const,
      label: c.name.toUpperCase(),
      search: { category: c.name },
    }));

    // Sort categories based on priority, keeping others at the end
    const sortedCategories = [...categories].sort((a, b) => {
      const indexA = priority.indexOf(a.label);
      const indexB = priority.indexOf(b.label);
      
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      return 0;
    });

    return [
      { to: "/", label: "HOME" },
      ...sortedCategories,
      { to: "/shop", label: "NEW ARRIVAL" },
      { to: "/deals", label: "SALE" },
    ];
  }, [settings.categories]);


  const mobileGroups = useMemo(() => {
    const extraLabels = ["NEW ARRIVAL", "SALE", "OUR STORY"];
    const nav = dynamicNav as any[];
    return {
      categories: nav.filter((n: any) => !extraLabels.includes(n.label)),
      extras: nav.filter((n: any) => extraLabels.includes(n.label)),
    };
  }, [dynamicNav]);

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
          scrolled ? "glass shadow-soft" : "bg-background/90 backdrop-blur-md border-b border-primary/5",
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="flex w-[85vw] max-w-sm flex-col gap-0 border-primary/10 bg-surface p-0"
            >
              {/* Brand header */}
              <div className="shrink-0 px-6 pb-4 pt-8">
                <Link to="/" onClick={() => setOpen(false)} className="inline-block">
                  <img src="/favicon.png" alt="Hijabi By Anayah logo" className="h-12 w-12 rounded-full object-cover" />
                </Link>
                <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.3em] text-primary/60">
                  Modesty, Elevated
                </p>
                <div className="mt-6 h-px w-full bg-gradient-to-r from-primary/30 via-primary/10 to-transparent" />
              </div>

              {/* Nav */}
              <div className="flex-1 overflow-y-auto px-4 pb-8 pt-2 no-scrollbar">
                <div className="mb-6 space-y-1">
                  <p className="px-3 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary/40">
                    Collections
                  </p>
                  <div className="grid gap-1">
                    {mobileGroups.categories.map((n, i) => (
                      <motion.div
                        key={`${n.to}-${n.label}`}
                        initial={{ opacity: 0, x: -15 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + i * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <Link
                          to={n.to}
                          search={n.search || true}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "group flex items-center justify-between rounded-2xl px-4 py-3.5 transition-all duration-300",
                            "hover:bg-primary/5 active:scale-[0.98]",
                            pathname === n.to
                              ? "bg-primary/10 text-primary shadow-sm"
                              : "text-foreground/80"
                          )}
                        >
                          <span className="text-[14px] font-bold uppercase tracking-[0.15em]">{n.label}</span>
                          <ChevronRight className="size-4 text-primary/20 transition-all duration-300 group-hover:translate-x-1 group-hover:text-primary/50" />
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="px-3 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary/40">
                    Discover
                  </p>
                  <div className="grid gap-1">
                    {mobileGroups.extras.map((n, i) => (
                      <motion.div
                        key={`${n.to}-${n.label}`}
                        initial={{ opacity: 0, x: -15 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: 0.1 + (mobileGroups.categories.length + i) * 0.04,
                          duration: 0.4,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      >
                        <Link
                          to={n.to}
                          search={n.search || true}
                          onClick={() => setOpen(false)}
                          className={cn(
                            "group flex items-center justify-between rounded-2xl px-4 py-3.5 transition-all duration-300",
                            "hover:bg-primary/5 active:scale-[0.98]",
                            n.label === "SALE" ? "text-destructive" : "text-foreground/80",
                            pathname === n.to && "bg-primary/10 text-primary shadow-sm"
                          )}
                        >
                          <span className="flex items-center gap-3 text-[14px] font-bold uppercase tracking-[0.15em]">
                            {n.label}
                            {n.label === "SALE" && (
                              <span className="relative flex size-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75"></span>
                                <span className="relative inline-flex size-2 rounded-full bg-destructive"></span>
                              </span>
                            )}
                          </span>
                          <ChevronRight className="size-4 text-primary/20 transition-all duration-300 group-hover:translate-x-1 group-hover:text-primary/50" />
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="shrink-0 space-y-4 border-t border-primary/10 bg-secondary/30 px-6 py-6">
                <div className="space-y-3">
                  <a
                    href={`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent("Assalam o Alaikum! I want to order from Hijabi By Anayah.")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex w-full items-center justify-center gap-3 rounded-2xl bg-success px-5 py-4 text-[13px] font-black uppercase tracking-widest text-background shadow-lg shadow-success/20 transition-all active:scale-95"
                  >
                    <svg viewBox="0 0 24 24" className="size-5 fill-current" aria-hidden>
                      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.95 1.16-.17.2-.35.22-.65.07-.3-.15-1.12-.41-2.13-1.31-.79-.7-1.32-1.57-1.47-1.87-.15-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.62-1.51-.85-2.06-.22-.54-.45-.47-.62-.48h-.53c-.18 0-.47.07-.72.34-.25.27-.94.92-.94 2.25 0 1.32.96 2.6 1.09 2.78.13.17 1.85 2.96 4.5 4.03 2.65 1.07 2.65.71 3.13.67.47-.05 1.53-.62 1.75-1.23.22-.6.22-1.12.15-1.23-.07-.1-.27-.17-.57-.32zM12 2a10 10 0 0 0-8.6 15.1L2 22l5.05-1.32A10 10 0 1 0 12 2z" />
                    </svg>
                    WhatsApp Order
                  </a>
                </div>
                
                <div className="flex flex-col items-center gap-1.5">
                  <p className="text-[11px] font-bold text-primary/60">{settings.email}</p>
                  <p className="text-[10px] font-medium tracking-wide text-muted-foreground/60">© 2021 Hijabi By Anayah</p>
                </div>
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

          <nav className="ml-8 hidden items-center gap-1 lg:flex xl:gap-2">
            {dynamicNav.map((n) => (
              <Link
                key={`${n.to}-${n.label}`}
                to={n.to}
                search={(n as any).search || true}

                className={cn(
                  "rounded-full px-2.5 py-1.5 text-[11px] font-black uppercase tracking-[0.1em] transition-all duration-300 xl:px-3 xl:text-[11.5px]",
                  "hover:bg-primary/5 hover:text-primary active:scale-95",
                  pathname === n.to
                    ? "bg-primary/10 text-primary"
                    : "text-foreground/70",
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
      className="fixed bottom-6 right-5 z-40 flex size-16 items-center justify-center rounded-full shadow-premium transition-transform hover:scale-105"
    >
      <img src="/whatsapp-icon.png" alt="" className="size-16" />
    </a>
  );
}
