const API_BASE = "https://api.theprojectphoenix.top/v2/api";

let sessionId: string | null = null;

export async function createSession(): Promise<string> {
  const res = await fetch(`${API_BASE}/createSession`, {
    method: "PUT",
  });
  const data = await res.json();
  if (data.code === 1007 && data.result) {
    sessionId = data.result;
    return data.result;
  }
  throw new Error(data.message || "Failed to create session");
}

export function getSessionId(): string | null {
  return sessionId;
}

export function setSessionId(id: string) {
  sessionId = id;
}

async function authenticatedFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (!sessionId) {
    await createSession();
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      sessionId: sessionId!,
      ...options.headers,
    },
  });

  const data = await res.json();
  return data;
}

// Types
export interface Reference {
  id: string;
  api_key_id: string;
  repo_url: string;
  repo_owner: string;
  repo_name: string;
  file_url: string;
  file_path: string;
  found_at: string;
}

export interface ApiKey {
  id: string;
  key_value: string;
  provider: string;
  status: "Valid" | "Invalid" | "Pending" | "Error" | "ValidNoCredits";
  created_at: string;
  validated_at: string;
  last_seen_at?: string;
  error_count: number;
  repo_refs?: string[];
  references?: Reference[];
  credits?: {
    total_credits?: number;
    total_usage?: number;
    checked_at?: string;
  };
}

export interface KeysResponse {
  code: number;
  message: string;
  result: {
    total_pages: number;
    current_page: number;
    keys: ApiKey[];
  };
}

export interface ValidKeysResponse {
  code: number;
  message: string;
  result: {
    keys: ApiKey[];
  };
}

export interface Stats {
  total_keys: number;
  valid_keys: number;
  invalid_keys: number;
  pending_keys: number;
  error_keys: number;
  by_provider: Record<string, number>;
  last_scraped_at?: string;
  last_validated_at?: string;
}

export interface StatsResponse {
  code: number;
  message: string;
  result: Stats;
}

export interface SearchQuery {
  _id: string;
  provider: string;
  query: string;
  enabled: boolean;
  created_at: string;
}

export interface QueriesResponse {
  code: number;
  message: string;
  result: {
    queries: SearchQuery[];
  };
}

// API Functions
export async function fetchKeys(
  page = 1,
  provider?: string,
  status?: string
): Promise<KeysResponse> {
  const params = new URLSearchParams({ page: page.toString() });
  if (provider) params.set("provider", provider);
  if (status) params.set("status", status);
  return authenticatedFetch<KeysResponse>(`/keys?${params.toString()}`);
}

export async function fetchValidKeys(): Promise<ValidKeysResponse> {
  return authenticatedFetch<ValidKeysResponse>("/keys/valid");
}

export async function fetchStats(): Promise<StatsResponse> {
  return authenticatedFetch<StatsResponse>("/stats");
}

export async function fetchQueries(): Promise<QueriesResponse> {
  return authenticatedFetch<QueriesResponse>("/config/queries");
}

export async function createQuery(
  provider: string,
  query: string,
  enabled = true
): Promise<{ code: number; message: string; result: SearchQuery }> {
  return authenticatedFetch("/config/queries", {
    method: "POST",
    body: JSON.stringify({ provider, query, enabled }),
  });
}

export async function deleteQuery(
  id: string
): Promise<{ code: number; message: string; result: null }> {
  return authenticatedFetch(`/config/queries/${id}`, {
    method: "DELETE",
  });
}

// Key Tester

export interface KeyTestResult {
  provider: string;
  status: "Valid" | "Invalid" | "ValidNoCredits" | "Error";
  credits?: {
    total_credits?: number;
    total_usage?: number;
  };
  response?: string;
  error?: string;
}

export interface KeyTestResponse {
  code: number;
  result: KeyTestResult;
}

export async function validateKey(
  keyValue: string,
  provider: string,
  model?: string
): Promise<KeyTestResponse> {
  return authenticatedFetch<KeyTestResponse>("/validate-key", {
    method: "POST",
    body: JSON.stringify({ key_value: keyValue, provider, model }),
  });
}

export interface OpenRouterArchitecture {
  modality?: string;
  input_modalities?: string[];
  output_modalities?: string[];
  tokenizer?: string;
  instruct_type?: string;
}

export interface OpenRouterPricing {
  prompt?: string;
  completion?: string;
  request?: string;
  image?: string;
}

export interface OpenRouterModel {
  id: string;
  name?: string;
  created?: number;
  context_length?: number;
  pricing?: OpenRouterPricing;
  architecture?: OpenRouterArchitecture;
  description?: string;
}

export interface OpenRouterModelsResponse {
  provider: string;
  models: OpenRouterModel[];
  count: number;
}

export async function fetchOpenRouterModels(apiKey: string): Promise<OpenRouterModelsResponse> {
  const response = await authenticatedFetch<{
    code: number;
    result: OpenRouterModelsResponse;
  }>(
    `/validate-key/openrouter-models?api_key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
    }
  );

  return response.result;
}
