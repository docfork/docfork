# Contributing to Docfork

## Development Setup

### Prerequisites

- **Node.js** >= 18.0.0
- **pnpm** >= 9.5.0

### Getting started

```bash
git clone https://github.com/docfork/docfork.git
cd docfork
pnpm install
pnpm build
```

### Useful commands

```bash
pnpm dev              # Start all dev servers
pnpm build            # Build all packages
pnpm lint             # Lint with auto-fix
pnpm lint:check       # Lint (CI mode)
pnpm format           # Format with auto-fix
pnpm format:check     # Format check (CI mode)
pnpm typecheck        # Type-check all packages
pnpm test             # Run all tests
pnpm start            # Start MCP server (HTTP mode)
pnpm start:stdio      # Start MCP server (stdio mode)
pnpm clean            # Clean build artifacts
```

Before pushing: `pnpm lint:check && pnpm typecheck`

## Structure

```
docfork/
├── packages/
│   ├── mcp/       # MCP server (npm: docfork)
│   └── dgrep/     # Documentation grounding CLI (npm: dgrep)
└── plugins/       # IDE plugins
```

---

## Dependency Management

We do **not** use Dependabot or Renovate. Dependencies are updated manually in batched PRs.

### pnpm catalogs

Shared dependencies (e.g., `@types/node`) are defined once in `pnpm-workspace.yaml` under the `catalog:` key. Individual packages reference them as `"catalog:"` instead of a version string:

```yaml
# pnpm-workspace.yaml
catalog:
  "@types/node": "25.3.3"
```

```json
// packages/mcp/package.json
"devDependencies": {
  "@types/node": "catalog:"
}
```

### Updating dependencies

1. Edit version ranges in the relevant `package.json` files (or `pnpm-workspace.yaml` for catalog deps)
2. Run `pnpm install` to update the lockfile
3. Verify: `pnpm lint:check && pnpm typecheck && pnpm build`
4. Commit as `chore(deps): <description>`

---

## Release Process

Releases are automated with [release-please](https://github.com/googleapis/release-please). Two packages are versioned independently:

| Package | npm name | Tag pattern | Path |
|---|---|---|---|
| MCP server | `docfork` | `docfork-vX.Y.Z` | `packages/mcp/` |
| dgrep CLI | `dgrep` | `dgrep-vX.Y.Z` | `packages/dgrep/` |

### How it works

1. Push conventional commits to `main`
2. release-please auto-creates/updates a **Release PR** with version bump + changelog
3. Merge the Release PR → GitHub Release is created with the appropriate tag
4. The Release workflow publishes to npm (OIDC trusted publishing) and MCP Registry

### What gets published

**docfork (MCP server):**
- npm package with OIDC trusted publishing
- MCP Registry via `mcp-publisher`
- Gemini CLI extension archive attached to the GitHub Release

**dgrep (CLI):**
- npm package with OIDC trusted publishing

---

## Commit Conventions

We use [Conventional Commits](https://www.conventionalcommits.org/). release-please uses these to determine version bumps and generate changelogs.

### Format

```
<type>(<scope>): <description>
```

### Types

| Type | Version bump | Usage |
|---|---|---|
| `feat` | minor | New feature |
| `fix` | patch | Bug fix |
| `perf` | patch | Performance improvement |
| `refactor` | — | Code restructuring (no bump) |
| `test` | — | Adding/updating tests |
| `docs` | — | Documentation changes |
| `chore` | — | Maintenance, deps, CI |
| `scaffold` | — | Initial package structure |

### Scopes

`mcp`, `dgrep`, `docs`, `ci`, `deps`

### Breaking changes

Use `!` after the type to trigger a major version bump:

```
feat(mcp)!: rename search_docs to query
```

### Examples

```
feat(mcp): add cabinet filtering to search_docs
fix(dgrep): handle missing config file gracefully
chore(deps): batch update all dependencies
chore(ci): adopt release-please for automated releases
```

---

## Workflow

1. Create branch from `main`
2. Make changes
3. Run `pnpm lint:check && pnpm typecheck && pnpm build`
4. Commit using conventional commit format
5. Open PR

**Questions?** [Open an issue](https://github.com/docfork/docfork/issues)
