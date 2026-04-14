<p align="center">
  <a href="https://docfork.com">
    <picture>
      <source srcset="logo_light.png" media="(prefers-color-scheme: dark)">
      <source srcset="logo_dark.png" media="(prefers-color-scheme: light)">
      <img src="logo_light.png" alt="Docfork" height="40" />
    </picture>
  </a>
</p>
<p align="center">Context for AI Coding Agents.</p>

<p align="center">
  <a href="https://docfork.com"><img alt="Website" src="https://img.shields.io/badge/Website-docfork.com-blue?style=flat-square" /></a>&nbsp;&nbsp;<a href="https://www.npmjs.com/package/docfork"><img alt="npm" src="https://img.shields.io/npm/v/docfork?style=flat-square&color=red" /></a>&nbsp;&nbsp;<a href="https://www.npmjs.com/package/docfork"><img alt="npm downloads" src="https://img.shields.io/npm/dm/docfork?style=flat-square" /></a>&nbsp;&nbsp;<a href="https://github.com/docfork/docfork"><img alt="GitHub stars" src="https://img.shields.io/github/stars/docfork/docfork?style=flat-square" /></a>
</p>

<p align="center">
  <img src="demo.gif" alt="Docfork demo" />
</p>

AI agents hallucinate APIs. They write code from frozen training snapshots: the method was renamed, the config shape changed, you asked for Hono and got Express.

Docfork indexes documentation and serves it to agents before they generate code.

### Without Docfork

```diff
  app.use('/api/*', jwt({ secret: ... }))
-                       ^^^ removed in Hono v4
```

### With Docfork

```diff
  app.use('/api/*', bearerAuth({ verifyToken: ... }))
+                       ^^^ current API, Hono v4.2
```

## Get Started

```bash
npx dgrep setup --cursor
```

Installs the Docfork MCP server in your IDE. Detects your dependencies, provisions an API key, and writes the config file. Also supports `--claude` and `--opencode`.

Your agent now has two tools:

| Tool | Returns |
| --- | --- |
| `search_docs` | Ranked documentation sections with titles, URLs, and relevance scores. |
| `fetch_doc` | Full rendered markdown content from a documentation URL. |

No prompt suffix needed:

```
Set up server-side rendering with Next.js App Router.
```

Or search from the terminal:

```bash
dgrep search "middleware redirect based on authentication" -l vercel/next.js
dgrep search "server actions with forms" -l vercel/next.js
```

[Quickstart →](https://docfork.com/docs/quickstart) · [dgrep docs →](https://docfork.com/docs/dgrep) · [CLI reference →](https://docfork.com/docs/reference/cli)

## Teams

Free: 1,000 requests/month per organization. For team rollout, commit the MCP config to your repo:

```json
// .cursor/mcp.json (committed to git, picked up by every engineer)
{
  "mcpServers": {
    "docfork": {
      "url": "https://mcp.docfork.com/mcp",
      "headers": {
        "DOCFORK_API_KEY": "YOUR_TEAM_API_KEY"
      }
    }
  }
}
```

Share API keys and [Cabinets](https://docfork.com/docs/cabinets) across your organization. Docfork doesn't store your code or prompts. [Security →](https://docfork.com/security) · [Pricing →](https://docfork.com/pricing)

## MCP Setup

> **Recommended:** Run `npx dgrep setup --cursor` (or `--claude`, `--opencode`) to install automatically. Manual config below for other clients.

**Cursor** — <a href="https://cursor.com/en/install-mcp?name=docfork&config=eyJ1cmwiOiJodHRwczovL21jcC5kb2Nmb3JrLmNvbS9tY3AifQ%3D%3D"><img src="https://cursor.com/deeplink/mcp-install-dark.svg" height="20" alt="Add to Cursor"/></a>

```json
{
  "mcpServers": {
    "docfork": {
      "url": "https://mcp.docfork.com/mcp",
      "headers": {
        "DOCFORK_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

**Claude Code**

```bash
claude mcp add --transport http docfork https://mcp.docfork.com/mcp --header "DOCFORK_API_KEY: YOUR_API_KEY"
```

**OpenCode**

```jsonc
{
  "mcp": {
    "docfork": {
      "type": "remote",
      "url": "https://mcp.docfork.com/mcp",
      "headers": { "DOCFORK_API_KEY": "YOUR_API_KEY" },
      "enabled": true
    }
  }
}
```

**[All 29 clients →](https://docfork.com/docs/mcp/setup)** · [OAuth →](https://docfork.com/docs/authentication#oauth-20)

## Agent Rule

Add a rule so your agent calls Docfork automatically. [Full rule and IDE-specific setup →](https://docfork.com/docs/mcp/best-practices)

## FAQ

**How is Docfork different from Context7?**
Both provide MCP servers and CLIs for searching library documentation. Here are the key differences:

- **Stack scoping.** `dgrep init` reads your `package.json` and scopes all searches to your declared dependencies. Cabinets let you version-pin those libraries across a team.
- **Resolve once, search many.** `dgrep init` resolves package names to canonical identifiers once and caches the mapping in `.dgrep/config.json`. No per-query resolution step.
- **Hybrid search.** Semantic search and BM25 run in parallel, fused via Reciprocal Rank Fusion. AST-aware chunking preserves function boundaries.

**Does Docfork store my code or prompts?**
Your code and prompts never leave your machine. At search time, only the query and library name are sent to Docfork — queries are not stored. Indexed documentation content lives in an upstream vector store; private library content is end-to-end encrypted and deleted atomically when you remove the library. [Security →](https://docfork.com/security)

**What libraries are supported?**
Docfork maintains a curated catalog of popular frameworks. Add any public or private GitHub repository as a custom library. [Add custom libraries →](https://docfork.com/docs/libraries#custom-libraries)

## Docs

- [Quickstart](https://docfork.com/docs/quickstart)
- [How Docfork Works](https://docfork.com/docs/how-it-works)
- [dgrep CLI](https://docfork.com/docs/dgrep)
- [Docfork MCP](https://docfork.com/docs/mcp)
- [Libraries](https://docfork.com/docs/libraries)
- [Cabinets](https://docfork.com/docs/cabinets)
- [Troubleshooting](https://docfork.com/docs/troubleshooting)

## Community

- **[Changelog](https://docfork.com/changelog)**
- **[X (Twitter)](https://x.com/docfork_ai)**
- Found an issue? [Open a GitHub issue](https://github.com/docfork/docfork/issues) or [contact us](mailto:support@docfork.com).

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=docfork/docfork&type=Date)](https://www.star-history.com/#docfork/docfork&Date)

## License

MIT
