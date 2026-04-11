import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { join } from "node:path";
import { mkdtemp, rm, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "dgrep-init-test-"));
});

afterEach(async () => {
  vi.restoreAllMocks();
  await rm(tempDir, { recursive: true, force: true });
});

describe("init command", () => {
  it("detects dependencies from package.json and writes config (--yes)", async () => {
    await writeFile(
      join(tempDir, "package.json"),
      JSON.stringify({
        dependencies: { react: "^19.0.0", next: "^15.0.0" },
        devDependencies: { "@types/react": "^19.0.0" },
      }),
    );

    vi.spyOn(console, "log").mockImplementation(() => {});

    const { init } = await import("../../src/commands/init.js");
    await init({ yes: true, cwd: tempDir });

    const config = JSON.parse(await readFile(join(tempDir, ".dgrep", "config.json"), "utf-8"));
    expect(config.libraries).toBeDefined();
    expect(config.libraries.length).toBeGreaterThan(0);
    // @types/react should be filtered out
    expect(config.libraries).not.toContain("@types/react");
  });

  it("writes empty libraries when no package.json deps match catalog", async () => {
    await writeFile(
      join(tempDir, "package.json"),
      JSON.stringify({
        dependencies: { "my-private-lib": "1.0.0" },
      }),
    );

    vi.spyOn(console, "log").mockImplementation(() => {});

    const { init } = await import("../../src/commands/init.js");
    await init({ yes: true, cwd: tempDir });

    const config = JSON.parse(await readFile(join(tempDir, ".dgrep", "config.json"), "utf-8"));
    expect(config.libraries).toBeDefined();
  });

  it("handles missing package.json gracefully", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});

    const { init } = await import("../../src/commands/init.js");
    await init({ yes: true, cwd: tempDir });

    const config = JSON.parse(await readFile(join(tempDir, ".dgrep", "config.json"), "utf-8"));
    expect(config.libraries).toEqual([]);
  });
});
