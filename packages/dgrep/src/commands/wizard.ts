import * as p from "@clack/prompts";
import pc from "picocolors";
import { readFile, writeFile, copyFile } from "node:fs/promises";
import { resolveAuth } from "../lib/auth.js";
import { loadConfig, saveConfig } from "../lib/config.js";
import { detectAgents } from "../lib/agents.js";
import type { DetectedAgent } from "../lib/agents.js";
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
  p.log.step("Welcome to dgrep — documentation grounding for AI agents");

  // -- Detect agents -----------------------------------

  const agents = await detectAgents(cwd);

  if (agents.length > 0) {
    p.log.success(`Detected: ${agents.map((a) => pc.cyan(a.displayName)).join(", ")}`);
  } else {
    p.log.info("No IDE agents detected (Cursor, Claude Code).");
  }

  // -- Resolve or provision credentials -----------------------------------

  const auth = await resolveAuth(options.apiKey);

  if (auth.apiKey) {
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

      const result = (await response.json()) as {
        apiKey: string;
        expiresAt?: string;
      };

      await saveConfig({
        apiKey: result.apiKey,
        expiresAt: result.expiresAt,
      });

      auth.apiKey = result.apiKey;
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
        const writeConfig = await p.confirm({
          message: `Write MCP config for ${agent.displayName}?`,
        });
        if (!writeConfig || p.isCancel(writeConfig)) continue;
      }

      await writeMcpConfig(agent, auth.apiKey!);
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
  p.log.info(`Run ${pc.cyan("dgrep claim")} to link this key to your Docfork account.`);

  p.outro("Setup complete.");
}

async function writeMcpConfig(agent: DetectedAgent, apiKey: string): Promise<void> {
  const docforkServer = {
    command: "npx",
    args: ["-y", "docfork@latest"],
    env: {
      DOCFORK_API_KEY: apiKey,
    },
  };

  let existing: Record<string, unknown> = {};

  try {
    const raw = await readFile(agent.configPath, "utf-8");
    existing = JSON.parse(raw) as Record<string, unknown>;
    // Backup before modifying
    await copyFile(agent.configPath, agent.configPath + ".bak");
  } catch {
    // File doesn't exist, start fresh
  }

  const mcpServers = (existing.mcpServers ?? {}) as Record<string, unknown>;
  mcpServers["docfork"] = docforkServer;

  const updated = { ...existing, mcpServers };
  await writeFile(agent.configPath, JSON.stringify(updated, null, 2) + "\n");
}
