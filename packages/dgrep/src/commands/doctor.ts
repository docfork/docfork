import pc from "picocolors";
import { access } from "node:fs/promises";
import { join } from "node:path";
import { constants } from "node:fs";
import { loadConfig, configPath } from "../lib/config.js";
import { findProjectRoot, loadProjectConfig } from "../lib/project-config.js";
import { agentDisplayList, detectAgents } from "../lib/agents.js";
import { searchDocs } from "../lib/api-client.js";

export interface DoctorOptions {
  json?: boolean;
  cwd?: string;
}

interface Check {
  name: string;
  status: "pass" | "warn" | "fail";
  message: string;
}

export async function doctor(options: DoctorOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd();
  const checks: Check[] = [];

  // -- User config -----------------------------------

  const userConfig = await loadConfig();
  const configExists = Object.keys(userConfig).length > 0;

  checks.push({
    name: "User config",
    status: configExists ? "pass" : "warn",
    message: configExists ? configPath() : `Not found at ${configPath()}. Run dgrep to set up.`,
  });

  // -- API key -----------------------------------

  if (userConfig.apiKey) {
    checks.push({
      name: "API key",
      status: "pass",
      message: `${userConfig.apiKey.slice(0, 12)}...`,
    });

    // Check expiry for unclaimed keys
    if (userConfig.expiresAt && !userConfig.claimedAt) {
      const expires = new Date(userConfig.expiresAt);
      const isExpired = expires < new Date();
      checks.push({
        name: "Key expiry",
        status: isExpired ? "fail" : "warn",
        message: isExpired
          ? `Expired ${expires.toLocaleDateString()}. Run dgrep login or dgrep to re-provision.`
          : `Expires ${expires.toLocaleDateString()}. Run dgrep login to get a permanent key.`,
      });
    }
  } else {
    checks.push({
      name: "API key",
      status: "fail",
      message: "Not set. Run dgrep to provision one.",
    });
  }

  // -- Account -----------------------------------

  checks.push({
    name: "Account",
    status: userConfig.claimedAt ? "pass" : "warn",
    message: userConfig.claimedAt ? "Linked" : "Not linked. Run dgrep login for 1K/mo free.",
  });

  // -- Project config -----------------------------------

  const projectRoot = await findProjectRoot(cwd);
  const projectConfig = projectRoot ? await loadProjectConfig(projectRoot) : null;

  if (projectConfig?.libraries && projectConfig.libraries.length > 0) {
    checks.push({
      name: "Project config",
      status: "pass",
      message: `${projectConfig.libraries.length} libraries tracked`,
    });
  } else if (projectRoot) {
    // Check if package.json exists (could init)
    try {
      await access(join(projectRoot, "package.json"), constants.F_OK);
      checks.push({
        name: "Project config",
        status: "warn",
        message: "No .dgrep/config.json. Run dgrep init to track libraries.",
      });
    } catch {
      checks.push({
        name: "Project config",
        status: "warn",
        message: "No package.json or .dgrep/config.json found.",
      });
    }
  } else {
    checks.push({
      name: "Project config",
      status: "warn",
      message: "Not in a project directory.",
    });
  }

  // -- Agent detection -----------------------------------

  const agents = await detectAgents(cwd);

  if (agents.length > 0) {
    for (const agent of agents) {
      // Check if MCP config exists and has docfork
      try {
        const raw = await (await import("node:fs/promises")).readFile(agent.configPath, "utf-8");
        const config = JSON.parse(raw);
        const hasDocfork = config?.mcpServers?.docfork || config?.mcp?.docfork;
        checks.push({
          name: `${agent.displayName} MCP`,
          status: hasDocfork ? "pass" : "warn",
          message: hasDocfork
            ? `Docfork configured in ${agent.configPath}`
            : `Detected but Docfork not in MCP config. Run dgrep to set up.`,
        });
      } catch {
        checks.push({
          name: `${agent.displayName} MCP`,
          status: "warn",
          message: `Detected but no MCP config at ${agent.configPath}`,
        });
      }
    }
  } else {
    checks.push({
      name: "Agents",
      status: "warn",
      message: `None detected (${agentDisplayList()})`,
    });
  }

  // -- API connectivity -----------------------------------

  if (userConfig.apiKey) {
    try {
      await searchDocs("test", "react", { apiKey: userConfig.apiKey });
      checks.push({
        name: "API connection",
        status: "pass",
        message: "api.docfork.com reachable, search working",
      });
    } catch (err) {
      checks.push({
        name: "API connection",
        status: "fail",
        message: err instanceof Error ? err.message : "Failed to connect",
      });
    }
  }

  // -- Output -----------------------------------

  if (options.json) {
    console.log(JSON.stringify({ checks }));
    return;
  }

  console.log(`\n  ${pc.bold("dgrep doctor")}\n`);

  const icons = { pass: pc.green("✓"), warn: pc.yellow("⚠"), fail: pc.red("✗") };

  for (const check of checks) {
    console.log(`  ${icons[check.status]} ${pc.bold(check.name.padEnd(18))} ${check.message}`);
  }

  const fails = checks.filter((c) => c.status === "fail").length;
  const warns = checks.filter((c) => c.status === "warn").length;

  console.log("");
  if (fails > 0) {
    console.log(`  ${pc.red(`${fails} issue(s) found.`)} Fix the items marked ✗ above.`);
  } else if (warns > 0) {
    console.log(`  ${pc.yellow(`${warns} suggestion(s).`)} Everything works, but could be better.`);
  } else {
    console.log(`  ${pc.green("All checks passed!")}`);
  }
  console.log("");
}
