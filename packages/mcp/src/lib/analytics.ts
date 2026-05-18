import { createHash } from "crypto";
import { SERVER_VERSION } from "./constants.js";

// server-side mcp analytics. fire-and-forget posthog capture.
// no-op unless POSTHOG_API_KEY is set (prod) or DOCFORK_ANALYTICS_DEBUG=1 (local test).
// client repos (plugin, cli) ship no telemetry; the server is the only emitter.

const DEFAULT_POSTHOG_HOST = "https://us.i.posthog.com";
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
}

interface ToolCallArgs {
  apiKey?: string;
  clientIp?: string;
  clientInfoHeader?: string;
  toolName: string;
  durationMs: number;
  ok: boolean;
  errorKind?: string;
  transport: "http" | "stdio";
}

function isDebug(): boolean {
  return process.env.DOCFORK_ANALYTICS_DEBUG === "1";
}

function projectKey(): string | undefined {
  return process.env.POSTHOG_API_KEY || process.env.POSTHOG_PROJECT_API_KEY;
}

function host(): string {
  return process.env.POSTHOG_HOST || DEFAULT_POSTHOG_HOST;
}

function enabled(): boolean {
  return isDebug() || Boolean(projectKey());
}

// stable, non-reversible id derived from api key. falls back to ip-derived anon id.
function distinctId(apiKey?: string, clientIp?: string): string {
  if (apiKey) {
    return "u_" + createHash("sha256").update(apiKey).digest("hex").slice(0, 16);
  }
  if (clientIp) {
    return "anon_" + createHash("sha256").update(clientIp).digest("hex").slice(0, 16);
  }
  return "anon_unknown";
}

// allowlist-fold cardinality so the dashboard stays readable
function normalizeClientName(name?: string): string {
  if (!name) return "unknown";
  const lower = name.toLowerCase().trim();
  for (const known of ALLOWED_CLIENTS) {
    if (lower === known || lower.includes(known)) return known;
  }
  return "other";
}

// best-effort client name from MCP clientInfo (initialize) or user-agent header
function clientNameFrom(
  rawClientInfo?: { name?: string },
  clientInfoHeader?: string
): { name: string; raw?: string } {
  if (rawClientInfo?.name) {
    return { name: normalizeClientName(rawClientInfo.name), raw: rawClientInfo.name };
  }
  if (clientInfoHeader) {
    // user-agent shapes like "claude-code/1.2.3 (...)" — first token before "/"
    const token = clientInfoHeader.split(/[/\s]/)[0];
    return { name: normalizeClientName(token), raw: clientInfoHeader };
  }
  return { name: "unknown" };
}

async function send(event: string, distinct_id: string, properties: Record<string, unknown>) {
  if (!enabled()) return;

  const payload = {
    api_key: projectKey() || "debug",
    event,
    distinct_id,
    properties: {
      ...properties,
      $lib: "docfork-mcp-server",
      $lib_version: SERVER_VERSION,
    },
    timestamp: new Date().toISOString(),
  };

  if (isDebug()) {
    process.stderr.write(`[analytics] ${event} ${JSON.stringify(payload)}\n`);
  }

  if (!projectKey()) return;

  // fire-and-forget. swallow all errors so analytics never breaks a tool call.
  try {
    await fetch(`${host()}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      // short timeout so a slow posthog never tail-latencies a tool response
      signal: AbortSignal.timeout(2000),
    });
  } catch {
    // intentional: never let analytics raise
  }
}

export function captureMcpInitialize(args: InitializeArgs): void {
  if (!enabled()) return;

  const { name, raw } = clientNameFrom(args.rawClientInfo, args.clientInfoHeader);
  const properties = {
    client_name: name,
    client_name_raw: raw,
    client_version: args.rawClientInfo?.version,
    protocol_version: args.protocolVersion,
    transport: args.transport,
    server_version: SERVER_VERSION,
    has_api_key: Boolean(args.apiKey),
  };

  // not awaited: fire-and-forget
  void send("mcp_initialize", distinctId(args.apiKey, args.clientIp), properties);
}

export function captureMcpToolCall(args: ToolCallArgs): void {
  if (!enabled()) return;

  const { name } = clientNameFrom(undefined, args.clientInfoHeader);
  const properties = {
    tool_name: args.toolName,
    duration_ms: Math.round(args.durationMs),
    ok: args.ok,
    error_kind: args.errorKind,
    client_name: name,
    transport: args.transport,
    server_version: SERVER_VERSION,
    has_api_key: Boolean(args.apiKey),
  };

  void send("mcp_tool_call", distinctId(args.apiKey, args.clientIp), properties);
}
