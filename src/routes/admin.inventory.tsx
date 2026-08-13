import { createFileRoute } from "@tanstack/react-router";
import { useAdmin } from "@/lib/admin-store";
import { Button } from "@/components/ui/button";
import { adjustStock } from "@/lib/admin.functions";
import { toast } from "sonner";
import { formatPKR } from "@/lib/pricing";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Package, Search, ArrowUpRight, ArrowDownRight, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/admin/inventory")({
  component: AdminInventory,
});

function AdminInventory() {
  const { products, settings, reload } = useAdmin();
  const [search, setSearch] = useState("");
  const lowThreshold = settings.lowStockThreshold || 5;

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockProducts = products.filter((p) => p.stock <= lowThreshold);
  const outOfStockProducts = products.filter((p) => p.stock <= 0);

  const bumpStock = (p: { id: string; name: string }, delta: number) => {
    void adjustStock({ data: { id: p.id, delta } })
      .then((r) => {
        void reload();
        toast.success(`${p.name} stock → ${r.stock}`);
      })
      .catch(() => toast.error("Could not update stock."));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Inventory Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor stock levels, track sales performance, and handle replenishments.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="premium-card p-4">
          <p className="text-sm font-medium text-muted-foreground">Total SKUs</p>
          <p className="mt-1 text-2xl font-bold">{products.length}</p>
        </div>
        <div className="premium-card p-4 border-warning/50 bg-warning/5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-warning-foreground">Low Stock Items</p>
            <AlertTriangle className="size-4 text-warning" />
          </div>
          <p className="mt-1 text-2xl font-bold text-warning-foreground">{lowStockProducts.length}</p>
        </div>
        <div className="premium-card p-4 border-destructive/50 bg-destructive/5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-destructive">Out of Stock</p>
            <Package className="size-4 text-destructive" />
          </div>
          <p className="mt-1 text-2xl font-bold text-destructive">{outOfStockProducts.length}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, SKU or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="premium-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3 text-center">Stock</th>
                <th className="px-4 py-3 text-center">Sold</th>
                <th className="px-4 py-3 text-right">Adjust Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProducts.map((p) => {
                const isLow = p.stock <= lowThreshold;
                const isOut = p.stock <= 0;
                
                return (
                  <tr key={p.id} className={isOut ? "bg-destructive/5" : isLow ? "bg-warning/5" : ""}>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.images[0] ?? "/placeholder.svg"}
                          alt=""
                          className="size-10 rounded object-cover"
                        />
                        <div className="min-w-0">
                          <p className="font-medium truncate max-w-[200px]">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-mono text-xs">{p.sku || "—"}</td>
                    <td className="px-4 py-4 text-center">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-bold ${
                        isOut ? "bg-destructive text-destructive-foreground" :
                        isLow ? "bg-warning text-warning-foreground" :
                        "bg-secondary text-secondary-foreground"
                      }`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center font-medium">{p.sold}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="outline"
                          className="size-8"
                          onClick={() => bumpStock(p, -1)}
                          disabled={p.stock <= 0}
                        >
                          −
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          className="size-8"
                          onClick={() => bumpStock(p, 1)}
                        >
                          +
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs"
                          onClick={() => bumpStock(p, 10)}
                        >
                          +10
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No products found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
