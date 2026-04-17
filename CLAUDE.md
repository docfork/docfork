# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Root (monorepo)

```bash
pnpm build            # Build all packages (turbo)
pnpm dev              # Start all dev servers
pnpm lint             # Lint all packages
pnpm lint:check       # Check linting (CI)
pnpm format           # Format all code
pnpm format:check     # Check formatting (CI)
pnpm typecheck        # Type-check all packages
pnpm test             # Run all tests
pnpm clean            # Clean all dist/node_modules
```

### Package-scoped

```bash
pnpm --filter dgrep build
pnpm --filter dgrep typecheck
pnpm --filter dgrep test
pnpm --filter docfork build        # MCP server package
pnpm --filter docfork typecheck
```

### Before committing

```bash
pnpm lint:check && pnpm typecheck
```

## Architecture

### Monorepo structure

```
docfork/
├── packages/
│   ├── mcp/       # MCP server (npm: docfork, v2.1.0)
│   └── dgrep/     # Documentation grounding CLI (npm: dgrep, v0.1.0-alpha)
└── plugins/       # IDE plugins
```

**Package manager:** pnpm v9.0.0+ with workspaces
**Build orchestration:** Turborepo
**TypeScript:** Strict mode, ES2022 target, Node16 module resolution

### MCP server (`packages/mcp/`)

Docfork MCP server supporting stdio and HTTP transports. Published to npm as `docfork`. Has its own API client in `src/api/` — intentionally isolated from dgrep.

### dgrep CLI (`packages/dgrep/`)

Documentation context CLI. Alpha stage. Uses obuild for single-file bundling (zero runtime node_modules). Has its own standalone API client — will migrate to ConnectRPC when api-v2 is ready.

## Code Style

### Formatting (Prettier)

Print width: 100, tab width: 2, semicolons: true, double quotes, trailing commas: all.

### TypeScript

- Strict mode. Prefer `unknown` over `any`.
- ESM only (`"type": "module"` in all packages).

### Naming

- Files: kebab-case. Types/Interfaces: PascalCase. Variables/functions: camelCase.
- Constants: `SCREAMING_SNAKE_CASE`.

### Comments

- Explain intent and non-obvious behavior. Keep concise.
- Section headers: `// -- SectionName -----------------------------------`

### Commits

Format: `<type>(<scope>): <description>` — types: `feat`, `fix`, `test`, `docs`, `chore`, `refactor`, `perf`, `scaffold`.

Every commit addresses one semantic concern and passes `pnpm lint:check && pnpm typecheck` independently. Do not use the word "enhanced" in commit messages.

## Team Setup

If you have access to the Docfork backend repo, set up cross-repo context:

```bash
./scripts/setup-bridge.sh
```

This creates gitignored symlinks in `.claude/bridge/` pointing to backend design docs, skills, and developer guidance.
