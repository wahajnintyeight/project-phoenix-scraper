"use client";

import { useState } from "react";
import { SearchQuery, createQuery, deleteQuery } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface QueriesPanelProps {
  queries: SearchQuery[];
  isLoading: boolean;
  onRefresh: () => void;
}

export function QueriesPanel({
  queries,
  isLoading,
  onRefresh,
}: QueriesPanelProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newProvider, setNewProvider] = useState("");
  const [newQuery, setNewQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleAdd() {
    if (!newProvider.trim() || !newQuery.trim()) return;
    setIsSubmitting(true);
    try {
      await createQuery(newProvider.trim(), newQuery.trim(), true);
      setNewProvider("");
      setNewQuery("");
      setIsAdding(false);
      onRefresh();
    } catch (err) {
      console.error("[v0] Failed to create query:", err);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await deleteQuery(id);
      onRefresh();
    } catch (err) {
      console.error("[v0] Failed to delete query:", err);
    } finally {
      setDeletingId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded border border-zinc-800 bg-zinc-900/50 p-3"
          >
            <div className="flex items-center gap-3">
              <div className="h-5 w-16 rounded bg-zinc-800" />
              <div className="h-4 flex-1 rounded bg-zinc-800" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/30 px-4 py-2">
        <span className="font-mono text-xs uppercase tracking-wider text-zinc-500">
          {queries.length} {queries.length === 1 ? "Query" : "Queries"}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsAdding(!isAdding)}
          className="h-6 border-zinc-700 bg-transparent px-2 font-mono text-xs text-zinc-400 hover:border-zinc-600 hover:bg-zinc-800 hover:text-zinc-300"
        >
          {isAdding ? "Cancel" : "+ Add"}
        </Button>
      </div>

      {/* Add Form */}
      {isAdding && (
        <div className="border-b border-zinc-800 bg-zinc-900/50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              placeholder="Provider (e.g., stripe)"
              value={newProvider}
              onChange={(e) => setNewProvider(e.target.value)}
              className="flex-shrink-0 rounded border border-zinc-700 bg-zinc-800/50 px-3 py-2 font-mono text-sm text-zinc-300 outline-none transition-colors placeholder:text-zinc-600 hover:border-zinc-600 focus:border-zinc-500 sm:w-32"
            />
            <input
              type="text"
              placeholder="Query (e.g., sk_live_ filename:.env)"
              value={newQuery}
              onChange={(e) => setNewQuery(e.target.value)}
              className="min-w-0 flex-1 rounded border border-zinc-700 bg-zinc-800/50 px-3 py-2 font-mono text-sm text-zinc-300 outline-none transition-colors placeholder:text-zinc-600 hover:border-zinc-600 focus:border-zinc-500"
            />
            <Button
              onClick={handleAdd}
              disabled={isSubmitting || !newProvider.trim() || !newQuery.trim()}
              className="h-9 bg-emerald-600 px-4 font-mono text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {isSubmitting ? "Adding..." : "Add Query"}
            </Button>
          </div>
        </div>
      )}

      {/* Queries List */}
      <div className="space-y-0 divide-y divide-zinc-800/50">
        {queries.length === 0 ? (
          <div className="flex items-center justify-center p-8">
            <p className="font-mono text-sm text-zinc-500">
              No search queries configured
            </p>
          </div>
        ) : (
          queries.map((query, index) => (
            <div
              key={query._id}
              className={cn(
                "group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-zinc-800/20",
                deletingId === query._id && "opacity-50"
              )}
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <span
                className={cn(
                  "inline-flex h-6 items-center rounded border px-2 font-mono text-xs uppercase",
                  query.enabled
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-zinc-600/30 bg-zinc-600/10 text-zinc-500"
                )}
              >
                {query.provider}
              </span>
              <code className="min-w-0 flex-1 truncate font-mono text-sm text-zinc-400">
                {query.query}
              </code>
              <span className="hidden font-mono text-xs text-zinc-600 sm:block">
                {new Date(query.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(query._id)}
                disabled={deletingId === query._id}
                className="h-6 w-6 p-0 text-zinc-600 opacity-0 transition-opacity hover:bg-rose-500/10 hover:text-rose-400 group-hover:opacity-100"
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
