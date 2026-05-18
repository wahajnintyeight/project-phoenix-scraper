"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

export const PROVIDERS = [
  {
    id: "OpenAI",
    label: "OpenAI",
    gradient: "from-emerald-400 to-emerald-600",
    defaultModel: "gpt-5",
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
    defaultModel: "openrouter/free",
    supportsModel: true,
  },
  {
    id: "Moonshot",
    label: "Moonshot",
    gradient: "from-indigo-400 to-purple-600",
    defaultModel: "kimi-k2-0905-preview",
    supportsModel: true,
  },
  {
    id: "DeepSeek",
    label: "DeepSeek",
    gradient: "from-blue-500 to-indigo-600",
    defaultModel: "deepseek-chat",
    supportsModel: true,
  },
] as const;

export type ProviderId = (typeof PROVIDERS)[number]["id"];

interface ProviderSelectorProps {
  selected: ProviderId | null;
  onChange: (provider: ProviderId) => void;
}

export function ProviderSelector({ selected, onChange }: ProviderSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {PROVIDERS.map((provider, i) => {
        const isSelected = selected === provider.id;
        return (
          <motion.button
            key={provider.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.03 }}
            onClick={() => onChange(provider.id)}
            className={cn(
              "relative flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all",
              isSelected
                ? "border-violet-500/50 bg-violet-500/10 text-white shadow-[0_0_20px_rgba(139,92,246,0.15)]"
                : "border-white/5 bg-white/5 text-muted-foreground hover:bg-white/10 hover:border-white/10"
            )}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full bg-gradient-to-br",
                provider.gradient
              )}
            />
            {provider.label}
          </motion.button>
        );
      })}
    </div>
  );
}
