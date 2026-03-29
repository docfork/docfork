import { access, readFile, writeFile, copyFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { constants } from "node:fs";

export interface DetectedAgent {
  name: string;
  displayName: string;
  configPath: string;
}

export interface AgentDefinition {
  name: string;
  displayName: string;
  /** Directory to probe for detection (relative to project root) */
  probeDir: string;
  /** Config file path (relative to project root) */
  configPath: string;
  /** Build the MCP server entry for this agent */
  buildServerEntry: (apiKey: string) => Record<string, unknown>;
  /** Read existing config, merge docfork server, return updated config */
  mergeConfig: (
    existing: Record<string, unknown>,
    serverEntry: Record<string, unknown>
  ) => Record<string, unknown>;
}

// -- Agent definitions -----------------------------------

const AGENTS: AgentDefinition[] = [
  {
    name: "cursor",
    displayName: "Cursor",
    probeDir: ".cursor",
    configPath: ".cursor/mcp.json",
    buildServerEntry: (apiKey) => ({
      url: "https://mcp.docfork.com/mcp",
      headers: { DOCFORK_API_KEY: apiKey },
    }),
    mergeConfig: (existing, entry) => {
      const mcpServers = (existing.mcpServers ?? {}) as Record<string, unknown>;
      mcpServers["docfork"] = entry;
      return { ...existing, mcpServers };
    },
  },
  {
    name: "claude-code",
    displayName: "Claude Code",
    probeDir: ".claude",
    configPath: ".mcp.json",
    buildServerEntry: (apiKey) => ({
      type: "streamable-http",
      url: "https://mcp.docfork.com/mcp",
      headers: { DOCFORK_API_KEY: apiKey },
    }),
    mergeConfig: (existing, entry) => {
      const mcpServers = (existing.mcpServers ?? {}) as Record<string, unknown>;
      mcpServers["docfork"] = entry;
      return { ...existing, mcpServers };
    },
  },
  {
    name: "opencode",
    displayName: "OpenCode",
    probeDir: ".opencode",
    configPath: "opencode.json",
    buildServerEntry: (apiKey) => ({
      type: "remote",
      url: "https://mcp.docfork.com/mcp",
      headers: { DOCFORK_API_KEY: apiKey },
      enabled: true,
    }),
    mergeConfig: (existing, entry) => {
      const mcp = (existing.mcp ?? {}) as Record<string, unknown>;
      mcp["docfork"] = entry;
      return { ...existing, mcp };
    },
  },
];

// -- Detection -----------------------------------

export async function detectAgents(cwd?: string): Promise<DetectedAgent[]> {
  const dir = cwd ?? process.cwd();
  const detected: DetectedAgent[] = [];

  const checks = AGENTS.map(async (agent) => {
    try {
      await access(join(dir, agent.probeDir), constants.F_OK);
      detected.push({
        name: agent.name,
        displayName: agent.displayName,
        configPath: join(dir, agent.configPath),
      });
    } catch {
      // not found
    }
  });

  await Promise.all(checks);
  return detected.sort((a, b) => a.name.localeCompare(b.name));
}

export function getAgentDefinition(name: string): AgentDefinition | undefined {
  return AGENTS.find((a) => a.name === name);
}

// -- Config writing -----------------------------------

export async function writeMcpConfigForAgent(agent: DetectedAgent, apiKey: string): Promise<void> {
  const def = getAgentDefinition(agent.name);
  if (!def) return;

  const serverEntry = def.buildServerEntry(apiKey);

  // Read existing config
  let existing: Record<string, unknown> = {};
  try {
    const raw = await readFile(agent.configPath, "utf-8");
    existing = JSON.parse(raw) as Record<string, unknown>;
    // Backup before modifying
    await copyFile(agent.configPath, agent.configPath + ".bak");
  } catch {
    // File doesn't exist, start fresh
  }

  const updated = def.mergeConfig(existing, serverEntry);

  // Ensure parent directory exists
  await mkdir(dirname(agent.configPath), { recursive: true });
  await writeFile(agent.configPath, JSON.stringify(updated, null, 2) + "\n");
}
