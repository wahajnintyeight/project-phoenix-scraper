"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "sonner";
import { createSession, getSessionId, validateKey } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Flame,
  FlaskConical,
  Key,
  Play,
  RotateCcw,
  ArrowLeft,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  PROVIDERS,
  ProviderId,
  ProviderSelector,
} from "@/components/key-tester/provider-selector";
import {
  TestResultCard,
  TestEntry,
} from "@/components/key-tester/test-result-card";

// ---------------------------------------------------------------------------
// Model override section – per-provider optional model input
// ---------------------------------------------------------------------------

interface ModelOverridesProps {
  selectedProvider: ProviderId | null;
  overrides: Record<string, string>;
  onChange: (providerId: string, model: string) => void;
}

function ModelOverrides({ selectedProvider, overrides, onChange }: ModelOverridesProps) {
  const [open, setOpen] = useState(false);
  const provider = selectedProvider
    ? PROVIDERS.find((p) => p.id === selectedProvider)
    : undefined;

  if (!provider?.supportsModel) return null;

  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="flex items-center gap-2">
          <Key className="h-3.5 w-3.5" />
          Custom model overrides (optional)
        </span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="grid gap-3 border-t border-border/50 px-4 pb-4 pt-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs text-muted-foreground">
                    {provider.label} model
                  </label>
                  <input
                    type="text"
                    placeholder={provider.defaultModel}
                    value={overrides[provider.id] ?? ""}
                    onChange={(e) => onChange(provider.id, e.target.value)}
                    className="w-full rounded-xl border border-border/60 bg-background/60 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                  />
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function KeyTesterPage() {
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  const [keyValue, setKeyValue] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ProviderId | null>(null);
  const [modelOverrides, setModelOverrides] = useState<Record<string, string>>({});
  const [isTesting, setIsTesting] = useState(false);
  const [results, setResults] = useState<TestEntry[]>([]);

  // Session bootstrap – identical pattern to main page
  useEffect(() => {
    async function init() {
      try {
        if (!getSessionId()) {
          await createSession();
          toast.success("Connected", {
            description: "Phoenix API ready",
            icon: <Flame className="h-4 w-4" />,
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

  const handleModelOverride = useCallback((providerId: string, model: string) => {
    setModelOverrides((prev) => ({ ...prev, [providerId]: model }));
  }, []);

  const handleTest = async () => {
    if (!keyValue.trim()) {
      toast.error("Enter an API key first");
      return;
    }
    if (!selectedProvider) {
      toast.error("Select a provider");
      return;
    }

    setIsTesting(true);

    const providerModel = modelOverrides[selectedProvider] ?? PROVIDERS.find((p) => p.id === selectedProvider)?.defaultModel ?? "";

    // Initialise loading entry
    const initialEntries: TestEntry[] = [{
      provider: selectedProvider,
      model: providerModel,
      status: "loading",
    }];
    setResults(initialEntries);

    toast.info(`Testing key against ${selectedProvider}…`, {
      icon: <FlaskConical className="h-4 w-4" />,
    });

    try {
      const res = await validateKey(
        keyValue.trim(),
        selectedProvider,
        modelOverrides[selectedProvider] || undefined
      );
      setResults([{ provider: selectedProvider, model: providerModel, status: "done", result: res.result }]);
    } catch {
      setResults([
        {
          provider: selectedProvider,
          model: providerModel,
          status: "done",
          result: { provider: selectedProvider, status: "Error", error: "Request failed" },
        },
      ]);
    }

    setIsTesting(false);
    toast.success("Tests complete");
  };

  const handleReset = () => {
    setResults([]);
    setKeyValue("");
    setSelectedProvider(null);
    setModelOverrides({});
  };

  // ---------------------------------------------------------------------------
  // Loading / error states
  // ---------------------------------------------------------------------------

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
            <p className="mt-2 text-sm text-muted-foreground">Establishing a secure session…</p>
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

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  const hasResults = results.length > 0;
  const canTest = keyValue.trim() !== "" && selectedProvider !== null && !isTesting;

  return (
    <div className="relative min-h-screen bg-background">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.18),transparent_35%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.18),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.06),transparent_70%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.22),transparent_35%),radial-gradient(circle_at_top_right,rgba(56,189,248,0.16),transparent_28%),linear-gradient(180deg,rgba(10,14,18,0.35),transparent_70%)]" />
        <div className="absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-50 border-b border-border/60 bg-background/75 backdrop-blur-2xl"
      >
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 bg-card/80 text-muted-foreground shadow-sm transition-colors hover:bg-muted/80 hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-sm">
                <FlaskConical className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-sm font-semibold tracking-tight md:text-base">Key Tester</h1>
                <p className="text-xs text-muted-foreground">Validate API keys without storing</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasResults && (
              <motion.button
                onClick={handleReset}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-border/70 bg-card/80 px-3 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:bg-muted/80 hover:text-foreground"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </motion.button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </motion.header>

      <main className="mx-auto max-w-3xl px-4 py-8 md:px-6 md:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">
            <FlaskConical className="h-3.5 w-3.5 text-violet-500" />
            No data stored — session only
          </span>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
            Test your API keys
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Input a key, choose a provider, optionally override the model, and validate connectivity in
            real time.
          </p>
        </motion.div>

        <div className="space-y-4">
          {/* Key input */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-[28px] border border-border/70 bg-card/80 p-5 shadow-lg shadow-black/5 backdrop-blur-2xl"
          >
            <label className="mb-2 block text-xs font-medium text-muted-foreground">
              API Key
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showKey ? "text" : "password"}
                value={keyValue}
                onChange={(e) => setKeyValue(e.target.value)}
                placeholder="sk-… or any API key"
                onKeyDown={(e) => { if (e.key === "Enter") e.stopPropagation(); }}
                className="w-full rounded-2xl border border-border/60 bg-background/60 py-3 pl-10 pr-12 text-sm outline-none placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </motion.div>

          {/* Provider selector */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-[28px] border border-border/70 bg-card/80 p-5 shadow-lg shadow-black/5 backdrop-blur-2xl"
          >
            <label className="mb-3 block text-xs font-medium text-muted-foreground">
              Provider
            </label>
            <ProviderSelector selected={selectedProvider} onChange={setSelectedProvider} />
          </motion.div>

          {/* Model overrides (collapsible) */}
          <AnimatePresence>
            {selectedProvider && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <ModelOverrides
                  selectedProvider={selectedProvider}
                  overrides={modelOverrides}
                  onChange={handleModelOverride}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Test button */}
          <motion.button
            onClick={handleTest}
            disabled={!canTest}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold shadow-lg transition-all",
              canTest
                ? "bg-primary text-primary-foreground shadow-primary/20 hover:opacity-90"
                : "cursor-not-allowed bg-muted text-muted-foreground shadow-none"
            )}
            whileHover={canTest ? { y: -1 } : {}}
            whileTap={canTest ? { scale: 0.98 } : {}}
          >
            {isTesting ? (
              <>
                <FlaskConical className="h-4 w-4 animate-pulse" />
                Running tests…
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Run test
              </>
            )}
          </motion.button>

          {/* Results */}
          <AnimatePresence>
            {hasResults && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-3 pt-2"
              >
                <p className="text-xs font-medium text-muted-foreground">
                  Results ({results.filter((r) => r.status === "done").length}/{results.length})
                </p>
                {results.map((entry, i) => (
                  <TestResultCard key={`${entry.provider}-${i}`} entry={entry} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <Toaster position="top-center" richColors />
    </div>
  );
}
