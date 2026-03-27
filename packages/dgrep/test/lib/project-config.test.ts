import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { join } from "node:path";
import { mkdtemp, rm, mkdir, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import {
  loadProjectConfig,
  saveProjectConfig,
  addLibraryToProject,
  findProjectRoot,
} from "../../src/lib/project-config.js";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "dgrep-project-test-"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("findProjectRoot", () => {
  it("finds .dgrep/ directory in current dir", async () => {
    await mkdir(join(tempDir, ".dgrep"), { recursive: true });
    const root = await findProjectRoot(tempDir);
    expect(root).toBe(tempDir);
  });

  it("walks up to find .dgrep/ in parent dir", async () => {
    const subdir = join(tempDir, "src", "lib");
    await mkdir(subdir, { recursive: true });
    await mkdir(join(tempDir, ".dgrep"), { recursive: true });
    const root = await findProjectRoot(subdir);
    expect(root).toBe(tempDir);
  });

  it("falls back to package.json location", async () => {
    await writeFile(join(tempDir, "package.json"), "{}");
    const root = await findProjectRoot(tempDir);
    expect(root).toBe(tempDir);
  });

  it("returns null when nothing found", async () => {
    const isolated = await mkdtemp(join(tmpdir(), "dgrep-empty-"));
    const root = await findProjectRoot(isolated);
    expect(root).toBeNull();
    await rm(isolated, { recursive: true, force: true });
  });
});

describe("loadProjectConfig", () => {
  it("returns null when no .dgrep/config.json", async () => {
    const config = await loadProjectConfig(tempDir);
    expect(config).toBeNull();
  });

  it("reads libraries from .dgrep/config.json", async () => {
    await mkdir(join(tempDir, ".dgrep"));
    await writeFile(
      join(tempDir, ".dgrep", "config.json"),
      JSON.stringify({ libraries: ["react", "next.js"] }),
    );
    const config = await loadProjectConfig(tempDir);
    expect(config?.libraries).toEqual(["react", "next.js"]);
  });

  it("reads cabinet from config", async () => {
    await mkdir(join(tempDir, ".dgrep"));
    await writeFile(
      join(tempDir, ".dgrep", "config.json"),
      JSON.stringify({ cabinet: "acme-frontend" }),
    );
    const config = await loadProjectConfig(tempDir);
    expect(config?.cabinet).toBe("acme-frontend");
  });
});

describe("saveProjectConfig", () => {
  it("creates .dgrep/ dir and writes config.json", async () => {
    await saveProjectConfig(tempDir, { libraries: ["react"] });
    const content = JSON.parse(await readFile(join(tempDir, ".dgrep", "config.json"), "utf-8"));
    expect(content.libraries).toEqual(["react"]);
  });

  it("overwrites existing config", async () => {
    await mkdir(join(tempDir, ".dgrep"));
    await writeFile(
      join(tempDir, ".dgrep", "config.json"),
      JSON.stringify({ libraries: ["old"] }),
    );
    await saveProjectConfig(tempDir, { libraries: ["new"] });
    const content = JSON.parse(await readFile(join(tempDir, ".dgrep", "config.json"), "utf-8"));
    expect(content.libraries).toEqual(["new"]);
  });
});

describe("addLibraryToProject", () => {
  it("adds library to empty config", async () => {
    await addLibraryToProject(tempDir, "react");
    const content = JSON.parse(await readFile(join(tempDir, ".dgrep", "config.json"), "utf-8"));
    expect(content.libraries).toEqual(["react"]);
  });

  it("appends and sorts", async () => {
    await mkdir(join(tempDir, ".dgrep"));
    await writeFile(
      join(tempDir, ".dgrep", "config.json"),
      JSON.stringify({ libraries: ["react"] }),
    );
    await addLibraryToProject(tempDir, "express");
    const content = JSON.parse(await readFile(join(tempDir, ".dgrep", "config.json"), "utf-8"));
    expect(content.libraries).toEqual(["express", "react"]);
  });

  it("deduplicates", async () => {
    await mkdir(join(tempDir, ".dgrep"));
    await writeFile(
      join(tempDir, ".dgrep", "config.json"),
      JSON.stringify({ libraries: ["react"] }),
    );
    await addLibraryToProject(tempDir, "react");
    const content = JSON.parse(await readFile(join(tempDir, ".dgrep", "config.json"), "utf-8"));
    expect(content.libraries).toEqual(["react"]);
  });

  it("preserves cabinet field", async () => {
    await mkdir(join(tempDir, ".dgrep"));
    await writeFile(
      join(tempDir, ".dgrep", "config.json"),
      JSON.stringify({ cabinet: "acme", libraries: ["react"] }),
    );
    await addLibraryToProject(tempDir, "express");
    const content = JSON.parse(await readFile(join(tempDir, ".dgrep", "config.json"), "utf-8"));
    expect(content.cabinet).toBe("acme");
    expect(content.libraries).toEqual(["express", "react"]);
  });
});
