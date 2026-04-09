"use client";

import { motion } from "framer-motion";
import { Stats } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Key, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react";

interface StatsBarProps {
  stats: Stats | null;
  isLoading: boolean;
}

const statItems = [
  {
    key: "total_keys" as const,
    label: "Total_Scan",
    icon: Key,
    colorClass: "bg-primary/5 text-primary border-primary",
  },
  {
    key: "valid_keys" as const,
    label: "Sys_Valid",
    icon: CheckCircle2,
    colorClass: "bg-valid/5 text-valid border-valid",
  },
  {
    key: "invalid_keys" as const,
    label: "Sys_Invalid",
    icon: XCircle,
    colorClass: "bg-invalid/5 text-invalid border-invalid",
  },
  {
    key: "pending_keys" as const,
    label: "Wait_Queue",
    icon: Clock,
    colorClass: "bg-pending/5 text-pending border-pending",
  },
  {
    key: "error_keys" as const,
    label: "Scan_Error",
    icon: AlertCircle,
    colorClass: "bg-error/5 text-error border-error",
  },
];

export function StatsBar({ stats, isLoading }: StatsBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 md:gap-4 w-full">
      {statItems.map((item, index) => {
        const Icon = item.icon;
        const value = stats ? stats[item.key] : 0;

        return (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "flex flex-1 md:flex-none items-center gap-2 md:gap-3 border-2 px-3 py-2 md:px-4 md:py-2 min-w-[120px] transition-all duration-300 hover:bg-current/10",
              item.colorClass
            )}
          >
            <Icon className="h-4 w-4 md:h-5 md:w-5 shrink-0" />
            <div className="flex flex-col flex-1">
              <span className="font-mono text-[9px] md:text-[10px] font-bold uppercase tracking-widest opacity-80">
                {item.label}
              </span>
              <span className="font-mono text-sm md:text-base font-black tabular-nums tracking-tighter">
                {isLoading ? (
                  <span className="inline-block h-4 w-8 animate-pulse bg-current/20" />
                ) : (
                  value
                )}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
