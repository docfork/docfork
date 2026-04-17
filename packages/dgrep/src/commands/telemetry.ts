import { randomUUID } from "node:crypto";
import { loadConfig, saveConfig } from "../lib/config.js";
import { isTelemetryEnabled } from "../lib/telemetry/optout.js";

export async function telemetryStatus(): Promise<void> {
  const config = await loadConfig();
  const state = isTelemetryEnabled(config);
  const label = state.enabled ? "enabled" : "disabled";
  process.stdout.write(`Telemetry is ${label} (source: ${state.source})\n`);
  if (config.telemetry?.installId) {
    process.stdout.write(`Install ID: ${config.telemetry.installId}\n`);
  }
  process.stdout.write("Details: https://docfork.com/telemetry\n");
}

export async function telemetryDisable(): Promise<void> {
  const config = await loadConfig();
  await saveConfig({
    ...config,
    telemetry: {
      enabled: false,
      installId: config.telemetry?.installId ?? randomUUID(),
      firstRunAt: config.telemetry?.firstRunAt ?? new Date().toISOString(),
    },
  });
  process.stdout.write("Telemetry disabled.\n");
}

export async function telemetryEnable(): Promise<void> {
  const config = await loadConfig();
  await saveConfig({
    ...config,
    telemetry: {
      enabled: true,
      installId: config.telemetry?.installId ?? randomUUID(),
      firstRunAt: config.telemetry?.firstRunAt ?? new Date().toISOString(),
    },
  });
  process.stdout.write("Telemetry enabled.\n");
}
