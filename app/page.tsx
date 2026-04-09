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

  const getProviderColor = (provider: string) => {
    const colors: Record<string, string> = {
      openai: "bg-emerald-500",
      anthropic: "bg-orange-500",
      google: "bg-blue-500",
      openrouter: "bg-fuchsia-500",
      github: "bg-slate-400",
      stripe: "bg-violet-500",
    };
    return colors[provider.toLowerCase()] || "bg-primary";
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
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-6"
        >
          <motion.div
            className="flex h-20 w-20 items-center justify-center border-2 border-primary bg-background shadow-[0_0_20px_rgba(var(--color-primary),0.3)]"
            animate={{ rotate: [0, 90, 180, 270, 360] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            <Flame className="h-10 w-10 text-primary" />
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
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed top-4 left-1/2 z-50 hidden -translate-x-1/2 md:block"
      >
        <div className="flex items-center gap-4 border bg-background/80 px-6 py-3 shadow-[0_4px_30px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center bg-primary">
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
            <div className="flex h-10 w-10 items-center justify-center border-l-4 border-l-primary bg-card shadow-lg">
              <Flame className="h-5 w-5 text-primary" />
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
      <section className="relative hidden overflow-hidden px-4 pt-32 pb-12 md:block">
        <div className="relative mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mb-6 inline-flex items-center gap-2 border bg-card/80 px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-widest backdrop-blur-sm"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span>SYS_DISCOVERY_PROTOCOL_ACTIVE</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="mb-4 text-5xl font-black uppercase tracking-tight lg:text-7xl text-balance"
          >
            Exposed <span className="text-primary italic">API_KEYS</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl text-lg font-medium text-muted-foreground text-pretty border-l-2 border-l-primary pl-4"
          >
            {'>'} SCANNING SUBNETS... MONITORING EXPOSED SECRETS IN REAL-TIME. ALL LOGS IMMUTABLE.
          </motion.p>
        </div>
      </section>

      {/* Desktop Stats Grid */}
      <section className="mx-auto hidden max-w-6xl px-4 pb-12 md:block">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.1 } },
          }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { ease: [0.16, 1, 0.3, 1] } },
            }}
            className="group relative overflow-hidden bg-card/50 p-6 border-t-2 border-t-primary border-l border-r border-b backdrop-blur-sm transition-colors hover:bg-card hover:border-primary"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center bg-primary/20 border border-primary/30 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                <Key className="h-6 w-6" />
              </div>
              <div>
                <div className="font-mono text-3xl font-black text-primary tabular-nums tracking-tighter">{stats?.total_keys ?? 0}</div>
                <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Total_Keys</div>
              </div>
            </div>
            <div className="absolute top-0 right-0 p-2 opacity-10">
              <Key className="h-24 w-24 -mr-6 -mt-6" />
            </div>
          </motion.div>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { ease: [0.16, 1, 0.3, 1] } },
            }}
            className="group relative overflow-hidden bg-card/50 p-6 border-t-2 border-t-valid border-l border-r border-b backdrop-blur-sm transition-colors hover:bg-card hover:border-valid"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center bg-valid/20 border border-valid/30 group-hover:bg-valid group-hover:text-valid-foreground transition-all duration-300">
                <Shield className="h-6 w-6 text-valid group-hover:text-current" />
              </div>
              <div>
                <div className="font-mono text-3xl font-black text-valid tabular-nums tracking-tighter">{stats?.valid_keys ?? 0}</div>
                <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Valid_Keys</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { ease: [0.16, 1, 0.3, 1] } },
            }}
            className="group relative overflow-hidden bg-card/50 p-6 border-t-2 border-t-invalid border-l border-r border-b backdrop-blur-sm transition-colors hover:bg-card hover:border-invalid"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center bg-invalid/20 border border-invalid/30 group-hover:bg-invalid group-hover:text-destructive-foreground transition-all duration-300">
                <AlertTriangle className="h-6 w-6 text-invalid group-hover:text-current" />
              </div>
              <div>
                <div className="font-mono text-3xl font-black text-invalid tabular-nums tracking-tighter">{stats?.invalid_keys ?? 0}</div>
                <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Invalid_Keys</div>
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { ease: [0.16, 1, 0.3, 1] } },
            }}
            className="group relative overflow-hidden bg-card/50 p-6 border-t-2 border-t-accent border-l border-r border-b backdrop-blur-sm transition-colors hover:bg-card hover:border-accent"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center bg-accent/20 border border-accent/30 group-hover:bg-accent group-hover:text-accent-foreground transition-all duration-300">
                <Activity className="h-6 w-6 text-accent group-hover:text-current" />
              </div>
              <div>
                <div className="font-mono text-3xl font-black text-accent tabular-nums tracking-tighter">
                  {stats?.by_provider ? Object.keys(stats.by_provider).length : 0}
                </div>
                <div className="font-mono text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Active_Prvds</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Keys Section */}
      <section className="mx-auto max-w-6xl px-4 pb-8">
        <div className="mb-6 flex items-center justify-between border-b pb-2">
          <div>
            <h2 className="font-mono text-xl font-bold uppercase tracking-widest md:text-2xl">Data_Stream</h2>
            <p className="font-mono text-[10px] uppercase text-muted-foreground md:text-xs">
              Page_{currentPage} / {totalPages}
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
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  layout
                  className="group relative overflow-hidden border bg-card transition-all hover:bg-card/80 hover:border-primary hover:shadow-[5px_5px_0_rgba(var(--color-primary),0.2)]"
                >
                  {/* Provider color accent */}
                  <div
                    className={cn(
                      "absolute left-0 top-0 h-full w-1",
                      getProviderColor(key.provider)
                    )}
                  />

                  <div className="p-4 md:p-6 pl-5 md:pl-8">
                    {/* Header row */}
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            "flex h-12 w-12 shrink-0 items-center justify-center bg-background border shadow-inner",
                            "group-hover:border-primary transition-colors duration-300"
                          )}
                        >
                          <Key className={cn("h-5 w-5", `text-[${getProviderColor(key.provider)}]`)} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-mono text-lg font-black uppercase tracking-wider">{key.provider}</h3>
                          <div className="flex items-center gap-3 font-mono text-[10px] font-bold uppercase text-muted-foreground tracking-widest mt-1">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(key.created_at).toLocaleDateString()}
                            </span>
                            {key.error_count > 0 && (
                              <span className="flex items-center gap-1 text-error bg-error/10 px-1.5 py-0.5">
                                [ ERRORS: {key.error_count} ]
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "shrink-0 border px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-widest",
                          getStatusColor(key.status),
                          "shadow-[2px_2px_0_currentcolor]"
                        )}
                      >
                        {key.status}
                      </span>
                    </div>

                    {/* Key value */}
                    <div className="mb-4 flex items-center gap-0">
                      <code className="flex-1 truncate border border-r-0 bg-black px-4 py-3 font-mono text-sm tracking-wide text-primary shadow-inner selection:bg-primary selection:text-primary-foreground">
                        {key.key_value}
                      </code>
                      <motion.button
                        onClick={() => handleCopy(key.key_value, key.id, key.provider)}
                        className={cn(
                          "flex h-[46px] w-[46px] shrink-0 items-center justify-center border transition-colors",
                          copiedId === key.id
                            ? "bg-valid text-valid-foreground border-valid"
                            : "bg-muted text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary"
                        )}
                        whileTap={{ scale: 0.9 }}
                      >
                        {copiedId === key.id ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </motion.button>
                    </div>

                    {/* Source References */}
                    {key.references && key.references.length > 0 && (
                      <div className="space-y-2 border-t pt-4">
                        <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-2">Sources:</div>
                        {key.references.slice(0, 2).map((ref) => (
                          <motion.a
                            key={ref.id}
                            href={ref.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 border bg-muted/20 px-4 py-2 font-mono text-[11px] transition-colors hover:bg-primary/10 hover:border-primary/50 group/ref"
                          >
                            <GitBranch className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover/ref:text-primary transition-colors" />
                            <span className="truncate flex-1">
                              <span className="font-bold opacity-70">{ref.repo_owner}/</span>{ref.repo_name}
                              <span className="hidden sm:inline opacity-50 px-2">|</span>
                              <span className="hidden items-center gap-1.5 truncate text-muted-foreground sm:inline-flex group-hover/ref:text-primary/80 transition-colors">
                                <FileCode className="h-3 w-3 shrink-0" />
                                {ref.file_path}
                              </span>
                            </span>
                            <ExternalLink className="ml-auto h-3 w-3 shrink-0 opacity-0 group-hover/ref:opacity-100 transition-opacity" />
                          </motion.a>
                        ))}
                        {key.references.length > 2 && (
                          <p className="text-right font-mono text-[10px] uppercase text-muted-foreground">
                            + {key.references.length - 2} ADDL.
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
