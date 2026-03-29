import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { join } from "node:path";
import { mkdtemp, rm, mkdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { detectAgents, writeMcpConfigForAgent, getAgentDefinition } from "../../src/lib/agents.js";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "dgrep-agents-test-"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("detectAgents", () => {
  it("detects Cursor when .cursor/ exists", async () => {
    await mkdir(join(tempDir, ".cursor"));
    const agents = await detectAgents(tempDir);
    expect(agents.some((a) => a.name === "cursor")).toBe(true);
  });

  it("detects Claude Code when .claude/ exists", async () => {
    await mkdir(join(tempDir, ".claude"));
    const agents = await detectAgents(tempDir);
    expect(agents.some((a) => a.name === "claude-code")).toBe(true);
  });

  it("detects OpenCode when .opencode/ exists", async () => {
    await mkdir(join(tempDir, ".opencode"));
    const agents = await detectAgents(tempDir);
    expect(agents.some((a) => a.name === "opencode")).toBe(true);
  });

  it("detects multiple agents", async () => {
    await mkdir(join(tempDir, ".cursor"));
    await mkdir(join(tempDir, ".claude"));
    await mkdir(join(tempDir, ".opencode"));
    const agents = await detectAgents(tempDir);
    expect(agents.length).toBe(3);
  });

  it("returns empty when no agents found", async () => {
    const agents = await detectAgents(tempDir);
    expect(agents).toEqual([]);
  });

  it("returns correct config paths", async () => {
    await mkdir(join(tempDir, ".cursor"));
    await mkdir(join(tempDir, ".claude"));
    await mkdir(join(tempDir, ".opencode"));
    const agents = await detectAgents(tempDir);

    const cursor = agents.find((a) => a.name === "cursor");
    expect(cursor?.configPath).toBe(join(tempDir, ".cursor", "mcp.json"));

    const claude = agents.find((a) => a.name === "claude-code");
    expect(claude?.configPath).toBe(join(tempDir, ".mcp.json"));

    const opencode = agents.find((a) => a.name === "opencode");
    expect(opencode?.configPath).toBe(join(tempDir, "opencode.json"));
  });
});

describe("writeMcpConfigForAgent", () => {
  it("writes Cursor config with url + headers under mcpServers", async () => {
    await mkdir(join(tempDir, ".cursor"));
    const agent = { name: "cursor", displayName: "Cursor", configPath: join(tempDir, ".cursor", "mcp.json") };

    await writeMcpConfigForAgent(agent, "docf_test123");

    const config = JSON.parse(await readFile(join(tempDir, ".cursor", "mcp.json"), "utf-8"));
    expect(config.mcpServers.docfork.url).toBe("https://mcp.docfork.com/mcp");
    expect(config.mcpServers.docfork.headers.DOCFORK_API_KEY).toBe("docf_test123");
  });

  it("writes Claude Code config with http type under mcpServers", async () => {
    const agent = { name: "claude-code", displayName: "Claude Code", configPath: join(tempDir, ".mcp.json") };

    await writeMcpConfigForAgent(agent, "docf_test123");

    const config = JSON.parse(await readFile(join(tempDir, ".mcp.json"), "utf-8"));
    expect(config.mcpServers.docfork.type).toBe("http");
    expect(config.mcpServers.docfork.url).toBe("https://mcp.docfork.com/mcp");
  });

  it("writes OpenCode config with remote type under mcp key", async () => {
    const agent = { name: "opencode", displayName: "OpenCode", configPath: join(tempDir, "opencode.json") };

    await writeMcpConfigForAgent(agent, "docf_test123");

    const config = JSON.parse(await readFile(join(tempDir, "opencode.json"), "utf-8"));
    expect(config.mcp.docfork.type).toBe("remote");
    expect(config.mcp.docfork.url).toBe("https://mcp.docfork.com/mcp");
    expect(config.mcp.docfork.enabled).toBe(true);
  });

  it("merges with existing config without overwriting", async () => {
    await mkdir(join(tempDir, ".cursor"));
    const configPath = join(tempDir, ".cursor", "mcp.json");
    const { writeFile: wf } = await import("node:fs/promises");
    await wf(configPath, JSON.stringify({ mcpServers: { "other-server": { url: "http://other" } } }));

    const agent = { name: "cursor", displayName: "Cursor", configPath };
    await writeMcpConfigForAgent(agent, "docf_test123");

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
  });

  it("returns undefined for unknown agent", () => {
    expect(getAgentDefinition("unknown")).toBeUndefined();
  });
});
