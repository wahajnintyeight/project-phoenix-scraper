"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { KeyTestResult } from "@/lib/api";
import { PROVIDERS, ProviderId } from "./provider-selector";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  CreditCard,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";

type TestStatus = "idle" | "loading" | "done";

export interface TestEntry {
  provider: ProviderId;
  model: string;
  status: TestStatus;
  result?: KeyTestResult;
}

interface TestResultCardProps {
  entry: TestEntry;
}

const statusConfig = {
  Valid: {
    icon: CheckCircle2,
    label: "Valid",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    dot: "bg-emerald-500",
  },
  ValidNoCredits: {
    icon: AlertCircle,
    label: "No Credits",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    dot: "bg-amber-500",
  },
  Invalid: {
    icon: XCircle,
    label: "Invalid",
    className: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    dot: "bg-rose-500",
  },
  Error: {
    icon: AlertCircle,
    label: "Error",
    className: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    dot: "bg-rose-500",
  },
};

function providerGradient(providerId: ProviderId) {
  return PROVIDERS.find((p) => p.id === providerId)?.gradient ?? "from-primary to-primary";
}

export function TestResultCard({ entry }: TestResultCardProps) {
  const [expanded, setExpanded] = useState(false);
  const config = entry.result ? statusConfig[entry.result.status] ?? statusConfig.Error : null;
  const StatusIcon = config?.icon ?? Loader2;
  const hasCredits = !!entry.result?.credits;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-sm backdrop-blur-xl"
    >
      <div className="flex items-center gap-4 p-4">
        {/* Provider dot */}
        <div
          className={cn(
            "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-sm",
            providerGradient(entry.provider)
          )}
        >
          <span className="text-xs font-bold">{entry.provider[0]}</span>
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{entry.provider}</p>
          {entry.model && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{entry.model}</p>
          )}
        </div>

        {/* Status */}
        <div className="flex items-center gap-2">
          {entry.status === "loading" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
              <Loader2 className="h-3 w-3 animate-spin" />
              Testing…
            </span>
          ) : config ? (
            <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium", config.className)}>
              <StatusIcon className="h-3 w-3" />
              {config.label}
            </span>
          ) : null}

          {hasCredits && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-border/60 bg-background/60 text-muted-foreground transition-colors hover:bg-muted/60"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {expanded && entry.result?.credits && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/50 px-4 pb-4 pt-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <CreditCard className="h-3.5 w-3.5" />
                Credits
              </div>
              <div className="grid grid-cols-2 gap-2">
                {entry.result.credits.total_credits !== undefined && (
                  <div className="rounded-xl border border-border/50 bg-background/60 p-3">
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="mt-1 text-sm font-semibold">
                      ${entry.result.credits.total_credits.toFixed(4)}
                    </p>
                  </div>
                )}
                {entry.result.credits.total_usage !== undefined && (
                  <div className="rounded-xl border border-border/50 bg-background/60 p-3">
                    <p className="text-xs text-muted-foreground">Used</p>
                    <p className="mt-1 text-sm font-semibold">
                      ${entry.result.credits.total_usage.toFixed(4)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {entry.result?.error && (
        <div className="border-t border-border/50 px-4 pb-3 pt-2">
          <p className="text-xs text-muted-foreground/70">{entry.result.error}</p>
        </div>
      )}
    </motion.div>
  );
}
