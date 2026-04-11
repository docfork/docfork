import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { join, dirname } from "node:path";
import { constants } from "node:fs";

export interface ResolvedLibrary {
  identifier: string;
  packages: string[];
}

export interface ProjectConfig {
  libraries?: ResolvedLibrary[];
  cabinet?: string;
}

/** extract unique searchable identifiers from config */
export function getLibraryIdentifiers(config: ProjectConfig): string[] {
  if (!config.libraries) return [];
  return config.libraries.map((lib) => lib.identifier);
}

/** extract all raw package names from config */
export function getPackageNames(config: ProjectConfig): string[] {
  if (!config.libraries) return [];
  return config.libraries.flatMap((lib) => lib.packages);
}

const CONFIG_DIR = ".dgrep";
const CONFIG_FILE = "config.json";

export async function findProjectRoot(startDir: string): Promise<string | null> {
  let dir = startDir;
  const root = dirname(dir) === dir ? dir : undefined;

  while (true) {
    // Check for .dgrep/ directory
    try {
      await access(join(dir, CONFIG_DIR), constants.F_OK);
      return dir;
    } catch {
      // not found, continue
    }

    // Check for package.json as fallback root marker
    try {
      await access(join(dir, "package.json"), constants.F_OK);
      return dir;
    } catch {
      // not found, continue
    }

    const parent = dirname(dir);
    if (parent === dir || parent === root) return null;
    dir = parent;
  }
}

export async function loadProjectConfig(projectRoot: string): Promise<ProjectConfig | null> {
  try {
    const raw = await readFile(join(projectRoot, CONFIG_DIR, CONFIG_FILE), "utf-8");
    return JSON.parse(raw) as ProjectConfig;
  } catch {
    return null;
  }
}

const GITIGNORE_CONTENT = "stats.json\n.cache/\n";

export async function saveProjectConfig(projectRoot: string, config: ProjectConfig): Promise<void> {
  const dir = join(projectRoot, CONFIG_DIR);
  try {
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, CONFIG_FILE), JSON.stringify(config, null, 2) + "\n");
    // ensure .gitignore exists for per-developer files
    const gitignorePath = join(dir, ".gitignore");
    try {
      await access(gitignorePath, constants.F_OK);
    } catch {
      await writeFile(gitignorePath, GITIGNORE_CONTENT);
    }
  } catch (error) {
    throw new Error(
      `Failed to write ${CONFIG_DIR}/${CONFIG_FILE}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function addLibraryToProject(
  projectRoot: string,
  library: string | { identifier: string; package?: string }
): Promise<boolean> {
  const config = (await loadProjectConfig(projectRoot)) ?? {};
  const libraries = config.libraries ?? [];

  const identifier = typeof library === "string" ? library : library.identifier;
  const pkg = typeof library === "string" ? library : library.package;

  const existing = libraries.find((l) => l.identifier === identifier);
  if (existing) {
    // merge package into existing entry if it's a real package name (not the identifier itself)
    if (pkg && pkg !== identifier && !existing.packages.includes(pkg)) {
      existing.packages = [...existing.packages, pkg].sort();
      await saveProjectConfig(projectRoot, { ...config, libraries });
    }
    return false; // identifier already tracked
  }

  const entry: ResolvedLibrary = {
    identifier,
    packages: pkg ? [pkg] : [],
  };

  const updated = [...libraries, entry].sort((a, b) => a.identifier.localeCompare(b.identifier));
  await saveProjectConfig(projectRoot, { ...config, libraries: updated });
  return true;
}
