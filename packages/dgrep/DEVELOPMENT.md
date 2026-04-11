# Contributing to dgrep

Local development guide for the dgrep CLI.

## Prerequisites

- Node.js >= 18
- pnpm >= 9.0.0

## Setup

```bash
# Clone and install
git clone https://github.com/docfork/docfork.git
cd docfork
pnpm install

# Build dgrep
pnpm --filter dgrep build

# Link locally (makes `dgrep` available globally)
cd packages/dgrep && npm link && cd ../..
```

## Development Workflow

```bash
# Typecheck (fast, run often)
pnpm --filter dgrep typecheck

# Run tests (62 tests, <1s)
pnpm --filter dgrep test

# Lint + format
pnpm --filter dgrep lint:check
pnpm --filter dgrep format:check

# Auto-fix lint + format
pnpm --filter dgrep lint
pnpm --filter dgrep format

# Build (obuild, produces dist/bin.mjs ~284KB)
pnpm --filter dgrep build

# Full check (run before committing)
pnpm --filter dgrep typecheck && pnpm --filter dgrep lint:check && pnpm --filter dgrep format:check && pnpm --filter dgrep test && pnpm --filter dgrep build
```

## Testing Locally

After `npm link`:

```bash
# Help
dgrep --help
dgrep search --help

# Search (hits production API)
dgrep search "hooks" -l react --no-save

# Search with NDJSON output
dgrep search "hooks" -l react --json --no-save

# Init (reads package.json in cwd)
cd /tmp/some-project
dgrep init --yes

# Add a library
dgrep add drizzle --yes

# Wizard (provisions API key, writes MCP configs)
dgrep --yes

# With explicit API key
DOCFORK_API_KEY=docf_xxx dgrep search "hooks" -l react --no-save
```

## Project Structure

```
packages/dgrep/
├── src/
│   ├── bin.ts                  # CLI entry (yargs)
│   ├── index.ts                # Barrel export
│   ├── commands/
│   │   ├── wizard.ts           # Default: provision + MCP setup
│   │   ├── search.ts           # Search with 4-tier resolution
│   │   ├── init.ts             # Detect deps, write .dgrep/config.json
│   │   ├── add.ts              # Add library to project
│   │   └── claim.ts            # OAuth device flow
│   └── lib/
│       ├── api-client.ts       # Docfork v1 REST client
│       ├── auth.ts             # Credential resolution chain
│       ├── config.ts           # ~/.dgrep/config.json (user)
│       ├── project-config.ts   # .dgrep/config.json (project)
│       ├── resolve-libraries.ts # 4-tier library resolution
│       ├── agents.ts           # IDE detection (Cursor, Claude Code)
│       ├── providers.ts        # Source resolution (catalog/github/url)
│       ├── device-flow.ts      # WorkOS OAuth device flow
│       ├── errors.ts           # Structured error classes
│       └── output.ts           # NDJSON formatter
├── test/
│   ├── setup.ts                # MSW server lifecycle
│   ├── mocks/handlers.ts       # Default API mock handlers
│   ├── lib/                    # Unit tests for lib/
│   └── commands/               # Unit tests for commands/
├── docs/
│   └── testing-strategy.md     # 5-level testing pyramid
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## Config Files

| File | Purpose | Created by |
|------|---------|------------|
| `~/.dgrep/config.json` | API key, user prefs (0o600) | wizard, claim |
| `.dgrep/config.json` | Tracked libraries (committed) | init, add, search --library |
| `.dgrep/.cache/` | Local cache (gitignored) | Future: LanceDB index |

## Testing

Tests use [vitest](https://vitest.dev) + [MSW](https://mswjs.io) for API mocking.

```bash
# Run all tests
pnpm --filter dgrep test

# Run specific test file
pnpm --filter dgrep vitest run test/lib/api-client.test.ts

# Run tests matching a pattern
pnpm --filter dgrep vitest run -t "resolveLibraries"

# Watch mode
pnpm --filter dgrep vitest
```

See `docs/testing-strategy.md` for the full testing pyramid (L1-L5).

## Commits

One semantic concern per commit. Each commit must pass:

```bash
pnpm --filter dgrep typecheck && pnpm --filter dgrep lint:check
```

Format: `<type>(dgrep): <description>`

Types: `feat`, `fix`, `test`, `docs`, `chore`, `refactor`, `scaffold`

## Build

obuild bundles everything into a single `dist/bin.mjs` (~284KB). All dependencies are bundled — zero runtime `node_modules` for end users.

```bash
pnpm --filter dgrep build
node packages/dgrep/dist/bin.mjs --help
```

## Cross-Repo Context (Team Only)

If you have access to the backend repo:

```bash
./scripts/setup-bridge.sh
```

Creates gitignored symlinks at `.claude/bridge/` pointing to internal design docs, skills, and developer guidance in the backend repo.

Internal docs: `backend/docs/dgrep/` (design-docs, references, research).
