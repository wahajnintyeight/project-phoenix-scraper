"use client";

import { useEffect, useState, useCallback } from "react";
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
import { cn } from "@/lib/utils";
import {
  Flame,
  RefreshCw,
  Sparkles,
  Zap,
  Shield,
  AlertTriangle,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Activity,
  Clock,
  Key,
  ExternalLink,
  GitBranch,
  FileCode,
  Home,
  Search,
  Settings,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function KeyScannerPage() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [mobileTab, setMobileTab] = useState<"home" | "search" | "settings">("home");

  // Initialize session
  useEffect(() => {
    async function init() {
      try {
        if (!getSessionId()) {
          await createSession();
          toast.success("Connected", {
            description: "Phoenix API ready",
            icon: <Zap className="h-4 w-4" />,
          });
        }
        setError(null);
      } catch (err) {
        console.error("Session initialization failed:", err);
        setError("Failed to connect. Please refresh the page.");
        toast.error("Connection failed");
      } finally {
        setIsInitializing(false);
      }
    }
    init();
  }, []);

  const loadData = useCallback(async (page: number = 1) => {
    if (!getSessionId()) return;
    setIsLoadingKeys(true);
    try {
      const [statsRes, keysRes] = await Promise.all([
        fetchStats(),
        fetchKeys(page),
      ]);
      
      if (statsRes.code === 1009) {
        setStats(statsRes.result);
      }
      if (keysRes.code === 1009) {
        setKeys(keysRes.result.keys);
        setTotalPages(keysRes.result.total_pages || 1);
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
      toast.error("Failed to load data");
    } finally {
      setIsLoadingKeys(false);
    }
  }, []);

  useEffect(() => {
    if (!isInitializing && !error) {
      loadData(currentPage);
    }
  }, [isInitializing, error, loadData, currentPage]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    toast.info("Refreshing...", {
      icon: <RefreshCw className="h-4 w-4 animate-spin" />,
    });
    await loadData(currentPage);
    setIsRefreshing(false);
    toast.success("Updated!", {
      icon: <Sparkles className="h-4 w-4" />,
    });
  };

  const handleCopy = async (keyValue: string, id: string, provider: string) => {
    try {
      await navigator.clipboard.writeText(keyValue);
      setCopiedId(id);
      toast.success("Copied!", {
        description: `${provider} key`,
      });
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const getProviderGradient = (provider: string) => {
    const gradients: Record<string, string> = {
      openai: "from-emerald-500 to-teal-600",
      anthropic: "from-orange-500 to-amber-600",
      google: "from-blue-500 to-cyan-600",
      openrouter: "from-fuchsia-500 to-pink-600",
      github: "from-slate-600 to-slate-800",
      stripe: "from-violet-500 to-purple-600",
    };
    return gradients[provider.toLowerCase()] || "from-primary to-accent";
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Valid: "bg-valid/10 text-valid border-valid/20",
      Invalid: "bg-invalid/10 text-invalid border-invalid/20",
      Pending: "bg-pending/10 text-pending border-pending/20",
      Error: "bg-error/10 text-error border-error/20",
    };
    return colors[status] || colors.Error;
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6"
        >
          <motion.div
            className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-accent shadow-2xl shadow-primary/20"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Flame className="h-10 w-10 text-primary-foreground" />
          </motion.div>
          <div className="text-center">
            <h2 className="text-xl font-bold">Phoenix</h2>
            <p className="text-sm text-muted-foreground">Initializing...</p>
          </div>
        </motion.div>
        <Toaster position="top-center" richColors />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-destructive/10">
            <Flame className="h-10 w-10 text-destructive" />
          </div>
          <h2 className="mb-2 text-xl font-bold">Connection Error</h2>
          <p className="mb-6 text-sm text-muted-foreground">{error}</p>
          <motion.button
            onClick={() => window.location.reload()}
            className="rounded-2xl bg-primary px-6 py-3 font-medium text-primary-foreground"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Try Again
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Desktop Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-4 left-1/2 z-50 hidden -translate-x-1/2 md:block"
      >
        <div className="flex items-center gap-4 rounded-2xl border bg-background/80 px-6 py-3 shadow-lg backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent">
              <Flame className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-bold">Phoenix</h1>
              <p className="text-xs text-muted-foreground">Key Scanner</p>
            </div>
          </div>
          <div className="h-8 w-px bg-border" />
          <div className="flex items-center gap-2">
            <motion.button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex h-9 w-9 items-center justify-center rounded-xl border bg-card hover:bg-muted"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            </motion.button>
            <ThemeToggle />
          </div>
        </div>
      </motion.header>

      {/* Mobile Header - App Style */}
      <motion.header
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-xl md:hidden"
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-lg">
              <Flame className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base font-bold">Phoenix</h1>
              <p className="text-xs text-muted-foreground">
                {stats?.total_keys ?? 0} keys found
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted"
              whileTap={{ scale: 0.95 }}
            >
              <RefreshCw className={cn("h-5 w-5", isRefreshing && "animate-spin")} />
            </motion.button>
            <ThemeToggle />
          </div>
        </div>
      </motion.header>

      {/* Mobile Stats Pills */}
      <div className="overflow-x-auto px-4 py-3 md:hidden">
        <div className="flex gap-2">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex shrink-0 items-center gap-2 rounded-2xl bg-valid/10 px-4 py-2"
          >
            <Shield className="h-4 w-4 text-valid" />
            <span className="text-sm font-semibold text-valid">{stats?.valid_keys ?? 0}</span>
            <span className="text-xs text-valid/70">valid</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.05 }}
            className="flex shrink-0 items-center gap-2 rounded-2xl bg-invalid/10 px-4 py-2"
          >
            <AlertTriangle className="h-4 w-4 text-invalid" />
            <span className="text-sm font-semibold text-invalid">{stats?.invalid_keys ?? 0}</span>
            <span className="text-xs text-invalid/70">invalid</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="flex shrink-0 items-center gap-2 rounded-2xl bg-primary/10 px-4 py-2"
          >
            <Activity className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">
              {stats?.by_provider ? Object.keys(stats.by_provider).length : 0}
            </span>
            <span className="text-xs text-primary/70">providers</span>
          </motion.div>
        </div>
      </div>

      {/* Desktop Hero Section */}
      <section className="relative hidden overflow-hidden px-4 pt-28 pb-8 md:block">
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute -top-20 -right-20 h-96 w-96 rounded-full bg-primary/20 blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className="absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-accent/20 blur-3xl"
            animate={{ scale: [1.2, 1, 1.2], opacity: [0.5, 0.3, 0.5] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
        </div>

        <div className="relative mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 inline-flex items-center gap-2 rounded-full border bg-background/50 px-4 py-1.5 text-sm backdrop-blur-sm"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Live API Key Discovery</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-4 text-4xl font-bold tracking-tight lg:text-5xl text-balance"
          >
            Discover exposed{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              API keys
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl text-lg text-muted-foreground text-pretty"
          >
            Monitor and validate API keys from multiple providers in real-time.
          </motion.p>
        </div>
      </section>

      {/* Desktop Stats Grid */}
      <section className="mx-auto hidden max-w-6xl px-4 pb-8 md:block">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <motion.div
            className="relative overflow-hidden rounded-2xl border bg-card p-5"
            whileHover={{ y: -2 }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Key className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold tabular-nums">{stats?.total_keys ?? 0}</div>
                <div className="text-xs text-muted-foreground">Total Keys</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="relative overflow-hidden rounded-2xl border bg-card p-5"
            whileHover={{ y: -2 }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-valid/10">
                <Shield className="h-5 w-5 text-valid" />
              </div>
              <div>
                <div className="text-2xl font-bold tabular-nums text-valid">{stats?.valid_keys ?? 0}</div>
                <div className="text-xs text-muted-foreground">Valid</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="relative overflow-hidden rounded-2xl border bg-card p-5"
            whileHover={{ y: -2 }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-invalid/10">
                <AlertTriangle className="h-5 w-5 text-invalid" />
              </div>
              <div>
                <div className="text-2xl font-bold tabular-nums text-invalid">{stats?.invalid_keys ?? 0}</div>
                <div className="text-xs text-muted-foreground">Invalid</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="relative overflow-hidden rounded-2xl border bg-card p-5"
            whileHover={{ y: -2 }}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                <Activity className="h-5 w-5 text-accent" />
              </div>
              <div>
                <div className="text-2xl font-bold tabular-nums">
                  {stats?.by_provider ? Object.keys(stats.by_provider).length : 0}
                </div>
                <div className="text-xs text-muted-foreground">Providers</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Keys Section */}
      <section className="mx-auto max-w-6xl px-4 pb-8">
        <div className="mb-4 flex items-center justify-between md:mb-6">
          <div>
            <h2 className="text-lg font-bold md:text-2xl">Latest Discoveries</h2>
            <p className="text-xs text-muted-foreground md:text-sm">
              Page {currentPage} of {totalPages}
            </p>
          </div>
        </div>

        {isLoadingKeys ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="h-32 animate-pulse rounded-2xl border bg-card md:h-40"
              />
            ))}
          </div>
        ) : (
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <AnimatePresence mode="popLayout">
              {(keys ?? []).map((key, index) => (
                <motion.div
                  key={key.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                  className="group relative overflow-hidden rounded-2xl border bg-card"
                >
                  {/* Provider color accent */}
                  <div
                    className={cn(
                      "absolute left-0 top-0 h-full w-1 bg-gradient-to-b",
                      getProviderGradient(key.provider)
                    )}
                  />

                  <div className="p-4 pl-5">
                    {/* Header row */}
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg md:h-12 md:w-12",
                            getProviderGradient(key.provider)
                          )}
                        >
                          <Key className="h-5 w-5 text-white md:h-6 md:w-6" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold capitalize">{key.provider}</h3>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(key.created_at).toLocaleDateString()}</span>
                            {key.error_count > 0 && (
                              <>
                                <span className="text-error">
                                  {key.error_count} error{key.error_count > 1 ? "s" : ""}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 rounded-full border px-3 py-1 text-xs font-medium",
                          getStatusColor(key.status)
                        )}
                      >
                        {key.status}
                      </span>
                    </div>

                    {/* Key value */}
                    <div className="mb-3 flex items-center gap-2">
                      <code className="flex-1 truncate rounded-lg bg-muted/50 px-3 py-2 font-mono text-sm">
                        {key.key_value}
                      </code>
                      <motion.button
                        onClick={() => handleCopy(key.key_value, key.id, key.provider)}
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors",
                          copiedId === key.id
                            ? "border-valid/20 bg-valid/10 text-valid"
                            : "bg-background hover:bg-muted"
                        )}
                        whileTap={{ scale: 0.95 }}
                      >
                        {copiedId === key.id ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </motion.button>
                    </div>

                    {/* Source References */}
                    {key.references && key.references.length > 0 && (
                      <div className="space-y-2">
                        {key.references.slice(0, 2).map((ref) => (
                          <motion.a
                            key={ref.id}
                            href={ref.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 rounded-xl border bg-muted/30 px-3 py-2 text-xs transition-colors hover:bg-muted"
                            whileTap={{ scale: 0.98 }}
                          >
                            <GitBranch className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <span className="truncate font-medium">
                              {ref.repo_owner}/{ref.repo_name}
                            </span>
                            <span className="hidden text-muted-foreground sm:inline">/</span>
                            <span className="hidden items-center gap-1 truncate text-muted-foreground sm:flex">
                              <FileCode className="h-3 w-3 shrink-0" />
                              {ref.file_path}
                            </span>
                            <ExternalLink className="ml-auto h-3 w-3 shrink-0 text-muted-foreground" />
                          </motion.a>
                        ))}
                        {key.references.length > 2 && (
                          <p className="text-center text-xs text-muted-foreground">
                            +{key.references.length - 2} more source{key.references.length - 2 > 1 ? "s" : ""}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Pagination */}
        {totalPages > 1 && !isLoadingKeys && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex items-center justify-center gap-1 md:gap-2"
          >
            {/* Previous button */}
            <motion.button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl border transition-colors md:h-11 md:w-11",
                currentPage === 1
                  ? "cursor-not-allowed opacity-40"
                  : "hover:bg-muted"
              )}
              whileTap={{ scale: 0.95 }}
            >
              <ChevronLeft className="h-5 w-5" />
            </motion.button>

            {/* Page numbers - Desktop */}
            <div className="hidden items-center gap-1 md:flex">
              {getPageNumbers().map((page, index) =>
                page === "..." ? (
                  <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                    ...
                  </span>
                ) : (
                  <motion.button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-xl border text-sm font-medium transition-colors",
                      currentPage === page
                        ? "border-primary bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ y: -2 }}
                  >
                    {page}
                  </motion.button>
                )
              )}
            </div>

            {/* Page indicator - Mobile */}
            <div className="flex items-center gap-3 px-4 md:hidden">
              <span className="font-mono text-sm tabular-nums">
                {currentPage} / {totalPages}
              </span>
            </div>

            {/* Next button */}
            <motion.button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl border transition-colors md:h-11 md:w-11",
                currentPage === totalPages
                  ? "cursor-not-allowed opacity-40"
                  : "hover:bg-muted"
              )}
              whileTap={{ scale: 0.95 }}
            >
              <ChevronRight className="h-5 w-5" />
            </motion.button>
          </motion.div>
        )}
      </section>

      {/* Desktop Footer */}
      <footer className="hidden border-t py-6 md:block">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground">
          <p>Phoenix Key Scanner &middot; Powered by Project Phoenix</p>
        </div>
      </footer>

      {/* Mobile Bottom Navigation */}
      <motion.nav
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-xl md:hidden"
      >
        <div className="flex items-center justify-around py-2">
          <motion.button
            onClick={() => setMobileTab("home")}
            className={cn(
              "flex flex-col items-center gap-0.5 px-6 py-2 transition-colors",
              mobileTab === "home" ? "text-primary" : "text-muted-foreground"
            )}
            whileTap={{ scale: 0.95 }}
          >
            <Home className="h-5 w-5" />
            <span className="text-[10px] font-medium">Home</span>
          </motion.button>
          <motion.button
            onClick={() => setMobileTab("search")}
            className={cn(
              "flex flex-col items-center gap-0.5 px-6 py-2 transition-colors",
              mobileTab === "search" ? "text-primary" : "text-muted-foreground"
            )}
            whileTap={{ scale: 0.95 }}
          >
            <Search className="h-5 w-5" />
            <span className="text-[10px] font-medium">Search</span>
          </motion.button>
          <motion.button
            onClick={() => setMobileTab("settings")}
            className={cn(
              "flex flex-col items-center gap-0.5 px-6 py-2 transition-colors",
              mobileTab === "settings" ? "text-primary" : "text-muted-foreground"
            )}
            whileTap={{ scale: 0.95 }}
          >
            <Settings className="h-5 w-5" />
            <span className="text-[10px] font-medium">Settings</span>
          </motion.button>
        </div>
        {/* Safe area for iOS */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </motion.nav>

      <Toaster position="top-center" richColors />
    </div>
  );
}
