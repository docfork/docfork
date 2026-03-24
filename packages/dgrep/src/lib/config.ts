/**
 * ~/.dgrep/config.json management
 */

export interface DgrepConfig {
  apiKey?: string;
  cabinet?: string;
}

export async function loadConfig(): Promise<DgrepConfig> {
  return {};
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function saveConfig(_config: DgrepConfig): Promise<void> {
  // stub
}
