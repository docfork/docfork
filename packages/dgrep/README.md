# dgrep

The CLI for [Docfork](https://docfork.com), the documentation index for AI coding agents. Search versioned library docs from the terminal.

<img src="https://raw.githubusercontent.com/docfork/docfork/main/demo.gif" alt="dgrep demo" />

```bash
npx dgrep
```

## Install

```bash
npx dgrep            # run directly (recommended)
npm install -g dgrep # or install globally
```

## Quick start

```bash
dgrep init                                                              # detect deps, write config
dgrep search "server-side rendering with App Router"                    # search tracked libraries
dgrep search "middleware redirect based on authentication" -l vercel/next.js  # search a specific library
dgrep read https://nextjs.org/docs/app/building-your-application/routing/middleware
dgrep setup                                                             # wire the MCP server into your IDE agents
```

dgrep provisions keys automatically on first search. No API key required.

## How it works

`dgrep init` detects your dependencies and writes `.dgrep/config.json`. After that, `dgrep search` resolves libraries locally — no setup step on every query.

[Architecture details →](https://docfork.com/docs/dgrep)

## Commands


| Command                  | Description                                                      |
| ------------------------ | ---------------------------------------------------------------- |
| `dgrep`                  | Show status (runs init if not yet configured)                    |
| `dgrep init`             | Detect dependencies, resolve libraries, write config             |
| `dgrep search <query>`   | Search documentation across tracked libraries                    |
| `dgrep read <url>`       | Fetch full content of a documentation page                       |
| `dgrep add <library>`    | Add a library to your stack                                      |
| `dgrep remove <library>` | Remove a library from tracking                                   |
| `dgrep list`             | List tracked libraries                                           |
| `dgrep setup`            | Install the Docfork MCP server in your IDE agents (use `--agent` to target one) |
| `dgrep status`           | Show configuration and authentication state                      |
| `dgrep login`            | Log in to your Docfork account                                   |
| `dgrep logout`           | Log out and clear credentials                                    |
| `dgrep doctor`           | Diagnose setup and connectivity                                  |
| `dgrep color [name]`     | Set CLI accent color                                             |


## Flags

### Global


| Flag         | Description                        |
| ------------ | ---------------------------------- |
| `-y, --yes`  | Skip interactive prompts (CI mode) |
| `--json`     | Output as NDJSON                   |
| `--api-key`  | Override API key                   |
| `-h, --help` | Show help                          |
| `--version`  | Show version                       |


### Search


| Flag            | Description                                     |
| --------------- | ----------------------------------------------- |
| `-l, --library` | Library to search (repeatable)                  |
| `--limit`       | Max results (default: 10)                       |
| `--no-save`     | Don't remember this library for future searches |


### Read

`dgrep read` accepts `--tokens <n>` to set the token budget (default: 20000).

### Setup (MCP install)


| Flag         | Description                                   |
| ------------ | --------------------------------------------- |
| `--cursor`   | Install Docfork MCP in Cursor                 |
| `--claude`   | Install Docfork MCP in Claude Code            |
| `--opencode` | Install Docfork MCP in OpenCode               |
| `--all`      | Install in all detected agents                |


## Configuration

### Project config: `.dgrep/config.json`

Created by `dgrep init` or `dgrep add`. Commit this to git so your team shares the same library set.

```json
{
  "libraries": [
    { "identifier": "honojs/hono", "packages": ["hono"] },
    { "identifier": "facebook/react", "packages": ["react"] },
    { "identifier": "vercel/next.js", "packages": ["next"] }
  ]
}
```

Each entry maps a Docfork identifier to the npm packages that resolved to it.

### User config: `~/.dgrep/config.json`

API key and preferences. Created automatically on first search or by `dgrep login`. Do not commit this.

## Agent usage

IDE agents call dgrep automatically after `dgrep setup`. For custom integrations, use `--json` for structured output:

```bash
dgrep search "server actions with forms" -l vercel/next.js --json --yes
dgrep read <url> --json
```

## Privacy & telemetry

dgrep sends anonymous usage events — command name, success/failure, latency — so we can see which commands people use and where the CLI fails.

dgrep **never** sends query text, doc content, URLs, file paths, API keys, or cabinet names. The event schema and collector endpoint are open source; you can inspect the payload with any network tap.

Opt out any of three ways:

```bash
dgrep telemetry disable   # persist to ~/.dgrep/config.json
DO_NOT_TRACK=1            # session-wide, any CLI
DGREP_TELEMETRY=0         # dgrep-specific
```

Details: [docfork.com/telemetry](https://docfork.com/telemetry).

## Links

- [dgrep docs](https://docfork.com/docs/dgrep)
- [CLI reference](https://docfork.com/docs/reference/cli)
- [Docfork](https://docfork.com)

