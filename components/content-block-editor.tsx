"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  ShieldOff,
  Plus,
  Trash2,
  Ban,
  AlertTriangle,
  FileCode,
  Globe,
  Key,
  Fingerprint,
  Loader2,
} from "lucide-react";
import type { BlockedContent } from "@/lib/api";

const BLOCK_TYPES = [
  { value: "file_path", label: "File Path", icon: FileCode },
  { value: "repo_url", label: "Repo URL", icon: Globe },
  { value: "key_prefix", label: "Key Prefix", icon: Key },
  { value: "provider", label: "Provider", icon: Fingerprint },
  { value: "domain", label: "Domain", icon: Globe },
] as const;

type BlockType = (typeof BLOCK_TYPES)[number]["value"];

interface ContentBlockEditorProps {
  rules: BlockedContent[];
  isLoading: boolean;
  onAdd: (pattern: string, type: string, description?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function ContentBlockEditor({
  rules,
  isLoading,
  onAdd,
  onDelete,
}: ContentBlockEditorProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [pattern, setPattern] = useState("");
  const [type, setType] = useState<BlockType>("file_path");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!pattern.trim()) {
      toast.error("Pattern is required");
      return;
    }
    setIsSubmitting(true);
    try {
      await onAdd(pattern.trim(), type, description.trim() || undefined);
      setPattern("");
      setType("file_path");
      setDescription("");
      setIsAdding(false);
      toast.success("Block rule added", {
        icon: <ShieldOff className="h-4 w-4" />,
      });
    } catch {
      toast.error("Failed to add block rule");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await onDelete(id);
      toast.success("Block rule removed", {
        icon: <ShieldOff className="h-4 w-4" />,
      });
    } catch {
      toast.error("Failed to remove block rule");
    }
  };

  return (
    <div className="rounded-[28px] border border-border/70 bg-card/75 p-5 shadow-xl shadow-black/5 backdrop-blur-2xl">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500">
            <ShieldOff className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-rose-400/80">
              Content blocking
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Block matching keys, sources, and domains
            </p>
          </div>
        </div>
        <motion.button
          onClick={() => setIsAdding(!isAdding)}
          className={cn(
            "inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium transition-all",
            isAdding
              ? "border-rose-500/30 bg-rose-500/10 text-rose-500"
              : "border-border/70 bg-background/80 text-foreground hover:bg-muted"
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="h-4 w-4" />
          {isAdding ? "Cancel" : "Add rule"}
        </motion.button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mb-4 space-y-3 rounded-2xl border border-border/60 bg-background/60 p-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Pattern
                </label>
                <input
                  type="text"
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  placeholder="e.g. github.com/org/repo or sk-*"
                  className="w-full rounded-xl border border-border/60 bg-background/80 px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground/40 focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/30"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Type
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {BLOCK_TYPES.map((bt) => {
                      const Icon = bt.icon;
                      const isActive = type === bt.value;
                      return (
                        <button
                          key={bt.value}
                          onClick={() => setType(bt.value as BlockType)}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] transition-all",
                            isActive
                              ? "border-rose-500/30 bg-rose-500/10 text-rose-500"
                              : "border-border/50 bg-background/60 text-muted-foreground hover:bg-muted"
                          )}
                        >
                          <Icon className="h-3 w-3" />
                          {bt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    Description (optional)
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Why this is blocked"
                    className="w-full rounded-xl border border-border/60 bg-background/80 px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground/40 focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/30"
                  />
                </div>
              </div>
              <motion.button
                onClick={handleSubmit}
                disabled={isSubmitting || !pattern.trim()}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all",
                  isSubmitting || !pattern.trim()
                    ? "cursor-not-allowed bg-muted text-muted-foreground"
                    : "bg-rose-500 text-white shadow-lg shadow-rose-500/20 hover:opacity-90"
                )}
                whileHover={isSubmitting || !pattern.trim() ? {} : { y: -1 }}
                whileTap={isSubmitting || !pattern.trim() ? {} : { scale: 0.98 }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Adding…
                  </>
                ) : (
                  <>
                    <Ban className="h-4 w-4" />
                    Block content
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-14 animate-pulse rounded-2xl border border-border/50 bg-background/50"
            />
          ))}
        </div>
      ) : rules.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/50 bg-background/50 p-6 text-center">
          <ShieldOff className="h-8 w-8 text-muted-foreground/40" />
          <div>
            <p className="text-sm font-medium text-muted-foreground">No block rules</p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              Add rules to block specific keys, repos, or domains from appearing.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map((rule, i) => (
            <motion.div
              key={rule.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="group flex items-center justify-between gap-3 rounded-2xl border border-border/50 bg-background/50 p-3.5 transition-all hover:bg-background/80"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
                  {(() => {
                    const bt = BLOCK_TYPES.find((t) => t.value === rule.type);
                    const Icon = bt?.icon ?? AlertTriangle;
                    return <Icon className="h-4 w-4" />;
                  })()}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-mono text-sm font-medium text-foreground">
                    {rule.pattern}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="rounded-full border border-border/40 bg-background/60 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                      {rule.type.replace(/_/g, " ")}
                    </span>
                    {rule.description && (
                      <span className="truncate text-xs text-muted-foreground/60">
                        {rule.description}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <motion.button
                onClick={() => handleDelete(rule.id)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-muted-foreground opacity-0 transition-all hover:bg-rose-500/10 hover:text-rose-500 group-hover:opacity-100"
                whileTap={{ scale: 0.9 }}
              >
                <Trash2 className="h-4 w-4" />
              </motion.button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
