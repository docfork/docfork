import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { join } from "node:path";
import { mkdtemp, rm, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { detectProjectDeps } from "../../src/lib/detect-deps.js";

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "dgrep-detect-deps-test-"));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe("detectProjectDeps", () => {
  it("detects deps from single package.json", async () => {
    await writeFile(
      join(tempDir, "package.json"),
      JSON.stringify({
        dependencies: { react: "^19.0.0", next: "^15.0.0" },
        devDependencies: { typescript: "^5.0.0", "@types/react": "^19.0.0" },
      }),
    );

    const result = await detectProjectDeps(tempDir);
    expect(result.deps).toContain("react");
    expect(result.deps).toContain("next");
    expect(result.deps).not.toContain("typescript");
    expect(result.deps).not.toContain("@types/react");
    expect(result.isMonorepo).toBe(false);
  });

  it("detects pnpm monorepo and aggregates workspace deps", async () => {
    // Root
    await writeFile(join(tempDir, "package.json"), JSON.stringify({ name: "root" }));
    await writeFile(join(tempDir, "pnpm-workspace.yaml"), 'packages:\n  - "packages/*"\n');

    // Package A
    await mkdir(join(tempDir, "packages", "app"), { recursive: true });
    await writeFile(
      join(tempDir, "packages", "app", "package.json"),
      JSON.stringify({ dependencies: { react: "^19", next: "^15" } }),
    );

    // Package B
    await mkdir(join(tempDir, "packages", "lib"), { recursive: true });
    await writeFile(
      join(tempDir, "packages", "lib", "package.json"),
      JSON.stringify({ dependencies: { zod: "^3", express: "^4" } }),
    );

    const result = await detectProjectDeps(tempDir);
    expect(result.isMonorepo).toBe(true);
    expect(result.packageCount).toBe(2);
    expect(result.deps).toContain("react");
    expect(result.deps).toContain("next");
    expect(result.deps).toContain("zod");
    expect(result.deps).toContain("express");
    expect(result.root).toBe(tempDir);
  });

  it("detects npm/yarn workspaces from package.json", async () => {
    await writeFile(
      join(tempDir, "package.json"),
      JSON.stringify({
        workspaces: ["packages/*"],
        devDependencies: { turbo: "^2" },
      }),
    );

    await mkdir(join(tempDir, "packages", "web"), { recursive: true });
    await writeFile(
      join(tempDir, "packages", "web", "package.json"),
      JSON.stringify({ dependencies: { react: "^19" } }),
    );

    const result = await detectProjectDeps(tempDir);
    expect(result.isMonorepo).toBe(true);
    expect(result.deps).toContain("react");
    expect(result.deps).not.toContain("turbo");
  });

  it("in subpackage, reads that package only", async () => {
    // Root with workspace
    await writeFile(join(tempDir, "package.json"), JSON.stringify({ name: "root" }));
    await writeFile(join(tempDir, "pnpm-workspace.yaml"), 'packages:\n  - "packages/*"\n');

    // Package A (react)
    const pkgA = join(tempDir, "packages", "app");
    await mkdir(pkgA, { recursive: true });
    await writeFile(
      join(pkgA, "package.json"),
      JSON.stringify({ dependencies: { react: "^19" } }),
    );

    // Package B (express)
    const pkgB = join(tempDir, "packages", "api");
    await mkdir(pkgB, { recursive: true });
    await writeFile(
      join(pkgB, "package.json"),
      JSON.stringify({ dependencies: { express: "^4" } }),
    );

    // Detect from package B's directory
    const result = await detectProjectDeps(pkgB);
    expect(result.deps).toContain("express");
    expect(result.deps).not.toContain("react");
    expect(result.isMonorepo).toBe(false);
  });

  it("deduplicates across packages", async () => {
    await writeFile(join(tempDir, "package.json"), JSON.stringify({ name: "root" }));
    await writeFile(join(tempDir, "pnpm-workspace.yaml"), 'packages:\n  - "packages/*"\n');

    await mkdir(join(tempDir, "packages", "a"), { recursive: true });
    await writeFile(
      join(tempDir, "packages", "a", "package.json"),
      JSON.stringify({ dependencies: { react: "^19", zod: "^3" } }),
    );

    await mkdir(join(tempDir, "packages", "b"), { recursive: true });
    await writeFile(
      join(tempDir, "packages", "b", "package.json"),
      JSON.stringify({ dependencies: { react: "^19", express: "^4" } }),
    );

    const result = await detectProjectDeps(tempDir);
    const reactCount = result.deps.filter((d) => d === "react").length;
    expect(reactCount).toBe(1);
  });

  it("returns sorted deps", async () => {
    await writeFile(
      join(tempDir, "package.json"),
      JSON.stringify({ dependencies: { zod: "^3", axios: "^1", react: "^19" } }),
    );

    const result = await detectProjectDeps(tempDir);
    expect(result.deps).toEqual([...result.deps].sort());
  });

  it("handles missing package.json", async () => {
    const result = await detectProjectDeps(tempDir);
    expect(result.deps).toEqual([]);
    expect(result.isMonorepo).toBe(false);
  });
});
