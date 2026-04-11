import { accent } from "../lib/theme.js";
import * as p from "@clack/prompts";
import pc from "picocolors";
import { resolveAuth } from "../lib/auth.js";
import { saveConfig } from "../lib/config.js";
import { detectAgents, writeMcpConfigForAgent } from "../lib/agents.js";
import { provisionKey } from "../lib/api-client.js";

export interface WizardOptions {
  yes?: boolean;
  apiKey?: string;
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
    p.log.info("No IDE agents detected (Cursor, Claude Code, OpenCode).");
  }

  // -- Resolve or provision credentials -----------------------------------

  const auth = await resolveAuth(options.apiKey);
  let apiKey = auth.apiKey;

  if (apiKey) {
    p.log.success("API key found.");
  } else {
    p.log.step("Provisioning API key (no login required)...");

    const provisionSpinner = p.spinner();
    provisionSpinner.start("Provisioning...");

    const result = await provisionKey();
    apiKey = result.api_key;

    if (!apiKey) {
      provisionSpinner.stop("Failed.");
      throw new Error("Provision response missing API key. Try again or run `dgrep login`.");
    }

    await saveConfig({
      apiKey,
      expiresAt: result.expires_at,
    });

    provisionSpinner.stop("API key provisioned.");
  }

  // -- Write MCP configs -----------------------------------

  if (agents.length > 0) {
    for (const agent of agents) {
      if (!options.yes) {
        // Show manual CLI alternative for Claude Code
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

      await writeMcpConfigForAgent(agent, apiKey!);
      p.log.success(`${agent.displayName}: ${pc.dim(agent.configPath)} updated`);
    }
  }

  // -- Summary -----------------------------------

  p.log.message("");
  p.log.step("Next steps:");
  if (agents.length > 0) {
    p.log.info(`Your IDE agents can now use Docfork. Try searching in ${agents[0].displayName}!`);
  }
  p.log.info(`Run ${accent().fg("dgrep init")} to track your project's libraries.`);
  p.log.info(`Run ${accent().fg("dgrep login")} to link your account (1K/mo free).`);

  p.outro("Setup complete.");
}
