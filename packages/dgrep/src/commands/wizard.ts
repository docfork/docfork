import * as p from "@clack/prompts";
import pc from "picocolors";
import { resolveAuth } from "../lib/auth.js";
import { saveConfig } from "../lib/config.js";
import { detectAgents, writeMcpConfigForAgent } from "../lib/agents.js";
import { NetworkError } from "../lib/errors.js";

const API_URL = "https://api.docfork.com/v1";

export interface WizardOptions {
  yes?: boolean;
  apiKey?: string;
  cwd?: string;
}

export async function wizard(options: WizardOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd();

  p.intro(pc.bgCyan(pc.black(" dgrep ")));
  p.log.step("Welcome to dgrep — the Context CLI for AI Agents by Docfork");

  // -- Detect agents -----------------------------------

  const agents = await detectAgents(cwd);

  if (agents.length > 0) {
    p.log.success(`Detected: ${agents.map((a) => pc.cyan(a.displayName)).join(", ")}`);
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

    try {
      const response = await fetch(`${API_URL}/keys/provision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        provisionSpinner.stop("Failed.");
        const text = await response.text();
        throw new Error(`Provision failed: ${response.status} ${text.slice(0, 200)}`);
      }

      const result = (await response.json()) as Record<string, unknown>;
      // Backend may return apiKey or api_key
      apiKey = (result.apiKey ?? result.api_key ?? result.key) as string | undefined;

      if (!apiKey) {
        provisionSpinner.stop("Failed.");
        p.log.error(`Unexpected provision response: ${JSON.stringify(result).slice(0, 200)}`);
        throw new Error("Provision response missing API key.");
      }

      await saveConfig({
        apiKey,
        expiresAt: (result.expiresAt ?? result.expires_at) as string | undefined,
      });

      provisionSpinner.stop("API key provisioned.");
    } catch (err) {
      if (err instanceof TypeError) {
        provisionSpinner.stop("Failed.");
        throw new NetworkError("Could not reach api.docfork.com. Check your connection.");
      }
      throw err;
    }
  }

  // -- Write MCP configs -----------------------------------

  if (agents.length > 0) {
    for (const agent of agents) {
      if (!options.yes) {
        // Show manual CLI alternative for Claude Code
        if (agent.name === "claude-code") {
          p.log.info(
            `Or run manually:\n  ${pc.cyan(`claude mcp add --transport http docfork https://mcp.docfork.com/mcp --header "DOCFORK_API_KEY: ${apiKey}"`)}`
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
  p.log.info(`Run ${pc.cyan("dgrep init")} to track your project's libraries.`);
  p.log.info(`Run ${pc.cyan("dgrep login")} to link your account (1K/mo free).`);

  p.outro("Setup complete.");
}
