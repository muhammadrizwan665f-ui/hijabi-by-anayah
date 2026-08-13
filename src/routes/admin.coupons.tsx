import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAdmin } from "@/lib/admin-store";
import { saveCoupon, deleteCouponFn } from "@/lib/admin.functions";
import type { Coupon } from "@/lib/types";

export const Route = createFileRoute("/admin/coupons")({
  component: AdminCoupons,
});

function AdminCoupons() {
  const { coupons, reload } = useAdmin();
  const [saving, setSaving] = useState(false);
  const [newCoupon, setNewCoupon] = useState<Coupon>({
    code: "",
    discountPct: 10,
    minOrder: 0,
    active: true,
  });

  async function handleAdd() {
    if (!newCoupon.code.trim()) {
      toast.error("Enter a code");
      return;
    }
    setSaving(true);
    try {
      await saveCoupon({ data: { coupon: { ...newCoupon, code: newCoupon.code.toUpperCase().trim() } } });
      await reload();
      setNewCoupon({ code: "", discountPct: 10, minOrder: 0, active: true });
      toast.success("Coupon added");
    } catch {
      toast.error("Failed to add coupon");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(code: string) {
    if (!confirm("Delete this coupon?")) return;
    try {
      await deleteCouponFn({ data: { code } });
      await reload();
      toast.success("Coupon deleted");
    } catch {
      toast.error("Failed to delete coupon");
    }
  }

  async function toggleStatus(coupon: Coupon) {
    try {
      await saveCoupon({ data: { coupon: { ...coupon, active: !coupon.active } } });
      await reload();
    } catch {
      toast.error("Failed to update status");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Discount Coupons</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage promotional codes for your customers.</p>
      </div>

      <div className="premium-card p-6">
        <h2 className="font-display text-lg font-bold">Create Coupon</h2>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <div className="w-full max-w-[200px]">
            <Label>Code</Label>
            <Input 
              placeholder="E.g. WELCOME10" 
              value={newCoupon.code}
              onChange={e => setNewCoupon(c => ({ ...c, code: e.target.value }))}
            />
          </div>
          <div className="w-32">
            <Label>Discount %</Label>
            <Input 
              type="number" 
              value={newCoupon.discountPct}
              onChange={e => setNewCoupon(c => ({ ...c, discountPct: Number(e.target.value) }))}
            />
          </div>
          <div className="w-40">
            <Label>Min. Order (PKR)</Label>
            <Input 
              type="number" 
              value={newCoupon.minOrder}
              onChange={e => setNewCoupon(c => ({ ...c, minOrder: Number(e.target.value) }))}
            />
          </div>
          <Button onClick={() => void handleAdd()} disabled={saving}>
            <Plus className="mr-2 size-4" /> Add Coupon
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {coupons.map(c => (
          <div key={c.code} className="premium-card p-5">
            <div className="flex items-center justify-between">
              <span className="font-display text-lg font-bold">{c.code}</span>
              <Switch checked={c.active} onCheckedChange={() => void toggleStatus(c)} />
            </div>
            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              <p>{c.discountPct}% OFF</p>
              <p>Min. Order: PKR {c.minOrder.toLocaleString()}</p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="mt-4 w-full text-destructive"
              onClick={() => void handleDelete(c.code)}
            >
              <Trash2 className="mr-2 size-4" /> Delete
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
