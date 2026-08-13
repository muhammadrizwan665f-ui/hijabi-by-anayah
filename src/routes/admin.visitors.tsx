import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Activity, Globe, RefreshCw, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAnalytics } from "@/lib/admin.functions";
import type { AnalyticsSummary } from "@/lib/types";

export const Route = createFileRoute("/admin/visitors")({
  component: AdminVisitors,
});

function timeAgo(iso: string) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function AdminVisitors() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    void getAnalytics()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  const cards = [
    { label: "Live right now", value: data?.live ?? 0, Icon: Activity },
    { label: "Today", value: data?.today ?? 0, Icon: Users },
    { label: "Yesterday", value: data?.yesterday ?? 0, Icon: Users },
    { label: "Last 7 days", value: data?.last7 ?? 0, Icon: Users },
    { label: "Last 30 days", value: data?.last30 ?? 0, Icon: Globe },
    { label: "All time", value: data?.total ?? 0, Icon: Globe },
  ];

  return (
    <div className="pb-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Visitors</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live sessions refresh automatically every 30 seconds.
          </p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={`mr-2 size-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map(({ label, value, Icon }) => (
          <div key={label} className="premium-card p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{label}</p>
              <Icon className="size-4 text-primary" />
            </div>
            <p className="mt-2 font-display text-3xl font-bold tabular-nums">
              {value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <div className="premium-card mt-6 p-6">
        <h2 className="font-display font-bold">Visits — last 14 days</h2>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data?.daily ?? []}>
              <XAxis dataKey="day" fontSize={12} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="visits"
                stroke="var(--color-chart-1)"
                fill="var(--color-chart-1)"
                fillOpacity={0.2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="premium-card p-6">
          <h2 className="font-display font-bold">Live visitors</h2>
          {(data?.liveVisitors.length ?? 0) === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No one is browsing right now.</p>
          ) : (
            <ul className="mt-4 space-y-3 text-sm">
              {data?.liveVisitors.map((v) => (
                <li key={v.id} className="flex flex-wrap justify-between gap-2">
                  <span className="font-medium">
                    <span className="mr-2 inline-block size-2 rounded-full bg-success" />
                    {v.path}
                  </span>
                  <span className="text-muted-foreground">
                    {[v.city, v.country].filter(Boolean).join(", ") || "Unknown"} · {v.device ?? "—"}{" "}
                    · {v.browser ?? "—"} · {timeAgo(v.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="premium-card p-6">
          <h2 className="font-display font-bold">Top pages</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {(data?.topPages ?? []).map((p) => (
              <li key={p.path} className="flex justify-between gap-2">
                <span className="truncate">{p.path}</span>
                <span className="font-semibold tabular-nums">{p.visits}</span>
              </li>
            ))}
          </ul>
          <h2 className="mt-6 font-display font-bold">Devices</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {(data?.devices ?? []).map((d) => (
              <li key={d.device} className="flex justify-between gap-2">
                <span className="capitalize">{d.device}</span>
                <span className="font-semibold tabular-nums">{d.visits}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="premium-card mt-6 p-6">
        <h2 className="font-display font-bold">Recent visitor log</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="pb-2">When</th>
                <th className="pb-2">Page</th>
                <th className="pb-2">Location</th>
                <th className="pb-2">Device</th>
                <th className="pb-2">Source</th>
              </tr>
            </thead>
            <tbody>
              {(data?.recentVisitors ?? []).map((v) => (
                <tr key={v.id} className="border-t border-border">
                  <td className="py-2 whitespace-nowrap">{timeAgo(v.createdAt)}</td>
                  <td className="py-2">{v.path}</td>
                  <td className="py-2">
                    {[v.city, v.country].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="py-2">
                    {v.device ?? "—"} · {v.os ?? "—"}
                  </td>
                  <td className="py-2 max-w-[220px] truncate">{v.referrer ?? "Direct"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
