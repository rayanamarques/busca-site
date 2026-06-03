import { cn } from "@/lib/utils";
import { fmtInt } from "@/lib/utils";
import type { ReactNode } from "react";

export function KpiCard({
  label,
  value,
  hint,
  tone = "default",
  icon,
}: {
  label: string;
  value: number | string;
  hint?: string;
  tone?: "default" | "red" | "amber" | "green" | "blue";
  icon?: ReactNode;
}) {
  const accent = {
    default: "text-foreground",
    red: "text-red-600",
    amber: "text-amber-600",
    green: "text-emerald-600",
    blue: "text-blue-600",
  }[tone];

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted">{label}</p>
        {icon && <span className="text-muted">{icon}</span>}
      </div>
      <p className={cn("mt-2 text-2xl font-semibold tracking-tight", accent)}>
        {typeof value === "number" ? fmtInt(value) : value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
