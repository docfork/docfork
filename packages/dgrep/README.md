# dgrep

Documentation grounding for AI agents. Search versioned, indexed docs from the command line.

```bash
npx dgrep search "hooks" -l react
```

## Install

```bash
npx dgrep          # run directly (recommended)
npm install -g dgrep   # or install globally
```

## Quick Start

```bash
# Search a library
dgrep search "server components" -l react

# Initialize project tracking (reads package.json)
dgrep init

# After init, search without specifying libraries
dgrep search "server components"

# Add a library manually
dgrep add drizzle
```

## Commands

### `dgrep search <query>`

Search documentation across your project's libraries.

```bash
dgrep search "hooks"                        # auto-detect libraries
dgrep search "hooks" -l react               # explicit library
dgrep search "hooks" -l react -l nextjs     # multi-library (parallel)
dgrep search "hooks" --json                 # NDJSON output for agents
dgrep search "hooks" -l react --no-save     # don't remember library
```

Libraries are resolved in order:
1. `--library` flag (explicit)
2. `.dgrep/config.json` (project tracking)
3. `package.json` dependencies (auto-detected)
4. Docfork catalog (fallback)

### `dgrep init`

Detect dependencies from `package.json` and create `.dgrep/config.json`.

```bash
dgrep init          # interactive selection
dgrep init --yes    # accept all detected deps
```

### `dgrep add <library>`

Add a library to your project's tracked libraries.

```bash
dgrep add react           # catalog library
dgrep add vercel/next.js  # GitHub repo
dgrep add react --yes     # skip confirmation
```

### `dgrep` (wizard)

Interactive setup. Provisions an API key, detects your IDE, and writes MCP config.

```bash
dgrep          # interactive
dgrep --yes    # non-interactive (CI/agent mode)
```

### `dgrep claim`

Link your provisioned API key to a Docfork account via browser login.

```bash
dgrep claim
```

## Configuration

### Project config: `.dgrep/config.json`

Created by `dgrep init` or `dgrep add`. Committed to git.

```json
{
  "libraries": ["react", "next.js", "typescript"]
}
```

### User config: `~/.dgrep/config.json`

API key and preferences. Created by the wizard or `dgrep claim`.

## Flags

| Flag | Description |
|------|-------------|
| `-y, --yes` | Skip all interactive prompts |
| `--json` | Output as NDJSON |
| `--api-key` | Override API key |
| `-l, --library` | Library to search (repeatable) |
| `--no-save` | Don't remember library for future searches |
| `--cabinet` | Org cabinet for private docs |

## Agent Usage

dgrep is designed for both humans and AI agents. Every input is a flag, every output is parseable.

```bash
# Agent-friendly: explicit flags, NDJSON output, no prompts
dgrep search "auth middleware" -l nextjs --json --yes

# Pipe to other tools
dgrep search "hooks" -l react --json | jq '.url'
```

## Links

- [Docfork](https://docfork.com)
- [Documentation](https://docfork.com/docs)
- [GitHub](https://github.com/docfork/docfork)
