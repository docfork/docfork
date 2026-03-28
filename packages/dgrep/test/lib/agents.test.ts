import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { join } from "node:path";
import { mkdtemp, rm, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { detectAgents } from "../../src/lib/agents.js";

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

  it("detects multiple agents", async () => {
    await mkdir(join(tempDir, ".cursor"));
    await mkdir(join(tempDir, ".claude"));
    const agents = await detectAgents(tempDir);
    expect(agents.length).toBe(2);
  });

  it("returns empty when no agents found", async () => {
    const agents = await detectAgents(tempDir);
    expect(agents).toEqual([]);
  });

  it("includes correct config paths", async () => {
    await mkdir(join(tempDir, ".cursor"));
    const agents = await detectAgents(tempDir);
    const cursor = agents.find((a) => a.name === "cursor");
    expect(cursor?.configPath).toBe(join(tempDir, ".cursor", "mcp.json"));
  });
});
