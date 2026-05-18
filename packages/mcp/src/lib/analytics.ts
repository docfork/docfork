import { createHash } from "crypto";
import { API_URL, SERVER_VERSION } from "./constants.js";

// server-side mcp telemetry. fire-and-forget POST to api.docfork.com/v1/telemetry.
// public client repos (plugin, cli) ship no telemetry; the server is the only emitter.
// the relay endpoint forwards to posthog server-side so this package contains no
// posthog reference and no secrets.

const TELEMETRY_URL = `${API_URL}/telemetry`;
const TELEMETRY_TIMEOUT_MS = 2000;

const ALLOWED_CLIENTS = new Set([
  "claude-code",
  "claude-desktop",
  "cursor",
  "zed",
  "windsurf",
  "vscode",
  "continue",
  "cline",
  "mcp-inspector",
  "inspector-client",
  "docfork-plugin",
  "dgrep",
]);

interface InitializeArgs {
  apiKey?: string;
  clientIp?: string;
  clientInfoHeader?: string;
  rawClientInfo?: { name?: string; version?: string };
  protocolVersion?: string;
  transport: "http" | "stdio";
  optOut?: boolean;
}

interface ToolCallArgs {
  apiKey?: string;
  clientIp?: string;
  clientInfoHeader?: string;
  toolName: string;
  transport: "http" | "stdio";
  optOut?: boolean;
}

function isDebug(): boolean {
  return process.env.DOCFORK_ANALYTICS_DEBUG === "1";
}

// universal "do not track" standard (consoledonottrack.com) + a tool-specific
// override so users can disable docfork without touching unrelated tools.
function envOptOut(): boolean {
  if (process.env.DO_NOT_TRACK && process.env.DO_NOT_TRACK !== "0") return true;
  if (process.env.DOCFORK_TELEMETRY === "0") return true;
  return false;
}

// stable, non-reversible id derived from api key. falls back to ip-derived anon id.
// hashed prefix shape (`u_*` / `anon_*`) is what the relay accepts for non-uuid clients.
function distinctId(apiKey?: string, clientIp?: string): string {
  if (apiKey) {
    return "u_" + createHash("sha256").update(apiKey).digest("hex").slice(0, 16);
  }
  if (clientIp) {
    return "anon_" + createHash("sha256").update(clientIp).digest("hex").slice(0, 16);
  }
  return "anon_unknown";
}

// allowlist-fold cardinality so dashboards stay readable
function normalizeClientName(name?: string): string {
  if (!name) return "unknown";
  const lower = name.toLowerCase().trim();
  for (const known of ALLOWED_CLIENTS) {
    if (lower === known || lower.includes(known)) return known;
  }
  return "other";
}

// best-effort client name from MCP clientInfo (initialize) or user-agent header
function clientNameFrom(rawClientInfo?: { name?: string }, clientInfoHeader?: string): string {
  if (rawClientInfo?.name) return normalizeClientName(rawClientInfo.name);
  if (clientInfoHeader) {
    // user-agent shapes like "claude-code/1.2.3 (...)" — first token before "/"
    const token = clientInfoHeader.split(/[/\s]/)[0];
    return normalizeClientName(token);
  }
  return "unknown";
}

async function send(
  event: string,
  distinct_id: string,
  properties: Record<string, unknown>
): Promise<void> {
  if (envOptOut()) return;

  const payload = { event, distinct_id, properties };

  if (isDebug()) {
    process.stderr.write(`[analytics] ${event} ${JSON.stringify(payload)}\n`);
    return; // debug mode skips network so local runs don't spam prod telemetry
  }

  // fire-and-forget. swallow all errors so telemetry never breaks a tool call.
  try {
    await fetch(TELEMETRY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Docfork-Client": `docfork-mcp/${SERVER_VERSION}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(TELEMETRY_TIMEOUT_MS),
    });
  } catch {
    // intentional: never let telemetry raise
  }
}

export function captureMcpInitialize(args: InitializeArgs): void {
  if (args.optOut || envOptOut()) return;

  const properties = {
    client_name: clientNameFrom(args.rawClientInfo, args.clientInfoHeader),
    client_version: args.rawClientInfo?.version,
    protocol_version: args.protocolVersion,
    transport: args.transport,
    server_version: SERVER_VERSION,
    has_api_key: Boolean(args.apiKey),
  };

  void send("mcp_initialize", distinctId(args.apiKey, args.clientIp), properties);
}

export function captureMcpToolCall(args: ToolCallArgs): void {
  if (args.optOut || envOptOut()) return;

  // shape matches /v1/telemetry allowlist for mcp_tool_called: only
  // tool_name, upstream_client, and org_id are forwarded. org_id is
  // resolved by the relay from the calling api key, not by this package.
  const properties = {
    tool_name: args.toolName,
    upstream_client: clientNameFrom(undefined, args.clientInfoHeader),
  };

  void send("mcp_tool_called", distinctId(args.apiKey, args.clientIp), properties);
}
