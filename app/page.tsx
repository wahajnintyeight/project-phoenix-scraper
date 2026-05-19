"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
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
  Flame,
  RefreshCw,
  Zap,
  Shield,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Activity,
  Clock,
  Key,
  Download,
  Search,
  Globe,
  TrendingUp,
  Cpu,
  Fingerprint,
  FlaskConical,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { KeyCard } from "@/components/key-card";
import Link from "next/link";

export default function KeyScannerPage() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [isLoadingKeys, setIsLoadingKeys] = useState(true);
  const [isLoadingVisits, setIsLoadingVisits] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const topCountryStats = useMemo(() => {
    if (!visits.length) return null;
    const counts: Record<string, { count: number; name: string; times: string[] }> = {};
    visits.forEach((v) => {
      if (!counts[v.country_code]) {
        counts[v.country_code] = { count: 0, name: v.country, times: [] };
      }
      counts[v.country_code].count++;
      counts[v.country_code].times.push(new Date(v.created_at).getHours() + ":00");
    });
    const top = Object.values(counts).reduce((a, b) => (a.count > b.count ? a : b));

    const hourCounts: Record<string, number> = {};
    top.times.forEach(h => hourCounts[h] = (hourCounts[h] || 0) + 1);
    const peakTime = Object.keys(hourCounts).reduce((a, b) => hourCounts[a] > hourCounts[b] ? a : b);

    return { ...top, peakTime };
  }, [visits]);

  useEffect(() => {
    async function init() {
      try {
        if (!getSessionId()) await createSession();
        setError(null);
      } catch (err) {
        setError("Network Outage Detected");
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
      if (statsRes.code === 1009) setStats(statsRes.result);
      if (keysRes.code === 1009) {
        setKeys(keysRes.result.keys || []);
        setTotalPages(keysRes.result.total_pages || 1);
      }
    } finally {
      setIsLoadingKeys(false);
    }
  }, []);

  const loadVisits = useCallback(async () => {
    if (!getSessionId()) return;
    setIsLoadingVisits(true);
    try {
      const res = await fetchVisits(1, "phoenix-scraper");
      if (res.code === 1094) setVisits(res.result.visits);
    } finally {
      setIsLoadingVisits(false);
    }
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedProvider, selectedStatus, debouncedSearch]);

  useEffect(() => {
    if (!isInitializing && !error) {
      loadData(currentPage, selectedProvider, selectedStatus, debouncedSearch);
      loadVisits();
    }
  }, [isInitializing, error, loadData, loadVisits, currentPage, selectedProvider, selectedStatus, debouncedSearch]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData(currentPage, selectedProvider, selectedStatus, debouncedSearch);
    await loadVisits();
    setIsRefreshing(false);
    toast.success("Intelligence Stream Synced");
  };

  const downloadCSV = () => {
    const headers = ["Provider", "Key Value", "Status"];
    const rows = keys.map((k) => [k.provider, k.key_value, k.status]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `phoenix_export.csv`;
    a.click();
  };

  if (isInitializing) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 selection:bg-cyan-500/30">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#111,transparent)]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
        <div className="absolute inset-0 opacity-[0.03] grayscale bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>

      <nav className="sticky top-0 z-[100] border-b border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 border-r border-white/10 pr-6">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <Flame className="h-5 w-5 text-black" strokeWidth={2.5} />
              </div>
              <div className="hidden flex-col md:flex">
                <span className="text-xs font-black uppercase tracking-[0.3em] text-white">Phoenix</span>
                <span className="text-[10px] font-mono text-emerald-500/80">LIVE_PROTOCOL_V2</span>
              </div>
            </div>

            <div className="hidden items-center gap-1 md:flex">
              <Link href="/" className="flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-tighter transition-all bg-white/5 text-emerald-400">
                <Search className="h-3.5 w-3.5" /> Scanner
              </Link>
              <Link href="/key-tester" className="flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-tighter transition-all text-muted-foreground hover:bg-white/5 hover:text-foreground">
                <FlaskConical className="h-3.5 w-3.5" /> Tester
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 md:hidden mr-2">
               <Link href="/" className="p-2 text-emerald-400"><Search className="h-4 w-4" /></Link>
               <Link href="/key-tester" className="p-2 text-muted-foreground"><FlaskConical className="h-4 w-4" /></Link>
            </div>

            <div className="hidden md:flex mr-4 h-8 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              <span className="text-[10px] font-bold uppercase tracking-tighter text-slate-400">Stream: Active</span>
            </div>
            <ThemeToggle />
            <button
              onClick={handleRefresh}
              className={cn("p-2 rounded-lg hover:bg-white/5 transition-colors text-slate-400 hover:text-white", isRefreshing && "animate-spin")}
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </nav>

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-12">
        <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-12">

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="group relative col-span-1 flex flex-col justify-between overflow-hidden rounded-[2rem] border border-white/10 bg-[#0a0a0a] p-8 md:col-span-8"
          >
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-emerald-500">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-black uppercase tracking-widest">Surveillance Summary</span>
              </div>
              <h1 className="mt-4 text-5xl font-black tracking-tighter text-white md:text-7xl">
                {stats?.total_keys?.toLocaleString()} <span className="text-slate-700">Exploits.</span>
              </h1>
              <p className="mt-4 max-w-md text-slate-400 leading-relaxed font-medium">
                Automated credential discovery active. Consolidating leaks across <span className="text-white">GitHub, GitLab, and S3 buckets</span> into a unified mercury-grade feed.
              </p>
            </div>

            <div className="relative z-10 mt-12 flex flex-wrap gap-8">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Valid Rate</span>
                <p className="text-2xl font-black text-emerald-400">
                  {stats ? Math.round((stats.valid_keys / stats.total_keys) * 100) : 0}%
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Active Nodes</span>
                <p className="text-2xl font-black text-white">{Object.keys(stats?.by_provider || {}).length}</p>
              </div>
              <div className="flex-1" />
              <button onClick={downloadCSV} className="flex items-center gap-2 self-end rounded-full bg-white px-6 py-3 text-xs font-black uppercase text-black transition-transform hover:scale-105 active:scale-95">
                <Download className="h-4 w-4" /> Export Data
              </button>
            </div>
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-[100px] transition-colors group-hover:bg-emerald-500/20" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
            className="col-span-1 rounded-[2rem] border border-white/10 bg-gradient-to-b from-[#0a0a0a] to-black p-8 md:col-span-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-cyan-400">
                <Globe className="h-5 w-5" />
              </div>
              <div className="rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase text-emerald-500">
                Top Region
              </div>
            </div>

            <div className="mt-8">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Origin Insight</span>
              <h2 className="mt-2 text-4xl font-black tracking-tighter text-white">
                {topCountryStats?.name || "Detecting..."}
              </h2>
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-xs text-slate-400 font-medium">Traffic Density</span>
                  <span className="text-xs font-mono text-white">{topCountryStats?.count} visits</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-xs text-slate-400 font-medium">Peak Activity</span>
                  <span className="text-xs font-mono text-cyan-400">{topCountryStats?.peakTime || "--:--"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Risk Level</span>
                  <span className="text-xs font-bold text-rose-500">CRITICAL</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="mb-12 overflow-x-auto pb-4 no-scrollbar">
          <div className="flex gap-3">
            {stats?.by_provider && Object.entries(stats.by_provider).map(([name, count], i) => (
              <motion.button
                key={name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedProvider(selectedProvider === name ? null : name)}
                className={cn(
                  "flex min-w-[140px] flex-col gap-4 rounded-2xl border p-4 transition-all duration-300",
                  selectedProvider === name
                    ? "border-emerald-500 bg-emerald-500/10 text-white"
                    : "border-white/5 bg-[#0a0a0a] hover:border-white/20"
                )}
              >
                <div className="flex items-center justify-between">
                   <Cpu className={cn("h-4 w-4", selectedProvider === name ? "text-emerald-400" : "text-slate-600")} />
                   <span className="font-mono text-[10px] font-bold opacity-40">#{i + 1}</span>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{name}</p>
                  <p className="text-xl font-black">{count}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-center">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" />
            <input
              type="text"
              placeholder="Query key index or fingerprint..."
              className="w-full rounded-2xl border border-white/5 bg-[#0a0a0a] py-4 pl-12 pr-4 text-sm font-medium outline-none transition-all focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {['Valid', 'Invalid'].map((s) => (
              <button
                key={s}
                onClick={() => setSelectedStatus(selectedStatus === s ? null : s)}
                className={cn(
                  "rounded-xl border px-6 py-4 text-xs font-black uppercase tracking-widest transition-all",
                  selectedStatus === s
                    ? "border-white bg-white text-black"
                    : "border-white/5 bg-[#0a0a0a] hover:bg-white/5"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <section>
          {isLoadingKeys ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 animate-pulse rounded-[2rem] bg-white/[0.02]" />
              ))}
            </div>
          ) : (
            <>
              <motion.div
                layout
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              >
                <AnimatePresence mode="popLayout">
                  {keys.map((key, i) => (
                    <motion.div
                      key={key.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.4, delay: i * 0.05 }}
                    >
                      <KeyCard
                         keyData={{...key, repo_refs: key.references?.map(r => r.file_url) || []} as ApiKey}
                         index={i}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>

              {totalPages > 1 && (
                <div className="mt-20 flex items-center justify-center gap-8">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="flex h-14 w-14 items-center justify-center rounded-full border border-white/5 bg-[#0a0a0a] transition-all hover:bg-white hover:text-black disabled:opacity-20"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Segment</p>
                    <p className="text-xl font-black text-white">{currentPage} <span className="text-slate-700">/</span> {totalPages}</p>
                  </div>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="flex h-14 w-14 items-center justify-center rounded-full border border-white/5 bg-[#0a0a0a] transition-all hover:bg-white hover:text-black disabled:opacity-20"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <footer className="mt-20 border-t border-white/5 py-12">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.5em] text-slate-600">
            Internal Use Only · Phoenix Console V2.2026.1
          </p>
        </div>
      </footer>

      <Toaster position="bottom-right" theme="dark" richColors />
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#050505]">
      <motion.div
        animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="relative flex h-24 w-24 items-center justify-center"
      >
        <div className="absolute inset-0 rounded-3xl bg-emerald-500/20 blur-2xl" />
        <Fingerprint className="h-12 w-12 text-emerald-500" strokeWidth={1} />
      </motion.div>
      <p className="mt-8 font-mono text-[10px] font-black uppercase tracking-[0.4em] text-emerald-500/50">
        Initializing_Spatial_Interface
      </p>
    </div>
  );
}
