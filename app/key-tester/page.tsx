"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "sonner";
import {
  createSession,
  fetchOpenRouterModels,
  getSessionId,
  validateKey,
  type OpenRouterModel,
} from "@/lib/api";
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
  Search,
  Check,
  Loader2,
  ChevronRight,
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

// ---------------------------------------------------------------------------
// Model override section – per-provider optional model input
// ---------------------------------------------------------------------------

interface ModelOverridesProps {
  selectedProvider: ProviderId | null;
  overrides: Record<string, string>;
  onChange: (providerId: string, model: string) => void;
  openRouterModels: OpenRouterModel[];
  openRouterModelsLoading: boolean;
  openRouterModelsError: string | null;
}

function ModelOverrides({
  selectedProvider,
  overrides,
  onChange,
  openRouterModels,
  openRouterModelsLoading,
  openRouterModelsError,
}: ModelOverridesProps) {
  const [open, setOpen] = useState(false);
  const provider = selectedProvider
    ? PROVIDERS.find((p) => p.id === selectedProvider)
    : undefined;
  const providerLabel = provider?.label ?? "Model";
  const providerDefaultModel = provider?.defaultModel ?? "";
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const currentValue = selectedProvider ? overrides[selectedProvider] ?? "" : "";
  const effectiveValue = currentValue || provider?.defaultModel || "";

  const selectedModel =
    selectedProvider === "OpenRouter"
      ? openRouterModels.find((model) => model.id === effectiveValue)
      : undefined;

  if (!provider?.supportsModel) return null;

  const filteredOpenRouterModels = openRouterModels.filter((model) => {
    const haystack = [model.id, model.name, model.description]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  return (
    <div className="overflow-hidden border-2 border-black bg-white shadow-[4px_4px_0px_0px_#000000]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between border-b-2 border-black bg-[#F0F0E8] px-4 py-3 text-left transition-transform hover:translate-x-[1px] hover:translate-y-[1px]"
      >
        <span className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-black">
          <Key className="h-3.5 w-3.5" />
          Custom model overrides (optional)
        </span>
        {open ? <ChevronUp className="h-4 w-4 text-black" /> : <ChevronDown className="h-4 w-4 text-black" />}
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
            <div className="grid gap-4 border-t-2 border-black px-4 pb-4 pt-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="block font-mono text-xs uppercase tracking-wider text-black">
                  {providerLabel} model
                </label>
                <div className="flex items-center gap-2 border-2 border-black bg-[#F8F8F0] px-3 py-2 shadow-[2px_2px_0px_0px_#000000]">
                  <input
                    type="text"
                    placeholder={providerDefaultModel}
                    value={currentValue}
                    onChange={(e) => onChange(provider.id, e.target.value)}
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-black/40"
                  />
                  <span className="font-mono text-[10px] uppercase tracking-widest text-black/50">
                    type exact id
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block font-mono text-xs uppercase tracking-wider text-black">
                  Quick picker
                </label>
                <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                  <PopoverTrigger asChild>
                    <button className="flex w-full items-center justify-between border-2 border-black bg-white px-3 py-2 text-left shadow-[2px_2px_0px_0px_#000000] transition-transform hover:translate-x-[1px] hover:translate-y-[1px]">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-black">
                          {selectedModel?.name || effectiveValue || `Choose ${providerLabel} model`}
                        </div>
                        <div className="truncate text-xs text-black/60">
                          {selectedModel?.description || providerDefaultModel}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-black" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-[min(92vw,42rem)] border-2 border-black p-0 shadow-[6px_6px_0px_0px_#000000]">
                    <Command className="rounded-none">
                      <CommandInput placeholder="Search models..." value={query} onValueChange={setQuery} />
                      <CommandList className="max-h-80">
                        <CommandEmpty>
                          {openRouterModelsLoading
                            ? "Loading models..."
                            : openRouterModelsError || "No models found"}
                        </CommandEmpty>
                        <CommandGroup heading="OpenRouter models">
                          {openRouterModelsLoading ? (
                            <div className="flex items-center gap-2 px-4 py-6 text-sm text-black/60">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Loading OpenRouter models...
                            </div>
                          ) : filteredOpenRouterModels.length > 0 ? (
                            filteredOpenRouterModels.map((model) => (
                              <CommandItem
                                key={model.id}
                                value={`${model.id} ${model.name ?? ""} ${model.description ?? ""}`}
                                onSelect={() => {
                                  onChange(provider.id, model.id);
                                  setSearchOpen(false);
                                }}
                                className="flex cursor-pointer items-start gap-3 rounded-none px-4 py-3"
                              >
                                <div className="mt-0.5 flex h-5 w-5 items-center justify-center border border-black bg-[#F0F0E8]">
                                  <Check
                                    className={cn(
                                      "h-3.5 w-3.5",
                                      effectiveValue === model.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="truncate font-medium text-black">{model.name || model.id}</span>
                                    {model.pricing?.prompt === "0" && (
                                      <span className="border border-black bg-[#F0F0E8] px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-black">
                                        free
                                      </span>
                                    )}
                                  </div>
                                  <div className="mt-1 truncate text-xs text-black/60">{model.id}</div>
                                  {model.description && (
                                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-black/70">
                                      {model.description}
                                    </p>
                                  )}
                                </div>
                              </CommandItem>
                            ))
                          ) : (
                            <div className="px-4 py-6 text-sm text-black/60">
                              No models match your search.
                            </div>
                          )}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
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
  const [openRouterModels, setOpenRouterModels] = useState<OpenRouterModel[]>([]);
  const [openRouterModelsLoading, setOpenRouterModelsLoading] = useState(false);
  const [openRouterModelsError, setOpenRouterModelsError] = useState<string | null>(null);
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

  useEffect(() => {
    if (selectedProvider !== "OpenRouter") {
      return;
    }

    let cancelled = false;

    async function loadModels() {
      setOpenRouterModelsLoading(true);
      setOpenRouterModelsError(null);

      try {
        const response = await fetchOpenRouterModels(keyValue.trim());
        if (!cancelled) {
          setOpenRouterModels(response.models);
        }
      } catch (error) {
        if (!cancelled) {
          setOpenRouterModels([]);
          setOpenRouterModelsError(error instanceof Error ? error.message : "Failed to load models");
        }
      } finally {
        if (!cancelled) {
          setOpenRouterModelsLoading(false);
        }
      }
    }

    if (keyValue.trim()) {
      loadModels();
    } else {
      setOpenRouterModels([]);
      setOpenRouterModelsError(null);
      setOpenRouterModelsLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [keyValue, selectedProvider]);

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

    const providerModel =
      modelOverrides[selectedProvider] ??
      PROVIDERS.find((p) => p.id === selectedProvider)?.defaultModel ??
      "";

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
      const res = await validateKey(keyValue.trim(), selectedProvider, modelOverrides[selectedProvider] || undefined);
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
                  openRouterModels={openRouterModels}
                  openRouterModelsLoading={openRouterModelsLoading}
                  openRouterModelsError={openRouterModelsError}
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
