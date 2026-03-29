import pc from "picocolors";
import { loadConfig, configPath } from "../lib/config.js";
import { findProjectRoot, loadProjectConfig } from "../lib/project-config.js";
import { detectAgents } from "../lib/agents.js";
import { detectProjectDeps } from "../lib/detect-deps.js";

const VERSION = "0.1.0";

const KNOWN_AGENTS = ["cursor", "claude-code", "opencode"] as const;
const AGENT_DISPLAY: Record<string, string> = {
  cursor: "Cursor",
  "claude-code": "Claude Code",
  opencode: "OpenCode",
};

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
          keyPrefix,
          expiresAt: userConfig.expiresAt ?? null,
          cabinet: userConfig.cabinet ?? null,
        },
        libraries: libs,
        librarySource: libs.length > 0 ? "project" : detected.deps.length > 0 ? "detected" : "none",
        agents: KNOWN_AGENTS.map((name) => ({
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
    console.log(`  ${label("Account")}${pc.green("✓")} claimed`);
  } else if (hasApiKey) {
    console.log(`  ${label("Account")}${pc.yellow("⚠")} unclaimed — run ${pc.cyan("dgrep claim")}`);
  } else {
    console.log(`  ${label("Account")}${pc.dim("—")} run ${pc.cyan("dgrep")} to get started`);
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
    console.log(`  ${label("Libraries")}${libs.join(", ")} (${libs.length} tracked)`);
    console.log(`  ${label("Source")}.dgrep/config.json`);
  } else if (detected.deps.length > 0) {
    console.log(
      `  ${label("Libraries")}${pc.yellow("none tracked")} (${detected.deps.length} detected)`
    );
    console.log(`  ${label("Tip")}run ${pc.cyan("dgrep init")}`);
  } else {
    console.log(`  ${label("Libraries")}${pc.dim("none")}`);
  }

  console.log("");

  // Agents
  const agentParts = KNOWN_AGENTS.map((name) => {
    const display = AGENT_DISPLAY[name];
    return detectedNames.has(name) ? `${display} ${pc.green("✓")}` : `${display} ${pc.red("✗")}`;
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
