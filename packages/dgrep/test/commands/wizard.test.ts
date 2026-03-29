import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { join } from "node:path";
import { mkdtemp, rm, mkdir, readFile } from "node:fs/promises";
import { tmpdir, homedir } from "node:os";
import { server } from "../setup.js";
import { http, HttpResponse } from "msw";
import { loadConfig, saveConfig } from "../../src/lib/config.js";

const API_URL = "https://api.docfork.com/v1";

let tempDir: string;
let originalConfig: Record<string, unknown>;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "dgrep-wizard-test-"));
  // Save original user config to restore after test
  originalConfig = await loadConfig();

  // Add provision handler for all wizard tests
  server.use(
    http.post(`${API_URL}/keys/provision`, () => {
      return HttpResponse.json({
        apiKey: "docf_test_wizard_key",
        expiresAt: "2026-04-03T00:00:00Z",
      });
    }),
  );
});

afterEach(async () => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  // Restore original user config to prevent test pollution
  await saveConfig(originalConfig as Parameters<typeof saveConfig>[0]);
  await rm(tempDir, { recursive: true, force: true });
});

describe("wizard command", () => {
  it("provisions key and writes MCP config for detected agents (--yes)", async () => {
    // Create .cursor/ so agent is detected
    await mkdir(join(tempDir, ".cursor"));

    // Remove existing API key env so provision is triggered
    vi.stubEnv("DOCFORK_API_KEY", "");

    vi.spyOn(console, "log").mockImplementation(() => {});

    const { wizard } = await import("../../src/commands/wizard.js");
    await wizard({ yes: true, cwd: tempDir });

    // Should have written MCP config
    const mcpConfig = JSON.parse(await readFile(join(tempDir, ".cursor", "mcp.json"), "utf-8"));
    expect(mcpConfig.mcpServers).toHaveProperty("docfork");
    expect(mcpConfig.mcpServers.docfork.command).toBe("npx");
  });

  it("uses existing API key and skips provision", async () => {
    vi.stubEnv("DOCFORK_API_KEY", "docf_existing_from_env");

    await mkdir(join(tempDir, ".cursor"));
    vi.spyOn(console, "log").mockImplementation(() => {});

    const { wizard } = await import("../../src/commands/wizard.js");
    await wizard({ yes: true, cwd: tempDir });

    // MCP config should use the existing key
    const mcpConfig = JSON.parse(await readFile(join(tempDir, ".cursor", "mcp.json"), "utf-8"));
    expect(mcpConfig.mcpServers.docfork.env.DOCFORK_API_KEY).toBe("docf_existing_from_env");
  });

  it("handles no agents detected gracefully", async () => {
    vi.stubEnv("DOCFORK_API_KEY", "");
    vi.spyOn(console, "log").mockImplementation(() => {});

    const { wizard } = await import("../../src/commands/wizard.js");
    // Should not throw even with no agents
    await expect(wizard({ yes: true, cwd: tempDir })).resolves.not.toThrow();
  });
});
