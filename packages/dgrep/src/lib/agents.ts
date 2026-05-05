import { access, readFile, writeFile, copyFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { constants } from "node:fs";
import { homedir } from "node:os";
import { parse as parseToml, stringify as stringifyToml } from "smol-toml";

// -- Types -----------------------------------

export type AgentType =
  | "cursor"
  | "claude-code"
  | "opencode"
  | "codex"
  | "vscode"
  | "windsurf";

// path is relative to project root for project-dir, relative to homedir for user-dir
export type ProbeSpec =
  | { kind: "project-dir"; path: string }
  | { kind: "user-dir"; path: string };

export type WriteFormat = "json" | "toml";

export interface DetectedAgent {
  name: AgentType;
  displayName: string;
  configPath: string;
}

export interface AgentConfig {
  name: AgentType;
  displayName: string;
  probe: ProbeSpec;
  // resolved against cwd (project-dir) or homedir (user-dir)
  configPath: string;
  // defaults to "json" when omitted
  writeFormat?: WriteFormat;
  // optional one-line hint shown after a successful write
  postWriteNote?: string;
  // url-only stanza; the IDE handles MCP-spec OAuth on first connect
  buildServerEntry: () => Record<string, unknown>;
  mergeConfig: (
    existing: Record<string, unknown>,
    serverEntry: Record<string, unknown>
  ) => Record<string, unknown>;
}

// -- Registry -----------------------------------

export const AGENTS: Record<AgentType, AgentConfig> = {
  cursor: {
    name: "cursor",
    displayName: "Cursor",
    probe: { kind: "project-dir", path: ".cursor" },
    configPath: ".cursor/mcp.json",
    buildServerEntry: () => ({
      url: "https://mcp.docfork.com/mcp",
    }),
    mergeConfig: (existing, entry) => {
      const mcpServers = (existing.mcpServers ?? {}) as Record<string, unknown>;
      mcpServers["docfork"] = entry;
      return { ...existing, mcpServers };
    },
  },
  "claude-code": {
    name: "claude-code",
    displayName: "Claude Code",
    probe: { kind: "project-dir", path: ".claude" },
    configPath: ".mcp.json",
    buildServerEntry: () => ({
      type: "http",
      url: "https://mcp.docfork.com/mcp",
    }),
    mergeConfig: (existing, entry) => {
      const mcpServers = (existing.mcpServers ?? {}) as Record<string, unknown>;
      mcpServers["docfork"] = entry;
      return { ...existing, mcpServers };
    },
  },
  opencode: {
    name: "opencode",
    displayName: "OpenCode",
    probe: { kind: "project-dir", path: ".opencode" },
    configPath: "opencode.json",
    buildServerEntry: () => ({
      type: "remote",
      url: "https://mcp.docfork.com/mcp",
      enabled: true,
    }),
    mergeConfig: (existing, entry) => {
      const mcp = (existing.mcp ?? {}) as Record<string, unknown>;
      mcp["docfork"] = entry;
      return { ...existing, mcp };
    },
  },
  codex: {
    name: "codex",
    displayName: "OpenAI Codex",
    probe: { kind: "user-dir", path: ".codex" },
    configPath: ".codex/config.toml",
    writeFormat: "toml",
    postWriteNote: "Run `codex mcp login docfork` to complete OAuth.",
    buildServerEntry: () => ({
      url: "https://mcp.docfork.com/mcp",
    }),
    mergeConfig: (existing, entry) => {
      const mcpServers = (existing.mcp_servers ?? {}) as Record<string, unknown>;
      mcpServers["docfork"] = entry;
      return { ...existing, mcp_servers: mcpServers };
    },
  },
  vscode: {
    name: "vscode",
    displayName: "VS Code",
    probe: { kind: "project-dir", path: ".vscode" },
    configPath: ".vscode/mcp.json",
    buildServerEntry: () => ({
      type: "http",
      url: "https://mcp.docfork.com/mcp",
    }),
    mergeConfig: (existing, entry) => {
      const servers = (existing.servers ?? {}) as Record<string, unknown>;
      servers["docfork"] = entry;
      return { ...existing, servers };
    },
  },
  windsurf: {
    name: "windsurf",
    displayName: "Windsurf",
    probe: { kind: "user-dir", path: ".codeium/windsurf" },
    configPath: ".codeium/windsurf/mcp_config.json",
    // windsurf uses serverUrl (not url); docs say it supports OAuth for each transport type
    buildServerEntry: () => ({
      serverUrl: "https://mcp.docfork.com/mcp",
    }),
    mergeConfig: (existing, entry) => {
      const mcpServers = (existing.mcpServers ?? {}) as Record<string, unknown>;
      mcpServers["docfork"] = entry;
      return { ...existing, mcpServers };
    },
  },
};

// -- Detection -----------------------------------

function probeRoot(probe: ProbeSpec, cwd: string, home: string): string {
  return probe.kind === "project-dir" ? cwd : home;
}

export async function detectAgents(cwd?: string, home?: string): Promise<DetectedAgent[]> {
  const dir = cwd ?? process.cwd();
  const userHome = home ?? homedir();
  const detected: DetectedAgent[] = [];

  await Promise.all(
    Object.values(AGENTS).map(async (agent) => {
      const root = probeRoot(agent.probe, dir, userHome);
      try {
        await access(join(root, agent.probe.path), constants.F_OK);
        detected.push({
          name: agent.name,
          displayName: agent.displayName,
          configPath: join(root, agent.configPath),
        });
      } catch {
        // probe target missing
      }
    })
  );

  return detected.sort((a, b) => a.name.localeCompare(b.name));
}

export function getAgentDefinition(name: string): AgentConfig | undefined {
  return (AGENTS as Record<string, AgentConfig | undefined>)[name];
}

// comma-joined display names — used in "No IDE agents detected (...)" messages
export function agentDisplayList(): string {
  return Object.values(AGENTS)
    .map((a) => a.displayName)
    .join(", ");
}

// -- Config writing -----------------------------------

export async function writeMcpConfigForAgent(agent: DetectedAgent): Promise<void> {
  const def = AGENTS[agent.name];
  const serverEntry = def.buildServerEntry();
  const format = def.writeFormat ?? "json";

  // read existing config; back it up before modifying
  let existing: Record<string, unknown> = {};
  try {
    const raw = await readFile(agent.configPath, "utf-8");
    existing =
      format === "toml"
        ? (parseToml(raw) as Record<string, unknown>)
        : (JSON.parse(raw) as Record<string, unknown>);
    await copyFile(agent.configPath, agent.configPath + ".bak");
  } catch {
    // file doesn't exist, start fresh
  }

  const updated = def.mergeConfig(existing, serverEntry);

  await mkdir(dirname(agent.configPath), { recursive: true });
  const serialized =
    format === "toml" ? stringifyToml(updated) + "\n" : JSON.stringify(updated, null, 2) + "\n";
  await writeFile(agent.configPath, serialized);
}
