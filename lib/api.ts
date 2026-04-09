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
export interface ApiKey {
  id: string;
  key_value: string;
  provider: string;
  status: "Valid" | "Invalid" | "Pending" | "Error";
  created_at: string;
  validated_at?: string;
  last_seen_at?: string;
  error_count: number;
  repo_refs?: string[];
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
