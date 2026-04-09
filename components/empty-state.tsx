"use client";

import { motion } from "framer-motion";
import { Search, Key } from "lucide-react";

interface EmptyStateProps {
  type: "no-results" | "no-keys";
  onClearFilters?: () => void;
}

export function EmptyState({ type, onClearFilters }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <motion.div
        className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted"
        animate={{ rotate: [0, 5, -5, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
      >
        {type === "no-results" ? (
          <Search className="h-8 w-8 text-muted-foreground" />
        ) : (
          <Key className="h-8 w-8 text-muted-foreground" />
        )}
      </motion.div>

      <h3 className="mb-2 text-lg font-semibold">
        {type === "no-results" ? "No matches found" : "No keys yet"}
      </h3>

      <p className="mb-4 max-w-xs text-sm text-muted-foreground">
        {type === "no-results"
          ? "Try adjusting your filters or search query to find what you're looking for."
          : "Keys will appear here once they've been discovered and processed."}
      </p>

      {type === "no-results" && onClearFilters && (
        <motion.button
          onClick={onClearFilters}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Clear all filters
        </motion.button>
      )}
    </motion.div>
  );
}
