import { accent } from "../lib/theme.js";
import pc from "picocolors";
import { loadConfig, configPath } from "../lib/config.js";
import { findProjectRoot, loadProjectConfig } from "../lib/project-config.js";
import { AGENTS, detectAgents } from "../lib/agents.js";
import type { AgentType } from "../lib/agents.js";
import { detectProjectDeps } from "../lib/detect-deps.js";

const VERSION = "0.1.0";

export interface StatusOptions {
  json?: boolean;
  cwd?: string;
}

export async function status(options: StatusOptions = {}): Promise<void> {
  const cwd = options.cwd ?? process.cwd();

  const userConfig = await loadConfig();
  const projectRoot = await findProjectRoot(cwd);
  const projectConfig = projectRoot ? await loadProjectConfig(projectRoot) : null;
  const agents = await detectAgents(cwd);
  const detected = await detectProjectDeps(cwd);

  const hasApiKey = !!userConfig.apiKey;
  const isClaimed = !!userConfig.claimedAt;
  const keyPrefix = userConfig.apiKey ? userConfig.apiKey.slice(0, 12) : null;
  const detectedNames = new Set(agents.map((a) => a.name));
  const libs = projectConfig?.libraries ?? [];

  // -- JSON -----------------------------------

  if (options.json) {
    console.log(
      JSON.stringify({
        version: VERSION,
        project: {
          root: projectRoot ?? cwd,
          isMonorepo: detected.isMonorepo,
          packageCount: detected.packageCount,
        },
        auth: {
          hasApiKey,
          isClaimed,
          email: userConfig.email ?? null,
          orgName: userConfig.orgName ?? null,
          orgSlug: userConfig.orgSlug ?? null,
          keyPrefix,
          expiresAt: userConfig.expiresAt ?? null,
          cabinet: userConfig.cabinet ?? null,
        },
        libraries: libs,
        librarySource: libs.length > 0 ? "project" : detected.deps.length > 0 ? "detected" : "none",
        agents: (Object.keys(AGENTS) as AgentType[]).map((name) => ({
          name,
          detected: detectedNames.has(name),
        })),
        config: {
          user: configPath(),
          project: projectRoot ? `${projectRoot}/.dgrep/config.json` : null,
        },
      })
    );
    return;
  }

  // -- Pretty -----------------------------------

  const label = (l: string) => pc.dim(`${l.padEnd(16)}`);

  console.log("");
  console.log(`  ${pc.bold(`dgrep`)} ${pc.dim(`v${VERSION}`)}`);
  console.log("");

  // Project
  console.log(`  ${label("Project")}${projectRoot ?? cwd}`);
  if (detected.isMonorepo) {
    console.log(`  ${label("Monorepo")}${detected.packageCount} packages`);
  }

  console.log("");

  // Auth
  if (hasApiKey) {
    console.log(`  ${label("API key")}${pc.green("✓")} ${keyPrefix}...`);
  } else {
    console.log(`  ${label("API key")}${pc.red("✗")} not set`);
  }

  if (isClaimed) {
    const acct = userConfig.email || "linked";
    console.log(`  ${label("Account")}${pc.green("✓")} ${acct}`);
    if (userConfig.orgName) {
      const slug = userConfig.orgSlug ? pc.dim(` (${userConfig.orgSlug})`) : "";
      console.log(`  ${label("Workspace")}${userConfig.orgName}${slug}`);
    }
  } else if (hasApiKey) {
    console.log(
      `  ${label("Account")}${pc.yellow("⚠")} unclaimed — run ${accent().fg("dgrep login")}`
    );
  } else {
    console.log(`  ${label("Account")}${pc.dim("—")} run ${accent().fg("dgrep")} to get started`);
  }

  if (userConfig.cabinet) {
    console.log(`  ${label("Cabinet")}${userConfig.cabinet}`);
  }

  if (userConfig.expiresAt && !isClaimed) {
    const expires = new Date(userConfig.expiresAt);
    const isExpired = expires < new Date();
    console.log(
      `  ${label("Expires")}${isExpired ? pc.red("expired") : expires.toLocaleDateString()}`
    );
  }

  console.log("");

  // Libraries
  if (libs.length > 0) {
    const MAX_SHOW = 10;
    const names = libs.map((l) => l.identifier);
    const shown = names.slice(0, MAX_SHOW).join(", ");
    const suffix = libs.length > MAX_SHOW ? ` ${pc.dim(`(+${libs.length - MAX_SHOW} more)`)}` : "";
    console.log(`  ${label("Libraries")}${shown}${suffix} (${libs.length} tracked)`);
    console.log(`  ${label("Source")}.dgrep/config.json`);
  } else if (detected.deps.length > 0) {
    console.log(
      `  ${label("Libraries")}${pc.yellow("none tracked")} (${detected.deps.length} detected)`
    );
    console.log(`  ${label("Tip")}run ${accent().fg("dgrep init")}`);
  } else {
    console.log(`  ${label("Libraries")}${pc.dim("none")}`);
  }

  console.log("");

  // Agents
  const agentParts = Object.values(AGENTS).map((agent) => {
    const mark = detectedNames.has(agent.name) ? pc.green("✓") : pc.red("✗");
    return `${agent.displayName} ${mark}`;
  });
  console.log(`  ${label("Agents")}${agentParts.join("  ")}`);

  console.log("");

  // Config paths
  console.log(`  ${label("User config")}${configPath()}`);
  if (projectRoot) {
    console.log(`  ${label("Project config")}${projectRoot}/.dgrep/config.json`);
  } else {
    console.log(`  ${label("Project config")}${pc.dim("not initialized")}`);
  }

  console.log("");
}
