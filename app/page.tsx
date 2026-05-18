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
  Stats,
  ApiKey,
  Visit,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Menu,
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
} from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { FilterBar } from "@/components/filter-bar";
import { KeyCard } from "@/components/key-card";


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

  const loadData = useCallback(async (page: number = 1, provider: string | null = null, status: string | null = null, search: string = "") => {
    if (!getSessionId()) return;
    setIsLoadingKeys(true);
    try {
      const [statsRes, keysRes] = await Promise.all([
        fetchStats(), 
        fetchKeys(page, provider || undefined, status || undefined, search || undefined)
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
      loadData(currentPage, selectedProvider, selectedStatus, debouncedSearch);
      loadVisits();
    }
  }, [isInitializing, error, loadData, loadVisits, currentPage, selectedProvider, selectedStatus, debouncedSearch]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    toast.info("Refreshing live feed...", {
      icon: <RefreshCw className="h-4 w-4 animate-spin" />,
    });
    await loadData(currentPage, selectedProvider, selectedStatus, debouncedSearch);
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
    <div className="relative min-h-screen overflow-x-hidden bg-background selection:bg-primary/20 selection:text-primary">
      {/* 2026 Spatial Background: Grain + Ambient Depth */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] brightness-100 contrast-150" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(34,197,94,0.15),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_100%,rgba(56,189,248,0.08),transparent_50%)]" />
      </div>

      {/* Floating Island Header */}
      <div className="fixed inset-x-0 top-6 z-50 flex justify-center px-4">
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex h-14 items-center gap-6 rounded-full border border-white/10 bg-card/40 px-6 py-2 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-2xl transition-all hover:border-white/20"
        >
          <div className="flex items-center gap-3 border-r border-white/10 pr-6">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-[0_0_15px_rgba(34,197,94,0.3)]">
              <Flame className="h-4 w-4" />
            </div>
            <span className="font-mono text-sm font-bold uppercase tracking-widest hidden md:block">Phoenix</span>
          </div>
          
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <button className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 transition-colors hover:bg-white/10">
                <Menu className="h-4 w-4" />
              </button>
            </SheetTrigger>
            <SheetContent side="top">
              <SheetHeader>
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 p-4">
                {[
                  { label: "Scanner", icon: Search, href: "/" },
                  { label: "Tester", icon: FlaskConical, href: "/key-tester" },
                ].map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center gap-3 rounded-xl p-3 text-sm font-bold uppercase tracking-tighter transition-all hover:bg-white/5"
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>

          <nav className="hidden items-center gap-1 md:flex">
            {[
              { label: "Scanner", icon: Search, href: "/", active: true },
              { label: "Tester", icon: FlaskConical, href: "/key-tester" },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-tighter transition-all hover:bg-white/5",
                  item.active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3 border-l border-white/10 pl-6">
            <ThemeToggle />
            <motion.button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 transition-colors hover:bg-white/10"
              whileTap={{ scale: 0.9 }}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
            </motion.button>
          </div>
        </motion.header>
      </div>

      <main className="mx-auto max-w-7xl px-4 pt-32 pb-24 md:px-8">
        {/* Typographic Hero */}
        <section className="mb-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-start gap-4"
          >
            <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
              </span>
              Live discovery feed
            </div>
            <h1 className="max-w-3xl font-sans text-5xl font-bold tracking-[-0.04em] md:text-7xl">
              Exposure <span className="text-muted-foreground/40 italic font-medium">intelligence.</span>
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
              Real-time surveillance of leaked API credentials. Validated findings, provider telemetry, and source references consolidated into a spatial workspace.
            </p>
          </motion.div>
        </section>

        {/* Command Bento: The Core Interface */}
        <section className="mb-16 grid grid-cols-1 gap-4 md:grid-cols-4 md:grid-rows-2">
          {/* Main Stats Bento */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="col-span-1 row-span-2 flex flex-col justify-between rounded-[32px] border border-white/5 bg-card/20 p-8 backdrop-blur-xl md:col-span-2"
          >
            <div>
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50">Overview</p>
              <div className="mt-8 grid grid-cols-2 gap-8">
                <div>
                  <p className="text-4xl font-bold tabular-nums tracking-tighter">{stats?.valid_keys ?? 0}</p>
                  <p className="mt-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-emerald-500">
                    <Shield className="h-3 w-3" /> Validated
                  </p>
                </div>
                <div>
                  <p className="text-4xl font-bold tabular-nums tracking-tighter">{stats?.total_keys ?? 0}</p>
                  <p className="mt-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <Key className="h-3 w-3" /> Scan Total
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-12 space-y-4">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <span>Discovery rate</span>
                <span className="text-primary">+12.5%</span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "65%" }}
                  className="h-full bg-primary" 
                />
              </div>
            </div>
          </motion.div>

          {/* Search & Filter Bento */}
          <div className="col-span-1 rounded-[32px] border border-white/5 bg-card/20 p-6 backdrop-blur-xl md:col-span-2">
            <div className="flex h-full flex-col justify-between">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50">Filters</p>
                <div className="flex gap-2">
                   <div className="h-2 w-2 rounded-full bg-emerald-500/20" />
                   <div className="h-2 w-2 rounded-full bg-primary/40" />
                </div>
              </div>
              <div className="mt-4">
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
              </div>
            </div>
          </div>

          {/* Telemetry / Visits Bento */}
          <div className="col-span-1 rounded-[32px] border border-white/5 bg-card/20 p-6 backdrop-blur-xl md:col-span-2">
            <div className="flex h-full flex-col justify-between">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50">Telemetry</p>
                <span className="font-mono text-[9px] text-muted-foreground/30">NORD_STRM_v2.6</span>
              </div>
              <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {isLoadingVisits ? (
                  <div className="flex gap-2">
                    {[1, 2, 3].map(i => <div key={i} className="h-10 w-24 animate-pulse rounded-2xl bg-white/5" />)}
                  </div>
                ) : (
                  visits.slice(0, 4).map((visit) => (
                    <div key={visit.id} className="flex shrink-0 items-center gap-3 rounded-2xl border border-white/5 bg-white/5 px-4 py-2">
                      <span className="font-mono text-[10px] font-bold text-primary">{visit.country_code}</span>
                      <span className="font-mono text-[9px] text-muted-foreground tabular-nums">{visit.ip.split('.').slice(-2).join('.')}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Stream Section */}
        <section>
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/50">Activity Stream</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight">Real-time findings</h2>
            </div>
            <div className="flex items-center gap-3">
               <button 
                 onClick={downloadCSV}
                 className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all hover:bg-white/10"
               >
                 <Download className="h-3 w-3" /> Export_CSV
               </button>
            </div>
          </div>

          {isLoadingKeys ? (
            <div className="grid gap-4 md:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 animate-pulse rounded-[32px] border border-white/5 bg-white/5" />
              ))}
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <motion.div
                key="stream-grid"
                className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
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
              </motion.div>

              {totalPages > 1 && (
                <div key="pagination" className="mt-12 flex items-center justify-center gap-1">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 transition-all hover:bg-white/5 disabled:opacity-20"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="flex items-center gap-1 px-4">
                    <span className="font-mono text-xs font-bold">{currentPage}</span>
                    <span className="font-mono text-[10px] text-muted-foreground/40">/</span>
                    <span className="font-mono text-xs text-muted-foreground/60">{totalPages}</span>
                  </div>
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 transition-all hover:bg-white/5 disabled:opacity-20"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </AnimatePresence>
          )}
        </section>
      </main>

      <footer className="py-12 text-center">
        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.4em] text-muted-foreground/30">
          Phoenix · Secure Console v2.0.26
        </p>
      </footer>

      <Toaster position="bottom-right" theme="dark" richColors />
    </div>
  );

}
