# dgrep Testing Strategy

Testing levels for the dgrep CLI, adapted from the backend testing pyramid for CLI-specific concerns.

## Testing Pyramid

```
                ┌─────────┐
                │ L5 Smoke│  built binary, real output
               ─┤         ├─
              / └─────────┘ \
             /                \
            ┌──────────────────┐
            │ L4 Integration   │  real API, gated on env vars
           ─┤ (real services)  ├─
          / └──────────────────┘ \
         /                        \
        ┌──────────────────────────┐
        │ L3 Integration (mock)    │  full yargs + MSW mocked API
       ─┤                          ├─
      / └──────────────────────────┘ \
     /                                \
    ┌──────────────────────────────────┐
    │ L2 Fixture / Snapshot            │  CLI output with known inputs
   ─┤                                  ├─
  / └──────────────────────────────────┘ \
 /                                        \
┌──────────────────────────────────────────┐
│ L1 Unit                                  │  handler logic, auth, config
│ (pure functions, mocked I/O)             │  <1ms per test
└──────────────────────────────────────────┘
```

## Level 1: Unit

**What:** Pure function tests. Mock all I/O. Test one concern per file.

**Cost:** <1ms per test. No env vars. Always runs in CI.

**When to write:** Every commit that adds logic.

**Examples:**
- `api-client.test.ts` — searchDocs, readUrl return expected shapes; error mapping (401 → AuthError, 429 → RateLimitError)
- `auth.test.ts` — priority chain: env > flag > config > null
- `config.test.ts` — loadConfig/saveConfig with temp dirs
- `providers.test.ts` — resolveSource: "react" → catalog, "owner/repo" → github, "https://..." → url
- `errors.test.ts` — error classes have correct codes and exit codes

**Pattern:**
```ts
import { describe, it, expect, vi } from "vitest";

describe("resolveSource", () => {
  it("resolves owner/repo to github", () => {
    const result = resolveSource("vercel/next.js");
    expect(result).toEqual({ type: "github", identifier: "vercel/next.js" });
  });
});
```

## Level 2: Fixture / Snapshot

**What:** CLI output with known inputs. Vitest snapshots verify formatting doesn't regress.

**Cost:** ~50ms per test. No env vars. Always runs in CI.

**When to write:** When adding formatted output (search results, error messages).

**Pattern:**
```ts
it("formats search results correctly", async () => {
  const output: string[] = [];
  vi.spyOn(console, "log").mockImplementation((msg) => output.push(msg));

  await searchHandler("react", { json: false });

  expect(output.join("\n")).toMatchSnapshot();
});
```

## Level 3: Integration (mock)

**What:** Full yargs command with MSW mocked API. Tests the CLI boundary.

**Cost:** ~200ms per test. No env vars. Always runs in CI.

**When to write:** When adding new commands or changing command flow.

## Level 4: Integration (real)

**What:** Real API calls. Gated on `DOCFORK_API_KEY` env var.

**Cost:** ~1-5s per test. Requires API key. Skipped in CI unless secrets set.

**Pattern:**
```ts
const isReal = (v: string | undefined) => !!v && !v.startsWith("your_");
const HAS_API_KEY = isReal(process.env.DOCFORK_API_KEY);

describe.skipIf(!HAS_API_KEY)("e2e — real API", () => {
  it("searches docs", async () => {
    const result = await searchDocs("hooks", "react", { apiKey: process.env.DOCFORK_API_KEY });
    expect(result.sections.length).toBeGreaterThan(0);
  });
});
```

## Level 5: Smoke

**What:** Built binary, real output. Post-build verification.

**Cost:** ~5s. Runs after `pnpm build`.

**Where:** CI workflow step, not a test file.

```bash
node dist/bin.mjs --help
node dist/bin.mjs --version
```

## CLI-Specific Patterns

### Prompt testing (dependency injection)

`@clack/prompts` has no test helpers. Extract prompt calls behind a `PromptProvider` interface and inject mocks in tests.

### API mocking (MSW)

Mock Service Worker intercepts `fetch` at the network level. Configured in `test/setup.ts`, default handlers in `test/mocks/handlers.ts`.

### Output testing

Commands check `argv.json` and use either `output.jsonLine()` (NDJSON) or `@clack/prompts` (pretty). Both are testable via console spy.

## File Naming

- `foo.test.ts` — unit tests, in `test/lib/`
- `test/mocks/` — MSW handlers and mock providers
- `test/setup.ts` — global test setup (MSW server lifecycle)

## How Levels Map to Commits

| Commit concern        | Required test level              |
|-----------------------|----------------------------------|
| Pure function / utility | L1 unit                        |
| Command handler logic | L1 unit + L2 snapshot            |
| CLI argument wiring   | L3 integration                   |
| API client changes    | L1 unit (mock fetch)             |
| Config / scaffold     | type-check only                  |

## Gating Convention

```ts
const isReal = (v: string | undefined) => !!v && !v.startsWith("your_");
const HAS_API_KEY = isReal(process.env.DOCFORK_API_KEY);
```
