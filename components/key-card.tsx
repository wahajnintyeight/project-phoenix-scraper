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
} from "lucide-react";

interface KeyCardProps {
  keyData: ApiKey;
  index: number;
}

const statusConfig = {
  valid: {
    icon: CheckCircle2,
    label: "Valid",
    className: "bg-valid/10 text-valid border-valid/20",
    dotClassName: "bg-valid",
  },
  invalid: {
    icon: XCircle,
    label: "Invalid",
    className: "bg-invalid/10 text-invalid border-invalid/20",
    dotClassName: "bg-invalid",
  },
  pending: {
    icon: Loader2,
    label: "Pending",
    className: "bg-pending/10 text-pending border-pending/20",
    dotClassName: "bg-pending",
  },
  error: {
    icon: AlertCircle,
    label: "Error",
    className: "bg-error/10 text-error border-error/20",
    dotClassName: "bg-error",
  },
};

const providerColors: Record<string, string> = {
  openai: "from-emerald-500 to-teal-600",
  anthropic: "from-orange-500 to-amber-600",
  google: "from-blue-500 to-cyan-600",
  github: "from-slate-600 to-slate-800",
  stripe: "from-violet-500 to-purple-600",
  aws: "from-amber-500 to-orange-600",
  azure: "from-sky-500 to-blue-600",
  default: "from-primary to-primary/80",
};

export function KeyCard({ keyData, index }: KeyCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

  const status = statusConfig[keyData.status] || statusConfig.error;
  const StatusIcon = status.icon;
  const gradientClass = providerColors[keyData.provider.toLowerCase()] || providerColors.default;

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
      transition={{ delay: index * 0.05, duration: 0.3 }}
      layout
    >
      <motion.div
        className={cn(
          "group relative overflow-hidden rounded-2xl border bg-card transition-all duration-300",
          "hover:shadow-lg hover:shadow-primary/5",
          isExpanded && "ring-2 ring-primary/20"
        )}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.995 }}
      >
        {/* Gradient accent bar */}
        <div className={cn("absolute left-0 top-0 h-full w-1 bg-gradient-to-b", gradientClass)} />

        {/* Main content - clickable to expand */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex w-full items-center gap-4 p-4 pl-5 text-left"
        >
          {/* Provider icon */}
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-md",
              gradientClass
            )}
          >
            <Key className="h-5 w-5" />
          </div>

          {/* Key info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold capitalize text-foreground">
                {keyData.provider}
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
                  status.className
                )}
              >
                <StatusIcon className={cn("h-3 w-3", keyData.status === "pending" && "animate-spin")} />
                {status.label}
              </span>
            </div>
            <p className="mt-0.5 truncate font-mono text-sm text-muted-foreground">
              {maskedKey}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <motion.button
              onClick={handleCopy}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg transition-colors",
                "bg-secondary hover:bg-secondary/80",
                isCopied && "bg-valid/20 text-valid"
              )}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <AnimatePresence mode="wait">
                {isCopied ? (
                  <motion.div
                    key="check"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
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

            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="flex h-9 w-9 items-center justify-center text-muted-foreground"
            >
              <ChevronDown className="h-5 w-5" />
            </motion.div>
          </div>
        </button>

        {/* Expanded content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="border-t bg-muted/30 px-5 py-4">
                {/* Full key with reveal toggle */}
                <div className="mb-4">
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Full API Key
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="flex-1 rounded-lg border bg-background p-3 text-left font-mono text-sm transition-colors hover:bg-muted/50"
                    >
                      {isRevealed ? keyData.key_value : "•".repeat(Math.min(keyData.key_value.length, 40))}
                    </button>
                    <motion.button
                      onClick={handleReveal}
                      className="rounded-lg border bg-background px-3 py-3 text-sm font-medium transition-colors hover:bg-muted/50"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {isRevealed ? "Hide" : "Reveal"}
                    </motion.button>
                  </div>
                </div>

                {/* Metadata */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Found:</span>
                    <span className="font-medium">{formatDate(keyData.created_at)}</span>
                  </div>

                  {keyData.validated_at && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Validated:</span>
                      <span className="font-medium">{formatDate(keyData.validated_at)}</span>
                    </div>
                  )}

                  {keyData.repo_refs && keyData.repo_refs.length > 0 && (
                    <div className="flex items-start gap-2 text-sm sm:col-span-2">
                      <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="text-muted-foreground">Sources:</span>
                      <span className="font-medium">{keyData.repo_refs.join(", ")}</span>
                    </div>
                  )}

                  {keyData.validation_error && (
                    <div className="flex items-start gap-2 text-sm sm:col-span-2">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-invalid" />
                      <span className="text-invalid">{keyData.validation_error}</span>
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
