[![Docfork cover](https://docfork.com/cover.png)](https://docfork.com)

# Docfork MCP - Up-to-date Docs for AI Agents

<a href="https://cursor.com/en/install-mcp?name=docfork&config=eyJ1cmwiOiJodHRwczovL21jcC5kb2Nmb3JrLmNvbS9tY3AifQ%3D%3D"><img src="https://cursor.com/deeplink/mcp-install-dark.svg" height="32" alt="Add to Cursor"/></a>&nbsp;&nbsp;<a href="https://insiders.vscode.dev/redirect?url=vscode%3Amcp%2Finstall%3F%7B%22name%22%3A%22docfork%22%2C%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22docfork%40latest%22%5D%7D"><img src="https://img.shields.io/badge/Add%20to%20VS%20Code-007ACC?style=for-the-badge&logo=visualstudiocode&logoColor=white" height="32" alt="Add to VS Code"/></a>&nbsp;&nbsp;<a href="https://app.docfork.com/signup"><img src="https://img.shields.io/badge/Get%20Free%20API%20Key-F02A2B?style=for-the-badge&logo=fire&logoColor=white" height="32" alt="Get Free API Key"/></a>

<a href="https://docfork.com"><img alt="Website" src="https://img.shields.io/badge/Website-docfork.com-blue?style=flat-square" /></a>&nbsp;&nbsp;<a href="https://www.npmjs.com/package/docfork"><img alt="npm" src="https://img.shields.io/npm/v/docfork?style=flat-square&color=red" /></a>&nbsp;&nbsp;<a href="https://www.npmjs.com/package/docfork"><img alt="npm downloads" src="https://img.shields.io/npm/dm/docfork?style=flat-square" /></a>&nbsp;&nbsp;<a href="./LICENSE"><img alt="License" src="https://img.shields.io/npm/l/docfork?style=flat-square" /></a>

**Lock your agent's context to your stack.**

Define a **Docfork Cabinet** — `Next.js 16` + `Drizzle ORM` + `Better Auth` — and every query returns only docs from your stack. No more bloated results. No more hallucinations.

## ⚡ Built for Precision

Documentation context as precise as your dependency lockfile:

- **Cabinets** — Lock your agent to a verified stack. Only your libraries. Fully isolated.

- **10,000+ libraries** — Pre-chunked docs and code examples. ~200ms edge retrieval.

- **Team-ready** — Share Cabinets and API keys across your org. Same context, every engineer.

> **Set a Cabinet:** `Next.js 16` + `Drizzle ORM` + `Better Auth`.
> Your agent only sees docs for your stack. No stray Express docs. No Prisma confusion.

## 🚀 Quick Start

### 1. Get your Free API Key

Sign up at **[docfork.com](https://app.docfork.com/signup)** — free: 1,000 requests/month, 5 team seats.

### 2. Install MCP

<details>
<summary><b>Install in Cursor</b></summary>

Go to: `Settings` -> `Cursor Settings` -> `MCP` -> `Add new global MCP server`

Paste this into `~/.cursor/mcp.json`. For project-scoped config, create `.cursor/mcp.json` in your project folder. See [Cursor MCP docs](https://cursor.com/docs/context/mcp) for more info.

> Since Cursor 1.0, click the buttons below to install instantly.

#### Cursor Remote Server Connection

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/en/install-mcp?name=docfork&config=eyJ1cmwiOiJodHRwczovL21jcC5kb2Nmb3JrLmNvbS9tY3AifQ%3D%3D)

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

#### Cursor Local Server Connection

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/en/install-mcp?name=docfork&config=eyJjb21tYW5kIjoibnB4IC15IGRvY2ZvcmsifQ%3D%3D)

```json
{
  "mcpServers": {
    "docfork": {
      "command": "npx",
      "args": ["-y", "docfork", "--api-key", "YOUR_API_KEY"]
    }
  }
}
```

</details>

<details>
<summary><b>Install in Claude Code</b></summary>

Run this command. See [Claude Code MCP docs](https://code.claude.com/docs/en/mcp) for more info.

#### Claude Code Local Server Connection

```sh
claude mcp add docfork -- npx -y docfork --api-key YOUR_API_KEY
```

#### Claude Code Remote Server Connection

```sh
claude mcp add --header "DOCFORK_API_KEY: YOUR_API_KEY" --transport http docfork https://mcp.docfork.com/mcp
```

</details>

<details>
<summary><b>Install in OpenCode</b></summary>

Add this to your OpenCode configuration file. See [OpenCode MCP docs](https://opencode.ai/docs/mcp-servers) for more info.

#### OpenCode Remote Server Connection

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "docfork": {
      "type": "remote",
      "url": "https://mcp.docfork.com/mcp",
      "headers": {
        "DOCFORK_API_KEY": "YOUR_API_KEY",
      },
      "enabled": true,
    },
  },
}
```

#### OpenCode Local Server Connection

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "docfork": {
      "type": "local",
      "command": ["npx", "-y", "docfork", "--api-key", "YOUR_API_KEY"],
      "enabled": true,
    },
  },
}
```

</details>

<details>
<summary><b>Install in Cline</b></summary>

Add this to your Cline `cline_mcp_settings.json` file. To access it: Click the MCP Servers icon in the top navigation bar → Select the "Configure" tab → Click "Configure MCP Servers" at the bottom. See [Cline MCP docs](https://docs.cline.bot/mcp/configuring-mcp-servers) for more info.

#### Cline Remote Server Connection

```json
{
  "mcpServers": {
    "docfork": {
      "url": "https://mcp.docfork.com/mcp",
      "type": "streamableHttp",
      "headers": {
        "DOCFORK_API_KEY": "YOUR_API_KEY"
      },
      "alwaysAllow": ["search_docs", "fetch_doc"],
      "disabled": false
    }
  }
}
```

#### Cline Local Server Connection

```json
{
  "mcpServers": {
    "docfork": {
      "command": "npx",
      "args": ["-y", "docfork", "--api-key", "YOUR_API_KEY"],
      "alwaysAllow": ["search_docs", "fetch_doc"],
      "disabled": false
    }
  }
}
```

</details>

**[Windsurf, Roo Code, and 40+ more →](https://docs.docfork.com/clients/overview)**

<details>
<summary><b>OAuth Authentication</b></summary>

Docfork supports [MCP OAuth specs](https://modelcontextprotocol.io/specification/latest/basic/authorization). Change your endpoint to use OAuth:

```diff
- "url": "https://mcp.docfork.com/mcp"
+ "url": "https://mcp.docfork.com/mcp/oauth"
```

_Note: OAuth is for remote HTTP connections only. [View OAuth Guide →](https://docs.docfork.com/core/authentication)_

</details>

### 3. Just say `use docfork`

Add `use docfork` to any prompt:

```txt
Implement a secure authentication flow using Better Auth and Supabase. use docfork
```

### 4. Make it automatic

Add a rule so Docfork stays active — skip the prompt suffix.

> [!NOTE]
> **[Add Rule to Cursor (One-Click)](<https://cursor.com/link/rule?name=docfork-policy&text=When%20writing%20or%20debugging%20code%20that%20involves%20third-party%20libraries%2C%20frameworks%2C%20or%20APIs%2C%20use%20Docfork%20MCP%20%60search_docs%60%20and%20%60fetch_doc%60%20tools%20rather%20than%20relying%20on%20training%20data.%0A%0A%2A%2ATwo%20defaults%20to%20follow%20every%20time%3A%2A%2A%0A-%20Start%20%60library%60%20with%20a%20short%20name%20or%20keyword%20%28e.g.%2C%20%60nextjs%60%2C%20%60zod%60%29.%20Use%20the%20%60owner%2Frepo%60%20from%20the%20result%20URL%20for%20follow-up%20calls%2C%20never%20guess%20it%20upfront.%0A-%20After%20finding%20a%20relevant%20result%2C%20call%20%60fetch_doc%60%20to%20get%20the%20full%20content.%20Search%20results%20are%20summaries%20only.%0A%0ASkip%20Docfork%20when%3A%0A-%20Language%20built-ins%2C%20general%20algorithms%2C%20syntax%20stable%20across%20versions%0A-%20Code%20or%20docs%20the%20user%20has%20already%20provided%20in%20context%0A%0AWhen%20uncertain%2C%20default%20to%20using%20Docfork.>)**

Copy rule:

```markdown title=".cursor/rules/docfork-policy.md"
When writing or debugging code that involves third-party libraries, frameworks, or APIs, use Docfork MCP `search_docs` and `fetch_doc` tools rather than relying on training data.

**Two defaults to follow every time:**
- Start `library` with a short name or keyword (e.g., `nextjs`, `zod`). Use the `owner/repo` from the result URL for follow-up calls, never guess it upfront.
- After finding a relevant result, call `fetch_doc` to get the full content. Search results are summaries only.

Skip Docfork when:
- Language built-ins, general algorithms, syntax stable across versions
- Code or docs the user has already provided in context

When uncertain, default to using Docfork.
```

Now your AI fetches the latest docs automatically:

```txt
Add a Prisma schema for a multi-tenant SaaS and generate the client.
```

## 🔨 Tools

| Tool         | Purpose                                                                                                                 |
| ------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `search_docs` | **Context-Aware Search.** Respects your `DOCFORK_CABINET` header to strictly limit results to your approved tech stack. |
| `fetch_doc`   | **Fetch Doc.** Fetches full Markdown content from a URL when chunks aren't enough.                                      |

## 📖 Docs

- **[Search Public Libraries](https://docfork.com/search)** – Find libraries to add to your Cabinet.
- **[Installation Guides](https://docs.docfork.com/get-started/installation)** – Setup guides for every IDE.
- **[Cabinets](https://docs.docfork.com/core/cabinets)** – Lock your agent to specific libraries.
- **[Library Identifiers](https://docs.docfork.com/context/identifiers)** – Target exact repos with `owner/repo`.
- **[Troubleshooting](https://docs.docfork.com/troubleshooting/common-fixes)** – Fix connection or auth issues.

## 💬 Community

- **[Changelog](https://docfork.com/changelog)** – We ship constantly. Every release, documented.
- **[X (Twitter)](https://x.com/docfork_ai)** – Product updates and what's next.
- Found an issue? [Raise a GitHub issue](https://github.com/docfork/mcp/issues/new?labels=library&title=LIBRARY:%20) or [contact support](mailto:support@docfork.com).

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=docfork/mcp&type=Date)](https://www.star-history.com/#docfork/mcp&Date)

## Disclaimer

Docfork is an open, community-driven catalogue. We review submissions but can't guarantee accuracy for every project. Spot an issue? [Raise a GitHub issue](https://github.com/docfork/mcp/issues/new?labels=library&title=LIBRARY:%20) or [contact support](mailto:support@docfork.com).

## License

MIT
