"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "sonner";
import {
  createSession,
  getSessionId,
  fetchStats,
  fetchKeys,
  Stats,
  ApiKey,
} from "@/lib/api";
import { KeyCard } from "@/components/key-card";
import { StatsBar } from "@/components/stats-bar";
import { FilterBar } from "@/components/filter-bar";
import { EmptyState } from "@/components/empty-state";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import {
  Flame,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap,
} from "lucide-react";

export default function KeyScannerPage() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data state
  const [stats, setStats] = useState<Stats | null>(null);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingKeys, setIsLoadingKeys] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Pagination and filters
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterProvider, setFilterProvider] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Initialize session
  useEffect(() => {
    async function init() {
      try {
        if (!getSessionId()) {
          await createSession();
          toast.success("Session initialized", {
            description: "Connected to Phoenix API",
            icon: <Zap className="h-4 w-4" />,
          });
        }
        setError(null);
      } catch (err) {
        console.error("[v0] Session initialization failed:", err);
        setError("Failed to connect. Please refresh the page.");
        toast.error("Connection failed", {
          description: "Unable to initialize session",
        });
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
      if (res.code === 1009) {
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
      if (res.code === 1009) {
        setKeys(res.result.keys);
        setTotalPages(res.result.total_pages);
      }
    } catch (err) {
      console.error("[v0] Failed to fetch keys:", err);
      toast.error("Failed to load keys", {
        description: "Please try again",
      });
    } finally {
      setIsLoadingKeys(false);
    }
  }, [currentPage, filterProvider, filterStatus]);

  // Load data after session is ready
  useEffect(() => {
    if (!isInitializing && !error) {
      loadStats();
      loadKeys();
    }
  }, [isInitializing, error, loadStats, loadKeys]);

  // Refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    toast.info("Refreshing data...", {
      icon: <RefreshCw className="h-4 w-4 animate-spin" />,
    });
    await Promise.all([loadStats(), loadKeys()]);
    setIsRefreshing(false);
    toast.success("Data refreshed!", {
      icon: <Sparkles className="h-4 w-4" />,
    });
  };

  // Filter handlers
  const handleFilterProviderChange = (provider: string) => {
    setFilterProvider(provider);
    setCurrentPage(1);
  };

  const handleFilterStatusChange = (status: string) => {
    setFilterStatus(status);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilterProvider("");
    setFilterStatus("");
    setSearchQuery("");
    setCurrentPage(1);
  };

  // Client-side search filtering
  const filteredKeys = useMemo(() => {
    if (!searchQuery) return keys;
    const query = searchQuery.toLowerCase();
    return keys.filter(
      (key) =>
        key.key_value.toLowerCase().includes(query) ||
        key.provider.toLowerCase().includes(query)
    );
  }, [keys, searchQuery]);

  const providers = stats?.by_provider ? Object.keys(stats.by_provider) : [];

  // Loading state
  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6"
        >
          <motion.div
            className="relative flex h-20 w-20 items-center justify-center"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary via-accent to-primary opacity-20 blur-xl" />
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg">
              <Flame className="h-8 w-8 text-primary-foreground" />
            </div>
          </motion.div>
          <div className="text-center">
            <h2 className="text-lg font-semibold">Phoenix Key Scanner</h2>
            <p className="text-sm text-muted-foreground">Initializing session...</p>
          </div>
        </motion.div>
        <Toaster position="bottom-right" richColors />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-6 text-center"
        >
          <motion.div
            className="flex h-20 w-20 items-center justify-center rounded-2xl bg-destructive/10"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Flame className="h-10 w-10 text-destructive" />
          </motion.div>
          <div>
            <h2 className="mb-2 text-lg font-semibold">Connection Error</h2>
            <p className="mb-4 max-w-xs text-sm text-muted-foreground">{error}</p>
          </div>
          <motion.button
            onClick={() => window.location.reload()}
            className="rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Try Again
          </motion.button>
        </motion.div>
        <Toaster position="bottom-right" richColors />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <motion.div
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20"
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Flame className="h-5 w-5 text-primary-foreground" />
            </motion.div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Phoenix</h1>
              <p className="text-xs text-muted-foreground">Key Scanner</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl border bg-card transition-colors hover:bg-muted",
                isRefreshing && "pointer-events-none"
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Refresh data"
            >
              <RefreshCw
                className={cn("h-5 w-5", isRefreshing && "animate-spin")}
              />
            </motion.button>
            <ThemeToggle />
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-6">
        {/* Stats Bar */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <StatsBar stats={stats} isLoading={isLoadingStats} />
        </motion.section>

        {/* Filters */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <FilterBar
            providers={providers}
            selectedProvider={filterProvider}
            selectedStatus={filterStatus}
            onProviderChange={handleFilterProviderChange}
            onStatusChange={handleFilterStatusChange}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </motion.section>

        {/* Keys List */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {isLoadingKeys ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="h-20 animate-pulse rounded-2xl border bg-card"
                />
              ))}
            </div>
          ) : filteredKeys.length === 0 ? (
            <EmptyState
              type={keys.length === 0 ? "no-keys" : "no-results"}
              onClearFilters={clearFilters}
            />
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {filteredKeys.map((key, index) => (
                  <KeyCard key={key.id} keyData={key} index={index} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.section>

        {/* Pagination */}
        {totalPages > 1 && !isLoadingKeys && filteredKeys.length > 0 && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 flex items-center justify-center gap-2"
          >
            <motion.button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl border bg-card transition-colors",
                currentPage === 1
                  ? "cursor-not-allowed opacity-50"
                  : "hover:bg-muted"
              )}
              whileHover={currentPage !== 1 ? { scale: 1.1 } : {}}
              whileTap={currentPage !== 1 ? { scale: 0.95 } : {}}
            >
              <ChevronLeft className="h-5 w-5" />
            </motion.button>

            <div className="flex items-center gap-1">
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <motion.button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl text-sm font-medium transition-colors",
                      currentPage === pageNum
                        ? "bg-primary text-primary-foreground"
                        : "border bg-card hover:bg-muted"
                    )}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {pageNum}
                  </motion.button>
                );
              })}
            </div>

            <motion.button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl border bg-card transition-colors",
                currentPage === totalPages
                  ? "cursor-not-allowed opacity-50"
                  : "hover:bg-muted"
              )}
              whileHover={currentPage !== totalPages ? { scale: 1.1 } : {}}
              whileTap={currentPage !== totalPages ? { scale: 0.95 } : {}}
            >
              <ChevronRight className="h-5 w-5" />
            </motion.button>
          </motion.section>
        )}

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 border-t pt-6 text-center"
        >
          <p className="text-sm text-muted-foreground">
            Phoenix Key Scanner v2.0 &middot;{" "}
            <a
              href="https://api.theprojectphoenix.top"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              API Documentation
            </a>
          </p>
        </motion.footer>
      </main>

      {/* Toast notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          classNames: {
            toast: "rounded-xl border shadow-lg",
            title: "font-medium",
            description: "text-sm text-muted-foreground",
          },
        }}
        richColors
      />
    </div>
  );
}
