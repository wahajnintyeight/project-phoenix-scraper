"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "sonner";
import {
  createSession,
  getSessionId,
  fetchStats,
  fetchKeys,
  fetchVisits,
  fetchBlockedContent,
  createBlockedContent,
  deleteBlockedContent,
  Stats,
  ApiKey,
  Visit,
  BlockedContent,
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
  Download,
  ArrowRight,
  MoonStar,
  SunMedium,
  Database,
  LockKeyhole,
  FlaskConical,
  ShieldOff,
} from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { FilterBar } from "@/components/filter-bar";
import { KeyCard } from "@/components/key-card";
import { ContentBlockEditor } from "@/components/content-block-editor";

export default function KeyScannerPage() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(true);
  const [isLoadingVisits, setIsLoadingVisits] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedBlocked, setSelectedBlocked] = useState<string | null>(null);
  const [blockedRules, setBlockedRules] = useState<BlockedContent[]>([]);
  const [isLoadingBlocked, setIsLoadingBlocked] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [mobileTab, setMobileTab] = useState<"home" | "search" | "settings">("home");

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

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadData = useCallback(async (page: number = 1, provider: string | null = null, status: string | null = null, blocked: string | null = null, search: string = "") => {
    if (!getSessionId()) return;
    setIsLoadingKeys(true);
    try {
      const [statsRes, keysRes] = await Promise.all([
        fetchStats(), 
        fetchKeys(page, provider || undefined, status || undefined, blocked || undefined, search || undefined)
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

  const loadVisits = useCallback(async (page: number = 1, project: string = "phoenix-scraper") => {
    if (!getSessionId()) return;
    setIsLoadingVisits(true);
    try {
      const res = await fetchVisits(page, project);
      if (res.code === 1094) {
        setVisits(res.result.visits);
      }
    } catch (err) {
      console.error("Failed to fetch visits:", err);
    } finally {
      setIsLoadingVisits(false);
    }
  }, []);

  useEffect(() => {
    if (!isInitializing && !error) {
      loadData(currentPage, selectedProvider, selectedStatus, selectedBlocked, debouncedSearch);
      loadVisits();
    }
  }, [isInitializing, error, loadData, loadVisits, currentPage, selectedProvider, selectedStatus, selectedBlocked, debouncedSearch]);

  useEffect(() => {
    if (!isInitializing && !error) {
      loadBlockedRules();
    }
  }, [isInitializing, error]);

  const loadBlockedRules = async () => {
    setIsLoadingBlocked(true);
    try {
      const res = await fetchBlockedContent();
      if (res.code === 1009) {
        setBlockedRules(res.result.rules);
      }
    } catch {
      // silent
    } finally {
      setIsLoadingBlocked(false);
    }
  };

  const handleAddBlockRule = async (pattern: string, type: string, description?: string) => {
    await createBlockedContent(pattern, type, description);
    await loadBlockedRules();
  };

  const handleDeleteBlockRule = async (id: string) => {
    await deleteBlockedContent(id);
    await loadBlockedRules();
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    toast.info("Refreshing live feed...", {
      icon: <RefreshCw className="h-4 w-4 animate-spin" />,
    });
    await loadData(currentPage, selectedProvider, selectedStatus, selectedBlocked, debouncedSearch);
    await loadBlockedRules();
    setIsRefreshing(false);
    toast.success("Dashboard updated", {
      icon: <Sparkles className="h-4 w-4" />,
    });
  };

  const handleCopy = async (keyValue: string, id: string, provider: string) => {
    try {
      await navigator.clipboard.writeText(keyValue);
      setCopiedId(id);
      toast.success("Copied to clipboard", {
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

  const handleProviderFilter = (provider: string | null) => {
    setSelectedProvider(provider);
    setCurrentPage(1); // Reset to first page when filtering
    toast.info(provider ? `Filtering by ${provider}` : "Showing all providers", {
      icon: <Search className="h-4 w-4" />,
    });
  };

  const handleStatusFilter = (status: string | null) => {
    setSelectedStatus(status);
    setCurrentPage(1);
    const statusLabel = status === "Valid" ? "Valid keys" : status === "ValidNoCredits" ? "Valid (No Credits)" : "All statuses";
    toast.info(status ? `Filtering by ${statusLabel}` : "Showing all statuses", {
      icon: <Shield className="h-4 w-4" />,
    });
  };

  const handleBlockedFilter = (blocked: string | null) => {
    setSelectedBlocked(blocked);
    setCurrentPage(1);
    const label = blocked === "true" ? "Blocked keys" : blocked === "false" ? "Non-blocked keys" : "All keys";
    toast.info(blocked ? `Showing ${label}` : "Showing all keys", {
      icon: <ShieldOff className="h-4 w-4" />,
    });
  };

  const getProviderTone = (provider: string) => {
    const tones: Record<string, string> = {
      openai: "from-emerald-400 to-emerald-600",
      anthropic: "from-orange-400 to-amber-500",
      google: "from-sky-400 to-blue-600",
      openrouter: "from-fuchsia-400 to-violet-500",
      moonshot: "from-indigo-400 to-purple-600",
      deepseek: "from-blue-500 to-indigo-600",
      github: "from-slate-400 to-slate-600",
      stripe: "from-violet-400 to-indigo-600",
    };
    return tones[provider.toLowerCase()] || "from-primary to-primary";
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Valid:
        "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
      Invalid:
        "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
      Pending:
        "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
      Error:
        "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
    };
    return colors[status] || colors.Error;
  };

  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, "...", totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
    }

    return pages;
  };

  const providerCount = stats?.by_provider ? Object.keys(stats.by_provider).length : 0;

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return "Never";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const downloadCSV = () => {
    const headers = ["Provider", "Status", "Key Value", "Created At", "Validated At", "Error Count", "References"];
    const rows = keys.map((k) => [
      k.provider,
      k.status,
      k.key_value,
      k.created_at,
      k.validated_at || "",
      k.error_count.toString(),
      (k.repo_refs ?? k.references?.map((r) => r.file_url) ?? []).join("; "),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `phoenix-keys-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex max-w-sm flex-col items-center gap-6 rounded-[32px] border border-border/60 bg-card/80 p-10 text-center shadow-2xl shadow-black/10 backdrop-blur-2xl"
        >
          <motion.div
            className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-gradient-to-br from-primary to-emerald-400 text-primary-foreground shadow-lg"
            animate={{ rotate: [0, 180, 360], scale: [1, 1.05, 1] }}
            transition={{ duration: 3.6, repeat: Infinity, ease: "linear" }}
          >
            <Flame className="h-10 w-10" />
          </motion.div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Phoenix Console</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Establishing a secure session and preparing the live discovery feed.
            </p>
          </div>
        </motion.div>
        <Toaster position="top-center" richColors />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-[32px] border border-border/70 bg-card/85 p-8 text-center shadow-2xl shadow-black/10 backdrop-blur-2xl"
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[28px] bg-destructive/10 text-destructive">
            <Flame className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">Connection error</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{error}</p>
          <motion.button
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20"
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            Retry session
            <ArrowRight className="h-4 w-4" />
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background pb-24 md:pb-10">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.18),transparent_35%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.18),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.06),transparent_70%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.22),transparent_35%),radial-gradient(circle_at_top_right,rgba(56,189,248,0.16),transparent_28%),linear-gradient(180deg,rgba(10,14,18,0.35),transparent_70%)]" />
        <div className="absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 border-b border-border/60 bg-background/75 backdrop-blur-2xl"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-emerald-400 to-lime-300 text-primary-foreground shadow-lg shadow-primary/20">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold tracking-tight md:text-lg">Phoenix</h1>
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                  Live
                </span>
              </div>
              <p className="text-xs text-muted-foreground md:text-sm">
                Exposure intelligence for leaked API credentials
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <Link
              href="/scraper"
              className="hidden md:inline-flex h-11 items-center gap-2 rounded-2xl border border-border/70 bg-card/80 px-4 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted/80"
            >
              <Search className="h-4 w-4 text-cyan-500" />
              Scraper
            </Link>
            <Link
              href="/key-tester"
              className="hidden md:inline-flex h-11 items-center gap-2 rounded-2xl border border-border/70 bg-card/80 px-4 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted/80"
            >
              <FlaskConical className="h-4 w-4 text-violet-500" />
              Key Tester
            </Link>
            <motion.button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex h-11 items-center gap-2 rounded-2xl border border-border/70 bg-card/80 px-4 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted/80"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
              <span className="hidden sm:inline">Refresh</span>
            </motion.button>
            <ThemeToggle />
          </div>
        </div>
      </motion.header>

      <main className="mx-auto max-w-7xl px-4 pt-6 md:px-6 md:pt-8">
        <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="relative overflow-hidden rounded-[32px] border border-border/70 bg-card/80 p-6 shadow-2xl shadow-black/5 backdrop-blur-2xl md:p-8"
          >
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(34,197,94,0.10),transparent_35%,rgba(255,255,255,0.04))] dark:bg-[linear-gradient(135deg,rgba(34,197,94,0.12),transparent_35%,rgba(255,255,255,0.02))]" />
            <div className="relative">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Enterprise-grade credential discovery
              </div>

              <h2 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance md:text-5xl lg:text-6xl">
                Monitor exposed API keys with a polished, real-time security workspace.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground md:text-base">
                Phoenix continuously tracks discovered credentials, validates provider health,
                and surfaces repository references in a focused dashboard built for analysts,
                engineers, and security teams.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20">
                  <LockKeyhole className="h-4 w-4" />
                  Secure telemetry
                </div>
                <div className="inline-flex items-center gap-2 rounded-2xl border border-border/70 bg-background/70 px-5 py-3 text-sm font-medium text-foreground">
                  <Database className="h-4 w-4 text-primary" />
                  {stats?.valid_keys ?? 0} valid credentials
                </div>
              </div>

              <div className="mt-10 grid gap-3 sm:grid-cols-3">
                {[
                  {
                    icon: Shield,
                    label: "Validation coverage",
                    value: `${stats?.valid_keys ?? 0} verified`,
                  },
                  {
                    icon: Activity,
                    label: "Provider breadth",
                    value: `${providerCount} providers`,
                  },
                  {
                    icon: Clock,
                    label: "Feed cadence",
                    value: "Real-time updates",
                  },
                ].map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 * index }}
                    className="rounded-3xl border border-border/60 bg-background/75 p-4 shadow-sm"
                  >
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <p className="text-sm font-medium">{item.value}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{item.label}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="grid gap-4"
          >
            {[
              {
                title: "Theme aware",
                description: "Professional light and dark presentation tuned for long review sessions.",
                icon: mobileTab === "settings" ? MoonStar : SunMedium,
              },
              {
                title: "Actionable insights",
                description: "Repository references, timestamps, statuses, and copy-ready key access.",
                icon: GitBranch,
              },
              {
                title: "Operational clarity",
                description: "A cleaner hierarchy, softer surfaces, and stronger content emphasis.",
                icon: Search,
              },
            ].map((feature, index) => (
              <div
                key={feature.title}
                className="rounded-[28px] border border-border/70 bg-card/75 p-5 shadow-xl shadow-black/5 backdrop-blur-2xl"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold tracking-tight">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {feature.description}
                </p>
                <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary">
                  Learn more
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            ))}
          </motion.div>
        </section>

        <section className="mt-6 grid gap-4 md:mt-8 md:grid-cols-2 xl:grid-cols-6">
          {[
            {
              label: "Total credentials",
              value: stats?.total_keys ?? 0,
              icon: Key,
              accent: "from-primary/20 to-emerald-400/20",
              type: "number" as const,
            },
            {
              label: "Valid keys",
              value: stats?.valid_keys ?? 0,
              icon: Shield,
              accent: "from-emerald-500/20 to-lime-300/20",
              type: "number" as const,
            },
            {
              label: "Invalid findings",
              value: stats?.invalid_keys ?? 0,
              icon: AlertTriangle,
              accent: "from-rose-500/20 to-orange-300/20",
              type: "number" as const,
            },
            {
              label: "Active providers",
              value: providerCount,
              icon: Activity,
              accent: "from-sky-500/20 to-cyan-300/20",
              type: "number" as const,
            },
            {
              label: "Last validated",
              value: formatTimestamp(stats?.last_validated_at),
              icon: Clock,
              accent: "from-violet-500/20 to-purple-300/20",
              type: "text" as const,
            },
            {
              label: "Last scraped",
              value: formatTimestamp(stats?.last_scraped_at),
              icon: Database,
              accent: "from-cyan-500/20 to-blue-300/20",
              type: "text" as const,
            },
          ].map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.06 * index }}
              className="relative overflow-hidden rounded-[28px] border border-border/70 bg-card/80 p-5 shadow-xl shadow-black/5 backdrop-blur-2xl"
            >
              <div className={cn("absolute inset-0 bg-gradient-to-br", item.accent)} />
              <div className="relative">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                    <div className={cn(
                      "mt-3 font-semibold tracking-tight",
                      item.type === "number" ? "text-3xl tabular-nums" : "text-xl"
                    )}>
                      {item.value}
                    </div>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-background/80 text-primary shadow-sm">
                    <item.icon className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </section>

        {stats?.by_provider && Object.keys(stats.by_provider).length > 0 && (
          <section className="mt-6 rounded-[28px] border border-border/70 bg-card/75 p-5 shadow-xl shadow-black/5 backdrop-blur-2xl md:mt-8">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.24em] text-primary/80">
                  Filter by provider
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Click a provider to filter results
                </p>
              </div>
              {selectedProvider && (
                <motion.button
                  onClick={() => handleProviderFilter(null)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-border/70 bg-background/80 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Clear filter
                </motion.button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stats.by_provider)
                .sort(([, a], [, b]) => b - a)
                .map(([provider, count]) => (
                  <motion.button
                    key={provider}
                    onClick={() => handleProviderFilter(selectedProvider === provider ? null : provider)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium transition-all",
                      selectedProvider === provider
                        ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                        : "border-border/70 bg-background/80 text-foreground hover:bg-muted hover:border-primary/50"
                    )}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <div className={cn(
                      "h-2 w-2 rounded-full",
                      selectedProvider === provider ? "bg-primary-foreground" : `bg-gradient-to-br ${getProviderTone(provider)}`
                    )} />
                    <span>{provider}</span>
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
                      selectedProvider === provider
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}>
                      {count}
                    </span>
                  </motion.button>
                ))}
            </div>
          </section>
        )}

        <section className="mt-6 rounded-[28px] border border-border/70 bg-card/75 p-5 shadow-xl shadow-black/5 backdrop-blur-2xl md:mt-8">
            <div className="mb-4">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-primary/80">
                Recent Visits (phoenix-scraper)
              </p>
            </div>
            <div className="space-y-2">
              {isLoadingVisits ? (
                <div className="animate-pulse h-10 bg-muted rounded-2xl" />
              ) : visits.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent visits</p>
              ) : (
                visits.map((visit) => (
                  <div key={visit.id} className="flex items-center justify-between p-3 rounded-xl bg-background/50 border border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {visit.country_code}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{visit.country}</p>
                        <p className="text-xs text-muted-foreground">{visit.ip}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {new Date(visit.created_at).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
        </section>

        <section className="mt-6 rounded-[28px] border border-border/70 bg-card/75 p-5 shadow-xl shadow-black/5 backdrop-blur-2xl md:mt-8">
          <div className="mb-4">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-primary/80">
              Search & Filter
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Search keys or filter by provider and status
            </p>
          </div>
          <FilterBar
            providers={Object.keys(stats?.by_provider ?? {})}
            selectedProvider={selectedProvider ?? ""}
            selectedStatus={selectedStatus?.toLowerCase() ?? ""}
            onProviderChange={(provider) => handleProviderFilter(provider || null)}
            onStatusChange={(status) => {
              const map: Record<string, string | null> = {
                "": null, valid: "Valid", invalid: "Invalid", pending: "Pending", error: "Error"
              };
              handleStatusFilter(map[status] ?? null);
            }}
            searchQuery={searchQuery}
            onSearchChange={(query) => {
              setSearchQuery(query);
              setCurrentPage(1);
            }}
          />
        </section>

        <section className="mt-6 rounded-[28px] border border-border/70 bg-card/75 p-5 shadow-xl shadow-black/5 backdrop-blur-2xl md:mt-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-rose-400/80">
                Filter by blocked status
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Filter keys matching block rules
              </p>
            </div>
            {selectedBlocked && (
              <motion.button
                onClick={() => handleBlockedFilter(null)}
                className="inline-flex items-center gap-2 rounded-2xl border border-border/70 bg-background/80 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Clear filter
              </motion.button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              { value: "true", label: "Blocked", icon: ShieldOff, color: "from-rose-400 to-rose-600" },
              { value: "false", label: "Not Blocked", icon: Shield, color: "from-emerald-400 to-emerald-600" },
            ].map(({ value, label, icon: Icon, color }) => (
              <motion.button
                key={value}
                onClick={() => handleBlockedFilter(selectedBlocked === value ? null : value)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium transition-all",
                  selectedBlocked === value
                    ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "border-border/70 bg-background/80 text-foreground hover:bg-muted hover:border-primary/50"
                )}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </motion.button>
            ))}
          </div>
        </section>

        <section className="mt-6 md:mt-8">
          <ContentBlockEditor
            rules={blockedRules}
            isLoading={isLoadingBlocked}
            onAdd={handleAddBlockRule}
            onDelete={handleDeleteBlockRule}
          />
        </section>

        <section className="mt-8 rounded-[32px] border border-border/70 bg-card/75 p-4 shadow-2xl shadow-black/5 backdrop-blur-2xl md:p-6">
          <div className="mb-6 flex flex-col gap-4 border-b border-border/60 pb-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-primary/80">
                Discovery stream
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
                Exposed keys and source references
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {searchQuery
                  ? `Search results for "${searchQuery}"`
                  : selectedProvider 
                    ? `Showing ${selectedProvider} keys with validated findings and source paths.`
                    : "Browse validated findings, review source paths, and move through paginated results."
                }
              </p>
              {stats?.last_validated_at && (
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Last validation: {formatTimestamp(stats.last_validated_at)}</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <motion.button
                onClick={downloadCSV}
                disabled={keys.length === 0}
                className="inline-flex items-center gap-2 rounded-2xl border border-border/70 bg-background/80 px-4 py-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">CSV</span>
              </motion.button>
              <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/80 px-4 py-3 text-sm shadow-sm">
                <span className="text-muted-foreground">Page</span>
                <span className="font-medium tabular-nums">
                  {currentPage} / {totalPages}
                </span>
              </div>
            </div>
          </div>

          {isLoadingKeys ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="h-36 animate-pulse rounded-[28px] border border-border/60 bg-background/80"
                />
              ))}
            </div>
          ) : (
          <motion.div
            className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <AnimatePresence mode="popLayout">
              {(keys ?? []).map((key, index) => (
                <KeyCard
                  key={key.id}
                  index={index}
                  keyData={{
                    ...key,
                    repo_refs: key.references?.map((ref) => ref.file_url) ?? [],
                  } as ApiKey}
                />
              ))}
            </AnimatePresence>
          </motion.div>
          )}

          {totalPages > 1 && !isLoadingKeys && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 flex items-center justify-center gap-2"
            >
              <motion.button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-2xl border border-border/70 bg-background transition-colors",
                  currentPage === 1 ? "cursor-not-allowed opacity-40" : "hover:bg-muted"
                )}
                whileTap={{ scale: 0.96 }}
              >
                <ChevronLeft className="h-5 w-5" />
              </motion.button>

              <div className="hidden items-center gap-2 md:flex">
                {getPageNumbers().map((page, index) =>
                  page === "..." ? (
                    <span key={`ellipsis-${index}`} className="px-1 text-muted-foreground">
                      ...
                    </span>
                  ) : (
                    <motion.button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={cn(
                        "flex h-11 min-w-11 items-center justify-center rounded-2xl border px-4 text-sm font-medium transition-colors",
                        currentPage === page
                          ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                          : "border-border/70 bg-background hover:bg-muted"
                      )}
                      whileTap={{ scale: 0.96 }}
                    >
                      {page}
                    </motion.button>
                  )
                )}
              </div>

              <div className="px-3 text-sm font-medium tabular-nums md:hidden">
                {currentPage} / {totalPages}
              </div>

              <motion.button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-2xl border border-border/70 bg-background transition-colors",
                  currentPage === totalPages ? "cursor-not-allowed opacity-40" : "hover:bg-muted"
                )}
                whileTap={{ scale: 0.96 }}
              >
                <ChevronRight className="h-5 w-5" />
              </motion.button>
            </motion.div>
          )}
        </section>
      </main>

      <footer className="mx-auto mt-8 max-w-7xl px-4 pb-28 text-center text-sm text-muted-foreground md:px-6 md:pb-8">
        Phoenix Key Scanner · A cleaner command center for discovery and validation
      </footer>

      <motion.nav
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed inset-x-4 bottom-4 z-50 rounded-[28px] border border-border/70 bg-background/85 p-2 shadow-2xl shadow-black/10 backdrop-blur-2xl md:hidden"
      >
        <div className="grid grid-cols-4 gap-1">
          {[
            { id: "home", label: "Home", icon: Home, href: null },
            { id: "scraper", label: "Scrape", icon: Search, href: "/scraper" },
            { id: "tester", label: "Test", icon: FlaskConical, href: "/key-tester" },
            { id: "settings", label: "Theme", icon: Settings, href: null },
          ].map((item) =>
            item.href ? (
              <Link
                key={item.id}
                href={item.href}
                className="flex flex-col items-center gap-1 rounded-[22px] px-2 py-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            ) : (
              <motion.button
                key={item.id}
                onClick={() =>
                  setMobileTab(item.id as "home" | "search" | "settings")
                }
                className={cn(
                  "flex flex-col items-center gap-1 rounded-[22px] px-2 py-3 text-xs font-medium transition-colors",
                  mobileTab === item.id
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "text-muted-foreground"
                )}
                whileTap={{ scale: 0.97 }}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </motion.button>
            )
          )}
        </div>
      </motion.nav>

      <Toaster position="top-center" richColors />
    </div>
  );
}
