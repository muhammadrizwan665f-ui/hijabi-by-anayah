import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { Mail, Phone } from "lucide-react";
import { useAdmin } from "@/lib/admin-store";
import { formatPKR } from "@/lib/pricing";

export const Route = createFileRoute("/admin/customers")({
  component: AdminCustomers,
});

function AdminCustomers() {
  const { orders } = useAdmin();

  // Aggregate unique customers from orders
  const customersMap = new Map<string, { 
    name: string; 
    email: string; 
    phone: string; 
    city: string; 
    totalSpent: number; 
    orderCount: number;
    lastOrder: string;
  }>();

  orders.forEach(o => {
    const key = o.customer.phone;
    const existing = customersMap.get(key);
    if (existing) {
      existing.totalSpent += o.total;
      existing.orderCount += 1;
      if (new Date(o.createdAt) > new Date(existing.lastOrder)) {
        existing.lastOrder = o.createdAt;
      }
    } else {
      customersMap.set(key, {
        name: o.customer.fullName,
        email: o.customer.email ?? "",
        phone: o.customer.phone,
        city: o.customer.city,
        totalSpent: o.total,
        orderCount: 1,
        lastOrder: o.createdAt
      });
    }
  });

  const customerList = Array.from(customersMap.values()).sort((a, b) => b.totalSpent - a.totalSpent);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">Customers</h1>
        <p className="mt-1 text-sm text-muted-foreground">Total {customerList.length} unique customers discovered from orders.</p>
      </div>

      <div className="grid gap-4">
        <div className="hidden premium-card overflow-hidden sm:block">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-secondary/30 text-xs font-semibold uppercase">
                <tr>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Contact</th>
                  <th className="px-6 py-3 text-right">Orders</th>
                  <th className="px-6 py-3 text-right">Total Spent</th>
                  <th className="px-6 py-3">Last Order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {customerList.map(c => (
                  <tr key={c.phone} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.city}</p>
                    </td>
                    <td className="px-6 py-4 space-y-1">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Phone className="size-3" /> {c.phone}
                      </div>
                      {c.email && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Mail className="size-3" /> {c.email}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      {c.orderCount}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-primary">
                      {formatPKR(c.totalSpent)}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {format(new Date(c.lastOrder), "MMM d, yyyy")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile View */}
        <div className="space-y-4 sm:hidden">
          {customerList.map(c => (
            <div key={c.phone} className="premium-card p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-display font-bold">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.city}</p>
                </div>
                <div className="text-right">
                  <p className="font-display font-bold text-primary">{formatPKR(c.totalSpent)}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">{c.orderCount} orders</p>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 pt-2 border-t border-border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="size-3.5" /> {c.phone}
                </div>
                {c.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="size-3.5" /> {c.email}
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground pt-1">
                  Last order: {format(new Date(c.lastOrder), "MMM d, yyyy")}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
