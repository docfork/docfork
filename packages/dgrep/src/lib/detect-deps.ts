import { readFile, readdir, access } from "node:fs/promises";
import { join } from "node:path";
import { constants } from "node:fs";
import { isDevTool } from "./dep-filter.js";

export interface DetectedDeps {
  deps: string[];
  root: string;
  isMonorepo: boolean;
  packageCount: number;
  totalBeforeFilter: number;
}

export async function detectProjectDeps(cwd: string): Promise<DetectedDeps> {
  // Check if we're at a monorepo root
  const monorepoGlobs = await detectMonorepoGlobs(cwd);

  if (monorepoGlobs) {
    return aggregateWorkspaceDeps(cwd, monorepoGlobs);
  }

  // Single package
  const deps = await readPackageDeps(cwd);
  const filtered = deps.filter((d) => !isDevTool(d));

  return {
    deps: [...new Set(filtered)].sort(),
    root: cwd,
    isMonorepo: false,
    packageCount: 1,
    totalBeforeFilter: deps.length,
  };
}

// -- Monorepo detection -----------------------------------

async function detectMonorepoGlobs(dir: string): Promise<string[] | null> {
  // Check pnpm-workspace.yaml
  try {
    const raw = await readFile(join(dir, "pnpm-workspace.yaml"), "utf-8");
    const match = raw.match(/packages:\s*\n((?:\s*-\s*.+\n?)+)/);
    if (match) {
      const globs = match[1]
        .split("\n")
        .map((l) => l.replace(/^\s*-\s*["']?/, "").replace(/["']?\s*$/, ""))
        .filter(Boolean);
      return globs;
    }
  } catch {
    // no pnpm-workspace.yaml
  }

  // Check package.json workspaces field
  try {
    const raw = await readFile(join(dir, "package.json"), "utf-8");
    const pkg = JSON.parse(raw) as { workspaces?: string[] | { packages?: string[] } };
    const workspaces = Array.isArray(pkg.workspaces) ? pkg.workspaces : pkg.workspaces?.packages;
    if (workspaces && workspaces.length > 0) {
      return workspaces;
    }
  } catch {
    // no package.json
  }

  return null;
}

async function aggregateWorkspaceDeps(root: string, globs: string[]): Promise<DetectedDeps> {
  const allDeps: string[] = [];
  let packageCount = 0;

  for (const glob of globs) {
    // Simple glob expansion: "packages/*" → list dirs in packages/
    const baseDir = glob.replace(/\/?\*.*$/, "");
    const parentDir = join(root, baseDir);

    try {
      const entries = await readdir(parentDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        const pkgDir = join(parentDir, entry.name);
        const deps = await readPackageDeps(pkgDir);
        if (deps.length > 0) {
          allDeps.push(...deps);
          packageCount++;
        }
      }
    } catch {
      // directory doesn't exist
    }
  }

  const totalBeforeFilter = new Set(allDeps).size;
  const filtered = allDeps.filter((d) => !isDevTool(d));

  return {
    deps: [...new Set(filtered)].sort(),
    root,
    isMonorepo: true,
    packageCount,
    totalBeforeFilter,
  };
}

// -- Package reading -----------------------------------

async function readPackageDeps(dir: string): Promise<string[]> {
  try {
    await access(join(dir, "package.json"), constants.F_OK);
    const raw = await readFile(join(dir, "package.json"), "utf-8");
    const pkg = JSON.parse(raw) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    return [...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})];
  } catch {
    return [];
  }
}
