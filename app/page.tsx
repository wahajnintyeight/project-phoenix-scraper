"use client";

import { useEffect, useState, useCallback } from "react";
import {
  createSession,
  getSessionId,
  fetchStats,
  fetchKeys,
  fetchQueries,
  Stats,
  ApiKey,
  SearchQuery,
} from "@/lib/api";
import { StatsPanel } from "@/components/dashboard/stats-panel";
import { KeysTable } from "@/components/dashboard/keys-table";
import { ProvidersPanel } from "@/components/dashboard/providers-panel";
import { QueriesPanel } from "@/components/dashboard/queries-panel";
import { ActivityPanel } from "@/components/dashboard/activity-panel";
import { cn } from "@/lib/utils";

type TabId = "keys" | "providers" | "queries" | "activity";

interface TabConfig {
  id: TabId;
  label: string;
  count?: number;
}

export default function DashboardPage() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("keys");

  // Data state
  const [stats, setStats] = useState<Stats | null>(null);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [queries, setQueries] = useState<SearchQuery[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingKeys, setIsLoadingKeys] = useState(true);
  const [isLoadingQueries, setIsLoadingQueries] = useState(true);

  // Pagination and filters
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterProvider, setFilterProvider] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Initialize session
  useEffect(() => {
    async function init() {
      try {
        if (!getSessionId()) {
          await createSession();
        }
        setError(null);
      } catch (err) {
        console.error("[v0] Session initialization failed:", err);
        setError("Failed to initialize session. Please refresh the page.");
      } finally {
        setIsInitializing(false);
      }
    }
    init();
  }, []);

  // Fetch stats
  const loadStats = useCallback(async () => {
    if (!getSessionId()) return;
    setIsLoadingStats(true);
    try {
      const res = await fetchStats();
      if (res.code === 1022) {
        setStats(res.result);
      }
    } catch (err) {
      console.error("[v0] Failed to fetch stats:", err);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  // Fetch keys
  const loadKeys = useCallback(async () => {
    if (!getSessionId()) return;
    setIsLoadingKeys(true);
    try {
      const res = await fetchKeys(
        currentPage,
        filterProvider || undefined,
        filterStatus || undefined
      );
      if (res.code === 1022) {
        setKeys(res.result.keys);
        setTotalPages(res.result.total_pages);
      }
    } catch (err) {
      console.error("[v0] Failed to fetch keys:", err);
    } finally {
      setIsLoadingKeys(false);
    }
  }, [currentPage, filterProvider, filterStatus]);

  // Fetch queries
  const loadQueries = useCallback(async () => {
    if (!getSessionId()) return;
    setIsLoadingQueries(true);
    try {
      const res = await fetchQueries();
      if (res.code === 1022) {
        setQueries(res.result.queries);
      }
    } catch (err) {
      console.error("[v0] Failed to fetch queries:", err);
    } finally {
      setIsLoadingQueries(false);
    }
  }, []);

  // Load data after session is ready
  useEffect(() => {
    if (!isInitializing && !error) {
      loadStats();
      loadKeys();
      loadQueries();
    }
  }, [isInitializing, error, loadStats, loadKeys, loadQueries]);

  // Reload keys when filters change
  useEffect(() => {
    if (!isInitializing && !error) {
      loadKeys();
    }
  }, [currentPage, filterProvider, filterStatus]);

  const handleFilterProviderChange = (provider: string) => {
    setFilterProvider(provider);
    setCurrentPage(1);
  };

  const handleFilterStatusChange = (status: string) => {
    setFilterStatus(status);
    setCurrentPage(1);
  };

  const providers = stats?.by_provider ? Object.keys(stats.by_provider) : [];

  const tabs: TabConfig[] = [
    { id: "keys", label: "Keys", count: stats?.total_keys },
    { id: "providers", label: "Providers", count: providers.length },
    { id: "queries", label: "Queries", count: queries.length },
    { id: "activity", label: "Activity" },
  ];

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-emerald-500" />
          <p className="font-mono text-sm text-zinc-500">
            Initializing session...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-rose-500/30 bg-rose-500/10">
            <svg
              className="h-6 w-6 text-rose-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <p className="max-w-xs font-mono text-sm text-zinc-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 rounded border border-zinc-700 bg-zinc-800 px-4 py-2 font-mono text-sm text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
              <svg
                className="h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            </div>
            <div>
              <h1 className="font-mono text-sm font-semibold tracking-tight text-zinc-100">
                Phoenix Key Scanner
              </h1>
              <p className="font-mono text-xs text-zinc-500">
                API Key Discovery & Validation
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-mono text-xs text-emerald-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Connected
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Stats Banner */}
        <section className="mb-6 overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50">
          <StatsPanel stats={stats} isLoading={isLoadingStats} />
        </section>

        {/* Tab Navigation */}
        <div className="mb-4 flex items-center gap-1 overflow-x-auto border-b border-zinc-800 pb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative flex items-center gap-2 px-4 py-2.5 font-mono text-sm transition-colors",
                activeTab === tab.id
                  ? "text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-400"
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 font-mono text-xs tabular-nums",
                    activeTab === tab.id
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-zinc-800 text-zinc-500"
                  )}
                >
                  {tab.count}
                </span>
              )}
              {activeTab === tab.id && (
                <span className="absolute inset-x-0 -bottom-px h-px bg-emerald-500" />
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <section className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50">
          {activeTab === "keys" && (
            <KeysTable
              keys={keys}
              isLoading={isLoadingKeys}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              filterProvider={filterProvider}
              filterStatus={filterStatus}
              onFilterProviderChange={handleFilterProviderChange}
              onFilterStatusChange={handleFilterStatusChange}
              providers={providers}
            />
          )}

          {activeTab === "providers" && (
            <ProvidersPanel
              providers={stats?.by_provider || {}}
              isLoading={isLoadingStats}
            />
          )}

          {activeTab === "queries" && (
            <QueriesPanel
              queries={queries}
              isLoading={isLoadingQueries}
              onRefresh={loadQueries}
            />
          )}

          {activeTab === "activity" && (
            <ActivityPanel stats={stats} isLoading={isLoadingStats} />
          )}
        </section>

        {/* Footer */}
        <footer className="mt-8 border-t border-zinc-800/50 pt-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="font-mono text-xs text-zinc-600">
              Phoenix Key Scanner v2.0
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://api.theprojectphoenix.top"
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-zinc-500 transition-colors hover:text-zinc-400"
              >
                API Docs
              </a>
              <span className="font-mono text-xs text-zinc-700">|</span>
              <span className="font-mono text-xs text-zinc-600">
                {new Date().toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
