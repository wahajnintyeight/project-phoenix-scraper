"use client";

import { useState } from "react";
import { ApiKey } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface KeysTableProps {
  keys: ApiKey[];
  isLoading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  filterProvider?: string;
  filterStatus?: string;
  onFilterProviderChange: (provider: string) => void;
  onFilterStatusChange: (status: string) => void;
  providers: string[];
}

function StatusBadge({ status }: { status: ApiKey["status"] }) {
  const styles = {
    valid: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    invalid: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    pending: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    error: "bg-red-500/10 text-red-400 border-red-500/30",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 font-mono text-xs uppercase",
        styles[status]
      )}
    >
      {status}
    </span>
  );
}

function ProviderBadge({ provider }: { provider: string }) {
  const colors: Record<string, string> = {
    google: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    aws: "bg-orange-500/10 text-orange-400 border-orange-500/30",
    stripe: "bg-violet-500/10 text-violet-400 border-violet-500/30",
    twilio: "bg-red-500/10 text-red-400 border-red-500/30",
    github: "bg-zinc-500/10 text-zinc-300 border-zinc-500/30",
    openai: "bg-teal-500/10 text-teal-400 border-teal-500/30",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 font-mono text-xs uppercase",
        colors[provider.toLowerCase()] ||
          "bg-zinc-500/10 text-zinc-400 border-zinc-500/30"
      )}
    >
      {provider}
    </span>
  );
}

function KeyValue({ value }: { value: string }) {
  const [revealed, setRevealed] = useState(false);
  const masked = value.slice(0, 8) + "•".repeat(12) + value.slice(-4);

  return (
    <button
      onClick={() => setRevealed(!revealed)}
      className="group flex items-center gap-2 text-left font-mono text-sm transition-colors hover:text-zinc-300"
    >
      <span className="text-zinc-400">{revealed ? value : masked}</span>
      <span className="text-xs text-zinc-600 opacity-0 transition-opacity group-hover:opacity-100">
        {revealed ? "hide" : "reveal"}
      </span>
    </button>
  );
}

export function KeysTable({
  keys,
  isLoading,
  currentPage,
  totalPages,
  onPageChange,
  filterProvider,
  filterStatus,
  onFilterProviderChange,
  onFilterStatusChange,
  providers,
}: KeysTableProps) {
  const statuses = ["valid", "invalid", "pending", "error"];

  return (
    <div className="flex flex-col">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 border-b border-zinc-800 bg-zinc-900/50 px-4 py-3">
        <span className="font-mono text-xs uppercase tracking-wider text-zinc-500">
          Filters
        </span>

        <div className="flex items-center gap-2">
          <select
            value={filterProvider || ""}
            onChange={(e) => onFilterProviderChange(e.target.value)}
            className="rounded border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 font-mono text-xs text-zinc-300 outline-none transition-colors hover:border-zinc-600 focus:border-zinc-500"
          >
            <option value="">All Providers</option>
            {providers.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <select
            value={filterStatus || ""}
            onChange={(e) => onFilterStatusChange(e.target.value)}
            className="rounded border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 font-mono text-xs text-zinc-300 outline-none transition-colors hover:border-zinc-600 focus:border-zinc-500"
          >
            <option value="">All Statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/30">
              <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-zinc-500">
                Key
              </th>
              <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-zinc-500">
                Provider
              </th>
              <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-zinc-500">
                Status
              </th>
              <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-zinc-500">
                Created
              </th>
              <th className="px-4 py-3 text-left font-mono text-xs uppercase tracking-wider text-zinc-500">
                Last Seen
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <tr
                  key={i}
                  className="animate-pulse border-b border-zinc-800/50"
                >
                  <td className="px-4 py-3">
                    <div className="h-4 w-48 rounded bg-zinc-800" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-16 rounded bg-zinc-800" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-14 rounded bg-zinc-800" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-24 rounded bg-zinc-800" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-4 w-24 rounded bg-zinc-800" />
                  </td>
                </tr>
              ))
            ) : keys.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center font-mono text-sm text-zinc-500"
                >
                  No keys found
                </td>
              </tr>
            ) : (
              keys.map((key, index) => (
                <tr
                  key={key._id}
                  className="group border-b border-zinc-800/50 transition-colors hover:bg-zinc-800/20"
                  style={{
                    animationDelay: `${index * 30}ms`,
                  }}
                >
                  <td className="px-4 py-3">
                    <KeyValue value={key.key_value} />
                  </td>
                  <td className="px-4 py-3">
                    <ProviderBadge provider={key.provider} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={key.status} />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                    {new Date(key.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                    {key.last_seen_at
                      ? new Date(key.last_seen_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-zinc-800 bg-zinc-900/50 px-4 py-3">
          <span className="font-mono text-xs text-zinc-500">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="h-7 border-zinc-700 bg-transparent px-3 font-mono text-xs text-zinc-400 hover:border-zinc-600 hover:bg-zinc-800 hover:text-zinc-300"
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="h-7 border-zinc-700 bg-transparent px-3 font-mono text-xs text-zinc-400 hover:border-zinc-600 hover:bg-zinc-800 hover:text-zinc-300"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
