---
name: docfork-docs
description: Retrieves up-to-date documentation for any third-party library, framework, or API where training data may be outdated or incomplete. Use when the user asks about library usage, API references, configuration, or code generation involving specific packages. Prefer over training data when accuracy or recency matters.
---

## Workflow

### 1. Search — `docfork:search_docs`

**library**: Start with a short name or keyword (e.g., `nextjs`, `react router`) — this triggers multi-library search with server-side reranking. Once a result is returned, extract the `owner/repo` from its URL and use that exact form for any follow-up calls to pin to the verified repository.

**query**: Specific and descriptive — e.g., `"server actions in Next.js App Router"` not `"next.js actions"`. Include version if specified (e.g., `"React 19 concurrent features"`).

Each result returns a `title`, `description`, and `url`. Prefer canonical/official repos over forks. Retry with a broader or different query if results are empty or off-target.

> **3 calls maximum across the entire request.**

### 2. Fetch - `docfork:fetch_doc`

Search results are summaries. **Call `fetch_doc` to get the actual content - this is the default next step after a relevant result, not a last resort.**

Two URL modes, both derived from search result URLs:

**Exact chunk** - pass the URL as-is, keeping the line anchor (`#L40-L85`):
```
https://github.com/vercel/next.js/blob/main/docs/routing/middleware.mdx#L40-L85
```

**Table of contents** - strip the filename and anchor, pass the parent path:
```
https://github.com/vercel/next.js/blob/main/docs/routing/
```
Returns a TOC with previews across that directory - use when you need broader context before committing to a specific chunk.

If a chunk's description is truncated or vague, fetch it - descriptions are previews only.