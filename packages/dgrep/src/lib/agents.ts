import { access, readFile, writeFile, copyFile, mkdir } from "node:fs/promises";
import { join, dirname } from "node:path";
import { constants } from "node:fs";

// -- Types -----------------------------------

export type AgentType = "cursor" | "claude-code" | "opencode";

// probe kinds expand as new agents land (user-dir, binary, etc.)
export type ProbeSpec = { kind: "project-dir"; path: string };

export interface DetectedAgent {
  name: AgentType;
  displayName: string;
  configPath: string;
}

export interface AgentConfig {
  name: AgentType;
  displayName: string;
  probe: ProbeSpec;
  configPath: string; // relative to project root for project-dir agents
  buildServerEntry: (apiKey: string) => Record<string, unknown>;
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
  "claude-code": {
    name: "claude-code",
    displayName: "Claude Code",
    probe: { kind: "project-dir", path: ".claude" },
    configPath: ".mcp.json",
    buildServerEntry: (apiKey) => ({
      type: "http",
      url: "https://mcp.docfork.com/mcp",
      headers: { DOCFORK_API_KEY: apiKey },
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
};

// -- Detection -----------------------------------

export async function detectAgents(cwd?: string): Promise<DetectedAgent[]> {
  const dir = cwd ?? process.cwd();
  const detected: DetectedAgent[] = [];

  await Promise.all(
    Object.values(AGENTS).map(async (agent) => {
      try {
        await access(join(dir, agent.probe.path), constants.F_OK);
        detected.push({
          name: agent.name,
          displayName: agent.displayName,
          configPath: join(dir, agent.configPath),
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

// -- Config writing -----------------------------------

export async function writeMcpConfigForAgent(
  agent: DetectedAgent,
  apiKey: string
): Promise<void> {
  const def = AGENTS[agent.name];
  const serverEntry = def.buildServerEntry(apiKey);

  // read existing config; back it up before modifying
  let existing: Record<string, unknown> = {};
  try {
    const raw = await readFile(agent.configPath, "utf-8");
    existing = JSON.parse(raw) as Record<string, unknown>;
    await copyFile(agent.configPath, agent.configPath + ".bak");
  } catch {
    // file doesn't exist, start fresh
  }

  const updated = def.mergeConfig(existing, serverEntry);

  await mkdir(dirname(agent.configPath), { recursive: true });
  await writeFile(agent.configPath, JSON.stringify(updated, null, 2) + "\n");
}
