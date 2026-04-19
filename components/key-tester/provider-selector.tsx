"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

export const PROVIDERS = [
  {
    id: "OpenAI",
    label: "OpenAI",
    gradient: "from-emerald-400 to-emerald-600",
    defaultModel: "gpt-4o-mini",
    supportsModel: true,
  },
  {
    id: "Anthropic",
    label: "Anthropic",
    gradient: "from-orange-400 to-amber-500",
    defaultModel: "claude-haiku-4-5-20251001",
    supportsModel: true,
  },
  {
    id: "Google",
    label: "Google",
    gradient: "from-sky-400 to-blue-600",
    defaultModel: "gemini-2.5-flash",
    supportsModel: true,
  },
  {
    id: "OpenRouter",
    label: "OpenRouter",
    gradient: "from-fuchsia-400 to-violet-500",
    defaultModel: "",
    supportsModel: false,
  },
] as const;

export type ProviderId = (typeof PROVIDERS)[number]["id"];

interface ProviderSelectorProps {
  selected: ProviderId[];
  onChange: (providers: ProviderId[]) => void;
}

export function ProviderSelector({ selected, onChange }: ProviderSelectorProps) {
  const toggle = (id: ProviderId) => {
    onChange(
      selected.includes(id) ? selected.filter((p) => p !== id) : [...selected, id]
    );
  };

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {PROVIDERS.map((provider, i) => {
        const isSelected = selected.includes(provider.id);
        return (
          <motion.button
            key={provider.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => toggle(provider.id)}
            className={cn(
              "relative flex items-center gap-2.5 rounded-2xl border px-4 py-3 text-sm font-medium transition-all",
              isSelected
                ? "border-primary/40 bg-primary/10 text-foreground shadow-sm"
                : "border-border/60 bg-background/60 text-muted-foreground hover:bg-muted/60"
            )}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
          >
            <span
              className={cn(
                "h-2.5 w-2.5 rounded-full bg-gradient-to-br",
                provider.gradient
              )}
            />
            {provider.label}
            {isSelected && (
              <CheckCircle2 className="ml-auto h-3.5 w-3.5 text-primary" />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
