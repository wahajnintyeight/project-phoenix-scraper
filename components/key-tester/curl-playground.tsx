"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Loader2,
  Play,
  Shield,
  TerminalSquare,
  ShieldOff,
} from "lucide-react";
import { fetchBlockedContent, BlockedContent } from "@/lib/api";

type SupportedProvider = {
  id: string;
  label: string;
  keywords: string[];
  hosts: string[];
  tone: string;
};

type ParsedCurl = {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
  provider: SupportedProvider;
};

type CurlExecutionState =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "done";
      ok: boolean;
      statusCode?: number;
      provider: string;
      url: string;
      responseHeaders: Array<[string, string]>;
      responseBody: string;
      error?: string;
    };

const SUPPORTED_PROVIDERS: SupportedProvider[] = [
  {
    id: "openai",
    label: "OpenAI",
    keywords: ["openai", "chatgpt", "gpt-4o", "gpt-4.1"],
    hosts: ["api.openai.com"],
    tone: "from-emerald-400 to-emerald-600",
  },
  {
    id: "anthropic",
    label: "Anthropic",
    keywords: ["anthropic", "claude", "claude-opus", "claude-sonnet"],
    hosts: ["api.anthropic.com"],
    tone: "from-orange-400 to-amber-500",
  },
  {
    id: "google",
    label: "Google AI",
    keywords: ["google", "gemini", "generativelanguage"],
    hosts: ["generativelanguage.googleapis.com", "aiplatform.googleapis.com"],
    tone: "from-sky-400 to-blue-600",
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    keywords: ["openrouter"],
    hosts: ["openrouter.ai", "openrouter.ai/api"],
    tone: "from-fuchsia-400 to-violet-500",
  },
  {
    id: "xai",
    label: "xAI",
    keywords: ["xai", "grok"],
    hosts: ["api.x.ai"],
    tone: "from-slate-400 to-slate-600",
  },
  {
    id: "mimo",
    label: "MiMo",
    keywords: ["mimo", "xiaomimimo", "mimo-v2.5", "mimo_api_key", "mimo_key", "mimo_api"],
    hosts: ["api.xiaomimimo.com"],
    tone: "from-amber-400 to-orange-600",
  },
  {
    id: "minimax",
    label: "MiniMax",
    keywords: ["minimax", "minimax-m2"],
    hosts: ["api.minimax.io", "api.minimaxi.com"],
    tone: "from-rose-400 to-red-600",
  },
  {
    id: "tencent",
    label: "Tencent Hy3",
    keywords: ["hy3", "hunyuan", "tencentmaas", "hy3_api_key"],
    hosts: ["tokenhub.tencentmaas.com", "tokenhub-intl.tencentmaas.com"],
    tone: "from-blue-400 to-cyan-500",
  },
  {
    id: "stepfun",
    label: "StepFun",
    keywords: ["stepfun", "step-3.7", "step_api_key", "stepfun_api_key"],
    hosts: ["api.stepfun.com"],
    tone: "from-lime-400 to-emerald-600",
  },
  {
    id: "qwen",
    label: "Qwen",
    keywords: ["qwen", "dashscope", "bailian_api_key"],
    hosts: ["dashscope.aliyuncs.com", "dashscope-intl.aliyuncs.com"],
    tone: "from-violet-400 to-blue-600",
  },
  {
    id: "zai",
    label: "Z.ai",
    keywords: ["z.ai", "glm", "bigmodel", "z-ai"],
    hosts: ["api.z.ai", "open.bigmodel.cn"],
    tone: "from-cyan-400 to-teal-500",
  },
  {
    id: "deepseek",
    label: "DeepSeek",
    keywords: ["deepseek"],
    hosts: ["api.deepseek.com"],
    tone: "from-blue-500 to-indigo-600",
  },
  {
    id: "mistral",
    label: "Mistral",
    keywords: ["mistral"],
    hosts: ["api.mistral.ai"],
    tone: "from-amber-400 to-orange-500",
  },
  {
    id: "byteplus",
    label: "BytePlus",
    keywords: ["byteplus", "modelark", "dola", "seed-2-0", "ark_api_key"],
    hosts: ["ark.ap-southeast.bytepluses.com", "ark.eu-west.bytepluses.com"],
    tone: "from-sky-400 to-indigo-600",
  },
  {
    id: "cohere",
    label: "Cohere",
    keywords: ["cohere"],
    hosts: ["api.cohere.ai"],
    tone: "from-lime-400 to-green-500",
  },
  {
    id: "groq",
    label: "Groq",
    keywords: ["groq"],
    hosts: ["api.groq.com"],
    tone: "from-violet-400 to-indigo-500",
  },
  {
    id: "perplexity",
    label: "Perplexity",
    keywords: ["perplexity"],
    hosts: ["api.perplexity.ai"],
    tone: "from-indigo-400 to-sky-500",
  },
  {
    id: "together",
    label: "Together",
    keywords: ["together", "togetherai"],
    hosts: ["api.together.xyz"],
    tone: "from-pink-400 to-rose-500",
  },
  {
    id: "fireworks",
    label: "Fireworks",
    keywords: ["fireworks"],
    hosts: ["api.fireworks.ai"],
    tone: "from-rose-400 to-red-500",
  },
  {
    id: "huggingface",
    label: "Hugging Face",
    keywords: ["huggingface", "hf.co", "inference"],
    hosts: ["api-inference.huggingface.co", "router.huggingface.co"],
    tone: "from-yellow-400 to-orange-500",
  },
  {
    id: "moonshot",
    label: "Moonshot",
    keywords: ["moonshot", "kimi"],
    hosts: ["api.moonshot.ai"],
    tone: "from-purple-400 to-fuchsia-500",
  },
];

const CURL_EXAMPLE = `curl --request POST \\
  --url https://api.z.ai/api/paas/v4/chat/completions \\
  --header 'Accept-Language: en-US,en' \\
  --header 'Authorization: Bearer <token>' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "model": "glm-5.1",
    "messages": [
      {
        "role": "system",
        "content": "You are a useful AI assistant."
      },
      {
        "role": "user",
        "content": "Please tell us about the development of artificial intelligence."
      }
    ],
    "stream": false,
    "temperature": 1
  }'`;

const MIMO_CURL_EXAMPLE = `curl --request POST \\
  --url https://api.xiaomimimo.com/v1/chat/completions \\
  --header 'api-key: <MIMO_API_KEY>' \\
  --header 'Content-Type: application/json' \\
  --data '{
    "model": "mimo-v2.5-pro",
    "messages": [
      {
        "role": "system",
        "content": "You are MiMo, an AI assistant developed by Xiaomi."
      },
      {
        "role": "user",
        "content": "please introduce yourself"
      }
    ],
    "max_completion_tokens": 1024,
    "temperature": 1,
    "top_p": 0.95,
    "stream": false
  }'`;

function stripShellLineContinuations(input: string) {
  return input.replace(/\\\r?\n/g, " ").replace(/\s+/g, " ").trim();
}

function extractArg(command: string, flags: string[]) {
  for (const flag of flags) {
    const pattern = new RegExp(`${flag}\\s+(?:'([^']*)'|"([^"]*)"|(\\S+))`, "i");
    const match = command.match(pattern);
    if (match) {
      return match[1] ?? match[2] ?? match[3] ?? "";
    }
  }
  return undefined;
}

function extractRepeatedArgs(command: string, flags: string[]) {
  const values: string[] = [];
  for (const flag of flags) {
    const pattern = new RegExp(`${flag}\\s+(?:'([^']*)'|"([^"]*)"|(\\S+))`, "gi");
    for (const match of command.matchAll(pattern)) {
      values.push(match[1] ?? match[2] ?? match[3] ?? "");
    }
  }
  return values;
}

function findSupportedProvider(input: string) {
  const lowered = input.toLowerCase();
  return SUPPORTED_PROVIDERS.find((provider) =>
    provider.keywords.some((keyword) => lowered.includes(keyword.toLowerCase()))
  );
}

function isBlockedHostname(hostname: string) {
  const lowered = hostname.toLowerCase();
  if (
    lowered === "localhost" ||
    lowered.endsWith(".local") ||
    lowered.endsWith(".internal") ||
    lowered.startsWith("127.") ||
    lowered.startsWith("10.") ||
    lowered.startsWith("192.168.") ||
    lowered.startsWith("169.254.")
  ) {
    return true;
  }

  const private172 = lowered.match(/^172\.(\d{1,3})\./);
  return private172 ? Number(private172[1]) >= 16 && Number(private172[1]) <= 31 : false;
}

function parseCurl(input: string): ParsedCurl {
  const normalized = stripShellLineContinuations(input);
  if (!normalized.toLowerCase().startsWith("curl ")) {
    throw new Error("Paste a curl command starting with 'curl'.");
  }

  const provider = findSupportedProvider(normalized);
  if (!provider) {
    throw new Error("Curl must include at least one supported AI provider name.");
  }

  const url = extractArg(normalized, ["--url", "-L\\s*--url"])
    ?? extractArg(normalized, ["curl"]);

  if (!url) {
    throw new Error("Curl must include a URL.");
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error("Curl URL is invalid.");
  }

  if (parsedUrl.protocol !== "https:") {
    throw new Error("Only HTTPS provider endpoints are allowed.");
  }

  if (isBlockedHostname(parsedUrl.hostname)) {
    throw new Error("Private, localhost, and internal network targets are blocked.");
  }

  if (!provider.hosts.some((host) => parsedUrl.hostname === host || parsedUrl.hostname.endsWith(`.${host}`))) {
    throw new Error(`URL host is not allowlisted for ${provider.label}.`);
  }

  const method = (extractArg(normalized, ["--request", "-X"]) ?? "").toUpperCase();
  const headerArgs = extractRepeatedArgs(normalized, ["--header", "-H"]);
  const dataArg = extractArg(normalized, ["--data-raw", "--data-binary", "--data", "-d"]);

  const headers: Record<string, string> = {};
  for (const rawHeader of headerArgs) {
    const separatorIndex = rawHeader.indexOf(":");
    if (separatorIndex === -1) {
      continue;
    }
    const key = rawHeader.slice(0, separatorIndex).trim();
    const value = rawHeader.slice(separatorIndex + 1).trim();
    if (key) {
      headers[key] = value;
    }
  }

  return {
    method: method || (dataArg ? "POST" : "GET"),
    url: parsedUrl.toString(),
    headers,
    body: dataArg,
    provider,
  };
}

function formatResponseBody(body: string) {
  try {
    return JSON.stringify(JSON.parse(body), null, 2);
  } catch {
    return body;
  }
}

export function CurlPlayground() {
  const [curlInput, setCurlInput] = useState(CURL_EXAMPLE);
  const [result, setResult] = useState<CurlExecutionState>({ status: "idle" });
  const [blockedRules, setBlockedRules] = useState<BlockedContent[]>([]);

  useEffect(() => {
    fetchBlockedContent()
      .then((res) => {
        if (res.code === 1009) setBlockedRules(res.result.rules);
      })
      .catch(() => {});
  }, []);

  const detectedProvider = useMemo(() => findSupportedProvider(curlInput), [curlInput]);
  const isMiMoExample = detectedProvider?.id === "mimo";

  const isBlockedByRule = useMemo(() => {
    if (blockedRules.length === 0) return null;
    const lowered = curlInput.toLowerCase();
    for (const rule of blockedRules) {
      if (lowered.includes(rule.pattern.toLowerCase())) {
        return rule;
      }
    }
    return null;
  }, [curlInput, blockedRules]);

  const handleRun = async () => {
    let parsed: ParsedCurl;
    try {
      parsed = parseCurl(curlInput);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid curl command.";
      setResult({
        status: "done",
        ok: false,
        provider: detectedProvider?.label ?? "Unknown",
        url: "",
        responseHeaders: [],
        responseBody: "",
        error: message,
      });
      toast.error(message);
      return;
    }

    if (isBlockedByRule) {
      setResult({
        status: "done",
        ok: false,
        provider: parsed.provider.label,
        url: parsed.url,
        responseHeaders: [],
        responseBody: "",
        error: `Blocked by rule "${isBlockedByRule.pattern}" (${isBlockedByRule.type.replace(/_/g, " ")})`,
      });
      toast.error("Request blocked by content rule", {
        description: `"${isBlockedByRule.pattern}" matches a blocked ${isBlockedByRule.type.replace(/_/g, " ")} rule.`,
      });
      return;
    }

    setResult({ status: "loading" });
    toast.info(`Replaying ${parsed.provider.label} curl in browser…`, {
      icon: <TerminalSquare className="h-4 w-4" />,
    });

    try {
      const response = await fetch(parsed.url, {
        method: parsed.method,
        headers: parsed.headers,
        body: parsed.body,
      });

      const rawBody = await response.text();
      setResult({
        status: "done",
        ok: response.ok,
        statusCode: response.status,
        provider: parsed.provider.label,
        url: parsed.url,
        responseHeaders: Array.from(response.headers.entries()),
        responseBody: formatResponseBody(rawBody).slice(0, 20000),
        error: response.ok ? undefined : `Request failed with ${response.status} ${response.statusText}`,
      });

      if (response.ok) {
        toast.success("Curl replay completed");
      } else {
        toast.error(`Provider responded with ${response.status}`);
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Browser request failed. The provider may block CORS for client-side calls.";

      setResult({
        status: "done",
        ok: false,
        provider: parsed.provider.label,
        url: parsed.url,
        responseHeaders: [],
        responseBody: "",
        error: message,
      });
      toast.error("Browser request failed", {
        description: message,
      });
    }
  };

  const handleCopy = async () => {
    if (result.status !== "done") {
      return;
    }

    const payload = result.responseBody || result.error || "";
    await navigator.clipboard.writeText(payload);
    toast.success("Response copied");
  };

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[2rem] border border-white/10 bg-[#0a0a0a] p-8 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <label className="block font-mono text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40">
              CURL_REPLAY
            </label>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Paste a provider curl and replay it in the browser with `fetch`. The command must reference a supported AI provider and an allowlisted HTTPS host.
            </p>
          </div>
          <div className="hidden sm:inline-flex shrink-0 items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-500">
            <Shield className="h-3.5 w-3.5" />
            Client-side only
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          {SUPPORTED_PROVIDERS.map((provider) => {
            const active = detectedProvider?.id === provider.id;
            return (
              <span
                key={provider.id}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] transition-all",
                  active
                    ? "border-emerald-500/30 bg-emerald-500/10 text-slate-200"
                    : "border-white/5 bg-[#0a0a0a] text-slate-500"
                )}
              >
                <span className={cn("h-2 w-2 rounded-full bg-gradient-to-br", provider.tone)} />
                {provider.label}
              </span>
            );
          })}
          {isBlockedByRule && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-rose-500">
              <ShieldOff className="h-3 w-3" />
              Blocked: {isBlockedByRule.pattern}
            </span>
          )}
          {blockedRules.length > 0 && !isBlockedByRule && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-500">
              <Shield className="h-3 w-3" />
              {blockedRules.length} rule{blockedRules.length > 1 ? "s" : ""} active
            </span>
          )}
        </div>

        {isMiMoExample && (
          <div className="mb-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4">
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-amber-400">
              MiMo SDK example
            </p>
            <pre className="overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-6 text-slate-300 scrollbar-none">
              {MIMO_CURL_EXAMPLE}
            </pre>
          </div>
        )}

        <textarea
          value={curlInput}
          onChange={(event) => setCurlInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.stopPropagation();
            }
          }}
          spellCheck={false}
          className="min-h-[18rem] w-full rounded-2xl border border-white/5 bg-[#050505] p-5 font-mono text-xs leading-6 text-slate-200 outline-none placeholder:text-slate-600 focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5"
          placeholder="Paste a provider curl here…"
        />

        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-slate-500">
            Browser fetch is subject to provider CORS policies. If the provider blocks cross-origin requests, the request will fail even if the curl is valid.
          </p>

          <motion.button
            onClick={handleRun}
            disabled={result.status === "loading"}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-xs font-black uppercase tracking-widest transition-all",
              result.status === "loading"
                ? "cursor-not-allowed bg-white/5 text-slate-600"
                : "bg-white text-black hover:scale-105 active:scale-95"
            )}
            whileHover={result.status === "loading" ? {} : {}}
            whileTap={result.status === "loading" ? {} : { scale: 0.98 }}
          >
            {result.status === "loading" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Replaying…
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Run curl in browser
              </>
            )}
          </motion.button>
        </div>
      </motion.div>

      <AnimateResult result={result} onCopy={handleCopy} />
    </div>
  );
}

function AnimateResult({
  result,
  onCopy,
}: {
  result: CurlExecutionState;
  onCopy: () => Promise<void>;
}) {
  if (result.status === "idle") {
    return null;
  }

  if (result.status === "loading") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-[2rem] border border-white/10 bg-[#0a0a0a] p-8 shadow-xl"
      >
        <div className="flex items-center gap-3 text-sm font-medium text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
          Waiting for provider response…
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-[2rem] border bg-[#0a0a0a] p-8 shadow-xl",
        result.ok ? "border-emerald-500/20" : "border-rose-500/20"
      )}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {result.ok ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-500" />
            )}
            <p className="text-sm font-bold text-slate-200">
              {result.provider} response {result.statusCode ? `(${result.statusCode})` : ""}
            </p>
          </div>
          <p className="mt-2 break-all font-mono text-[11px] text-slate-500">
            {result.url}
          </p>
          {result.error && (
            <p className="mt-3 text-sm text-rose-500">
              {result.error}
            </p>
          )}
        </div>

        <button
          onClick={() => void onCopy()}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 transition-all hover:bg-white/10 hover:text-white"
        >
          <Copy className="h-3.5 w-3.5" />
          Copy output
        </button>
      </div>

      {result.responseHeaders.length > 0 && (
        <div className="mt-5 rounded-2xl border border-white/5 bg-[#050505] p-4">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
            Response headers
          </p>
          <div className="grid gap-2 text-xs text-slate-400 md:grid-cols-2">
            {result.responseHeaders.map(([key, value]) => (
              <div key={`${key}-${value}`} className="rounded-xl border border-white/5 bg-[#0a0a0a] px-3 py-2.5">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-slate-300">
                  {key}
                </span>
                <p className="mt-1 break-all font-mono text-[11px] leading-5">
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 rounded-2xl border border-white/5 bg-[#050505] p-4">
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
          Response body
        </p>
        <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-6 text-slate-300 scrollbar-none">
          {result.responseBody || "No response body returned."}
        </pre>
      </div>
    </motion.div>
  );
}
