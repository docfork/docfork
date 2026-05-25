import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { join } from "node:path";
import { mkdtemp, rm, mkdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";

let tempDir: string;
let tempHome: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "dgrep-wizard-test-"));
  tempHome = await mkdtemp(join(tmpdir(), "dgrep-wizard-home-"));
  // isolate user-dir probes (codex, etc.) from the host's real home
  vi.stubEnv("HOME", tempHome);
  // isolate binary probes (amp, etc.) from the host's $PATH
  vi.stubEnv("PATH", "");
});

afterEach(async () => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  await rm(tempDir, { recursive: true, force: true });
  await rm(tempHome, { recursive: true, force: true });
});

describe("wizard command", () => {
  it("writes url-only MCP config for detected agents (--yes)", async () => {
    await mkdir(join(tempDir, ".cursor"));

    vi.spyOn(console, "log").mockImplementation(() => {});

    const { wizard } = await import("../../src/commands/wizard.js");
    await wizard({ yes: true, cwd: tempDir });

    const mcpConfig = JSON.parse(await readFile(join(tempDir, ".cursor", "mcp.json"), "utf-8"));
    expect(mcpConfig.mcpServers).toHaveProperty("docfork");
    expect(mcpConfig.mcpServers.docfork.url).toBe("https://mcp.docfork.com/mcp");
    expect(mcpConfig.mcpServers.docfork.headers).toBeUndefined();
  });

  it("handles no agents detected gracefully", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});

    const { wizard } = await import("../../src/commands/wizard.js");
    await expect(wizard({ yes: true, cwd: tempDir })).resolves.not.toThrow();
  });
});
