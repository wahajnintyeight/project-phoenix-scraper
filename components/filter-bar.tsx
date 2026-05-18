"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Search, Filter, X } from "lucide-react";

interface FilterBarProps {
  providers: { name: string; count: number }[];
  selectedProvider: string;
  selectedStatus: string;
  onProviderChange: (provider: string) => void;
  onStatusChange: (status: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const statusOptions = [
  { value: "", label: "All Status" },
  { value: "valid", label: "Valid" },
  { value: "invalid", label: "Invalid" },
  { value: "pending", label: "Pending" },
  { value: "error", label: "Error" },
];

export function FilterBar({
  providers,
  selectedProvider,
  selectedStatus,
  onProviderChange,
  onStatusChange,
  searchQuery,
  onSearchChange,
}: FilterBarProps) {
  const hasFilters = selectedProvider || selectedStatus || searchQuery;

  const clearFilters = () => {
    onProviderChange("");
    onStatusChange("");
    onSearchChange("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-3 sm:flex-row sm:items-center"
    >
      {/* Search input */}
      <div className="relative flex-1">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by key value, provider..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-10 w-full rounded-2xl border border-border/70 bg-background/80 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
        />
      </div>

      {/* Filter dropdowns */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <select
            value={selectedProvider}
            onChange={(e) => onProviderChange(e.target.value)}
            className={cn(
              "h-10 appearance-none rounded-2xl border border-border/70 bg-background/80 pl-10 pr-8 text-sm outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/15",
              selectedProvider && "border-primary/50 bg-primary/5"
            )}
          >
            <option value="">All Providers</option>
            {providers.map((provider) => (
              <option key={provider.name} value={provider.name}>
                {provider.name} ({provider.count})
              </option>
            ))}
          </select>
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => onStatusChange(e.target.value)}
          className={cn(
            "h-10 appearance-none rounded-2xl border border-border/70 bg-background/80 px-4 pr-8 text-sm outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/15",
            selectedStatus && "border-primary/50 bg-primary/5"
          )}
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {hasFilters && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={clearFilters}
            className="flex h-10 items-center gap-1.5 rounded-2xl border border-destructive/30 bg-destructive/10 px-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20"
          >
            <X className="h-4 w-4" />
            Clear
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
