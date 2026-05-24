# @docfork/sdk

Official TypeScript SDK for the [Docfork API](https://docfork.com/docs/api). Index, search, and read documentation for AI coding agents.

```bash
pnpm add @docfork/sdk
# or: npm install @docfork/sdk / yarn add @docfork/sdk / bun add @docfork/sdk
```

Requires Node 18+ (uses native `fetch`).

## Quickstart

```ts
import { Docfork } from "@docfork/sdk";

const docfork = new Docfork("docf_...");
// or: new Docfork({ apiKey: "docf_..." })
// or: new Docfork()  // reads DOCFORK_API_KEY from env

// 1. discover the library identifier
const libs = await docfork.libraries.search("next");
const next = libs[0].identifier; // → "vercel/next.js"

// 2. search docs across that library
const { results } = await docfork.search("middleware authentication", {
  libraries: [next],
  limit: 5,
});

// 3. read a single section
const doc = await docfork.read(results[0].url);
console.log(doc.text);
```

An API key is required. Get one at [app.docfork.com](https://app.docfork.com).

## Why the 3-step quickstart

`docfork.search(query, { libraries })` requires you to pass at least one library identifier (e.g. `"vercel/next.js"`). The natural-feeling first call — `docfork.search("query")` alone — won't typecheck. Use `libraries.search(q)` first to discover identifiers, then pass them to `search()`.

## Reference

### `new Docfork(apiKey?, options?)` / `new Docfork(options?)`

| Param         | Type     | Default                  | Notes                                                |
| ------------- | -------- | ------------------------ | ---------------------------------------------------- |
| `apiKey`      | `string` | `process.env.DOCFORK_API_KEY` | Required. Throws at construction if neither resolves. |
| `baseUrl`     | `string` | `"https://api.docfork.com"` | Override for staging or proxies.                    |
| `fetch`       | `fetch`  | `globalThis.fetch`       | Inject a custom fetch (testing, runtime adapters).  |

### `docfork.search(query, opts)` → `SearchResponse`

Search documentation across one or more libraries.

```ts
await docfork.search("middleware authentication", {
  libraries: ["vercel/next.js", "auth0/nextjs-auth0"], // required, 1–20 identifiers
  limit: 10,                                            // optional, default 10, max 100
  include_content: true,                                // optional, default true
});
```

When `include_content: false`, each section's `content` is an empty string — preview mode for cheap discovery. Follow up with `docfork.read(url)` to fetch bodies.

### `docfork.read(url, opts?)` → `ReadResponse`

Read a single documentation section by URL. Rate-limited 30/min per key.

```ts
await docfork.read("https://nextjs.org/docs/middleware", {
  tokens: 20_000,             // optional, token budget for the response (default 20,000, max 1,000,000)
  cabinet: "my-cabinet-slug", // optional, scopes the read to a cabinet
});
```

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

List versions for a library. Cursor-paginated. Returns a `Page<T>` with async-iterator + `.next()` + `.toArray()`.

```ts
// stream every version
for await (const v of docfork.libraries.versions("vercel/next.js")) {
  console.log(v.tag);
}

// auto-collect with cap
const all = await docfork.libraries.versions("vercel/next.js").toArray({ limit: 500 });

// page-by-page (the request_id on each page is useful in support tickets)
const page = await docfork.libraries.versions("vercel/next.js");
console.log(page.request_id);
const next = await page.next();
```

`LibraryVersion.tag === "latest"` is a sentinel for the newest untagged version.

## Errors

Every failure throws a typed subclass of `DocforkError`. Branch on `instanceof` or on the discriminator fields (`err.type`, `err.status`).

| Status        | Class                  | Envelope `type`               |
| ------------- | ---------------------- | ----------------------------- |
| 401           | `AuthenticationError`  | `authentication_error`        |
| 400           | `InvalidRequestError`  | `invalid_request_error`       |
| 402, 429      | `RateLimitError`       | `rate_limit_error`            |
| 5xx + network | `APIError`             | `api_error`                   |

```ts
import { Docfork, RateLimitError } from "@docfork/sdk";

try {
  await docfork.search(query, { libraries: [id] });
} catch (err) {
  if (err instanceof RateLimitError) {
    console.warn(`rate-limited; request id: ${err.requestId}`);
  } else throw err;
}
```

Every error carries `requestId` (from the `Request-Id` response header) — cite it in support tickets.

## Method-naming convention

- **Positional id when one canonical identifier exists.** `libraries.retrieve(id)`, `libraries.versions(id, opts?)`.
- **Options object otherwise.** `search(query, { libraries, ... })`, `libraries.search(q, opts?)`.
- This convention is load-bearing for future write methods (`libraries.create({ ... })`, `libraries.update(id, { ... })`).

## Links

- Docs: <https://docfork.com/docs/sdk>
- API reference: <https://docfork.com/docs/api>
- Dashboard: <https://app.docfork.com>
- Source: <https://github.com/docfork/docfork/tree/main/packages/sdk>
- Issues: <https://github.com/docfork/docfork/issues>

## License

MIT
