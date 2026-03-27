import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { findProjectRoot, loadProjectConfig } from "./project-config.js";

export type LibrarySource = "flag" | "project" | "detected" | "catalog";

export interface ResolvedLibraries {
  libraries: string[];
  source: LibrarySource;
}

export interface ResolveOptions {
  libraries?: string[];
  cwd?: string;
}

export async function resolveLibraries(options: ResolveOptions = {}): Promise<ResolvedLibraries> {
  const cwd = options.cwd ?? process.cwd();

  // Tier 1: explicit --library flag
  if (options.libraries && options.libraries.length > 0) {
    return {
      libraries: [...new Set(options.libraries)],
      source: "flag",
    };
  }

  // Tier 2: .dgrep/config.json
  const projectRoot = await findProjectRoot(cwd);
  if (projectRoot) {
    const config = await loadProjectConfig(projectRoot);
    if (config?.libraries && config.libraries.length > 0) {
      return {
        libraries: config.libraries,
        source: "project",
      };
    }
  }

  // Tier 3: package.json auto-detect
  const detected = await detectFromPackageJson(cwd);
  if (detected.length > 0) {
    return {
      libraries: detected,
      source: "detected",
    };
  }

  // Tier 4: catalog fallback (empty = caller handles catalog search)
  return {
    libraries: [],
    source: "catalog",
  };
}

async function detectFromPackageJson(cwd: string): Promise<string[]> {
  try {
    const raw = await readFile(join(cwd, "package.json"), "utf-8");
    const pkg = JSON.parse(raw) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    const allDeps = [
      ...Object.keys(pkg.dependencies ?? {}),
      ...Object.keys(pkg.devDependencies ?? {}),
    ];

    // Filter out common non-documentation deps (build tools, types, etc.)
    const filtered = allDeps.filter(
      (dep) =>
        !dep.startsWith("@types/") &&
        !dep.startsWith("eslint") &&
        !dep.startsWith("prettier") &&
        ![
          "typescript",
          "vitest",
          "jest",
          "mocha",
          "msw",
          "obuild",
          "turbo",
          "concurrently",
        ].includes(dep)
    );

    return [...new Set(filtered)].slice(0, 10);
  } catch {
    return [];
  }
}
