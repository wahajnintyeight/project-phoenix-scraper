"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { ApiKey } from "@/lib/api";
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
  default: {
    primary: "bg-zinc-500",
    glow: "shadow-zinc-500/20",
    soft: "bg-zinc-500/10 text-zinc-700 dark:text-zinc-300",
    text: "text-zinc-500",
  },
};

export function KeyCard({ keyData, index }: KeyCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.05, ease: [0.19, 1, 0.22, 1] }}
      >
        <Dialog.Trigger asChild>
          <motion.article
            whileHover={{ y: -4 }}
            className="group relative cursor-pointer overflow-hidden rounded-[24px] border border-white/10 bg-card/40 p-5 shadow-xl backdrop-blur-md transition-all hover:bg-card/60"
          >
            <div className="flex items-start justify-between">
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-xl shadow-lg transition-transform group-hover:scale-110",
                  provider.primary,
                  provider.glow
                )}
              >
                <Key className="h-5 w-5 text-white" />
              </div>
              <span
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                  status.className
                )}
              >
                <StatusIcon className="h-3 w-3" />
                {status.label}
              </span>
            </div>

            <div className="mt-4">
              <h3 className="font-mono text-lg font-bold uppercase tracking-tighter text-foreground">
                {keyData.provider}
              </h3>
              <p className="text-xs text-muted-foreground/80">
                Verified at {formatDate(keyData?.validated_at)}
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
              <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
                <Sparkles className={cn("h-3 w-3", provider.text)} />
                {keyData.error_count} ERRORS
              </div>
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
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
                        <div className="text-sm font-medium text-white mt-1">{formatDate(keyData.created_at)}</div>
                      </div>
                      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                        <ShieldCheck className={cn("h-4 w-4 mb-2", provider.text)} />
                        <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Verified</div>
                        <div className="text-sm font-medium text-white mt-1">
                          {keyData.validated_at ? formatDate(keyData.validated_at) : "Pending"}
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
                            Last checked: {formatDate(keyData.credits.checked_at)}
                          </div>
                        )}
                      </div>
                    )}

                    {keyData.repo_refs && keyData.repo_refs.length > 0 && (
                      <div className="space-y-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                          Source Linkage
                        </span>
                        <div className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                          {keyData.repo_refs.map((ref, i) => (
                            <a
                              key={i}
                              href={ref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.01] px-4 py-3 hover:bg-white/[0.04] transition-all"
                            >
                              <span className="truncate text-xs font-mono text-zinc-400 group-hover:text-zinc-200">{ref}</span>
                              <ExternalLink size={14} className="text-zinc-600 group-hover:text-white shrink-0 ml-2" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
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