import { useEffect, useState } from "react";
import { countdown } from "@/lib/pricing";
import { cn } from "@/lib/utils";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function Countdown({
  target,
  className,
  compact = false,
}: {
  target: string | null;
  className?: string;
  compact?: boolean;
}) {
  const [t, setT] = useState<ReturnType<typeof countdown> | null>(null);

  useEffect(() => {
    setT(countdown(target));
    const id = setInterval(() => setT(countdown(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (!t) return null;
  if (t.done)
    return null;

  const units = [
    { v: t.d, l: "Days" },
    { v: t.h, l: "Hrs" },
    { v: t.m, l: "Min" },
    { v: t.s, l: "Sec" },
  ].filter((u, i) => (i === 0 ? t.d > 0 : true));

  if (compact) {
    return (
      <span className={cn("font-display font-bold tabular-nums", className)}>
        {t.d > 0 ? `${t.d}d ` : ""}
        {pad(t.h)}:{pad(t.m)}:{pad(t.s)}
      </span>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {units.map((u) => (
        <div
          key={u.l}
          className="min-w-14 rounded-xl border border-primary/20 bg-surface px-2 py-1.5 text-center shadow-soft text-primary"
        >
          <div className="font-display text-xl font-bold tabular-nums">{pad(u.v)}</div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{u.l}</div>
        </div>
      ))}
    </div>
  );
}
