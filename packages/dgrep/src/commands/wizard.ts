import { accent } from "../lib/theme.js";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { AGENTS, agentDisplayList, detectAgents, writeMcpConfigForAgent } from "../lib/agents.js";

export interface WizardOptions {
  yes?: boolean;
  cwd?: string;
}

export async function wizard(options: WizardOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd();

  p.intro(accent().bg(pc.black(" dgrep ")));
  p.log.step("Welcome to dgrep — the Context CLI for AI Agents by Docfork");

  // -- Detect agents -----------------------------------

  const agents = await detectAgents(cwd);

  if (agents.length > 0) {
    p.log.success(`Detected: ${agents.map((a) => accent().fg(a.displayName)).join(", ")}`);
  } else {
    p.log.info(`No IDE agents detected (${agentDisplayList()}).`);
  }

  // -- Write MCP configs -----------------------------------

  if (agents.length > 0) {
    for (const agent of agents) {
      if (!options.yes) {
        // Show manual CLI alternative for Claude Code
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
  }

  // -- Summary -----------------------------------

  p.log.message("");
  p.log.step("Next steps:");
  if (agents.length > 0) {
    p.log.info(`Sign in to Docfork in ${agents[0].displayName} on first use.`);
  }
  p.log.info(`Run ${accent().fg("dgrep init")} to track your project's libraries.`);
  p.log.info(`Run ${accent().fg("dgrep login")} to link your account (1K/mo free).`);

  p.outro("Setup complete.");
}
