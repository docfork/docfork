import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { mkdtemp, rm } from "node:fs/promises";

// mock homedir so tests don't touch real ~/.dgrep/
let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "dgrep-test-"));
  vi.stubEnv("HOME", tempDir);
});

afterEach(async () => {
  vi.unstubAllEnvs();
  await rm(tempDir, { recursive: true, force: true });
});

describe("config", () => {
  it("loadConfig returns empty object when no config file", async () => {
    // re-import after env stub so homedir() picks up the stub
    const { loadConfig } = await import("../../src/lib/config.js");
    const config = await loadConfig();
    expect(config).toEqual({});
  });

  it("saveConfig creates dir and file with correct perms", async () => {
    const { saveConfig, configPath } = await import("../../src/lib/config.js");
    await saveConfig({ apiKey: "docf_test123", cabinet: "my-cabinet" });

    const path = configPath();
    const content = JSON.parse(await readFile(path, "utf-8"));
    expect(content.apiKey).toBe("docf_test123");
    expect(content.cabinet).toBe("my-cabinet");

    const fileStat = await stat(path);
    // 0o600 = owner read+write only
    expect(fileStat.mode & 0o777).toBe(0o600);
  });

  it("loadConfig reads saved config", async () => {
    const { saveConfig, loadConfig } = await import("../../src/lib/config.js");
    await saveConfig({ apiKey: "docf_abc", claimedAt: "2026-01-01T00:00:00Z" });

    const config = await loadConfig();
    expect(config.apiKey).toBe("docf_abc");
    expect(config.claimedAt).toBe("2026-01-01T00:00:00Z");
  });
});
