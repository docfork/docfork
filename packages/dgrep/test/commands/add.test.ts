import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { join } from "node:path";
import { mkdtemp, rm, mkdir, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "dgrep-add-test-"));
});

afterEach(async () => {
  vi.restoreAllMocks();
  await rm(tempDir, { recursive: true, force: true });
});

describe("add command", () => {
  it("adds a library to .dgrep/config.json", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});

    const { add } = await import("../../src/commands/add.js");
    await add("react", { yes: true, cwd: tempDir });

    const config = JSON.parse(await readFile(join(tempDir, ".dgrep", "config.json"), "utf-8"));
    expect(config.libraries).toContain("react");
  });

  it("is idempotent — skips if already tracked", async () => {
    await mkdir(join(tempDir, ".dgrep"));
    await writeFile(
      join(tempDir, ".dgrep", "config.json"),
      JSON.stringify({ libraries: ["react"] }),
    );

    const output: string[] = [];
    vi.spyOn(console, "log").mockImplementation((msg) => output.push(String(msg)));

    const { add } = await import("../../src/commands/add.js");
    await add("react", { yes: true, cwd: tempDir });

    // Should not error, config unchanged
    const config = JSON.parse(await readFile(join(tempDir, ".dgrep", "config.json"), "utf-8"));
    expect(config.libraries).toEqual(["react"]);
  });

  it("appends and sorts alphabetically", async () => {
    await mkdir(join(tempDir, ".dgrep"));
    await writeFile(
      join(tempDir, ".dgrep", "config.json"),
      JSON.stringify({ libraries: ["react"] }),
    );

    vi.spyOn(console, "log").mockImplementation(() => {});

    const { add } = await import("../../src/commands/add.js");
    await add("express", { yes: true, cwd: tempDir });

    const config = JSON.parse(await readFile(join(tempDir, ".dgrep", "config.json"), "utf-8"));
    expect(config.libraries).toEqual(["express", "react"]);
  });

  it("resolves owner/repo as github source", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});

    const { add } = await import("../../src/commands/add.js");
    await add("vercel/next.js", { yes: true, cwd: tempDir });

    const config = JSON.parse(await readFile(join(tempDir, ".dgrep", "config.json"), "utf-8"));
    expect(config.libraries).toContain("vercel/next.js");
  });
});
