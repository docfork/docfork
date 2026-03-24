import type { DgrepAuthConfig } from "./api-client.js";

/**
 * Resolve credentials from environment, flags, config file, or provision.
 * Priority: DOCFORK_API_KEY env > --api-key flag > ~/.dgrep/config.json > provision
 */
export async function resolveAuth(apiKeyFlag?: string): Promise<DgrepAuthConfig> {
  const apiKey = apiKeyFlag ?? process.env.DOCFORK_API_KEY;
  const cabinet = process.env.DOCFORK_CABINET;

  return { apiKey, cabinet };
}
