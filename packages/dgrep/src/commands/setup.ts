import { accent } from "../lib/theme.js";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { resolveAuth } from "../lib/auth.js";
import { agentDisplayList, detectAgents, writeMcpConfigForAgent } from "../lib/agents.js";
import type { DetectedAgent } from "../lib/agents.js";

export interface SetupOptions {
  cursor?: boolean;
  claude?: boolean;
  opencode?: boolean;
  yes?: boolean;
  apiKey?: string;
  cwd?: string;
}

export async function setup(options: SetupOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd();

  p.intro(accent().bg(pc.black(" dgrep setup ")));

  const auth = await resolveAuth(options.apiKey);
  const apiKey = auth.apiKey;

  if (!apiKey) {
    p.log.error(
      `No API key found. Run ${accent().fg("dgrep login")} or ${accent().fg("npx dgrep")} first.`
    );
    process.exitCode = 1;
    return;
  }

  // detect agents
  const allAgents = await detectAgents(cwd);

  // filter by flags if specified
  const filterFlags = options.cursor || options.claude || options.opencode;
  let agents: DetectedAgent[];

  if (filterFlags) {
    agents = allAgents.filter((a) => {
      if (options.cursor && a.name === "cursor") return true;
      if (options.claude && a.name === "claude-code") return true;
      if (options.opencode && a.name === "opencode") return true;
      return false;
    });

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
          `Or run manually:\n  ${accent().fg(`claude mcp add --transport http docfork https://mcp.docfork.com/mcp --header "DOCFORK_API_KEY: ${apiKey}"`)}`
        );
      }

      const writeConfig = await p.confirm({
        message: `Write MCP config for ${agent.displayName}? (${pc.dim(agent.configPath)})`,
      });
      if (!writeConfig || p.isCancel(writeConfig)) continue;
    }

    await writeMcpConfigForAgent(agent, apiKey);
    p.log.success(`${agent.displayName}: ${pc.dim(agent.configPath)} updated`);
  }

  p.outro("Done. Your IDE agents can now use Docfork.");
}
