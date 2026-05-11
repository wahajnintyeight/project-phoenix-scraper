const API_BASE = "https://api.theprojectphoenix.top/v2/api";
const SESSION_KEY = "phoenix_session";
const SESSION_TTL = 60 * 60 * 1000; // 1 hour

let sessionId: string | null = null;

function getCachedSession(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const { id, ts } = JSON.parse(raw);
    if (Date.now() - ts > SESSION_TTL) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return id;
  } catch {
    return null;
  }
}

function setCachedSession(id: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ id, ts: Date.now() }));
  } catch { /* ignore */ }
}

export function getSessionId(): string | null {
  const cached = getCachedSession();
  if (cached) {
    sessionId = cached;
    return cached;
  }
  return sessionId;
}

export function setSessionId(id: string) {
  sessionId = id;
  setCachedSession(id);
}

export async function createSession(): Promise<string> {
  const cached = getCachedSession();
  if (cached) {
    sessionId = cached;
    return cached;
  }

  const res = await fetch(`${API_BASE}/createSession`, {
    method: "PUT",
    headers: {
      "project-type": "phoenix-scraper",
    },
  });
  const data = await res.json();
  if (data.code === 1007 && data.result) {
    sessionId = data.result;
    setCachedSession(data.result);
    return data.result;
  }
  throw new Error(data.message || "Failed to create session");
}

export interface Visit {
  id: string;
  ip: string;
  country: string;
  country_code: string;
  project_type: string;
  created_at: string;
}

export interface VisitsResponse {
  code: number;
  message: string;
  result: {
    visits: Visit[];
    current_page: number;
    total_pages: number;
  };
}

export async function fetchVisits(
  page = 1,
  project?: string
): Promise<VisitsResponse> {
  const params = new URLSearchParams({ page: page.toString() });
  if (project) params.set("project", project);
  return authenticatedFetch<VisitsResponse>(`/visits?${params.toString()}`);
}

async function authenticatedFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (!getSessionId()) {
    await createSession();
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      sessionId: getSessionId()!,
      ...options.headers,
    },
  });

  const data = await res.json();
  return data;
}

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
