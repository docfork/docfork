import dotenv from "dotenv";
import { parseArgs } from "node:util";
import { AsyncLocalStorage } from "async_hooks";
import { SERVER_VERSION } from "./lib/constants.js";

// Load environment variables from .env file if present
// Suppress dotenv output to prevent stdout pollution in MCP stdio transport
const originalWrite = process.stdout.write;
process.stdout.write = () => true;
try {
  dotenv.config({ quiet: true });
} finally {
  process.stdout.write = originalWrite;
}

/**
 * AsyncLocalStorage for auth context - enables automatic context flow without parameter passing
 */
export const authContext = new AsyncLocalStorage<DocforkAuthConfig>();

/**
 * Global auth config for stdio transport (resolved at startup)
 */
let globalAuthConfig: DocforkAuthConfig | undefined;

/**
 * Get the current auth config from AsyncLocalStorage or global fallback
 * This allows tools to access auth without it being passed as a parameter
 */
export function getAuthConfig(): DocforkAuthConfig | undefined {
  // Try AsyncLocalStorage first (HTTP transport)
  const ctx = authContext.getStore();
  if (ctx) {
    return ctx;
  }
  // Fallback to global config (stdio transport)
  return globalAuthConfig;
}

/**
 * Set the global auth config (for stdio transport only)
 */
export function setGlobalAuthConfig(config: DocforkAuthConfig): void {
  globalAuthConfig = config;
}

export interface ServerConfig {
  name: string;
  description: string;
  version: string;
  port: number;
  transport: "stdio" | "streamable-http";
  mcpClient?: string;
}

function parseEnvInt(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;

  const parsed = parseInt(value, 10);
  if (isNaN(parsed) || parsed <= 0) {
    console.warn(`Warning: Invalid ${key} value "${value}". Using default: ${defaultValue}`);
    return defaultValue;
  }
  return parsed;
}

export function getServerConfig(): ServerConfig {
  return {
    name: "Docfork",
    description: "Gets the latest documentation and code examples for any library.",
    version: SERVER_VERSION,
    port: parseEnvInt("PORT", 3000),
    transport: (process.env.MCP_TRANSPORT || "stdio") as ServerConfig["transport"],
  };
}

/**
 * Authentication configuration for Docfork API
 */
export interface DocforkAuthConfig {
  apiKey?: string;
  cabinet?: string;
  clientIp?: string;
  clientInfo?: string;
  transport: "stdio" | "http";
  // per-request telemetry opt-out, sourced from DNT/X-Docfork-Telemetry headers on http
  telemetryOptOut?: boolean;
}

/**
 * Case-insensitive header lookup helper
 * Node.js normalizes headers, but we check multiple variations for robustness
 */
function getHeader(
  headers: Record<string, string | string[] | undefined>,
  ...possibleKeys: string[]
): string | string[] | undefined {
  for (const key of possibleKeys) {
    if (headers[key]) {
      return headers[key];
    }
  }
  // Fallback: case-insensitive search through all keys
  const lowerKeys = possibleKeys.map((k) => k.toLowerCase());
  for (const [headerKey, value] of Object.entries(headers)) {
    if (lowerKeys.includes(headerKey.toLowerCase())) {
      return value;
    }
  }
  return undefined;
}

/**
 * Resolve authentication configuration from multiple sources following priority hierarchy:
 * 1. CLI Arguments (highest priority)
 * 2. Environment Variables
 * 3. HTTP Headers (lowest priority, only for HTTP transport)
 *
 * @param requestHeaders - Optional HTTP request headers (for HTTP transport only)
 * @returns Resolved authentication configuration
 * @throws Error if cabinet is specified without API key
 */
export function resolveAuthConfig(
  requestHeaders?: Record<string, string | string[] | undefined>
): DocforkAuthConfig {
  // 1. Parse CLI Arguments (for npx usage)
  const { values } = parseArgs({
    options: {
      "api-key": { type: "string" },
      cabinet: { type: "string" },
    },
    strict: false,
  });

  // 2. Build the config object using the Hierarchy
  // Priority: CLI args > Env vars > HTTP headers
  let apiKey: string | undefined;

  // Check CLI argument first
  if (values["api-key"]) {
    apiKey = values["api-key"] as string;
  }
  // Then environment variable
  else if (process.env.DOCFORK_API_KEY) {
    apiKey = process.env.DOCFORK_API_KEY;
  }
  // Finally HTTP headers (only if requestHeaders provided)
  else if (requestHeaders) {
    // Read Authorization: Bearer <token> header
    const authHeader = getHeader(requestHeaders, "authorization", "Authorization");
    if (authHeader) {
      const authValue = Array.isArray(authHeader) ? authHeader[0] : authHeader;
      if (authValue.startsWith("Bearer ")) {
        apiKey = authValue.replace("Bearer ", "");
      } else {
        // If no Bearer prefix, treat as raw token
        apiKey = authValue;
      }
    }
    // Try custom DOCFORK_API_KEY header (for MCP clients with headers config)
    else {
      const customHeader = getHeader(
        requestHeaders,
        "docfork_api_key",
        "docfork-api-key",
        "DOCFORK_API_KEY",
        "Docfork-Api-Key",
        "docfork-apikey"
      );
      if (customHeader) {
        apiKey = Array.isArray(customHeader) ? customHeader[0] : customHeader;
      }
    }
  }

  // Resolve cabinet with same priority
  let cabinet: string | undefined;

  // Check CLI argument first
  if (values.cabinet) {
    cabinet = values.cabinet as string;
  }
  // Then environment variable
  else if (process.env.DOCFORK_CABINET) {
    cabinet = process.env.DOCFORK_CABINET;
  }
  // Finally HTTP headers (only if requestHeaders provided)
  else if (requestHeaders) {
    // Read Cabinet header (case-insensitive for robustness)
    // Try DOCFORK_CABINET first (for MCP clients with headers config), then X-Docfork-Cabinet
    const cabinetHeader = getHeader(
      requestHeaders,
      "docfork_cabinet",
      "docfork-cabinet",
      "x-docfork-cabinet",
      "DOCFORK_CABINET",
      "Docfork-Cabinet",
      "X-Docfork-Cabinet"
    );
    if (cabinetHeader) {
      cabinet = Array.isArray(cabinetHeader) ? cabinetHeader[0] : cabinetHeader;
    }
  }

  // 3. Validation Logic: Cabinet requires API key
  if (cabinet && !apiKey) {
    throw new Error(
      "DOCFORK_CABINET requires a DOCFORK_API_KEY to be present. Set DOCFORK_API_KEY or pass --api-key"
    );
  }

  return {
    apiKey,
    cabinet,
    transport: requestHeaders ? "http" : "stdio",
  };
}
