import { findProjectRoot, loadProjectConfig, getLibraryIdentifiers } from "./project-config.js";
import { detectProjectDeps } from "./detect-deps.js";

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

  // Tier 2: .dgrep/config.json — extract identifiers (handles both old and new format)
  const projectRoot = await findProjectRoot(cwd);
  if (projectRoot) {
    const config = await loadProjectConfig(projectRoot);
    if (config?.libraries && config.libraries.length > 0) {
      return {
        libraries: getLibraryIdentifiers(config),
        source: "project",
      };
    }
  }

  // Tier 3: package.json auto-detect (with monorepo support + dep-filter)
  const detected = await detectProjectDeps(cwd);
  if (detected.deps.length > 0) {
    return {
      libraries: detected.deps.slice(0, 10),
      source: "detected",
    };
  }

  // Tier 4: catalog fallback (empty = caller handles catalog search)
  return {
    libraries: [],
    source: "catalog",
  };
}
