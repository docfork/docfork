import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { join } from "node:path";
import { mkdtemp, rm, mkdir, readFile, writeFile, chmod } from "node:fs/promises";
import { tmpdir } from "node:os";
import { parse as parseToml } from "smol-toml";
import { detectAgents, writeMcpConfigForAgent, getAgentDefinition } from "../../src/lib/agents.js";

let tempDir: string;
let tempHome: string;
let tempBin: string; // fake $PATH directory for binary probes

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "dgrep-agents-test-"));
  tempHome = await mkdtemp(join(tmpdir(), "dgrep-agents-home-"));
  tempBin = await mkdtemp(join(tmpdir(), "dgrep-agents-bin-"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
  await rm(tempHome, { recursive: true, force: true });
  await rm(tempBin, { recursive: true, force: true });
});

async function installFakeBin(name: string): Promise<void> {
  const path = join(tempBin, name);
  await writeFile(path, "#!/bin/sh\nexit 0\n");
  await chmod(path, 0o755);
}

describe("detectAgents", () => {
  it("detects Cursor when .cursor/ exists", async () => {
    await mkdir(join(tempDir, ".cursor"));
    const agents = await detectAgents(tempDir, tempHome, tempBin);
    expect(agents.some((a) => a.name === "cursor")).toBe(true);
  });

  it("detects Claude Code when .claude/ exists", async () => {
    await mkdir(join(tempDir, ".claude"));
    const agents = await detectAgents(tempDir, tempHome, tempBin);
    expect(agents.some((a) => a.name === "claude-code")).toBe(true);
  });

  it("detects OpenCode when .opencode/ exists", async () => {
    await mkdir(join(tempDir, ".opencode"));
    const agents = await detectAgents(tempDir, tempHome, tempBin);
    expect(agents.some((a) => a.name === "opencode")).toBe(true);
  });

  it("detects VS Code when .vscode/ exists", async () => {
    await mkdir(join(tempDir, ".vscode"));
    const agents = await detectAgents(tempDir, tempHome, tempBin);
    expect(agents.some((a) => a.name === "vscode")).toBe(true);
    const vscode = agents.find((a) => a.name === "vscode");
    expect(vscode?.configPath).toBe(join(tempDir, ".vscode", "mcp.json"));
  });

  it("detects multiple agents", async () => {
    await mkdir(join(tempDir, ".cursor"));
    await mkdir(join(tempDir, ".claude"));
    await mkdir(join(tempDir, ".opencode"));
    const agents = await detectAgents(tempDir, tempHome, tempBin);
    expect(agents.length).toBe(3);
  });

  it("returns empty when no agents found", async () => {
    const agents = await detectAgents(tempDir, tempHome, tempBin);
    expect(agents).toEqual([]);
  });

  it("detects Amp when amp binary is on PATH", async () => {
    await installFakeBin("amp");
    const agents = await detectAgents(tempDir, tempHome, tempBin);
    expect(agents.some((a) => a.name === "amp")).toBe(true);
    const amp = agents.find((a) => a.name === "amp");
    expect(amp?.configPath).toBe("amp mcp add docfork https://mcp.docfork.com/mcp");
  });

  it("does not detect Amp when its binary is missing from PATH", async () => {
    const agents = await detectAgents(tempDir, tempHome, tempBin);
    expect(agents.some((a) => a.name === "amp")).toBe(false);
  });

  it("detects Zed when its config dir exists in home", async () => {
    const zedDir =
      process.platform === "darwin" ? "Library/Application Support/Zed" : ".config/zed";
    await mkdir(join(tempHome, zedDir), { recursive: true });
    const agents = await detectAgents(tempDir, tempHome, tempBin);
    expect(agents.some((a) => a.name === "zed")).toBe(true);
    const zed = agents.find((a) => a.name === "zed");
    expect(zed?.configPath).toBe(join(tempHome, zedDir, "settings.json"));
  });

  it("writes Zed config under context_servers", async () => {
    const zedDir =
      process.platform === "darwin" ? "Library/Application Support/Zed" : ".config/zed";
    const configPath = join(tempHome, zedDir, "settings.json");

    await writeMcpConfigForAgent({
      name: "zed",
      displayName: "Zed",
      configPath,
    });

    const config = JSON.parse(await readFile(configPath, "utf-8"));
    expect(config.context_servers.docfork.url).toBe("https://mcp.docfork.com/mcp");
    expect(config.context_servers.docfork.headers).toBeUndefined();
  });

  it("detects Factory when droid binary is on PATH", async () => {
    await installFakeBin("droid");
    const agents = await detectAgents(tempDir, tempHome, tempBin);
    expect(agents.some((a) => a.name === "factory")).toBe(true);
    const factory = agents.find((a) => a.name === "factory");
    expect(factory?.configPath).toBe(
      "droid mcp add docfork https://mcp.docfork.com/mcp --type http"
    );
  });

  it("detects Windsurf when ~/.codeium/windsurf/ exists in home", async () => {
    await mkdir(join(tempHome, ".codeium", "windsurf"), { recursive: true });
    const agents = await detectAgents(tempDir, tempHome, tempBin);
    expect(agents.some((a) => a.name === "windsurf")).toBe(true);
    const ws = agents.find((a) => a.name === "windsurf");
    expect(ws?.configPath).toBe(join(tempHome, ".codeium", "windsurf", "mcp_config.json"));
  });

  it("detects Codex when ~/.codex/ exists in home", async () => {
    await mkdir(join(tempHome, ".codex"));
    const agents = await detectAgents(tempDir, tempHome, tempBin);
    expect(agents.some((a) => a.name === "codex")).toBe(true);
    const codex = agents.find((a) => a.name === "codex");
    expect(codex?.configPath).toBe(join(tempHome, ".codex", "config.toml"));
  });

  it("returns correct config paths", async () => {
    await mkdir(join(tempDir, ".cursor"));
    await mkdir(join(tempDir, ".claude"));
    await mkdir(join(tempDir, ".opencode"));
    const agents = await detectAgents(tempDir, tempHome, tempBin);

    const cursor = agents.find((a) => a.name === "cursor");
    expect(cursor?.configPath).toBe(join(tempDir, ".cursor", "mcp.json"));

    const claude = agents.find((a) => a.name === "claude-code");
    expect(claude?.configPath).toBe(join(tempDir, ".mcp.json"));

    const opencode = agents.find((a) => a.name === "opencode");
    expect(opencode?.configPath).toBe(join(tempDir, "opencode.json"));
  });
});

describe("writeMcpConfigForAgent", () => {
  it("writes Cursor config with url-only entry under mcpServers", async () => {
    await mkdir(join(tempDir, ".cursor"));
    const agent = { name: "cursor" as const, displayName: "Cursor", configPath: join(tempDir, ".cursor", "mcp.json") };

    await writeMcpConfigForAgent(agent);

    const config = JSON.parse(await readFile(join(tempDir, ".cursor", "mcp.json"), "utf-8"));
    expect(config.mcpServers.docfork.url).toBe("https://mcp.docfork.com/mcp");
    expect(config.mcpServers.docfork.headers).toBeUndefined();
  });

  it("writes Claude Code config with http type under mcpServers", async () => {
    const agent = { name: "claude-code" as const, displayName: "Claude Code", configPath: join(tempDir, ".mcp.json") };

    await writeMcpConfigForAgent(agent);

    const config = JSON.parse(await readFile(join(tempDir, ".mcp.json"), "utf-8"));
    expect(config.mcpServers.docfork.type).toBe("http");
    expect(config.mcpServers.docfork.url).toBe("https://mcp.docfork.com/mcp");
    expect(config.mcpServers.docfork.headers).toBeUndefined();
  });

  it("writes OpenCode config with remote type under mcp key", async () => {
    const agent = { name: "opencode" as const, displayName: "OpenCode", configPath: join(tempDir, "opencode.json") };

    await writeMcpConfigForAgent(agent);

    const config = JSON.parse(await readFile(join(tempDir, "opencode.json"), "utf-8"));
    expect(config.mcp.docfork.type).toBe("remote");
    expect(config.mcp.docfork.url).toBe("https://mcp.docfork.com/mcp");
    expect(config.mcp.docfork.enabled).toBe(true);
    expect(config.mcp.docfork.headers).toBeUndefined();
  });

  it("writes Windsurf config under mcpServers with serverUrl", async () => {
    await mkdir(join(tempHome, ".codeium", "windsurf"), { recursive: true });
    const agent = {
      name: "windsurf" as const,
      displayName: "Windsurf",
      configPath: join(tempHome, ".codeium", "windsurf", "mcp_config.json"),
    };

    await writeMcpConfigForAgent(agent);

    const config = JSON.parse(await readFile(agent.configPath, "utf-8"));
    expect(config.mcpServers.docfork.serverUrl).toBe("https://mcp.docfork.com/mcp");
    expect(config.mcpServers.docfork.headers).toBeUndefined();
  });

  it("writes VS Code config under top-level servers key", async () => {
    await mkdir(join(tempDir, ".vscode"));
    const agent = {
      name: "vscode" as const,
      displayName: "VS Code",
      configPath: join(tempDir, ".vscode", "mcp.json"),
    };

    await writeMcpConfigForAgent(agent);

    const config = JSON.parse(await readFile(join(tempDir, ".vscode", "mcp.json"), "utf-8"));
    expect(config.servers.docfork.type).toBe("http");
    expect(config.servers.docfork.url).toBe("https://mcp.docfork.com/mcp");
    expect(config.servers.docfork.headers).toBeUndefined();
  });

  it("writes Codex config as TOML under [mcp_servers.docfork]", async () => {
    await mkdir(join(tempHome, ".codex"));
    const agent = {
      name: "codex" as const,
      displayName: "OpenAI Codex",
      configPath: join(tempHome, ".codex", "config.toml"),
    };

    await writeMcpConfigForAgent(agent);

    const raw = await readFile(join(tempHome, ".codex", "config.toml"), "utf-8");
    const config = parseToml(raw) as { mcp_servers: { docfork: { url: string } } };
    expect(config.mcp_servers.docfork.url).toBe("https://mcp.docfork.com/mcp");
  });

  it("preserves existing TOML tables when merging Codex config", async () => {
    await mkdir(join(tempHome, ".codex"));
    const configPath = join(tempHome, ".codex", "config.toml");
    const { writeFile: wf } = await import("node:fs/promises");
    await wf(configPath, '[mcp_servers.other]\nurl = "http://other"\n');

    const agent = {
      name: "codex" as const,
      displayName: "OpenAI Codex",
      configPath,
    };
    await writeMcpConfigForAgent(agent);

    const raw = await readFile(configPath, "utf-8");
    const config = parseToml(raw) as { mcp_servers: Record<string, { url: string }> };
    expect(config.mcp_servers.other.url).toBe("http://other");
    expect(config.mcp_servers.docfork.url).toBe("https://mcp.docfork.com/mcp");
  });

  it("merges with existing config without overwriting", async () => {
    await mkdir(join(tempDir, ".cursor"));
    const configPath = join(tempDir, ".cursor", "mcp.json");
    const { writeFile: wf } = await import("node:fs/promises");
    await wf(configPath, JSON.stringify({ mcpServers: { "other-server": { url: "http://other" } } }));

    const agent = { name: "cursor" as const, displayName: "Cursor", configPath };
    await writeMcpConfigForAgent(agent);

    const config = JSON.parse(await readFile(configPath, "utf-8"));
    expect(config.mcpServers["other-server"]).toBeDefined();
    expect(config.mcpServers.docfork).toBeDefined();
  });
});

describe("getAgentDefinition", () => {
  it("returns definition for known agents", () => {
    expect(getAgentDefinition("cursor")).toBeDefined();
    expect(getAgentDefinition("claude-code")).toBeDefined();
    expect(getAgentDefinition("opencode")).toBeDefined();
    expect(getAgentDefinition("codex")).toBeDefined();
    expect(getAgentDefinition("vscode")).toBeDefined();
    expect(getAgentDefinition("windsurf")).toBeDefined();
    expect(getAgentDefinition("amp")).toBeDefined();
    expect(getAgentDefinition("factory")).toBeDefined();
    expect(getAgentDefinition("zed")).toBeDefined();
  });

  it("returns undefined for unknown agent", () => {
    expect(getAgentDefinition("unknown")).toBeUndefined();
  });
});
