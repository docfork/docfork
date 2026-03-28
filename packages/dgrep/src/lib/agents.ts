import { access } from "node:fs/promises";
import { join } from "node:path";
import { constants } from "node:fs";

export interface DetectedAgent {
  name: string;
  configPath: string;
  displayName: string;
}

interface AgentProbe {
  name: string;
  displayName: string;
  dirName: string;
  configFile: string;
}

const AGENTS: AgentProbe[] = [
  {
    name: "cursor",
    displayName: "Cursor",
    dirName: ".cursor",
    configFile: "mcp.json",
  },
  {
    name: "claude-code",
    displayName: "Claude Code",
    dirName: ".claude",
    configFile: "../.mcp.json", // .mcp.json is at project root, not inside .claude/
  },
];

export async function detectAgents(cwd?: string): Promise<DetectedAgent[]> {
  const dir = cwd ?? process.cwd();
  const detected: DetectedAgent[] = [];

  for (const agent of AGENTS) {
    try {
      await access(join(dir, agent.dirName), constants.F_OK);

      const configPath =
        agent.name === "claude-code"
          ? join(dir, ".mcp.json")
          : join(dir, agent.dirName, agent.configFile);

      detected.push({
        name: agent.name,
        configPath,
        displayName: agent.displayName,
      });
    } catch {
      // directory doesn't exist
    }
  }

  return detected;
}
