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
    label: "Total",
    icon: Key,
    colorClass: "bg-primary/10 text-primary border-primary/20",
  },
  {
    key: "valid_keys" as const,
    label: "Valid",
    icon: CheckCircle2,
    colorClass: "bg-valid/10 text-valid border-valid/20",
  },
  {
    key: "invalid_keys" as const,
    label: "Invalid",
    icon: XCircle,
    colorClass: "bg-invalid/10 text-invalid border-invalid/20",
  },
  {
    key: "pending_keys" as const,
    label: "Pending",
    icon: Clock,
    colorClass: "bg-pending/10 text-pending border-pending/20",
  },
  {
    key: "error_keys" as const,
    label: "Errors",
    icon: AlertCircle,
    colorClass: "bg-error/10 text-error border-error/20",
  },
];

export function StatsBar({ stats, isLoading }: StatsBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {statItems.map((item, index) => {
        const Icon = item.icon;
        const value = stats ? stats[item.key] : 0;

        return (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              "flex items-center gap-2 rounded-full border px-3 py-1.5",
              item.colorClass
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="text-sm font-medium">
              {isLoading ? (
                <span className="inline-block h-4 w-6 animate-pulse rounded bg-current/20" />
              ) : (
                <>
                  {value} {item.label}
                </>
              )}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
