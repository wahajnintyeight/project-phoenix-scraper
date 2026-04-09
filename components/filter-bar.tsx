"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Search, Filter, X } from "lucide-react";

interface FilterBarProps {
  providers: string[];
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
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search keys..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-10 w-full rounded-xl border bg-card pl-10 pr-4 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20"
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
              "h-10 appearance-none rounded-xl border bg-card pl-10 pr-8 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20",
              selectedProvider && "border-primary/50 bg-primary/5"
            )}
          >
            <option value="">All Providers</option>
            {providers.map((provider) => (
              <option key={provider} value={provider}>
                {provider}
              </option>
            ))}
          </select>
        </div>

        <select
          value={selectedStatus}
          onChange={(e) => onStatusChange(e.target.value)}
          className={cn(
            "h-10 appearance-none rounded-xl border bg-card px-4 pr-8 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20",
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
            className="flex h-10 items-center gap-1.5 rounded-xl border border-destructive/30 bg-destructive/10 px-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20"
          >
            <X className="h-4 w-4" />
            Clear
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
