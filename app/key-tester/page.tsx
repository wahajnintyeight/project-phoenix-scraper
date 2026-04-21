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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CurlPlayground } from "@/components/key-tester/curl-playground";

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
  const isOpenRouter = selectedProvider?.toLowerCase() === "openrouter";

  const selectedModel =
    isOpenRouter
      ? openRouterModels?.find((model) => model.id === effectiveValue)
      : undefined;

  if (!provider?.supportsModel) return null;

  const filteredOpenRouterModels = (openRouterModels || []).filter((model) => {
    const haystack = [model.id, model.name, model.description]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  return (
    <div className="overflow-hidden rounded-[24px] border border-white/10 bg-card/40 shadow-xl backdrop-blur-md transition-all hover:bg-card/60">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between border-b border-white/5 bg-white/5 px-4 py-3 text-left transition-all hover:bg-white/10"
      >
        <span className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          <Key className={cn("h-3.5 w-3.5", isOpenRouter ? "text-fuchsia-400" : "text-primary")} />
          Custom model overrides (optional)
        </span>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
            className="overflow-hidden"
          >
            <div className="grid gap-4 border-t border-white/5 px-4 pb-4 pt-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                  {providerLabel} model
                </label>
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 transition-all focus-within:border-primary/50">
                  <input
                    type="text"
                    placeholder={providerDefaultModel}
                    value={currentValue}
                    onChange={(e) => onChange(provider.id, e.target.value)}
                    className="min-w-0 flex-1 bg-transparent font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground/30"
                  />
                  <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/40">
                    ID
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                  Quick picker
                </label>
                <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                  <PopoverTrigger asChild>
                    <button className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-left transition-all hover:bg-white/10 hover:border-white/20">
                      <div className="min-w-0">
                        <div className="truncate font-mono text-sm font-bold uppercase tracking-tight text-foreground">
                          {selectedModel?.name || effectiveValue || `Pick ${providerLabel} Model`}
                        </div>
                        <div className="mt-0.5 truncate font-mono text-[10px] uppercase text-muted-foreground/60">
                          {selectedModel?.name ? effectiveValue : (providerDefaultModel || "No model selected")}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-[min(92vw,42rem)] overflow-hidden rounded-[24px] border border-white/10 p-0 bg-card/95 shadow-2xl backdrop-blur-xl">
                    <Command className="rounded-none bg-transparent">
                      <div className="flex items-center border-b border-white/10 bg-white/5 px-3">
                        <Search className="h-4 w-4 shrink-0 text-muted-foreground opacity-50" />
                        <CommandInput 
                          placeholder="Search models..." 
                          value={query} 
                          onValueChange={setQuery}
                          className="font-mono text-xs uppercase tracking-tight text-foreground"
                        />
                      </div>
                      <CommandList className="max-h-80 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                        <CommandEmpty className="py-10 text-center font-mono text-xs uppercase text-muted-foreground/40">
                          {openRouterModelsLoading
                            ? "Fetching models..."
                            : openRouterModelsError || "No results found"}
                        </CommandEmpty>
                        <CommandGroup heading={<span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40 px-2">Available Models</span>}>
                          {openRouterModelsLoading ? (
                            <div className="flex flex-col items-center justify-center gap-3 px-4 py-12 text-sm">
                              <Loader2 className="h-8 w-8 animate-spin text-primary" />
                              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60">Loading Registry...</span>
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
                                className="flex cursor-pointer items-start gap-4 border-b border-white/5 px-4 py-4 transition-all hover:bg-white/5 aria-selected:bg-white/5"
                              >
                                <div className={cn(
                                  "mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 transition-all",
                                  effectiveValue === model.id ? "border-primary/50 bg-primary/20 shadow-[0_0_15px_rgba(var(--primary),0.2)]" : "shadow-none"
                                )}>
                                  <Check
                                    className={cn(
                                      "h-3.5 w-3.5 text-primary transition-all",
                                      effectiveValue === model.id ? "scale-100 opacity-100" : "scale-0 opacity-0"
                                    )}
                                  />
                                </div>
                                <div className="min-w-0 flex-1 space-y-1.5">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="truncate font-mono text-sm font-bold uppercase tracking-tight text-foreground">
                                      {model.name || model.id}
                                    </span>
                                    <div className="flex gap-1.5 shrink-0">
                                      {model.pricing?.prompt === "0" && (
                                        <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-tighter text-emerald-400">
                                          FREE
                                        </span>
                                      )}
                                      <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-tighter text-muted-foreground">
                                        {model.architecture?.modality?.split(">")?.[0] || 'TEXT'}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="truncate font-mono text-[10px] text-muted-foreground/40 uppercase tracking-tight">
                                    {model.id}
                                  </div>
                                  {model.description && (
                                    <div className="line-clamp-2 font-mono text-[10px] leading-relaxed text-muted-foreground/60 uppercase">
                                      {model.description}
                                    </div>
                                  )}
                                </div>
                              </CommandItem>
                            ))
                          ) : null}
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
  const [activeTab, setActiveTab] = useState<"key" | "curl">("key");

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
    setOpenRouterModels([]);
    setOpenRouterModelsError(null);
    setOpenRouterModelsLoading(false);
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
            Switch between direct key validation and a restricted browser curl replay for supported AI providers.
          </p>
        </motion.div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "key" | "curl")} className="space-y-5">
          <TabsList className="grid h-auto w-full grid-cols-2 rounded-2xl border border-border/70 bg-card/70 p-1 shadow-sm backdrop-blur-xl">
            <TabsTrigger value="key" className="rounded-xl py-2.5 text-sm font-medium">
              Key tester
            </TabsTrigger>
            <TabsTrigger value="curl" className="rounded-xl py-2.5 text-sm font-medium">
              Curl replay
            </TabsTrigger>
          </TabsList>

          <TabsContent value="key" className="space-y-4">
            <div className="space-y-4">
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
          </TabsContent>

          <TabsContent value="curl">
            <CurlPlayground />
          </TabsContent>
        </Tabs>
      </main>

      <Toaster position="top-center" richColors />
    </div>
  );
}
