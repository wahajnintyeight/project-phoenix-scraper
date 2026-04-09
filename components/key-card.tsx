"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { ApiKey } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Copy,
  Check,
  ChevronDown,
  Key,
  Clock,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Loader2,
  XCircle,
  Shield,
  Zap,
} from "lucide-react";

interface KeyCardProps {
  keyData: ApiKey;
  index: number;
}

const statusConfig = {
  Valid: {
    icon: CheckCircle2,
    label: "Sys_Valid",
    className: "bg-valid/10 text-valid border-valid",
    accentColor: "border-l-valid",
  },
  Invalid: {
    icon: XCircle,
    label: "Sys_Invalid",
    className: "bg-invalid/10 text-invalid border-invalid",
    accentColor: "border-l-invalid",
  },
  Pending: {
    icon: Loader2,
    label: "Wait_Queue",
    className: "bg-pending/10 text-pending border-pending",
    accentColor: "border-l-pending",
  },
  Error: {
    icon: AlertCircle,
    label: "Scan_Error",
    className: "bg-error/10 text-error border-error",
    accentColor: "border-l-error",
  },
};

const providerConfig: Record<string, { bg: string; icon: string; accent: string }> = {
  openai: { bg: "bg-emerald-500/10", icon: "text-emerald-600 dark:text-emerald-400", accent: "border-l-emerald-500" },
  anthropic: { bg: "bg-orange-500/10", icon: "text-orange-600 dark:text-orange-400", accent: "border-l-orange-500" },
  google: { bg: "bg-blue-500/10", icon: "text-blue-600 dark:text-blue-400", accent: "border-l-blue-500" },
  openrouter: { bg: "bg-fuchsia-500/10", icon: "text-fuchsia-600 dark:text-fuchsia-400", accent: "border-l-fuchsia-500" },
  github: { bg: "bg-slate-500/10", icon: "text-slate-700 dark:text-slate-300", accent: "border-l-slate-500" },
  stripe: { bg: "bg-violet-500/10", icon: "text-violet-600 dark:text-violet-400", accent: "border-l-violet-500" },
  aws: { bg: "bg-amber-500/10", icon: "text-amber-600 dark:text-amber-400", accent: "border-l-amber-500" },
  azure: { bg: "bg-sky-500/10", icon: "text-sky-600 dark:text-sky-400", accent: "border-l-sky-500" },
  default: { bg: "bg-primary/10", icon: "text-primary", accent: "border-l-primary" },
};

export function KeyCard({ keyData, index }: KeyCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

  const status = statusConfig[keyData.status] || statusConfig.Error;
  const StatusIcon = status.icon;
  const provider = providerConfig[keyData.provider.toLowerCase()] || providerConfig.default;

  const maskedKey = keyData.key_value.slice(0, 8) + "..." + keyData.key_value.slice(-4);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(keyData.key_value);
      setIsCopied(true);
      toast.success("DATA_COPIED", {
        description: `[${keyData.provider}] key transferred to clipboard.`,
        icon: <Copy className="h-4 w-4" />,
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error("COPY_FAILED", {
        description: "Clipboard access denied.",
      });
    }
  };

  const handleReveal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRevealed(!isRevealed);
    if (!isRevealed) {
      toast.info("DATA_DECRYPTED", {
        description: "Key payload is now visible.",
        duration: 2000,
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).toUpperCase();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: index * 0.04, 
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1]
      }}
      layout
      className="w-full"
    >
      <motion.div
        className={cn(
          "group relative flex flex-col border-2 border-border bg-card transition-all duration-300",
          "hover:border-primary hover:shadow-[4px_4px_0_rgba(var(--color-primary),0.2)]",
          isExpanded && "border-primary shadow-[4px_4px_0_rgba(var(--color-primary),0.2)]"
        )}
      >
        {/* Accent Edge */}
        <div className={cn("absolute left-0 top-0 h-full w-1", provider.accent, "border-l-2")} />

        {/* Main Header / collapsed view */}
        <div 
          className="flex flex-col md:flex-row w-full cursor-pointer md:items-center gap-4 p-4 pl-6"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {/* Provider Graphic Header for Mobile */}
          <div className="flex w-full md:w-auto items-center justify-between">
            <div className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center border-2 bg-background transition-all duration-300 group-hover:border-primary",
              )}
            >
              <Key className={cn("h-6 w-6", provider.icon)} />
            </div>

            {/* Mobile Actions: Only display chevron if we don't have enough width */}
            <div className="md:hidden flex items-center gap-2">
              <motion.button
                onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  "flex h-10 w-10 items-center justify-center border-2 transition-all duration-300",
                  "hover:bg-primary hover:text-primary-foreground border-border hover:border-primary active:scale-95"
                )}
              >
                <ChevronDown className="h-5 w-5" />
              </motion.button>
            </div>
          </div>

          {/* Key Title and Snapshot */}
          <div className="min-w-0 flex-1 text-left flex flex-col gap-1 md:gap-0">
            <div className="flex flex-wrap items-center gap-2 md:mb-1">
              <span className="font-mono text-lg font-black uppercase text-foreground tracking-widest">
                {keyData.provider}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 border-2 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest",
                  status.className
                )}
              >
                <StatusIcon className={cn("h-3 w-3", keyData.status === "Pending" && "animate-spin")} />
                {status.label}
              </span>
            </div>
            <p className="truncate font-mono text-sm text-muted-foreground tracking-widest hidden md:block">
              {maskedKey}
            </p>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            <motion.button
              onClick={handleCopy}
              className={cn(
                "flex h-12 w-12 items-center justify-center border-2 transition-all duration-300",
                isCopied 
                  ? "bg-valid text-valid-foreground border-valid" 
                  : "bg-background border-border hover:border-primary hover:bg-primary hover:text-primary-foreground active:scale-95"
              )}
              whileTap={{ scale: 0.9 }}
            >
              <AnimatePresence mode="wait">
                {isCopied ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Check className="h-5 w-5" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="copy"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Copy className="h-5 w-5" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            <motion.button
              onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "flex h-12 w-12 items-center justify-center border-2 transition-all duration-300",
                "bg-background border-border hover:border-primary hover:bg-primary hover:text-primary-foreground active:scale-95"
              )}
            >
              <ChevronDown className="h-5 w-5" />
            </motion.button>
          </div>
        </div>

        {/* Expanded Details Panel */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="border-t-2 border-border bg-card p-4 md:p-6 pl-6">
                
                {/* Embedded Terminal For Key */}
                <div className="mb-6">
                  <label className="mb-3 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-primary">
                    <Zap className="h-3 w-3" />
                    Payload_Data
                  </label>
                  <div className="flex flex-col md:flex-row items-stretch md:items-center gap-0">
                    <div
                      className={cn(
                        "flex flex-1 items-center justify-between border-2 border-border bg-black p-3 md:border-r-0 transition-all duration-300",
                        "hover:border-primary/50"
                      )}
                    >
                      <span className="font-mono text-sm tracking-widest text-primary break-all md:truncate">
                        {isRevealed ? keyData.key_value : "•".repeat(Math.min(keyData.key_value.length, 42))}
                      </span>
                    </div>
                    <div className="flex items-stretch md:w-auto h-12 md:h-auto border-2 border-t-0 md:border-t-2 md:border-l-0 md:border-border mt-0 bg-background">
                      <motion.button
                        onClick={handleReveal}
                        className={cn(
                          "flex flex-1 whitespace-nowrap px-4 py-3 md:py-3.5 font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all duration-300",
                          "hover:bg-primary hover:text-primary-foreground hover:border-primary"
                        )}
                        whileTap={{ scale: 0.95 }}
                      >
                        {isRevealed ? "Obfuscate" : "Decrypt"}
                      </motion.button>
                      <div className="w-0.5 bg-border my-2 hidden md:block"></div>
                      <motion.button
                        onClick={handleCopy}
                        className={cn(
                          "flex flex-1 whitespace-nowrap items-center justify-center border-l-2 md:border-l-0 border-border px-4 py-3 md:py-3.5 font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all duration-300",
                          isCopied ? "bg-valid text-valid-foreground" : "hover:bg-primary hover:text-primary-foreground hover:border-primary"
                        )}
                        whileTap={{ scale: 0.95 }}
                      >
                        {isCopied ? "Transferred" : "Copy"}
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Metadata Console Layout */}
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                  <div className="flex flex-col gap-1 border-l-2 border-primary/30 pl-3">
                    <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3"/> Discovery_Log</span>
                    <span className="font-mono text-sm font-bold tracking-tight">{formatDate(keyData.created_at)}</span>
                  </div>

                  {keyData.validated_at && (
                    <div className="flex flex-col gap-1 border-l-2 border-valid/50 pl-3">
                      <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-valid"/> Verification_Log</span>
                      <span className="font-mono text-sm font-bold tracking-tight">{formatDate(keyData.validated_at)}</span>
                    </div>
                  )}

                  {keyData.error_count > 0 && (
                    <div className="flex flex-col gap-1 border-l-2 border-error pl-3">
                      <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-error flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Error_Count</span>
                      <span className="font-mono text-sm font-bold text-error">
                        [ {keyData.error_count} ] INCIDENTS
                      </span>
                    </div>
                  )}
                  
                  {keyData.repo_refs && keyData.repo_refs.length > 0 && (
                    <div className="flex flex-col gap-1 sm:col-span-full border-l-2 border-accent/50 pl-3 mt-2">
                       <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                          <ExternalLink className="h-3 w-3" /> External_Telemetry
                        </span>
                       <div className="font-mono text-sm font-bold tracking-tight text-accent">
                          {keyData.repo_refs.length} ACTIVE BINDING{keyData.repo_refs.length > 1 ? "S" : ""}
                       </div>
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
