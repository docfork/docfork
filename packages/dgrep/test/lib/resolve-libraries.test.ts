import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { join } from "node:path";
import { mkdtemp, rm, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolveLibraries } from "../../src/lib/resolve-libraries.js";

const lib = (pkg: string, id?: string) => ({ package: pkg, identifier: id ?? pkg });

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "dgrep-resolve-test-"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("resolveLibraries", () => {
  it("returns flag libraries with source 'flag'", async () => {
    const result = await resolveLibraries({ libraries: ["react", "nextjs"], cwd: tempDir });
    expect(result.libraries).toEqual(["react", "nextjs"]);
    expect(result.source).toBe("flag");
  });

  it("returns project config libraries with source 'project'", async () => {
    await mkdir(join(tempDir, ".dgrep"));
    await writeFile(
      join(tempDir, ".dgrep", "config.json"),
      JSON.stringify({ libraries: [lib("react", "facebook/react"), lib("typescript")] }),
    );

    const result = await resolveLibraries({ cwd: tempDir });
    expect(result.libraries).toEqual(["facebook/react", "typescript"]);
    expect(result.source).toBe("project");
  });

  it("detects from package.json with source 'detected'", async () => {
    await writeFile(
      join(tempDir, "package.json"),
      JSON.stringify({
        dependencies: { react: "^19.0.0", "next": "^15.0.0" },
        devDependencies: { typescript: "^5.0.0", vitest: "^3.0.0" },
      }),
    );

    const result = await resolveLibraries({ cwd: tempDir });
    expect(result.source).toBe("detected");
    expect(result.libraries.length).toBeGreaterThan(0);
  });

  it("returns empty with source 'catalog' when nothing found", async () => {
    const isolated = await mkdtemp(join(tmpdir(), "dgrep-empty-"));
    const result = await resolveLibraries({ cwd: isolated });
    expect(result.libraries).toEqual([]);
    expect(result.source).toBe("catalog");
    await rm(isolated, { recursive: true, force: true });
  });

  it("flag overrides project config", async () => {
    await mkdir(join(tempDir, ".dgrep"));
    await writeFile(
      join(tempDir, ".dgrep", "config.json"),
      JSON.stringify({ libraries: [lib("react", "facebook/react")] }),
    );

    const result = await resolveLibraries({ libraries: ["express"], cwd: tempDir });
    expect(result.libraries).toEqual(["express"]);
    expect(result.source).toBe("flag");
  });

  it("deduplicates flag libraries", async () => {
    const result = await resolveLibraries({
      libraries: ["react", "react", "nextjs"],
      cwd: tempDir,
    });
    expect(result.libraries).toEqual(["react", "nextjs"]);
  });
});
