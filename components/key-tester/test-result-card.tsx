"use client";

import { useState, useEffect } from "react";
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
  Activity,
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
    label: "VERIFIED",
    className: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    ink: "from-emerald-500/80 to-transparent",
  },
  ValidNoCredits: {
    icon: AlertCircle,
    label: "NO_CREDITS",
    className: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    ink: "from-amber-500/80 to-transparent",
  },
  Invalid: {
    icon: XCircle,
    label: "INVALID",
    className: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    ink: "from-rose-500/80 to-transparent",
  },
  Error: {
    icon: AlertTriangle,
    label: "ERROR",
    className: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    ink: "from-rose-500/80 to-transparent",
  },
};

function providerGradient(providerId: ProviderId) {
  return PROVIDERS.find((p) => p.id === providerId)?.gradient ?? "from-primary to-primary";
}

export function TestResultCard({ entry }: TestResultCardProps) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);

  const config =
    entry.result
      ? statusConfig[entry.result.status] ?? statusConfig.Error
      : null;
  
  const credits = entry.result?.credits;
  const hasCredits =
    credits !== undefined &&
    credits !== null &&
    (credits.total_credits !== undefined || credits.total_usage !== undefined);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative overflow-hidden rounded-[32px] border border-white/5 bg-white/[0.01] p-6 transition-all hover:bg-white/[0.03]"
    >
      {/* Ink Status Accent */}
      {config && (
        <div className={cn(
          "absolute left-0 top-0 h-1 w-full bg-gradient-to-r transition-opacity opacity-60",
          config.ink
        )} />
      )}

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg",
              providerGradient(entry.provider)
            )}
          >
            <span className="font-mono text-xs font-bold uppercase">{entry.provider[0]}</span>
          </div>
          <div>
            <p className="font-mono text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">{entry.provider}</p>
            <h3 className="font-sans text-sm font-bold tracking-tight text-foreground">
              {entry.model || "Default Model"}
            </h3>
          </div>
        </div>

        {entry.status === "loading" ? (
          <div className="flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/5 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-violet-400">
            <Loader2 className="h-3 w-3 animate-spin" />
            Testing
          </div>
        ) : config ? (
          <div className={cn(
            "rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-widest",
            config.className
          )}>
            {config.label}
          </div>
        ) : null}
      </div>

      {/* ── Credits (always shown when present) ── */}
      {entry.status === "done" && hasCredits && (
        <div className="border-t border-border/50 px-4 pb-4 pt-3">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <CreditCard className="h-3.5 w-3.5" />
              Credits Allocation
            </div>
            {credits!.total_credits !== undefined && credits!.total_usage !== undefined && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                {((1 - (Number(credits!.total_usage) / Number(credits!.total_credits))) * 100).toFixed(1)}% remaining
              </span>
            )}
          </div>
          
          <div className="space-y-3">
            {/* Progress bar for visualization */}
            {credits!.total_credits !== undefined && credits!.total_usage !== undefined && (
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/50">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(0, Math.min(100, (1 - (Number(credits!.total_usage) / Number(credits!.total_credits))) * 100))}%` }}
                  className="h-full bg-gradient-to-r from-primary to-emerald-500"
                />
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-border/40 bg-background/40 p-2.5">
                <p className="text-[10px] uppercase tracking-tight text-muted-foreground">Total</p>
                <p className="mt-0.5 text-sm font-bold tabular-nums">
                  ${Number(credits!.total_credits ?? 0).toFixed(3)}
                </p>
              </div>
              <div className="rounded-xl border border-border/40 bg-background/40 p-2.5">
                <p className="text-[10px] uppercase tracking-tight text-muted-foreground">Used</p>
                <p className="mt-0.5 text-sm font-bold tabular-nums text-rose-500">
                  ${Number(credits!.total_usage ?? 0).toFixed(3)}
                </p>
              </div>
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-2.5 ring-1 ring-primary/10">
                <p className="text-[10px] uppercase tracking-tight text-primary/70">Remaining</p>
                <p className="mt-0.5 text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                  ${(Number(credits!.total_credits ?? 0) - Number(credits!.total_usage ?? 0)).toFixed(3)}
                </p>
              </div>
            </div>
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
          {hasCredits && (
            <div className="grid grid-cols-2 gap-4">
              {credits!.total_credits !== undefined && (
                <div className="space-y-1">
                  <p className="font-mono text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">Total_Credits</p>
                  <p className="font-mono text-sm font-bold tabular-nums text-foreground/80">
                    ${Number(credits!.total_credits).toFixed(4)}
                  </p>
                </div>
              )}
              {credits!.total_usage !== undefined && (
                <div className="space-y-1">
                  <p className="font-mono text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/30">Total_Usage</p>
                  <p className="font-mono text-sm font-bold tabular-nums text-foreground/80">
                    ${Number(credits!.total_usage).toFixed(4)}
                  </p>
                </div>
              )}
            </div>
          )}

          {entry.result?.response && (
            <div className="space-y-2">
              <p className="font-mono text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/30 flex items-center gap-2">
                <Activity className="h-3 w-3" /> Provider_Response
              </p>
              <pre className="max-h-48 overflow-auto rounded-2xl border border-white/5 bg-black/20 p-4 font-mono text-[10px] leading-5 text-muted-foreground/60 scrollbar-none">
                {entry.result.response}
              </pre>
            </div>
          )}

          {entry.result?.error && (
            <div className="rounded-2xl border border-rose-500/10 bg-rose-500/5 p-4">
              <p className="font-mono text-[9px] font-black uppercase tracking-[0.2em] text-rose-500/60 flex items-center gap-2">
                <AlertTriangle className="h-3 w-3" /> Error_Details
              </p>
              <p className="mt-2 font-mono text-[10px] leading-5 text-rose-400/80">
                {entry.result.error}
              </p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
