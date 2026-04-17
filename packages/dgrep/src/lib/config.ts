import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";

export interface DgrepTelemetryConfig {
  enabled: boolean;
  installId: string;
  firstRunAt: string;
}

export interface DgrepConfig {
  apiKey?: string;
  email?: string;
  orgName?: string;
  orgSlug?: string;
  cabinet?: string;
  claimedAt?: string;
  expiresAt?: string;
  accentColor?: string;
  telemetry?: DgrepTelemetryConfig;
}

const CONFIG_DIR = join(homedir(), ".dgrep");
const CONFIG_FILE = join(CONFIG_DIR, "config.json");

export function configPath(): string {
  return CONFIG_FILE;
}

export async function loadConfig(): Promise<DgrepConfig> {
  try {
    const raw = await readFile(CONFIG_FILE, "utf-8");
    return JSON.parse(raw) as DgrepConfig;
  } catch {
    return {};
  }
}

export async function saveConfig(config: DgrepConfig): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true, mode: 0o700 });
  await writeFile(CONFIG_FILE, JSON.stringify(config, null, 2) + "\n", {
    mode: 0o600,
  });
}
