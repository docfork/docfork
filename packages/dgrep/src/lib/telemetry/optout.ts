import { randomUUID } from "node:crypto";
import { loadConfig, saveConfig } from "../config.js";
import type { DgrepConfig } from "../config.js";
import { isCI } from "./transport.js";

export type OptOutSource = "env:DO_NOT_TRACK" | "env:DGREP_TELEMETRY" | "config" | "default";

export interface TelemetryState {
  enabled: boolean;
  source: OptOutSource;
}

// Pure function — no I/O — so it's trivially testable against a matrix of
// env + config combinations. Resolution order matches docfork.com/telemetry.
export function isTelemetryEnabled(
  config: DgrepConfig,
  env: NodeJS.ProcessEnv = process.env
): TelemetryState {
  if (env.DO_NOT_TRACK && env.DO_NOT_TRACK !== "0") {
    return { enabled: false, source: "env:DO_NOT_TRACK" };
  }
  if (env.DGREP_TELEMETRY === "0") {
    return { enabled: false, source: "env:DGREP_TELEMETRY" };
  }
  if (config.telemetry) {
    return { enabled: config.telemetry.enabled, source: "config" };
  }
  return { enabled: true, source: "default" };
}

// Returns the install_id, minting one if the config doesn't have a telemetry
// block yet and persisting the result. Safe to call multiple times.
export async function ensureInstallId(): Promise<string> {
  const config = await loadConfig();
  if (config.telemetry?.installId) return config.telemetry.installId;

  const installId = randomUUID();
  await saveConfig({
    ...config,
    telemetry: {
      enabled: config.telemetry?.enabled ?? true,
      installId,
      firstRunAt: config.telemetry?.firstRunAt ?? new Date().toISOString(),
    },
  });
  return installId;
}

const NOTICE_LINES = [
  "Anonymous usage telemetry is now enabled.",
  "We collect: command name, success/failure, latency.",
  "We never collect: queries, content, URLs, paths, keys.",
  "Opt out: dgrep telemetry disable   |   DO_NOT_TRACK=1   |   DGREP_TELEMETRY=0",
  "Details: https://docfork.com/telemetry",
];

// Called once, on the first invocation after install. Prints to stderr (stdout
// stays clean for `--json` pipelines). 2s pause on interactive TTY gives the
// user a chance to Ctrl+C; pause is skipped in CI and when stdin isn't a TTY
// so pipelines don't stall.
export async function showFirstRunNotice(): Promise<void> {
  const shouldPause = !isCI() && process.stdin.isTTY === true;

  for (const line of NOTICE_LINES) {
    process.stderr.write(`${line}\n`);
  }
  process.stderr.write("\n");

  if (shouldPause) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}
