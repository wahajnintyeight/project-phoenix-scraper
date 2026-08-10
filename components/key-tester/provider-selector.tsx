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
  {
    id: "Z.AI",
    label: "Z.AI",
    gradient: "from-cyan-400 to-teal-500",
    defaultModel: "glm-5.1",
    supportsModel: true,
  },
  {
    id: "xAI",
    label: "xAI / Grok",
    gradient: "from-slate-400 to-slate-600",
    defaultModel: "",
    supportsModel: false,
  },
  {
    id: "MiMo",
    label: "MiMo",
    gradient: "from-amber-400 to-orange-600",
    defaultModel: "mimo-v2.5-pro",
    supportsModel: true,
  },
  {
    id: "MiniMax",
    label: "MiniMax",
    gradient: "from-rose-400 to-red-600",
    defaultModel: "MiniMax-M2.7",
    supportsModel: true,
  },
  {
    id: "Tencent",
    label: "Tencent Hy3",
    gradient: "from-blue-400 to-cyan-500",
    defaultModel: "hy3",
    supportsModel: true,
  },
  {
    id: "StepFun",
    label: "StepFun",
    gradient: "from-lime-400 to-emerald-600",
    defaultModel: "step-3.7-flash",
    supportsModel: true,
  },
  {
    id: "Qwen",
    label: "Qwen",
    gradient: "from-violet-400 to-blue-600",
    defaultModel: "qwen3.7-max",
    supportsModel: true,
  },
  {
    id: "Mistral",
    label: "Mistral",
    gradient: "from-orange-400 to-red-500",
    defaultModel: "mistral-large-latest",
    supportsModel: true,
  },
  {
    id: "BytePlus",
    label: "BytePlus",
    gradient: "from-sky-400 to-indigo-600",
    defaultModel: "dola-seed-2-1-turbo",
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
