import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import type { DgrepConfig } from "../../../src/lib/config.js";

// isTelemetryEnabled is pure, so it's imported statically.
import { isTelemetryEnabled } from "../../../src/lib/telemetry/optout.js";

describe("isTelemetryEnabled", () => {
  const EMPTY: DgrepConfig = {};
  const CONFIG_ON: DgrepConfig = {
    telemetry: { enabled: true, installId: "id", firstRunAt: "2026-04-17T00:00:00Z" },
  };
  const CONFIG_OFF: DgrepConfig = {
    telemetry: { enabled: false, installId: "id", firstRunAt: "2026-04-17T00:00:00Z" },
  };

  it("defaults to enabled when no config and no env", () => {
    expect(isTelemetryEnabled(EMPTY, {})).toEqual({ enabled: true, source: "default" });
  });

  it("DO_NOT_TRACK=1 wins over config ON", () => {
    expect(isTelemetryEnabled(CONFIG_ON, { DO_NOT_TRACK: "1" })).toEqual({
      enabled: false,
      source: "env:DO_NOT_TRACK",
    });
  });

  it("DO_NOT_TRACK=0 is ignored (per convention)", () => {
    expect(isTelemetryEnabled(CONFIG_ON, { DO_NOT_TRACK: "0" })).toEqual({
      enabled: true,
      source: "config",
    });
  });

  it("any truthy DO_NOT_TRACK opts out", () => {
    expect(isTelemetryEnabled(CONFIG_ON, { DO_NOT_TRACK: "true" })).toEqual({
      enabled: false,
      source: "env:DO_NOT_TRACK",
    });
  });

  it("DGREP_TELEMETRY=0 wins over config ON", () => {
    expect(isTelemetryEnabled(CONFIG_ON, { DGREP_TELEMETRY: "0" })).toEqual({
      enabled: false,
      source: "env:DGREP_TELEMETRY",
    });
  });

  it("DGREP_TELEMETRY=1 has no special meaning (falls through to config/default)", () => {
    expect(isTelemetryEnabled(CONFIG_ON, { DGREP_TELEMETRY: "1" })).toEqual({
      enabled: true,
      source: "config",
    });
  });

  it("DO_NOT_TRACK takes precedence over DGREP_TELEMETRY", () => {
    expect(
      isTelemetryEnabled(CONFIG_ON, { DO_NOT_TRACK: "1", DGREP_TELEMETRY: "0" }),
    ).toEqual({ enabled: false, source: "env:DO_NOT_TRACK" });
  });

  it("config.telemetry.enabled=false is disabled without env", () => {
    expect(isTelemetryEnabled(CONFIG_OFF, {})).toEqual({ enabled: false, source: "config" });
  });

  it("config.telemetry.enabled=true is enabled without env", () => {
    expect(isTelemetryEnabled(CONFIG_ON, {})).toEqual({ enabled: true, source: "config" });
  });
});

describe("ensureInstallId", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "dgrep-optout-test-"));
    vi.stubEnv("HOME", tempDir);
    vi.resetModules();
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    await rm(tempDir, { recursive: true, force: true });
  });

  it("mints and persists a UUID when no telemetry block exists", async () => {
    const { ensureInstallId } = await import("../../../src/lib/telemetry/optout.js");
    const id = await ensureInstallId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

    const { configPath } = await import("../../../src/lib/config.js");
    const content = JSON.parse(await readFile(configPath(), "utf-8")) as DgrepConfig;
    expect(content.telemetry?.installId).toBe(id);
    expect(content.telemetry?.enabled).toBe(true);
    expect(content.telemetry?.firstRunAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("returns the existing install_id on subsequent calls", async () => {
    const { ensureInstallId } = await import("../../../src/lib/telemetry/optout.js");
    const first = await ensureInstallId();
    const second = await ensureInstallId();
    expect(second).toBe(first);
  });

  it("preserves other config fields when writing the telemetry block", async () => {
    const { saveConfig } = await import("../../../src/lib/config.js");
    await saveConfig({ apiKey: "docf_abc", cabinet: "team-x" });

    const { ensureInstallId } = await import("../../../src/lib/telemetry/optout.js");
    await ensureInstallId();

    const { loadConfig } = await import("../../../src/lib/config.js");
    const config = await loadConfig();
    expect(config.apiKey).toBe("docf_abc");
    expect(config.cabinet).toBe("team-x");
    expect(config.telemetry?.installId).toBeTruthy();
  });
});
