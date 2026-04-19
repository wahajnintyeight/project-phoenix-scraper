"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { KeyTestResult } from "@/lib/api";
import { PROVIDERS, ProviderId } from "./provider-selector";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  CreditCard,
  Cpu,
  AlertTriangle,
  FileText,
} from "lucide-react";

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
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    border: "border-emerald-500/20",
    glow: "shadow-emerald-500/5",
  },
  ValidNoCredits: {
    icon: AlertCircle,
    label: "Valid — No Credits",
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    border: "border-amber-500/20",
    glow: "shadow-amber-500/5",
  },
  Invalid: {
    icon: XCircle,
    label: "Invalid",
    badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    border: "border-rose-500/20",
    glow: "shadow-rose-500/5",
  },
  Error: {
    icon: AlertTriangle,
    label: "Error",
    badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    border: "border-rose-500/20",
    glow: "shadow-rose-500/5",
  },
};

function providerGradient(providerId: ProviderId) {
  return PROVIDERS.find((p) => p.id === providerId)?.gradient ?? "from-primary to-primary";
}

export function TestResultCard({ entry }: TestResultCardProps) {
  const config =
    entry.result
      ? statusConfig[entry.result.status] ?? statusConfig.Error
      : null;
  const StatusIcon = config?.icon ?? Loader2;

  const credits = entry.result?.credits;
  const hasCredits =
    credits !== undefined &&
    credits !== null &&
    (credits.total_credits !== undefined || credits.total_usage !== undefined);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={cn(
        "overflow-hidden rounded-2xl border bg-card/80 shadow-md backdrop-blur-xl transition-colors",
        config ? config.border : "border-border/60",
        config ? config.glow : ""
      )}
    >
      {/* ── Header row ── */}
      <div className="flex items-center gap-3 p-4">
        <div
          className={cn(
            "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-sm",
            providerGradient(entry.provider)
          )}
        >
          <span className="text-xs font-bold">{entry.provider[0]}</span>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{entry.provider}</p>
          {entry.model && (
            <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <Cpu className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{entry.model}</span>
            </div>
          )}
        </div>

        {entry.status === "loading" ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
            <Loader2 className="h-3 w-3 animate-spin" />
            Testing…
          </span>
        ) : config ? (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
              config.badge
            )}
          >
            <StatusIcon className="h-3 w-3" />
            {config.label}
          </span>
        ) : null}
      </div>

      {/* ── Credits (always shown when present) ── */}
      {entry.status === "done" && hasCredits && (
        <div className="border-t border-border/50 px-4 pb-4 pt-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <CreditCard className="h-3.5 w-3.5" />
            Credits
          </div>
          <div className="grid grid-cols-2 gap-2">
            {credits!.total_credits !== undefined && (
              <div className="rounded-xl border border-border/50 bg-background/60 p-3">
                <p className="text-xs text-muted-foreground">Total credits</p>
                <p className="mt-1 text-sm font-semibold tabular-nums">
                  ${Number(credits!.total_credits).toFixed(4)}
                </p>
              </div>
            )}
            {credits!.total_usage !== undefined && (
              <div className="rounded-xl border border-border/50 bg-background/60 p-3">
                <p className="text-xs text-muted-foreground">Total usage</p>
                <p className="mt-1 text-sm font-semibold tabular-nums">
                  ${Number(credits!.total_usage).toFixed(4)}
                </p>
              </div>
            )}
            {credits!.total_credits !== undefined && credits!.total_usage !== undefined && (
              <div className="col-span-2 rounded-xl border border-border/50 bg-background/60 p-3">
                <p className="text-xs text-muted-foreground">Remaining</p>
                <p className="mt-1 text-sm font-semibold tabular-nums">
                  ${(Number(credits!.total_credits) - Number(credits!.total_usage)).toFixed(4)}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {entry.status === "done" && entry.result?.response && (
        <div className="border-t border-border/50 px-4 pb-3 pt-3">
          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <FileText className="h-3.5 w-3.5" />
            Provider response
          </div>
          <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-xl border border-border/50 bg-background/60 p-3 text-xs leading-5 text-muted-foreground">
            {entry.result.response}
          </pre>
        </div>
      )}

      {/* ── Error detail (always shown when present) ── */}
      {entry.status === "done" && entry.result?.error && (
        <div
          className={cn(
            "border-t border-border/50 px-4 pb-3 pt-3",
            hasCredits && "border-t"
          )}
        >
          <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-rose-500">
            <AlertTriangle className="h-3.5 w-3.5" />
            Error detail
          </div>
          <p className="break-words text-xs leading-5 text-muted-foreground">
            {entry.result.error}
          </p>
        </div>
      )}
    </motion.div>
  );
}
