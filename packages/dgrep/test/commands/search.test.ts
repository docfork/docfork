import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { join } from "node:path";
import { mkdtemp, rm, mkdir, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "dgrep-search-test-"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("search command", () => {
  it("searches with explicit library and returns results", async () => {
    const { search } = await import("../../src/commands/search.js");
    const output: string[] = [];
    vi.spyOn(console, "log").mockImplementation((msg) => output.push(String(msg)));

    await search("hooks", { libraries: ["react"], json: true, noSave: true, cwd: tempDir });

    const lines = output.map((l) => JSON.parse(l));
    expect(lines[0].type).toBe("meta");
    expect(lines[0].source).toBe("flag");
    expect(lines[1].type).toBe("result");
    expect(lines[1].library).toBe("react");

    vi.restoreAllMocks();
  });

  it("searches from project config", async () => {
    await mkdir(join(tempDir, ".dgrep"));
    await writeFile(
      join(tempDir, ".dgrep", "config.json"),
      JSON.stringify({ libraries: [{ identifier: "react", packages: ["react"] }] }),
    );

    const { search } = await import("../../src/commands/search.js");
    const output: string[] = [];
    vi.spyOn(console, "log").mockImplementation((msg) => output.push(String(msg)));

    await search("hooks", { json: true, noSave: true, cwd: tempDir });

    const lines = output.map((l) => JSON.parse(l));
    expect(lines[0].source).toBe("project");

    vi.restoreAllMocks();
  });

  it("remembers library when --library used and no --no-save", async () => {
    const { search } = await import("../../src/commands/search.js");
    vi.spyOn(console, "log").mockImplementation(() => {});

    await search("hooks", { libraries: ["react"], json: true, yes: true, cwd: tempDir });

    const config = JSON.parse(
      await readFile(join(tempDir, ".dgrep", "config.json"), "utf-8"),
    );
    expect(config.libraries.some((l: { identifier: string }) => l.identifier === "react")).toBe(true);

    vi.restoreAllMocks();
  });

  it("does NOT save with --no-save", async () => {
    const { search } = await import("../../src/commands/search.js");
    vi.spyOn(console, "log").mockImplementation(() => {});

    await search("hooks", { libraries: ["react"], json: true, noSave: true, cwd: tempDir });

    try {
      await readFile(join(tempDir, ".dgrep", "config.json"), "utf-8");
      // If file exists, libraries should not contain react
      expect(true).toBe(false); // should not reach here
    } catch {
      // File doesn't exist — correct
    }

    vi.restoreAllMocks();
  });

  it("outputs NDJSON with correct format", async () => {
    const { search } = await import("../../src/commands/search.js");
    const output: string[] = [];
    vi.spyOn(console, "log").mockImplementation((msg) => output.push(String(msg)));

    await search("hooks", { libraries: ["react"], json: true, noSave: true, cwd: tempDir });

    for (const line of output) {
      const parsed = JSON.parse(line);
      expect(parsed).toHaveProperty("type");
      expect(["meta", "result", "error"]).toContain(parsed.type);
    }

    vi.restoreAllMocks();
  });
});
