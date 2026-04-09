"use client";

import { Stats } from "@/lib/api";
import { cn } from "@/lib/utils";

interface StatsPanelProps {
  stats: Stats | null;
  isLoading: boolean;
}

function StatCard({
  label,
  value,
  accent,
  delay,
}: {
  label: string;
  value: number | string;
  accent?: "valid" | "invalid" | "pending" | "error" | "default";
  delay?: number;
}) {
  const accentColors = {
    valid: "border-l-emerald-500 bg-emerald-500/5",
    invalid: "border-l-rose-500 bg-rose-500/5",
    pending: "border-l-amber-500 bg-amber-500/5",
    error: "border-l-red-600 bg-red-600/5",
    default: "border-l-zinc-500 bg-zinc-500/5",
  };

  const textColors = {
    valid: "text-emerald-400",
    invalid: "text-rose-400",
    pending: "text-amber-400",
    error: "text-red-400",
    default: "text-zinc-300",
  };

  return (
    <div
      className={cn(
        "relative border-l-2 px-4 py-3 transition-all duration-300",
        "hover:translate-x-1",
        accentColors[accent || "default"]
      )}
      style={{
        animationDelay: delay ? `${delay}ms` : undefined,
      }}
    >
      <p className="font-mono text-xs uppercase tracking-wider text-zinc-500">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-mono text-2xl font-bold tabular-nums",
          textColors[accent || "default"]
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function StatsPanel({ stats, isLoading }: StatsPanelProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-px bg-zinc-800/50 md:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse bg-zinc-900/80 px-4 py-3">
            <div className="h-3 w-16 rounded bg-zinc-800" />
            <div className="mt-2 h-7 w-12 rounded bg-zinc-800" />
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center bg-zinc-900/50 px-4 py-6">
        <p className="font-mono text-sm text-zinc-500">No data available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-px bg-zinc-800/30 md:grid-cols-5">
      <StatCard label="Total" value={stats.total_keys} delay={0} />
      <StatCard
        label="Valid"
        value={stats.valid_keys}
        accent="valid"
        delay={50}
      />
      <StatCard
        label="Invalid"
        value={stats.invalid_keys}
        accent="invalid"
        delay={100}
      />
      <StatCard
        label="Pending"
        value={stats.pending_keys}
        accent="pending"
        delay={150}
      />
      <StatCard
        label="Errors"
        value={stats.error_keys}
        accent="error"
        delay={200}
      />
    </div>
  );
}
