import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import type { DgrepConfig } from "../../src/lib/config.js";

let tempDir: string;
let stdoutSpy: ReturnType<typeof vi.spyOn>;
let stdoutChunks: string[];

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "dgrep-telemetry-cmd-test-"));
  vi.stubEnv("HOME", tempDir);
  delete process.env.DO_NOT_TRACK;
  delete process.env.DGREP_TELEMETRY;
  vi.resetModules();

  stdoutChunks = [];
  stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation((chunk) => {
    stdoutChunks.push(String(chunk));
    return true;
  });
});

afterEach(async () => {
  stdoutSpy.mockRestore();
  vi.unstubAllEnvs();
  await rm(tempDir, { recursive: true, force: true });
});

describe("telemetryStatus", () => {
  it("prints enabled + default when no config", async () => {
    const { telemetryStatus } = await import("../../src/commands/telemetry.js");
    await telemetryStatus();
    const out = stdoutChunks.join("");
    expect(out).toContain("Telemetry is enabled");
    expect(out).toContain("source: default");
  });

  it("reflects env:DO_NOT_TRACK when set", async () => {
    process.env.DO_NOT_TRACK = "1";
    const { telemetryStatus } = await import("../../src/commands/telemetry.js");
    await telemetryStatus();
    const out = stdoutChunks.join("");
    expect(out).toContain("Telemetry is disabled");
    expect(out).toContain("source: env:DO_NOT_TRACK");
  });

  it("prints install_id when a telemetry block exists", async () => {
    const { saveConfig } = await import("../../src/lib/config.js");
    await saveConfig({
      telemetry: {
        enabled: true,
        installId: "550e8400-e29b-41d4-a716-446655440000",
        firstRunAt: "2026-04-17T00:00:00Z",
      },
    });
    const { telemetryStatus } = await import("../../src/commands/telemetry.js");
    await telemetryStatus();
    const out = stdoutChunks.join("");
    expect(out).toContain("Install ID: 550e8400-e29b-41d4-a716-446655440000");
    expect(out).toContain("source: config");
  });
});

describe("telemetryDisable", () => {
  it("persists enabled=false to config", async () => {
    const { telemetryDisable } = await import("../../src/commands/telemetry.js");
    await telemetryDisable();

    const { configPath } = await import("../../src/lib/config.js");
    const content = JSON.parse(await readFile(configPath(), "utf-8")) as DgrepConfig;
    expect(content.telemetry?.enabled).toBe(false);
    expect(content.telemetry?.installId).toBeTruthy();
  });

  it("preserves an existing install_id when disabling", async () => {
    const { saveConfig } = await import("../../src/lib/config.js");
    await saveConfig({
      telemetry: {
        enabled: true,
        installId: "550e8400-e29b-41d4-a716-446655440000",
        firstRunAt: "2026-04-17T00:00:00Z",
      },
    });
    const { telemetryDisable } = await import("../../src/commands/telemetry.js");
    await telemetryDisable();

    const { loadConfig } = await import("../../src/lib/config.js");
    const config = await loadConfig();
    expect(config.telemetry?.installId).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(config.telemetry?.enabled).toBe(false);
  });
});

describe("telemetryEnable", () => {
  it("persists enabled=true to config", async () => {
    const { saveConfig } = await import("../../src/lib/config.js");
    await saveConfig({
      telemetry: {
        enabled: false,
        installId: "550e8400-e29b-41d4-a716-446655440000",
        firstRunAt: "2026-04-17T00:00:00Z",
      },
    });
    const { telemetryEnable } = await import("../../src/commands/telemetry.js");
    await telemetryEnable();

    const { loadConfig } = await import("../../src/lib/config.js");
    const config = await loadConfig();
    expect(config.telemetry?.enabled).toBe(true);
  });
});
