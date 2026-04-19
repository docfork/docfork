import { DocforkAuthConfig } from "../config.js";
import { SERVER_VERSION } from "../lib/constants.js";
import { encryptClientIp } from "../lib/encryption.js";

/**
 * Generate headers for Docfork API requests
 * Handles authentication, cabinet headers, and client IP forwarding
 */
export function generateHeaders(auth?: DocforkAuthConfig): Record<string, string> {
  const headers: Record<string, string> = {
    "User-Agent": "docfork-mcp",
    "Content-Type": "application/json",
    accept: "application/json",
    // Identifies the client surface to the backend. Backend tags PostHog
    // events with client_surface="mcp-server" based on this header; the
    // forwarded X-Docfork-Client-Info below carries the upstream IDE
    // (Cursor, Claude Desktop, Inspector) as upstream_client.
    //
    // `?? "unknown"` keeps the emission readable if SERVER_VERSION ever
    // regresses (version loader glitch, extra-files drift across
    // package.json/server.json/gemini-extension.json) instead of
    // silently poisoning attribution with "mcp-server/undefined".
    "X-Docfork-Client": `mcp-server/${SERVER_VERSION ?? "unknown"}`,
  };

  if (auth?.clientInfo) {
    headers["X-Docfork-Client-Info"] = auth.clientInfo;
  }

  if (auth?.apiKey) {
    headers["Authorization"] = `Bearer ${auth.apiKey}`;
  }

  if (auth?.cabinet) {
    headers["X-Docfork-Cabinet"] = auth.cabinet;
  }

  if (auth?.clientIp) {
    const encryptedIp = encryptClientIp(auth.clientIp);
    headers["X-Forwarded-For"] = encryptedIp;
  }

  return headers;
}
