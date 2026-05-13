"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "sonner";
import {
  createSession,
  fetchQueries,
  createQuery,
  deleteQuery,
  getSessionId,
  type SearchQuery,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Flame,
  Search,
  Plus,
  Trash2,
  ArrowLeft,
  ToggleLeft,
  ToggleRight,
  Loader2,
  Clock,
  Activity,
  Globe,
  FileCode,
  Zap,
  Sparkles,
  Check,
  X,
  Key,
  Database,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

const SCRAPE_PROVIDERS = [
  { id: "openai", label: "OpenAI", gradient: "from-emerald-400 to-emerald-600", keyPrefix: "sk-" },
  { id: "anthropic", label: "Anthropic", gradient: "from-orange-400 to-amber-500", keyPrefix: "sk-ant-" },
  { id: "google", label: "Google", gradient: "from-sky-400 to-blue-600", keyPrefix: "AIza" },
  { id: "deepseek", label: "DeepSeek", gradient: "from-blue-500 to-indigo-600", keyPrefix: "sk-" },
  { id: "openrouter", label: "OpenRouter", gradient: "from-fuchsia-400 to-violet-500", keyPrefix: "sk-or-" },
  { id: "moonshot", label: "Moonshot", gradient: "from-indigo-400 to-purple-600", keyPrefix: "sk-mo-" },
  { id: "stripe", label: "Stripe", gradient: "from-violet-400 to-indigo-600", keyPrefix: "sk_live_" },
  { id: "github", label: "GitHub", gradient: "from-slate-400 to-slate-600", keyPrefix: "ghp_" },
];

const providerConfig: Record<string, { color: string }> = {
  openai: { color: "from-emerald-400/20 to-emerald-600/20 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" },
  anthropic: { color: "from-orange-400/20 to-amber-500/20 border-orange-500/20 text-orange-600 dark:text-orange-400" },
  google: { color: "from-sky-400/20 to-blue-600/20 border-blue-500/20 text-blue-600 dark:text-blue-400" },
  deepseek: { color: "from-blue-500/20 to-indigo-600/20 border-indigo-500/20 text-indigo-600 dark:text-indigo-400" },
  openrouter: { color: "from-fuchsia-400/20 to-violet-500/20 border-violet-500/20 text-violet-600 dark:text-violet-400" },
  moonshot: { color: "from-indigo-400/20 to-purple-600/20 border-purple-600/20 text-purple-600 dark:text-purple-400" },
  stripe: { color: "from-violet-400/20 to-indigo-600/20 border-indigo-500/20 text-indigo-600 dark:text-indigo-400" },
  github: { color: "from-slate-400/20 to-slate-600/20 border-slate-500/20 text-slate-600 dark:text-slate-400" },
};

const getProviderStyle = (provider: string) => {
  const key = provider.toLowerCase();
  return providerConfig[key] || providerConfig.openai;
};

export default function ScraperPage() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [queries, setQueries] = useState<SearchQuery[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProvider, setNewProvider] = useState("");
  const [newQuery, setNewQuery] = useState("");
  const [newEnabled, setNewEnabled] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [customProvider, setCustomProvider] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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
        setInitError(null);
      } catch {
        setInitError("Failed to connect. Please refresh the page.");
        toast.error("Connection failed");
      } finally {
        setIsInitializing(false);
      }
    }
    init();
  }, []);

  const loadQueries = useCallback(async () => {
    if (!getSessionId()) return;
    setIsLoading(true);
    try {
      const res = await fetchQueries();
      if (res.code === 1009) {
        setQueries(res.result.queries);
      }
    } catch (err) {
      console.error("Failed to fetch queries:", err);
      toast.error("Failed to load queries");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isInitializing && !initError) {
      loadQueries();
    }
  }, [isInitializing, initError, loadQueries]);

  const handleCreateQuery = async () => {
    const provider = customProvider ? newProvider.trim() : newProvider;
    if (!provider) {
      toast.error("Select or enter a provider");
      return;
    }
    if (!newQuery.trim()) {
      toast.error("Enter a search query");
      return;
    }

    setIsCreating(true);
    try {
      const res = await createQuery(provider, newQuery.trim(), newEnabled);
      if (res.code === 1009) {
        toast.success("Query created", {
          icon: <Sparkles className="h-4 w-4" />,
        });
        setNewQuery("");
        setNewProvider("");
        setCustomProvider(false);
        setShowCreateForm(false);
        loadQueries();
      } else {
        toast.error(res.message || "Failed to create query");
      }
    } catch {
      toast.error("Failed to create query");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteQuery = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteQuery(id);
      toast.success("Query deleted");
      setQueries((prev) => prev.filter((q) => q._id !== id));
    } catch {
      toast.error("Failed to delete query");
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
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
      year: "numeric",
    });
  };

  const activeCount = queries.filter((q) => q.enabled).length;
  const getUniqueProviders = () => {
    const set = new Set(queries.map((q) => q.provider));
    return set.size;
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
            <p className="mt-2 text-sm text-muted-foreground">Establishing a secure session...</p>
          </div>
        </motion.div>
        <Toaster position="top-center" richColors />
      </div>
    );
  }

  if (initError) {
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
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{initError}</p>
          <motion.button
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20"
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
          >
            Retry session
          </motion.button>
        </motion.div>
        <Toaster position="top-center" richColors />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background pb-24 md:pb-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.18),transparent_35%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.18),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.06),transparent_70%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.22),transparent_35%),radial-gradient(circle_at_top_right,rgba(56,189,248,0.16),transparent_28%),linear-gradient(180deg,rgba(10,14,18,0.35),transparent_70%)]" />
        <div className="absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 border-b border-border/60 bg-background/75 backdrop-blur-2xl"
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 bg-card/80 text-muted-foreground shadow-sm transition-colors hover:bg-muted/80 hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 text-white shadow-sm">
                <Search className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-sm font-semibold tracking-tight md:text-base">Scraper</h1>
                <p className="text-xs text-muted-foreground">Manage search queries and discovery targets</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              onClick={() => setShowCreateForm((v) => !v)}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-border/70 bg-card/80 px-3 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-muted/80"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
            >
              <Plus className="h-3.5 w-3.5" />
              New query
            </motion.button>
            <ThemeToggle />
          </div>
        </div>
      </motion.header>

      <main className="mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
            <Globe className="h-3.5 w-3.5 text-cyan-500" />
            Discovery query engine
          </span>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
            Search query management
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Define what to search for across sources. Each query targets a specific provider and key pattern.
          </p>
        </motion.div>

        <section className="mb-8 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total queries", value: queries.length, icon: FileCode, accent: "from-cyan-500/20 to-blue-300/20" },
            { label: "Active queries", value: activeCount, icon: Activity, accent: "from-emerald-500/20 to-lime-300/20" },
            { label: "Target providers", value: getUniqueProviders(), icon: Globe, accent: "from-violet-500/20 to-purple-300/20" },
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
                    <div className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">
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

        <AnimatePresence>
          {showCreateForm && (
            <motion.section
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="rounded-[32px] border border-border/70 bg-card/80 p-6 shadow-2xl shadow-black/5 backdrop-blur-2xl md:p-8">
                <h3 className="mb-6 flex items-center gap-2 text-lg font-semibold tracking-tight">
                  <Plus className="h-5 w-5 text-primary" />
                  Create new search query
                </h3>

                <div className="space-y-5">
                  <div>
                    <label className="mb-2 block text-xs font-medium text-muted-foreground">
                      Provider
                    </label>
                    {!customProvider ? (
                      <div className="flex flex-wrap gap-2">
                        {SCRAPE_PROVIDERS.map((p) => (
                          <motion.button
                            key={p.id}
                            onClick={() => setNewProvider(p.id)}
                            className={cn(
                              "inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium transition-all",
                              newProvider === p.id
                                ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                : "border-border/70 bg-background/80 text-foreground hover:bg-muted"
                            )}
                            whileHover={{ scale: 1.03, y: -1 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <span className={cn("h-2 w-2 rounded-full bg-gradient-to-br", p.gradient)} />
                            {p.label}
                          </motion.button>
                        ))}
                        <motion.button
                          onClick={() => { setCustomProvider(true); setNewProvider(""); }}
                          className="inline-flex items-center gap-2 rounded-2xl border border-dashed border-border/70 bg-background/80 px-4 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-muted"
                          whileHover={{ scale: 1.03, y: -1 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          Custom
                        </motion.button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newProvider}
                          onChange={(e) => setNewProvider(e.target.value)}
                          placeholder="Enter provider name..."
                          className="flex-1 rounded-2xl border border-border/60 bg-background/60 px-4 py-3 text-sm outline-none placeholder:text-muted-foreground/50 focus:border-primary/50"
                        />
                        <motion.button
                          onClick={() => { setCustomProvider(false); setNewProvider(""); }}
                          className="inline-flex h-11 items-center gap-2 rounded-2xl border border-border/70 bg-background/80 px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
                          whileTap={{ scale: 0.97 }}
                        >
                          <X className="h-4 w-4" />
                        </motion.button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium text-muted-foreground">
                      Search query
                    </label>
                    <input
                      type="text"
                      value={newQuery}
                      onChange={(e) => setNewQuery(e.target.value)}
                      placeholder={newProvider ? `${SCRAPE_PROVIDERS.find(p => p.id === newProvider)?.keyPrefix || ""}...` : "e.g., sk-proj-, AIza..."}
                      className="w-full rounded-2xl border border-border/60 bg-background/60 px-4 py-3 text-sm font-mono outline-none placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setNewEnabled(!newEnabled)}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium transition-all",
                        newEnabled
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "border-border/70 bg-background/80 text-muted-foreground"
                      )}
                    >
                      {newEnabled ? (
                        <ToggleRight className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <ToggleLeft className="h-4 w-4" />
                      )}
                      {newEnabled ? "Enabled" : "Disabled"}
                    </button>
                    <span className="text-xs text-muted-foreground">
                      {newEnabled
                        ? "Query will be active immediately"
                        : "Query will be saved but inactive"}
                    </span>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <motion.button
                      onClick={handleCreateQuery}
                      disabled={isCreating}
                      className={cn(
                        "flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold shadow-lg transition-all",
                        isCreating
                          ? "bg-muted text-muted-foreground"
                          : "bg-primary text-primary-foreground shadow-primary/20 hover:opacity-90"
                      )}
                      whileHover={isCreating ? {} : { y: -1 }}
                      whileTap={isCreating ? {} : { scale: 0.98 }}
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" />
                          Create query
                        </>
                      )}
                    </motion.button>
                    <motion.button
                      onClick={() => setShowCreateForm(false)}
                      className="flex items-center gap-2 rounded-2xl border border-border/70 bg-background/80 px-6 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
                      whileTap={{ scale: 0.98 }}
                    >
                      Cancel
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        <section className="rounded-[32px] border border-border/70 bg-card/75 p-4 shadow-2xl shadow-black/5 backdrop-blur-2xl md:p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-primary/80">
                Active queries
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
                Search targets
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {queries.length} query{queries.length !== 1 ? "ies" : "y"} configured
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="h-24 animate-pulse rounded-[24px] border border-border/60 bg-background/80"
                />
              ))}
            </div>
          ) : queries.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">No queries yet</h3>
              <p className="mb-4 max-w-xs text-sm text-muted-foreground">
                Create your first search query to start discovering API keys across providers.
              </p>
              <motion.button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <Plus className="h-4 w-4" />
                Create query
              </motion.button>
            </motion.div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {queries.map((query, index) => {
                  const providerStyle = getProviderStyle(query.provider);
                  return (
                    <motion.div
                      key={query._id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20, height: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={cn(
                        "group relative flex items-center gap-4 rounded-[24px] border p-4 transition-all md:p-5",
                        query.enabled
                          ? "border-border/70 bg-card/60 hover:bg-card/80"
                          : "border-border/40 bg-card/30 opacity-60"
                      )}
                    >
                      <div className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br shadow-sm",
                        providerStyle.color.split(" ")[0]
                      )}>
                        <Key className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                            providerStyle.color
                          )}>
                            {query.provider}
                          </span>
                          <span className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                            query.enabled
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-muted text-muted-foreground"
                          )}>
                            {query.enabled ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <p className="mt-2 truncate font-mono text-sm font-medium text-foreground">
                          {query.query}
                        </p>
                        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(query.created_at)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {confirmDeleteId === query._id ? (
                          <div className="flex items-center gap-1">
                            <motion.button
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              onClick={() => handleDeleteQuery(query._id)}
                              disabled={deletingId === query._id}
                              className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/20 text-rose-500 transition-colors hover:bg-rose-500/30"
                              whileTap={{ scale: 0.95 }}
                            >
                              {deletingId === query._id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </motion.button>
                            <motion.button
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              onClick={() => setConfirmDeleteId(null)}
                              className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors hover:bg-muted/80"
                              whileTap={{ scale: 0.95 }}
                            >
                              <X className="h-4 w-4" />
                            </motion.button>
                          </div>
                        ) : (
                          <motion.button
                            onClick={() => setConfirmDeleteId(query._id)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground opacity-0 transition-all hover:bg-rose-500/10 hover:text-rose-500 group-hover:opacity-100"
                            whileTap={{ scale: 0.95 }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </section>
      </main>

      <Toaster position="top-center" richColors />
    </div>
  );
}
