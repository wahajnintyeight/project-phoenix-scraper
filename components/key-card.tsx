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
    label: "Valid",
    className: "bg-lime-500/15 text-lime-600 dark:text-lime-400 border-lime-500/30",
    dotClassName: "bg-lime-500",
    accentColor: "border-l-lime-500",
  },
  Invalid: {
    icon: XCircle,
    label: "Invalid",
    className: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
    dotClassName: "bg-red-500",
    accentColor: "border-l-red-500",
  },
  Pending: {
    icon: Loader2,
    label: "Pending",
    className: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
    dotClassName: "bg-yellow-500",
    accentColor: "border-l-yellow-500",
  },
  Error: {
    icon: AlertCircle,
    label: "Error",
    className: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-500/30",
    dotClassName: "bg-orange-500",
    accentColor: "border-l-orange-500",
  },
};

const providerConfig: Record<string, { bg: string; icon: string; accent: string }> = {
  openai: { bg: "bg-lime-500/10", icon: "text-lime-600 dark:text-lime-400", accent: "border-l-lime-500" },
  anthropic: { bg: "bg-yellow-500/10", icon: "text-yellow-600 dark:text-yellow-400", accent: "border-l-yellow-500" },
  google: { bg: "bg-blue-500/10", icon: "text-blue-600 dark:text-blue-400", accent: "border-l-blue-500" },
  openrouter: { bg: "bg-purple-500/10", icon: "text-purple-600 dark:text-purple-400", accent: "border-l-purple-500" },
  github: { bg: "bg-zinc-500/10", icon: "text-zinc-700 dark:text-zinc-300", accent: "border-l-zinc-500" },
  stripe: { bg: "bg-indigo-500/10", icon: "text-indigo-600 dark:text-indigo-400", accent: "border-l-indigo-500" },
  aws: { bg: "bg-amber-500/10", icon: "text-amber-600 dark:text-amber-400", accent: "border-l-amber-500" },
  azure: { bg: "bg-sky-500/10", icon: "text-sky-600 dark:text-sky-400", accent: "border-l-sky-500" },
  default: { bg: "bg-zinc-500/10", icon: "text-zinc-600 dark:text-zinc-400", accent: "border-l-zinc-500" },
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
      toast.success("Copied to clipboard!", {
        description: `${keyData.provider} key copied`,
        icon: <Copy className="h-4 w-4" />,
      });
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error("Failed to copy", {
        description: "Please try again",
      });
    }
  };

  const handleReveal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRevealed(!isRevealed);
    if (!isRevealed) {
      toast.info("Key revealed", {
        description: "Click the key to copy",
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
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        delay: index * 0.04, 
        duration: 0.4,
        ease: [0.23, 1, 0.32, 1]
      }}
      layout
    >
      <motion.div
        className={cn(
          "group relative overflow-hidden rounded-xl border-2 bg-card transition-all duration-200",
          "hover:border-foreground/20",
          isExpanded && "border-foreground/30 shadow-xl",
          status.accentColor
        )}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.995 }}
      >
        {/* Main content */}
        <div className="flex w-full items-center gap-3 p-4">
          {/* Provider icon - clickable to expand */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border-2 transition-all duration-200",
              provider.bg,
              provider.icon,
              "hover:scale-105 active:scale-95",
              "border-current/20"
            )}
          >
            <Shield className="h-6 w-6" />
          </button>

          {/* Key info - clickable to expand */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="min-w-0 flex-1 text-left"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold capitalize text-foreground tracking-tight">
                {keyData.provider}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md border-2 px-2 py-0.5 text-xs font-bold uppercase tracking-wide",
                  status.className
                )}
              >
                <StatusIcon className={cn("h-3 w-3", keyData.status === "Pending" && "animate-spin")} />
                {status.label}
              </span>
            </div>
            <p className="truncate font-mono text-xs text-muted-foreground tracking-tight">
              {maskedKey}
            </p>
          </button>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <motion.button
              onClick={handleCopy}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg border-2 transition-all duration-200",
                "hover:scale-105 active:scale-95",
                isCopied 
                  ? "bg-lime-500/20 text-lime-600 dark:text-lime-400 border-lime-500/40" 
                  : "bg-background border-border hover:border-foreground/30"
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
                    <Check className="h-4 w-4" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="copy"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Copy className="h-4 w-4" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            <motion.button
              onClick={() => setIsExpanded(!isExpanded)}
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg border-2 transition-all duration-200",
                "hover:scale-105 active:scale-95 border-border hover:border-foreground/30"
              )}
            >
              <ChevronDown className="h-5 w-5" />
            </motion.button>
          </div>
        </div>

        {/* Expanded content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className="overflow-hidden"
            >
              <div className="border-t-2 bg-muted/20 px-4 py-4">
                {/* Full key with reveal toggle */}
                <div className="mb-4">
                  <label className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    <Zap className="h-3.5 w-3.5" />
                    Full API Key
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className={cn(
                        "flex-1 rounded-lg border-2 bg-background p-3 text-left font-mono text-sm transition-all duration-200",
                        "hover:border-foreground/30 active:scale-[0.99]"
                      )}
                    >
                      {isRevealed ? keyData.key_value : "•".repeat(Math.min(keyData.key_value.length, 40))}
                    </button>
                    <motion.button
                      onClick={handleReveal}
                      className={cn(
                        "rounded-lg border-2 bg-background px-4 py-3 text-sm font-bold uppercase tracking-wide transition-all duration-200",
                        "hover:border-foreground/30 hover:scale-105 active:scale-95"
                      )}
                      whileTap={{ scale: 0.95 }}
                    >
                      {isRevealed ? "Hide" : "Show"}
                    </motion.button>
                  </div>
                </div>

                {/* Metadata */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-2 rounded-lg border-2 bg-background p-2.5 text-sm">
                    <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="text-muted-foreground font-medium">Found:</span>
                    <span className="font-bold">{formatDate(keyData.created_at)}</span>
                  </div>

                  {keyData.validated_at && (
                    <div className="flex items-center gap-2 rounded-lg border-2 bg-background p-2.5 text-sm">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-lime-600 dark:text-lime-400" />
                      <span className="text-muted-foreground font-medium">Validated:</span>
                      <span className="font-bold">{formatDate(keyData.validated_at)}</span>
                    </div>
                  )}

                  {keyData.repo_refs && keyData.repo_refs.length > 0 && (
                    <div className="flex items-center gap-2 rounded-lg border-2 bg-background p-2.5 text-sm sm:col-span-2">
                      <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="text-muted-foreground font-medium">Sources:</span>
                      <span className="font-bold">{keyData.repo_refs.length} reference{keyData.repo_refs.length > 1 ? "s" : ""}</span>
                    </div>
                  )}

                  {keyData.error_count > 0 && (
                    <div className="flex items-center gap-2 rounded-lg border-2 border-red-500/30 bg-red-500/10 p-2.5 text-sm sm:col-span-2">
                      <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                      <span className="font-bold text-red-600 dark:text-red-400">
                        {keyData.error_count} error{keyData.error_count > 1 ? "s" : ""} during validation
                      </span>
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
