import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Eye, Loader2, Save, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAdmin } from "@/lib/admin-store";
import { useStore } from "@/lib/store";
import { saveSettings } from "@/lib/admin.functions";
import { THEMES } from "@/lib/theme";
import { cn } from "@/lib/utils";
import type { Settings, ThemeId } from "@/lib/types";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  const { settings, reload } = useAdmin();
  const { previewTheme, refresh } = useStore();
  const [draft, setDraft] = useState<Settings>(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => setDraft(settings), [settings]);
  useEffect(() => () => previewTheme(null), [previewTheme]);

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  function pickTheme(theme: ThemeId) {
    set("theme", theme);
    previewTheme(theme);
  }

  async function save() {
    setSaving(true);
    try {
      await saveSettings({ data: { settings: draft as unknown as Record<string, unknown> } });
      await reload();
      await refresh();
      previewTheme(null);
      toast.success("Settings saved", { description: "The storefront is updated for everyone." });
    } catch {
      toast.error("Could not save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="pb-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Themes &amp; Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick a storefront theme, then fine-tune branding, shipping and marketing pixels.
          </p>
        </div>
        <Button onClick={() => void save()} disabled={saving}>
          {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
          Save changes
        </Button>
      </div>

      <section className="premium-card mt-6 p-6">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-lg font-bold">Storefront theme</h2>
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground">
            <Eye className="size-3" /> live preview
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Click a theme to preview it instantly — press Save to publish it to all visitors.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {THEMES.map((t) => {
            const active = draft.theme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => pickTheme(t.id)}
                className={cn(
                  "rounded-2xl border p-4 text-left transition-all hover:shadow-soft",
                  active ? "border-primary ring-2 ring-primary/30" : "border-border",
                )}
              >
                <div className="flex items-center gap-2">
                  {t.swatch.map((c) => (
                    <span
                      key={c}
                      className="size-7 rounded-full border border-border"
                      style={{ background: c }}
                    />
                  ))}
                  {active ? <Check className="ml-auto size-4 text-primary" /> : null}
                </div>
                <p className="mt-3 font-display font-semibold">{t.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{t.description}</p>
              </button>
            );
          })}
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="premium-card p-6">
          <h2 className="font-display text-lg font-bold">Brand &amp; contact</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <TextField label="Brand name" value={draft.brandName} onChange={(v) => set("brandName", v)} />
            <TextField label="Tagline" value={draft.tagline} onChange={(v) => set("tagline", v)} />
            <TextField label="WhatsApp number" value={draft.whatsapp} onChange={(v) => set("whatsapp", v)} />
            <TextField label="Support phone" value={draft.supportPhone} onChange={(v) => set("supportPhone", v)} />
            <TextField label="Email" value={draft.email} onChange={(v) => set("email", v)} />
            <TextField label="Address" value={draft.address} onChange={(v) => set("address", v)} />
          </div>
        </section>

        <section className="premium-card p-6">
          <h2 className="font-display text-lg font-bold">Shipping &amp; promotions</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <NumberField
              label="Free shipping over (PKR)"
              value={draft.freeShippingOver}
              onChange={(v) => set("freeShippingOver", v)}
            />
            <NumberField
              label="Nationwide shipping (PKR)"
              value={draft.shippingFlat}
              onChange={(v) => set("shippingFlat", v)}
            />
            <NumberField
              label="Karachi Standard (PKR)"
              value={draft.shippingKarachi || 350}
              onChange={(v) => set("shippingKarachi", v)}
            />
            <NumberField
              label="Karachi Urgent 24h (PKR)"
              value={draft.shippingKarachiUrgent || 450}
              onChange={(v) => set("shippingKarachiUrgent", v)}
            />
            <TextField
              label="Currency code"
              value={draft.currency}
              onChange={(v) => set("currency", v)}
            />
            <NumberField
              label="Low stock threshold"
              value={draft.lowStockThreshold}
              onChange={(v) => set("lowStockThreshold", v)}
            />
          </div>
          <div className="mt-4">
            <Label htmlFor="banner">Sale banner text</Label>
            <Textarea
              id="banner"
              className="mt-1.5"
              maxLength={200}
              value={draft.saleBannerText}
              onChange={(e) => set("saleBannerText", e.target.value)}
            />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <TextField
              label="Sale ends at (ISO date)"
              value={draft.saleEndsAt}
              onChange={(v) => set("saleEndsAt", v)}
            />
            <div className="space-y-3 pt-1">
              <ToggleRow
                id="indep"
                label="Seasonal campaign banner"
                checked={draft.independenceBanner}
                onChange={(v) => set("independenceBanner", v)}
              />
              <ToggleRow
                id="popup"
                label="Live sales popups"
                checked={draft.liveSalesPopup}
                onChange={(v) => set("liveSalesPopup", v)}
              />
              <ToggleRow
                id="maint"
                label="Maintenance mode"
                checked={draft.maintenanceMode}
                onChange={(v) => set("maintenanceMode", v)}
              />
            </div>
          </div>
        </section>

        <section className="premium-card p-6">
          <h2 className="font-display text-lg font-bold">SEO &amp; Legal</h2>
          <div className="mt-5 space-y-4">
            <TextField
              label="Meta title"
              value={draft.seo.title}
              onChange={(v) => set("seo", { ...draft.seo, title: v })}
            />
            <TextField
              label="Meta keywords"
              value={draft.seo.keywords ?? ""}
              onChange={(v) => set("seo", { ...draft.seo, keywords: v })}
            />
            <div>
              <Label htmlFor="metadesc">Meta description</Label>
              <Textarea
                id="metadesc"
                className="mt-1.5"
                maxLength={160}
                value={draft.seo.description}
                onChange={(e) => set("seo", { ...draft.seo, description: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="terms">Terms &amp; Conditions</Label>
              <Textarea
                id="terms"
                className="mt-1.5"
                value={draft.termsAndConditions}
                onChange={(e) => set("termsAndConditions", e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="premium-card p-6">
          <h2 className="font-display text-lg font-bold">Marketing &amp; Ops</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <TextField
              label="GA4 measurement ID"
              value={draft.analytics.ga4}
              onChange={(v) => set("analytics", { ...draft.analytics, ga4: v })}
            />
            <TextField
              label="Meta Pixel ID"
              value={draft.analytics.metaPixel}
              onChange={(v) => set("analytics", { ...draft.analytics, metaPixel: v })}
            />
            <TextField
              label="Order notification email"
              value={draft.orderNotificationEmail}
              onChange={(v) => set("orderNotificationEmail", v)}
            />
            <TextField
              label="Microsoft Clarity ID"
              value={draft.analytics.clarityId ?? ""}
              onChange={(v) => set("analytics", { ...draft.analytics, clarityId: v })}
            />
            <div className="space-y-3 pt-1">
              <ToggleRow
                id="inventory"
                label="Show inventory count"
                checked={draft.showInventoryCount}
                onChange={(v) => set("showInventoryCount", v)}
              />
              <ToggleRow
                id="guest"
                label="Allow guest checkout"
                checked={draft.allowGuestCheckout}
                onChange={(v) => set("allowGuestCheckout", v)}
              />
            </div>
          </div>
        </section>

        <section className="premium-card p-6 lg:col-span-2">
          <h2 className="font-display text-lg font-bold">Social links</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {(["facebook", "instagram", "tiktok", "youtube"] as const).map((k) => (
              <TextField
                key={k}
                label={k[0]!.toUpperCase() + k.slice(1)}
                value={draft.socials[k]}
                onChange={(v) => set("socials", { ...draft.socials, [k]: v })}
              />
            ))}
          </div>
        </section>

        <section className="premium-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Categories</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const name = prompt("Enter new category name:");
                if (name) {
                  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                  const current = draft.categories || [];
                  set("categories", [...current, { id, name, blurb: "" }]);
                }
              }}
            >
              + Add Category
            </Button>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {(draft.categories || []).map((cat, idx) => (
              <div
                key={cat.id + idx}
                className="flex items-center justify-between gap-2 rounded-xl border border-border bg-background p-3 shadow-sm"
              >
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-semibold">{cat.name}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => {
                    if (confirm(`Delete category "${cat.name}"?`)) {
                      set(
                        "categories",
                        (draft.categories || []).filter((_, i) => i !== idx),
                      );
                    }
                  }}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
            {(draft.categories || []).length === 0 && (
              <p className="col-span-full py-4 text-center text-xs text-muted-foreground">
                No categories defined.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        className="mt-1.5"
        maxLength={255}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const id = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        min={0}
        className="mt-1.5"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
    </div>
  );
}

function ToggleRow({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2">
      <Label htmlFor={id} className="text-sm">
        {label}
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
