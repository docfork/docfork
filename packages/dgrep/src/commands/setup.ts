import { accent } from "../lib/theme.js";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { AGENTS, agentDisplayList, detectAgents, writeMcpConfigForAgent } from "../lib/agents.js";
import type { DetectedAgent } from "../lib/agents.js";

export interface SetupOptions {
  agents?: string[];
  yes?: boolean;
  cwd?: string;
}

export async function setup(options: SetupOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd();

  p.intro(accent().bg(pc.black(" dgrep setup ")));

  // detect agents
  const allAgents = await detectAgents(cwd);

  // filter to requested subset if --agent specified
  let agents: DetectedAgent[];
  if (options.agents && options.agents.length > 0) {
    const requested = new Set(options.agents);
    agents = allAgents.filter((a) => requested.has(a.name));

    if (agents.length === 0) {
      p.log.warning("Requested agents not detected in this project.");
      process.exitCode = 1;
      return;
    }
  } else {
    agents = allAgents;
  }

  if (agents.length === 0) {
    p.log.info(`No IDE agents detected (${agentDisplayList()}).`);
    p.outro("Nothing to set up.");
    return;
  }

  p.log.step(`Detected: ${agents.map((a) => accent().fg(a.displayName)).join(", ")}`);

  for (const agent of agents) {
    if (!options.yes) {
      if (agent.name === "claude-code") {
        p.log.info(
          `Or run manually:\n  ${accent().fg("claude mcp add --transport http docfork https://mcp.docfork.com/mcp")}`
        );
      }

      const writeConfig = await p.confirm({
        message: `Write MCP config for ${agent.displayName}? (${pc.dim(agent.configPath)})`,
      });
      if (!writeConfig || p.isCancel(writeConfig)) continue;
    }

    await writeMcpConfigForAgent(agent);
    p.log.success(`${agent.displayName}: ${pc.dim(agent.configPath)} updated`);

    const note = AGENTS[agent.name].postWriteNote;
    if (note) p.log.info(note);
  }

  p.outro("Done. Sign in to Docfork in your IDE on first use.");
}
