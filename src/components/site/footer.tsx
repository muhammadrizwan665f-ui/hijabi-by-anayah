import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import {
  Facebook,
  Instagram,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Truck,
  Youtube,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { LIVE_SALES_FEED } from "@/lib/seed";
import { useStore } from "@/lib/store";

export function Footer() {
  const { settings } = useStore();
  const [email, setEmail] = useState("");

  return (
    <footer className="mt-24 border-t border-border bg-surface-2">
      <div className="mx-auto max-w-7xl px-4 py-14">
        <div className="premium-card mb-14 flex flex-col gap-6 border border-primary p-6 text-primary md:grid md:grid-cols-2 md:items-center sm:p-8 bg-surface">
          <div>
            <h3 className="font-display text-2xl font-bold">Join the Anayah circle</h3>
            <p className="mt-2 text-sm opacity-90">
              Be first to know about new hijab drops, restocks and private offers.
            </p>
          </div>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
                toast.error("Please enter a valid email address");
                return;
              }
              toast.success("Subscribed! Thank you for joining us.");
              setEmail("");
            }}
          >
            <Input
              type="email"
              required
              maxLength={255}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              aria-label="Email address"
              className="border-transparent bg-background text-foreground"
            />
            <Button type="submit" variant="secondary">
              Subscribe
            </Button>
          </form>
        </div>

        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <img src="/favicon.png" alt="Hijabi By Anayah logo" className="h-14 w-14 rounded-full object-cover" />
              <span className="font-display text-lg font-bold tracking-tight">Hijabi By Anayah</span>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{settings.tagline}</p>
            <div className="mt-4 flex gap-2">
              {[
                { href: settings.socials.facebook, Icon: Facebook, label: "Facebook" },
                { href: settings.socials.instagram, Icon: Instagram, label: "Instagram" },
                { href: settings.socials.youtube, Icon: Youtube, label: "YouTube" },
              ].map(({ href, Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noreferrer"
                  className="flex size-9 items-center justify-center rounded-xl border border-border bg-card transition-colors hover:bg-secondary"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          <nav aria-label="Shop links">
            <h4 className="font-display text-sm font-bold uppercase tracking-widest">Shop</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {["Hijabs", "Namaz Chadars", "Hijab Caps & Undercaps", "Hijab Accessories"].map(
                (c) => (
                  <li key={c}>
                    <Link to="/shop" search={{ category: c }} className="hover:text-primary">
                      {c}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </nav>

          <nav aria-label="Company links">
            <h4 className="font-display text-sm font-bold uppercase tracking-widest">Company</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/about" className="hover:text-primary">
                  Our Story
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-primary">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-primary">
                  Contact & Support
                </Link>
              </li>
              <li>
                <Link to="/track" className="hover:text-primary">
                  Track My Order
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h4 className="font-display text-sm font-bold uppercase tracking-widest">Contact</h4>
            <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Phone className="mt-0.5 size-4 shrink-0 text-primary" />
                <span className="break-all">{settings.supportPhone}</span>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="mt-0.5 size-4 shrink-0 text-primary" />
                <span className="break-all">{settings.email}</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>{settings.address}</span>
              </li>
              <li className="flex items-start gap-2">
                <Truck className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>Nationwide COD available</span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>Secure checkout&nbsp;</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-center text-xs text-muted-foreground sm:flex-row sm:text-left">
          <p>© 2021 Hijabi By Anayah. All rights reserved.</p>
          <p className="flex flex-wrap justify-center gap-x-2">
            <span>EasyPaisa</span> · <span>Raast</span> · <span>Bank Transfer</span> · <span>COD</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

export function LiveSalesPopup() {
  const { settings } = useStore();
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!settings.liveSalesPopup) return;
    let i = Math.floor(Math.random() * LIVE_SALES_FEED.length);
    const show = () => {
      setMsg(LIVE_SALES_FEED[i % LIVE_SALES_FEED.length] ?? null);
      i += 1;
      setTimeout(() => setMsg(null), 5000);
    };
    const first = setTimeout(show, 6000);
    const id = setInterval(show, 16000);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [settings.liveSalesPopup]);

  return (
    <AnimatePresence>
      {msg ? (
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          className="glass fixed bottom-6 left-5 z-40 hidden max-w-xs rounded-2xl p-3 shadow-premium sm:block"
        >
          <p className="text-sm font-semibold">{msg}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {2 + Math.floor(Math.random() * 12)} minutes ago · Verified order
          </p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
