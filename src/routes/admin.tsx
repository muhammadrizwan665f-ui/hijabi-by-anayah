import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import {
  BarChart3,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShoppingBag,
  Star,
  Store,
  Users,
} from "lucide-react";
import { AdminProvider, useAdmin } from "@/lib/admin-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import AdminLogin from "@/components/admin/admin-login";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Panel — Hijabi By Anayah" },
      { name: "description", content: "Manage products, orders, themes and store settings." },
      { property: "og:title", content: "Admin Panel — Hijabi By Anayah" },
      { property: "og:description", content: "Hijabi By Anayah store management dashboard." },
      { property: "og:url", content: "/admin" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/admin" }],
  }),
  component: AdminRoot,
});

const LINKS = [
  { to: "/admin", label: "Dashboard", Icon: LayoutDashboard },
  { to: "/admin/products", label: "Products", Icon: Package },
  { to: "/admin/inventory", label: "Inventory", Icon: Package },
  { to: "/admin/orders", label: "Orders", Icon: ShoppingBag },
  { to: "/admin/customers", label: "Customers", Icon: Users },
  { to: "/admin/reviews", label: "Reviews", Icon: Star },
  { to: "/admin/payments", label: "Payments", Icon: CreditCard },
  { to: "/admin/visitors", label: "Visitors", Icon: BarChart3 },
  { to: "/admin/settings", label: "Themes & Settings", Icon: Settings },
] as const;

function AdminRoot() {
  return (
    <AdminProvider>
      <AdminGate />
    </AdminProvider>
  );
}

function AdminGate() {
  const { session, isAdmin, checking, loadingData } = useAdmin();

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-2">
        <p className="text-sm text-muted-foreground">Checking your session…</p>
      </div>
    );
  }

  if (!session) return <AdminLogin />;

  if (!isAdmin) {
    if (loadingData) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-surface-2">
          <p className="text-sm text-muted-foreground">Loading your store…</p>
        </div>
      );
    }
    return <AdminLogin denied />;
  }

  return <AdminLayout />;
}

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { email, signOut } = useAdmin();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-surface-2">
      <aside className="hidden w-64 shrink-0 flex-col gap-1 bg-sidebar p-4 text-sidebar-foreground lg:flex">
        <Link to="/" className="mb-6 flex items-center gap-2 px-2">
          <span className="gradient-brand flex size-9 items-center justify-center rounded-xl text-brand-foreground">
            <Store className="size-4" />
          </span>
          <span className="font-display font-bold">ANAYAH ADMIN</span>
        </Link>
        <div className="flex flex-col gap-1">
          {LINKS.map(({ to, label, Icon }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-sidebar-accent",
                pathname === to && "bg-sidebar-accent text-sidebar-primary",
              )}
            >
              <Icon className="size-4" /> {label}
            </Link>
          ))}
        </div>
        <div className="mt-auto space-y-1 border-t border-sidebar-border pt-3">
          <p className="truncate px-3 text-xs text-sidebar-foreground/70">{email}</p>
          <Link to="/" className="block rounded-xl px-3 py-2.5 text-sm hover:bg-sidebar-accent">
            ← View storefront
          </Link>
          <button
            onClick={() => void signOut()}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-sidebar-accent"
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 w-full overflow-hidden">
        <nav className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:hidden">
          <Link to="/" className="flex items-center gap-2">
            <span className="gradient-brand flex size-8 items-center justify-center rounded-lg text-brand-foreground">
              <Store className="size-4" />
            </span>
            <span className="font-display font-bold text-sm">ANAYAH ADMIN</span>
          </Link>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs h-8 px-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? "Close Menu" : "Menu"}
            </Button>
            <Button size="icon" variant="ghost" className="size-8" onClick={() => void signOut()}>
              <LogOut className="size-4" />
            </Button>
          </div>
        </nav>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 bg-background lg:hidden">
            <div className="flex h-16 items-center justify-between border-b px-4">
              <span className="font-display font-bold">Menu</span>
              <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(false)}>Close</Button>
            </div>
            <div className="grid grid-cols-2 gap-2 p-4 max-h-[calc(100vh-140px)] overflow-y-auto">
              {LINKS.map(({ to, label, Icon }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-2 rounded-2xl border p-4 text-center transition-colors",
                    pathname === to ? "bg-secondary border-primary/20 text-primary" : "bg-card border-border"
                  )}
                >
                  <Icon className="size-5" />
                  <span className="text-xs font-medium">{label}</span>
                </Link>
              ))}
            </div>
            <div className="fixed bottom-0 left-0 right-0 border-t bg-background p-4 space-y-2">
              <Link 
                to="/" 
                className="flex w-full items-center justify-center rounded-xl bg-secondary p-3 text-sm font-medium"
              >
                ← View storefront
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  void signOut();
                }}
                className="flex w-full items-center justify-center rounded-xl bg-destructive/10 p-3 text-sm font-medium text-destructive"
              >
                <LogOut className="mr-2 size-4" /> Sign out
              </button>
            </div>
          </div>
        )}

        <main className="p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
