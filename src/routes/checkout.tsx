import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, Loader2, Upload } from "lucide-react";
import { PROVINCES, computeTotals, formatPKR, lineTotal } from "@/lib/pricing";
import { useStore } from "@/lib/store";
import { createOrder, getPaymentAccount } from "@/lib/shop.functions";
import type { PaymentMethodId } from "@/lib/types";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Secure Checkout — Hijabi By Anayah" },
      {
        name: "description",
        content:
          "Complete your Hijabi By Anayah order with cash on delivery, EasyPaisa, JazzCash or bank transfer.",
      },
      { property: "og:title", content: "Secure Checkout — Hijabi By Anayah" },
      { property: "og:description", content: "COD and advance payment options for Pakistan." },
      { property: "og:url", content: "/checkout" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/checkout" }],
  }),
  component: Checkout,
});

const schema = z.object({
  fullName: z.string().trim().min(3, "Enter your full name").max(80),
  phone: z.string().trim().regex(/^03\d{2}[- ]?\d{7}$/, "Enter a valid number like 03001234567"),
  whatsapp: z.string().trim().min(11, "Enter your WhatsApp number").max(20),
  email: z.string().trim().email("Invalid email").max(255).optional().or(z.literal("")),
  province: z.string().min(2, "Select your province"),
  city: z.string().trim().min(2, "Enter your city").max(60),
  area: z.string().trim().min(2, "Enter your area").max(80),
  address: z.string().trim().min(10, "Enter your complete address").max(300),
  postalCode: z.string().trim().max(10).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the file"));
    reader.readAsDataURL(file);
  });
}

function Checkout() {
  const { cart, products, payments, settings, clearCart, refresh } = useStore();
  const navigate = useNavigate();
  const [method, setMethod] = useState<PaymentMethodId>("cod");
  const [account, setAccount] = useState<{
    accountTitle?: string | undefined;
    accountNumber?: string | undefined;
    iban?: string | undefined;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setAccount(null);
    void getPaymentAccount({ data: { code: method } })
      .then((res) => {
        if (!cancelled) setAccount(res);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [method]);

  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    whatsapp: "",
    email: "",
    province: "Punjab",
    city: "",
    area: "",
    address: "",
    postalCode: "",
    notes: "",
    urgent: false,
  });

  const lines = cart
    .map((l) => ({ product: products.find((p) => p.id === l.productId)!, qty: l.qty }))
    .filter((l) => l.product);

  const activeMethods = payments.filter((p) => p.enabled);
  const selected = activeMethods.find((p) => p.id === method) ?? null;
  const totals = computeTotals({ lines, method: selected, couponPct: 0, settings, province: form.province, city: form.city, urgent: form.urgent });

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-3xl font-bold">Nothing to check out</h1>
        <Button className="mt-6" asChild>
          <Link to="/shop">Go shopping</Link>
        </Button>
      </div>
    );
  }

  const set = (k: keyof typeof form) => (v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check your details");
      return;
    }
    if (selected?.requiresProof && !screenshot) {
      toast.error("Payment screenshot required", {
        description: `Upload your ${selected.label} payment screenshot so we can verify it.`,
      });
      return;
    }

    setSubmitting(true);
    try {
      const proof = screenshot
        ? { dataUrl: await readAsDataUrl(screenshot), name: screenshot.name }
        : undefined;

      const order = await createOrder({
        data: {
          lines: lines.map(({ product, qty }) => ({ productId: product.id, qty })),
          paymentCode: method,
          urgent: form.urgent,
          customer: {
            fullName: form.fullName,
            phone: form.phone,
            whatsapp: form.whatsapp,
            ...(form.email ? { email: form.email } : {}),
            province: form.province,
            city: form.city,
            area: form.area,
            address: form.address,
            ...(form.postalCode ? { postalCode: form.postalCode } : {}),
            ...(form.notes ? { notes: form.notes } : {}),
          },
          ...(proof ? { screenshot: proof } : {}),
        },
      });

      clearCart();
      void refresh();
      toast.success("Order placed! We'll confirm on WhatsApp shortly.");
      void navigate({ to: "/order/$orderId", params: { orderId: order.id } });
    } catch (err) {
      toast.error("Order failed", {
        description: err instanceof Error ? err.message : "Please try again in a moment.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="text-3xl font-bold sm:text-4xl">Checkout</h1>
      <form onSubmit={submit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="premium-card p-6">
            <h2 className="font-display text-lg font-bold">Delivery details</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Full name" value={form.fullName} onChange={set("fullName")} required />
              <Field label="Phone number" value={form.phone} onChange={set("phone")} required placeholder="03001234567" />
              <Field label="WhatsApp number" value={form.whatsapp} onChange={set("whatsapp")} required placeholder="03001234567" />
              <Field label="Email (optional)" value={form.email} onChange={set("email")} type="email" />
              <div>
                <Label htmlFor="province">Province</Label>
                <Select value={form.province} onValueChange={set("province")}>
                  <SelectTrigger id="province" className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVINCES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Field label="City" value={form.city} onChange={set("city")} required />
              <Field label="Area" value={form.area} onChange={set("area")} required />
              <Field label="Postal code (optional)" value={form.postalCode} onChange={set("postalCode")} />
            </div>
            <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <Label className="mb-2 block text-sm font-bold">Courier & Delivery Selection</Label>
              <RadioGroup
                value={form.urgent ? "urgent" : "standard"}
                onValueChange={(v) => set("urgent")(v === "urgent")}
                className="flex flex-col gap-3"
              >
                {form.city?.toLowerCase().trim() === "karachi" ? (
                  <>
                    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-background px-4 py-3 hover:border-primary transition-colors">
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="standard" />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">Karachi Standard Delivery</span>
                          <span className="text-[10px] text-muted-foreground italic">1-2 working days · 300 advance</span>
                        </div>
                      </div>
                      <span className="text-sm font-bold">300 DC</span>
                    </label>
                    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-background px-4 py-3 hover:border-primary transition-colors">
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="urgent" />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">Karachi Express (24 Hours)</span>
                          <span className="text-[10px] text-muted-foreground italic">Urgent delivery · 450 advance</span>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-primary">450 DC</span>
                    </label>
                  </>
                ) : (
                  <>
                    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-background px-4 py-3 hover:border-primary transition-colors">
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="standard" />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">Standard Delivery (TRAX/Other)</span>
                          <span className="text-[10px] text-muted-foreground italic">5-6 working days · 350 advance</span>
                        </div>
                      </div>
                      <span className="text-sm font-bold">350 DC</span>
                    </label>
                    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-background px-4 py-3 hover:border-primary transition-colors">
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value="urgent" />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">Urgent / Leopard Courier</span>
                          <span className="text-[10px] text-muted-foreground italic">Fastest delivery · 450 advance</span>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-primary">450 DC</span>
                    </label>
                  </>
                )}
              </RadioGroup>
            </div>
            <div className="mt-4">
              <Label htmlFor="address">Complete address</Label>
              <Textarea
                id="address"
                className="mt-1.5"
                maxLength={300}
                value={form.address}
                onChange={(e) => set("address")(e.target.value)}
                placeholder="House / shop number, street, landmark"
                required
              />
            </div>
            <div className="mt-4">
              <Label htmlFor="notes">Order notes (optional)</Label>
              <Textarea
                id="notes"
                className="mt-1.5"
                maxLength={500}
                value={form.notes}
                onChange={(e) => set("notes")(e.target.value)}
              />
            </div>
          </section>

          <section className="premium-card p-6">
            <h2 className="font-display text-lg font-bold">Payment method</h2>
            <RadioGroup
              value={method}
              onValueChange={(v) => setMethod(v as PaymentMethodId)}
              className="mt-5 space-y-3"
            >
              {activeMethods.map((m) => (
                <label
                  key={m.id}
                  htmlFor={`pm-${m.id}`}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors ${method === m.id ? "border-primary bg-surface shadow-sm" : "border-border"}`}
                >
                  <RadioGroupItem id={`pm-${m.id}`} value={m.id} className="mt-1" />
                  <div className="flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <span className="font-semibold">{m.label}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{m.note}</p>
                    {method === m.id ? (
                      <div className="mt-3 space-y-3 rounded-xl border border-primary/10 bg-surface p-3 text-xs">
                        {m.instructions ? <p>{m.instructions}</p> : null}
                        {account?.accountNumber ? (
                          <CopyRow
                            label={account.accountTitle ?? m.label}
                            value={account.accountNumber}
                          />
                        ) : null}
                        {account?.iban ? <CopyRow label="IBAN" value={account.iban} /> : null}
                        {m.requiresProof ? (
                          <div>
                            <Label htmlFor="proof" className="text-xs font-semibold">
                              Upload payment screenshot
                            </Label>
                            <label
                              htmlFor="proof"
                              className="mt-1.5 flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border px-3 py-2.5 text-muted-foreground hover:border-primary"
                            >
                              <Upload className="size-4" />
                              <span className="truncate">
                                {screenshot ? screenshot.name : "Choose image (JPG / PNG, max 4MB)"}
                              </span>
                            </label>
                            <input
                              id="proof"
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              className="sr-only"
                              onChange={(e) => {
                                const file = e.target.files?.[0] ?? null;
                                if (file && file.size > 4 * 1024 * 1024) {
                                  toast.error("Image too large — please upload under 4MB.");
                                  return;
                                }
                                setScreenshot(file);
                              }}
                            />
                            <p className="mt-1.5 text-muted-foreground">
                              Your order will be marked “Payment Verification Pending” until our team
                              confirms this screenshot.
                            </p>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </label>
              ))}
            </RadioGroup>
          </section>
        </div>

        <aside className="premium-card h-fit p-6 lg:sticky lg:top-28">
          <h2 className="font-display text-lg font-bold">Order summary</h2>
          <ul className="mt-4 space-y-3">
            {lines.map(({ product, qty }) => (
              <li key={product.id} className="flex gap-3 text-sm">
                <img src={product.images[0]} alt="" loading="lazy" className="size-12 rounded-xl object-cover" />
                <div className="flex-1">
                  <p className="font-medium leading-tight">{product.name}</p>
                  <p className="text-xs text-muted-foreground">Qty {qty}</p>
                </div>
                <span className="font-semibold">{formatPKR(lineTotal(product, qty).total)}</span>
              </li>
            ))}
          </ul>

          <dl className="mt-5 space-y-2 border-t border-primary/20 pt-4 text-sm">
            <Line label="Subtotal" value={formatPKR(totals.subtotal)} />
            <Line
              label={
                form.city?.toLowerCase().trim() === "karachi"
                  ? form.urgent ? "Karachi Express (24h)" : "Karachi Standard"
                  : form.urgent ? "Delivery (Urgent/Leopard)" : "Delivery (Standard/TRAX)"
              }
              value={totals.shipping === 0 ? "FREE" : formatPKR(totals.shipping)}
            />
            <div className="flex items-baseline justify-between border-t border-primary/20 pt-3">
              <dt className="font-display font-bold">Total</dt>
              <dd className="font-display text-2xl font-bold text-primary">
                {formatPKR(totals.total)}
              </dd>
            </div>
            <div className="rounded-xl bg-surface border border-primary/10 p-3 text-[11px] text-primary space-y-2">
              <p className="font-bold flex items-center gap-1.5">
                <span className="text-base">🚨</span> Note: Payment in Advance Required
              </p>
              <ul className="list-inside list-disc space-y-1 opacity-90">
                {form.city?.toLowerCase().trim() === "karachi" ? (
                  <>
                    <li>Standard Karachi: {formatPKR(300)} advance required.</li>
                    <li>Karachi Express: {formatPKR(450)} advance required.</li>
                    <li>Estimated delivery: 1-2 days.</li>
                  </>
                ) : (
                  <>
                    <li>Minimum {formatPKR(350)} required for order confirmation.</li>
                    <li>Leopard Courier: Minimum {formatPKR(450)} advance required.</li>
                    <li>Out of city: 5-6 working days via TRAX.</li>
                  </>
                )}
              </ul>
              <p className="font-medium mt-2 pt-2 border-t border-primary/10">
                {method === "cod"
                  ? `Pay advance now, rest on delivery.`
                  : `Pay total amount to confirm your order.`}
              </p>
            </div>
          </dl>

          <Button type="submit" size="lg" className="mt-5 w-full" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" /> Placing order…
              </>
            ) : (
              "Place Order"
            )}
          </Button>
          <p className="mt-3 text-center text-[10px] text-muted-foreground leading-relaxed">
            Delivery charges apply as per courier receipt shared by service.
            <br />
            Estimated delivery: Karachi 1-2 days · Nationwide 3-6 days
          </p>
        </aside>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  const id = label.toLowerCase().replace(/[^a-z]+/g, "-");
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        required={required}
        maxLength={255}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5"
      />
    </div>
  );
}

function Line({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={accent ? "font-semibold text-success" : "font-medium"}>{value}</dd>
    </div>
  );
}

function CopyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg bg-secondary px-2.5 py-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="truncate font-semibold text-sm sm:text-base">{value}</p>
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-8 w-full sm:w-auto"
        onClick={() => {
          void navigator.clipboard
            .writeText(value)
            .then(() => toast.success("Copied", { description: value }))
            .catch(() => toast.error("Copy failed — please copy manually."));
        }}
      >
        <Copy className="mr-1 size-3.5" /> Copy
      </Button>
    </div>
  );
}
