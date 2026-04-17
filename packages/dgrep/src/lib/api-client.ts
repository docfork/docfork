import { AuthError, NetworkError, NotFoundError, RateLimitError } from "./errors.js";
import { VERSION } from "./version.js";

export const API_URL = "https://api.docfork.com/v1";

export interface DgrepAuthConfig {
  apiKey?: string;
  cabinet?: string;
}

/** Extract a human-readable message from an API error response body */
export function parseErrorMessage(text: string, status: number, statusText: string): string {
  try {
    const json = JSON.parse(text);
    // nested: { error: { message } } or flat: { message } or { error: "...", message: "..." }
    const msg = json?.error?.message ?? json?.message ?? json?.error;
    if (typeof msg === "string") return msg;
  } catch {
    // not JSON
  }
  return text.slice(0, 200) || `${status} ${statusText}`;
}

function headers(auth?: DgrepAuthConfig): Record<string, string> {
  const h: Record<string, string> = {
    "User-Agent": `dgrep/${VERSION}`,
    "X-Docfork-Client": `dgrep/${VERSION}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (auth?.apiKey) {
    h["Authorization"] = `Bearer ${auth.apiKey}`;
  }

  if (auth?.cabinet) {
    h["X-Docfork-Cabinet"] = auth.cabinet;
  }

  return h;
}

async function get<T>(
  path: string,
  params: Record<string, string>,
  auth?: DgrepAuthConfig
): Promise<T> {
  const url = new URL(`${API_URL}${path}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      method: "GET",
      headers: headers(auth),
    });
  } catch {
    throw new NetworkError("Could not reach api.docfork.com. Check your connection.");
  }

  if (!response.ok) {
    const text = await response.text();
    if (response.status === 401) {
      throw new AuthError("Invalid API key. Run `dgrep login` to authenticate.");
    }
    if (response.status === 404) {
      throw new NotFoundError(parseErrorMessage(text, 404, "Not Found"));
    }
    if (response.status === 429) {
      throw new RateLimitError("Rate limit reached. Log in for 1K/mo free: `dgrep login`");
    }
    throw new Error(parseErrorMessage(text, response.status, response.statusText));
  }

  return (await response.json()) as T;
}

async function post<T>(path: string, body: unknown, auth?: DgrepAuthConfig): Promise<T> {
  const url = `${API_URL}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: headers(auth),
      body: JSON.stringify(body),
    });
  } catch {
    throw new NetworkError("Could not reach api.docfork.com. Check your connection.");
  }

  if (!response.ok) {
    const text = await response.text();
    if (response.status === 401) {
      throw new AuthError("Invalid API key. Run `dgrep login` to authenticate.");
    }
    if (response.status === 404) {
      throw new NotFoundError(parseErrorMessage(text, 404, "Not Found"));
    }
    if (response.status === 429) {
      throw new RateLimitError("Rate limit reached. Log in for 1K/mo free: `dgrep login`");
    }
    throw new Error(parseErrorMessage(text, response.status, response.statusText));
  }

  return (await response.json()) as T;
}

// -- Resolve packages -----------------------------------

export interface ResolvedPackage {
  package: string;
  identifier: string;
  title?: string;
  status: string;
}

export interface ResolvePackagesResponse {
  resolved: ResolvedPackage[];
  unresolved: string[];
}

export async function resolvePackages(
  packages: string[],
  auth?: DgrepAuthConfig
): Promise<ResolvePackagesResponse> {
  return post<ResolvePackagesResponse>("/libraries/resolve", { packages, registry: "npm" }, auth);
}

// -- Batch search -----------------------------------

export interface BatchSearchResult {
  content: string;
  title: string;
  path: string;
  url: string;
  library: string;
  score: number;
}

export interface BatchSearchResponse {
  object: string;
  results: BatchSearchResult[];
  meta: {
    query: string;
    libraries: {
      resolved: string[];
      unresolved: string[];
    };
    reranked: boolean;
    usage: {
      chunks_searched: number;
      chunks_returned: number;
      embedding_tokens: number;
    };
    performance: {
      latency_ms: number;
    };
  };
}

export async function batchSearchDocs(
  query: string,
  libraries: string[],
  auth?: DgrepAuthConfig,
  limit?: number
): Promise<BatchSearchResponse> {
  return post<BatchSearchResponse>("/search", { query, libraries, limit: limit ?? 10 }, auth);
}

// -- Search docs (legacy, single library) -----------------------------------

export interface SearchSection {
  url: string;
  title: string;
  description: string;
}

export interface SearchDocsResponse {
  sections: SearchSection[];
  truncated?: boolean;
}

export async function searchDocs(
  query: string,
  library: string,
  auth?: DgrepAuthConfig
): Promise<SearchDocsResponse> {
  return get<SearchDocsResponse>("/search", { query, library }, auth);
}

// -- Read doc content -----------------------------------

export interface ReadUrlResponse {
  text: string;
  library_identifier: string;
  version_info: string;
}

export async function readUrl(
  url: string,
  auth?: DgrepAuthConfig,
  tokens?: number
): Promise<ReadUrlResponse> {
  const params: Record<string, string> = { url };
  if (tokens) params.tokens = String(tokens);
  return get<ReadUrlResponse>("/read", params, auth);
}

// -- Key exchange (login) -----------------------------------

export interface ExchangeResponse {
  apiKey: string;
  email: string;
  orgName: string;
  orgSlug: string;
}

export async function exchangeKey(
  workosAccessToken: string,
  unclaimedApiKey?: string
): Promise<ExchangeResponse> {
  return post<ExchangeResponse>("/keys/exchange", {
    workosAccessToken,
    ...(unclaimedApiKey ? { unclaimedApiKey } : {}),
  });
}

// -- Key provision (wizard) -----------------------------------

export interface ProvisionResponse {
  api_key: string;
  key_prefix: string;
  organization_id: string;
  expires_at: string;
  claim_url: string;
}

export async function provisionKey(): Promise<ProvisionResponse> {
  return post<ProvisionResponse>("/keys/provision", {});
}

// -- Search catalog -----------------------------------

export interface CatalogLibrary {
  id: string;
  name: string;
  identifier: string;
}

export interface SearchCatalogResponse {
  libraries: CatalogLibrary[];
}

export async function searchCatalog(
  query: string,
  auth?: DgrepAuthConfig
): Promise<SearchCatalogResponse> {
  return get<SearchCatalogResponse>("/libraries/search", { q: query }, auth);
}
