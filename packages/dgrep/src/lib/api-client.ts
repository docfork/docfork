import { AuthError, NetworkError, NotFoundError, RateLimitError } from "./errors.js";

const API_URL = "https://api.docfork.com/v1";
const VERSION = "0.1.0";

export interface DgrepAuthConfig {
  apiKey?: string;
  cabinet?: string;
}

function headers(auth?: DgrepAuthConfig): Record<string, string> {
  const h: Record<string, string> = {
    "User-Agent": `dgrep/${VERSION}`,
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
      throw new NotFoundError(text.slice(0, 200) || "Resource not found.");
    }
    if (response.status === 429) {
      throw new RateLimitError("Rate limit reached. Log in for 1K/mo free: `dgrep login`");
    }
    throw new Error(`${response.status} ${response.statusText}: ${text.slice(0, 500)}`);
  }

  return (await response.json()) as T;
}

// -- Search docs -----------------------------------

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

export async function readUrl(url: string, auth?: DgrepAuthConfig): Promise<ReadUrlResponse> {
  return get<ReadUrlResponse>("/read", { url }, auth);
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
