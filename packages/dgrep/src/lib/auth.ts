import type { DgrepAuthConfig } from "./api-client.js";
import { loadConfig } from "./config.js";

/**
 * Resolve credentials from environment, flags, config file, or provision.
 * Priority: DOCFORK_API_KEY env > --api-key flag > ~/.dgrep/config.json > null
 */
export async function resolveAuth(apiKeyFlag?: string): Promise<DgrepAuthConfig> {
  // 1. env var (highest priority)
  if (process.env.DOCFORK_API_KEY) {
    return {
      apiKey: process.env.DOCFORK_API_KEY,
      cabinet: process.env.DOCFORK_CABINET,
    };
  }

  // 2. CLI flag
  if (apiKeyFlag) {
    return {
      apiKey: apiKeyFlag,
      cabinet: process.env.DOCFORK_CABINET,
    };
  }

  // 3. config file
  const config = await loadConfig();
  if (config.apiKey) {
    return {
      apiKey: config.apiKey,
      cabinet: config.cabinet ?? process.env.DOCFORK_CABINET,
    };
  }

  // 4. no credentials — wizard will provision
  return {};
}
