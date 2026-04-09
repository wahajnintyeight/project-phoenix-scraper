"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
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
  Eye,
  AlertTriangle,
  Copy,
  Check,
  ChevronRight,
  TrendingUp,
  Activity,
  Clock,
  Key,
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

  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 200], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 200], [1, 0.95]);

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
        console.error("[v0] Session initialization failed:", err);
        setError("Failed to connect. Please refresh the page.");
        toast.error("Connection failed");
      } finally {
        setIsInitializing(false);
      }
    }
    init();
  }, []);

  const loadData = useCallback(async () => {
    if (!getSessionId()) return;
    setIsLoadingKeys(true);
    try {
      const [statsRes, keysRes] = await Promise.all([
        fetchStats(),
        fetchKeys(1),
      ]);
      
      if (statsRes.code === 1009) {
        setStats(statsRes.result);
      }
      if (keysRes.code === 1009) {
        setKeys(keysRes.result.keys.slice(0, 6)); // Only show first 6
      }
    } catch (err) {
      console.error("[v0] Failed to fetch data:", err);
      toast.error("Failed to load data");
    } finally {
      setIsLoadingKeys(false);
    }
  }, []);

  useEffect(() => {
    if (!isInitializing && !error) {
      loadData();
    }
  }, [isInitializing, error, loadData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    toast.info("Refreshing...", {
      icon: <RefreshCw className="h-4 w-4 animate-spin" />,
    });
    await loadData();
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
        <Toaster position="bottom-right" richColors />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-destructive/10 mx-auto">
            <Flame className="h-10 w-10 text-destructive" />
          </div>
          <h2 className="mb-2 text-xl font-bold">Connection Error</h2>
          <p className="mb-6 text-sm text-muted-foreground">{error}</p>
          <motion.button
            onClick={() => window.location.reload()}
            className="rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground"
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
    <div className="min-h-screen bg-background">
      {/* Floating Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-4 left-1/2 z-50 -translate-x-1/2"
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

      {/* Hero Section */}
      <motion.section
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative overflow-hidden px-4 pt-32 pb-12"
      >
        {/* Gradient orbs */}
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

        <div className="relative mx-auto max-w-6xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-4 inline-flex items-center gap-2 rounded-full border bg-background/50 px-4 py-1.5 text-sm backdrop-blur-sm"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Live API Key Discovery</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6 text-5xl font-bold tracking-tight sm:text-7xl text-balance"
          >
            Discover exposed{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              API keys
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground text-pretty"
          >
            Monitor and validate API keys from multiple providers in real-time.
            Secure your infrastructure with automated discovery.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-4"
          >
            <motion.button
              className="group flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground shadow-lg shadow-primary/20"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>Explore Keys</span>
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </motion.button>
            <motion.button
              className="flex items-center gap-2 rounded-xl border bg-background/50 px-6 py-3 font-medium backdrop-blur-sm"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Shield className="h-4 w-4" />
              <span>Documentation</span>
            </motion.button>
          </motion.div>
        </div>
      </motion.section>

      {/* Stats Bento Grid */}
      <section className="mx-auto max-w-6xl px-4 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {/* Total Keys */}
          <motion.div
            className="group relative overflow-hidden rounded-3xl border bg-gradient-to-br from-card to-card/50 p-6 shadow-lg"
            whileHover={{ y: -4, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
          >
            <div className="relative z-10">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                <Key className="h-6 w-6 text-primary" />
              </div>
              <div className="mb-1 text-3xl font-bold tabular-nums">
                {stats?.total_keys ?? 0}
              </div>
              <div className="text-sm text-muted-foreground">Total Keys</div>
            </div>
            <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-primary/5 blur-2xl" />
          </motion.div>

          {/* Valid Keys */}
          <motion.div
            className="group relative overflow-hidden rounded-3xl border bg-gradient-to-br from-valid/5 to-card p-6 shadow-lg"
            whileHover={{ y: -4, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
          >
            <div className="relative z-10">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-valid/10">
                <Shield className="h-6 w-6 text-valid" />
              </div>
              <div className="mb-1 text-3xl font-bold tabular-nums text-valid">
                {stats?.valid_keys ?? 0}
              </div>
              <div className="text-sm text-muted-foreground">Valid</div>
            </div>
          </motion.div>

          {/* Invalid Keys */}
          <motion.div
            className="group relative overflow-hidden rounded-3xl border bg-gradient-to-br from-invalid/5 to-card p-6 shadow-lg"
            whileHover={{ y: -4, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
          >
            <div className="relative z-10">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-invalid/10">
                <AlertTriangle className="h-6 w-6 text-invalid" />
              </div>
              <div className="mb-1 text-3xl font-bold tabular-nums text-invalid">
                {stats?.invalid_keys ?? 0}
              </div>
              <div className="text-sm text-muted-foreground">Invalid</div>
            </div>
          </motion.div>

          {/* Activity */}
          <motion.div
            className="group relative overflow-hidden rounded-3xl border bg-gradient-to-br from-accent/5 to-card p-6 shadow-lg"
            whileHover={{ y: -4, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
          >
            <div className="relative z-10">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10">
                <Activity className="h-6 w-6 text-accent" />
              </div>
              <div className="mb-1 text-3xl font-bold tabular-nums">
                {(stats?.by_provider && Object.keys(stats.by_provider).length) ?? 0}
              </div>
              <div className="text-sm text-muted-foreground">Providers</div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Keys Showcase - Bento Grid */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mb-8"
        >
          <h2 className="mb-2 text-3xl font-bold">Latest Discoveries</h2>
          <p className="text-muted-foreground">
            Recently discovered API keys from various providers
          </p>
        </motion.div>

        {isLoadingKeys ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="h-48 animate-pulse rounded-2xl border bg-card"
              />
            ))}
          </div>
        ) : (
          <motion.div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <AnimatePresence>
              {keys.map((key, index) => (
                <motion.div
                  key={key.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -8, transition: { duration: 0.2 } }}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl border bg-card p-6 shadow-lg",
                    index === 0 && "sm:col-span-2 lg:col-span-1"
                  )}
                >
                  {/* Gradient accent */}
                  <div className={cn(
                    "absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100",
                    "bg-gradient-to-br",
                    getProviderGradient(key.provider),
                    "opacity-5"
                  )} />

                  <div className="relative z-10">
                    {/* Provider header */}
                    <div className="mb-4 flex items-start justify-between">
                      <div className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg",
                        getProviderGradient(key.provider)
                      )}>
                        <Key className="h-6 w-6 text-white" />
                      </div>
                      <span className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium",
                        getStatusColor(key.status)
                      )}>
                        {key.status}
                      </span>
                    </div>

                    {/* Provider name */}
                    <h3 className="mb-2 text-lg font-bold capitalize">
                      {key.provider}
                    </h3>

                    {/* Key preview */}
                    <div className="mb-4 font-mono text-sm text-muted-foreground">
                      {key.key_value.slice(0, 20)}...
                    </div>

                    {/* Metadata */}
                    <div className="mb-4 flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(key.created_at).toLocaleDateString()}</span>
                      </div>
                      {key.error_count > 0 && (
                        <div className="flex items-center gap-1 text-error">
                          <AlertTriangle className="h-3 w-3" />
                          <span>{key.error_count} errors</span>
                        </div>
                      )}
                    </div>

                    {/* Copy button */}
                    <motion.button
                      onClick={() => handleCopy(key.key_value, key.id, key.provider)}
                      className={cn(
                        "flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-colors",
                        copiedId === key.id
                          ? "bg-valid/10 text-valid border-valid/20"
                          : "bg-background hover:bg-muted"
                      )}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {copiedId === key.id ? (
                        <>
                          <Check className="h-4 w-4" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          <span>Copy Key</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* View More */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-8 text-center"
        >
          <motion.button
            className="inline-flex items-center gap-2 rounded-xl border bg-background px-6 py-3 font-medium hover:bg-muted"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span>View All Keys</span>
            <ChevronRight className="h-4 w-4" />
          </motion.button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground">
          <p>Phoenix Key Scanner &middot; Powered by Project Phoenix</p>
        </div>
      </footer>

      <Toaster position="bottom-right" richColors />
    </div>
  );
}
