"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { ApiKey, fetchDeepSeekBalance, fetchKeyRepos, type DeepSeekBalance, type Reference } from "@/lib/api";
import { cn } from "@/lib/utils";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Copy,
  Check,
  Key,
  Clock,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Loader2,
  XCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  CalendarClock,
  Sparkles,
  X,
  Fingerprint,
  Wallet,
} from "lucide-react";

interface KeyCardProps {
  keyData: ApiKey;
  index: number;
}

const statusConfig = {
  Valid: {
    icon: CheckCircle2,
    label: "Verified",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  ValidNoCredits: {
    icon: AlertCircle,
    label: "No Credits",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  Invalid: {
    icon: XCircle,
    label: "Invalid",
    className: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  },
  Pending: {
    icon: Loader2,
    label: "Pending",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  Error: {
    icon: AlertCircle,
    label: "Error",
    className: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  },
};

const providerConfig: Record<
  string,
  { primary: string; glow: string; soft: string; text: string }
> = {
  openai: {
    primary: "bg-emerald-500",
    glow: "shadow-emerald-500/20",
    soft: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    text: "text-emerald-500",
  },
  anthropic: {
    primary: "bg-orange-500",
    glow: "shadow-orange-500/20",
    soft: "bg-orange-500/10 text-orange-700 dark:text-orange-300",
    text: "text-orange-500",
  },
  google: {
    primary: "bg-blue-500",
    glow: "shadow-blue-500/20",
    soft: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
    text: "text-blue-500",
  },
  openrouter: {
    primary: "bg-violet-600",
    glow: "shadow-violet-600/20",
    soft: "bg-violet-600/10 text-violet-700 dark:text-violet-300",
    text: "text-violet-600",
  },
  moonshot: {
    primary: "bg-purple-600",
    glow: "shadow-purple-600/20",
    soft: "bg-purple-600/10 text-purple-700 dark:text-purple-300",
    text: "text-purple-600",
  },
  deepseek: {
    primary: "bg-blue-600",
    glow: "shadow-blue-600/20",
    soft: "bg-blue-600/10 text-blue-700 dark:text-blue-300",
    text: "text-blue-600",
  },
  github: {
    primary: "bg-slate-700",
    glow: "shadow-slate-700/20",
    soft: "bg-slate-700/10 text-slate-700 dark:text-slate-300",
    text: "text-slate-700",
  },
  stripe: {
    primary: "bg-indigo-500",
    glow: "shadow-indigo-500/20",
    soft: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
    text: "text-indigo-500",
  },
  "z.ai": {
    primary: "bg-cyan-500",
    glow: "shadow-cyan-500/20",
    soft: "bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
    text: "text-cyan-500",
  },
  default: {
    primary: "bg-zinc-500",
    glow: "shadow-zinc-500/20",
    soft: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300",
    text: "text-zinc-500",
  },
};

function extractReferenceUrl(value?: string) {
  if (!value) return undefined;

  const markdownMatch = value.match(/^\[[^\]]*\]\((https?:\/\/[^)]+)\)$/);
  return markdownMatch?.[1] ?? value;
}

function getReferenceName(ref: Reference, url?: string) {
  if (ref.repo_name) return ref.repo_name;
  if (!url) return "Source file";

  try {
    const parts = new URL(url).pathname.split("/").filter(Boolean);
    return parts[1] || parts.at(-1) || "Source file";
  } catch {
    return "Source file";
  }
}

export function KeyCard({ keyData, index }: KeyCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [deepSeekBalance, setDeepSeekBalance] = useState<DeepSeekBalance | null>(null);
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const [repos, setRepos] = useState<Reference[] | null>(null);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [reposError, setReposError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const status = statusConfig[keyData.status] || statusConfig.Error;
  const StatusIcon = status.icon;
  const provider =
    providerConfig[keyData.provider.toLowerCase()] || providerConfig.default;

  const handleCopy = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await navigator.clipboard.writeText(keyData.key_value);
      setIsCopied(true);
      toast.success("Key Sequence Copied", {
        icon: <Fingerprint className="h-4 w-4" />,
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error("Access Denied", {
        description: "System clipboard interaction failed.",
      });
    }
  };

  const checkDeepSeekBalance = async () => {
    setIsCheckingBalance(true);
    try {
      const balance = await fetchDeepSeekBalance(keyData.key_value);
      setDeepSeekBalance(balance);
      toast.success("Balance fetched", {
        description: `$${balance.balance_infos[0]?.total_balance ?? "0.00"} available`,
      });
    } catch (err) {
      toast.error("Balance check failed", {
        description: err instanceof Error ? err.message : "Request failed",
      });
    } finally {
      setIsCheckingBalance(false);
    }
  };

  const fetchRepos = async () => {
    if (!keyData.id) return;
    setIsLoadingRepos(true);
    setReposError(null);
    try {
      const res = await fetchKeyRepos(keyData.id);
      if (res.code === 1009) {
        setRepos(res.result.references);
        if (res.result.references.length === 0) {
          toast.info("No source repositories found for this key");
        }
      } else {
        throw new Error(res.message || "Failed to fetch repos");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Request failed";
      setReposError(msg);
      toast.error("Repo fetch failed", { description: msg });
    } finally {
      setIsLoadingRepos(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04 }}
      >
        <Dialog.Trigger asChild>
          <motion.article
            whileHover={{ y: -2 }}
            className="group relative cursor-pointer overflow-hidden rounded-[32px] border border-white/5 bg-white/[0.01] p-6 shadow-sm transition-all hover:bg-white/[0.03] hover:border-white/10"
          >
            {/* Ink Status Accent */}
            <div className={cn(
              "absolute left-0 top-0 h-1 w-full bg-gradient-to-r transition-opacity group-hover:opacity-100 opacity-30",
              keyData.status === "Valid" ? "from-emerald-500/80 to-transparent" : "from-rose-500/80 to-transparent"
            )} />

            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 group-hover:text-primary transition-colors">
                  {keyData.provider}
                </p>
                <h3 className="mt-2 font-sans text-lg font-bold tracking-tight text-foreground">
                  {keyData.provider.charAt(0).toUpperCase() + keyData.provider.slice(1)}
                </h3>
              </div>
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border border-white/5 bg-white/5",
                provider.text
              )}>
                <Key className="h-3.5 w-3.5" />
              </div>
            </div>

            <div className="mt-8 flex items-end justify-between">
              <div className="space-y-1">
                <p className="font-mono text-[10px] font-bold text-muted-foreground/60">VALIDATED_AT</p>
                <p className="font-mono text-[10px] text-muted-foreground/40 tabular-nums uppercase">
                  {isMounted ? formatDate(keyData?.validated_at) : "---"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "rounded-full border px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest",
                  status.className
                )}>
                  {status.label}
                </span>
              </div>
            </div>
          </motion.article>
        </Dialog.Trigger>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xl"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="fixed left-[50%] top-[50%] z-50 w-full max-w-lg translate-x-[-50%] translate-y-[-50%] p-4 focus:outline-none"
              >
                <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-zinc-950 p-8 shadow-2xl">
                  {/* Backdrop Pattern */}
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                    style={{ backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`, backgroundSize: '24px 24px' }} 
                  />

                  <div className="relative flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className={cn("p-3 rounded-2xl", provider.soft)}>
                        <Key className="h-6 w-6" />
                      </div>
                      <div>
                        <Dialog.Title className="text-2xl font-black uppercase tracking-tight text-white">
                          {keyData.provider}
                        </Dialog.Title>
                        <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                          Security Identifier Snapshot
                        </p>
                      </div>
                    </div>
                    <Dialog.Close className="rounded-full p-2 text-zinc-500 hover:bg-white/5 transition-colors">
                      <X className="h-5 w-5" />
                    </Dialog.Close>
                  </div>

                  <div className="space-y-6">
                    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                          Raw Key Value
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setIsRevealed(!isRevealed)}
                            className="p-1.5 text-zinc-400 hover:text-white transition-colors"
                          >
                            {isRevealed ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                          <button
                            onClick={() => handleCopy()}
                            className={cn(
                              "p-1.5 rounded-md transition-all",
                              isCopied ? "text-emerald-400" : "text-zinc-400 hover:text-white"
                            )}
                          >
                            {isCopied ? <Check size={16} /> : <Copy size={16} />}
                          </button>
                        </div>
                      </div>
                      <div className="font-mono text-sm break-all leading-relaxed text-zinc-300 bg-black/40 p-4 rounded-xl border border-white/5">
                        {isRevealed ? keyData.key_value : "••••••••••••••••••••••••••••••••"}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                        <CalendarClock className="h-4 w-4 text-zinc-500 mb-2" />
                        <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Detected</div>
                        <div className="text-sm font-medium text-white mt-1">
                          {isMounted ? formatDate(keyData.created_at) : "---"}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                        <ShieldCheck className={cn("h-4 w-4 mb-2", provider.text)} />
                        <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Verified</div>
                        <div className="text-sm font-medium text-white mt-1">
                          {keyData.validated_at && isMounted ? formatDate(keyData.validated_at) : "Pending"}
                        </div>
                      </div>
                    </div>

                    {keyData.credits && keyData.provider.toLowerCase() === "openrouter" && (
                      <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="h-4 w-4 text-violet-400" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400">
                            Credit Balance
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-zinc-500 mb-1">Available</div>
                            <div className="text-2xl font-bold text-white">
                              ${keyData.credits.total_credits?.toFixed(2) ?? "0.00"}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-zinc-500 mb-1">Used</div>
                            <div className="text-2xl font-bold text-zinc-400">
                              ${keyData.credits.total_usage?.toFixed(2) ?? "0.00"}
                            </div>
                          </div>
                        </div>
                        {keyData.credits.checked_at && (
                          <div className="mt-3 pt-3 border-t border-white/5 text-[10px] text-zinc-500">
                            Last checked: {isMounted ? formatDate(keyData.credits.checked_at) : "---"}
                          </div>
                        )}
                      </div>
                    )}

                    {keyData.provider.toLowerCase() === "deepseek" && (
                      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5">
                        {deepSeekBalance ? (
                          <>
                            <div className="flex items-center gap-2 mb-3">
                              <Wallet className="h-4 w-4 text-blue-400" />
                              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">
                                Account Balance
                              </span>
                            </div>
                            {deepSeekBalance.balance_infos.map((info, i) => (
                              <div key={i} className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-zinc-500">Currency</span>
                                  <span className="text-sm font-medium text-white">{info.currency}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-zinc-500">Total Balance</span>
                                  <span className="text-2xl font-bold text-white">${info.total_balance}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-zinc-500">Topped Up</span>
                                  <span className="text-sm font-medium text-zinc-300">${info.topped_up_balance}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-zinc-500">Granted</span>
                                  <span className="text-sm font-medium text-zinc-300">${info.granted_balance}</span>
                                </div>
                              </div>
                            ))}
                          </>
                        ) : (
                          <div className="flex flex-col items-center gap-3 py-2">
                            <Wallet className="h-5 w-5 text-blue-400" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">
                              Balance Check
                            </span>
                            <p className="text-xs text-zinc-400 text-center">
                              Check the remaining credit balance on this DeepSeek account.
                            </p>
                            <motion.button
                              onClick={checkDeepSeekBalance}
                              disabled={isCheckingBalance}
                              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-500 disabled:opacity-50"
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                            >
                              {isCheckingBalance ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Wallet className="h-3.5 w-3.5" />
                              )}
                              {isCheckingBalance ? "Checking..." : "Check Balance"}
                            </motion.button>
                          </div>
                        )}
                      </div>
                    )}

                    {repos === null ? (
                      <motion.button
                        onClick={fetchRepos}
                        disabled={isLoadingRepos}
                        className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-zinc-400 transition-all hover:bg-white/[0.04] hover:text-white disabled:opacity-50"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                      >
                        {isLoadingRepos ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ExternalLink className="h-4 w-4" />
                        )}
                        <span className="text-xs font-bold uppercase tracking-widest">
                          {isLoadingRepos ? "Fetching Sources..." : "Reveal Repo Sources"}
                        </span>
                      </motion.button>
                    ) : repos.length > 0 ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                            Source Linkage ({repos.length})
                          </span>
                          <button
                            onClick={() => setRepos(null)}
                            className="text-[10px] text-zinc-600 hover:text-zinc-400 uppercase tracking-wider"
                          >
                            Collapse
                          </button>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                          {repos.map((ref) => (
                            <a
                              key={ref.id}
                              href={extractReferenceUrl(ref.file_url) || extractReferenceUrl(ref.repo_url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group flex flex-col gap-1 rounded-xl border border-white/5 bg-white/[0.01] px-4 py-3 hover:bg-white/[0.04] transition-all"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-medium text-zinc-300 truncate group-hover:text-white">
                                  {getReferenceName(
                                    ref,
                                    extractReferenceUrl(ref.file_url) || extractReferenceUrl(ref.repo_url)
                                  )}
                                </span>
                                <ExternalLink size={14} className="text-zinc-600 group-hover:text-white shrink-0" />
                              </div>
                              <span className="text-[10px] font-mono text-zinc-600 truncate">
                                {ref.file_path || extractReferenceUrl(ref.file_url) || extractReferenceUrl(ref.repo_url) || "Source reference"}
                              </span>
                            </a>
                          ))}
                        </div>
                      </div>
                    ) : reposError ? (
                      <div className="rounded-2xl border border-rose-500/10 bg-rose-500/5 p-4 text-center">
                        <p className="text-xs text-rose-400">{reposError}</p>
                        <button
                          onClick={fetchRepos}
                          className="mt-2 text-[10px] text-zinc-500 hover:text-white uppercase tracking-wider"
                        >
                          Retry
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
