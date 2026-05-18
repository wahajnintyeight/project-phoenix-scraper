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
  Menu,
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
  Shield,
  Database,
} from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
    <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#0a0a0a] shadow-xl transition-all hover:border-white/20">
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
    <div className="min-h-screen bg-[#050505] text-slate-200 selection:bg-violet-500/30">
      {/* 2026 Atmospheric Layer */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,#111,transparent)]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
        <div className="absolute inset-0 opacity-[0.03] grayscale bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>

      {/* Glass Header */}
      <nav className="sticky top-0 z-[100] border-b border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 border-r border-white/10 pr-6">
              <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-[0_0_20px_rgba(139,92,246,0.2)]">
                <FlaskConical className="h-5 w-5 text-white" strokeWidth={2.5} />
              </div>
              <div className="hidden flex-col md:flex">
                <span className="text-xs font-black uppercase tracking-[0.3em] text-white">Tester</span>
                <span className="text-[10px] font-mono text-violet-400/80">VALIDATION_PROTOCOL</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden items-center gap-1 md:flex">
              <Link href="/" className="flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-tighter transition-all text-muted-foreground hover:bg-white/5 hover:text-foreground">
                <Search className="h-3.5 w-3.5" /> Scanner
              </Link>
              <Link href="/key-tester" className="flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-tighter transition-all bg-white/5 text-violet-400">
                <FlaskConical className="h-3.5 w-3.5" /> Tester
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mobile Nav */}
            <div className="flex items-center gap-1 md:hidden mr-2">
               <Link href="/" className="p-2 text-muted-foreground"><Search className="h-4 w-4" /></Link>
               <Link href="/key-tester" className="p-2 text-violet-400"><FlaskConical className="h-4 w-4" /></Link>
            </div>

            <ThemeToggle />
            {hasResults && (
              <button
                onClick={handleReset}
                className="p-2 rounded-lg hover:bg-white/5 transition-colors text-slate-400 hover:text-white"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="relative z-10 mx-auto max-w-4xl px-6 py-12">
        {/* Typographic Hero */}
        <section className="mb-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center text-center gap-4"
          >
            <div className="flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-violet-400">
              <Shield className="h-3.5 w-3.5" />
              Session-only validation
            </div>
            <h1 className="max-w-3xl font-sans text-5xl font-bold tracking-[-0.04em] md:text-7xl">
              Key <span className="text-muted-foreground/40 italic font-medium">validation.</span>
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
              Non-custodial API key verification and browser-level curl replay. Test credentials across major AI providers with zero persistence.
            </p>
          </motion.div>
        </section>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "key" | "curl")} className="space-y-8">
          <div className="flex justify-center">
            <TabsList className="inline-flex h-12 items-center rounded-full border border-white/10 bg-[#0a0a0a] p-1 shadow-lg">
              <TabsTrigger value="key" className="rounded-full px-8 py-2 text-xs font-bold uppercase tracking-widest data-[state=active]:bg-violet-500 data-[state=active]:text-white">
                Direct Validation
              </TabsTrigger>
              <TabsTrigger value="curl" className="rounded-full px-8 py-2 text-xs font-bold uppercase tracking-widest data-[state=active]:bg-violet-500 data-[state=active]:text-white">
                Curl Replay
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="key" className="space-y-6">
            <div className="grid gap-4">
              {/* Input Bento Row */}
              <div className="grid gap-4 md:grid-cols-2">
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="rounded-[2rem] border border-white/10 bg-[#0a0a0a] p-8 shadow-xl"
                  >
                  <p className="font-mono text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Credential_Input</p>
                  <div className="relative mt-6">
                    <Key className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/40" />
                    <input
                      type={showKey ? "text" : "password"}
                      value={keyValue}
                      onChange={(e) => setKeyValue(e.target.value)}
                      placeholder="sk-..."
                      className="w-full bg-transparent border-b border-white/10 pb-2 pl-8 pr-12 font-mono text-sm outline-none transition-all focus:border-violet-500/50 placeholder:text-muted-foreground/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey((v) => !v)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground"
                    >
                      {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </motion.div>

                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="rounded-[2rem] border border-white/10 bg-[#0a0a0a] p-8 shadow-xl"
                  >
                  <p className="font-mono text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Target_System</p>
                  <div className="mt-4">
                    <ProviderSelector selected={selectedProvider} onChange={setSelectedProvider} />
                  </div>
                </motion.div>
              </div>

              {/* Overrides Bento */}
              <AnimatePresence>
                {selectedProvider && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
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

              {/* Execution */}
              <motion.button
                onClick={handleTest}
                disabled={!canTest}
                className={cn(
                  "group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-full py-5 text-xs font-black uppercase tracking-[0.2em] transition-all",
                  canTest
                    ? "bg-violet-500 text-white shadow-[0_12px_48px_rgba(139,92,246,0.25)] hover:shadow-[0_12px_64px_rgba(139,92,246,0.35)] hover:-translate-y-0.5"
                    : "cursor-not-allowed bg-white/5 text-muted-foreground/40"
                )}
              >
                {isTesting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Executing_Test
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 transition-transform group-hover:scale-110" />
                    Initialize Validation
                  </>
                )}
              </motion.button>

              {/* Results Stream */}
              <AnimatePresence>
                {hasResults && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4 pt-4"
                  >
                    <div className="flex items-center justify-between px-2">
                      <p className="font-mono text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">Verification_Output</p>
                      <span className="font-mono text-[10px] text-muted-foreground/20 uppercase tracking-tighter">
                        {results.filter((r) => r.status === "done").length}/{results.length} COMPLETE
                      </span>
                    </div>
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

      <footer className="py-12 text-center">
        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.4em] text-muted-foreground/30">
          Phoenix · Tester Console v2.0.26
        </p>
      </footer>

      <Toaster position="bottom-right" theme="dark" richColors />
    </div>
  );

}
