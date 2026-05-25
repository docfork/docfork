[![Docfork cover](https://docfork.com/cover.png)](https://docfork.com)

# Docfork MCP — Documentation for AI Coding Agents

<a href="https://cursor.com/en/install-mcp?name=docfork&config=eyJ1cmwiOiJodHRwczovL21jcC5kb2Nmb3JrLmNvbS9tY3AifQ%3D%3D"><img src="https://cursor.com/deeplink/mcp-install-dark.svg" height="32" alt="Add to Cursor"/></a>&nbsp;&nbsp;<a href="https://insiders.vscode.dev/redirect?url=vscode%3Amcp%2Finstall%3F%7B%22name%22%3A%22docfork%22%2C%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22docfork%40latest%22%5D%7D"><img src="https://img.shields.io/badge/Add%20to%20VS%20Code-007ACC?style=for-the-badge&logo=visualstudiocode&logoColor=white" height="32" alt="Add to VS Code"/></a>&nbsp;&nbsp;<a href="https://app.docfork.com/signup"><img src="https://img.shields.io/badge/Get%20Free%20API%20Key-F02A2B?style=for-the-badge&logo=fire&logoColor=white" height="32" alt="Get Free API Key"/></a>

<a href="https://docfork.com"><img alt="Website" src="https://img.shields.io/badge/Website-docfork.com-blue?style=flat-square" /></a>&nbsp;&nbsp;<a href="https://www.npmjs.com/package/docfork"><img alt="npm" src="https://img.shields.io/npm/v/docfork?style=flat-square&color=red" /></a>&nbsp;&nbsp;<a href="https://www.npmjs.com/package/docfork"><img alt="npm downloads" src="https://img.shields.io/npm/dm/docfork?style=flat-square" /></a>&nbsp;&nbsp;<a href="./LICENSE"><img alt="License" src="https://img.shields.io/npm/l/docfork?style=flat-square" /></a>

AI agents write code from stale training data. Docfork serves current, version-pinned documentation before they generate.

**Lock your agent's context to your stack.** Define a **Docfork Cabinet** (`vercel/next.js` + `drizzle-team/drizzle-orm` + `honojs/hono`) and every query returns only docs from your stack.

## Built for Precision

Documentation context as precise as your dependency lockfile:

- **Cabinets** — Lock your agent to a verified stack. Only your libraries. Fully isolated.

- **Curated catalog of popular frameworks and libraries** — Pre-chunked docs and code examples. ~200ms edge retrieval.

- **Team-ready** — Share Cabinets and API keys across your org. Same context, every engineer.

> **Set a Cabinet:** `vercel/next.js` + `drizzle-team/drizzle-orm` + `honojs/hono`.
> Your agent only sees docs for your stack.

## Quick Start

### Recommended: use dgrep

```bash
npx dgrep setup
```

Installs the Docfork MCP server in your IDE. Detects your installed agents and writes the config file; sign in to Docfork on first use, no API key needed. Target one with `--agent claude-code` (also: cursor, codex, opencode, vscode, windsurf, amp, factory, zed).

[dgrep docs →](https://docfork.com/docs/dgrep)

### Manual setup

If you prefer to configure MCP manually, get a free API key at **[docfork.com](https://app.docfork.com/signup)** (1,000 requests/month, 5 team seats) and follow the instructions for your client below.

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
<summary><b>Install in OpenAI Codex</b></summary>

See [OpenAI Codex](https://github.com/openai/codex) for more information.

#### Local Server Connection

```toml
[mcp_servers.docfork]
args = ["-y", "docfork", "--api-key", "YOUR_API_KEY"]
command = "npx"
startup_timeout_ms = 20_000
```

#### Remote Server Connection

```toml
[mcp_servers.docfork]
url = "https://mcp.docfork.com/mcp"
http_headers = { "DOCFORK_API_KEY" = "YOUR_API_KEY" }
```

If you see startup timeout errors, try increasing `startup_timeout_ms` to `40_000`.

</details>

<details>
<summary><b>Install in Google Antigravity</b></summary>

Add this to your Antigravity MCP config file. See [Antigravity MCP docs](https://antigravity.google/docs/mcp) for more info.

#### Google Antigravity Remote Server Connection

```json
{
  "mcpServers": {
    "docfork": {
      "serverUrl": "https://mcp.docfork.com/mcp",
      "headers": {
        "DOCFORK_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

#### Google Antigravity Local Server Connection

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
<summary><b>Install in VS Code</b></summary>

[![Install in VS Code (npx)](https://img.shields.io/badge/VS_Code-VS_Code?style=flat-square&label=Install%20Docfork%20MCP&color=0098FF)](https://insiders.vscode.dev/redirect?url=vscode%3Amcp%2Finstall%3F%7B%22name%22%3A%22docfork%22%2C%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22docfork%40latest%22%5D%7D)
[![Install in VS Code Insiders (npx)](https://img.shields.io/badge/VS_Code_Insiders-VS_Code_Insiders?style=flat-square&label=Install%20Docfork%20MCP&color=24bfa5)](https://insiders.vscode.dev/redirect?url=vscode-insiders%3Amcp%2Finstall%3F%7B%22name%22%3A%22docfork%22%2C%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22docfork%40latest%22%5D%7D)

Add this to your VS Code MCP config file. See [VS Code MCP docs](https://code.visualstudio.com/docs/copilot/chat/mcp-servers) for more info.

#### VS Code Remote Server Connection

```json
"mcp": {
  "servers": {
    "docfork": {
      "type": "http",
      "url": "https://mcp.docfork.com/mcp",
      "headers": {
        "DOCFORK_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

#### VS Code Local Server Connection

```json
"mcp": {
  "servers": {
    "docfork": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "docfork", "--api-key", "YOUR_API_KEY"]
    }
  }
}
```

</details>

<details>
<summary><b>Install in Kilo Code</b></summary>

You can configure the Docfork MCP server in **Kilo Code** using either the UI or by editing your project's MCP configuration file. Kilo Code supports two configuration levels: Global (`mcp_settings.json`) and Project-level (`.kilocode/mcp.json`).

### Configure via Kilo Code UI

1. Open **Kilo Code**.
2. Click the **Settings** icon in the top-right corner.
3. Navigate to **Settings → MCP Servers**.
4. Click **Add Server**.
5. Choose **HTTP Server** (Streamable HTTP Transport).
6. Enter **URL**: `https://mcp.docfork.com/mcp`
7. Add Header: **Key:** `Authorization`, **Value:** `Bearer YOUR_API_KEY`
8. Click **Save**.

### Manual Configuration

Create `.kilocode/mcp.json`:

```json
{
  "mcpServers": {
    "docfork": {
      "type": "streamable-http",
      "url": "https://mcp.docfork.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
      },
      "alwaysAllow": [],
      "disabled": false
    }
  }
}
```

</details>

<details>
<summary><b>Install in Kiro</b></summary>

See [Kiro Model Context Protocol Documentation](https://kiro.dev/docs/mcp/configuration/) for details.

1. Navigate `Kiro` > `MCP Servers`
2. Add a new MCP server by clicking the `+ Add` button.
3. Paste the configuration:

```json
{
  "mcpServers": {
    "Docfork": {
      "command": "npx",
      "args": ["-y", "docfork", "--api-key", "YOUR_API_KEY"],
      "env": {},
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

4. Click `Save` to apply.

</details>

<details>
<summary><b>Install in Windsurf</b></summary>

Add this to your Windsurf MCP config file. See [Windsurf MCP docs](https://docs.windsurf.com/windsurf/cascade/mcp) for more info.

#### Windsurf Remote Server Connection

```json
{
  "mcpServers": {
    "docfork": {
      "serverUrl": "https://mcp.docfork.com/mcp",
      "headers": {
        "DOCFORK_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

#### Windsurf Local Server Connection

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
<summary><b>Install in Roo Code</b></summary>

Add this to your Roo Code MCP configuration file. See [Roo Code MCP docs](https://docs.roocode.com/features/mcp/using-mcp-in-roo) for more info.

#### Roo Code Remote Server Connection

```json
{
  "mcpServers": {
    "docfork": {
      "type": "streamable-http",
      "url": "https://mcp.docfork.com/mcp",
      "headers": {
        "DOCFORK_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

#### Roo Code Local Server Connection

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
<summary><b>Install in Trae</b></summary>

Use the Add manually feature and fill in the JSON configuration. See [Trae documentation](https://docs.trae.ai/ide/model-context-protocol?_lang=en) for more details.

#### Trae Remote Server Connection

```json
{
  "mcpServers": {
    "docfork": {
      "url": "https://mcp.docfork.com/mcp"
    }
  }
}
```

#### Trae Local Server Connection

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
<summary><b>Install in Claude Desktop</b></summary>

#### Remote Server Connection

Open Claude Desktop and navigate to Settings > Connectors > Add Custom Connector. Enter the name as `Docfork` and the remote MCP server URL as `https://mcp.docfork.com/mcp`.

#### Local Server Connection

Open Claude Desktop developer settings and edit your `claude_desktop_config.json` file. See [Claude Desktop MCP docs](https://modelcontextprotocol.io/quickstart/user) for more info.

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
<summary><b>Install in Cline</b></summary>

You can install Docfork through the [Cline MCP Server Marketplace](https://cline.bot/mcp-marketplace) by searching for _Docfork_ and clicking **Install**, or add it manually:

1. Click the MCP Servers icon in the top navigation bar → **Configure** tab → **Configure MCP Servers**. See [Cline MCP docs](https://docs.cline.bot/mcp/configuring-mcp-servers) for more info.
2. Choose **Remote Servers** tab → **Edit Configuration**.
3. Add docfork to `mcpServers`:

#### Cline Remote Server Connection

```json
{
  "mcpServers": {
    "docfork": {
      "url": "https://mcp.docfork.com/mcp",
      "type": "streamableHttp",
      "headers": {
        "Authorization": "Bearer YOUR_API_KEY"
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

<details>
<summary><b>Install in Zed</b></summary>

It can be installed via [Zed Extensions](https://zed.dev/extensions?query=Docfork) or you can add this to your Zed `settings.json`. See [Zed Context Server docs](https://zed.dev/docs/assistant/context-servers) for more info.

```json
{
  "context_servers": {
    "Docfork": {
      "source": "custom",
      "command": "npx",
      "args": ["-y", "docfork", "--api-key", "YOUR_API_KEY"]
    }
  }
}
```

</details>

<details>
<summary><b>Install in Augment Code</b></summary>

To configure Docfork MCP in Augment Code, you can use either the graphical interface or manual configuration.

### Using the Augment Code UI

1. Click the hamburger menu.
2. Select **Settings**.
3. Navigate to the **Tools** section.
4. Click the **+ Add MCP** button.
5. Enter the following command: `npx -y docfork@latest`
6. Name the MCP: **Docfork**.
7. Click the **Add** button.

### Manual Configuration

1. Press Cmd/Ctrl Shift P or go to the hamburger menu in the Augment panel
2. Select Edit Settings
3. Under Advanced, click Edit in settings.json
4. Add the server configuration to the `mcpServers` array in the `augment.advanced` object

```json
"augment.advanced": {
  "mcpServers": [
    {
      "name": "docfork",
      "command": "npx",
      "args": ["-y", "docfork", "--api-key", "YOUR_API_KEY"]
    }
  ]
}
```

</details>

<details>
<summary><b>Install in Gemini CLI</b></summary>

See [Gemini CLI Configuration](https://google-gemini.github.io/gemini-cli/docs/tools/mcp-server.html) for details.

1. Open the Gemini CLI settings file at `~/.gemini/settings.json`
2. Add the following to the `mcpServers` object:

```json
{
  "mcpServers": {
    "docfork": {
      "httpUrl": "https://mcp.docfork.com/mcp",
      "headers": {
        "DOCFORK_API_KEY": "YOUR_API_KEY",
        "Accept": "application/json, text/event-stream"
      }
    }
  }
}
```

Or, for a local server:

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
<summary><b>Install in Amp</b></summary>

Run this command in your terminal. See [Amp MCP docs](https://ampcode.com/manual#mcp) for more info.

#### Without API Key (Basic Usage)

```sh
amp mcp add docfork https://mcp.docfork.com/mcp
```

#### With API Key (Higher Rate Limits)

```sh
amp mcp add docfork --header "DOCFORK_API_KEY=YOUR_API_KEY" https://mcp.docfork.com/mcp
```

</details>

<details>
<summary><b>Install in Qwen Coder</b></summary>

See [Qwen Coder MCP Configuration](https://qwenlm.github.io/qwen-code-docs/en/tools/mcp-server/#how-to-set-up-your-mcp-server) for details.

1. Open the Qwen Coder settings file at `~/.qwen/settings.json`
2. Add the following to the `mcpServers` object:

```json
{
  "mcpServers": {
    "docfork": {
      "httpUrl": "https://mcp.docfork.com/mcp",
      "headers": {
        "DOCFORK_API_KEY": "YOUR_API_KEY",
        "Accept": "application/json, text/event-stream"
      }
    }
  }
}
```

Or, for a local server:

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
<summary><b>Install in JetBrains AI Assistant</b></summary>

See [JetBrains AI Assistant Documentation](https://www.jetbrains.com/help/ai-assistant/configure-an-mcp-server.html) for more details.

1. In JetBrains IDEs, go to `Settings` -> `Tools` -> `AI Assistant` -> `Model Context Protocol (MCP)`
2. Click `+ Add`.
3. Click on `Command` in the top-left corner and select the As JSON option
4. Add this configuration:

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

5. Click `Apply` to save changes.

</details>

<details>
<summary><b>Using Bun or Deno</b></summary>

Use these alternatives to run the local Docfork MCP server with other runtimes.

#### Bun

```json
{
  "mcpServers": {
    "docfork": {
      "command": "bunx",
      "args": ["-y", "docfork", "--api-key", "YOUR_API_KEY"]
    }
  }
}
```

#### Deno

```json
{
  "mcpServers": {
    "docfork": {
      "command": "deno",
      "args": ["run", "--allow-env=NO_DEPRECATION,TRACE_DEPRECATION", "--allow-net", "npm:docfork"]
    }
  }
}
```

</details>

<details>
<summary><b>Using Docker</b></summary>

1. Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
RUN npm install -g docfork
CMD ["docfork"]
```

2. Build the image:

```bash
docker build -t docfork .
```

3. Configure your MCP client:

```json
{
  "mcpServers": {
    "docfork": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "docfork"],
      "transportType": "stdio"
    }
  }
}
```

</details>

<details>
<summary><b>Install Using the Desktop Extension</b></summary>

Install the [docfork.mcpb](https://github.com/docfork/docfork/tree/main/mcpb/docfork.mcpb) file and add it to your client. See [MCP bundles docs](https://github.com/anthropics/mcpb#mcp-bundles-mcpb) for more info.

</details>

<details>
<summary><b>Install in Windows</b></summary>

The configuration on Windows is slightly different. Use `cmd` to run npx:

```json
{
  "mcpServers": {
    "docfork": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "docfork", "--api-key", "YOUR_API_KEY"],
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

</details>

<details>
<summary><b>Install in Amazon Q Developer CLI</b></summary>

Add this to your Amazon Q Developer CLI configuration file. See [Amazon Q Developer CLI docs](https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/command-line-mcp-configuration.html) for more details.

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
<summary><b>Install in Warp</b></summary>

See [Warp Model Context Protocol Documentation](https://docs.warp.dev/knowledge-and-collaboration/mcp#adding-an-mcp-server) for details.

1. Navigate `Settings` > `AI` > `Manage MCP servers`.
2. Add a new MCP server by clicking the `+ Add` button.
3. Paste the configuration:

```json
{
  "Docfork": {
    "command": "npx",
    "args": ["-y", "docfork", "--api-key", "YOUR_API_KEY"],
    "env": {},
    "working_directory": null,
    "start_on_launch": true
  }
}
```

4. Click `Save`.

</details>

<details>
<summary><b>Install in Copilot Coding Agent</b></summary>

Add the following configuration to Repository->Settings->Copilot->Coding agent->MCP configuration:

```json
{
  "mcpServers": {
    "docfork": {
      "type": "http",
      "url": "https://mcp.docfork.com/mcp",
      "headers": {
        "DOCFORK_API_KEY": "YOUR_API_KEY"
      },
      "tools": ["search_docs", "fetch_doc"]
    }
  }
}
```

See the [official GitHub documentation](https://docs.github.com/en/enterprise-cloud@latest/copilot/how-tos/agents/copilot-coding-agent/extending-copilot-coding-agent-with-mcp) for more info.

</details>

<details>
<summary><b>Install in Copilot CLI</b></summary>

Open `~/.copilot/mcp-config.json` and add:

```json
{
  "mcpServers": {
    "docfork": {
      "type": "http",
      "url": "https://mcp.docfork.com/mcp",
      "headers": {
        "DOCFORK_API_KEY": "YOUR_API_KEY"
      },
      "tools": ["search_docs", "fetch_doc"]
    }
  }
}
```

Or, for a local server:

```json
{
  "mcpServers": {
    "docfork": {
      "type": "local",
      "command": "npx",
      "tools": ["search_docs", "fetch_doc"],
      "args": ["-y", "docfork", "--api-key", "YOUR_API_KEY"]
    }
  }
}
```

</details>

<details>
<summary><b>Install in LM Studio</b></summary>

See [LM Studio MCP Support](https://lmstudio.ai/blog/lmstudio-v0.3.17) for more information.

#### One-click install:

[![Add MCP Server docfork to LM Studio](https://files.lmstudio.ai/deeplink/mcp-install-light.svg)](https://lmstudio.ai/install-mcp?name=docfork&config=eyJjb21tYW5kIjoibnB4IiwiYXJncyI6WyIteSIsImRvY2ZvcmsiXX0%3D)

#### Manual set-up:

1. Navigate to `Program` (right side) > `Install` > `Edit mcp.json`.
2. Paste the configuration:

```json
{
  "mcpServers": {
    "Docfork": {
      "command": "npx",
      "args": ["-y", "docfork", "--api-key", "YOUR_API_KEY"]
    }
  }
}
```

3. Click `Save`.

</details>

<details>
<summary><b>Install in Visual Studio 2022</b></summary>

See [Visual Studio MCP Servers documentation](https://learn.microsoft.com/visualstudio/ide/mcp-servers?view=vs-2022) for details.

```json
{
  "inputs": [],
  "servers": {
    "docfork": {
      "type": "http",
      "url": "https://mcp.docfork.com/mcp",
      "headers": {
        "DOCFORK_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

Or, for a local server:

```json
{
  "mcp": {
    "servers": {
      "docfork": {
        "type": "stdio",
        "command": "npx",
        "args": ["-y", "docfork", "--api-key", "YOUR_API_KEY"]
      }
    }
  }
}
```

</details>

<details>
<summary><b>Install in Crush</b></summary>

Add this to your Crush configuration file. See [Crush MCP docs](https://github.com/charmbracelet/crush#mcps) for more info.

#### Crush Remote Server Connection (HTTP)

```json
{
  "$schema": "https://charm.land/crush.json",
  "mcp": {
    "docfork": {
      "type": "http",
      "url": "https://mcp.docfork.com/mcp",
      "headers": {
        "DOCFORK_API_KEY": "YOUR_API_KEY"
      }
    }
  }
}
```

#### Crush Local Server Connection

```json
{
  "$schema": "https://charm.land/crush.json",
  "mcp": {
    "docfork": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "docfork", "--api-key", "YOUR_API_KEY"]
    }
  }
}
```

</details>

<details>
<summary><b>Install in BoltAI</b></summary>

Open the "Settings" page, navigate to "Plugins," and enter:

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

See [BoltAI's Documentation](https://docs.boltai.com/docs/plugins/mcp-servers) for more info.

</details>

<details>
<summary><b>Install in Rovo Dev CLI</b></summary>

Edit your Rovo Dev CLI MCP config by running: `acli rovodev mcp`

#### Remote Server Connection

```json
{
  "mcpServers": {
    "docfork": {
      "url": "https://mcp.docfork.com/mcp"
    }
  }
}
```

#### Local Server Connection

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
<summary><b>Install in Zencoder</b></summary>

1. Go to the Zencoder menu (...)
2. Select Agent tools
3. Click on Add custom MCP
4. Add the name and configuration:

```json
{
  "command": "npx",
  "args": ["-y", "docfork", "--api-key", "YOUR_API_KEY"]
}
```

5. Click Install.

</details>

<details>
<summary><b>Install in Qodo Gen</b></summary>

See [Qodo Gen docs](https://docs.qodo.ai/qodo-documentation/qodo-gen/qodo-gen-chat/agentic-mode/agentic-tools-mcps) for more details.

1. Open Qodo Gen chat panel in VSCode or IntelliJ.
2. Click Connect more tools.
3. Click + Add new MCP.
4. Add the configuration:

#### Local Server Connection

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

#### Remote Server Connection

```json
{
  "mcpServers": {
    "docfork": {
      "url": "https://mcp.docfork.com/mcp"
    }
  }
}
```

</details>

<details>
<summary><b>Install in Perplexity Desktop</b></summary>

See [Local and Remote MCPs for Perplexity](https://www.perplexity.ai/help-center/en/articles/11502712-local-and-remote-mcps-for-perplexity) for more information.

1. Navigate `Perplexity` > `Settings`
2. Select `Connectors`.
3. Click `Add Connector`.
4. Select `Advanced`.
5. Enter Server Name: `Docfork`
6. Paste:

```json
{
  "args": ["-y", "docfork", "--api-key", "YOUR_API_KEY"],
  "command": "npx",
  "env": {}
}
```

7. Click `Save`.

</details>

<details>
<summary><b>Install in Factory</b></summary>

Factory's droid supports MCP servers through its CLI. See [Factory MCP docs](https://docs.factory.ai/cli/configuration/mcp) for more info.

#### Remote Server Connection

```sh
droid mcp add docfork https://mcp.docfork.com/mcp --type http --header "DOCFORK_API_KEY: YOUR_API_KEY"
```

#### Local Server Connection

```sh
droid mcp add docfork "npx -y docfork" --env DOCFORK_API_KEY=YOUR_API_KEY
```

</details>

<details>
<summary><b>Install in Emdash</b></summary>

[Emdash](https://github.com/generalaction/emdash) is an orchestration layer for running multiple coding agents in parallel.

**What Emdash provides:** Global toggle: Settings → MCP → "Enable Docfork MCP". Per-workspace enable: The Docfork button in the ProviderBar.

**What you still need to do:** Configure your coding agent (Codex, Claude Code, Cursor, etc.) to connect to Docfork MCP. Emdash does not modify your agent's config.

See the [Emdash repository](https://github.com/generalaction/emdash) for more information.

</details>

**[More installation guides →](https://docfork.com/docs/mcp/setup)**

<details>
<summary><b>OAuth Authentication</b></summary>

Docfork supports [MCP OAuth specs](https://modelcontextprotocol.io/specification/latest/basic/authorization). Change your endpoint to use OAuth:

```diff
- "url": "https://mcp.docfork.com/mcp"
+ "url": "https://mcp.docfork.com/mcp/oauth"
```

_Note: OAuth is for remote HTTP connections only. [View OAuth Guide →](https://docfork.com/docs/authentication#oauth-20)_

</details>

### 3. Start using it

After setup, your agent has two tools: `search_docs` and `fetch_doc`. No prompt suffix needed:

```txt
Set up server-side rendering with Next.js App Router.
```

### 4. Make it automatic

Add a rule so Docfork stays active — skip the prompt suffix.

> [!NOTE]
> **[Add Rule to Cursor (One-Click)](https://cursor.com/link/rule?name=docfork-policy&text=When%20writing%20or%20debugging%20code%20that%20involves%20third-party%20libraries%2C%20frameworks%2C%20or%20APIs%2C%20use%20Docfork%20MCP%20%60search_docs%60%20and%20%60fetch_doc%60%20tools%20rather%20than%20relying%20on%20training%20data.%0A%0A%2A%2ATwo%20defaults%20to%20follow%20every%20time%3A%2A%2A%0A-%20Start%20%60library%60%20with%20a%20short%20name%20or%20keyword%20%28e.g.%2C%20%60nextjs%60%2C%20%60zod%60%29.%20Use%20the%20%60owner%2Frepo%60%20from%20the%20result%20URL%20for%20follow-up%20calls%2C%20never%20guess%20it%20upfront.%0A-%20After%20finding%20a%20relevant%20result%2C%20call%20%60fetch_doc%60%20to%20get%20the%20full%20content.%20Search%20results%20are%20summaries%20only.%0A%0ASkip%20Docfork%20when%3A%0A-%20Language%20built-ins%2C%20general%20algorithms%2C%20syntax%20stable%20across%20versions%0A-%20Code%20or%20docs%20the%20user%20has%20already%20provided%20in%20context%0A%0AWhen%20uncertain%2C%20default%20to%20using%20Docfork.)**

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
Add middleware to redirect unauthenticated users in Next.js.
```

## Tools

### `search_docs`

Search documentation with context isolation. Set a Cabinet to restrict results to your approved stack.

| Parameter | Required | Description                                                      |
| --------- | -------- | ---------------------------------------------------------------- |
| `query`   | Yes      | What you're building or debugging. Be specific.                  |
| `library` | Yes      | Library name (`react`) or exact `owner/repo` (`facebook/react`). |
| `tokens`  | No       | Token budget for response size. `"dynamic"` or `100`–`10000`.    |

### `fetch_doc`

Fetch full Markdown content from a documentation URL when search chunks aren't enough.

| Parameter | Required | Description                                                       |
| --------- | -------- | ----------------------------------------------------------------- |
| `url`     | Yes      | URL from `search_docs` results. Anchors and deep paths supported. |

## Teams

Free: 1,000 requests/month. Share API keys and Cabinets across your organization. [Security →](https://docfork.com/security) · [Pricing →](https://docfork.com/pricing)

## Docs

- **[Search Public Libraries](https://docfork.com/search)** – Find libraries to add to your Cabinet.
- **[Setup Guide](https://docfork.com/docs/mcp/setup)** – Installation for every IDE.
- **[Cabinets](https://docfork.com/docs/cabinets)** – Lock your agent to specific libraries.
- **[Libraries](https://docfork.com/docs/libraries)** – Browse and add libraries.
- **[Troubleshooting](https://docfork.com/docs/troubleshooting)** – Fix connection or auth issues.

Docfork is retrieval, not synthesis — agents compose the answers.

## Privacy & telemetry

The MCP server sends anonymous usage events — client name, tool name, and whether each call succeeded — so we can see which clients connect and where the server fails.

The MCP server **never** sends query text, library names, result content, URLs, raw API keys, or IP addresses. The plugin and CLI clients ship no telemetry of their own — the server is the only emitter, and its source is open for inspection.

Opt out any of four ways:

```bash
DO_NOT_TRACK=1            # universal standard, any tool
DOCFORK_TELEMETRY=0       # docfork-specific
```

Per-request opt-out for the hosted server (`mcp.docfork.com`):

```
DNT: 1
X-Docfork-Telemetry: 0
```

Any one signal short-circuits before the network call. Details: [docfork.com/telemetry](https://docfork.com/telemetry).

## Community

- **[Changelog](https://docfork.com/changelog)** – We ship constantly. Every release, documented.
- **[X (Twitter)](https://x.com/docfork_ai)** – Product updates and what's next.
- Found an issue? [Raise a GitHub issue](https://github.com/docfork/docfork/issues/new?labels=library&title=LIBRARY:%20) or [contact support](mailto:support@docfork.com).

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=docfork/docfork&type=Date)](https://www.star-history.com/#docfork/docfork&Date)

## Disclaimer

Docfork is an open, community-driven catalog. We review submissions but can't guarantee accuracy for every project. Spot an issue? [Raise a GitHub issue](https://github.com/docfork/docfork/issues/new?labels=library&title=LIBRARY:%20) or [contact support](mailto:support@docfork.com).

## License

MIT
