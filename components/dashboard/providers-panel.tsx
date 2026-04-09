"use client";

import { cn } from "@/lib/utils";

interface ProvidersPanelProps {
  providers: Record<string, number>;
  isLoading: boolean;
}

const providerIcons: Record<string, string> = {
  google: "G",
  aws: "A",
  stripe: "S",
  twilio: "T",
  github: "GH",
  openai: "AI",
};

const providerColors: Record<string, string> = {
  google: "from-blue-500 to-blue-600",
  aws: "from-orange-500 to-orange-600",
  stripe: "from-violet-500 to-violet-600",
  twilio: "from-red-500 to-red-600",
  github: "from-zinc-400 to-zinc-500",
  openai: "from-teal-500 to-teal-600",
};

export function ProvidersPanel({ providers, isLoading }: ProvidersPanelProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 p-4 md:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-lg border border-zinc-800 bg-zinc-900/50 p-3"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded bg-zinc-800" />
              <div className="flex-1">
                <div className="h-3 w-12 rounded bg-zinc-800" />
                <div className="mt-1 h-5 w-8 rounded bg-zinc-800" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const entries = Object.entries(providers);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  if (entries.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="font-mono text-sm text-zinc-500">No providers found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 p-4 md:grid-cols-3">
      {entries.map(([provider, count], index) => {
        const percentage = total > 0 ? (count / total) * 100 : 0;
        const icon = providerIcons[provider.toLowerCase()] || provider.charAt(0).toUpperCase();
        const gradient = providerColors[provider.toLowerCase()] || "from-zinc-500 to-zinc-600";

        return (
          <div
            key={provider}
            className={cn(
              "group relative overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50 p-3",
              "transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-900/80"
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Progress bar background */}
            <div
              className={cn(
                "absolute inset-y-0 left-0 bg-gradient-to-r opacity-5 transition-opacity group-hover:opacity-10",
                gradient
              )}
              style={{ width: `${percentage}%` }}
            />

            <div className="relative flex items-center gap-3">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded bg-gradient-to-br font-mono text-xs font-bold text-white",
                  gradient
                )}
              >
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate font-mono text-xs uppercase tracking-wider text-zinc-500">
                  {provider}
                </p>
                <p className="font-mono text-lg font-bold tabular-nums text-zinc-200">
                  {count.toLocaleString()}
                </p>
              </div>
              <span className="font-mono text-xs text-zinc-600">
                {percentage.toFixed(0)}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
