import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPKR } from "@/lib/pricing";
import { useAdmin } from "@/lib/admin-store";
import {
  adjustStock,
  deleteProductFn,
  duplicateProductFn,
  saveProduct,
  uploadProductImage,
} from "@/lib/admin.functions";
import type { Product, ProductColor } from "@/lib/types";

export const Route = createFileRoute("/admin/products")({
  component: AdminProducts,
});

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function blankProduct(sortOrder: number): Product {
  return {
    id: "",
    slug: "",
    name: "",
    category: "Hijabs",
    brand: "Anayah",
    sku: "",
    tagline: "",
    description: "",
    price: 0,
    salePrice: null,
    stock: 0,
    sold: 0,
    rating: 5,
    images: [],
    colors: [],
    features: [],
    specs: [],
    included: [],
    warranty: "7-day exchange on unworn pieces",
    shippingDetails: "Delivery in 2–4 working days across Pakistan.",
    flashSale: false,
    flashEndsAt: null,
    bulkRules: [],
    badges: [],
    featured: false,
    trending: false,
    active: true,
    sortOrder,
    reviews: [],
    faqs: [],
  };
}

function AdminProducts() {
  const { products, settings, reload } = useAdmin();
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [lowOnly, setLowOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"default" | "stock" | "sold">("default");

  const categories = useMemo(() => {
    const fromSettings = settings.categories?.map((c) => c.name) || [];
    const fromProducts = Array.from(new Set(products.map((p) => p.category)));
    return Array.from(new Set([...fromSettings, ...fromProducts]))
      .filter(Boolean)
      .sort();
  }, [products, settings.categories]);

  const lowThreshold = settings.lowStockThreshold || 5;
  const isLow = (p: Product) => p.stock <= lowThreshold;

  const visible = products
    .filter((p) => (lowOnly ? isLow(p) : true))
    .slice()
    .sort((a, b) =>
      sortBy === "stock" ? a.stock - b.stock : sortBy === "sold" ? b.sold - a.sold : 0,
    );

  const bumpStock = (p: Product, delta: number) => {
    void adjustStock({ data: { id: p.id, delta } })
      .then((r) => {
        void reload();
        toast.success(`${p.name} stock → ${r.stock}`);
      })
      .catch(() => toast.error("Could not update stock."));
  };


  const upsertProduct = async (product: Product) => {
    setSaving(true);
    try {
      await saveProduct({ data: { product } });
      await reload();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save this product.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = (id: string) => {
    void deleteProductFn({ data: { id } })
      .then(() => reload())
      .then(() => toast.success("Product deleted"))
      .catch(() => toast.error("Could not delete this product."));
  };

  const duplicate = (id: string) => {
    void duplicateProductFn({ data: { id } })
      .then(() => reload())
      .then(() => toast.success("Product duplicated (hidden until you activate it)"))
      .catch(() => toast.error("Could not duplicate this product."));
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Add new products, edit prices, stock, flash sale timers and bulk discount rules —
            changes apply to the storefront instantly.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setCreating(creating ? null : blankProduct(products.length + 1));
          }}
        >
          {creating ? "Cancel" : "+ Add product"}
        </Button>
      </div>

      {creating ? (
        <div className="premium-card mt-6 p-5">
          <p className="font-display text-lg font-semibold">New product</p>
          <ProductForm
            value={creating}
            onChange={setCreating}
            saving={saving}
            categories={categories}
            submitLabel="Create product"
            onSubmit={async () => {
              const name = creating.name.trim();
              if (!name) {
                toast.error("Please add a product name.");
                return;
              }
              const product: Product = {
                ...creating,
                name,
                slug: creating.slug.trim() || slugify(name),
                sku: creating.sku.trim() || `AUD-${Date.now().toString(36).toUpperCase().slice(-5)}`,
              };
              const ok = await upsertProduct(product);
              if (ok) {
                toast.success("Product added");
                setCreating(null);
              }
            }}
          />
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={lowOnly ? "default" : "secondary"}
          className="h-8 text-xs"
          onClick={() => setLowOnly((v) => !v)}
        >
          Low stock only ({products.filter(isLow).length})
        </Button>
        <Button
          size="sm"
          variant={sortBy === "stock" ? "default" : "secondary"}
          className="h-8 text-xs"
          onClick={() => setSortBy(sortBy === "stock" ? "default" : "stock")}
        >
          Sort by stock
        </Button>
        <Button
          size="sm"
          variant={sortBy === "sold" ? "default" : "secondary"}
          className="h-8 text-xs"
          onClick={() => setSortBy(sortBy === "sold" ? "default" : "sold")}
        >
          Sort by sold
        </Button>
      </div>

      <div className="mt-4 space-y-4">
        {visible.map((p) => (
          <div
            key={p.id}
            className={`premium-card p-5 ${isLow(p) ? "border-warning/60 bg-warning/5" : ""}`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-4">
                <img
                  src={p.images[0] ?? "/placeholder.svg"}
                  alt=""
                  loading="lazy"
                  className="size-12 rounded-lg object-cover sm:size-16 sm:rounded-xl"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-display font-semibold truncate">{p.name}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-tight sm:text-xs">
                    {p.category} · {formatPKR(p.salePrice ?? p.price)}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] sm:text-xs">
                    <span
                      className={`rounded-full px-2 py-0.5 font-semibold ${
                        p.stock <= 0
                          ? "bg-destructive/10 text-destructive"
                          : isLow(p)
                            ? "bg-warning/15 text-warning"
                            : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      Stock {p.stock}
                      {p.stock <= 0 ? " · Out of stock" : isLow(p) ? " · Low" : ""}
                    </span>
                    <span className="rounded-full bg-secondary px-2 py-0.5 font-semibold text-muted-foreground">
                      Sold {p.sold}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-7 w-7 p-0 text-xs"
                      aria-label={`Decrease stock for ${p.name}`}
                      onClick={() => bumpStock(p, -1)}
                    >
                      −
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-7 w-7 p-0 text-xs"
                      aria-label={`Increase stock for ${p.name}`}
                      onClick={() => bumpStock(p, 1)}
                    >
                      +
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-[10px] sm:text-xs"
                      onClick={() => bumpStock(p, 10)}
                    >
                      +10
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-[10px] sm:text-xs"
                      onClick={() => bumpStock(p, 50)}
                    >
                      +50
                    </Button>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 sm:border-0 sm:pt-0 sm:justify-end">
                <Label htmlFor={`active-${p.id}`} className="text-xs">
                  Active
                </Label>
                <Switch
                  id={`active-${p.id}`}
                  checked={p.active}
                  onCheckedChange={(v) => void upsertProduct({ ...p, active: v })}
                />
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 text-xs"
                    onClick={() => {
                      setCreating(null);
                      setEditing(editing?.id === p.id ? null : p);
                    }}
                  >
                    {editing?.id === p.id ? "Close" : "Edit"}
                  </Button>
                  <Button size="sm" variant="secondary" className="h-8 text-xs" onClick={() => duplicate(p.id)}>
                    Copy
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 text-xs text-destructive" onClick={() => deleteProduct(p.id)}>
                    Del
                  </Button>
                </div>
              </div>
            </div>

            {editing?.id === p.id ? (
              <ProductForm
                value={editing}
                onChange={setEditing}
                saving={saving}
                categories={categories}
                submitLabel="Save changes"
                onSubmit={async () => {
                  const ok = await upsertProduct(editing);
                  if (ok) {
                    toast.success("Product updated");
                    setEditing(null);
                  }
                }}
              />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductForm({
  value,
  onChange,
  onSubmit,
  saving,
  submitLabel,
  categories = [],
}: {
  value: Product;
  onChange: (p: Product) => void;
  onSubmit: () => void | Promise<void>;
  saving: boolean;
  submitLabel: string;
  categories?: string[];
}) {
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files: FileList) => {
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error("Could not read this file."));
          reader.readAsDataURL(file);
        });
        const { url } = await uploadProductImage({ data: { dataUrl, name: file.name } });
        urls.push(url);
      }
      onChange({ ...value, images: [...value.images, ...urls] });
      toast.success(`${files.length} image(s) uploaded`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const uploadMany = async (files: FileList) => {
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Could not read this file."));
        reader.readAsDataURL(file);
      });
      const { url } = await uploadProductImage({ data: { dataUrl, name: file.name } });
      urls.push(url);
    }
    return urls;
  };

  const updateColor = (index: number, next: ProductColor) => {
    onChange({
      ...value,
      colors: (value.colors ?? []).map((c, k) => (k === index ? next : c)),
    });
  };

  const handleColorFiles = async (index: number, files: FileList) => {
    setUploading(true);
    try {
      const urls = await uploadMany(files);
      const list = value.colors ?? [];
      const current = list[index];
      if (!current) return;
      onChange({
        ...value,
        colors: list.map((c, k) => (k === index ? { ...c, images: [...c.images, ...urls] } : c)),
      });
      toast.success(`${urls.length} image(s) added to ${current.name || "this colour"}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form
      className="mt-5 grid gap-4 border-t border-border pt-5 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        void onSubmit();
      }}
    >
      <div>
        <Label>Name</Label>
        <Input
          className="mt-1.5"
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
        />
      </div>
      <div>
        <Label>Category</Label>
        <div className="mt-1.5 flex gap-2">
          <Select
            value={value.category}
            onValueChange={(v) => onChange({ ...value, category: v })}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select or type category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
              <SelectItem value="NEW_CATEGORY">+ Add New Category</SelectItem>
            </SelectContent>
          </Select>
          {value.category === "NEW_CATEGORY" && (
            <Input
              autoFocus
              placeholder="Enter new category name"
              onBlur={(e) => {
                const val = e.target.value.trim();
                if (val) onChange({ ...value, category: val });
                else onChange({ ...value, category: "" });
              }}
            />
          )}
        </div>
      </div>
      <div>
        <Label>URL slug</Label>
        <Input
          className="mt-1.5"
          placeholder="auto-generated from name"
          value={value.slug}
          onChange={(e) => onChange({ ...value, slug: e.target.value })}
        />
      </div>
      <div>
        <Label>SKU</Label>
        <Input
          className="mt-1.5"
          value={value.sku}
          onChange={(e) => onChange({ ...value, sku: e.target.value })}
        />
      </div>
      <div>
        <Label>Original price</Label>
        <Input
          type="number"
          className="mt-1.5"
          value={value.price}
          onChange={(e) => onChange({ ...value, price: Number(e.target.value) })}
        />
      </div>
      <div>
        <Label>Sale price</Label>
        <Input
          type="number"
          className="mt-1.5"
          value={value.salePrice ?? ""}
          onChange={(e) =>
            onChange({ ...value, salePrice: e.target.value ? Number(e.target.value) : null })
          }
        />
      </div>
      <div>
        <Label>Stock</Label>
        <Input
          type="number"
          className="mt-1.5"
          value={value.stock}
          onChange={(e) => onChange({ ...value, stock: Number(e.target.value) })}
        />
      </div>
      <div>
        <Label>Sold counter</Label>
        <Input
          type="number"
          className="mt-1.5"
          value={value.sold}
          onChange={(e) => onChange({ ...value, sold: Number(e.target.value) })}
        />
      </div>
      <div className="sm:col-span-2">
        <Label>Tagline</Label>
        <Input
          className="mt-1.5"
          value={value.tagline}
          onChange={(e) => onChange({ ...value, tagline: e.target.value })}
        />
      </div>
      <div className="sm:col-span-2">
        <Label>Description</Label>
        <Textarea
          className="mt-1.5"
          rows={3}
          value={value.description}
          onChange={(e) => onChange({ ...value, description: e.target.value })}
        />
      </div>

      <div className="sm:col-span-2">
        <Label>Images</Label>
        <div className="mt-2 flex flex-wrap gap-3">
          {value.images.map((src, i) => (
            <div key={`${src}-${i}`} className="relative">
              <img src={src} alt="" className="size-20 rounded-xl object-cover" />
              <button
                type="button"
                className="absolute -right-2 -top-2 rounded-full bg-destructive px-2 text-xs text-destructive-foreground"
                onClick={() => onChange({ ...value, images: value.images.filter((_, k) => k !== i) })}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Input
            type="file"
            multiple
            accept="image/*"
            className="max-w-xs"
            disabled={uploading}
            onChange={(e) => {
              if (e.target.files?.length) void handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
          {uploading ? <span className="text-xs text-muted-foreground">Uploading…</span> : null}
        </div>
      </div>

      <div className="sm:col-span-2 rounded-2xl border border-border p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <Label>Colour options</Label>
            <p className="mt-1 text-xs text-muted-foreground">
              Add each colour with its own images. On the product page, tapping a colour shows only
              that colour&apos;s images.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              onChange({
                ...value,
                colors: [...(value.colors ?? []), { name: "", hex: "#C9A88A", images: [] }],
              })
            }
          >
            + Add colour
          </Button>
        </div>

        <div className="mt-4 space-y-4">
          {(value.colors ?? []).map((color, ci) => (
            <div key={ci} className="rounded-xl bg-surface-2 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  className="max-w-[180px]"
                  placeholder="Colour name (e.g. Ivory)"
                  value={color.name}
                  onChange={(e) => updateColor(ci, { ...color, name: e.target.value })}
                />
                <input
                  type="color"
                  aria-label="Swatch colour"
                  className="size-9 shrink-0 cursor-pointer rounded-lg border border-border bg-transparent"
                  value={color.hex || "#C9A88A"}
                  onChange={(e) => updateColor(ci, { ...color, hex: e.target.value })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() =>
                    onChange({ ...value, colors: (value.colors ?? []).filter((_, k) => k !== ci) })
                  }
                >
                  Remove
                </Button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {color.images.map((src, i) => (
                  <div key={`${src}-${i}`} className="relative">
                    <img src={src} alt="" className="size-16 rounded-lg object-cover" />
                    <button
                      type="button"
                      className="absolute -right-2 -top-2 rounded-full bg-destructive px-1.5 text-xs text-destructive-foreground"
                      onClick={() =>
                        updateColor(ci, {
                          ...color,
                          images: color.images.filter((_, k) => k !== i),
                        })
                      }
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <Input
                type="file"
                multiple
                accept="image/*"
                className="mt-3 max-w-xs"
                disabled={uploading}
                onChange={(e) => {
                  if (e.target.files?.length) void handleColorFiles(ci, e.target.files);
                  e.target.value = "";
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label>Flash sale ends at</Label>
        <Input
          type="datetime-local"
          className="mt-1.5"
          value={value.flashEndsAt ? new Date(value.flashEndsAt).toISOString().slice(0, 16) : ""}
          onChange={(e) =>
            onChange({
              ...value,
              flashEndsAt: e.target.value ? new Date(e.target.value).toISOString() : null,
              flashSale: Boolean(e.target.value),
            })
          }
        />
      </div>
      <div className="flex items-end gap-6 pb-1">
        <label className="flex items-center gap-2 text-sm">
          <Switch
            checked={value.featured}
            onCheckedChange={(v) => onChange({ ...value, featured: v })}
          />
          Featured
        </label>
        <label className="flex items-center gap-2 text-sm">
          <Switch
            checked={value.trending}
            onCheckedChange={(v) => onChange({ ...value, trending: v })}
          />
          Trending
        </label>
      </div>

      <div className="sm:col-span-2">
        <Label>Bulk discount rules</Label>
        <div className="mt-2 space-y-2">
          {value.bulkRules.map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              <Input
                type="number"
                className="w-28"
                value={r.minQty}
                aria-label="Minimum quantity"
                onChange={(e) => {
                  const rules = [...value.bulkRules];
                  rules[i] = { ...r, minQty: Number(e.target.value) };
                  onChange({ ...value, bulkRules: rules });
                }}
              />
              <span className="text-sm text-muted-foreground">pcs →</span>
              <Input
                type="number"
                className="w-28"
                value={r.discountPct}
                aria-label="Discount percent"
                onChange={(e) => {
                  const rules = [...value.bulkRules];
                  rules[i] = { ...r, discountPct: Number(e.target.value) };
                  onChange({ ...value, bulkRules: rules });
                }}
              />
              <span className="text-sm text-muted-foreground">% off</span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() =>
                  onChange({ ...value, bulkRules: value.bulkRules.filter((_, k) => k !== i) })
                }
              >
                Remove
              </Button>
            </div>
          ))}
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() =>
              onChange({ ...value, bulkRules: [...value.bulkRules, { minQty: 10, discountPct: 30 }] })
            }
          >
            Add rule
          </Button>
        </div>
      </div>

      <div className="sm:col-span-2 space-y-4 border-t border-border pt-5">
        <div>
          <Label>Features (one per line)</Label>
          <Textarea
            className="mt-1.5"
            rows={3}
            placeholder="No-slip material&#10;Breathable fabric"
            value={value.features.join("\n")}
            onChange={(e) => onChange({ ...value, features: e.target.value.split("\n").filter(Boolean) })}
          />
        </div>
        
        <div>
          <Label>Included items (one per line)</Label>
          <Textarea
            className="mt-1.5"
            rows={2}
            placeholder="1x Luxury Hijab&#10;1x Signature Gift Box"
            value={value.included.join("\n")}
            onChange={(e) => onChange({ ...value, included: e.target.value.split("\n").filter(Boolean) })}
          />
        </div>

        <div>
          <Label>Specifications</Label>
          <div className="mt-2 space-y-2">
            {value.specs.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  className="flex-1"
                  placeholder="Label (e.g. Fabric)"
                  value={s.label}
                  onChange={(e) => {
                    const specs = [...value.specs];
                    specs[i] = { ...s, label: e.target.value };
                    onChange({ ...value, specs });
                  }}
                />
                <Input
                  className="flex-1"
                  placeholder="Value (e.g. Chiffon)"
                  value={s.value}
                  onChange={(e) => {
                    const specs = [...value.specs];
                    specs[i] = { ...s, value: e.target.value };
                    onChange({ ...value, specs });
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    onChange({ ...value, specs: value.specs.filter((_, k) => k !== i) })
                  }
                >
                  ×
                </Button>
              </div>
            ))}
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() =>
                onChange({ ...value, specs: [...value.specs, { label: "", value: "" }] })
              }
            >
              + Add spec
            </Button>
          </div>
        </div>

        <div>
          <Label>FAQs</Label>
          <div className="mt-2 space-y-3">
            {value.faqs.map((f, i) => (
              <div key={i} className="space-y-2 rounded-xl border border-border p-3">
                <div className="flex justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">FAQ {i + 1}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-destructive"
                    onClick={() =>
                      onChange({ ...value, faqs: value.faqs.filter((_, k) => k !== i) })
                    }
                  >
                    Remove
                  </Button>
                </div>
                <Input
                  placeholder="Question"
                  value={f.q}
                  onChange={(e) => {
                    const faqs = [...value.faqs];
                    faqs[i] = { ...f, q: e.target.value };
                    onChange({ ...value, faqs });
                  }}
                />
                <Textarea
                  placeholder="Answer"
                  rows={2}
                  value={f.a}
                  onChange={(e) => {
                    const faqs = [...value.faqs];
                    faqs[i] = { ...f, a: e.target.value };
                    onChange({ ...value, faqs });
                  }}
                />
              </div>
            ))}
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() =>
                onChange({ ...value, faqs: [...value.faqs, { q: "", a: "" }] })
              }
            >
              + Add FAQ
            </Button>
          </div>
        </div>
      </div>

      <div className="sm:col-span-2">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
