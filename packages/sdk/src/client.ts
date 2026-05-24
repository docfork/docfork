// composes generated flat functions into a class with positional-primary signatures.

import { createClient, type Client } from "./gen/client";
import {
  searchDocumentation,
  readDocument,
  searchPublicLibraries,
  getPublicLibrary,
  listPublicLibraryVersions,
} from "./gen/sdk.gen";
import type {
  Library,
  LibraryVersion,
  ReadResponse,
  SearchResponse,
} from "./gen/types.gen";
import { wrapClientError } from "./errors";
import { Page } from "./pagination";

export interface DocforkOptions {
  apiKey?: string;
  baseUrl?: string;
  fetch?: typeof fetch;
}

const DEFAULT_BASE_URL = "https://api.docfork.com";

export class Docfork {
  readonly #client: Client;
  readonly libraries: LibrariesResource;

  constructor(
    apiKeyOrOptions?: string | DocforkOptions,
    maybeOptions?: DocforkOptions,
  ) {
    const opts: DocforkOptions =
      typeof apiKeyOrOptions === "object" && apiKeyOrOptions !== null
        ? apiKeyOrOptions
        : { apiKey: apiKeyOrOptions, ...maybeOptions };

    const apiKey = opts.apiKey ?? process.env.DOCFORK_API_KEY;
    if (!apiKey) {
      throw new Error(
        "Missing API key.\n" +
          "Pass `new Docfork('docf_...')` or set DOCFORK_API_KEY. " +
          "Get a key at https://app.docfork.com.",
      );
    }

    this.#client = createClient({
      baseUrl: opts.baseUrl ?? DEFAULT_BASE_URL,
      fetch: opts.fetch,
      throwOnError: true, // surface failures as typed DocforkError subclasses
      auth: () => apiKey,
    });
    this.#client.interceptors.error.use(wrapClientError);
    this.libraries = new LibrariesResource(this.#client);
  }

  /**
   * Search documentation across one or more libraries. Returns scored section results.
   * @param query natural-language query, 3–2000 chars.
   * @param opts.libraries 1–20 library identifiers (e.g. ["vercel/next.js"]).
   * @param opts.limit top-K cap (default 10, max 100). search is single-shot + reranked.
   * @param opts.include_content false → titles + urls only (follow up with read(url) for bodies).
   */
  async search(
    query: string,
    opts: { libraries: string[]; limit?: number; include_content?: boolean },
  ): Promise<SearchResponse> {
    const { data } = await searchDocumentation({
      client: this.#client,
      body: { query, ...opts },
      throwOnError: true,
    });
    return data;
  }

  /**
   * Read the indexed content for a single documentation URL.
   * @param url documentation url (typically from a search result).
   * @param opts.tokens leading-token budget (default 20,000, max 1,000,000).
   * @param opts.cabinet optional cabinet slug to scope the read; requires an api key.
   */
  async read(
    url: string,
    opts?: { tokens?: number; cabinet?: string },
  ): Promise<ReadResponse> {
    const { data } = await readDocument({
      client: this.#client,
      query: { url, ...opts },
      throwOnError: true,
    });
    return data;
  }
}

class LibrariesResource {
  readonly #client: Client;

  constructor(client: Client) {
    this.#client = client;
  }

  /**
   * Search the public library catalog. Top-K only, NOT cursor-paginated.
   * Returns ranked Library[] directly (no envelope).
   */
  async search(q: string, opts?: { limit?: number }): Promise<Library[]> {
    const { data } = await searchPublicLibraries({
      client: this.#client,
      query: { q, ...opts },
      throwOnError: true,
    });
    return data.data;
  }

  /** Get a single public library by identifier (e.g. "vercel/next.js"). */
  async retrieve(identifier: string): Promise<Library> {
    const { data } = await getPublicLibrary({
      client: this.#client,
      path: { identifier },
      throwOnError: true,
    });
    return data;
  }

  /**
   * List versions for a public library. Cursor-paginated; returns Page<T> with
   * async-iterator + .next() + .toArray({ limit }).
   *
   * @example
   *   for await (const v of docfork.libraries.versions("vercel/next.js")) { ... }
   *   const all = await docfork.libraries.versions("vercel/next.js").toArray({ limit: 500 });
   */
  async versions(
    identifier: string,
    opts?: { page_size?: number; start_cursor?: string },
  ): Promise<Page<LibraryVersion>> {
    const fetcher = async (cursor?: string): Promise<Page<LibraryVersion>> => {
      const { data, response } = await listPublicLibraryVersions({
        client: this.#client,
        path: { identifier },
        query: { ...opts, ...(cursor ? { start_cursor: cursor } : {}) },
        throwOnError: true,
      });
      return new Page(
        {
          data: data.data,
          next_cursor: data.next_cursor,
          has_more: data.has_more,
          request_id: response.headers.get("request-id") ?? "",
        },
        fetcher,
      );
    };
    return fetcher(opts?.start_cursor);
  }
}
