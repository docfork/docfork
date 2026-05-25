# @docfork/sdk

Official TypeScript SDK for the [Docfork API](https://docfork.com/docs/api). Search and read documentation for AI coding agents.

## Documentation

Full reference: <https://docfork.com/docs/sdk>

## Requirements

Node 18 or later (uses native `fetch`).

## Installation

```sh
npm install @docfork/sdk
```

Also available via `pnpm add @docfork/sdk`, `yarn add @docfork/sdk`, or `bun add @docfork/sdk`.

## Usage

```ts
import { Docfork } from "@docfork/sdk";

const docfork = new Docfork("docf_...");
// or: new Docfork({ apiKey: "docf_..." })
// or: new Docfork()  // reads DOCFORK_API_KEY from env

// 1. discover a library identifier
const libs = await docfork.libraries.search("next");
console.log(libs[0].identifier);
// 'vercel/next.js'

// 2. search docs across that library
const res = await docfork.search("middleware authentication", {
  libraries: ["vercel/next.js"],
  limit: 5,
});
console.log(res.results.length, res.results[0].title);
// 5 'Middleware'

// 3. read a single section
const doc = await docfork.read(res.results[0].url);
console.log(doc.text.slice(0, 60));
// 'Next.js middleware lets you run code before a request is...'
```

An API key is required. Get one at [app.docfork.com](https://app.docfork.com).

### Why the 3-step flow

`docfork.search(query, { libraries })` requires at least one library identifier (e.g. `"vercel/next.js"`). Use `libraries.search(q)` first to discover identifiers, then pass them to `search()`.

## Handling errors

Every failure throws a typed subclass of `DocforkError`. Branch on `instanceof` or on the discriminator fields (`err.type`, `err.status`). Every error carries `requestId` (a UUID from the `Request-Id` response header). Cite it in support tickets.

| Status        | Class                 | Envelope `type`         |
| ------------- | --------------------- | ----------------------- |
| 401           | `AuthenticationError` | `authentication_error`  |
| 400           | `InvalidRequestError` | `invalid_request_error` |
| 402, 429      | `RateLimitError`      | `rate_limit_error`      |
| 5xx + network | `APIError`            | `api_error`             |

```ts
import {
  Docfork,
  AuthenticationError,
  InvalidRequestError,
  RateLimitError,
  APIError,
} from "@docfork/sdk";

try {
  await docfork.search(query, { libraries: [id] });
} catch (err) {
  // every subclass carries err.requestId, err.type, err.status, err.code
  if (err instanceof RateLimitError) {
    console.warn(`rate-limited; request_id=${err.requestId}`);
  } else if (err instanceof AuthenticationError) {
    console.error(`bad key; request_id=${err.requestId}`);
  } else if (err instanceof InvalidRequestError) {
    console.error(`bad input: ${err.message}; request_id=${err.requestId}`);
  } else if (err instanceof APIError) {
    console.error(`upstream failure; request_id=${err.requestId}`);
  } else throw err;
}
```

## Pagination with `Page<T>`

Paginated endpoints return a `Page<T>`. Each page carries its own `request_id` (UUID) so multi-hop scans stay debuggable.

```ts
// 1. async iterator: stream every item across pages
for await (const v of docfork.libraries.versions("vercel/next.js")) {
  console.log(v.tag);
}

// 2. auto-collect into an array with a safety cap
const all = await docfork.libraries
  .versions("vercel/next.js")
  .toArray({ limit: 500 });

// 3. page-by-page; each page carries request_id
const page = await docfork.libraries.versions("vercel/next.js");
console.log(page.request_id, page.data.length);
// '7a3f8b2c-1e4d-4b9e-9c3a-5d8e9f0a1b2c' 50

const more = page.has_more ? await page.next() : null;
```

In v0.0.1 only `libraries.versions` paginates. `libraries.search` returns a flat top-K list.

## Testing

Inject a mock `fetch` via the constructor. Works with vitest, jest, or any test runner.

```ts
import { it, expect, vi } from "vitest";
import { Docfork } from "@docfork/sdk";

it("calls /v1/search", async () => {
  const fetch = vi.fn().mockResolvedValue(
    new Response(
      JSON.stringify({
        object: "search_result",
        results: [],
        meta: {
          query: "middleware",
          libraries: { resolved: ["vercel/next.js"], unresolved: [] },
          usage: {
            chunks_searched: 0,
            chunks_returned: 0,
            embedding_tokens: 0,
          },
          performance: { latency_ms: 0 },
        },
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    ),
  );
  const docfork = new Docfork({ apiKey: "docf_test", fetch });

  await docfork.search("middleware", { libraries: ["vercel/next.js"] });

  expect(fetch).toHaveBeenCalledWith(
    expect.stringContaining("/v1/search"),
    expect.objectContaining({ method: "POST" }),
  );
});
```

## TypeScript

All response shapes and primitives are exported as types.

```ts
import type {
  SearchResponse,
  ReadResponse,
  Library,
  LibraryVersion,
  Page,
} from "@docfork/sdk";
```

## Reference

### `new Docfork(apiKey?, options?)` / `new Docfork(options?)`

| Param     | Type     | Default                       | Notes                                                 |
| --------- | -------- | ----------------------------- | ----------------------------------------------------- |
| `apiKey`  | `string` | `process.env.DOCFORK_API_KEY` | Required. Throws at construction if neither resolves. |
| `baseUrl` | `string` | `"https://api.docfork.com"`   | Override for staging or proxies.                      |
| `fetch`   | `fetch`  | `globalThis.fetch`            | Inject a custom fetch (testing, runtime adapters).    |

### `docfork.search(query, opts)` → `SearchResponse`

Search documentation across one or more libraries.

```ts
await docfork.search("middleware authentication", {
  libraries: ["vercel/next.js", "auth0/nextjs-auth0"], // required, 1–20 identifiers
  limit: 10, // optional, default 10, max 100
  include_content: true, // optional, default true
});
```

Returns `{ object: "search_result", results: SearchSection[], meta: SearchMeta }`. `meta` includes resolved/unresolved library identifiers, usage counts, and server-side latency.

When `include_content: false`, each section's `content` is an empty string. Follow up with `docfork.read(url)` to fetch bodies.

### `docfork.read(url, opts?)` → `ReadResponse`

Read a single documentation section by URL. Rate-limited 30/min per key.

```ts
await docfork.read("https://nextjs.org/docs/middleware", {
  tokens: 20_000, // optional, leading-token budget (default 20,000, max 1,000,000)
  cabinet: "my-cabinet-slug", // optional, scopes the read to a Cabinet
});
```

Returns `{ text, tokens, library_identifier, version_info, url, source, metadata? }` where `source` is `"indexed"` or `"live"` (live-scrape fallback).

### `docfork.libraries.search(q, opts?)` → `Library[]`

Search the public library catalog. Returns ranked libraries directly (no envelope).

```ts
await docfork.libraries.search("react", { limit: 20 }); // optional, default 20, max 100
```

### `docfork.libraries.retrieve(identifier)` → `Library`

Fetch a single public library.

```ts
await docfork.libraries.retrieve("vercel/next.js");
```

### `docfork.libraries.versions(identifier, opts?)` → `Page<LibraryVersion>`

List versions for a library. Cursor-paginated. See [Pagination with `Page<T>`](#pagination-with-paget) above for consumption patterns.

```ts
await docfork.libraries.versions("vercel/next.js", {
  page_size: 50, // optional, default 50, max 100
  start_cursor: "...", // optional, omit for the first page
});
```

`LibraryVersion.tag === "latest"` is a sentinel for the newest untagged version.

## Method-naming convention

- **Positional id when one canonical identifier exists.** `libraries.retrieve(id)`, `libraries.versions(id, opts?)`.
- **Options object otherwise.** `search(query, { libraries, ... })`, `libraries.search(q, opts?)`.
- This convention is load-bearing for future write methods (`libraries.create({ ... })`, `libraries.update(id, { ... })`).

## Retries and timeouts

This SDK does not auto-retry failed requests, and uses the runtime's default `fetch` timeout. Wire retries, backoff, and timeouts into your application layer to match your reliability budget.

```ts
// example: per-call timeout via AbortSignal + custom fetch
const docfork = new Docfork({
  apiKey: "docf_...",
  fetch: (url, init) =>
    globalThis.fetch(url, { ...init, signal: AbortSignal.timeout(10_000) }),
});
```

## FAQ

### Can I use this in the browser?

No. API keys grant full quota access to your organization. Putting one in client-side JavaScript exposes it to anyone who opens devtools. Run the SDK from a server, edge function, or backend worker, and proxy requests from the browser through your own endpoint.

### Does this work in Vercel Edge, Cloudflare Workers, Deno, or Bun?

The SDK only uses native `fetch` and standard ES modules, so it should run in any modern JavaScript runtime. We test on Node 18+ as the baseline. If you hit a runtime-specific bug, please file an issue.

### How do I report a bug or request a feature?

Open an issue at <https://github.com/docfork/docfork/issues>. Include the `request_id` from any thrown error or `Page<T>` result. It lets us trace your call end-to-end.

## Semantic versioning

This SDK generally follows SemVer. While we are on `0.x`, breaking changes may ship in minor versions as the surface stabilizes. Once `1.0` ships, breaking changes will be confined to major versions, except for:

1. Changes that only affect static types, without breaking runtime behavior.
2. Changes to library internals which are technically public but not intended or documented for external use.
3. Changes that we do not expect to impact the vast majority of users in practice.

We take backwards-compatibility seriously and work hard to ensure you can rely on a smooth upgrade experience.

## Links

- Docs: <https://docfork.com/docs/sdk>
- API reference: <https://docfork.com/docs/api>
- Dashboard: <https://app.docfork.com>
- Source: <https://github.com/docfork/docfork/tree/main/packages/sdk>
- Issues: <https://github.com/docfork/docfork/issues>

## License

MIT
