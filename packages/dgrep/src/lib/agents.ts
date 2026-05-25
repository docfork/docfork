import { access, readFile, writeFile, copyFile, mkdir } from "node:fs/promises";
import { join, dirname, delimiter } from "node:path";
import { constants } from "node:fs";
import { homedir } from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { parse as parseToml, stringify as stringifyToml } from "smol-toml";

const execFileAsync = promisify(execFile);

// -- Types -----------------------------------

export type AgentType =
  | "cursor"
  | "claude-code"
  | "opencode"
  | "codex"
  | "vscode"
  | "windsurf"
  | "amp"
  | "factory"
  | "zed";

// path is relative to project root for project-dir, relative to homedir for user-dir;
// binary kind probes for an executable on $PATH (cross-platform)
export type ProbeSpec =
  | { kind: "project-dir"; path: string }
  | { kind: "user-dir"; path: string }
  | { kind: "binary"; name: string };

export type WriteFormat = "json" | "toml";

// file: read/merge/write a config file. shell: invoke a CLI that owns the config
export type AgentWriter =
  | {
      kind: "file";
      // resolved against cwd (project-dir) or homedir (user-dir)
      configPath: string;
      format?: WriteFormat; // defaults to "json"
      buildServerEntry: () => Record<string, unknown>;
      mergeConfig: (
        existing: Record<string, unknown>,
        serverEntry: Record<string, unknown>
      ) => Record<string, unknown>;
    }
  | { kind: "shell"; bin: string; args: string[] };

export interface DetectedAgent {
  name: AgentType;
  displayName: string;
  // for file writers: absolute config path. for shell writers: a human-readable command preview.
  configPath: string;
}

export interface AgentConfig {
  name: AgentType;
  displayName: string;
  probe: ProbeSpec;
  writer: AgentWriter;
  // optional one-line hint shown after a successful write
  postWriteNote?: string;
}

// -- Platform-specific paths -----------------------------------

// zed stores its settings under different home-relative paths per OS;
// resolved once at module load
const ZED_DIR = process.platform === "darwin" ? "Library/Application Support/Zed" : ".config/zed";

// -- Registry -----------------------------------

export const AGENTS: Record<AgentType, AgentConfig> = {
  cursor: {
    name: "cursor",
    displayName: "Cursor",
    probe: { kind: "project-dir", path: ".cursor" },
    writer: {
      kind: "file",
      configPath: ".cursor/mcp.json",
      buildServerEntry: () => ({
        url: "https://mcp.docfork.com/mcp",
      }),
      mergeConfig: (existing, entry) => {
        const mcpServers = (existing.mcpServers ?? {}) as Record<string, unknown>;
        mcpServers["docfork"] = entry;
        return { ...existing, mcpServers };
      },
    },
  },
  "claude-code": {
    name: "claude-code",
    displayName: "Claude Code",
    probe: { kind: "project-dir", path: ".claude" },
    writer: {
      kind: "file",
      configPath: ".mcp.json",
      buildServerEntry: () => ({
        type: "http",
        url: "https://mcp.docfork.com/mcp",
      }),
      mergeConfig: (existing, entry) => {
        const mcpServers = (existing.mcpServers ?? {}) as Record<string, unknown>;
        mcpServers["docfork"] = entry;
        return { ...existing, mcpServers };
      },
    },
  },
  opencode: {
    name: "opencode",
    displayName: "OpenCode",
    probe: { kind: "project-dir", path: ".opencode" },
    writer: {
      kind: "file",
      configPath: "opencode.json",
      buildServerEntry: () => ({
        type: "remote",
        url: "https://mcp.docfork.com/mcp",
        enabled: true,
      }),
      mergeConfig: (existing, entry) => {
        const mcp = (existing.mcp ?? {}) as Record<string, unknown>;
        mcp["docfork"] = entry;
        return { ...existing, mcp };
      },
    },
  },
  codex: {
    name: "codex",
    displayName: "OpenAI Codex",
    probe: { kind: "user-dir", path: ".codex" },
    postWriteNote: "Run `codex mcp login docfork` to complete OAuth.",
    writer: {
      kind: "file",
      configPath: ".codex/config.toml",
      format: "toml",
      buildServerEntry: () => ({
        url: "https://mcp.docfork.com/mcp",
      }),
      mergeConfig: (existing, entry) => {
        const mcpServers = (existing.mcp_servers ?? {}) as Record<string, unknown>;
        mcpServers["docfork"] = entry;
        return { ...existing, mcp_servers: mcpServers };
      },
    },
  },
  vscode: {
    name: "vscode",
    displayName: "VS Code",
    probe: { kind: "project-dir", path: ".vscode" },
    writer: {
      kind: "file",
      configPath: ".vscode/mcp.json",
      buildServerEntry: () => ({
        type: "http",
        url: "https://mcp.docfork.com/mcp",
      }),
      mergeConfig: (existing, entry) => {
        const servers = (existing.servers ?? {}) as Record<string, unknown>;
        servers["docfork"] = entry;
        return { ...existing, servers };
      },
    },
  },
  windsurf: {
    name: "windsurf",
    displayName: "Windsurf",
    probe: { kind: "user-dir", path: ".codeium/windsurf" },
    writer: {
      kind: "file",
      configPath: ".codeium/windsurf/mcp_config.json",
      // windsurf uses serverUrl (not url); docs say OAuth is supported per transport
      buildServerEntry: () => ({
        serverUrl: "https://mcp.docfork.com/mcp",
      }),
      mergeConfig: (existing, entry) => {
        const mcpServers = (existing.mcpServers ?? {}) as Record<string, unknown>;
        mcpServers["docfork"] = entry;
        return { ...existing, mcpServers };
      },
    },
  },
  amp: {
    name: "amp",
    displayName: "Amp",
    probe: { kind: "binary", name: "amp" },
    // per docs, amp auto-starts OAuth on first connect when no headers are configured
    writer: {
      kind: "shell",
      bin: "amp",
      args: ["mcp", "add", "docfork", "https://mcp.docfork.com/mcp"],
    },
  },
  factory: {
    name: "factory",
    displayName: "Factory",
    probe: { kind: "binary", name: "droid" },
    postWriteNote: "Run `droid` and use /mcp to complete OAuth.",
    writer: {
      kind: "shell",
      bin: "droid",
      args: ["mcp", "add", "docfork", "https://mcp.docfork.com/mcp", "--type", "http"],
    },
  },
  zed: {
    name: "zed",
    displayName: "Zed",
    probe: { kind: "user-dir", path: ZED_DIR },
    writer: {
      kind: "file",
      configPath: `${ZED_DIR}/settings.json`,
      // url-only (no Authorization header) triggers Zed's standard MCP OAuth prompt per their docs
      buildServerEntry: () => ({
        url: "https://mcp.docfork.com/mcp",
      }),
      mergeConfig: (existing, entry) => {
        const contextServers = (existing.context_servers ?? {}) as Record<string, unknown>;
        contextServers["docfork"] = entry;
        return { ...existing, context_servers: contextServers };
      },
    },
  },
};

// -- Detection -----------------------------------

async function isOnPath(name: string, pathEnv: string | undefined): Promise<boolean> {
  if (!pathEnv) return false;
  const candidates = process.platform === "win32" ? [name, `${name}.exe`, `${name}.cmd`] : [name];
  for (const dir of pathEnv.split(delimiter).filter(Boolean)) {
    for (const cand of candidates) {
      try {
        await access(join(dir, cand), constants.X_OK);
        return true;
      } catch {
        // not in this dir
      }
    }
  }
  return false;
}

async function probeMatches(
  probe: ProbeSpec,
  cwd: string,
  home: string,
  pathEnv: string | undefined
): Promise<boolean> {
  if (probe.kind === "binary") return isOnPath(probe.name, pathEnv);
  const root = probe.kind === "project-dir" ? cwd : home;
  try {
    await access(join(root, probe.path), constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function detectedConfigPath(agent: AgentConfig, cwd: string, home: string): string {
  if (agent.writer.kind === "shell") {
    return [agent.writer.bin, ...agent.writer.args].join(" ");
  }
  const root = agent.probe.kind === "project-dir" ? cwd : home;
  return join(root, agent.writer.configPath);
}

export async function detectAgents(
  cwd?: string,
  home?: string,
  pathEnv?: string
): Promise<DetectedAgent[]> {
  const dir = cwd ?? process.cwd();
  const userHome = home ?? homedir();
  const path = pathEnv ?? process.env.PATH;
  const detected: DetectedAgent[] = [];

  await Promise.all(
    Object.values(AGENTS).map(async (agent) => {
      if (await probeMatches(agent.probe, dir, userHome, path)) {
        detected.push({
          name: agent.name,
          displayName: agent.displayName,
          configPath: detectedConfigPath(agent, dir, userHome),
        });
      }
    })
  );

  return detected.sort((a, b) => a.name.localeCompare(b.name));
}

export function getAgentDefinition(name: string): AgentConfig | undefined {
  return (AGENTS as Record<string, AgentConfig | undefined>)[name];
}

// comma-joined display names — used in "No IDE agents detected (...)" messages
export function agentDisplayList(): string {
  return Object.values(AGENTS)
    .map((a) => a.displayName)
    .join(", ");
}

// -- Config writing -----------------------------------

async function writeFileWriter(
  agent: DetectedAgent,
  writer: Extract<AgentWriter, { kind: "file" }>
): Promise<void> {
  const serverEntry = writer.buildServerEntry();
  const format = writer.format ?? "json";

  // read existing config; back it up before modifying
  let existing: Record<string, unknown> = {};
  try {
    const raw = await readFile(agent.configPath, "utf-8");
    existing =
      format === "toml"
        ? (parseToml(raw) as Record<string, unknown>)
        : (JSON.parse(raw) as Record<string, unknown>);
    await copyFile(agent.configPath, agent.configPath + ".bak");
  } catch {
    // file doesn't exist, start fresh
  }

  const updated = writer.mergeConfig(existing, serverEntry);

  await mkdir(dirname(agent.configPath), { recursive: true });
  const serialized =
    format === "toml" ? stringifyToml(updated) + "\n" : JSON.stringify(updated, null, 2) + "\n";
  await writeFile(agent.configPath, serialized);
}

export async function writeMcpConfigForAgent(agent: DetectedAgent): Promise<void> {
  const def = AGENTS[agent.name];
  if (def.writer.kind === "file") {
    await writeFileWriter(agent, def.writer);
    return;
  }
  // shell: let the agent's CLI own its config (handles its own merge semantics)
  await execFileAsync(def.writer.bin, def.writer.args);
}
